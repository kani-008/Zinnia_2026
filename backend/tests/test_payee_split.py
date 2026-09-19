"""
The two-account fee split: does the right participant pay the right bank?

Run it directly - there is no pytest in this project and no CI:

    python backend/tests/test_payee_split.py

Bare asserts and a main(), matching backend/test_acceptance_suite.py. Nothing
here touches the database or the network: the account is chosen and read back
entirely inside the signed token, and payment_status answers a pending token
without a single query, which is exactly what makes this testable at all.

What is actually at stake
-------------------------
Getting this wrong does not raise. It shows a participant a QR for one bank,
records the payment against the other, and the treasurer reconciles a UTR
against a statement it will never appear in. Every check below exists because
some plausible implementation of this feature fails it silently.
"""

import os
import sys

# Before any backend import. pending_registration raises at import time without
# a signing key, and it is the one module that will not quietly pick one up from
# .env - it imports nothing but stdlib, so nothing has called load_dotenv yet.
os.environ.setdefault("AUTH_SECRET_KEY", "test-only-secret-not-a-real-key")
os.environ.setdefault("QR_SIGNING_SECRET", "test-only-qr-secret")

_BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND not in sys.path:
    sys.path.insert(0, _BACKEND)

# Imported directly, not through `services`, whose __init__ eagerly pulls in the
# mail and passport layers and would drag real configuration into a unit test.
from services import pending_registration as pending  # noqa: E402

ACCOUNT_A = "a.person@bank-one"
ACCOUNT_B = "b.person@bank-two"


def _configure(second: bool = True, phone_a: str = "", phone_b: str = "") -> None:
    """Set the account env vars. Read on every call, so no re-import is needed."""
    os.environ["TREASURER_UPI_ID"] = ACCOUNT_A
    os.environ["TREASURER_PAYEE_NAME"] = "Account One"
    os.environ["TREASURER_BANK_LABEL"] = "SBI"
    os.environ["TREASURER_PAYEE_PHONE"] = phone_a

    if second:
        os.environ["TREASURER_UPI_ID_2"] = ACCOUNT_B
        os.environ["TREASURER_PAYEE_NAME_2"] = "Account Two"
        os.environ["TREASURER_BANK_LABEL_2"] = "Union Bank"
        os.environ["TREASURER_PAYEE_PHONE_2"] = phone_b
    else:
        os.environ.pop("TREASURER_UPI_ID_2", None)


def _details(email: str) -> dict:
    return {
        "name": "Test Person",
        "email": email,
        "phone": "9000000000",
        "college": "Test College",
        "department": "CSE",
        "year": "III",
        "food_preference": "VEG",
    }


# --- the token carries it ------------------------------------------------------

def test_payee_survives_the_token_round_trip():
    _configure()
    token = pending.mint_verified(_details("round.trip@test.com"))
    payload, err = pending.open_token(token)

    assert err == "", f"a freshly minted token should open cleanly, got {err!r}"
    assert pending.is_verified_payload(payload), "must still read as verified"
    assert pending.payee_of(payload) in (pending.PAYEE_A, pending.PAYEE_B)

    account = pending.payee_for(payload)
    assert account["upi_id"] in (ACCOUNT_A, ACCOUNT_B)
    assert account["bank"] in ("SBI", "Union Bank")


def test_payee_is_outside_the_fields_whitelist():
    """
    _FIELDS is a hard 7-key projection applied to payload["d"]. An account put
    in there would be dropped with no error and a still-valid signature - the
    single most likely way to build this feature and see it do nothing.
    """
    _configure()
    payload, _ = pending.open_token(pending.mint_verified(_details("whitelist@test.com")))

    assert "p" in payload, 'the account must be a TOP-LEVEL key, alongside "v" and "x"'
    assert "p" not in payload["d"], 'it must NOT live inside "d", which _FIELDS filters'
    assert pending.payee_of(payload), "and it must be readable after the round trip"


def test_tampering_with_the_account_breaks_the_signature():
    """The account decides where money goes, so it has to be signed like the rest."""
    _configure()
    token = pending.mint_verified(_details("tamper@test.com"))
    prefix, body, sig = token.split(".", 2)

    # Flip a character in the body. Any change at all must be rejected.
    flipped = ("A" if body[10] != "A" else "B").join([body[:10], body[11:]])
    payload, err = pending.open_token(f"{prefix}.{flipped}.{sig}")

    assert payload is None, "an edited payload must not open"
    assert err in ("BAD_SIGNATURE", "MALFORMED"), f"unexpected reason {err!r}"


# --- the same person always gets the same bank ---------------------------------

def test_the_choice_is_stable_across_re_mints():
    """
    THE reason this is derived from the email rather than drawn at random.
    mint_verified() runs more than once for the same person in normal use:
    check_otp() consumes nothing, a resend re-mints, and re-submitting the
    details form mints again. A random pick would show one participant two
    different banks on two visits, and a payment made against the first QR
    would be recorded against the second account.
    """
    _configure()
    email = "stable@test.com"
    picks = set()
    for _ in range(25):
        payload, _ = pending.open_token(pending.mint_verified(_details(email)))
        picks.add(pending.payee_of(payload))

    assert len(picks) == 1, f"the same address re-minted 25 times chose {picks}"


def test_the_choice_ignores_case_and_surrounding_space():
    """The same human, typed differently, is still the same human."""
    _configure()
    variants = ["Person@Test.com", "person@test.com", "  PERSON@TEST.COM  "]
    picks = {pending.choose_payee(v) for v in variants}
    assert len(picks) == 1, f"case/space variants of one address split across {picks}"


def test_the_split_is_roughly_even():
    _configure()
    picks = [pending.choose_payee(f"participant{i}@college.edu") for i in range(600)]
    share_a = picks.count(pending.PAYEE_A)

    # Uniform in expectation. A wide band, because this asserts "not broken",
    # not "not random" - a derivation that ignored the address entirely, or
    # keyed on something near-constant, would land far outside it.
    assert 240 <= share_a <= 360, f"{share_a}/600 went to the first account"


# --- every way this can be under-configured ------------------------------------

def test_no_second_account_sends_everyone_to_the_first():
    """A supported configuration, not a broken one: the split just does not happen."""
    _configure(second=False)
    assert len(pending.payee_accounts()) == 1

    for i in range(50):
        payload, _ = pending.open_token(pending.mint_verified(_details(f"solo{i}@test.com")))
        assert pending.payee_for(payload)["upi_id"] == ACCOUNT_A


def test_a_token_minted_before_the_split_falls_back():
    """
    Verified tokens live six hours, so tokens with no account in them are still
    arriving long after the deploy. They must not render a blank payee.
    """
    _configure()
    for legacy in (None, {}, {"d": {}, "v": 1}):
        account = pending.payee_for(legacy)
        assert account["upi_id"] == ACCOUNT_A, f"{legacy!r} did not fall back"


def test_a_token_naming_a_withdrawn_account_falls_back():
    """What happens if TREASURER_UPI_ID_2 is removed while "B" tokens are live."""
    _configure()
    token = pending.mint_verified(_details("nomad@test.com"), payee=pending.PAYEE_B)
    payload, _ = pending.open_token(token)
    assert pending.payee_for(payload)["upi_id"] == ACCOUNT_B

    _configure(second=False)
    assert pending.payee_for(payload)["upi_id"] == ACCOUNT_A, "must not strand the payer"


# --- reading a stored payments row back ----------------------------------------

def test_a_stored_vpa_resolves_to_its_bank_label():
    _configure()
    assert pending.payee_by_upi(ACCOUNT_A)["bank"] == "SBI"
    assert pending.payee_by_upi(ACCOUNT_B)["bank"] == "Union Bank"
    assert pending.payee_by_upi(ACCOUNT_B.upper())["bank"] == "Union Bank", "case-insensitive"


def test_an_empty_stored_vpa_reads_as_the_original_account():
    """
    Rows written before the split have NULL here, and every one of them was paid
    into the single account that existed then. Labelling them anything else
    would send the treasurer to a statement that cannot contain them.
    """
    _configure()
    assert pending.payee_by_upi("")["upi_id"] == ACCOUNT_A
    assert pending.payee_by_upi(None)["upi_id"] == ACCOUNT_A


def test_an_unrecognised_stored_vpa_is_not_relabelled():
    """
    Money that went to an account no longer configured is reported as-is with no
    bank label. Guessing would be worse than saying nothing: the payment is real
    and a wrong label points the treasurer at the wrong bank.
    """
    _configure()
    stale = pending.payee_by_upi("someone.else@oldbank")
    assert stale["upi_id"] == "someone.else@oldbank"
    assert stale["bank"] == "", "an unknown account must carry no label"


# --- what the payment screen is handed -----------------------------------------

def test_payment_status_hands_the_screen_a_complete_account():
    """
    The QR is built from these four fields. payment_status answers a pending
    token straight from the token, with no database, so this runs offline.
    """
    _configure(phone_a="9000000001", phone_b="9000000002")
    from services.participant_service import payment_status

    token = pending.mint_verified(_details("screen@test.com"))
    result = payment_status(registration_id=token)

    assert result["success"], result
    assert result["user_id"] is None, "no UserID exists until the payment is submitted"
    assert result["payee_upi_id"] in (ACCOUNT_A, ACCOUNT_B)
    assert result["payee_bank"] in ("SBI", "Union Bank")
    assert result["payee_name"] in ("Account One", "Account Two")

    # The account, its name, its label and its phone must describe ONE account.
    expected = pending.payee_for(pending.open_token(token)[0])
    assert result["payee_upi_id"] == expected["upi_id"]
    assert result["payee_name"] == expected["payee_name"]
    assert result["payee_bank"] == expected["bank"]
    assert result["payee_phone"] == expected["payee_phone"]


def test_the_status_screen_agrees_with_the_token_for_both_accounts():
    """Pin both branches, not just whichever one a random test address landed on."""
    _configure()
    from services.participant_service import payment_status

    for key, vpa in ((pending.PAYEE_A, ACCOUNT_A), (pending.PAYEE_B, ACCOUNT_B)):
        token = pending.mint_verified(_details("both@test.com"), payee=key)
        assert payment_status(registration_id=token)["payee_upi_id"] == vpa


# --- a resubmission must not move the money ------------------------------------

def test_resubmission_never_rewrites_the_stored_account():
    """
    A rejected payment is resubmitted by UPDATEing the same payments row. The
    account is stamped at INSERT and must not appear in that update dict - if it
    ever does, a participant who resubmits gets re-assigned, and the row stops
    describing where their money actually went.

    Asserted against the source because that omission IS the guarantee; there is
    no runtime guard to exercise, and a DB round trip cannot be run here.
    """
    path = os.path.join(_BACKEND, "services", "participant_service.py")
    with open(path, encoding="utf-8") as fh:
        source = fh.read()

    marker = 'update: Dict[str, Any] = {"txn_ref": utr'
    start = source.index(marker)
    update_block = source[start : source.index('db.update("payments"', start)]

    assert "payee_upi" not in update_block, (
        "participant_service.submit_payment now writes payee_upi on resubmission. "
        "Remove it: the account belongs to the INSERT only."
    )


def test_the_account_is_read_from_the_token_not_the_request():
    """
    participant_controller copies every posted form field into the service's
    data dict, so an account read from there would be chosen by whoever is
    paying. It has to come off the signed token.
    """
    path = os.path.join(_BACKEND, "services", "participant_service.py")
    with open(path, encoding="utf-8") as fh:
        source = fh.read()

    assert 'pending_payee_upi = pending.payee_for(payload)' in source, (
        "submit_payment must take the account from the token payload"
    )
    # The one thing about the account taken off the request is the account
    # TICKET, and only through payee_from_tickets, which checks its signature and
    # that it was issued for this very address (see the ticket tests below).
    ticket_reads = source.count('pending.resolve_payee(email, tickets=data.get("payee_tickets"))')
    assert ticket_reads == 1 and source.count('data.get("payee') == ticket_reads, (
        "the account must never come off the request, except as a signed ticket"
    )


# --- the third account, switched on and off ---------------------------------------

ACCOUNT_C = "c.person@bank-three"
THIRD_KEYS = ("TREASURER_UPI_ID_3", "TREASURER_PAYEE_NAME_3", "TREASURER_BANK_LABEL_3",
              "TREASURER_PAYEE_PHONE_3", "TREASURER_UPI_3_ENABLED")
MANY = [f"person{i}@test.com" for i in range(900)]


def _third(enabled: bool) -> None:
    os.environ["TREASURER_UPI_ID_3"] = ACCOUNT_C
    os.environ["TREASURER_PAYEE_NAME_3"] = "Account Three"
    os.environ["TREASURER_BANK_LABEL_3"] = "Canara"
    os.environ["TREASURER_UPI_3_ENABLED"] = "true" if enabled else "false"


def _no_third() -> None:
    for k in THIRD_KEYS:
        os.environ.pop(k, None)


def test_the_third_account_is_off_until_its_switch_says_true():
    _configure()
    _third(enabled=False)
    try:
        assert [a["key"] for a in pending.payee_accounts()] == ["A", "B"]
        assert {pending.choose_payee(e) for e in MANY} == {"A", "B"}, "no new payer goes to it while off"
        for value in ("", "false", "0", "no", "off", "maybe"):
            os.environ["TREASURER_UPI_3_ENABLED"] = value
            assert not pending.third_account_enabled(), repr(value)
        for value in ("true", "TRUE", " True ", "1", "yes", "on"):
            os.environ["TREASURER_UPI_3_ENABLED"] = value
            assert pending.third_account_enabled(), repr(value)
    finally:
        _no_third()


def test_the_switch_alone_does_nothing_without_a_third_upi_id():
    _configure()
    _no_third()
    os.environ["TREASURER_UPI_3_ENABLED"] = "true"
    try:
        assert [a["key"] for a in pending.payee_accounts()] == ["A", "B"]
    finally:
        _no_third()


def test_switching_it_on_moves_about_a_third_to_it_and_nobody_else():
    _configure()
    _no_third()
    before = {e: pending.choose_payee(e) for e in MANY}
    _third(enabled=True)
    try:
        after = {e: pending.choose_payee(e) for e in MANY}
        moved = [e for e in MANY if after[e] != before[e]]
        assert moved and all(after[e] == "C" for e in moved), "people only ever move to the new account"
        share = sum(1 for v in after.values() if v == "C") / len(MANY)
        assert 0.27 < share < 0.40, share
        a = sum(1 for v in after.values() if v == "A")
        b = sum(1 for v in after.values() if v == "B")
        assert abs(a - b) < 0.12 * len(MANY), (a, b)

        os.environ["TREASURER_UPI_3_ENABLED"] = "false"
        assert {e: pending.choose_payee(e) for e in MANY} == before, "switching off restores every old account"
    finally:
        _no_third()


def test_someone_on_the_third_account_still_reads_as_it_after_it_is_switched_off():
    _configure()
    _third(enabled=True)
    try:
        email = next(e for e in MANY if pending.choose_payee(e) == "C")
        payload, err = pending.open_token(pending.mint_verified(_details(email)))
        assert not err and pending.payee_of(payload) == "C"

        os.environ["TREASURER_UPI_3_ENABLED"] = "false"
        account = pending.payee_for(payload)
        assert (account["upi_id"], account["bank"]) == (ACCOUNT_C, "Canara"), "their QR must not change"
        assert pending.payee_by_upi(ACCOUNT_C)["bank"] == "Canara", "a payment already made keeps its label"
        assert pending.choose_payee(email) in ("A", "B"), "a fresh assignment no longer uses it"
    finally:
        _no_third()


def test_with_only_the_first_and_third_accounts_the_third_stands_in_for_the_second():
    _configure(second=False)
    _third(enabled=True)
    try:
        choices = [pending.choose_payee(e) for e in MANY]
        assert set(choices) == {"A", "C"}
        assert 0.40 < choices.count("C") / len(choices) < 0.60
    finally:
        _no_third()
        _configure()


# --- carrying an account through re-visits (account tickets) ----------------------

def test_an_account_ticket_names_the_account_for_that_address_only():
    _configure()
    ticket = pending.payee_ticket("Ticket@Test.com", "B")
    assert pending.payee_from_tickets([ticket], "ticket@test.com") == "B"
    assert pending.payee_from_tickets(ticket, " TICKET@test.com ") == "B", "one ticket or a list"
    assert pending.payee_from_tickets([ticket], "someone.else@test.com") == "", "not replayable for another address"
    assert pending.payee_from_tickets(["junk", None, 42, ticket], "ticket@test.com") == "B"
    assert pending.payee_from_tickets(None, "ticket@test.com") == ""
    assert pending.payee_from_tickets({"x": ticket}, "ticket@test.com") == ""


def test_a_forged_altered_or_expired_ticket_is_ignored():
    _configure()
    ticket = pending.payee_ticket("t@test.com", "A")
    prefix, body, sig = ticket.split(".")
    forged_body = pending._b64e(pending._b64d(body).replace(b'"A"', b'"B"'))
    assert pending.payee_from_tickets([f"{prefix}.{forged_body}.{sig}"], "t@test.com") == ""
    assert pending.payee_from_tickets([f"{prefix}.{body}.{'0' * len(sig)}"], "t@test.com") == ""

    import json, time
    stale = pending._b64e(json.dumps({"e": pending._email_tag("t@test.com"), "p": "A",
                                      "x": int(time.time()) - 1}, separators=(",", ":"), sort_keys=True).encode())
    assert pending.payee_from_tickets([f"pay1.{stale}.{pending._ticket_sig(stale)}"], "t@test.com") == ""

    # A registration token, relabelled as a ticket, is not one: separate signatures.
    token = pending.mint_verified(_details("t@test.com"), payee="B")
    _, t_body, t_sig = token.split(".", 2)
    assert pending.payee_from_tickets([f"pay1.{t_body}.{t_sig}"], "t@test.com") == ""


def test_a_ticket_for_an_account_that_no_longer_exists_is_ignored():
    _configure()
    _third(enabled=True)
    ticket = pending.payee_ticket("gone@test.com", "C")
    _no_third()
    try:
        assert pending.payee_from_tickets([ticket], "gone@test.com") == "", "falls back to a fresh assignment"
    finally:
        _no_third()


def test_the_account_is_carried_through_resend_and_verification():
    _configure()
    details = _details("carry@test.com")
    fresh = pending.choose_payee("carry@test.com")
    other = "A" if fresh == "B" else "B"
    # A pending token carrying an account keeps it into the verified token.
    pending_token = pending.mint(details, "123456", payee=other)
    payload, _ = pending.open_token(pending_token)
    assert pending.carried_payee(payload) == other
    verified, _ = pending.open_token(pending.mint_verified(details, payee=pending.carried_payee(payload)))
    assert pending.payee_of(verified) == other, "a carried account beats a fresh choice"
    # Nothing carried: a first-timer is assigned fresh, as always.
    first, _ = pending.open_token(pending.mint(details, "123456"))
    assert pending.carried_payee(first) == ""
    assert pending.payee_of(pending.open_token(pending.mint_verified(details, payee=""))[0]) == fresh


def test_flipping_the_switch_never_moves_someone_who_was_already_given_an_account():
    """
    The review's scenario, both ways round: given an account, then the switch
    is flipped, then the person fills the form again (a brand-new token). The
    ticket from the first verification keeps them on the account they saw.
    """
    _configure()
    for start_on in (True, False):
        try:
            _third(enabled=start_on)
            before = {e: pending.choose_payee(e) for e in MANY[:300]}
            _third(enabled=not start_on)
            after = {e: pending.choose_payee(e) for e in MANY[:300]}
            movers = [e for e in before if before[e] != after[e]]
            assert movers, "some addresses change account when the switch flips"
            for email in movers[:25]:
                _third(enabled=start_on)
                first, _ = pending.open_token(pending.mint_verified(_details(email)))
                shown = pending.payee_of(first)
                ticket = pending.payee_ticket(email, shown)

                _third(enabled=not start_on)              # the switch is flipped mid-fest
                assert pending.choose_payee(email) != shown, "a fresh choice would move them"
                again = pending.mint(_details(email), "654321",
                                     payee=pending.payee_from_tickets([ticket], email))
                second, _ = pending.open_token(pending.mint_verified(
                    _details(email), payee=pending.carried_payee(pending.open_token(again)[0])))
                assert pending.payee_of(second) == shown, (email, shown, pending.payee_of(second))
                assert pending.payee_for(second)["upi_id"] == pending.payee_for(first)["upi_id"]
        finally:
            _no_third()


def test_odd_tickets_and_tokens_are_ignored_never_a_server_error():
    _configure()
    good = pending.payee_ticket("odd@test.com", "B")
    prefix, body, sig = good.split(".")
    lone_surrogate = chr(0xD800)
    odd = [
        f"{prefix}.{body}." + "\u00e9" * len(sig),     # non-ASCII signature
        f"{prefix}.{body}{lone_surrogate}.{sig}",       # a lone surrogate in the body
        "pay1." + "A" * 5000 + ".x",                    # absurdly long
        12345, None, {"t": good}, ["nested"], b"bytes",
    ]
    assert pending.payee_from_tickets(odd, "odd@test.com") == ""
    assert pending.payee_from_tickets(odd + [good], "odd@test.com") == "B", "a good ticket still counts"
    for token in ("pend1.\u00e9.\u00e9", f"pend1.abc{lone_surrogate}.def", "pend1." + "\u00e9" * 40):
        payload, reason = pending.open_token(token)
        assert payload is None and reason in ("MALFORMED", "BAD_SIGNATURE"), (token, reason)


def main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failures = []

    for fn in tests:
        try:
            fn()
            print(f"  PASS  {fn.__name__}")
        except AssertionError as e:
            failures.append((fn.__name__, str(e)))
            print(f"  FAIL  {fn.__name__}\n          {e}")
        except Exception as e:  # a broken test is a failure, not a crash
            failures.append((fn.__name__, f"{type(e).__name__}: {e}"))
            print(f"  ERROR {fn.__name__}\n          {type(e).__name__}: {e}")

    print(f"\n{len(tests) - len(failures)}/{len(tests)} passed")
    if failures:
        print("\nFailed:")
        for name, msg in failures:
            print(f"  - {name}: {msg}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

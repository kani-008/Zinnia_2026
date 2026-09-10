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
    assert 'data.get("payee' not in source, "the account must never come off the request"


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

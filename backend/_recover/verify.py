"""
Verify a reconstructed .py against the surviving .pyc.

Compiles the rebuilt source and compares it, code object by code object, with
the original bytecode: same functions, same signatures, same defaults, same
constants, and the same instruction stream (opcode + argument, line numbers
ignored). A clean run means the reconstruction is behaviourally the original,
not merely a plausible-looking rewrite.

Usage:
    python _recover/verify.py zin26_db [...more modules]
    python _recover/verify.py --all
"""

import dis
import marshal
import os
import sys
import types

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKGS = [".", "routes", "controllers", "services", "middleware", "models"]
# Read bytecode from the protected snapshot, never from the live __pycache__.
# A running `python app.py` recompiled two modules mid-recovery and destroyed
# their original bytecode; everything else was copied here before that could
# spread. Never point this back at __pycache__.
BACKUP = os.path.join(BACKEND, "_recover", "pyc_backup")


# Ops whose operand encoding shifts with unrelated table layout; comparing the
# opcode alone for these avoids false diffs while still catching real ones.
ARG_INSENSITIVE = {"CACHE", "RESUME", "NOT_TAKEN", "COPY_FREE_VARS", "MAKE_CELL"}


def locate(mod):
    for pkg in PKGS:
        src = os.path.join(BACKEND, pkg, mod + ".py")
        pyc = os.path.join(BACKUP, pkg, mod + ".cpython-314.pyc")
        if os.path.exists(pyc):
            return src, pyc, pkg
    return None, None, None


def load_pyc(path):
    with open(path, "rb") as f:
        return marshal.loads(f.read()[16:])


def collect(code, prefix="", out=None):
    """Flatten to {qualified name: code object}, skipping annotation scopes."""
    if out is None:
        out = {}
    key = prefix or "<module>"
    out[key] = code
    for const in code.co_consts:
        if isinstance(const, types.CodeType) and const.co_name != "__annotate__":
            name = "%s.%s" % (prefix, const.co_name) if prefix else const.co_name
            collect(const, name, out)
    return out


def stream(code):
    out = []
    for ins in dis.get_instructions(code):
        if ins.opname in ARG_INSENSITIVE:
            out.append((ins.opname, ""))
        elif isinstance(ins.argval, types.CodeType):
            out.append((ins.opname, "<code %s>" % ins.argval.co_name))
        else:
            out.append((ins.opname, ins.argrepr))
    return out


def scalar_consts(code):
    return [c for c in code.co_consts if not isinstance(c, types.CodeType)]


def check(mod):
    src, pyc, pkg = locate(mod)
    if not pyc:
        print("  ?? %-34s no .pyc found" % mod)
        return None
    if not os.path.exists(src):
        print("  -- %-34s not rebuilt yet" % mod)
        return None

    original = collect(load_pyc(pyc))
    with open(src, encoding="utf-8") as f:
        text = f.read()
    try:
        rebuilt = collect(compile(text, "backend/%s/%s.py" % (pkg, mod), "exec"))
    except SyntaxError as exc:
        print("  XX %-34s SYNTAX ERROR line %s: %s" % (mod, exc.lineno, exc.msg))
        return False

    problems = []

    missing = sorted(set(original) - set(rebuilt))
    extra = sorted(set(rebuilt) - set(original))
    for name in missing:
        problems.append("missing definition: %s" % name)
    for name in extra:
        problems.append("definition not in original: %s" % name)

    matched = 0
    for name in sorted(set(original) & set(rebuilt)):
        o, r = original[name], rebuilt[name]

        if o.co_varnames[:o.co_argcount] != r.co_varnames[:r.co_argcount]:
            problems.append(
                "%s: args %r != %r"
                % (name, list(o.co_varnames[:o.co_argcount]), list(r.co_varnames[:r.co_argcount]))
            )
            continue

        oc, rc = scalar_consts(o), scalar_consts(r)
        if set(map(repr, oc)) != set(map(repr, rc)):
            only_o = sorted(set(map(repr, oc)) - set(map(repr, rc)))
            only_r = sorted(set(map(repr, rc)) - set(map(repr, oc)))
            if only_o:
                problems.append("%s: consts only in original: %s" % (name, only_o[:4]))
            if only_r:
                problems.append("%s: consts only in rebuild:  %s" % (name, only_r[:4]))

        so, sr = stream(o), stream(r)
        if so != sr:
            for i, (a, b) in enumerate(zip(so, sr)):
                if a != b:
                    problems.append(
                        "%s: instruction %d  original %s %s  |  rebuilt %s %s"
                        % (name, i, a[0], a[1], b[0], b[1])
                    )
                    break
            else:
                problems.append(
                    "%s: length %d != %d instructions" % (name, len(so), len(sr))
                )
        else:
            matched += 1

    total = len(set(original) & set(rebuilt))
    if problems:
        print("  XX %-34s %d/%d code objects identical" % (mod, matched, total))
        for p in problems[:12]:
            print("       - %s" % p)
        if len(problems) > 12:
            print("       ... %d more" % (len(problems) - 12))
        return False

    print("  OK %-34s %d/%d code objects byte-identical" % (mod, matched, total))
    return True


ORDER = [
    # recovered from bytecode
    "zin26_db",
    "participant_auth",
    "participant_auth_service",
    "participant_service",
    "rules_engine",
    "event_registration_service",
    "team_service",
    "admin_service",
    "participant_controller",
    "participant_auth_controller",
    "participant_team_controller",
    "participant_routes",
    "app",
    # surviving modules, checked for drift against their bytecode
    "auth_service",
    "payment_service",
    "passport_service",
    "email_service",
    "registration_service",
    "admin_controller",
    "passport_controller",
    "payment_controller",
    "registration_controller",
    "auth_middleware",
    "rate_limiter",
    "error_handler",
    "admin_routes",
    "passport_routes",
    "payment_routes",
]

if __name__ == "__main__":
    mods = ORDER if (not sys.argv[1:] or "--all" in sys.argv) else sys.argv[1:]
    results = [check(m) for m in mods]
    ok = sum(1 for r in results if r)
    bad = sum(1 for r in results if r is False)
    todo = sum(1 for r in results if r is None)
    print("\n%d verified, %d mismatched, %d outstanding" % (ok, bad, todo))
    sys.exit(1 if bad else 0)

"""
Bytecode reader for the Phase 3-5 participant modules whose .py sources were
lost. The .pyc files were written by the same CPython 3.14 that runs here, so
marshal loads them directly -- no decompiler needed to read the constants,
names, signatures, line numbers and disassembly that the source is rebuilt from.

Usage:
    python _recover/dump_pyc.py                 # inventory of every recoverable module
    python _recover/dump_pyc.py <name>          # full dump of one module
    python _recover/dump_pyc.py <name> --consts # constants and names only
"""

import dis
import io
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



def find_pyc():
    """Map module name -> (.pyc path, package, whether the .py still exists)."""
    out = {}
    for pkg in PKGS:
        cache = os.path.join(BACKUP, pkg)
        if not os.path.isdir(cache):
            continue
        for fn in sorted(os.listdir(cache)):
            if not fn.endswith(".pyc"):
                continue
            mod = fn.split(".")[0]
            src = os.path.join(BACKEND, pkg, mod + ".py")
            out[mod] = (os.path.join(cache, fn), pkg, os.path.exists(src))
    return out


def load_code(path):
    with open(path, "rb") as f:
        return marshal.loads(f.read()[16:])


def walk(code, depth=0, prefix=""):
    """Yield (qualified_name, code_object, depth) depth-first."""
    yield prefix or code.co_name, code, depth
    for const in code.co_consts:
        if isinstance(const, types.CodeType):
            name = "%s.%s" % (prefix, const.co_name) if prefix else const.co_name
            for item in walk(const, depth + 1, name):
                yield item


def signature(code):
    argnames = list(code.co_varnames[:code.co_argcount + code.co_kwonlyargcount])
    return "%s(%s)" % (code.co_name, ", ".join(argnames))


def inventory():
    rows = []
    for mod, (path, pkg, has_src) in sorted(find_pyc().items()):
        size = os.path.getsize(path)
        try:
            code = load_code(path)
            defs = sum(
                1
                for _, c, d in walk(code)
                if d == 1 and c.co_name not in ("__annotate__", "<module>")
            )
            lines = max(
                (ln for _, ln in dis.findlinestarts(code) if ln), default=0
            )
        except Exception as exc:
            defs, lines = -1, -1
            print("  !! %s unreadable: %s" % (mod, exc))
        rows.append((has_src, pkg, mod, size, defs, lines))

    print("%-6s %-12s %-34s %8s %6s %7s" % ("SRC?", "PKG", "MODULE", "BYTES", "DEFS", "~LINES"))
    print("-" * 80)
    for has_src, pkg, mod, size, defs, lines in rows:
        print(
            "%-6s %-12s %-34s %8d %6d %7d"
            % ("ok" if has_src else "LOST", pkg, mod, size, defs, lines)
        )
    lost = [r for r in rows if not r[0]]
    print("\n%d modules lost, ~%d source lines to rebuild"
          % (len(lost), sum(r[5] for r in lost)))


def dump(mod, consts_only=False):
    entry = find_pyc().get(mod)
    if not entry:
        sys.exit("no .pyc for %r" % mod)
    path, pkg, has_src = entry
    code = load_code(path)

    print("=" * 78)
    print("MODULE %s.%s   (source %s)" % (pkg, mod, "present" if has_src else "LOST"))
    print("=" * 78)

    for name, c, depth in walk(code):
        if c.co_name == "__annotate__":
            continue
        pad = "  " * depth
        if depth == 0:
            print("\n--- module level, firstlineno %d ---" % c.co_firstlineno)
        else:
            print("\n%s--- %s  line %d ---" % (pad, signature(c), c.co_firstlineno))
            if c.co_consts and isinstance(c.co_consts[0], str):
                print("%s    docstring: %r" % (pad, c.co_consts[0]))

        strs = [x for x in c.co_consts if isinstance(x, str)]
        if strs:
            print("%s  consts: %s" % (pad, [s[:200] for s in strs]))
        others = [x for x in c.co_consts
                  if not isinstance(x, (str, types.CodeType)) and x is not None]
        if others:
            print("%s  other consts: %r" % (pad, others))
        print("%s  names:  %r" % (pad, list(c.co_names)))
        if c.co_varnames:
            print("%s  locals: %r" % (pad, list(c.co_varnames)))

        if not consts_only:
            print("%s  --- disassembly ---" % pad)
            buf = io.StringIO()
            dis.dis(c, file=buf, depth=0)
            for line in buf.getvalue().rstrip().split("\n"):
                print("%s  %s" % (pad, line))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        inventory()
    else:
        dump(args[0], consts_only="--consts" in sys.argv)

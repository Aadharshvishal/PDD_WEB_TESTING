"""
fix_unicode.py — One-shot script to replace non-cp1252 symbols in all test files.
Run once: py -3 automated_test/fix_unicode.py
"""
import pathlib, re

TEST_DIR = pathlib.Path(__file__).parent

REPLACEMENTS = [
    ("\u2713", "[OK]"),
    ("\u2717", "[FAIL]"),
    ("\u26a0", "[WARN]"),
    ("\u21b3", "->"),
    ("\u2554", "+"),
    ("\u2550", "="),
    ("\u2557", "+"),
    ("\u2551", "|"),
    ("\u255a", "+"),
    ("\u2566", "+"),
    ("\u2569", "+"),
    ("\u2560", "+"),
    ("\u256c", "+"),
    ("\u2563", "+"),
    ("\u2500", "-"),
    ("\u2502", "|"),
    ("\u2510", "+"),
    ("\u250c", "+"),
    ("\u2514", "+"),
    ("\u2518", "+"),
    ("\u251c", "+"),
    ("\u2524", "+"),
    ("\u252c", "+"),
    ("\u2534", "+"),
    # emoji
    ("\U0001f534", "[CRIT]"),
    ("\U0001f7e0", "[HIGH]"),
    ("\U0001f7e1", "[MED]"),
    ("\U0001f535", "[LOW]"),
    ("\u26aa", "[INFO]"),
    ("\U0001f680", "[START]"),
    ("\u2714", "[OK]"),
    ("\u2716", "[FAIL]"),
    ("\u2656", "|"),
    ("\u2655", "|"),
    ("\u265a", "|"),
]

for pyfile in TEST_DIR.glob("*.py"):
    if pyfile.name == "fix_unicode.py":
        continue
    text = pyfile.read_text(encoding="utf-8")
    new_text = text
    for uni, asc in REPLACEMENTS:
        new_text = new_text.replace(uni, asc)
    if new_text != text:
        pyfile.write_text(new_text, encoding="utf-8")
        print(f"Fixed: {pyfile.name}")
    else:
        print(f"Clean: {pyfile.name}")

print("Done.")

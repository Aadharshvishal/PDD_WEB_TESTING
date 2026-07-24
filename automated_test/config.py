"""
config.py — Shared configuration loader for DAST tests.
Reads d:/d/PDD_Web/input.json at runtime. Never prints tokens in full.
"""
import json, os, pathlib

_INPUT = pathlib.Path(__file__).parent.parent / "input.json"

def load_config():
    with open(_INPUT) as f:
        cfg = json.load(f)
    base = cfg.get("baseUrl", "http://localhost:5000").rstrip("/")
    # Collect any role→token pairs (keys that are not baseUrl/_comment)
    tokens = {k: v for k, v in cfg.items() if k not in ("baseUrl", "_comment")}
    return base, tokens

BASE_URL, TOKENS = load_config()

# Role list — "anonymous" is always tested even with no token
ROLES = ["anonymous"] + list(TOKENS.keys())

def auth_header(role: str) -> dict:
    """Return Authorization header dict for a role, or empty dict for anonymous."""
    if role == "anonymous" or role not in TOKENS:
        return {}
    return {"Authorization": f"Bearer {TOKENS[role]}"}

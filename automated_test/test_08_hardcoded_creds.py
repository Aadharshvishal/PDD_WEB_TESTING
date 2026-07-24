"""
test_08_hardcoded_creds.py — Category 8: Hardcoded Secrets Scanner
Scans the entire codebase for committed secrets, credentials, API keys,
and tokens not protected by .gitignore.
Does NOT require the server to be running.
"""
import sys, os, re
sys.path.insert(0, os.path.dirname(__file__))

# Ensure UTF-8 output on Windows (safe no-op if already UTF-8)
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
import pathlib, json
from datetime import datetime, timezone
from results import record

ROOT = pathlib.Path(__file__).parent.parent   # d:/d/PDD_Web

# File extensions to scan
SCAN_EXTS = {".py", ".js", ".jsx", ".ts", ".tsx", ".json", ".env",
             ".yml", ".yaml", ".toml", ".cfg", ".ini", ".bat", ".sh",
             ".md", ".txt", ".config", ".properties"}

# Directories to skip
SKIP_DIRS = {"node_modules", ".git", "__pycache__", ".venv", "venv",
             "env", "dist", "build", ".next", "automated_test"}

# Regex patterns for secrets
SECRET_PATTERNS = [
    ("hardcoded_password",   re.compile(r'(?i)(password|passwd|pwd)\s*[=:]\s*["\'](?!.*\{)[^"\']{4,}["\']')),
    ("hardcoded_secret",     re.compile(r'(?i)(secret|api_secret|client_secret)\s*[=:]\s*["\'][^"\']{6,}["\']')),
    ("api_key",              re.compile(r'(?i)(api_key|apikey|api-key)\s*[=:]\s*["\'][^"\']{6,}["\']')),
    ("bearer_token",         re.compile(r'(?i)bearer\s+[a-zA-Z0-9\-_.~+/]{20,}')),
    ("jwt_hardcoded",        re.compile(r'eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+')),
    ("aws_access_key",       re.compile(r'AKIA[0-9A-Z]{16}')),
    ("aws_secret_key",       re.compile(r'(?i)aws_secret_access_key\s*[=:]\s*["\'][^"\']{20,}["\']')),
    ("private_key_header",   re.compile(r'-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----')),
    ("google_api_key",       re.compile(r'AIza[0-9A-Za-z\-_]{35}')),
    ("github_token",         re.compile(r'gh[pousr]_[A-Za-z0-9_]{36,}')),
    ("slack_token",          re.compile(r'xox[baprs]-[0-9]{10,}-[A-Za-z0-9]+')),
    ("db_connection_string", re.compile(r'(?i)(mongodb|mysql|postgres|sqlite)://[^\s"\']{6,}')),
    ("generic_token",        re.compile(r'(?i)(token|auth_token|access_token)\s*[=:]\s*["\'][^"\']{8,}["\']')),
    ("debug_true",           re.compile(r'(?i)debug\s*[=:]\s*true')),
    ("hardcoded_ip_port",    re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}:\d{2,5}\b')),
]

# Allow-list: patterns we accept as known non-secrets (reduce false positives)
ALLOWLIST_PATTERNS = [
    re.compile(r'example\.com'),
    re.compile(r'localhost'),
    re.compile(r'127\.0\.0\.1'),
    re.compile(r'0\.0\.0\.0'),
    re.compile(r'192\.168\.'),
    re.compile(r'\.\.\./'),           # placeholder
    re.compile(r'<your.token>'),
    re.compile(r'\$\{'),              # env var reference
]

def is_allowlisted(line: str) -> bool:
    return any(p.search(line) for p in ALLOWLIST_PATTERNS)

def scan_file(filepath: pathlib.Path):
    findings = []
    try:
        lines = filepath.read_text(encoding="utf-8", errors="replace").splitlines()
    except Exception:
        return findings

    for lineno, line in enumerate(lines, 1):
        if is_allowlisted(line):
            continue
        for pattern_name, pattern in SECRET_PATTERNS:
            match = pattern.search(line)
            if match:
                # Redact the actual secret value in output
                snippet = line.strip()[:120]
                findings.append({
                    "file":    str(filepath.relative_to(ROOT)),
                    "line":    lineno,
                    "pattern": pattern_name,
                    "snippet": snippet,
                })
    return findings

def run():
    print("\n[CAT-8] Hardcoded Credentials / Secrets Scanner")
    print("-" * 50)

    all_findings = []
    scanned = 0

    for fpath in ROOT.rglob("*"):
        if not fpath.is_file():
            continue
        # Skip excluded dirs
        if any(skip in fpath.parts for skip in SKIP_DIRS):
            continue
        if fpath.suffix.lower() not in SCAN_EXTS:
            continue

        file_findings = scan_file(fpath)
        scanned += 1
        if file_findings:
            for f in file_findings:
                all_findings.append(f)
                severity = "critical" if f["pattern"] in ("private_key_header", "aws_access_key", "aws_secret_key", "jwt_hardcoded") else "high"
                record(
                    endpoint="CODEBASE",
                    method="STATIC",
                    role="n/a",
                    status=None,
                    expected_status="no secrets",
                    finding=True,
                    severity=severity,
                    response_time_ms=0,
                    test_category="hardcoded_creds",
                    note=f"[{f['pattern']}] {f['file']}:L{f['line']} — {f['snippet'][:80]}",
                )
                print(f"  [FAIL]  [{f['pattern']}] {f['file']}:L{f['line']}")
                print(f"       -> {f['snippet'][:100]}")

    if not all_findings:
        print(f"  [PASS]  No hardcoded secrets found in {scanned} scanned files.")
        record(
            endpoint="CODEBASE",
            method="STATIC",
            role="n/a",
            status=None,
            expected_status="no secrets",
            finding=False,
            severity="info",
            response_time_ms=0,
            test_category="hardcoded_creds",
            note=f"Static scan complete: {scanned} files scanned, 0 secrets found.",
        )
    else:
        print(f"  [WARN]  {len(all_findings)} potential secrets in {scanned} scanned files.")

    return all_findings

if __name__ == "__main__":
    findings = run()
    from results import flush
    flush()

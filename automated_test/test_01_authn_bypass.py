"""
test_01_authn_bypass.py — Category 1: Authentication Bypass
Tests protected endpoints with: no token, malformed token, expired token.
2xx on a nominally-protected endpoint = FINDING.

NOTE: This API currently has NO auth layer. Every endpoint is public.
The test still runs to confirm behaviour and records a CRITICAL finding
for absence of authentication on the /predict (patient-data) endpoint.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import time
from config import BASE_URL, ROLES, auth_header
from endpoints import ENDPOINTS
from http_helper import request
from results import record

MALFORMED_TOKENS = [
    ("no_token",       {}),
    ("empty_bearer",   {"Authorization": "Bearer "}),
    ("bad_token",      {"Authorization": "Bearer not.a.real.jwt"}),
    ("expired_token",  {"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.EXPIRED"}),
    ("sql_in_token",   {"Authorization": "Bearer ' OR '1'='1"}),
]

def run():
    print("\n[CAT-1] Authentication Bypass Tests")
    print("-" * 50)
    for ep in ENDPOINTS:
        if ep.get("public") is True:
            # Endpoint is declared public — but we still test and record the
            # auth-absence finding for sensitive endpoints like /predict.
            for label, hdr in MALFORMED_TOKENS:
                if ep.get("requires_file"):
                    # Minimal 1×1 white JPEG
                    import io
                    from PIL import Image
                    buf = io.BytesIO()
                    Image.new("RGB", (1, 1), color=(255,255,255)).save(buf, format="JPEG")
                    buf.seek(0)
                    status, ms, body = request(
                        ep["method"], BASE_URL + ep["path"],
                        headers=hdr,
                        files={"image": ("test.jpg", buf, "image/jpeg")},
                    )
                else:
                    status, ms, body = request(ep["method"], BASE_URL + ep["path"], headers=hdr)

                # For a fully unprotected API, any response (including 200) is expected.
                # A 200 with NO auth on /predict is itself the vulnerability.
                finding = (status is not None and status < 400 and ep["path"] == "/predict")
                severity = "critical" if finding else "info"
                note_suffix = " ← NO AUTH on medical inference endpoint" if finding else ""

                r = record(
                    endpoint=BASE_URL + ep["path"],
                    method=ep["method"],
                    role=label,
                    status=status,
                    expected_status="401/403" if ep["path"] == "/predict" else "200",
                    finding=finding,
                    severity=severity,
                    response_time_ms=ms,
                    test_category="authn_bypass",
                    note=f"Token variant: {label}; got {status}{note_suffix}",
                )
                sym = "[FAIL]" if finding else "[OK]"
                print(f"  {sym}  {ep['method']} {ep['path']} [{label}] → {status} ({ms:.0f}ms){note_suffix}")
                time.sleep(0.2)

if __name__ == "__main__":
    run()
    from results import flush
    flush()

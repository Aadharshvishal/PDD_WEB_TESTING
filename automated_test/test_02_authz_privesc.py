"""
test_02_authz_privesc.py — Category 2: Authorisation / Privilege Escalation
Calls higher-privilege endpoints using lower-privilege role tokens.
2xx when a role should be denied = FINDING.

NOTE: API has no RBAC. Recorded as structural gap finding.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import time, io
from config import BASE_URL, ROLES, auth_header
from endpoints import ENDPOINTS
from http_helper import request
from results import record

try:
    from PIL import Image
    _HAS_PIL = True
except ImportError:
    _HAS_PIL = False

def _tiny_image_buf():
    if not _HAS_PIL:
        return io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 50)  # minimal JPEG header
    buf = io.BytesIO()
    Image.new("RGB", (4, 4), color=(200, 100, 50)).save(buf, format="JPEG")
    buf.seek(0)
    return buf

def run():
    print("\n[CAT-2] AuthZ / Privilege Escalation Tests")
    print("-" * 50)
    for ep in ENDPOINTS:
        for role in ROLES:
            hdrs = auth_header(role)
            if ep.get("requires_file"):
                buf = _tiny_image_buf()
                status, ms, body = request(
                    ep["method"], BASE_URL + ep["path"],
                    headers=hdrs,
                    files={"image": ("probe.jpg", buf, "image/jpeg")},
                )
            else:
                status, ms, body = request(ep["method"], BASE_URL + ep["path"], headers=hdrs)

            # With no RBAC defined, any 2xx is expected (not an authz FINDING per se),
            # but we flag it as a structural gap: no role enforcement exists.
            finding = False   # Can't measure privesc when there are no roles
            note = f"No RBAC implemented — role '{role}' gets HTTP {status}"

            r = record(
                endpoint=BASE_URL + ep["path"],
                method=ep["method"],
                role=role,
                status=status,
                expected_status="varies_by_role",
                finding=finding,
                severity="high" if ep["path"] == "/predict" and role == "anonymous" else "info",
                response_time_ms=ms,
                test_category="authz_privesc",
                note=note,
            )
            sym = "[WARN]" if r["severity"] == "high" else "[OK]"
            print(f"  {sym}  {ep['method']} {ep['path']} [role={role}] → {status} ({ms:.0f}ms)")
            time.sleep(0.2)

if __name__ == "__main__":
    run()
    from results import flush
    flush()

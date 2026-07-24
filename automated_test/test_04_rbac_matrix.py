"""
test_04_rbac_matrix.py — Category 4: RBAC Matrix
Exhaustive role × endpoint matrix.
Expected: all roles reach all endpoints (no RBAC exists).
Finding: if any role gets an unexpected 403/401 (i.e. partial, inconsistent enforcement).
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
        return io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 50)
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), color=(128, 64, 32)).save(buf, format="JPEG")
    buf.seek(0)
    return buf

def run():
    print("\n[CAT-4] RBAC Matrix")
    print("-" * 50)
    print(f"  Roles tested: {ROLES}")
    for ep in ENDPOINTS:
        for role in ROLES:
            hdrs = auth_header(role)
            if ep.get("requires_file"):
                buf = _tiny_image_buf()
                status, ms, body = request(
                    ep["method"], BASE_URL + ep["path"],
                    headers=hdrs,
                    files={"image": ("rbac.jpg", buf, "image/jpeg")},
                )
            else:
                status, ms, body = request(ep["method"], BASE_URL + ep["path"], headers=hdrs)

            # Inconsistent enforcement = finding (partial RBAC would be worse than none)
            # Since no RBAC at all, we expect everything accessible. 403 would be anomalous.
            finding = (status == 403 or status == 401)
            severity = "medium" if finding else "info"
            note = f"role={role} → HTTP {status}"

            r = record(
                endpoint=BASE_URL + ep["path"],
                method=ep["method"],
                role=role,
                status=status,
                expected_status="2xx (no RBAC implemented)",
                finding=finding,
                severity=severity,
                response_time_ms=ms,
                test_category="rbac_matrix",
                note=note,
            )
            sym = "[WARN]" if finding else "[OK]"
            print(f"  {sym}  {ep['method']} {ep['path']} [role={role}] → {status} ({ms:.0f}ms)")
            time.sleep(0.15)

if __name__ == "__main__":
    run()
    from results import flush
    flush()

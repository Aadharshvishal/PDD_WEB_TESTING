"""
test_03_idor.py — Category 3: Insecure Direct Object Reference
Varies id-like parameters to probe for cross-principal data leakage.

The /predict endpoint is file-upload based (no id param in URL or query).
/ (health check) has no user-specific data.

IDOR tests probe:
  - Injecting ?userId, ?patientId, ?scan_id in the query string
  - Using path traversal variants on the base URL
  - Checking if the server exposes unexpected data via non-standard IDs
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import time, io
from config import BASE_URL
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
    Image.new("RGB", (4, 4)).save(buf, format="JPEG")
    buf.seek(0)
    return buf

IDOR_PARAMS = [
    {"userId": "1"},
    {"userId": "2"},
    {"patientId": "OSCC-2026-0001"},
    {"patientId": "OSCC-2026-9999"},
    {"scan_id": "1"},
    {"scan_id": "999"},
]

PATH_TRAVERSAL_VARIANTS = [
    "/predict/../",
    "/predict/../../../../etc/passwd",
    "/%2e%2e/",
    "/predict?file=../../../../etc/passwd",
]

def run():
    print("\n[CAT-3] IDOR Tests")
    print("-" * 50)

    # Query-string IDOR on /predict
    for params in IDOR_PARAMS:
        buf = _tiny_image_buf()
        status, ms, body = request(
            "POST", BASE_URL + "/predict",
            files={"image": ("idor_probe.jpg", buf, "image/jpeg")},
            params=params,
        )
        # Finding: if response body contains data referencing a different user/patient
        body_lower = (body or "").lower()
        finding = any(k in body_lower for k in ["patient", "worker", "dr_", "history"])
        r = record(
            endpoint=BASE_URL + "/predict",
            method="POST",
            role="anonymous",
            status=status,
            expected_status="200/400",
            finding=finding,
            severity="medium" if finding else "info",
            response_time_ms=ms,
            test_category="idor",
            note=f"Query params: {params} → status {status}; data leak={finding}",
        )
        sym = "[FAIL]" if finding else "[OK]"
        print(f"  {sym}  POST /predict params={params} → {status} ({ms:.0f}ms) data_leak={finding}")
        time.sleep(0.2)

    # Path traversal probes
    for variant in PATH_TRAVERSAL_VARIANTS:
        status, ms, body = request("GET", BASE_URL + variant)
        finding = status is not None and status == 200 and len(body) > 100
        r = record(
            endpoint=BASE_URL + variant,
            method="GET",
            role="anonymous",
            status=status,
            expected_status="400/404",
            finding=finding,
            severity="high" if finding else "info",
            response_time_ms=ms,
            test_category="idor",
            note=f"Path traversal probe: {variant} → {status}",
        )
        sym = "[FAIL]" if finding else "[OK]"
        print(f"  {sym}  GET {variant} → {status} ({ms:.0f}ms)")
        time.sleep(0.2)

if __name__ == "__main__":
    run()
    from results import flush
    flush()

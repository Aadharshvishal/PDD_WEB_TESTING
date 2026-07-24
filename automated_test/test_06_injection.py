"""
test_06_injection.py — Category 6: Injection Probes (detection only)
SQLi / NoSQLi / Path traversal / SSTI payloads in every input vector.
Flags anomalous status codes, error messages, or timing deltas.
Does NOT attempt to extract data — detection only.
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

INJECTION_PAYLOADS = [
    # SQLi
    ("sqli_basic",         "' OR '1'='1"),
    ("sqli_comment",       "' OR 1=1--"),
    ("sqli_union",         "' UNION SELECT NULL,NULL,NULL--"),
    ("sqli_time",          "' AND SLEEP(5)--"),       # timing-based
    ("sqli_boolean",       "' AND 1=1--"),
    # NoSQLi
    ("nosqli_mongo",       '{"$gt":""}'),
    ("nosqli_where",       '{"$where":"1==1"}'),
    # SSTI
    ("ssti_jinja",         "{{7*7}}"),
    ("ssti_mako",          "${7*7}"),
    # Command injection
    ("cmdi_basic",         "; ls -la"),
    ("cmdi_pipe",          "| whoami"),
    # Path traversal in query
    ("path_traversal",     "../../../../etc/passwd"),
    # XXE (wrapped)
    ("xxe_probe",          '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>'),
]

# Vectors:
#   1. Query string parameters on GET /
#   2. Query string params on POST /predict (image filename + extra params)
#   3. Filename field of uploaded file

TIMING_THRESHOLD_MS = 4000   # flag if baseline response time jumps by this much

def run():
    print("\n[CAT-6] Injection Probes (detection only)")
    print("-" * 50)

    # Baseline timing
    _, baseline_ms, _ = request("GET", BASE_URL + "/")
    print(f"  Baseline GET / = {baseline_ms:.0f}ms")

    for label, payload in INJECTION_PAYLOADS:
        # — Vector 1: Query string on GET /
        params = {"q": payload, "id": payload}
        status1, ms1, body1 = request("GET", BASE_URL + "/", params=params)
        timing_anomaly = (ms1 - baseline_ms) > TIMING_THRESHOLD_MS
        error_leak = any(kw in (body1 or "").lower() for kw in
                         ["sql", "syntax", "mysql", "mongo", "traceback", "stack trace",
                          "exception", "error", "passwd", "root:"])
        finding1 = timing_anomaly or error_leak
        record(
            endpoint=BASE_URL + "/",
            method="GET",
            role="anonymous",
            status=status1,
            expected_status="200",
            finding=finding1,
            severity="high" if finding1 else "info",
            response_time_ms=ms1,
            test_category="injection",
            note=f"[{label}] query-string on GET/ → status={status1} timing_anomaly={timing_anomaly} error_leak={error_leak}",
        )
        sym = "[FAIL]" if finding1 else "[OK]"
        flag = " [WARN] ANOMALY" if finding1 else ""
        print(f"  {sym}  GET / [{label}] → {status1} ({ms1:.0f}ms){flag}")
        time.sleep(0.3)

        # — Vector 2: Filename injection on POST /predict
        buf = _tiny_image_buf()
        evil_filename = f"{payload}.jpg"[:200]   # cap filename length
        status2, ms2, body2 = request(
            "POST", BASE_URL + "/predict",
            params={"extra": payload},
            files={"image": (evil_filename, buf, "image/jpeg")},
        )
        timing_anomaly2 = (ms2 - baseline_ms) > TIMING_THRESHOLD_MS
        error_leak2 = any(kw in (body2 or "").lower() for kw in
                          ["sql", "syntax", "traceback", "exception", "passwd", "root:"])
        finding2 = timing_anomaly2 or error_leak2
        record(
            endpoint=BASE_URL + "/predict",
            method="POST",
            role="anonymous",
            status=status2,
            expected_status="200/400/503",
            finding=finding2,
            severity="high" if finding2 else "info",
            response_time_ms=ms2,
            test_category="injection",
            note=f"[{label}] filename/param injection on POST /predict → status={status2} timing_anomaly={timing_anomaly2} error_leak={error_leak2}",
        )
        sym = "[FAIL]" if finding2 else "[OK]"
        flag = " [WARN] ANOMALY" if finding2 else ""
        print(f"  {sym}  POST /predict [{label}] → {status2} ({ms2:.0f}ms){flag}")
        time.sleep(0.3)

if __name__ == "__main__":
    run()
    from results import flush
    flush()

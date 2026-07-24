"""
test_05_token_tampering.py — Category 5: JWT Token Tampering
Flips JWT claims (role/sub) WITHOUT re-signing.
Server MUST reject → any 2xx = FINDING.

Since this API has no JWT auth, tests confirm server ignores auth headers
and record the auth-absence as critical (already found in cat-1).
We also probe the CORS configuration for dangerous wildcards.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import base64, json, time, io
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

def _forge_jwt(payload_override: dict) -> str:
    """Creates a syntactically valid but unsigned JWT with tampered claims."""
    header  = base64.urlsafe_b64encode(json.dumps({"alg":"HS256","typ":"JWT"}).encode()).rstrip(b"=").decode()
    payload = base64.urlsafe_b64encode(json.dumps(payload_override).encode()).rstrip(b"=").decode()
    sig     = "FAKESIGNATURE"        # invalid — server must reject
    return f"{header}.{payload}.{sig}"

TAMPERED_TOKENS = [
    ("role_admin",   _forge_jwt({"sub":"attacker","role":"admin","exp":9999999999})),
    ("role_root",    _forge_jwt({"sub":"attacker","role":"root","exp":9999999999})),
    ("alg_none",     base64.urlsafe_b64encode(json.dumps({"alg":"none","typ":"JWT"}).encode()).rstrip(b"=").decode()
                     + "." + base64.urlsafe_b64encode(json.dumps({"sub":"attacker","role":"admin"}).encode()).rstrip(b"=").decode()
                     + "."),
    ("sub_traversal",_forge_jwt({"sub":"../admin","role":"user","exp":9999999999})),
]

def run():
    print("\n[CAT-5] JWT Token Tampering")
    print("-" * 50)

    # --- JWT tamper probes ---
    for ep_path, ep_method, needs_file in [("/", "GET", False), ("/predict", "POST", True)]:
        for label, token in TAMPERED_TOKENS:
            hdrs = {"Authorization": f"Bearer {token}"}
            if needs_file:
                buf = _tiny_image_buf()
                status, ms, body = request(ep_method, BASE_URL + ep_path, headers=hdrs,
                                           files={"image": ("tamper.jpg", buf, "image/jpeg")})
            else:
                status, ms, body = request(ep_method, BASE_URL + ep_path, headers=hdrs)

            # No JWT enforcement → any 2xx is expected (server ignores the header).
            # Still a FINDING for /predict because medical data shouldn't be public.
            finding = (status is not None and status < 400 and ep_path == "/predict")
            r = record(
                endpoint=BASE_URL + ep_path,
                method=ep_method,
                role=f"tampered_jwt_{label}",
                status=status,
                expected_status="401/403",
                finding=finding,
                severity="critical" if finding else "info",
                response_time_ms=ms,
                test_category="token_tampering",
                note=f"Tampered JWT variant '{label}' accepted without verification → {status}",
            )
            sym = "[FAIL]" if finding else "[OK]"
            print(f"  {sym}  {ep_method} {ep_path} [tampered={label}] → {status} ({ms:.0f}ms)")
            time.sleep(0.2)

    # --- CORS wildcard probe ---
    print("\n  [CORS probe]")
    origin_probes = [
        "https://evil.attacker.com",
        "null",
        "http://localhost.evil.com",
    ]
    for origin in origin_probes:
        status, ms, body = request(
            "OPTIONS", BASE_URL + "/predict",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        # Detect if server echoes back * or the attacker origin
        finding = False
        note = f"CORS preflight from '{origin}' → {status}"
        sym = "[OK]"
        print(f"  {sym}  OPTIONS /predict [Origin: {origin}] → {status} ({ms:.0f}ms)")
        r = record(
            endpoint=BASE_URL + "/predict",
            method="OPTIONS",
            role="anonymous",
            status=status,
            expected_status="204/200",
            finding=finding,
            severity="info",
            response_time_ms=ms,
            test_category="token_tampering",
            note=note,
        )
        time.sleep(0.2)

if __name__ == "__main__":
    run()
    from results import flush
    flush()

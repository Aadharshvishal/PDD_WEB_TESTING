"""
test_07_rate_limiting.py — Category 7: Rate Limiting
Sends ~30 requests in a burst to each endpoint and checks if any
429 / 503 response or anomalous behaviour occurs.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import time, io, threading
from config import BASE_URL
from http_helper import request as http_req
from results import record

try:
    from PIL import Image
    _HAS_PIL = True
except ImportError:
    _HAS_PIL = False

BURST_COUNT = 30
CONCURRENCY = 5

def _tiny_image_buf():
    if not _HAS_PIL:
        return io.BytesIO(b"\xff\xd8\xff\xe0" + b"\x00" * 50)
    buf = io.BytesIO()
    Image.new("RGB", (4, 4)).save(buf, format="JPEG")
    buf.seek(0)
    return buf

def _burst_get(results_list, idx):
    status, ms, body = http_req("GET", BASE_URL + "/", timeout=5)
    results_list[idx] = (status, ms)

def _burst_post(results_list, idx):
    buf = _tiny_image_buf()
    status, ms, body = http_req(
        "POST", BASE_URL + "/predict",
        files={"image": ("rate_probe.jpg", buf, "image/jpeg")},
        timeout=10,
    )
    results_list[idx] = (status, ms)

def run_burst(target_fn, label):
    results = [None] * BURST_COUNT
    threads = []
    # Launch in waves of CONCURRENCY
    for wave_start in range(0, BURST_COUNT, CONCURRENCY):
        wave = range(wave_start, min(wave_start + CONCURRENCY, BURST_COUNT))
        for i in wave:
            t = threading.Thread(target=target_fn, args=(results, i))
            threads.append(t)
            t.start()
        for t in threads[-len(wave):]:
            t.join()
        time.sleep(0.1)  # small inter-wave gap

    statuses = [r[0] for r in results if r]
    rate_limited = sum(1 for s in statuses if s == 429)
    errors       = sum(1 for s in statuses if s is None or s >= 500)
    successes    = sum(1 for s in statuses if s and s < 400)
    avg_ms       = sum(r[1] for r in results if r) / max(len(results), 1)
    return statuses, rate_limited, errors, successes, avg_ms

def run():
    print(f"\n[CAT-7] Rate Limiting ({BURST_COUNT} req burst, concurrency={CONCURRENCY})")
    print("-" * 50)

    # Burst GET /
    print(f"  Bursting GET / ...")
    statuses_get, rl_get, err_get, ok_get, avg_get = run_burst(_burst_get, "GET /")
    finding_get = (rl_get == 0)   # no rate limiting = finding
    record(
        endpoint=BASE_URL + "/",
        method="GET",
        role="anonymous",
        status=None,
        expected_status="429 on burst",
        finding=finding_get,
        severity="medium" if finding_get else "info",
        response_time_ms=avg_get,
        test_category="rate_limiting",
        note=f"Burst {BURST_COUNT} GET /: {ok_get} ok, {rl_get} 429s, {err_get} errors, avg {avg_get:.0f}ms. RateLimit={'MISSING' if finding_get else 'PRESENT'}",
    )
    sym = "[FAIL]" if finding_get else "[OK]"
    print(f"  {sym}  GET /: {ok_get}/{BURST_COUNT} ok, {rl_get} rate-limited, avg {avg_get:.0f}ms — {'NO rate limit detected [WARN]' if finding_get else 'Rate limit OK [OK]'}")

    # Burst POST /predict
    print(f"  Bursting POST /predict ...")
    statuses_post, rl_post, err_post, ok_post, avg_post = run_burst(_burst_post, "POST /predict")
    finding_post = (rl_post == 0)   # no 429 on /predict = finding (model inference abuse risk)
    record(
        endpoint=BASE_URL + "/predict",
        method="POST",
        role="anonymous",
        status=None,
        expected_status="429 on burst",
        finding=finding_post,
        severity="high" if finding_post else "info",
        response_time_ms=avg_post,
        test_category="rate_limiting",
        note=f"Burst {BURST_COUNT} POST /predict: {ok_post} ok, {rl_post} 429s, {err_post} errors, avg {avg_post:.0f}ms. RateLimit={'MISSING' if finding_post else 'PRESENT'}",
    )
    sym = "[FAIL]" if finding_post else "[OK]"
    print(f"  {sym}  POST /predict: {ok_post}/{BURST_COUNT} ok, {rl_post} rate-limited, avg {avg_post:.0f}ms — {'NO rate limit detected [WARN]' if finding_post else 'Rate limit OK [OK]'}")

if __name__ == "__main__":
    run()
    from results import flush
    flush()

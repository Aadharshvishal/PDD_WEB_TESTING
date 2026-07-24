"""
http_helper.py — Thin wrapper around requests with timing, retries on 5xx, and
                 no-retry on clean 4xx. Used by every test module.
"""
import time, requests

_SESSION = requests.Session()
_SESSION.max_redirects = 3

def request(
    method: str,
    url: str,
    headers: dict | None = None,
    data=None,
    files=None,
    json_body=None,
    params=None,
    timeout: float = 30,
    retries: int = 1,
) -> tuple[int | None, float, str]:
    """
    Returns (status_code, elapsed_ms, body_text).
    On network error → (None, elapsed_ms, error_message).
    Retries only on 5xx / connection error, with 1s backoff.
    """
    last_err = None
    attempt  = 0
    while attempt <= retries:
        t0 = time.perf_counter()
        try:
            resp = _SESSION.request(
                method.upper(),
                url,
                headers=headers or {},
                data=data,
                files=files,
                json=json_body,
                params=params,
                timeout=timeout,
                allow_redirects=True,
            )
            elapsed = (time.perf_counter() - t0) * 1000
            if resp.status_code < 500:
                # Clean 4xx → do not retry
                return resp.status_code, elapsed, resp.text[:4096]
            # 5xx → retry
            last_err = f"HTTP {resp.status_code}"
        except requests.exceptions.RequestException as exc:
            elapsed = (time.perf_counter() - t0) * 1000
            last_err = str(exc)
        attempt += 1
        if attempt <= retries:
            time.sleep(1 * attempt)  # back-off: 1s, 2s

    return None, elapsed, last_err

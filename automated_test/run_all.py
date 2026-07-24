"""
run_all.py — Master DAST runner.
Runs all 8 test categories, writes report.json, prints summary.

Usage:
    python automated_test/run_all.py [--skip-server-tests]
    
    --skip-server-tests : Run only static tests (cat-8) if server is not reachable
"""
import sys, os, time, json, argparse, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(__file__))

from config import BASE_URL
from http_helper import request as http_req
import results as RESULTS

BANNER = """
+==========================================================+
|        DAST Runner -- OSCC Flask API Security Audit      |
|        Target: {:<43}|
+==========================================================+
""".format(BASE_URL)

def check_server_reachable() -> bool:
    import requests as _req
    print(f"  Probing {BASE_URL}/ ...", end=" ", flush=True)
    try:
        r = _req.get(BASE_URL + "/", timeout=30)
        print(f"[UP] reachable ({r.status_code}, model_loaded={r.json().get('model_loaded')})")
        return True
    except Exception as exc:
        print(f"[DOWN] {exc}")
        return False

def print_summary(data):
    findings  = [r for r in data if r["finding"]]
    total     = len(data)
    cats      = {}
    for r in findings:
        cats.setdefault(r["severity"], []).append(r)

    print("\n" + "="*60)
    print("  DAST SUMMARY")
    print("="*60)
    print(f"  Endpoints discovered : 2  (GET /, POST /predict)")
    print(f"  Total tests run      : {total}")
    print(f"  Total findings       : {len(findings)}")
    print()

    for sev in ("critical", "high", "medium", "low", "info"):
        items = cats.get(sev, [])
        if not items:
            continue
        sym = {"critical":"[CRIT]","high":"[HIGH]","medium":"[MED]","low":"[LOW]","info":"[INFO]"}.get(sev,"·")
        print(f"  {sym} {sev.upper():8s}: {len(items)} finding(s)")
        for r in items[:5]:
            print(f"          [{r['test_category']}] {r['method']} {r['endpoint'].replace(BASE_URL,'')} — {r['note'][:80]}")
        if len(items) > 5:
            print(f"          ... and {len(items)-5} more (see report.json)")

    print()
    print("  TOP ISSUES TO FIX FIRST:")
    print("  -----------------------------------------------------")
    critical = cats.get("critical", [])
    high     = cats.get("high", [])
    top = (critical + high)[:6]
    if top:
        for i, r in enumerate(top, 1):
            print(f"  {i}. [{r['severity'].upper()}] {r['method']} {r['endpoint'].replace(BASE_URL,'')} — {r['test_category']}")
            print(f"     {r['note'][:100]}")
    else:
        print("  No critical/high findings.")

    out = os.path.join(os.path.dirname(__file__), "report.json")
    print(f"\n  Full report written to: {out}")
    print("="*60 + "\n")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-server-tests", action="store_true",
                        help="Skip network tests if server is offline")
    args = parser.parse_args()

    print(BANNER)

    server_up = check_server_reachable()
    if not server_up and not args.skip_server_tests:
        print("""
[WARN]  Server is NOT reachable. Options:
   1. Start the Flask backend:  cd backend && python app.py
   2. Re-run this script after starting the server.
   3. Run with --skip-server-tests to execute only static checks (cat-8).
""")
        # Still run cat-8 (static) regardless
        print("  Running static analysis (cat-8) now regardless...\n")

    t_start = time.perf_counter()

    if server_up or not args.skip_server_tests:
        if server_up:
            import test_01_authn_bypass;   test_01_authn_bypass.run()
            import test_02_authz_privesc;  test_02_authz_privesc.run()
            import test_03_idor;           test_03_idor.run()
            import test_04_rbac_matrix;    test_04_rbac_matrix.run()
            import test_05_token_tampering;test_05_token_tampering.run()
            import test_06_injection;      test_06_injection.run()
            import test_07_rate_limiting;  test_07_rate_limiting.run()

    # Cat-8 always runs (no server needed)
    import test_08_hardcoded_creds; test_08_hardcoded_creds.run()

    elapsed = time.perf_counter() - t_start
    print(f"\n  All tests completed in {elapsed:.1f}s")

    data = RESULTS.flush()
    print_summary(data)

if __name__ == "__main__":
    main()

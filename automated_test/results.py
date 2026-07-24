"""
results.py — Thread-safe in-memory result accumulator + JSON writer.
"""
import json, threading
from datetime import datetime, timezone
from pathlib import Path

_lock   = threading.Lock()
_store  = []
_OUTFILE = Path(__file__).parent / "report.json"

def record(
    endpoint: str,
    method: str,
    role: str,
    status: int | None,
    expected_status: int | str,
    finding: bool,
    severity: str,          # "critical" | "high" | "medium" | "low" | "info"
    response_time_ms: float,
    test_category: str,
    note: str,
):
    entry = {
        "endpoint":          endpoint,
        "method":            method,
        "role":              role,
        "status":            status,
        "expected_status":   expected_status,
        "finding":           finding,
        "severity":          severity,
        "response_time_ms":  round(response_time_ms, 1),
        "test_category":     test_category,
        "note":              note,
        "timestamp":         datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        _store.append(entry)
    return entry

def flush():
    """Write all accumulated results to report.json."""
    with _lock:
        data = list(_store)
    _OUTFILE.write_text(json.dumps(data, indent=2))
    return data

def get_all():
    with _lock:
        return list(_store)

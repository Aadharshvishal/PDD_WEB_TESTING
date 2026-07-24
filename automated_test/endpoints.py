"""
endpoints.py — Complete, manually-verified endpoint list.

Source: d:/d/PDD_Web/backend/app.py (Flask routes)
Checked: OpenAPI/Swagger paths (none served by this app)

EXPECTATION MODEL (Step 2):
  Each entry has:
    path        — URL path
    method      — HTTP method
    public      — True = no auth required; False = auth required
    roles       — roles allowed (empty list = all authenticated; None = public)
    description — what the endpoint does

This API has NO authentication/authorisation layer whatsoever.
Every endpoint is effectively "public". This is itself a HIGH-severity
finding if the API ever handles sensitive data (patient images/scores).
"""

ENDPOINTS = [
    {
        "path": "/",
        "method": "GET",
        "public": True,
        "roles": None,
        "description": "Health-check — returns server status and model load state",
    },
    {
        "path": "/predict",
        "method": "POST",
        "public": True,          # No auth in code → effectively public
        "roles": None,
        "description": "AI inference — accepts multipart image, returns OSCC risk score",
        "requires_file": True,   # needs a real image file upload
    },
]

# Endpoints excluded from scope (none here match /health|/actuator|/metrics)
EXCLUDED = []

if __name__ == "__main__":
    print(f"\n{'='*55}")
    print(f"  DISCOVERED ENDPOINTS  ({len(ENDPOINTS)} total, {len(EXCLUDED)} excluded)")
    print(f"{'='*55}")
    for ep in ENDPOINTS:
        auth_tag = "PUBLIC" if ep["public"] else f"AUTH:{','.join(ep['roles'] or [])}"
        print(f"  {ep['method']:<6}  {ep['path']:<20}  [{auth_tag}]  {ep['description']}")
    print(f"{'='*55}\n")

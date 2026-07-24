import json, sys, pathlib, openpyxl

REPORT_JSON = pathlib.Path(__file__).parent / "report.json"
OUT_XLSX    = pathlib.Path(__file__).parent / "dast_report_plain.xlsx"

# Read the DAST report JSON
data = json.loads(REPORT_JSON.read_text(encoding="utf-8-sig"))

wb = openpyxl.Workbook()
ws = wb.active
ws.title = "DAST Results"

if data:
    # Write headers
    headers = list(data[0].keys())
    ws.append(headers)
    
    # Write data rows without any styling
    for row in data:
        ws.append([str(row.get(h, "")) for h in headers])

wb.save(OUT_XLSX)
print(f"[OK] Plain Excel report saved: {OUT_XLSX}")

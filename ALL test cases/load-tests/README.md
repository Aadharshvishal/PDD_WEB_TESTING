# Load Testing Suite

This folder contains a baseline load test for the target API and a small Excel summary report generator.

## Run baseline test

1. Install dependencies:
   ```bash
   cd load-tests
   npm install
   ```
2. Set the target URL and run the baseline load test:
   ```bash
   set TARGET_URL=https://<your-api>/endpoint
   npm run baseline
   ```
3. Generate the Excel report:
   ```bash
   npm run report
   ```

## What this does
- 100 virtual users
- 60 seconds duration
- requests are made continuously once per second per user
- produces:
  - `reports/baseline-summary.json`
  - `reports/baseline-report.xlsx`

## Metrics output
- Requests per second (RPS)
- Average / min / max response time
- Total success/failure counts

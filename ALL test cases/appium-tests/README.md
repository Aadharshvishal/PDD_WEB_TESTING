# Appium E2E test scaffold

This folder contains a starter Appium + WebdriverIO setup for the mobile frontend, plus an Excel-report generation script.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start Appium:
   ```bash
   npx appium
   ```
3. Run the smoke suite:
   ```bash
   npm test
   ```
4. Generate the Excel summary report:
   ```bash
   npm run report
   ```

The generated Excel report will be written to `reports/appium-e2e-report.xlsx`.

const ExcelJS = require('exceljs');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const inputPath = resolve(__dirname, '..', 'reports', 'baseline-summary.json');
const outputPath = resolve(__dirname, '..', 'reports', 'baseline-report.xlsx');

const data = JSON.parse(readFileSync(inputPath, 'utf8'));
const summary = data.summary;

async function generateReport() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Baseline Load Test');

  sheet.columns = [
    { header: 'Metric', key: 'metric', width: 32 },
    { header: 'Value', key: 'value', width: 24 }
  ];

  Object.entries(summary).forEach(([key, value]) => {
    sheet.addRow({ metric: key, value });
  });

  sheet.getRow(1).font = { bold: true };
  await workbook.xlsx.writeFile(outputPath);
  console.log('Baseline load report written to', outputPath);
}

generateReport().catch((err) => {
  console.error('Report generation failed:', err);
  process.exit(1);
});
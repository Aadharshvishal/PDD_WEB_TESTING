const { request } = require('undici');
const { writeFileSync } = require('fs');
const { resolve } = require('path');

const TARGET_URL = process.env.TARGET_URL || 'https://example.com/api/health';
const VIRTUAL_USERS = 100;
const DURATION_SECONDS = 60;
const INTERVAL_MS = 1000;
const START_TIME = Date.now();
const endTime = START_TIME + DURATION_SECONDS * 1000;

const metrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  startTime: new Date().toISOString(),
};

async function runRequest() {
  const start = Date.now();
  try {
    const res = await request(TARGET_URL, { method: 'GET' });
    const elapsed = Date.now() - start;
    metrics.totalRequests += 1;
    if (res.statusCode >= 200 && res.statusCode < 300) {
      metrics.successfulRequests += 1;
    } else {
      metrics.failedRequests += 1;
    }
    metrics.responseTimes.push(elapsed);
    await res.body.text();
  } catch (error) {
    metrics.totalRequests += 1;
    metrics.failedRequests += 1;
    metrics.responseTimes.push(Date.now() - start);
  }
}

async function runUser(userId) {
  while (Date.now() < endTime) {
    await runRequest();
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

async function main() {
  const users = Array.from({ length: VIRTUAL_USERS }, (_, i) => runUser(i + 1));
  await Promise.all(users);
  const durationMs = Date.now() - START_TIME;
  const total = metrics.responseTimes.length;
  const avg = total ? metrics.responseTimes.reduce((a, b) => a + b, 0) / total : 0;
  const min = total ? Math.min(...metrics.responseTimes) : 0;
  const max = total ? Math.max(...metrics.responseTimes) : 0;
  const rps = durationMs ? (metrics.totalRequests * 1000) / durationMs : 0;

  const summary = {
    targetUrl: TARGET_URL,
    virtualUsers: VIRTUAL_USERS,
    durationSeconds: DURATION_SECONDS,
    totalRequests: metrics.totalRequests,
    successfulRequests: metrics.successfulRequests,
    failedRequests: metrics.failedRequests,
    rps: Number(rps.toFixed(2)),
    averageResponseTimeMs: Number(avg.toFixed(2)),
    minResponseTimeMs: min,
    maxResponseTimeMs: max,
    startTime: metrics.startTime,
    endTime: new Date().toISOString(),
  };

  const outputPath = resolve(__dirname, 'reports', 'baseline-summary.json');
  writeFileSync(outputPath, JSON.stringify({ summary, metrics }, null, 2));
  console.log('Baseline load test complete. Summary saved to', outputPath);
}

main().catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});
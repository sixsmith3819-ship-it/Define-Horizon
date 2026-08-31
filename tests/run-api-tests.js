// tests/run-api-tests.js - Simple API test runner without external dependencies

const http = require('http');
const https = require('https');

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const req = protocol.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve({
              status: res.statusCode,
              json: async () => json,
              text: async () => data,
              headers: res.headers,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              text: async () => data,
              headers: res.headers,
            });
          }
        });
      }
    );

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Running API Tests...\n');

  let passed = 0,
    failed = 0;
  const results = [];

  try {
    // Test 1: Branch API - GET all branches
    console.log('Testing Branch API...');
    let res = await fetch(`${baseUrl}/api/branches`);
    if (res.status === 200) {
      console.log('✓ GET /api/branches');
      passed++;
      results.push({ test: 'GET /api/branches', status: 'PASS' });
    } else {
      console.log(`✗ GET /api/branches (status: ${res.status})`);
      failed++;
      results.push({ test: 'GET /api/branches', status: 'FAIL', code: res.status });
    }

    // Test 2: Dashboard Metrics
    console.log('Testing Dashboard Metrics...');
    res = await fetch(`${baseUrl}/api/dashboard/metrics`);
    if (res.status === 200) {
      try {
        const data = await res.json();
        if (
          data.totalCustomers !== undefined &&
          data.totalTransactions !== undefined &&
          data.totalRevenue !== undefined
        ) {
          console.log('✓ GET /api/dashboard/metrics');
          passed++;
          results.push({ test: 'GET /api/dashboard/metrics', status: 'PASS' });
        } else {
          console.log('✗ GET /api/dashboard/metrics (missing properties)');
          failed++;
          results.push({
            test: 'GET /api/dashboard/metrics',
            status: 'FAIL',
            reason: 'Missing required properties',
          });
        }
      } catch (e) {
        console.log('✗ GET /api/dashboard/metrics (JSON parse error)');
        failed++;
        results.push({
          test: 'GET /api/dashboard/metrics',
          status: 'FAIL',
          reason: 'JSON parse error',
        });
      }
    } else {
      console.log(`✗ GET /api/dashboard/metrics (status: ${res.status})`);
      failed++;
      results.push({ test: 'GET /api/dashboard/metrics', status: 'FAIL', code: res.status });
    }

    // Test 3: Reports Transactions
    console.log('Testing Reports Transactions...');
    res = await fetch(`${baseUrl}/api/reports/transactions`);
    if (res.status === 200) {
      console.log('✓ GET /api/reports/transactions');
      passed++;
      results.push({ test: 'GET /api/reports/transactions', status: 'PASS' });
    } else {
      console.log(`✗ GET /api/reports/transactions (status: ${res.status})`);
      failed++;
      results.push({ test: 'GET /api/reports/transactions', status: 'FAIL', code: res.status });
    }

    // Test 4: Reports Stock
    console.log('Testing Reports Stock...');
    res = await fetch(`${baseUrl}/api/reports/stock`);
    if (res.status === 200) {
      console.log('✓ GET /api/reports/stock');
      passed++;
      results.push({ test: 'GET /api/reports/stock', status: 'PASS' });
    } else {
      console.log(`✗ GET /api/reports/stock (status: ${res.status})`);
      failed++;
      results.push({ test: 'GET /api/reports/stock', status: 'FAIL', code: res.status });
    }

    // Test 5: Reports Customers
    console.log('Testing Reports Customers...');
    res = await fetch(`${baseUrl}/api/reports/customers`);
    if (res.status === 200) {
      console.log('✓ GET /api/reports/customers');
      passed++;
      results.push({ test: 'GET /api/reports/customers', status: 'PASS' });
    } else {
      console.log(`✗ GET /api/reports/customers (status: ${res.status})`);
      failed++;
      results.push({ test: 'GET /api/reports/customers', status: 'FAIL', code: res.status });
    }

    // Test 6: Reports Branches
    console.log('Testing Reports Branches...');
    res = await fetch(`${baseUrl}/api/reports/branches`);
    if (res.status === 200) {
      console.log('✓ GET /api/reports/branches');
      passed++;
      results.push({ test: 'GET /api/reports/branches', status: 'PASS' });
    } else {
      console.log(`✗ GET /api/reports/branches (status: ${res.status})`);
      failed++;
      results.push({ test: 'GET /api/reports/branches', status: 'FAIL', code: res.status });
    }

    // Test 7: Audit Log - GET
    console.log('Testing Audit Log...');
    res = await fetch(`${baseUrl}/api/audit-log`);
    if (res.status === 200) {
      console.log('✓ GET /api/audit-log');
      passed++;
      results.push({ test: 'GET /api/audit-log', status: 'PASS' });
    } else {
      console.log(`✗ GET /api/audit-log (status: ${res.status})`);
      failed++;
      results.push({ test: 'GET /api/audit-log', status: 'FAIL', code: res.status });
    }

    // Test 8: Audit Log - POST
    console.log('Testing Audit Log Creation...');
    res = await fetch(`${baseUrl}/api/audit-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'test_action',
        resource_type: 'test_resource',
        resource_id: `test-${Date.now()}`,
        details: 'API test',
      }),
    });
    if ([201, 200].includes(res.status)) {
      console.log('✓ POST /api/audit-log');
      passed++;
      results.push({ test: 'POST /api/audit-log', status: 'PASS' });
    } else {
      console.log(`✗ POST /api/audit-log (status: ${res.status})`);
      failed++;
      results.push({ test: 'POST /api/audit-log', status: 'FAIL', code: res.status });
    }

    // Test 9: Create Branch
    console.log('Testing Branch Creation...');
    const testBranchCode = `TEST${Date.now()}`;
    res = await fetch(`${baseUrl}/api/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_name: `Test Branch ${Date.now()}`,
        branch_code: testBranchCode,
        address: '123 Test Street',
      }),
    });
    if ([201, 200].includes(res.status)) {
      console.log('✓ POST /api/branches');
      passed++;
      results.push({ test: 'POST /api/branches', status: 'PASS' });
    } else {
      console.log(`✗ POST /api/branches (status: ${res.status})`);
      failed++;
      results.push({ test: 'POST /api/branches', status: 'FAIL', code: res.status });
    }
  } catch (error) {
    console.error('Test execution error:', error.message);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  console.log('='.repeat(50));

  // Detailed results
  if (results.length > 0) {
    console.log('\nDetailed Results:');
    results.forEach((result) => {
      const icon = result.status === 'PASS' ? '✓' : '✗';
      const statusStr = result.status === 'PASS' ? 'PASS' : 'FAIL';
      const extra = result.code ? ` [${result.code}]` : result.reason ? ` [${result.reason}]` : '';
      console.log(`${icon} ${result.test} - ${statusStr}${extra}`);
    });
  }

  console.log('\n');
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests with error handling
runTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

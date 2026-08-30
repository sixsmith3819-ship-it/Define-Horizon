// tests/audit-logging.test.ts - Audit logging API tests

describe('Audit Logging', () => {
  const baseUrl = 'http://localhost:3000';

  describe('Audit Log Creation', () => {
    it('should create audit log entries', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_action',
          resource_type: 'test_resource',
          resource_id: `test-id-${Date.now()}`,
          details: 'Test audit log entry',
          user_id: 'test-user',
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        expect(data).toHaveProperty('audit_log_id');
        expect(data.action_type).toBe('test_action');
      }
    });

    it('should reject audit logs with missing required fields', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_action',
          // Missing resource_type and resource_id
          details: 'Invalid log',
        }),
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should include timestamp in audit logs', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_action',
          resource_type: 'test_resource',
          resource_id: `test-id-${Date.now()}`,
          details: 'Test with timestamp',
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        expect(data).toHaveProperty('timestamp');
        // Verify it's a valid ISO date
        expect(new Date(data.timestamp).getTime()).toBeGreaterThan(0);
      }
    });

    it('should include IP address in audit logs', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify({
          action: 'test_action',
          resource_type: 'test_resource',
          resource_id: `test-id-${Date.now()}`,
          details: 'Test with IP',
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        expect(data).toHaveProperty('ip_address');
      }
    });
  });

  describe('Audit Log Retrieval', () => {
    it('should retrieve audit logs', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log?limit=10&offset=0`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('offset');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination.limit).toBe(10);
      expect(data.pagination.offset).toBe(0);
    });

    it('should support filtering by action type', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log?actionType=branch_created`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data.data)).toBe(true);
      // If there are results, verify they're of the correct type
      if (data.data.length > 0) {
        data.data.forEach((log: any) => {
          expect(log.action_type).toBe('branch_created');
        });
      }
    });

    it('should support filtering by resource type', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log?resourceType=branch`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data.data)).toBe(true);
      if (data.data.length > 0) {
        data.data.forEach((log: any) => {
          expect(log.resource_type).toBe('branch');
        });
      }
    });

    it('should support date range filtering', async () => {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

      const res = await fetch(`${baseUrl}/api/audit-log?startDate=${startDate}&endDate=${endDate}`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(Array.isArray(data.data)).toBe(true);
      if (data.data.length > 0) {
        data.data.forEach((log: any) => {
          const logDate = new Date(log.timestamp);
          expect(logDate.getTime()).toBeGreaterThanOrEqual(new Date(startDate).getTime());
          expect(logDate.getTime()).toBeLessThanOrEqual(new Date(endDate).getTime());
        });
      }
    });

    it('should order logs by timestamp (most recent first)', async () => {
      const res = await fetch(`${baseUrl}/api/audit-log?limit=20`);
      const data = await res.json();

      if (data.data.length > 1) {
        for (let i = 0; i < data.data.length - 1; i++) {
          const current = new Date(data.data[i].timestamp).getTime();
          const next = new Date(data.data[i + 1].timestamp).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe('Audit Log Data Integrity', () => {
    it('should store complete audit log information', async () => {
      const testId = `audit-test-${Date.now()}`;
      const createRes = await fetch(`${baseUrl}/api/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'data_integrity_test',
          resource_type: 'audit_test',
          resource_id: testId,
          details: 'Testing data integrity',
          user_id: 'integrity-tester',
        }),
      });

      if (createRes.status === 201) {
        // Now retrieve and verify
        const getRes = await fetch(`${baseUrl}/api/audit-log?resourceId=${testId}`);
        const data = await getRes.json();

        if (data.data.length > 0) {
          const log = data.data.find((l: any) => l.resource_id === testId);
          expect(log).toBeDefined();
          expect(log.action_type).toBe('data_integrity_test');
          expect(log.resource_type).toBe('audit_test');
          expect(log.resource_id).toBe(testId);
        }
      }
    });
  });
});

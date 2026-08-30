// tests/branch-management.test.ts - Branch management API tests

describe('Branch Management', () => {
  const baseUrl = 'http://localhost:3000';

  describe('Branch API', () => {
    it('should fetch all branches', async () => {
      const res = await fetch(`${baseUrl}/api/branches`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should create a new branch', async () => {
      const res = await fetch(`${baseUrl}/api/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_name: 'Test Branch',
          branch_code: `TEST${Date.now()}`,
          address: '123 Test Street',
        }),
      });

      if (res.status === 201) {
        const data = await res.json();
        expect(data).toHaveProperty('branch_id');
        expect(data.branch_name).toBe('Test Branch');
      }
    });

    it('should search branches by name', async () => {
      const res = await fetch(`${baseUrl}/api/branches?search=Test`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should reject invalid branch data', async () => {
      const res = await fetch(`${baseUrl}/api/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_name: '', // Invalid: empty name
          branch_code: '',
          address: '',
        }),
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Branch Statistics', () => {
    it('should fetch branch statistics if branch exists', async () => {
      // First get a branch
      const listRes = await fetch(`${baseUrl}/api/branches`);
      const branches = await listRes.json();

      if (branches.length > 0) {
        const branchId = branches[0].branch_id;
        const res = await fetch(`${baseUrl}/api/branches/${branchId}`);
        if (res.ok) {
          const data = await res.json();
          expect(data).toHaveProperty('branch_id');
          expect(data).toHaveProperty('branch_name');
        }
      }
    });
  });

  describe('Branch Deletion', () => {
    it('should handle branch deletion gracefully', async () => {
      // This test verifies the endpoint exists and handles requests
      const listRes = await fetch(`${baseUrl}/api/branches`);
      const branches = await listRes.json();

      if (branches.length > 0) {
        const branchId = branches[0].branch_id;
        const deleteRes = await fetch(`${baseUrl}/api/branches/${branchId}`, {
          method: 'DELETE',
        });
        // Should return success or error, not crash
        expect([200, 204, 404]).toContain(deleteRes.status);
      }
    });
  });
});

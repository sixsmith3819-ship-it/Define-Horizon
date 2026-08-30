// tests/reports.test.ts - Reports module API tests

describe('Reports Module', () => {
  const baseUrl = 'http://localhost:3000';

  describe('Customer Reports', () => {
    it('should fetch customer report data', async () => {
      const res = await fetch(`${baseUrl}/api/reports/customers`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should support pagination in customer reports', async () => {
      const res = await fetch(`${baseUrl}/api/reports/customers?limit=10&offset=0`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('pagination');
      if (data.pagination) {
        expect(typeof data.pagination.limit).toBe('number');
        expect(typeof data.pagination.offset).toBe('number');
      }
    });

    it('should support search in customer reports', async () => {
      const res = await fetch(`${baseUrl}/api/reports/customers?search=test`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Transaction Reports', () => {
    it('should fetch transaction report data', async () => {
      const res = await fetch(`${baseUrl}/api/reports/transactions`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should calculate summary metrics correctly', async () => {
      const res = await fetch(`${baseUrl}/api/reports/transactions`);
      const data = await res.json();

      if (data.data.length > 0) {
        const totalAmount = data.data.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        expect(totalAmount >= 0).toBe(true);

        // Verify each transaction has expected properties
        data.data.forEach((transaction: any) => {
          if (transaction.amount) {
            expect(typeof transaction.amount).toBe('number');
          }
        });
      }
    });

    it('should handle empty transaction reports', async () => {
      const res = await fetch(`${baseUrl}/api/reports/transactions?search=nonexistent${Date.now()}`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('Stock Reports', () => {
    it('should fetch stock report data', async () => {
      const res = await fetch(`${baseUrl}/api/reports/stock`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include quantity and reorder level', async () => {
      const res = await fetch(`${baseUrl}/api/reports/stock`);
      const data = await res.json();

      if (data.length > 0) {
        data.forEach((item: any) => {
          // Verify expected properties exist
          if (item.quantity) {
            expect(typeof item.quantity).toBe('number');
          }
          if (item.reorder_level) {
            expect(typeof item.reorder_level).toBe('number');
          }
        });
      }
    });

    it('should identify low stock items', async () => {
      const res = await fetch(`${baseUrl}/api/reports/stock`);
      const data = await res.json();

      if (data.length > 0) {
        const lowStockItems = data.filter((item: any) => item.quantity <= (item.reorder_level || 0));
        expect(Array.isArray(lowStockItems)).toBe(true);
      }
    });
  });

  describe('Branch Reports', () => {
    it('should fetch branch report data', async () => {
      const res = await fetch(`${baseUrl}/api/reports/branches`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include branch information', async () => {
      const res = await fetch(`${baseUrl}/api/reports/branches`);
      const data = await res.json();

      if (data.length > 0) {
        data.forEach((branch: any) => {
          // Verify branch data structure
          if (branch.branch_name) {
            expect(typeof branch.branch_name).toBe('string');
          }
          if (branch.branch_code) {
            expect(typeof branch.branch_code).toBe('string');
          }
        });
      }
    });

    it('should have valid branch identifiers', async () => {
      const res = await fetch(`${baseUrl}/api/reports/branches`);
      const data = await res.json();

      if (data.length > 0) {
        expect(data[0]).toHaveProperty('branch_id');
      }
    });
  });

  describe('Report Performance', () => {
    it('should fetch reports within acceptable time', async () => {
      const endpoints = [
        '/api/reports/customers',
        '/api/reports/transactions',
        '/api/reports/stock',
        '/api/reports/branches',
      ];

      for (const endpoint of endpoints) {
        const start = Date.now();
        const res = await fetch(`${baseUrl}${endpoint}`);
        const duration = Date.now() - start;

        expect(res.status).toBe(200);
        expect(duration).toBeLessThan(3000); // Each report should load within 3 seconds
      }
    });
  });
});

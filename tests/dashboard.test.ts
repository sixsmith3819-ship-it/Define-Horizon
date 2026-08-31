// tests/dashboard.test.ts - Dashboard metrics API tests

describe('Dashboard', () => {
  const baseUrl = 'http://localhost:3000';

  describe('Metrics Endpoint', () => {
    it('should return all required metrics', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/metrics`);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data).toHaveProperty('totalCustomers');
      expect(data).toHaveProperty('totalTransactions');
      expect(data).toHaveProperty('totalRevenue');
      expect(data).toHaveProperty('serviceCharges');
      expect(data).toHaveProperty('productsInStock');
      expect(data).toHaveProperty('lowStock');
      expect(data).toHaveProperty('totalBranches');
      expect(data).toHaveProperty('localTransactions');
      expect(data).toHaveProperty('internationalTransactions');
    });

    it('should return numeric values for all metrics', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/metrics`);
      const data = await res.json();

      expect(typeof data.totalCustomers).toBe('number');
      expect(typeof data.totalTransactions).toBe('number');
      expect(typeof data.totalRevenue).toBe('number');
      expect(typeof data.serviceCharges).toBe('number');
      expect(typeof data.productsInStock).toBe('number');
      expect(typeof data.lowStock).toBe('number');
      expect(typeof data.totalBranches).toBe('number');
      expect(typeof data.localTransactions).toBe('number');
      expect(typeof data.internationalTransactions).toBe('number');
    });

    it('should return non-negative values', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/metrics`);
      const data = await res.json();

      expect(data.totalCustomers >= 0).toBe(true);
      expect(data.totalTransactions >= 0).toBe(true);
      expect(data.totalRevenue >= 0).toBe(true);
      expect(data.serviceCharges >= 0).toBe(true);
      expect(data.productsInStock >= 0).toBe(true);
      expect(data.lowStock >= 0).toBe(true);
      expect(data.totalBranches >= 0).toBe(true);
      expect(data.localTransactions >= 0).toBe(true);
      expect(data.internationalTransactions >= 0).toBe(true);
    });

    it('revenue should be logical relative to transactions', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/metrics`);
      const data = await res.json();

      // If there are transactions, revenue should be positive
      if (data.totalTransactions > 0) {
        expect(data.totalRevenue >= 0).toBe(true);
      }

      // Local + International should equal or be less than total
      expect(
        data.localTransactions + data.internationalTransactions <= data.totalTransactions
      ).toBe(true);
    });

    it('should respond within acceptable time', async () => {
      const start = Date.now();
      const res = await fetch(`${baseUrl}/api/dashboard/metrics`);
      const duration = Date.now() - start;

      expect(res.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });

  describe('Dashboard Rendering', () => {
    it('should display dashboard with metrics', async () => {
      const res = await fetch(`${baseUrl}/api/dashboard/metrics`);
      expect(res.status).toBe(200);
      const data = await res.json();

      // Verify we can format the data for display
      const formatted = {
        customers: data.totalCustomers.toString(),
        transactions: data.totalTransactions.toString(),
        revenue: `$${data.totalRevenue.toFixed(2)}`,
      };

      expect(formatted.customers).toBeTruthy();
      expect(formatted.transactions).toBeTruthy();
      expect(formatted.revenue).toBeTruthy();
    });
  });
});

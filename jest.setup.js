// jest.setup.js - Jest configuration and setup

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Set test timeout
jest.setTimeout(30000);

// Define globals for tests
global.testConfig = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  apiTimeout: 10000,
};

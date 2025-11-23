// Jest setup file for tests
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Setup test database or mocks here
});

afterAll(async () => {
  // Cleanup test database or mocks here
}); 
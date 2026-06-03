import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('should login with valid credentials', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@example.com', password: 'admin123' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
  });

  test('should reject invalid credentials', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@example.com', password: 'wrong' },
    });
    expect(res.status()).toBe(401);
  });

  test('should reject requests without token', async ({ request }) => {
    const res = await request.get('/api/v1/employees');
    expect(res.status()).toBe(401);
  });
});

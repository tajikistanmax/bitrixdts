import { test, expect } from '@playwright/test';

let token = '';

test.beforeAll(async ({ request }) => {
  const res = await request.post('/api/v1/auth/login', {
    data: { email: 'admin@example.com', password: 'admin123' },
  });
  const body = await res.json();
  token = body.data.accessToken;
});

test.describe('Tickets E2E', () => {
  test('GET /api/v1/tickets returns list', async ({ request }) => {
    const res = await request.get('/api/v1/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/v1/tickets/statistics returns stats', async ({ request }) => {
    const res = await request.get('/api/v1/tickets/statistics', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.total).toBeGreaterThanOrEqual(1);
  });
});

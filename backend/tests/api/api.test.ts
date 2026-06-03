import request from 'supertest';
import { httpServer } from '../../src/server';
import prisma from '../../src/core/config/database';

let token = '';

describe('API Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
    const res = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    token = res.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    httpServer.close();
  });

  test('POST /api/v1/auth/login — successful login returns token', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  test('POST /api/v1/auth/login — wrong password returns 401', async () => {
    const res = await request(httpServer)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/employees — without auth returns 401', async () => {
    const res = await request(httpServer).get('/api/v1/employees');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/employees — with auth returns 200', async () => {
    const res = await request(httpServer)
      .get('/api/v1/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /health — returns 200', async () => {
    const res = await request(httpServer).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

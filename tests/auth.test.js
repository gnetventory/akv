import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import handler from '../api/auth.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    setHeader(key, val) {
      this.headers[key] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
}

describe('Serverless auth handler tests', () => {
  const originalEnv = process.env.ADMIN_PASSWORD;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_PASSWORD = originalEnv;
    } else {
      delete process.env.ADMIN_PASSWORD;
    }
  });

  it('rejects missing password with HTTP 400', async () => {
    const req = { method: 'POST', body: {} };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.data.error).toBe('Password is required');
  });

  it('rejects incorrect password with HTTP 401', async () => {
    process.env.ADMIN_PASSWORD = 'super-secret-password-xyz';
    const req = { method: 'POST', body: { password: 'wrong-guess-password-999' } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.data.success).toBe(false);
  });

  it('rejects 1234 with HTTP 401', async () => {
    delete process.env.ADMIN_PASSWORD;
    const req = { method: 'POST', body: { password: '1234' } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.data.success).toBe(false);
  });

  it('authenticates successfully with configured user password', async () => {
    delete process.env.ADMIN_PASSWORD;
    const req = { method: 'POST', body: { password: 'x~=iXW7H)2RZLzU(k<M^y.' } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
  });

  it('authenticates successfully when password matches process.env.ADMIN_PASSWORD', async () => {
    process.env.ADMIN_PASSWORD = 'my-custom-admin-password';
    const req = { method: 'POST', body: { password: 'my-custom-admin-password' } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.token).toBeDefined();
  });

  it('authenticates successfully against directory_db.json hash when ADMIN_PASSWORD env is unset', async () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PIN;
    const req = { method: 'POST', body: { password: '0568510e983947061ab03d780ad117058058af692fea26606e03d102f62f34f4' } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
  });
});

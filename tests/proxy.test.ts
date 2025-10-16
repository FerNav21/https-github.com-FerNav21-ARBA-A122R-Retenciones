import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { AddressInfo } from 'net';
import app from '../server';

// Mock node-fetch used inside server.js
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

import fetch from 'node-fetch';

const doPost = (port: number, path: string, body: any) => {
  const data = JSON.stringify(body);
  const options = {
    hostname: '127.0.0.1',
    port,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  } as const;

  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const req = http.request(options, (res) => {
      let chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let parsed = raw;
        try { parsed = JSON.parse(raw); } catch (e) { /* keep raw */ }
        resolve({ status: res.statusCode || 0, body: parsed });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

describe('proxy server', () => {
  let server: ReturnType<typeof app.listen>;
  let port: number;

  beforeEach(() => {
    vi.resetAllMocks();
    // start server on ephemeral port
    server = app.listen(0);
    const addr = server.address() as AddressInfo;
    port = addr.port;
  });

  afterEach(() => {
    if (server && server.close) server.close();
  });

  it('POST /api/auth forwards request and returns token', async () => {
    const fakeResponse = { access_token: 'tok-1' };
    // @ts-ignore
    (fetch as any).mockImplementation(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(fakeResponse) }));

    const res = await doPost(port, '/api/auth', { username: '20304050601', password: 'CIT', environment: 'test' });

    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('tok-1');
  });

  it('POST /api/dj forwards payload and returns response', async () => {
    const fakeDJ = { idDj: 'DJ-1', estado: 'INICIADA' };
    // @ts-ignore
    (fetch as any).mockImplementation(() => Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(fakeDJ) }));

    const res = await doPost(port, '/api/dj', { token: 't', payload: { cuit: '203' }, environment: 'test' });

    expect(res.status).toBe(201);
    expect(res.body.idDj).toBe('DJ-1');
  });
});

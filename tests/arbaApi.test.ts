import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateARBA, submitVoucher } from '../services/arbaApi';

describe('arbaApi (unit)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('authenticateARBA returns access token on success', async () => {
    const fakeToken = 'tok-123';
    // @ts-ignore
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ access_token: fakeToken }),
    })) as any;

    const token = await authenticateARBA({ clientId: 'A', clientSecret: 'B', username: 'u', password: 'p' } as any, 'test');
    expect(token).toBe(fakeToken);
  });

  it('submitVoucher returns id on success', async () => {
    // @ts-ignore
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ id: 'CMP-1' }),
    })) as any;

    const result = await submitVoucher({} as any, 'token', 'test');
    expect(result.id).toBe('CMP-1');
  });
});

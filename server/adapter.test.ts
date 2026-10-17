// @vitest-environment node
// Test adaptera Cloudflare (functions/api/live/[nazwa].ts); vitest zbiera testy tylko z src/ i server/.
import { afterEach, expect, it, vi } from 'vitest';
import { onRequestGet } from '../functions/api/live/[nazwa]';

afterEach(() => vi.unstubAllGlobals());

const ctx = (nazwa: string) => ({
  request: new Request(`http://x/api/live/${nazwa}`),
  params: { nazwa },
  env: { WARSAW_API_TOKEN: 'test' },
});

it('przekazuje zapytanie do handlera o tej nazwie razem z kluczem z env', async () => {
  const fetch = vi.fn(async () => Response.json([]));
  vi.stubGlobal('fetch', fetch);
  const r = await onRequestGet(ctx('wiatr'));
  expect(r.status).toBe(200);
  const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
  expect((init.headers as Record<string, string>).Authorization).toBe('test');
});

it('nieznana nazwa daje 404', async () => {
  expect((await onRequestGet(ctx('nieistnieje'))).status).toBe(404);
});

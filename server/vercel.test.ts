// @vitest-environment node
// Test funkcji Vercela (api/live/[nazwa].ts) z rejestrem handlerów server/live/index.ts.
import { afterEach, expect, it, vi } from 'vitest';
import funkcja from '../api/live/[nazwa]';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const zapytaj = (sciezka: string) => funkcja(new Request(`https://warszawa-kryzys.example${sciezka}`));

it('/api/live/wiatr trafia do handlera z kluczem z process.env', async () => {
  vi.stubEnv('WARSAW_API_TOKEN', 'test');
  const fetch = vi.fn(async () => Response.json([]));
  vi.stubGlobal('fetch', fetch);
  const r = await zapytaj('/api/live/wiatr');
  expect(r.status).toBe(200);
  const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
  expect((init.headers as Record<string, string>).Authorization).toBe('test');
});

it('nieznana nazwa daje 404', async () => {
  expect((await zapytaj('/api/live/nieistnieje')).status).toBe(404);
});

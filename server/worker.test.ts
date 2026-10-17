// @vitest-environment node
// Test Workera (worker/index.ts) z rejestrem handlerów server/live/index.ts.
import { afterEach, expect, it, vi } from 'vitest';
import worker from '../worker';

afterEach(() => vi.unstubAllGlobals());

const zapytaj = (sciezka: string) =>
  worker.fetch(new Request(`https://warszawa-kryzys.example${sciezka}`), { WARSAW_API_TOKEN: 'test' });

it.each(['pojazdy', 'wiatr'])('/api/live/%s trafia do handlera z kluczem z env', async (nazwa) => {
  const fetch = vi.fn(async () => Response.json([]));
  vi.stubGlobal('fetch', fetch);
  const r = await zapytaj(`/api/live/${nazwa}`);
  expect(r.status).toBe(200);
  const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
  expect((init.headers as Record<string, string>).Authorization).toBe('test');
});

it('nieznana nazwa daje 404', async () => {
  expect((await zapytaj('/api/live/nieistnieje')).status).toBe(404);
});

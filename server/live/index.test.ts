// @vitest-environment node
// Ścieżka jak na produkcji: Worker → rejestr server/live/index.ts → handler.
import { afterEach, expect, it, vi } from 'vitest';
import worker from '../../worker';

afterEach(() => vi.unstubAllGlobals());

const zapytaj = (nazwa: string) => worker.fetch(new Request(`http://x/api/live/${nazwa}`), { WARSAW_API_TOKEN: 'test' });

it.each(['pojazdy', 'wiatr'])('Worker obsługuje /api/live/%s i przekazuje klucz z env', async (nazwa) => {
  const fetch = vi.fn(async () => Response.json([]));
  vi.stubGlobal('fetch', fetch);
  expect((await zapytaj(nazwa)).status).toBe(200);
  const init = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1];
  expect((init.headers as Record<string, string>).Authorization).toBe('test');
});

it('nieznana nazwa daje 404', async () => {
  expect((await zapytaj('nieistnieje')).status).toBe(404);
});

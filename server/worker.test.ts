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

it.each(['powietrze', 'rowery', 'utrudnienia'])('/api/live/%s jest w rejestrze', async (nazwa) => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 500 })));
  // 502 z handlera (źródło padło) zamiast 404 oznacza, że nazwa jest zarejestrowana
  expect((await zapytaj(`/api/live/${nazwa}`)).status).toBe(502);
});

it('nieznana nazwa daje 404', async () => {
  expect((await zapytaj('/api/live/nieistnieje')).status).toBe(404);
});

// Wersja na Vercelu przekierowuje /api/live/* do Workera, więc przeglądarka czyta odpowiedzi z innej domeny.
it.each([
  ['dane', '/api/live/wiatr', () => Response.json([])],
  ['błąd źródła', '/api/live/wiatr', () => new Response('x', { status: 500 })],
  ['zła ścieżka', '/api/live/nieistnieje', () => Response.json([])],
])('odpowiedź (%s) ma Access-Control-Allow-Origin: *', async (_, sciezka, odp) => {
  vi.stubGlobal('fetch', vi.fn(async () => odp()));
  expect((await zapytaj(sciezka)).headers.get('Access-Control-Allow-Origin')).toBe('*');
});

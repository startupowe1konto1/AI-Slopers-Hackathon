import { afterEach, expect, it, vi } from 'vitest';

vi.mock('./paczka', () => ({ stanPaczki: vi.fn(), pobierzPaczke: vi.fn() }));
import { pobierzPaczke, stanPaczki } from './paczka';
import { przygotuj, sprawdzPolaczenie } from './polaczenie';

const PACZKA = { wersja: 'x', zbudowano: '2026-10-17T18:00:00Z' };

// Podstawiony fetch odpowiada osobno na /api/live/trasa (czy nasz serwer żyje) i /api/live/wiatr (czy dane miasta działają).
const odpowiedzi = (trasa: () => Promise<Response>, wiatr: () => Promise<Response>) =>
  vi.fn(async (url: RequestInfo | URL) => (String(url).includes('/api/live/trasa') ? trasa() : wiatr()));
const brakSieci = async (): Promise<Response> => {
  throw new TypeError('fetch failed');
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  history.replaceState(null, '', '/');
});

it('serwer i /api/live/wiatr odpowiadają 200: sieć i API działają', async () => {
  const f = odpowiedzi(async () => Response.json({}), async () => Response.json([]));
  expect(await sprawdzPolaczenie(f)).toEqual({ siec: true, api: true });
});

it('serwer odpowiada (nawet 400), a wiatr 502: sieć jest, dane miasta nie', async () => {
  const f = odpowiedzi(
    async () => Response.json({ blad: 'brak parametrów' }, { status: 400 }),
    async () => Response.json({ blad: 'timeout' }, { status: 502 }),
  );
  expect(await sprawdzPolaczenie(f)).toEqual({ siec: true, api: false });
});

it('błąd sieci albo limit czasu: offline', async () => {
  expect(await sprawdzPolaczenie(vi.fn(brakSieci))).toEqual({ siec: false, api: false });
});

it('serwer odpowiada od razu, a wolne API miasta przekracza limit: sieć jest, API nie', async () => {
  const f = odpowiedzi(
    async () => Response.json({ blad: 'brak parametrów' }, { status: 400 }),
    async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    },
  );
  expect(await sprawdzPolaczenie(f)).toEqual({ siec: true, api: false });
  expect(f).toHaveBeenCalledTimes(2);
  for (const [, init] of f.mock.calls as unknown as [string, RequestInit][]) expect(init.signal).toBeInstanceOf(AbortSignal);
});

it('API nie liczy się bez sieci, nawet gdyby wiatr odpowiedział', async () => {
  const f = odpowiedzi(brakSieci, async () => Response.json([]));
  expect(await sprawdzPolaczenie(f)).toEqual({ siec: false, api: false });
});

it('?offline=1: nie pyta sieci', async () => {
  history.replaceState(null, '', '/?offline=1');
  const f = vi.fn();
  expect(await sprawdzPolaczenie(f)).toEqual({ siec: false, api: false });
  expect(f).not.toHaveBeenCalled();
});

it('online bez paczki: pobiera paczkę i opisuje postęp', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json([])));
  vi.mocked(stanPaczki).mockResolvedValueOnce(null).mockResolvedValueOnce(PACZKA);
  vi.mocked(pobierzPaczke).mockImplementation(async (f) => {
    f(1, 2);
    f(2, 2);
  });
  const postep = vi.fn();
  expect(await przygotuj(postep)).toEqual({ siec: true, api: true, paczka: PACZKA });
  expect(postep).toHaveBeenLastCalledWith('Jest połączenie. Pobieram paczkę offline: 2 z 2');
});

it('offline z paczką: nie pobiera', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new TypeError('fetch failed');
  }));
  vi.mocked(stanPaczki).mockResolvedValue(PACZKA);
  expect(await przygotuj(() => {})).toEqual({ siec: false, api: false, paczka: PACZKA });
  expect(pobierzPaczke).not.toHaveBeenCalled();
});

it('dwa wywołania naraz (StrictMode): jedno sprawdzenie (trasa + wiatr) i jedno pobranie', async () => {
  const f = vi.fn(async () => Response.json([]));
  vi.stubGlobal('fetch', f);
  vi.mocked(stanPaczki).mockResolvedValue(null);
  vi.mocked(pobierzPaczke).mockResolvedValue(undefined);
  await Promise.all([przygotuj(() => {}), przygotuj(() => {})]);
  expect(f).toHaveBeenCalledTimes(2);
  expect(pobierzPaczke).toHaveBeenCalledTimes(1);
});

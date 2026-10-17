import { afterEach, expect, it, vi } from 'vitest';

vi.mock('./paczka', () => ({ stanPaczki: vi.fn(), pobierzPaczke: vi.fn() }));
import { pobierzPaczke, stanPaczki } from './paczka';
import { przygotuj, sprawdzPolaczenie } from './polaczenie';

const PACZKA = { wersja: 'x', zbudowano: '2026-10-17T18:00:00Z' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  history.replaceState(null, '', '/');
});

it('200 z /api/live/wiatr: sieć i API działają', async () => {
  expect(await sprawdzPolaczenie(async () => Response.json([]))).toEqual({ siec: true, api: true });
});

it('502 z proxy: sieć jest, dane miasta nie', async () => {
  expect(await sprawdzPolaczenie(async () => Response.json({ blad: 'timeout' }, { status: 502 }))).toEqual({ siec: true, api: false });
});

it('błąd sieci albo limit czasu: offline', async () => {
  const f = async () => {
    throw new TypeError('fetch failed');
  };
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

it('dwa wywołania naraz (StrictMode): jedno sprawdzenie i jedno pobranie', async () => {
  const f = vi.fn(async () => Response.json([]));
  vi.stubGlobal('fetch', f);
  vi.mocked(stanPaczki).mockResolvedValue(null);
  vi.mocked(pobierzPaczke).mockResolvedValue(undefined);
  await Promise.all([przygotuj(() => {}), przygotuj(() => {})]);
  expect(f).toHaveBeenCalledTimes(1);
  expect(pobierzPaczke).toHaveBeenCalledTimes(1);
});

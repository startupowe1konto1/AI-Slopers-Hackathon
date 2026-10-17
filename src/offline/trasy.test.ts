import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { kluczTrasy, trasa, trasaProsta } from './trasy';

const A = { lat: 52.23, lon: 21.0 };
const B = { lat: 52.239, lon: 21.0 }; // ok. 1001 m na północ

const OSRM = { dystansM: 536, czasMin: 7, linia: [[21.0, 52.23], [21.001, 52.235], [21.0, 52.239]] };

function ustawSiec(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
}

beforeEach(() => clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('trasa prosta: odległość w linii prostej, czas z mnożnikiem 1,3 (pieszo 5 km/h, rowerem 15 km/h)', () => {
  const p = trasaProsta(A, B, 'pieszo');
  expect(p.dystansM).toBeGreaterThan(990);
  expect(p.dystansM).toBeLessThan(1010);
  expect(p.czasMin).toBe(16); // 1001 * 1,3 / 83 = 15,7
  expect(trasaProsta(A, B, 'rower').czasMin).toBe(5); // 1001 * 1,3 / 250 = 5,2
  expect(p.linia).toEqual([[21.0, 52.23], [21.0, 52.239]]);
  expect(p).toMatchObject({ od: A, do: B, profil: 'pieszo', zrodlo: 'prosta' });
});

it('trasa trwa co najmniej minutę', () => {
  expect(trasaProsta(A, A, 'pieszo').czasMin).toBe(1);
});

it('online: pyta /api/live/trasa, zapisuje, a za drugim razem bierze z zapisu', async () => {
  ustawSiec(true);
  const f = vi.fn(async (_url: string) => Response.json(OSRM));
  vi.stubGlobal('fetch', f);
  const t = await trasa(A, B, 'pieszo');
  expect(t).toMatchObject({ dystansM: 536, czasMin: 7, zrodlo: 'osrm', profil: 'pieszo' });
  expect(String(f.mock.calls[0][0])).toBe('/api/live/trasa?od=21.00000%2C52.23000&do=21.00000%2C52.23900&profil=pieszo');
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('osrm-zapisana');
  expect(f).toHaveBeenCalledTimes(1);
});

it('offline bez zapisu: linia prosta, bez zapytania', async () => {
  ustawSiec(false);
  const f = vi.fn();
  vi.stubGlobal('fetch', f);
  expect((await trasa(A, B, 'rower')).zrodlo).toBe('prosta');
  expect(f).not.toHaveBeenCalled();
});

it('błąd proxy (502): linia prosta, nic nie zapisuje', async () => {
  ustawSiec(true);
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ blad: 'timeout' }, { status: 502 })));
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('prosta');
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(OSRM)));
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('osrm');
});

it('klucz zapisu: profil i współrzędne z dokładnością 5 miejsc', () => {
  expect(kluczTrasy(A, { lat: 52.2390001, lon: 21.0 }, 'rower')).toBe('trasa:rower:21.00000,52.23000;21.00000,52.23900');
});

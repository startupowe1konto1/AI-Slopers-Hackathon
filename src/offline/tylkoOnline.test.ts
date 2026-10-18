import 'fake-indexeddb/auto';
import { clear, keys, set } from 'idb-keyval';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fetchLive } from './live-cache';
import { trasa } from './trasy';
import { usunZapisyOffline } from './tryb';

// Wersja tylko online (VITE_TYLKO_ONLINE=1, Vercel): nic nie zostaje w telefonie do pracy bez sieci.
const ustawSiec = (online: boolean) => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
const A = { lat: 52.23, lon: 21.0 };
const B = { lat: 52.239, lon: 21.0 };

beforeEach(async () => {
  await clear();
  vi.stubEnv('VITE_TYLKO_ONLINE', '1');
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('dane na żywo nie zostają zapisane na później', async () => {
  ustawSiec(true);
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ dane: [1], stanNa: '2026-10-18T07:00:00Z', zrodlo: 't', zCache: false })));
  expect(await fetchLive('wiatr')).not.toBeNull();
  ustawSiec(false);
  expect(await fetchLive('wiatr')).toBeNull();
});

it('trasa z OSRM nie zostaje zapisana na później', async () => {
  ustawSiec(true);
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ dystansM: 536, czasMin: 7, linia: [[21.0, 52.23], [21.0, 52.239]] })));
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('osrm');
  ustawSiec(false);
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('prosta');
});

it('sprząta zapisy offline z wcześniejszej wizyty, adresy zostają', async () => {
  await set('miejsca', []);
  await set('live:wiatr', {});
  await set('trasa:pieszo:1,2;3,4', {});
  localStorage.setItem('paczka', '{}');
  const removeEntry = vi.fn(async () => {});
  Object.defineProperty(navigator, 'storage', { value: { getDirectory: async () => ({ removeEntry }) }, configurable: true });
  await usunZapisyOffline();
  expect(await keys()).toEqual(['miejsca']);
  expect(localStorage.getItem('paczka')).toBeNull();
  expect(removeEntry).toHaveBeenCalledWith('warszawa.pmtiles');
});

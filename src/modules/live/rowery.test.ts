import { afterEach, expect, it, vi } from 'vitest';
import type { StacjaRowerowa } from '../../../server/live/typy';

vi.mock('../../offline/live-cache', () => ({ fetchLive: vi.fn() }));
import { fetchLive } from '../../offline/live-cache';
import { najblizszaStacjaZRowerami } from './rowery';

const st = (nazwa: string, lat: number, rowery: number): StacjaRowerowa => ({ nazwa, lat, lon: 21.0, rowery, wypozycza: true });
const stan = (dane: StacjaRowerowa[], zCache = false) => ({ dane, stanNa: '2026-10-17T16:40:00Z', zrodlo: 'Veturilo', zCache });
const W = { lat: 52.23, lon: 21.0 };

afterEach(() => vi.clearAllMocks());

it('najbliższa stacja z wolnymi rowerami w 3 km', async () => {
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Pusta', 52.2301, 0), st('Daleka', 52.26, 5), st('Bliska', 52.232, 3)]));
  expect(await najblizszaStacjaZRowerami(W)).toEqual({ nazwa: 'Bliska', wsp: { lat: 52.232, lon: 21.0 }, rowery: 3, odlegloscM: 222 });
});

it('zapisany stan (bez sieci), brak danych albo brak stacji w 3 km: null', async () => {
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Bliska', 52.232, 3)], true));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
  vi.mocked(fetchLive).mockResolvedValue(null);
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Daleko', 52.3, 9)]));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
});

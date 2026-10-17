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

it('zapisany stan (zCache, bez sieci): null', async () => {
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Bliska', 52.232, 3)], true));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
});

it('brak danych (fetchLive zwraca null): null', async () => {
  vi.mocked(fetchLive).mockResolvedValue(null);
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
});

it('błąd pobrania (fetchLive odrzuca): null', async () => {
  vi.mocked(fetchLive).mockRejectedValue(new Error('x'));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
});

it('brak stacji z rowerami w 3 km: null', async () => {
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Daleko', 52.3, 9)]));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
});

it('stacja ok. 2,9 km od punktu jest w promieniu 3 km', async () => {
  // 0,0260° szerokości to ok. 2,89 km
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Na granicy', 52.256, 4)]));
  expect(await najblizszaStacjaZRowerami(W)).toMatchObject({ nazwa: 'Na granicy', rowery: 4 });
});

it('stacja ok. 3,1 km od punktu jest poza promieniem 3 km: null', async () => {
  // 0,0279° szerokości to ok. 3,10 km
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Za daleko', 52.2579, 4)]));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
});

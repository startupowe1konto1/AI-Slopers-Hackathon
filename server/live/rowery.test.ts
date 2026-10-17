// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { StanLive } from '../../src/contracts';
import type { StacjaRowerowa } from './typy';
import { handler, mapujRowery } from './rowery';

const probka = (plik: string) => JSON.parse(readFileSync(`dane/probki/${plik}`, 'utf-8'));
const info = probka('veturilo_station_information.json');
const status = probka('veturilo_station_status.json');

describe('mapujRowery', () => {
  it('łączy opis stacji ze stanem po station_id', () => {
    const wynik = mapujRowery(info.data.stations, status.data.stations);
    // próbka z 17.10: 349 stacji w obu plikach
    expect(wynik).toHaveLength(349);
    expect(wynik.find((s) => s.nazwa === 'Koneser')).toEqual({
      nazwa: 'Koneser',
      lat: 52.25602,
      lon: 21.046219,
      rowery: 20,
      wypozycza: true,
    });
  });

  it('pomija stację bez stanu', () => {
    const wynik = mapujRowery(
      [
        { station_id: '1', name: 'A', lat: 52.2, lon: 21 },
        { station_id: '2', name: 'B', lat: 52.3, lon: 21.1 },
      ],
      [{ station_id: '2', num_bikes_available: 3, is_renting: true, is_installed: true }],
    );
    expect(wynik.map((s) => s.nazwa)).toEqual(['B']);
  });

  it('stacja, która nie wypożycza, ma wypozycza = false', () => {
    const [s] = mapujRowery(
      [{ station_id: '1', name: 'A', lat: 52.2, lon: 21 }],
      [{ station_id: '1', num_bikes_available: 5, is_renting: false, is_installed: true }],
    );
    expect(s.wypozycza).toBe(false);
  });
});

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('pobiera oba pliki GBFS i zwraca StanLive z cache 60 s', async () => {
    vi.stubGlobal('fetch', async (url: string) =>
      Response.json(url.endsWith('station_information.json') ? info : status),
    );
    const r = await handler(new Request('http://x/api/live/rowery'), {});
    const stan = (await r.json()) as StanLive<StacjaRowerowa[]>;
    expect(r.status).toBe(200);
    expect(stan.dane).toHaveLength(349);
    expect(stan.zrodlo).toBe('Veturilo (GBFS nextbike)');
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=60');
  });

  it('gdy sieć zawiedzie, zwraca 502 timeout', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed');
    });
    const r = await handler(new Request('http://x/api/live/rowery'), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'timeout' });
  });
});

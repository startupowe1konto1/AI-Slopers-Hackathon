import { describe, expect, it } from 'vitest';
import type { Pojazd, Wiatr } from '../../contracts';
import { godzina, kierunekNazwa, najblizszaStacja, podsumuj, wOkolicy } from './okolica';

// Plac Defilad; 0,009° szerokości to ok. 1 km
const CENTRUM = { lat: 52.2317, lon: 21.0064 };
const poj = (linia: string, typ: Pojazd['typ'], dLat: number): Pojazd => ({
  linia,
  typ,
  lat: CENTRUM.lat + dLat,
  lon: CENTRUM.lon,
  czas: '2026-10-17 14:52:05',
});

describe('wOkolicy', () => {
  it('zwraca tylko pojazdy do podanego promienia', () => {
    const blisko = poj('9', 'tramwaj', 0.008); // ok. 890 m
    const daleko = poj('128', 'autobus', 0.0095); // ok. 1060 m
    expect(wOkolicy([blisko, daleko], CENTRUM, 1000)).toEqual([blisko]);
  });
});

describe('podsumuj', () => {
  it('liczy autobusy i tramwaje i zwraca linie bez powtórzeń w kolejności numerów', () => {
    const p = [poj('9', 'tramwaj', 0), poj('128', 'autobus', 0), poj('22', 'tramwaj', 0), poj('9', 'tramwaj', 0), poj('N01', 'autobus', 0)];
    expect(podsumuj(p)).toEqual({ autobusy: 2, tramwaje: 3, linie: ['9', '22', '128', 'N01'] });
  });

  it('dla pustej listy zwraca zera', () => {
    expect(podsumuj([])).toEqual({ autobusy: 0, tramwaje: 0, linie: [] });
  });
});

describe('najblizszaStacja', () => {
  const st = (stacja: string, lat: number, lon: number): Wiatr => ({ stacja, lat, lon, kierunekDeg: 90, predkoscMs: 1, czas: '2026-10-17 14:40:00' });

  it('wybiera stację najbliższą punktowi', () => {
    const torwar = st('Stacja Torwar', 52.2244, 21.0343);
    const bielany = st('Stacja Bielany', 52.29241, 20.97288);
    expect(najblizszaStacja([bielany, torwar], CENTRUM)).toBe(torwar);
  });

  it('bez stacji zwraca null', () => {
    expect(najblizszaStacja([], CENTRUM)).toBeNull();
  });
});

describe('kierunekNazwa', () => {
  it('zamienia stopnie na jeden z 8 kierunków', () => {
    expect([0, 44, 46, 90, 180, 237, 270, 338, 360].map(kierunekNazwa)).toEqual(['N', 'NE', 'NE', 'E', 'S', 'SW', 'W', 'N', 'N']);
  });
});

describe('godzina', () => {
  it('pokazuje czas warszawski HH:MM niezależnie od strefy komputera', () => {
    expect(godzina('2026-10-17T12:56:01.528Z')).toBe('14:56');
  });
});

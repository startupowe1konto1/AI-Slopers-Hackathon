import { describe, expect, it, vi } from 'vitest';
import type { Pojazd, Wiatr } from '../../contracts';
import type { StacjaRowerowa, Utrudnienie } from '../../../server/live/typy';
import { dzien, godzina, kierunekNazwa, najblizszaStacja, odleglosc, podsumuj, rowerowe, terazWarszawa, utrudnieniaWOkolicy, wOkolicy } from './okolica';

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

describe('najblizszaStacja dla innych źródeł', () => {
  it('działa dla każdego typu ze współrzędnymi', () => {
    const a = { nazwa: 'A', lat: 52.24, lon: 21.0064 };
    const b = { nazwa: 'B', lat: 52.2318, lon: 21.0064 };
    expect(najblizszaStacja([a, b], CENTRUM)).toBe(b);
  });
});

describe('rowerowe', () => {
  const st = (nazwa: string, dLat: number, rowery: number, wypozycza = true): StacjaRowerowa => ({ nazwa, lat: CENTRUM.lat + dLat, lon: CENTRUM.lon, rowery, wypozycza });

  it('3 najbliższe stacje do 1 km, które mają rowery i wypożyczają', () => {
    const lista = [st('daleko', 0.0095, 5), st('pusta', 0.001, 0), st('zamknięta', 0.001, 4, false), st('c', 0.003, 1), st('a', 0.001, 2), st('b', 0.002, 7), st('d', 0.004, 3)];
    expect(rowerowe(lista, CENTRUM).map((s) => s.nazwa)).toEqual(['a', 'b', 'c']);
  });
});

describe('utrudnieniaWOkolicy', () => {
  const u = (id: string, linie: [number, number][][], punkty: [number, number][] = []): Utrudnienie => ({ id, nazwa: id, od: '2026-10-01 00:00:00', do: '2026-12-31 00:00:00', ulice: [], linie, punkty });

  it('liczy odległość do odcinka, nie tylko do jego końców', () => {
    // odcinek ok. 4 km w poprzek, 0,004° (ok. 445 m) na północ od centrum
    const przez = u('przez', [[[CENTRUM.lon - 0.03, CENTRUM.lat + 0.004], [CENTRUM.lon + 0.03, CENTRUM.lat + 0.004]]]);
    const daleko = u('daleko', [[[CENTRUM.lon, CENTRUM.lat + 0.03], [CENTRUM.lon + 0.01, CENTRUM.lat + 0.03]]]);
    const punkt = u('punkt', [], [[CENTRUM.lon, CENTRUM.lat + 0.01]]);
    expect(utrudnieniaWOkolicy([daleko, punkt, przez], CENTRUM, 2000).map((x) => [x.u.id, Math.round(x.odlegloscM / 10) * 10])).toEqual([
      ['przez', 440],
      ['punkt', 1110],
    ]);
  });
});

describe('kierunekNazwa', () => {
  it('zamienia stopnie na jeden z 8 kierunków', () => {
    expect([0, 44, 46, 90, 180, 237, 270, 338, 360].map(kierunekNazwa)).toEqual(['N', 'NE', 'NE', 'E', 'S', 'SW', 'W', 'N', 'N']);
  });
});

describe('formatowanie', () => {
  it('odległość: metry co 10 do 1 km, dalej km z jednym miejscem po przecinku', () => {
    expect([222.4, 995, 1384, 12_340].map(odleglosc)).toEqual(['220 m', '1,0 km', '1,4 km', '12,3 km']);
  });

  it('dzień z daty API, a pusta data to „do odwołania”', () => {
    expect(dzien('2026-12-31 09:02:53')).toBe('31.12');
    expect(dzien('')).toBeNull();
  });

  it('teraz w Warszawie w formacie API', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-17T13:30:05Z'));
    expect(terazWarszawa()).toBe('2026-10-17 15:30:05');
    vi.useRealTimers();
  });
});

describe('godzina', () => {
  it('pokazuje czas warszawski HH:MM niezależnie od strefy komputera', () => {
    expect(godzina('2026-10-17T12:56:01.528Z')).toBe('14:56');
  });
});

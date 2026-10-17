import { afterEach, expect, it } from 'vitest';
import type { FeatureCollection } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Pojazd } from '../../contracts';
import type { StacjaRowerowa, Utrudnienie } from '../../../server/live/typy';
import { dodajWarstwy, ustawDym, ustawPojazdy, ustawRowery, ustawUtrudnienia, wybierzNaMapie } from './warstwy';

const P: Pojazd[] = [
  { linia: '9', typ: 'tramwaj', lat: 52.23, lon: 21.0, czas: '2026-10-17 14:52:05' },
  { linia: '128', typ: 'autobus', lat: 52.24, lon: 21.01, czas: '2026-10-17 14:52:01' },
];

function atrapa() {
  const zrodla = new Map<string, { data: FeatureCollection }>();
  const warstwy = new Set<string>();
  const kursor = { cursor: '' };
  let klik: ((e: { lngLat: { lat: number; lng: number } }) => void) | undefined;
  const map = {
    addSource: (id: string, s: { data: FeatureCollection }) => void zrodla.set(id, s),
    addLayer: (l: { id: string }) => void warstwy.add(l.id),
    getSource: (id: string) => {
      const s = zrodla.get(id);
      return s && { setData: (d: FeatureCollection) => void (s.data = d) };
    },
    getLayer: (id: string) => (warstwy.has(id) ? { id } : undefined),
    removeLayer: (id: string) => void warstwy.delete(id),
    removeSource: (id: string) => void zrodla.delete(id),
    once: (_typ: string, f: typeof klik) => void (klik = f),
    getCanvas: () => ({ style: kursor }),
  };
  const dane = (id: string) => zrodla.get(id)!.data;
  return { map: map as unknown as MapLibreMap, zrodla, warstwy, dane, kursor, kliknij: (lat: number, lng: number) => klik?.({ lngLat: { lat, lng } }) };
}

let sprzatnij: (() => void) | undefined;
afterEach(() => sprzatnij?.());

it('dodaje puste źródła: pojazdy, dym, utrudnienia, rowery', () => {
  const { map, zrodla } = atrapa();
  sprzatnij = dodajWarstwy(map);
  expect([...zrodla.keys()].sort()).toEqual(['live-dym', 'live-pojazdy', 'live-rowery', 'live-utrudnienia']);
  expect([...zrodla.values()].every((s) => s.data.features.length === 0)).toBe(true);
});

it('ustawPojazdy podmienia dane na mapie: punkt [lon, lat], linia i typ', () => {
  const { map, dane } = atrapa();
  sprzatnij = dodajWarstwy(map);
  ustawPojazdy(P);
  const [f] = dane('live-pojazdy').features;
  expect(f.geometry).toEqual({ type: 'Point', coordinates: [21.0, 52.23] });
  expect(f.properties).toEqual({ linia: '9', typ: 'tramwaj' });
});

it('ustawDym rysuje stożek i punkt, a null czyści warstwę', () => {
  const { map, dane } = atrapa();
  sprzatnij = dodajWarstwy(map);
  const ring: [number, number][] = [[21, 52.2], [21.04, 52.21], [21.04, 52.19], [21, 52.2]];
  ustawDym({ lat: 52.2, lon: 21 }, ring);
  expect(dane('live-dym').features.map((f) => f.geometry.type)).toEqual(['Polygon', 'Point']);
  ustawDym({ lat: 52.2, lon: 21 }, null);
  expect(dane('live-dym').features.map((f) => f.geometry.type)).toEqual(['Point']);
  ustawDym(null, null);
  expect(dane('live-dym').features).toEqual([]);
});

it('ustawUtrudnienia rysuje linie i punkty, ustawRowery stacje z liczbą rowerów', () => {
  const { map, dane } = atrapa();
  sprzatnij = dodajWarstwy(map);
  const u: Utrudnienie = { id: '1', nazwa: 'Remont', od: '', do: '', ulice: [], linie: [[[21, 52.2], [21.01, 52.21]]], punkty: [[21.02, 52.22]] };
  ustawUtrudnienia([u]);
  expect(dane('live-utrudnienia').features.map((f) => f.geometry.type)).toEqual(['LineString', 'Point']);
  const r: StacjaRowerowa = { nazwa: 'Koneser', lat: 52.256, lon: 21.046, rowery: 20, wypozycza: true };
  ustawRowery([r]);
  expect(dane('live-rowery').features[0].properties).toEqual({ nazwa: 'Koneser', rowery: 20 });
});

it('wybierzNaMapie czeka na kliknięcie i zwraca jego współrzędne', async () => {
  const { map, kliknij, kursor } = atrapa();
  sprzatnij = dodajWarstwy(map);
  const wybor = wybierzNaMapie();
  expect(kursor.cursor).toBe('crosshair');
  kliknij(52.21, 21.03);
  expect(await wybor).toEqual({ lat: 52.21, lon: 21.03 });
  expect(kursor.cursor).toBe('');
});

it('bez mapy wybierzNaMapie zwraca null; po sprzątaniu ustawianie nic nie robi', async () => {
  const { map, zrodla, warstwy } = atrapa();
  dodajWarstwy(map)();
  expect(zrodla.size).toBe(0);
  expect(warstwy.size).toBe(0);
  expect(() => ustawPojazdy(P)).not.toThrow();
  expect(await wybierzNaMapie()).toBeNull();
});

it('dane ustawione, zanim mapa się załaduje, pojawiają się po dodaniu warstw', () => {
  const { map, dane } = atrapa();
  ustawDym({ lat: 52.2, lon: 21 }, null); // np. punkt dymu z poprzedniej wizyty
  sprzatnij = dodajWarstwy(map);
  expect(dane('live-dym').features.map((f) => f.geometry.type)).toEqual(['Point']);
});

it('po sprzątaniu nowa mapa startuje bez starych danych', () => {
  const pierwsza = atrapa();
  dodajWarstwy(pierwsza.map);
  ustawPojazdy(P);
  dodajWarstwy(pierwsza.map)();
  ustawPojazdy([]);
  const druga = atrapa();
  sprzatnij = dodajWarstwy(druga.map);
  expect(druga.dane('live-pojazdy').features).toEqual([]);
});

import { describe, it, expect } from 'vitest';
import type { MiejsceUzytkownika, RolaMiejsca, TrasaMin } from '../../contracts';
import { zbuduj, trasyZ, opisTrasy, type Przystanek } from './trasy';

const miejsce = (rola: RolaMiejsca, lat: number, lon: number): MiejsceUzytkownika => ({
  rola,
  etykieta: rola,
  adres: { id: rola, ulica: 'ul. Testowa', numer: '1', dzielnica: 'Wola', lat, lon },
});

// Dom i praca ok. 2,2 km od siebie (ta sama długość geograficzna).
const DOM = miejsce('dom', 52.23, 21.0);
const PRACA = miejsce('praca', 52.25, 21.0);

const P: Przystanek[] = [
  { id: 's1', nazwa: 'Przy domu 01', lat: 52.231, lon: 21.0, linie: ['128', '157'] }, // ~111 m od domu
  { id: 's2', nazwa: 'Przy pracy 01', lat: 52.248, lon: 21.0, linie: ['128', '999'] }, // ~222 m od pracy
  { id: 's3', nazwa: 'Przy domu 02', lat: 52.229, lon: 21.001, linie: ['500'] }, // linia tylko przy domu
  { id: 's4', nazwa: 'Daleko 01', lat: 52.27, lon: 21.0, linie: ['157'] }, // ~2,2 km od pracy
];

describe('trasyZ', () => {
  const idx = zbuduj(P);

  it('linia wspólna dla przystanku przy starcie i przystanku do 500 m od celu trafia do wyniku', () => {
    const [t] = trasyZ(idx, [DOM, PRACA]);
    expect(t.z).toBe('dom');
    expect(t.do).toBe('praca');
    expect(t.autobusy).toHaveLength(1);
    expect(t.autobusy[0].przystanek).toBe('Przy domu 01');
    expect(t.autobusy[0].linie).toEqual(['128']);
    expect(t.autobusy[0].odlegloscM).toBeGreaterThan(100);
    expect(t.autobusy[0].odlegloscM).toBeLessThan(120);
  });

  it('linia tylko przy starcie albo przy przystanku dalej niż 500 m od celu nie trafia do wyniku', () => {
    const [t] = trasyZ(idx, [DOM, PRACA]);
    const linie = t.autobusy.flatMap((a) => a.linie);
    expect(linie).not.toContain('500');
    expect(linie).not.toContain('157');
  });

  it('czas pieszo 5 km/h i rowerem 15 km/h z dopłatą 30% na krętość drogi', () => {
    const [t] = trasyZ(idx, [DOM, PRACA]);
    expect(t.dystansM).toBeGreaterThan(2215);
    expect(t.dystansM).toBeLessThan(2230);
    expect(t.pieszoMin).toBe(Math.round((t.dystansM * 1.3) / 83));
    expect(t.rowerMin).toBe(Math.round((t.dystansM * 1.3) / 250));
  });

  it('liczy tylko pary, dla których oba miejsca są zapisane, w stałej kolejności', () => {
    const PRZEDSZKOLE = miejsce('przedszkole', 52.24, 21.01);
    const BLISKA = miejsce('bliska_osoba', 52.22, 20.99);
    const pary = trasyZ(idx, [BLISKA, PRACA, DOM, PRZEDSZKOLE]).map((t) => `${t.z}>${t.do}`);
    expect(pary).toEqual(['dom>praca', 'dom>przedszkole', 'praca>przedszkole', 'dom>bliska_osoba']);
    expect(trasyZ(idx, [DOM])).toEqual([]);
  });
});

describe('trasyZ: przystanki w promieniu 600 m, nie tylko 3 najbliższe', () => {
  // Jak u Kasi na Bemowie: 3 najbliższe przystanki nie mają linii do celu, czwarty (w zasięgu 600 m) ma.
  const BLISKO: Przystanek[] = [
    { id: 'b1', nazwa: 'Blisko 01', lat: 52.2305, lon: 21.0, linie: ['129'] }, // ~56 m
    { id: 'b2', nazwa: 'Blisko 02', lat: 52.2295, lon: 21.0, linie: ['129'] }, // ~56 m
    { id: 'b3', nazwa: 'Blisko 03', lat: 52.231, lon: 21.0, linie: ['189'] }, // ~111 m
    { id: 'b4', nazwa: 'Dalej 01', lat: 52.234, lon: 21.0, linie: ['105', '129'] }, // ~445 m
    { id: 'b5', nazwa: 'Dalej 02', lat: 52.2345, lon: 21.0, linie: ['105'] }, // ~500 m, ta sama linia dalej
    { id: 'c1', nazwa: 'Przy pracy 01', lat: 52.249, lon: 21.0, linie: ['105'] },
  ];
  const idx = zbuduj(BLISKO);

  it('znajduje linię z dalszego przystanku do 600 m, gdy 3 najbliższe jej nie mają', () => {
    const [t] = trasyZ(idx, [DOM, PRACA]);
    expect(t.autobusy.map((a) => [a.przystanek, a.linie])).toEqual([['Dalej 01', ['105']]]);
  });

  it('każdą linię podaje tylko przy najbliższym przystanku', () => {
    const [t] = trasyZ(idx, [DOM, PRACA]);
    expect(t.autobusy.flatMap((a) => a.linie)).toEqual(['105']);
  });
});

describe('opisTrasy', () => {
  const baza: TrasaMin = { z: 'dom', do: 'praca', dystansM: 2224, pieszoMin: 35, rowerMin: 12, autobusy: [] };

  it('podaje czas pieszo i rowerem', () => {
    expect(opisTrasy(baza)[0]).toBe('Pieszo ~35 min, rowerem ~12 min');
  });

  it('przy autobusach mówi, co stoi przy blackoucie i którymi liniami dojechać', () => {
    const t = { ...baza, autobusy: [{ przystanek: 'Przy domu 01', odlegloscM: 111, linie: ['128', '157'] }] };
    expect(opisTrasy(t)[1]).toBe('Przy blackoucie: tramwaje, metro i SKM stoją. Autobusy z przystanku Przy domu 01 (111 m): linie 128, 157');
  });

  it('bez wspólnej linii mówi o braku bezpośredniego autobusu', () => {
    expect(opisTrasy(baza)[1]).toBe('Przy blackoucie: tramwaje, metro i SKM stoją. Brak bezpośredniego autobusu. Pieszo ~35 min.');
  });
});

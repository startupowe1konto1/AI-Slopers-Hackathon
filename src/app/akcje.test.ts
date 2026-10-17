import { afterEach, expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';
import { etykietaAkcji, opisTrasy, wykonajNaMapie } from './akcje';

const t: Trasa = { od: { lat: 52.23, lon: 21 }, do: { lat: 52.24, lon: 21 }, profil: 'pieszo', dystansM: 536, czasMin: 7, linia: [], zrodlo: 'osrm' };

afterEach(() => {
  vi.restoreAllMocks();
});

it('opis trasy po ulicach, z zapisu i w linii prostej', () => {
  expect(opisTrasy(t)).toBe('540 m po ulicach, pieszo ok. 7 min.');
  expect(opisTrasy({ ...t, zrodlo: 'osrm-zapisana', profil: 'rower', dystansM: 7240, czasMin: 30 })).toBe('7,2 km po ulicach, rowerem ok. 30 min (trasa zapisana w telefonie).');
  expect(opisTrasy({ ...t, zrodlo: 'prosta' })).toBe('540 m w linii prostej, pieszo ok. 7 min. Nie mamy teraz trasy po ulicach.');
});

it('etykiety przycisków akcji', () => {
  expect(etykietaAkcji({ typ: 'trasa', cel: t.do, nazwa: 'ul. Garwolińska 9' })).toBe('Trasa pieszo: ul. Garwolińska 9');
  expect(etykietaAkcji({ typ: 'trasa', cel: t.do, nazwa: 'Dom', profil: 'rower' })).toBe('Trasa rowerem: Dom');
  expect(etykietaAkcji({ typ: 'mapa', pokaz: () => () => {} })).toBe('Pokaż na mapie');
  expect(etykietaAkcji({ typ: 'przycisk', etykieta: 'Widzę dym', wykonaj: () => {} })).toBe('Widzę dym');
});

// Atrapa mapy: styl gotowy albo nie, jednorazowe zdarzenia wysyłane ręcznie.
function atrapaMapy(gotowa: boolean) {
  const sluchacze = new Map<string, () => void>();
  const mapa = {
    isStyleLoaded: () => gotowa,
    once: (typ: string, f: () => void) => void sluchacze.set(typ, f),
    off: (typ: string, f: () => void) => void (sluchacze.get(typ) === f && sluchacze.delete(typ)),
  };
  const wyslij = (typ: string) => {
    const f = sluchacze.get(typ);
    sluchacze.delete(typ);
    f?.();
  };
  return { mapa: mapa as unknown as MapLibreMap, wyslij };
}
const od = { lat: 52.23, lon: 21 };

it('rysuje dopiero przy gotowym stylu; sprzątanie przed narysowaniem nic nie rysuje', async () => {
  const a = atrapaMapy(false);
  const pokaz = vi.fn(() => () => {});
  await wykonajNaMapie({ typ: 'mapa', pokaz }, a.mapa, od);
  expect(pokaz).not.toHaveBeenCalled();
  a.wyslij('idle');
  expect(pokaz).toHaveBeenCalledTimes(1);

  const b = atrapaMapy(false);
  const pokaz2 = vi.fn(() => () => {});
  const w = await wykonajNaMapie({ typ: 'mapa', pokaz: pokaz2 }, b.mapa, od);
  w.sprzatanie();
  b.wyslij('idle');
  expect(pokaz2).not.toHaveBeenCalled();
});

it('wyjątek z modułu zostaje w karcie, a sprzątanie wykonuje się tylko raz', async () => {
  const blad = vi.spyOn(console, 'error').mockImplementation(() => {});
  const a = atrapaMapy(true);
  const zla = await wykonajNaMapie({ typ: 'mapa', pokaz: () => { throw new Error('Style is not done loading'); } }, a.mapa, od);
  expect(blad).toHaveBeenCalledTimes(1);
  expect(() => zla.sprzatanie()).not.toThrow();

  const sprzatnij = vi.fn();
  const w = await wykonajNaMapie({ typ: 'mapa', pokaz: () => sprzatnij }, a.mapa, od);
  w.sprzatanie();
  w.sprzatanie();
  expect(sprzatnij).toHaveBeenCalledTimes(1);
});

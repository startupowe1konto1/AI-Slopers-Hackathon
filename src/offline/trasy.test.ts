import { expect, it } from 'vitest';
import { trasa, trasaProsta } from './trasy';

const A = { lat: 52.23, lon: 21.0 };
const B = { lat: 52.239, lon: 21.0 }; // ok. 1001 m na północ

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

it('trasa() w V1 zwraca linię prostą', async () => {
  expect((await trasa(A, B, 'rower')).zrodlo).toBe('prosta');
});

import { expect, it } from 'vitest';
import { najblizszyIndeks, type PaczkaAdresow } from './szukaj';

const p: PaczkaAdresow = {
  ulice: ['Grochowska'], dzielnice: ['Praga-Południe'], id: ['a', 'b'], u: [0, 0], nr: ['200', '10'], dz: [0, 0],
  lat: [52.2457, 52.25], lon: [21.0874, 21.06],
};

it('zwraca indeks najbliższego adresu', () => {
  expect(najblizszyIndeks(p, { lat: 52.2458, lon: 21.0875 })).toBe(0);
  expect(najblizszyIndeks(p, { lat: 52.2499, lon: 21.0601 })).toBe(1);
});

it('dalej niż 1 km od każdego adresu (poza Warszawą) zwraca -1', () => {
  expect(najblizszyIndeks(p, { lat: 52.4, lon: 21.0874 })).toBe(-1);
});

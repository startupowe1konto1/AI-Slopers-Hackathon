import { describe, it, expect } from 'vitest';
import { normalizuj, szukaj } from './szukaj';

const pack = {
  ulice: ['al. Jerozolimskie', 'ul. Grochowska', 'ul. Powstańców Śląskich'],
  dzielnice: ['Ochota', 'Praga-Południe', 'Bemowo'],
  id: ['1', '2', '3', '4'], u: [0, 1, 2, 2], nr: ['100', '200', '10', '10A'], dz: [0, 1, 2, 2],
  lat: [52.22, 52.24, 52.23, 52.231], lon: [20.98, 21.09, 20.91, 20.911],
};

describe('szukaj', () => {
  it('ignoruje polskie znaki i przedrostki', () => {
    expect(normalizuj('ul. Powstańców Śląskich')).toBe('powstancow slaskich');
  });
  it('znajduje ulicę i numer', () => {
    expect(szukaj(pack, 'powstancow 10', 5).map((a) => a.numer)).toEqual(['10', '10A']);
  });
  it('dokładny numer pierwszy', () => {
    expect(szukaj(pack, 'Powstańców Śląskich 10A', 5)[0].id).toBe('4');
  });
  it('sama ulica zwraca adresy', () => {
    expect(szukaj(pack, 'jerozolimskie', 5)[0].ulica).toBe('al. Jerozolimskie');
  });
  it('pusty wynik dla nieznanej ulicy', () => {
    expect(szukaj(pack, 'nieistniejaca 5', 5)).toEqual([]);
  });
});

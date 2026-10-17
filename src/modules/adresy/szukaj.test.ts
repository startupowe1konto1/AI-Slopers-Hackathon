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

// Nazwy ulic dokładnie tak, jak są w paczce z WFS (cudzysłowy, inicjały, stopnie, łączniki).
// Ostatnie cztery to pułapki: ich inicjał pasuje do pierwszej litery szukanej ulicy.
const prawdziwe = {
  ulice: ['al. „Solidarności”', 'Al. Jerozolimskie', 'ul. A. Mickiewicza', 'ul. gen. T. Bora-Komorowskiego', 'ul. Puławska', 'Rondo I. Daszyńskiego',
    'ul. S. Skarżyńskiego', 'al. J. Waszyngtona', 'ul. K. I. Gałczyńskiego', 'ul. D. Kłuszyńskiej'],
  dzielnice: ['Wola'],
  id: ['s', 'j', 'm', 'k', 'p', 'd', 'x1', 'x2', 'x3', 'x4'], u: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  nr: ['1', '100', '1', '10', '1', '1', '1', '100', '10', '1'], dz: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  lat: Array(10).fill(52.2), lon: Array(10).fill(21.0),
};
const id = (q: string) => szukaj(prawdziwe, q, 5).map((a) => a.id);

describe('szukaj na prawdziwych nazwach ulic', () => {
  it('pomija cudzysłowy i kropki', () => {
    expect(normalizuj('al. „Solidarności”')).toBe('solidarnosci');
    expect(id('Solidarności 1')).toEqual(['s']);
  });
  it('rozumie pełne przedrostki: aleja, aleje, ulica', () => {
    expect(id('aleja Solidarności 1')).toEqual(['s']);
    expect(id('Aleje Jerozolimskie 100')).toEqual(['j']);
    expect(id('ulica Puławska 1')).toEqual(['p']);
  });
  it('pełne imię pasuje do inicjału w nazwie ulicy', () => {
    expect(id('Adama Mickiewicza 1')).toEqual(['m']);
    expect(id('Ignacego Daszyńskiego 1')).toEqual(['d']);
    expect(id('Mickiewicza 1')).toEqual(['m']);
  });
  it('znajduje część nazwy z łącznikiem', () => {
    expect(id('Komorowskiego 10')).toEqual(['k']);
    expect(id('Bora-Komorowskiego 10')).toEqual(['k']);
  });
  it('sam inicjał nie wystarcza: ulica musi pasować choć jednym pełnym słowem', () => {
    expect(id('Solidarności 1')).toEqual(['s']);
    expect(id('Aleje Jerozolimskie 100')).toEqual(['j']);
    expect(id('Komorowskiego 10')).toEqual(['k']);
    expect(id('rondo Daszyńskiego 1')).toEqual(['d']);
  });
});

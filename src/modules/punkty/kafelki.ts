import type { Kafelek, RodzajPunktu } from '../../contracts';
import { RODZAJE } from './rodzaje';
import { dodajWarstweRodzaju } from './warstwy';

// Kolejność i krótkie etykiety z HANDOFF-v3 §2.
const KAFELKI: [RodzajPunktu, string][] = [
  ['schronienie_psp', 'Miejsca schronienia PSP'],
  ['aed', 'AED'],
  ['sor', 'SOR'],
  ['apteka', 'Apteki'],
  ['przychodnia', 'Przychodnie'],
  ['toaleta', 'Toalety'],
  ['metro', 'Metro'],
];

export const kafelki: Kafelek[] = KAFELKI.map(([id, etykieta]) => ({
  id,
  etykieta,
  kolor: RODZAJE.find((r) => r.rodzaj === id)?.kolor ?? '#be185d',
  dodajWarstwe: (map) => dodajWarstweRodzaju(map, id),
}));

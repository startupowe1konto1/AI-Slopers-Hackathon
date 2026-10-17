import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { dodajWarstwy } from './warstwy';

// Interfejs dla innych modułów (SPEC.md §5), np. karta do wydruku O2.
export { linkPSP, najblizsze } from './najblizsze';

export const modul: Modul = {
  id: 'punkty',
  nazwa: 'Pomoc',
  Panel,
  dodajWarstwy,
  // Atrapy z V1. Prawdziwe karty: P2, P3; kafelki: P4.
  wskazowki: async () => [
    { id: 'schronienie', kolejnosc: 20, tytul: 'Najbliższe miejsce schronienia według PSP', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
    { id: 'medyczna', kolejnosc: 30, tytul: 'Pomoc medyczna', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
  kafelki: [],
};

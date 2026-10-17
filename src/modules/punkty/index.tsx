import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { dodajWarstwy } from './warstwy';
import { wskazowkiPunktow } from './wskazowki';

// Interfejs dla innych modułów (SPEC.md §5), np. karta do wydruku O2.
export { linkPSP, najblizsze } from './najblizsze';

export const modul: Modul = {
  id: 'punkty',
  nazwa: 'Pomoc',
  Panel,
  dodajWarstwy,
  wskazowki: wskazowkiPunktow,
  // Atrapa z V1. Kafelki: P4.
  kafelki: [],
};

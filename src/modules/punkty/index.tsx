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
};

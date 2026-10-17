import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { kafelki } from './kafelki';
import { wskazowkiPunktow } from './wskazowki';

// Interfejs dla innych modułów (SPEC.md §5), np. karta do wydruku O2.
export { linkPSP, najblizsze } from './najblizsze';

export const modul: Modul = {
  id: 'punkty',
  nazwa: 'Pomoc',
  Panel,
  wskazowki: wskazowkiPunktow,
  // Mapa pusta na starcie: punkty tylko z kafelków.
  kafelki,
};

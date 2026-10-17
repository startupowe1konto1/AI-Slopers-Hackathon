import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { kafelki } from './kafelki';
import { dodajWarstwy } from './warstwy';
import { wskazowkiPunktow } from './wskazowki';

// Interfejs dla innych modułów (SPEC.md §5), np. karta do wydruku O2.
export { linkPSP, najblizsze } from './najblizsze';

export const modul: Modul = {
  id: 'punkty',
  nazwa: 'Pomoc',
  Panel,
  // Do usunięcia razem z V4 (mapa pusta na starcie); do tego czasu panel „Pomoc” rysuje punkty i odcinek.
  dodajWarstwy,
  wskazowki: wskazowkiPunktow,
  // Ekran główny V4: każdy kafelek włącza warstwę jednego rodzaju punktów.
  kafelki,
};

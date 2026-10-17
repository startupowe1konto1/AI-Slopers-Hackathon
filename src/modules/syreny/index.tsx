import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { dodajWarstwy } from './warstwy';

export { wynikSyreny } from './wynik';

export const modul: Modul = {
  id: 'syreny',
  nazwa: 'Syreny',
  Panel,
  dodajWarstwy,
  // Atrapa z V1. Prawdziwa karta: S1.
  wskazowki: async () => [
    { id: 'syreny', kolejnosc: 10, tytul: 'Syreny', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
};

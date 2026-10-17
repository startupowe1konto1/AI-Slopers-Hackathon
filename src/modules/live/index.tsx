import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { dodajWarstwy } from './warstwy';

export { najblizszaStacjaZRowerami } from './rowery';

export const modul: Modul = {
  id: 'live',
  nazwa: 'Na żywo',
  Panel,
  dodajWarstwy,
  // Atrapa z V1. Prawdziwa karta: L2.
  wskazowki: async () => [
    { id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
};

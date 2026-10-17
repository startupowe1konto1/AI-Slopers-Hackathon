import type { Modul, Wsp } from '../../contracts';
import { Panel } from './Panel';
import { dodajWarstwy } from './warstwy';

// Atrapa z V1 dla O2 (S3). Prawdziwa funkcja: L3.
export const najblizszaStacjaZRowerami = async (_wsp: Wsp): Promise<{ nazwa: string; wsp: Wsp; rowery: number; odlegloscM: number } | null> => null;

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

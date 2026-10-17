import type { Modul } from '../../contracts';
import { Panel } from './Panel';

export { trasyMin } from './trasy';

export const modul: Modul = {
  id: 'transport',
  nazwa: 'Dojazd',
  Panel,
  // Atrapa z V1. Prawdziwa karta: S3. Moduł zostaje w rejestrze, bo niesie kartę 5.
  wskazowki: async () => [
    { id: 'bliscy', kolejnosc: 50, tytul: 'Dotarcie do bliskich', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
};

import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { wskazowkiBliskich } from './wskazowki';

export { trasyMin } from './trasy';
export { planKomunikacji, najblizszyOdjazd, opisPrzejazdu, opisPlanu } from './komunikacja';
export type { Przejazd, PlanKomunikacji, TypLinii } from './komunikacja';

export const modul: Modul = {
  id: 'transport',
  nazwa: 'Dojazd',
  Panel,
  // Karta 5 „Dotarcie do bliskich” (S3). Moduł zostaje w rejestrze, bo niesie tę kartę.
  wskazowki: wskazowkiBliskich,
};

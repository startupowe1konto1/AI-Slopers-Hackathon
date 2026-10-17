import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { dodajWarstwy } from './warstwy';

export { wynikSyreny } from './wynik';

export const modul: Modul = {
  id: 'syreny',
  nazwa: 'Syreny',
  Panel,
  dodajWarstwy,
};

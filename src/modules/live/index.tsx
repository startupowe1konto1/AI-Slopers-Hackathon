import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { dodajWarstwy } from './warstwy';

export const modul: Modul = {
  id: 'live',
  nazwa: 'Na żywo',
  Panel,
  dodajWarstwy,
};

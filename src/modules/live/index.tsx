import type { Modul } from '../../contracts';
import { Panel } from './Panel';
import { kartaPowietrza } from './wskazowki';
import { dodajWarstwy } from './warstwy';

export { najblizszaStacjaZRowerami } from './rowery';

export const modul: Modul = {
  id: 'live',
  nazwa: 'Na żywo',
  Panel,
  dodajWarstwy,
  wskazowki: async (k) => [await kartaPowietrza(k)],
};

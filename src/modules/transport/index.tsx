import type { Modul } from '../../contracts';
import { Panel } from './Panel';

export { trasyMin } from './trasy';

export const modul: Modul = {
  id: 'transport',
  nazwa: 'Dojazd',
  Panel,
};

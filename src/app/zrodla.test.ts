import { describe, expect, it } from 'vitest';
import type { Manifest } from '../contracts';
import { STALE_ZRODLA, zrodlaDoStopki } from './zrodla';

const manifest = (zrodla: Manifest['zrodla']): Manifest => ({ wersja: 'x', zbudowano: 'x', pliki: [], zrodla });

describe('zrodlaDoStopki', () => {
  it('bez manifestu pokazuje stałe atrybucje (mapa, SOIA, miasto, PSP)', () => {
    const z = zrodlaDoStopki(null);
    expect(z).toEqual(STALE_ZRODLA);
    expect(z.map((x) => x.nazwa).join(' ')).toMatch(/OpenStreetMap.*SOIA|SOIA.*OpenStreetMap/s);
    expect(z.some((x) => x.nazwa.includes('PSP') && x.nazwa.includes('gdziesieukryc'))).toBe(true);
    expect(z.some((x) => x.nazwa.startsWith('Trasy: OSRM'))).toBe(true);
  });

  it('dokłada źródła z manifestu i nie dubluje tych samych nazw', () => {
    const z = zrodlaDoStopki(
      manifest({
        'um-aed': { nazwa: 'm.st. Warszawa, defibrylatory AED', licencja: 'CC BY', url: 'https://dane.um.warszawa.pl', pobrano: '2026-10-17T15:00:00+02:00' },
        soia: { ...STALE_ZRODLA[1] },
      }),
    );
    expect(z.filter((x) => x.nazwa === STALE_ZRODLA[1].nazwa)).toHaveLength(1);
    expect(z.at(-1)?.nazwa).toBe('m.st. Warszawa, defibrylatory AED');
  });
});

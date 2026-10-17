import { expect, it } from 'vitest';
import { godzinyPoPolsku } from './godziny';

it('dni i „off” z OSM (opening_hours) po polsku', () => {
  expect(godzinyPoPolsku('Mo-Fr 08:00-20:00; Sa-Su off')).toBe('pn–pt 08:00–20:00; sob–nd nieczynne');
  expect(godzinyPoPolsku('Mo-Fr 07:00-18:00; Sa,Su off')).toBe('pn–pt 07:00–18:00; sob, nd nieczynne');
  expect(godzinyPoPolsku('Mo-Fr 08:00-20:00; Sa 08:00-14:00; PH off')).toBe('pn–pt 08:00–20:00; sob 08:00–14:00; święta nieczynne');
  expect(godzinyPoPolsku('Mo,We 09:00-20:00; Tu,Th 09:00-16:00; Fr 09:00-15:00')).toBe('pn, śr 09:00–20:00; wt, czw 09:00–16:00; pt 09:00–15:00');
});

it('poprawia drobne usterki zapisu i tłumaczy zwroty w cudzysłowie', () => {
  expect(godzinyPoPolsku('Mo-Fr 08:00-20:00; Sa09:00-13:00')).toBe('pn–pt 08:00–20:00; sob 09:00–13:00');
  expect(godzinyPoPolsku('Mo-Fr "on appointment"; Sa 10:00-15:00')).toBe('pn–pt po umówieniu; sob 10:00–15:00');
  expect(godzinyPoPolsku('"zapisy / by appointment"')).toBe('zapisy / po umówieniu');
  expect(godzinyPoPolsku('24/7')).toBe('całą dobę');
  expect(godzinyPoPolsku('08:00-18:00')).toBe('08:00–18:00');
});

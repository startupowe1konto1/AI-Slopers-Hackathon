import type { RodzajPunktu } from '../../contracts';

// Kolejność zakładek w panelu. `zrodlo` to klucz w Manifest.zrodla (pipeline/punkty), kolor wspólny dla panelu i mapy.
export const RODZAJE: { rodzaj: RodzajPunktu; etykieta: string; zrodlo: string; kolor: string }[] = [
  { rodzaj: 'schronienie_psp', etykieta: 'Miejsca schronienia według PSP', zrodlo: 'psp', kolor: '#b91c1c' },
  { rodzaj: 'metro', etykieta: 'Metro', zrodlo: 'gtfs-ztm', kolor: '#1d4ed8' },
  { rodzaj: 'aed', etykieta: 'AED', zrodlo: 'um-aed', kolor: '#15803d' },
  { rodzaj: 'apteka', etykieta: 'Apteka', zrodlo: 'wfs-apteki', kolor: '#0e7490' },
  { rodzaj: 'sor', etykieta: 'SOR', zrodlo: 'rprm-sor', kolor: '#7e22ce' },
  { rodzaj: 'toaleta', etykieta: 'Toaleta', zrodlo: 'um-toalety', kolor: '#6b7280' },
];

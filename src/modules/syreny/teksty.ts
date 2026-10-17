import type { KlasaSyreny } from '../../contracts';

export const KLASA: Record<KlasaSyreny, { tekst: string; kolor: string }> = {
  '75+': { tekst: '75 dB i więcej', kolor: '#15803d' },
  '70-75': { tekst: '70–75 dB', kolor: '#4d7c0f' },
  '65-70': { tekst: '65–70 dB', kolor: '#b45309' },
  ponizej_65: { tekst: 'poniżej 65 dB', kolor: '#b91c1c' },
};

export const KROKI = ['Włącz Alert RCB w telefonie', 'Zainstaluj aplikację RSO', 'Umów się z sąsiadem, kto kogo budzi', 'Wydrukuj kartę z adresami'];
export const DOPISEK =
  'Model dźwięku na zewnątrz budynków (KG PSP, SOIA 2026.05). Wariant blackout zakłada, że syreny analogowe nie mają zasilania awaryjnego, a cyfrowe działają. ' +
  '„Szacunek”: SOIA pokazuje tu syrenę analogową, więc poziom syren cyfrowych przybliżamy z odległości i mocy.';

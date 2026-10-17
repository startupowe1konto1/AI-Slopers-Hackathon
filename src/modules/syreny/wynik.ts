import type { KlasaSyreny, WynikSyreny } from '../../contracts';
import { indeksAdresu } from '../adresy';

// Kody w syreny.json (O2-B2): '3' = ≥75 dB, '2' = 70–75, '1' = 65–70, '0' = poniżej 65.
const KLASY: KlasaSyreny[] = ['ponizej_65', '65-70', '70-75', '75+'];
export const klasa = (c: string): KlasaSyreny => KLASY[Number(c)];

export type Poziom = 'slychac' | 'slabo' | 'ryzyko_blackout' | 'nie_slychac';
export function ocena(w: WynikSyreny): { poziom: Poziom } {
  if (w.normalnie === 'ponizej_65') return { poziom: 'nie_slychac' };
  if (w.blackout === 'ponizej_65') return { poziom: 'ryzyko_blackout' };
  if (w.normalnie === '65-70') return { poziom: 'slabo' };
  return { poziom: 'slychac' };
}

const URL_PACZKI = '/pack/syreny/syreny.json';

// n = wszystkie syreny, b = blackout (tylko cyfrowe), p = '1' gdy b to szacunek (SOIA pokazuje tu syrenę analogową);
// znak i = wiersz i w adresy.json. Paczka ładowana raz. Po błędzie następne wywołanie próbuje znowu.
type PaczkaSyren = { n: string; b: string; p?: string };
export type WynikSyrenyZSzacunkiem = WynikSyreny & { blackoutSzacunek: boolean };

let dane: Promise<PaczkaSyren> | null = null;

function wczytaj(): Promise<PaczkaSyren> {
  dane ??= fetch(URL_PACZKI)
    .then((r) => {
      if (!r.ok) throw new Error(`Nie pobrano ${URL_PACZKI}`);
      return r.json() as Promise<PaczkaSyren>;
    })
    .catch((e: unknown) => {
      dane = null;
      throw e;
    });
  return dane;
}

const KOD = /^[0-3]$/;

export async function wynikSyreny(adresId: string): Promise<WynikSyrenyZSzacunkiem | null> {
  const [s, i] = await Promise.all([wczytaj(), indeksAdresu(adresId)]);
  const n = s.n[i] ?? '';
  const b = s.b[i] ?? '';
  // Paczki z różnych wersji (np. stara adresy.json w cache) nie mogą wysypać karty: wtedy brak danych.
  if (i < 0 || !KOD.test(n) || !KOD.test(b)) return null;
  return { adresId, normalnie: klasa(n), blackout: klasa(b), blackoutSzacunek: s.p?.[i] === '1' };
}

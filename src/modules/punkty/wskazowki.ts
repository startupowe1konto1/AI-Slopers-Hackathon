import type { KontekstWskazowek, Punkt, Wskazowka } from '../../contracts';
import { trasa } from '../../offline/trasy';
import { kartaMedyczna } from './medyczna';
import { formatujOdleglosc, linkPSP, najblizsze, odlegloscM, zrodlaPaczki } from './najblizsze';

const malaLitera = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const ZRODLO_PSP = 'Miejsca schronienia według PSP (gdziesieukryc.pl)';

export async function kartaSchronienia(k: KontekstWskazowek): Promise<Wskazowka> {
  const baza = { id: 'schronienie', kolejnosc: 20, tytul: 'Najbliższe miejsce schronienia według PSP' };
  const zrodlo = (await zrodlaPaczki().catch(() => null))?.psp?.nazwa ?? ZRODLO_PSP;
  const od = k.miejsce.adres;
  let punkty: Punkt[];
  try {
    punkty = await najblizsze(od, 'schronienie_psp', 3);
  } catch {
    const tekst = k.online
      ? 'Źródło chwilowo niedostępne: nie udało się wczytać miejsc schronienia według PSP.'
      : 'Brak sieci i brak pobranej paczki z miejscami schronienia według PSP.';
    return { ...baza, poziom: 'brak', tekst, akcje: [], zrodlo };
  }
  if (!punkty.length) return { ...baza, poziom: 'brak', tekst: 'Brak miejsc schronienia według PSP w promieniu 20 km.', akcje: [], zrodlo };
  const [p, ...kolejne] = punkty;
  const t = await trasa(od, p, 'pieszo');
  const d = odlegloscM(od, p);
  const ile = t.zrodlo === 'prosta' ? `${formatujOdleglosc(d)} w linii prostej` : formatujOdleglosc(t.dystansM);
  return {
    ...baza,
    poziom: d <= 1000 ? 'ok' : 'uwaga',
    tekst: `${p.nazwa}, ${ile}, ok. ${t.czasMin} min pieszo.${p.dostepnosc ? ` Dostępność: ${malaLitera(p.dostepnosc)}.` : ''}`,
    szczegoly: kolejne.map((q, i) => `${i + 2}. ${q.nazwa}, ${formatujOdleglosc(odlegloscM(od, q))} w linii prostej${q.dostepnosc ? `, ${malaLitera(q.dostepnosc)}` : ''}`),
    akcje: [
      { typ: 'trasa', cel: { lat: p.lat, lon: p.lon }, nazwa: p.nazwa, profil: 'pieszo' },
      { typ: 'link', url: linkPSP(p), etykieta: 'Otwórz w aplikacji PSP' },
      ...kolejne.map((q) => ({ typ: 'trasa' as const, cel: { lat: q.lat, lon: q.lon }, nazwa: q.nazwa, profil: 'pieszo' as const })),
    ],
    zrodlo,
  };
}

export async function wskazowkiPunktow(k: KontekstWskazowek): Promise<Wskazowka[]> {
  return Promise.all([kartaSchronienia(k), kartaMedyczna(k)]);
}

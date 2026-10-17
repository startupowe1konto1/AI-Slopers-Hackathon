import type { KontekstWskazowek, Poziom, Wskazowka } from '../../contracts';
import { drukujKarte } from './druk';
import { DOPISEK, KLASA } from './teksty';
import { ocena, wynikSyreny, type Poziom as Ocena, type WynikSyrenyZSzacunkiem } from './wynik';

const POZIOM: Record<Ocena, Poziom> = { slychac: 'ok', slabo: 'uwaga', ryzyko_blackout: 'uwaga', nie_slychac: 'alarm' };
const KROKI = ['Włącz Alert RCB w telefonie.', 'Umów się z sąsiadem, kto kogo budzi.'];
const ZRODLO = 'Model zasięgu syren KG PSP, SOIA 2026.05';

function poBlackoucie(w: WynikSyrenyZSzacunkiem): string {
  if (w.blackout === w.normalnie) return 'Jeśli zabraknie prądu, poziom się nie zmienia.';
  const b = `${KLASA[w.blackout].tekst}${w.blackoutSzacunek ? ', szacunek' : ''}`;
  if (w.blackout === 'ponizej_65') return `Jeśli zabraknie prądu (${b}), możesz jej nie usłyszeć.`;
  if (w.blackout === '65-70') return `Jeśli zabraknie prądu (${b}), możesz jej nie usłyszeć w mieszkaniu.`;
  return `Jeśli zabraknie prądu (${b}), nadal powinna być słyszalna na zewnątrz.`;
}

export function tekstSyren(w: WynikSyrenyZSzacunkiem): string {
  const n = KLASA[w.normalnie].tekst;
  switch (ocena(w).poziom) {
    case 'nie_slychac':
      return `Syrena prawdopodobnie nie jest tu słyszalna (${n}). Włącz Alert RCB, żeby alarm do Ciebie dotarł.`;
    case 'slabo':
      return `Syrena może być tu słabo słyszalna (${n}), zwłaszcza w mieszkaniu.`;
    default:
      return `Jesteś w zasięgu syreny (${n}). ${poBlackoucie(w)}`;
  }
}

export async function wskazowkiSyren(k: KontekstWskazowek): Promise<Wskazowka[]> {
  const baza = { id: 'syreny', kolejnosc: 10, tytul: 'Syreny', zrodlo: ZRODLO };
  const druk = { typ: 'przycisk' as const, etykieta: 'Drukuj kartę z adresami', wykonaj: () => drukujKarte(k.miejsca) };
  let w: WynikSyrenyZSzacunkiem | null;
  try {
    w = await wynikSyreny(k.miejsce.adres.id);
  } catch {
    const tekst = k.online
      ? 'Źródło chwilowo niedostępne: nie udało się wczytać danych o syrenach. Spróbuj za chwilę.'
      : 'Brak sieci, a dane o syrenach nie są zapisane w telefonie. Pobierz paczkę, gdy wróci sieć.';
    return [{ ...baza, poziom: 'brak', tekst, akcje: [] }];
  }
  if (!w) return [{ ...baza, poziom: 'brak', tekst: 'Brak danych o syrenach dla tego miejsca.', akcje: [] }];
  return [
    {
      ...baza,
      poziom: POZIOM[ocena(w).poziom],
      tekst: tekstSyren(w),
      szczegoly: [
        `Normalnie: ${KLASA[w.normalnie].tekst}. Jeśli zabraknie prądu: ${KLASA[w.blackout].tekst}${w.blackoutSzacunek ? ' (szacunek)' : ''}.`,
        ...KROKI,
        DOPISEK,
      ],
      akcje: [druk],
    },
  ];
}

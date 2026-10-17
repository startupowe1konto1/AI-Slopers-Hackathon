import type { KontekstWskazowek, Poziom, Wskazowka } from '../../contracts';
import { drukujKarte } from './druk';
import { DOPISEK_OKREGOW, LEGENDA_OKREGOW, najblizszeOkregi, opisOkregow, pokazOkregi, wczytajOkregi } from './okregi';
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
  // „Tutaj” to bieżąca lokalizacja GPS, nie adres do wydruku; gdy nic innego nie zostaje, drukujemy wszystko (karta nigdy pusta).
  const doDruku = k.miejsca.filter((m) => m.rola !== 'tutaj');
  const druk = {
    typ: 'przycisk' as const,
    etykieta: 'Drukuj kartę z adresami',
    wykonaj: () => drukujKarte(doDruku.length ? doDruku : k.miejsca),
  };
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
  // Bez pliku okręgów karta działa jak dotąd: bez akcji mapy i bez opisu okręgów.
  const bliskie = await wczytajOkregi()
    .then((o) => najblizszeOkregi(o, k.miejsce.adres, 5))
    .catch(() => []);
  // Zielony tylko bez ostrzeżenia: przy blackoucie 65–70 dB tekst karty mówi, że można nie usłyszeć syreny w mieszkaniu.
  const ocenaW = ocena(w).poziom;
  const poziom = ocenaW === 'slychac' && w.blackout === '65-70' ? 'uwaga' : POZIOM[ocenaW];
  const okregi = bliskie.length ? [{ typ: 'mapa' as const, pokaz: pokazOkregi(bliskie, k.miejsce.adres) }] : [];
  return [
    {
      ...baza,
      poziom,
      tekst: tekstSyren(w),
      szczegoly: [
        `Normalnie: ${KLASA[w.normalnie].tekst}. Jeśli zabraknie prądu: ${KLASA[w.blackout].tekst}${w.blackoutSzacunek ? ' (szacunek)' : ''}.`,
        ...KROKI,
        ...opisOkregow(bliskie),
        ...(bliskie.length ? [LEGENDA_OKREGOW, DOPISEK_OKREGOW] : []),
        DOPISEK,
      ],
      akcje: [...okregi, druk],
    },
  ];
}

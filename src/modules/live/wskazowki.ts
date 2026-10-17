import type { Akcja, KontekstWskazowek, Poziom, Wiatr, Wskazowka } from '../../contracts';
import type { Powietrze } from '../../../server/live/typy';
import { fetchLive } from '../../offline/live-cache';
import { stozekDymu, wczytajDym, wStozku, zapiszDym } from './dym';
import { godzina, liczba, najblizszaStacja, odleglosc, odlegloscM, zKierunku } from './okolica';
import { ustawDym, wybierzNaMapie } from './warstwy';

// Progi PM2,5 wg indeksu jakości powietrza GIOŚ (HANDOFF-v3 §3).
export function ocenaPM25(pm25: number): { poziom: Poziom; tekst: string } {
  if (pm25 <= 35) return { poziom: 'ok', tekst: 'Powietrze dobre. Możesz wietrzyć.' };
  if (pm25 <= 75) return { poziom: 'uwaga', tekst: 'Powietrze gorsze. Ogranicz wietrzenie i wysiłek na zewnątrz.' };
  return { poziom: 'alarm', tekst: 'Powietrze złe. Zamknij okna, wyłącz wentylację, na zewnątrz maska FFP2.' };
}

// Nazwy źródeł jak w odpowiedziach handlerów server/live/{powietrze,wiatr}.ts; potrzebne, gdy źródło nie odpowiedziało i nie ma StanLive.
const ZRODLO_PM = 'Monitoring jakości powietrza m.st. Warszawy przez dane.um.warszawa.pl';
const ZRODLO_WIATR = 'Stacje pogodowe m.st. Warszawy przez dane.um.warszawa.pl';

const DOPISEK_DYMU = 'To kierunek wiatru, nie model rozprzestrzeniania się dymu.';

export async function kartaPowietrza(k: KontekstWskazowek): Promise<Wskazowka> {
  const baza = { id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr' };
  const tu = k.miejsce.adres;
  const [pow, wiatr] = await Promise.all([
    fetchLive<Powietrze[]>('powietrze').catch(() => null),
    fetchLive<Wiatr[]>('wiatr').catch(() => null),
  ]);
  const dym = wczytajDym();
  const przyciskDymu: Akcja = dym
    ? { typ: 'przycisk', etykieta: 'Usuń zaznaczenie dymu', wykonaj: () => zapiszDym(null) }
    : {
        typ: 'przycisk',
        etykieta: 'Widzę dym (potem kliknij na mapie)',
        wykonaj: async () => {
          const p = await wybierzNaMapie();
          if (p) zapiszDym(p);
        },
      };

  const stacjaPM = pow ? najblizszaStacja(pow.dane.filter((s) => s.pm25 != null), tu) : null;
  const stacjaWiatru = wiatr ? najblizszaStacja(wiatr.dane, dym ?? tu) : null;
  if (!stacjaPM && !stacjaWiatru) {
    const tekst = k.online ? 'Źródła danych o powietrzu i wietrze chwilowo nie odpowiadają.' : 'Brak sieci i brak zapisanego pomiaru powietrza.';
    return { ...baza, poziom: 'brak', tekst, akcje: [przyciskDymu], zrodlo: `${ZRODLO_PM}; ${ZRODLO_WIATR}` };
  }

  const kier = stacjaWiatru && stacjaWiatru.predkoscMs > 0 ? stacjaWiatru.kierunekDeg : null;
  const dymNaCiebie = dym != null && kier != null && wStozku(tu, dym, kier);
  const ocena = stacjaPM ? ocenaPM25(stacjaPM.pm25!) : { poziom: 'brak' as const, tekst: `Brak pomiaru pyłu PM2,5 w pobliżu (${ZRODLO_PM}).` };
  const stan = (pow ?? wiatr)!;
  const pokazDym = () => {
    ustawDym(dym, dym && kier != null ? stozekDymu(dym, kier) : null);
    return () => ustawDym(null, null);
  };
  const mapaDymu: Akcja[] = dym ? [{ typ: 'mapa', pokaz: pokazDym }] : [];
  // źródło, które nie dało danych, wymieniamy z nazwy (zasada: „brak” zawsze z nazwą źródła)
  const braki = [!stacjaPM && `Brak danych o pyle PM2,5: ${ZRODLO_PM}.`, !stacjaWiatru && `Brak danych o wietrze: ${ZRODLO_WIATR}.`];
  const ostatni = pow?.zCache || wiatr?.zCache ? `${k.online ? 'Źródło nie odpowiada' : 'Brak sieci'}: ostatni zapisany stan z ${godzina(stan.stanNa)}.` : null;

  return {
    ...baza,
    poziom: dymNaCiebie ? 'alarm' : ocena.poziom,
    tekst: dymNaCiebie
      ? `Wiatr niesie dym w Twoją stronę (${zKierunku(kier!)}, ${liczba(stacjaWiatru!.predkoscMs)} m/s). Zamknij okna, wyłącz wentylację. Jeśli musisz wyjść, idź w poprzek kierunku wiatru.`
      : ocena.tekst,
    szczegoly: [
      stacjaPM &&
        `PM2,5: ${liczba(stacjaPM.pm25!)} µg/m³${stacjaPM.pm10 != null ? `, PM10: ${liczba(stacjaPM.pm10)} µg/m³` : ''}. ${stacjaPM.stacja}, ${odleglosc(odlegloscM(tu, stacjaPM))}, pomiar z ${stacjaPM.czas.slice(11, 16)}.`,
      stacjaWiatru &&
        (stacjaWiatru.predkoscMs > 0
          ? `Wiatr ${zKierunku(stacjaWiatru.kierunekDeg)}, ${liczba(stacjaWiatru.predkoscMs)} m/s (${stacjaWiatru.stacja}).`
          : `Bezwietrznie (${stacjaWiatru.stacja}).`),
      ...braki,
      dym && DOPISEK_DYMU,
      ostatni,
    ].filter((x): x is string => typeof x === 'string'),
    akcje: [...mapaDymu, przyciskDymu],
    zrodlo: [pow?.zrodlo, wiatr?.zrodlo].filter(Boolean).join('; '),
    stanNa: godzina(stan.stanNa),
  };
}

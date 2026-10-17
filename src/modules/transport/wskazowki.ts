import type { Akcja, KontekstWskazowek, Trasa, Wskazowka } from '../../contracts';
import { trasa } from '../../offline/trasy';
import { najblizszaStacjaZRowerami } from '../live';

const metry = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);
const czas = (t: Trasa) => `ok. ${t.czasMin} min${t.zrodlo === 'prosta' ? ' (w linii prostej)' : ''}`;
const BLACKOUT = 'Jeśli zabraknie prądu, tramwaje i metro stoją.';
const ZRODLO_TRAS = 'Trasy: OSRM, © OpenStreetMap contributors';
const ZRODLO_PROSTA = 'Szacunek z odległości w linii prostej';

export async function wskazowkiBliskich(k: KontekstWskazowek): Promise<Wskazowka[]> {
  const baza = { id: 'bliscy', kolejnosc: 50, tytul: 'Dotarcie do bliskich' };
  const od = k.miejsce.adres;
  const cele = k.miejsca.filter((m) => m.rola !== 'tutaj' && m.adres.id !== od.id);
  if (!cele.length) {
    const tekst = 'Dodaj adres pracy, przedszkola albo bliskiej osoby (przycisk „Adresy”), żeby zobaczyć, jak do nich dotrzeć.';
    return [{ ...baza, poziom: 'brak', tekst, akcje: [], zrodlo: 'Twoje adresy' }];
  }
  try {
    // Stan rowerów zmienia się co minutę: bez sieci nie pokazujemy zapisanego.
    // Pobieranie rusza razem z trasami, a .catch dopięty od razu nie zostawia nieobsłużonego odrzucenia.
    const stacjaObietnica = k.online ? najblizszaStacjaZRowerami(od).catch(() => null) : null;
    const trasy = await Promise.all(
      cele.map(async (m) => {
        const [pieszo, rower] = await Promise.all([trasa(od, m.adres, 'pieszo'), trasa(od, m.adres, 'rower')]);
        return { m, pieszo, rower };
      }),
    );
    const stacja = await stacjaObietnica;
    const wiersze = trasy.map(({ m, pieszo, rower }) => `${m.etykieta} (${m.adres.ulica} ${m.adres.numer}): pieszo ${czas(pieszo)}, rowerem ${czas(rower)}.`);
    const akcje: Akcja[] = trasy.flatMap(({ m }) => [
      { typ: 'trasa' as const, cel: m.adres, nazwa: m.etykieta, profil: 'pieszo' as const },
      { typ: 'trasa' as const, cel: m.adres, nazwa: m.etykieta, profil: 'rower' as const },
    ]);
    if (stacja) akcje.push({ typ: 'trasa', cel: stacja.wsp, nazwa: `Stacja Veturilo ${stacja.nazwa}`, profil: 'pieszo' });
    const wszystkie = trasy.flatMap((t) => [t.pieszo, t.rower]);
    const zrodla = [
      wszystkie.some((t) => t.zrodlo !== 'prosta') && ZRODLO_TRAS,
      wszystkie.some((t) => t.zrodlo === 'prosta') && ZRODLO_PROSTA,
      stacja && 'Veturilo (GBFS nextbike)',
    ];
    return [
      {
        ...baza,
        poziom: 'ok',
        tekst: `${wiersze[0]} ${BLACKOUT}`,
        szczegoly: [...wiersze, ...(stacja ? [`Najbliższa stacja Veturilo z rowerami: ${stacja.nazwa}, ${metry(stacja.odlegloscM)} (wolne rowery: ${stacja.rowery}).`] : [])],
        akcje,
        zrodlo: zrodla.filter(Boolean).join('; '),
      },
    ];
  } catch {
    return [{ ...baza, poziom: 'brak', tekst: 'Źródło chwilowo niedostępne: nie udało się policzyć tras do bliskich. Spróbuj za chwilę.', akcje: [], zrodlo: ZRODLO_TRAS }];
  }
}

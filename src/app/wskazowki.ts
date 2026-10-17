import { useEffect, useRef, useState } from 'react';
import type { KontekstWskazowek, Modul, Wskazowka } from '../contracts';

type StanModulu = 'ladowanie' | Wskazowka[];

// Miejsca kart każdego modułu na liście (`kolejnosc` z HANDOFF-v3 §3). Szkielet stoi tam, gdzie pojawi się karta,
// więc gotowe karty nie przeskakują. Punkty dają dwie karty: schronienie i pomoc medyczną.
const MIEJSCA: Record<Modul['id'], number[]> = { syreny: [10], punkty: [20, 30], live: [40], transport: [50] };
const miejsca = (m: Modul) => MIEJSCA[m.id] ?? [900];

// Moduł, który rzucił wyjątkiem, dostaje szarą kartę na swoim miejscu zamiast pustego (SPEC §8: błąd źródła).
function kartaBledu(m: Modul): Wskazowka {
  return {
    id: `blad-${m.id}`,
    kolejnosc: miejsca(m)[0],
    tytul: m.nazwa,
    poziom: 'brak',
    tekst: 'Nie udało się przygotować tej wskazówki. Spróbuj ponownie za chwilę.',
    akcje: [],
    zrodlo: m.nazwa,
  };
}

// Karty pojawiają się, gdy moduł skończy; reszta pokazuje szkielety (ladowanie = miejsca kart modułów w toku).
export function useWskazowki(moduly: Modul[], k: KontekstWskazowek | null, proba: number): { karty: Wskazowka[]; ladowanie: number[] } {
  const [stany, setStany] = useState<Record<string, StanModulu>>({});
  // baza = kontekst bez proby; sama zmiana proby to odświeżenie po akcji „przycisk”.
  const baza = k ? `${k.miejsce.rola}:${k.miejsce.adres.id}|${k.miejsca.map((m) => m.adres.id).join(',')}|${k.online}` : '';
  const ostatniaBaza = useRef('');

  useEffect(() => {
    if (!k) {
      ostatniaBaza.current = '';
      // Ten sam obiekt, gdy już pusto: inaczej nowa tablica modułów przy każdym renderze kręci efekt w kółko.
      return setStany((s) => (Object.keys(s).length ? {} : s));
    }
    let aktywne = true;
    const zKartami = moduly.filter((m) => m.wskazowki);
    // Nowy kontekst: szkielety. Samo odświeżenie: stare karty zostają, aż przyjdą nowe (bez skoku do szkieletów).
    if (ostatniaBaza.current !== baza) setStany(Object.fromEntries(zKartami.map((m) => [m.id, 'ladowanie' as const])));
    ostatniaBaza.current = baza;
    for (const m of zKartami) {
      // Promise.resolve().then: także wyjątek rzucony od razu (bez async) daje kartę błędu, a nie psuje pętli.
      Promise.resolve()
        .then(() => m.wskazowki!(k))
        .then(
          (w) => aktywne && setStany((s) => ({ ...s, [m.id]: w })),
          (e: unknown) => {
            if (!aktywne) return;
            console.error('[karty]', m.id, e);
            setStany((s) => ({ ...s, [m.id]: [kartaBledu(m)] }));
          },
        );
    }
    return () => {
      aktywne = false;
    };
    // baza i proba opisują kontekst w całości
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduly, baza, proba]);

  const zKartami = moduly.filter((m) => m.wskazowki);
  const wartosci = Object.values(stany);
  // Przed pierwszym efektem stany są puste: od razu szkielety zamiast mignięcia „Brak wskazówek”.
  const wToku = k && !wartosci.length ? zKartami : zKartami.filter((m) => stany[m.id] === 'ladowanie');
  return {
    karty: wartosci.flatMap((s) => (s === 'ladowanie' ? [] : s)).sort((a, b) => a.kolejnosc - b.kolejnosc),
    ladowanie: wToku.flatMap(miejsca).sort((a, b) => a - b),
  };
}

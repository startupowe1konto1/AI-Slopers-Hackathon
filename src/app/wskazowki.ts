import { useEffect, useState } from 'react';
import type { KontekstWskazowek, Modul, Wskazowka } from '../contracts';

type StanModulu = 'ladowanie' | Wskazowka[];

// Moduł, który rzucił wyjątkiem, dostaje szarą kartę zamiast pustego miejsca (SPEC §8: błąd źródła).
function kartaBledu(m: Modul): Wskazowka {
  return {
    id: `blad-${m.id}`,
    kolejnosc: 900,
    tytul: m.nazwa,
    poziom: 'brak',
    tekst: 'Nie udało się przygotować tej wskazówki. Spróbuj ponownie za chwilę.',
    akcje: [],
    zrodlo: m.nazwa,
  };
}

// Karty pojawiają się, gdy moduł skończy; reszta pokazuje szkielet (ladowanie = liczba modułów w toku).
export function useWskazowki(moduly: Modul[], k: KontekstWskazowek | null, proba: number): { karty: Wskazowka[]; ladowanie: number } {
  const [stany, setStany] = useState<Record<string, StanModulu>>({});
  const klucz = k ? `${k.miejsce.rola}:${k.miejsce.adres.id}|${k.miejsca.map((m) => m.adres.id).join(',')}|${k.online}|${proba}` : '';

  useEffect(() => {
    // Ten sam obiekt, gdy już pusto: inaczej nowa tablica modułów przy każdym renderze kręci efekt w kółko.
    if (!k) return setStany((s) => (Object.keys(s).length ? {} : s));
    let aktywne = true;
    const zKartami = moduly.filter((m) => m.wskazowki);
    setStany(Object.fromEntries(zKartami.map((m) => [m.id, 'ladowanie' as const])));
    for (const m of zKartami) {
      // Promise.resolve().then: także wyjątek rzucony od razu (bez async) daje kartę błędu, a nie psuje pętli.
      Promise.resolve()
        .then(() => m.wskazowki!(k))
        .then(
          (w) => aktywne && setStany((s) => ({ ...s, [m.id]: w })),
          () => aktywne && setStany((s) => ({ ...s, [m.id]: [kartaBledu(m)] })),
        );
    }
    return () => {
      aktywne = false;
    };
    // klucz opisuje kontekst w całości
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduly, klucz]);

  const wartosci = Object.values(stany);
  return {
    karty: wartosci.flatMap((s) => (s === 'ladowanie' ? [] : s)).sort((a, b) => a.kolejnosc - b.kolejnosc),
    ladowanie: wartosci.filter((s) => s === 'ladowanie').length,
  };
}

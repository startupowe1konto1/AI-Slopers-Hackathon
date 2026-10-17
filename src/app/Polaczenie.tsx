import { useEffect, useState } from 'react';
import { przygotuj, type Przygotowanie } from '../offline/polaczenie';

const kiedy = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });

const BRAK_PACZKI_PO_POBRANIU = ' Nie udało się pobrać paczki offline. Spróbuję przy następnym uruchomieniu.';

export function opisPrzygotowania(p: Przygotowanie): string {
  if (p.siec) {
    const online = p.api ? 'Jest połączenie. Dane na żywo włączone.' : 'Jest połączenie, ale dane miasta na żywo chwilowo nie odpowiadają.';
    // Sieć jest, a paczki nie ma: pobranie było próbowane i się nie udało.
    return p.paczka ? online : online + BRAK_PACZKI_PO_POBRANIU;
  }
  return p.paczka
    ? `Brak sieci. Działam na danych z paczki z ${kiedy(p.paczka.zbudowano)}.`
    : 'Brak sieci i brak paczki offline. Mapa, syreny i punkty pomocy pojawią się po pierwszym połączeniu.';
}

export function Polaczenie({ onGotowe }: { onGotowe: (p: Przygotowanie) => void }) {
  const [tekst, setTekst] = useState('Sprawdzam połączenie…');
  const [wynik, setWynik] = useState<Przygotowanie | null>(null);

  useEffect(() => {
    let aktywne = true;
    let t: ReturnType<typeof setTimeout> | undefined;
    przygotuj((s) => aktywne && setTekst(s))
      // Nieoczekiwany błąd przygotowania traktujemy jak brak sieci i paczki: tekst i „Dalej”, nigdy kółko w nieskończoność.
      .catch((): Przygotowanie => ({ siec: false, api: false, paczka: null }))
      .then((p) => {
        if (!aktywne) return;
        setWynik(p);
        setTekst(opisPrzygotowania(p));
        // Bez sieci i bez paczki czekamy na „Dalej”, żeby dało się przeczytać, co nie działa.
        // Błąd pobrania paczki (sieć jest, paczki nie ma) zostaje na ekranie dłużej, żeby dało się go przeczytać.
        if (p.siec || p.paczka) t = setTimeout(() => onGotowe(p), p.paczka ? 800 : 2500);
      });
    return () => {
      aktywne = false;
      clearTimeout(t);
    };
  }, [onGotowe]);

  return (
    <div className="polaczenie">
      {!wynik && <div className="polaczenie-kolko" aria-hidden="true" />}
      <p role="status" aria-live="polite">{tekst}</p>
      {wynik && !wynik.siec && !wynik.paczka && (
        <button className="przycisk" onClick={() => onGotowe(wynik)}>
          Dalej
        </button>
      )}
    </div>
  );
}

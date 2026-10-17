import { useEffect, useState } from 'react';
import { przygotuj, type Przygotowanie } from '../offline/polaczenie';

const kiedy = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });

export function opisPrzygotowania(p: Przygotowanie): string {
  if (p.siec) return p.api ? 'Jest połączenie. Dane na żywo włączone.' : 'Jest połączenie, ale dane miasta na żywo chwilowo nie odpowiadają.';
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
    przygotuj((s) => aktywne && setTekst(s)).then((p) => {
      if (!aktywne) return;
      setWynik(p);
      setTekst(opisPrzygotowania(p));
      // Bez sieci i bez paczki czekamy na „Dalej”, żeby dało się przeczytać, co nie działa.
      if (p.siec || p.paczka) t = setTimeout(() => onGotowe(p), 800);
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

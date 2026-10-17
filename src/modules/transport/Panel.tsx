import { useEffect, useState } from 'react';
import type { ModulProps, RolaMiejsca, TrasaMin } from '../../contracts';
import { opisTrasy, trasyMin } from './trasy';

type Wynik = { klucz: string; trasy?: TrasaMin[]; blad?: true };

export function Panel({ miejsca, online }: ModulProps) {
  const [proba, setProba] = useState(0);
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const klucz = `${proba}|${miejsca.map((m) => `${m.rola}:${m.adres.id}`).join(',')}`;
  const zaMalo = miejsca.length < 2;

  useEffect(() => {
    if (zaMalo) return;
    let aktualne = true;
    trasyMin(miejsca).then(
      (trasy) => aktualne && setWynik({ klucz, trasy }),
      () => aktualne && setWynik({ klucz, blad: true }),
    );
    return () => {
      aktualne = false;
    };
  }, [klucz, miejsca, zaMalo]);

  if (zaMalo) {
    return <p className="w-budowie">Dodaj drugi adres (np. pracę albo przedszkole), żeby zobaczyć dojazd między miejscami.</p>;
  }
  if (!wynik || wynik.klucz !== klucz) return <p className="w-budowie">Liczę dojazd…</p>;
  if (wynik.blad) {
    return (
      <div>
        <p>
          {online
            ? 'Nie udało się wczytać przystanków z paczki offline.'
            : 'Brak sieci i brak paczki offline. Połącz się z siecią i pobierz paczkę, żeby liczyć dojazd bez sieci.'}
        </p>
        <button className="przycisk drugi" onClick={() => setProba((p) => p + 1)}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const etykieta = (r: RolaMiejsca) => miejsca.find((m) => m.rola === r)?.etykieta ?? r;
  return (
    <div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
        {wynik.trasy?.map((t) => (
          <li key={`${t.z}-${t.do}`} style={{ border: '1px solid var(--linia)', borderRadius: 8, padding: '10px 12px' }}>
            <strong>{`${etykieta(t.z)} → ${etykieta(t.do)}`}</strong>
            {opisTrasy(t).map((linia) => (
              <p key={linia} style={{ margin: '4px 0 0' }}>
                {linia}
              </p>
            ))}
          </li>
        ))}
      </ul>
      <p className="w-budowie" style={{ fontSize: 12, marginTop: 10 }}>
        Czasy szacunkowe: odległość w linii prostej plus 30%. Linie autobusowe: GTFS Warszawa (mkuran.pl), źródło nieoficjalne, na
        podstawie danych ZTM.
      </p>
    </div>
  );
}

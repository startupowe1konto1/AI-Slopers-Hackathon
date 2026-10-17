import { useEffect, useState } from 'react';
import type { Manifest, ModulProps, Punkt, RodzajPunktu } from '../../contracts';
import { formatujOdleglosc, linkPSP, najblizsze, odlegloscM, zrodlaPaczki } from './najblizsze';
import { RODZAJE } from './rodzaje';
import './punkty.css';

type Wynik = { klucz: string } & ({ typ: 'gotowe'; punkty: Punkt[] } | { typ: 'blad' });

// „2026-10-17…” → „17.10.2026” bez przeliczania strefy czasowej.
const data = (iso?: string) => iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)?.slice(1).reverse().join('.') ?? iso;

export function Panel({ wybrane, online }: ModulProps) {
  const [rodzaj, setRodzaj] = useState<RodzajPunktu>('schronienie_psp');
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const [proba, setProba] = useState(0);
  const [zrodla, setZrodla] = useState<Manifest['zrodla']>({});

  useEffect(() => {
    zrodlaPaczki().then(setZrodla, () => {});
  }, []);

  // Wynik dla innego klucza (miejsce, rodzaj, próba) oznacza ładowanie.
  const klucz = wybrane && `${wybrane.lat},${wybrane.lon},${rodzaj},${proba}`;
  useEffect(() => {
    if (!wybrane || !klucz) return;
    let aktualne = true;
    najblizsze(wybrane, rodzaj, 3).then(
      (punkty) => aktualne && setWynik({ klucz, typ: 'gotowe', punkty }),
      () => aktualne && setWynik({ klucz, typ: 'blad' }),
    );
    return () => {
      aktualne = false;
    };
  }, [wybrane, rodzaj, klucz]);
  const stan = wynik?.klucz === klucz ? wynik : { typ: 'ladowanie' as const };

  const r = RODZAJE.find((x) => x.rodzaj === rodzaj)!;
  const opisZrodla = (klucz: string) => {
    const z = zrodla[klucz];
    return { nazwa: z?.nazwa ?? klucz, data: data(z?.pobrano) };
  };
  const zrodlo = opisZrodla(r.zrodlo);

  let tresc;
  if (!wybrane) {
    tresc = <p className="punkty-info">Wybierz miejsce u góry ekranu, żeby zobaczyć najbliższe punkty.</p>;
  } else if (stan.typ === 'ladowanie') {
    tresc = (
      <div className="punkty-szkielet" aria-busy="true" aria-label="Ładowanie punktów">
        <span />
        <span />
        <span />
      </div>
    );
  } else if (stan.typ === 'blad') {
    tresc = (
      <div role="alert" className="punkty-info">
        <p>{online ? 'Źródło chwilowo niedostępne.' : 'Brak sieci i brak pobranej paczki danych. Pobierz paczkę, gdy wrócisz do sieci.'}</p>
        <button className="przycisk drugi" onClick={() => setProba((p) => p + 1)}>
          Spróbuj ponownie
        </button>
      </div>
    );
  } else if (!stan.punkty.length) {
    tresc = <p className="punkty-info">Brak danych dla tego miejsca. Sprawdziliśmy: {zrodlo.nazwa}.</p>;
  } else {
    tresc = (
      <>
        {!online && <p className="punkty-info">Bez sieci: dane z pobranej paczki.</p>}
        <ul className="punkty-lista" data-testid="lista-punktow">
          {stan.punkty.map((p) => {
            const z = opisZrodla(p.zrodlo);
            return (
              <li key={p.id}>
                <div className="punkt-naglowek">
                  <strong>{p.nazwa}</strong>
                  <span>{formatujOdleglosc(odlegloscM(wybrane, p))}</span>
                </div>
                {p.adres && <div>{p.adres}</div>}
                {p.dostepnosc && <div>Dostępność: {p.dostepnosc}</div>}
                <div className="punkt-zrodlo">
                  Źródło: {z.nazwa}
                  {z.data && `, stan na ${z.data}`}
                </div>
                {p.rodzaj === 'schronienie_psp' && (
                  <a className="przycisk drugi" href={linkPSP(p)} target="_blank" rel="noreferrer">
                    Otwórz w aplikacji PSP
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </>
    );
  }

  return (
    <div className="punkty">
      <div className="punkty-zakladki" role="tablist" aria-label="Rodzaj punktu">
        {RODZAJE.map((x) => (
          <button key={x.rodzaj} role="tab" aria-selected={x.rodzaj === rodzaj} onClick={() => setRodzaj(x.rodzaj)}>
            <span className="kropka" style={{ background: x.kolor }} aria-hidden="true" />
            {x.etykieta}
          </button>
        ))}
      </div>
      {tresc}
      <p className="punkty-dane">
        Dane: {zrodlo.nazwa}
        {zrodlo.data && `, stan na ${zrodlo.data}`}.
      </p>
    </div>
  );
}

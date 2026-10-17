import { useEffect, useState } from 'react';
import type { Manifest, ModulProps, Punkt, RodzajPunktu } from '../../contracts';
import { azymut, formatujOdleglosc, kierunek, linkPSP, najblizsze, odlegloscM, zrodlaPaczki } from './najblizsze';
import { RODZAJE } from './rodzaje';
import { pokazOdcinek } from './trasa';
import './punkty.css';

type Wynik = { klucz: string } & ({ typ: 'gotowe'; punkty: Punkt[] } | { typ: 'blad' });

// „2026-10-17…” → „17.10.2026” bez przeliczania strefy czasowej.
const data = (iso?: string) => iso?.match(/^(\d{4})-(\d{2})-(\d{2})/)?.slice(1).reverse().join('.') ?? iso;

export function Panel({ wybrane, online }: ModulProps) {
  const [rodzaj, setRodzaj] = useState<RodzajPunktu>('schronienie_psp');
  const [calodobowe, setCalodobowe] = useState(false);
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const [proba, setProba] = useState(0);
  const [zrodla, setZrodla] = useState<Manifest['zrodla']>({});

  useEffect(() => {
    zrodlaPaczki().then(setZrodla, () => {});
  }, []);

  // Filtr całodobowych tylko tam, gdzie dostępność się różni (PSP i AED).
  const zFiltrem = rodzaj === 'schronienie_psp' || rodzaj === 'aed';
  const tylkoCalodobowe = zFiltrem && calodobowe;

  // Wynik dla innego klucza (miejsce, rodzaj, filtr, próba) oznacza ładowanie.
  const klucz = wybrane && `${wybrane.lat},${wybrane.lon},${rodzaj},${tylkoCalodobowe},${proba}`;
  useEffect(() => {
    if (!wybrane || !klucz) return;
    let aktualne = true;
    najblizsze(wybrane, rodzaj, 3, tylkoCalodobowe).then(
      (punkty) => aktualne && setWynik({ klucz, typ: 'gotowe', punkty }),
      () => aktualne && setWynik({ klucz, typ: 'blad' }),
    );
    return () => {
      aktualne = false;
    };
  }, [wybrane, rodzaj, tylkoCalodobowe, klucz]);
  const stan = wynik?.klucz === klucz ? wynik : { typ: 'ladowanie' as const };

  // Na mapie odcinek do najbliższego punktu; znika razem z panelem.
  const najblizszy = stan.typ === 'gotowe' ? stan.punkty[0] : undefined;
  useEffect(() => {
    pokazOdcinek(wybrane && najblizszy ? { od: wybrane, do: najblizszy } : null, false);
  }, [wybrane, najblizszy]);
  useEffect(() => () => pokazOdcinek(null, false), []);

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
    tresc = (
      <p className="punkty-info">
        {tylkoCalodobowe ? 'Brak całodobowych punktów w promieniu 20 km.' : 'Brak danych dla tego miejsca.'} Sprawdziliśmy: {zrodlo.nazwa}.
      </p>
    );
  } else {
    tresc = (
      <>
        {!online && <p className="punkty-info">Bez sieci: dane z pobranej paczki.</p>}
        <ul className="punkty-lista" data-testid="lista-punktow">
          {stan.punkty.map((p) => {
            const z = opisZrodla(p.zrodlo);
            const az = azymut(wybrane, p);
            return (
              <li key={p.id}>
                <div className="punkt-naglowek">
                  <strong>{p.nazwa}</strong>
                  <span>
                    <span className="strzalka" style={{ transform: `rotate(${Math.round(az)}deg)` }} aria-hidden="true">
                      ↑
                    </span>{' '}
                    {formatujOdleglosc(odlegloscM(wybrane, p))}
                  </span>
                </div>
                {p.adres && <div>{p.adres}</div>}
                {p.dostepnosc && <div>Dostępność: {p.dostepnosc}</div>}
                <div>Kierunek: {kierunek(az)}</div>
                <div className="punkt-zrodlo">
                  Źródło: {z.nazwa}
                  {z.data && `, stan na ${z.data}`}
                </div>
                <div className="punkt-akcje">
                  <button className="przycisk drugi" onClick={() => pokazOdcinek({ od: wybrane, do: p }, true)}>
                    Pokaż na mapie
                  </button>
                  {p.rodzaj === 'schronienie_psp' && (
                    <a className="przycisk drugi" href={linkPSP(p)} target="_blank" rel="noreferrer">
                      Otwórz w aplikacji PSP
                    </a>
                  )}
                </div>
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
      {zFiltrem && (
        <label className="punkty-filtr">
          <input type="checkbox" checked={calodobowe} onChange={(e) => setCalodobowe(e.target.checked)} />
          Tylko całodobowe
        </label>
      )}
      {tresc}
      <p className="punkty-dane">
        Dane: {zrodlo.nazwa}
        {zrodlo.data && `, stan na ${zrodlo.data}`}.
      </p>
    </div>
  );
}

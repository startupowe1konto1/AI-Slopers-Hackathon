import { useEffect, useMemo, useState } from 'react';
import type { ModulProps, Pojazd, StanLive, Wiatr } from '../../contracts';
import { fetchLive } from '../../offline/live-cache';
import { godzina, kierunekNazwa, najblizszaStacja, podsumuj, wOkolicy } from './okolica';
import { ustawPojazdy } from './warstwy';
import './live.css';

const PROMIEN_M = 1000;
const ODSWIEZANIE_MS = 20_000;

// undefined = ładowanie, null = brak danych i brak zapisu (fetchLive)
type Stan<T> = StanLive<T> | null | undefined;

const Z_KIERUNKU: Record<string, string> = {
  N: 'północy',
  NE: 'północnego wschodu',
  E: 'wschodu',
  SE: 'południowego wschodu',
  S: 'południa',
  SW: 'południowego zachodu',
  W: 'zachodu',
  NW: 'północnego zachodu',
};
const ms = (v: number) => v.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function StanNa({ s, online }: { s: StanLive<unknown>; online: boolean }) {
  const g = godzina(s.stanNa);
  if (!s.zCache) return <p className="live-stan">Stan na {g}</p>;
  return (
    <p className="live-stan live-uwaga">
      {online ? `Źródło nie odpowiada. Ostatni stan z ${g}.` : `Brak sieci. Ostatni stan z ${g}.`}
    </p>
  );
}

function Brak({ online, nazwa }: { online: boolean; nazwa: string }) {
  return (
    <p className="live-info" role="status" aria-label={nazwa}>
      {online
        ? 'Źródło danych nie odpowiada. Spróbujemy ponownie za 20 s.'
        : 'Brak sieci i brak zapisanego stanu. Połącz się, żeby zobaczyć dane na żywo.'}
    </p>
  );
}

const Szkielet = ({ nazwa }: { nazwa: string }) => <div className="live-szkielet" aria-busy="true" aria-label={nazwa} />;

export function Panel({ miejsca, wybrane, online }: ModulProps) {
  const [pojazdy, setPojazdy] = useState<Stan<Pojazd[]>>(undefined);
  const [wiatr, setWiatr] = useState<Stan<Wiatr[]>>(undefined);

  useEffect(() => {
    let aktywne = true;
    const odswiez = () => {
      fetchLive<Pojazd[]>('pojazdy').then(
        (s) => aktywne && setPojazdy(s),
        () => aktywne && setPojazdy(null),
      );
      fetchLive<Wiatr[]>('wiatr').then(
        (s) => aktywne && setWiatr(s),
        () => aktywne && setWiatr(null),
      );
    };
    odswiez();
    const t = online ? setInterval(odswiez, ODSWIEZANIE_MS) : undefined;
    return () => {
      aktywne = false;
      clearInterval(t);
    };
  }, [online]);

  const centrum = wybrane ?? miejsca[0]?.adres ?? null;
  const lat = centrum?.lat;
  const lon = centrum?.lon;
  const blisko = useMemo(
    () => (pojazdy && lat != null && lon != null ? wOkolicy(pojazdy.dane, { lat, lon }, PROMIEN_M) : []),
    [pojazdy, lat, lon],
  );

  useEffect(() => ustawPojazdy(blisko), [blisko]);
  useEffect(() => () => ustawPojazdy([]), []);

  if (!centrum) {
    return <p className="live-info">Wybierz miejsce u góry ekranu, żeby zobaczyć, co jeździ w okolicy.</p>;
  }

  const suma = podsumuj(blisko);
  const tramwajeWMiescie = pojazdy?.dane.some((p) => p.typ === 'tramwaj') ?? false;
  const stacja = wiatr ? najblizszaStacja(wiatr.dane, centrum) : null;

  return (
    <div className="live">
      <section className="live-sekcja" aria-label="Pojazdy w okolicy">
        <h3>Co jeździ w Twojej okolicy (1 km)</h3>
        {pojazdy === undefined ? (
          <Szkielet nazwa="Ładowanie pojazdów" />
        ) : pojazdy === null ? (
          <Brak online={online} nazwa="Pojazdy niedostępne" />
        ) : (
          <>
            <StanNa s={pojazdy} online={online} />
            {blisko.length === 0 ? (
              <p className="live-info">W promieniu 1 km nie ma teraz żadnego autobusu ani tramwaju.</p>
            ) : (
              <>
                <p className="live-liczby">
                  Autobusy: {suma.autobusy} · Tramwaje: {suma.tramwaje}
                </p>
                <p className="live-info">Linie: {suma.linie.join(', ')}</p>
                {suma.tramwaje === 0 && tramwajeWMiescie && (
                  <p className="live-info">W Twojej okolicy nie jeżdżą teraz tramwaje.</p>
                )}
              </>
            )}
          </>
        )}
      </section>

      <section className="live-sekcja" aria-label="Wiatr">
        <h3>Wiatr</h3>
        {wiatr === undefined ? (
          <Szkielet nazwa="Ładowanie wiatru" />
        ) : wiatr === null ? (
          <Brak online={online} nazwa="Wiatr niedostępny" />
        ) : (
          <>
            <StanNa s={wiatr} online={online} />
            {!stacja ? (
              <p className="live-info">Brak pomiarów wiatru ze stacji miejskich.</p>
            ) : (
              <div className="live-wiatr">
                {stacja.predkoscMs > 0 && (
                  // strzałka pokazuje, DOKĄD wieje wiatr
                  <svg className="live-strzalka" viewBox="0 0 32 32" aria-hidden="true" style={{ transform: `rotate(${stacja.kierunekDeg + 180}deg)` }}>
                    <path d="M16 3l9 22-9-5-9 5z" fill="currentColor" />
                  </svg>
                )}
                <div>
                  <p className="live-liczby">
                    {stacja.predkoscMs > 0
                      ? `Wiatr z ${Z_KIERUNKU[kierunekNazwa(stacja.kierunekDeg)]}, ${ms(stacja.predkoscMs)} m/s`
                      : 'Bezwietrznie (0 m/s)'}
                  </p>
                  <p className="live-info">
                    {stacja.stacja}, pomiar z {stacja.czas.slice(11, 16)}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <p className="live-zrodlo">
        Źródła: {[pojazdy?.zrodlo, wiatr?.zrodlo].filter(Boolean).join('; ') || 'dane.um.warszawa.pl'}
      </p>
    </div>
  );
}

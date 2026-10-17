import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ModulProps, Pojazd, StanLive, Wiatr, Wsp } from '../../contracts';
import type { Powietrze, StacjaRowerowa, Utrudnienie } from '../../../server/live/typy';
import { fetchLive } from '../../offline/live-cache';
import { stozekDymu } from './dym';
import {
  dzien,
  godzina,
  kierunekNazwa,
  liczba,
  najblizszaStacja,
  odleglosc,
  odlegloscM,
  podsumuj,
  rowerowe,
  terazWarszawa,
  utrudnieniaWOkolicy,
  wOkolicy,
} from './okolica';
import { ustawDym, ustawPojazdy, ustawRowery, ustawUtrudnienia, wybierzNaMapie } from './warstwy';
import './live.css';

const PROMIEN_M = 1000;
const PROMIEN_UTRUDNIEN_M = 2000;
const ODSWIEZANIE_MS = 20_000;
const KLUCZ_DYMU = 'live:dym';

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

const rowerow = (n: number) => {
  if (n === 1) return 'rower';
  const d = n % 10;
  const s = n % 100;
  return d >= 2 && d <= 4 && (s < 12 || s > 14) ? 'rowery' : 'rowerów';
};
const pm = (v: number | null) => (v == null ? 'brak pomiaru' : `${liczba(v)} µg/m³`);

// Punkt dymu zostaje tylko w tym urządzeniu.
function wczytajDym(): Wsp | null {
  try {
    const v = JSON.parse(localStorage.getItem(KLUCZ_DYMU) ?? 'null');
    return v && typeof v.lat === 'number' && typeof v.lon === 'number' ? { lat: v.lat, lon: v.lon } : null;
  } catch {
    return null;
  }
}
function zapiszDym(p: Wsp | null) {
  try {
    if (p) localStorage.setItem(KLUCZ_DYMU, JSON.stringify(p));
    else localStorage.removeItem(KLUCZ_DYMU);
  } catch {
    // brak dostępu do pamięci: punkt zostaje do zamknięcia strony
  }
}

function useLive<T>(nazwa: string, online: boolean): Stan<T> {
  const [s, setS] = useState<Stan<T>>(undefined);
  useEffect(() => {
    let aktywne = true;
    const odswiez = () =>
      fetchLive<T>(nazwa).then(
        (x) => aktywne && setS(x),
        () => aktywne && setS(null),
      );
    odswiez();
    const t = online ? setInterval(odswiez, ODSWIEZANIE_MS) : undefined;
    return () => {
      aktywne = false;
      clearInterval(t);
    };
  }, [nazwa, online]);
  return s;
}

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

function Sekcja<T>(p: { tytul: string; nazwa: string; s: Stan<T>; online: boolean; children: (s: StanLive<T>) => ReactNode }) {
  return (
    <section className="live-sekcja" aria-label={p.tytul}>
      <h3>{p.tytul}</h3>
      {p.s === undefined ? (
        <div className="live-szkielet" aria-busy="true" aria-label={`Ładowanie: ${p.nazwa}`} />
      ) : p.s === null ? (
        <Brak online={p.online} nazwa={`Niedostępne: ${p.nazwa}`} />
      ) : (
        <>
          <StanNa s={p.s} online={p.online} />
          {p.children(p.s)}
        </>
      )}
    </section>
  );
}

export function Panel({ miejsca, wybrane, online }: ModulProps) {
  const pojazdy = useLive<Pojazd[]>('pojazdy', online);
  const wiatr = useLive<Wiatr[]>('wiatr', online);
  const powietrze = useLive<Powietrze[]>('powietrze', online);
  const rowery = useLive<StacjaRowerowa[]>('rowery', online);
  const utrudnienia = useLive<Utrudnienie[]>('utrudnienia', online);
  const [dym, setDym] = useState<Wsp | null>(wczytajDym);
  const [wybieranie, setWybieranie] = useState(false);

  const centrum = wybrane ?? miejsca[0]?.adres ?? null;
  const lat = centrum?.lat;
  const lon = centrum?.lon;
  const blisko = useMemo(
    () => (pojazdy && lat != null && lon != null ? wOkolicy(pojazdy.dane, { lat, lon }, PROMIEN_M) : []),
    [pojazdy, lat, lon],
  );
  const stacjeRowerowe = useMemo(() => (rowery && lat != null && lon != null ? rowerowe(rowery.dane, { lat, lon }) : []), [rowery, lat, lon]);
  const utrudnieniaBlisko = useMemo(
    () => (utrudnienia && lat != null && lon != null ? utrudnieniaWOkolicy(utrudnienia.dane, { lat, lon }, PROMIEN_UTRUDNIEN_M).slice(0, 5) : []),
    [utrudnienia, lat, lon],
  );
  const wiatrDymu = dym && wiatr ? najblizszaStacja(wiatr.dane, dym) : null;
  const kierunekDymu = wiatrDymu && wiatrDymu.predkoscMs > 0 ? wiatrDymu.kierunekDeg : null;
  const stozek = useMemo(() => (dym && kierunekDymu != null ? stozekDymu(dym, kierunekDymu) : null), [dym, kierunekDymu]);

  useEffect(() => ustawPojazdy(blisko), [blisko]);
  useEffect(() => ustawRowery(stacjeRowerowe), [stacjeRowerowe]);
  useEffect(() => ustawUtrudnienia(utrudnieniaBlisko.map((x) => x.u)), [utrudnieniaBlisko]);
  useEffect(() => ustawDym(dym, stozek), [dym, stozek]);
  useEffect(() => zapiszDym(dym), [dym]);
  useEffect(
    () => () => {
      ustawPojazdy([]);
      ustawRowery([]);
      ustawUtrudnienia([]);
      ustawDym(null, null);
    },
    [],
  );

  if (!centrum) {
    return <p className="live-info">Wybierz miejsce u góry ekranu, żeby zobaczyć, co jeździ w okolicy.</p>;
  }
  if ([pojazdy, wiatr, powietrze, rowery, utrudnienia].every((s) => s === null)) {
    return <Brak online={online} nazwa="Dane na żywo niedostępne" />;
  }

  const zaznaczDym = async () => {
    setWybieranie(true);
    const p = await wybierzNaMapie();
    setWybieranie(false);
    if (p) setDym(p);
  };
  const teraz = terazWarszawa();
  const zrodla = [pojazdy, wiatr, powietrze, rowery, utrudnienia].map((s) => s?.zrodlo).filter(Boolean);

  return (
    <div className="live">
      <Sekcja tytul="Co jeździ w Twojej okolicy (1 km)" nazwa="pojazdy" s={pojazdy} online={online}>
        {(s) => {
          if (!blisko.length) return <p className="live-info">W promieniu 1 km nie ma teraz żadnego autobusu ani tramwaju.</p>;
          const suma = podsumuj(blisko);
          return (
            <>
              <p className="live-liczby">
                Autobusy: {suma.autobusy} · Tramwaje: {suma.tramwaje}
              </p>
              <p className="live-info">Linie: {suma.linie.join(', ')}</p>
              {suma.tramwaje === 0 && s.dane.some((p) => p.typ === 'tramwaj') && (
                <p className="live-info">W Twojej okolicy nie jeżdżą teraz tramwaje.</p>
              )}
            </>
          );
        }}
      </Sekcja>

      <Sekcja tytul="Wiatr" nazwa="wiatr" s={wiatr} online={online}>
        {(s) => {
          const stacja = najblizszaStacja(s.dane, centrum);
          return (
            <>
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
                        ? `Wiatr z ${Z_KIERUNKU[kierunekNazwa(stacja.kierunekDeg)]}, ${liczba(stacja.predkoscMs)} m/s`
                        : 'Bezwietrznie (0 m/s)'}
                    </p>
                    <p className="live-info">
                      {stacja.stacja}, pomiar z {stacja.czas.slice(11, 16)}
                    </p>
                  </div>
                </div>
              )}
              <div className="live-dym">
                {!dym ? (
                  <>
                    <button className="przycisk drugi" onClick={zaznaczDym} disabled={wybieranie}>
                      Widzę dym — tutaj
                    </button>
                    {wybieranie && <p className="live-info">Kliknij na mapie miejsce, w którym widzisz dym.</p>}
                  </>
                ) : (
                  <>
                    <p className="live-info">
                      {stozek && wiatrDymu
                        ? `Szary stożek na mapie pokazuje, dokąd wiatr niesie dym (3 km). Pomiar: ${wiatrDymu.stacja}, ${liczba(wiatrDymu.predkoscMs)} m/s.`
                        : 'Bezwietrznie: nie da się wskazać, dokąd wiatr niesie dym.'}
                    </p>
                    <p className="live-info live-uwaga">To kierunek wiatru, nie model rozprzestrzeniania się dymu.</p>
                    <p className="live-stan">Zaznaczenie zostaje tylko w tym telefonie.</p>
                    <button className="przycisk drugi" onClick={() => setDym(null)}>
                      Usuń zaznaczenie dymu
                    </button>
                  </>
                )}
              </div>
            </>
          );
        }}
      </Sekcja>

      <Sekcja tytul={dym ? 'Jakość powietrza przy dymie' : 'Jakość powietrza'} nazwa="powietrze" s={powietrze} online={online}>
        {(s) => {
          const punkt = dym ?? centrum;
          const st = najblizszaStacja(s.dane, punkt);
          if (!st) return <p className="live-info">Brak pomiarów pyłów ze stacji.</p>;
          return (
            <>
              <p className="live-liczby">
                PM2,5: {pm(st.pm25)} · PM10: {pm(st.pm10)}
              </p>
              <p className="live-info">
                {st.stacja}, {odleglosc(odlegloscM(punkt, st))}, pomiar z {st.czas.slice(11, 16)}
              </p>
            </>
          );
        }}
      </Sekcja>

      <Sekcja tytul="Rowery Veturilo (1 km)" nazwa="rowery" s={rowery} online={online}>
        {() =>
          stacjeRowerowe.length ? (
            <ul className="live-lista">
              {stacjeRowerowe.map((st) => (
                <li key={`${st.nazwa}-${st.lat}`}>
                  {st.nazwa}: {st.rowery} {rowerow(st.rowery)}, {odleglosc(st.odlegloscM)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="live-info">W promieniu 1 km nie ma teraz stacji z wolnymi rowerami.</p>
          )
        }
      </Sekcja>

      <Sekcja tytul="Utrudnienia w ruchu (2 km)" nazwa="utrudnienia" s={utrudnienia} online={online}>
        {() =>
          utrudnieniaBlisko.length ? (
            <ul className="live-lista">
              {utrudnieniaBlisko.map(({ u, odlegloscM: d }) => (
                <li key={u.id}>
                  <strong>{u.nazwa}</strong>
                  <div className="live-info">
                    {u.od > teraz ? `od ${dzien(u.od)}` : u.do ? `do ${dzien(u.do)}` : 'do odwołania'}, {odleglosc(d)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="live-info">Brak zgłoszonych utrudnień w promieniu 2 km.</p>
          )
        }
      </Sekcja>

      <p className="live-zrodlo">Źródła: {zrodla.join('; ') || 'dane.um.warszawa.pl'}</p>
    </div>
  );
}

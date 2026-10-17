import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Akcja, Profil, Poziom, Wskazowka, Wsp } from '../contracts';
import { etykietaAkcji, wykonajKomunikacje, wykonajNaMapie } from './akcje';
import { WyborTrybu, type Tryb } from './WyborTrybu';

const POZIOM: Record<Poziom, string> = { ok: 'W porządku', uwaga: 'Uwaga', alarm: 'Ważne', brak: 'Brak danych' };
const BEZ_MAPY = 'Mapa jeszcze się wczytuje.';

type Props = {
  karty: Wskazowka[];
  ladowanie: number;
  mapa: MapLibreMap | null;
  od: Wsp;
  onOdswiez: () => void;
  blackout?: boolean;
  onBlackout?: (b: boolean) => void;
};
type Cel = { cel: Wsp; nazwa: string; profil?: Profil };

export function Karty({ karty, ladowanie, mapa, od, onOdswiez, blackout = false, onBlackout = () => {} }: Props) {
  const [otwarta, setOtwarta] = useState<string | null>(null);
  const [opis, setOpis] = useState<string | null>(null);
  const [szczegolyTrasy, setSzczegolyTrasy] = useState<string[] | null>(null);
  // Cel ostatniej trasy w karcie: pod nią przełącznik „Pieszo | Komunikacja”.
  const [cel, setCel] = useState<Cel | null>(null);
  const [tryb, setTryb] = useState<Tryb>('pieszo');
  const sprzatanie = useRef<() => void>(() => {});
  const nr = useRef(0); // ostatnie kliknięcie wygrywa, spóźniona trasa się nie rysuje

  const wyczysc = () => {
    nr.current++;
    sprzatanie.current();
    sprzatanie.current = () => {};
    setOpis(null);
    setSzczegolyTrasy(null);
  };
  useEffect(
    () => () => {
      nr.current++; // trasa w toku po odmontowaniu już się nie narysuje
      sprzatanie.current();
    },
    [],
  );
  // Inne miejsce: zamykamy kartę i czyścimy mapę.
  useEffect(() => {
    wyczysc();
    setOtwarta(null);
    setCel(null);
  }, [od.lat, od.lon]);

  const uruchom = async (a: Akcja) => {
    if (a.typ === 'przycisk') {
      // Błąd akcji modułu zostaje w konsoli; karty i tak się odświeżają, żeby pokazać aktualny stan.
      try {
        await a.wykonaj();
      } catch (e) {
        console.error('[karta] akcja się nie udała', e);
      }
      onOdswiez();
      return;
    }
    if (a.typ === 'link') return;
    wyczysc();
    setCel(a.typ === 'trasa' ? { cel: a.cel, nazwa: a.nazwa, profil: a.profil } : null);
    setTryb('pieszo');
    // Przed załadowaniem mapy tylko komunikat; przyciski akcji w rozwiniętej karcie działają, gdy mapa będzie gotowa.
    if (!mapa) return setOpis(BEZ_MAPY);
    const moje = nr.current;
    if (a.typ === 'trasa') setOpis('Wyznaczam trasę…');
    const w = await wykonajNaMapie(a, mapa, od, () => moje === nr.current);
    if (moje !== nr.current) return w.sprzatanie();
    sprzatanie.current = w.sprzatanie;
    setOpis(w.opis ?? null);
  };

  const komunikacja = async (c: Cel, zBlackoutem: boolean) => {
    wyczysc();
    if (!mapa) return setOpis(BEZ_MAPY);
    const moje = nr.current;
    setOpis('Szukam połączenia…');
    const w = await wykonajKomunikacje(mapa, od, c.cel, zBlackoutem, () => moje === nr.current);
    if (moje !== nr.current) return w.sprzatanie();
    sprzatanie.current = w.sprzatanie;
    setOpis(w.opis ?? null);
    setSzczegolyTrasy(w.szczegoly ?? null);
  };

  const zmienTryb = (t: Tryb) => {
    if (!cel) return;
    if (t === 'komunikacja') {
      setTryb(t);
      void komunikacja(cel, blackout);
    } else void uruchom({ typ: 'trasa', ...cel });
  };

  const zmienBlackout = (b: boolean) => {
    onBlackout(b);
    if (cel && tryb === 'komunikacja') void komunikacja(cel, b);
  };

  const kliknij = (w: Wskazowka) => {
    wyczysc();
    setCel(null);
    if (otwarta === w.id) return setOtwarta(null);
    setOtwarta(w.id);
    const pierwsza = w.akcje[0];
    if (pierwsza?.typ === 'trasa' || pierwsza?.typ === 'mapa') void uruchom(pierwsza);
  };

  return (
    <section className="karty" aria-label="Twoja sytuacja">
      <h2>Twoja sytuacja</h2>
      {!karty.length && !ladowanie && <p className="karty-pusto">Brak wskazówek dla tego miejsca.</p>}
      <ul>
        {karty.map((w) => (
          <li key={w.id} className={`karta karta-${w.poziom}`} data-testid={`karta-${w.id}`}>
            <button className="karta-glowna" aria-expanded={otwarta === w.id} onClick={() => kliknij(w)}>
              <span className="karta-tytul">{w.tytul}</span>
              <span className="karta-poziom">{POZIOM[w.poziom]}</span>
              <span className="karta-tekst">{w.tekst}</span>
            </button>
            {otwarta === w.id && (
              <div className="karta-szczegoly">
                {opis && !(mapa && opis === BEZ_MAPY) && <p role="status">{opis}</p>}
                {cel && (
                  <WyborTrybu
                    tryb={tryb}
                    pierwszy={cel.profil === 'rower' ? 'Rowerem' : 'Pieszo'}
                    onTryb={zmienTryb}
                    blackout={blackout}
                    onBlackout={zmienBlackout}
                  />
                )}
                {szczegolyTrasy && (
                  <ul className="trasa-szczegoly">
                    {szczegolyTrasy.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                {w.szczegoly && (
                  <ul>
                    {w.szczegoly.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                {w.akcje.length > 0 && (
                  <div className="karta-akcje">
                    {w.akcje.map((a, i) =>
                      a.typ === 'link' ? (
                        <a key={i} className="przycisk drugi" href={a.url} target="_blank" rel="noreferrer">
                          {a.etykieta}
                        </a>
                      ) : (
                        <button key={i} className="przycisk drugi" onClick={() => void uruchom(a)}>
                          {etykietaAkcji(a)}
                        </button>
                      ),
                    )}
                  </div>
                )}
                <p className="karta-zrodlo">
                  Źródło: {w.zrodlo}
                  {w.stanNa && `, stan na ${w.stanNa}`}
                </p>
              </div>
            )}
          </li>
        ))}
        {Array.from({ length: ladowanie }, (_, i) => (
          <li key={`ladowanie-${i}`} className="karta karta-szkielet" aria-busy="true" aria-label="Ładowanie wskazówki" />
        ))}
      </ul>
    </section>
  );
}

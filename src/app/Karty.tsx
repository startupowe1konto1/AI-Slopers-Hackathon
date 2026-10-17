import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Akcja, Poziom, Wskazowka, Wsp } from '../contracts';
import { etykietaAkcji, wykonajNaMapie } from './akcje';

const POZIOM: Record<Poziom, string> = { ok: 'W porządku', uwaga: 'Uwaga', alarm: 'Ważne', brak: 'Brak danych' };

type Props = { karty: Wskazowka[]; ladowanie: number; mapa: MapLibreMap | null; od: Wsp; onOdswiez: () => void };

export function Karty({ karty, ladowanie, mapa, od, onOdswiez }: Props) {
  const [otwarta, setOtwarta] = useState<string | null>(null);
  const [opis, setOpis] = useState<string | null>(null);
  const sprzatanie = useRef<() => void>(() => {});
  const nr = useRef(0); // ostatnie kliknięcie wygrywa, spóźniona trasa się nie rysuje

  const wyczysc = () => {
    nr.current++;
    sprzatanie.current();
    sprzatanie.current = () => {};
    setOpis(null);
  };
  useEffect(() => () => sprzatanie.current(), []);
  // Inne miejsce: zamykamy kartę i czyścimy mapę.
  useEffect(() => {
    wyczysc();
    setOtwarta(null);
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
    if (a.typ === 'link' || !mapa) return;
    wyczysc();
    const moje = nr.current;
    const w = await wykonajNaMapie(a, mapa, od);
    if (moje !== nr.current) return w.sprzatanie();
    sprzatanie.current = w.sprzatanie;
    setOpis(w.opis ?? null);
  };

  const kliknij = (w: Wskazowka) => {
    wyczysc();
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
                {opis && <p role="status">{opis}</p>}
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

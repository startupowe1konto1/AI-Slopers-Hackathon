import { useCallback, useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Wsp, WyznaczTrase } from '../contracts';
import { wykonajKomunikacje, wykonajNaMapie, type WynikKomunikacji } from './akcje';
import { WyborTrybu, type Tryb } from './WyborTrybu';

type Props = {
  mapa: MapLibreMap | null;
  od: Wsp;
  cel: WyznaczTrase;
  blackout: boolean;
  onBlackout: (b: boolean) => void;
  onZamknij: () => void;
};

// Arkusz trasy do punktu wybranego w dymku na mapie. Zajmuje miejsce listy kart; zamknięcie czyści mapę.
export function ArkuszTrasy({ mapa, od, cel, blackout, onBlackout, onZamknij }: Props) {
  const [tryb, setTryb] = useState<Tryb>('pieszo');
  const [opis, setOpis] = useState<string | null>(null);
  const [szczegoly, setSzczegoly] = useState<string[] | null>(null);
  const sprzatanie = useRef<() => void>(() => {});
  const nr = useRef(0); // ostatnie wywołanie wygrywa

  const pokaz = useCallback(
    async (t: Tryb, zBlackoutem: boolean) => {
      const moje = ++nr.current;
      sprzatanie.current();
      sprzatanie.current = () => {};
      setSzczegoly(null);
      if (!mapa) return setOpis('Mapa jeszcze się wczytuje.');
      const aktualne = () => moje === nr.current;
      setOpis(t === 'pieszo' ? 'Wyznaczam trasę…' : 'Szukam połączenia…');
      const w: WynikKomunikacji =
        t === 'pieszo'
          ? await wykonajNaMapie({ typ: 'trasa', cel: cel.cel, nazwa: cel.nazwa }, mapa, od, aktualne)
          : await wykonajKomunikacje(mapa, od, cel.cel, zBlackoutem, aktualne);
      if (!aktualne()) return w.sprzatanie();
      sprzatanie.current = w.sprzatanie;
      setOpis(w.opis ?? null);
      setSzczegoly(w.szczegoly ?? null);
    },
    [mapa, od, cel],
  );

  // Nowy cel: zaczynamy od trasy pieszo.
  const blackoutTeraz = useRef(blackout);
  blackoutTeraz.current = blackout;
  useEffect(() => {
    setTryb('pieszo');
    void pokaz('pieszo', blackoutTeraz.current);
  }, [pokaz]);
  useEffect(
    () => () => {
      nr.current++;
      sprzatanie.current();
    },
    [],
  );

  const zmienTryb = (t: Tryb) => {
    setTryb(t);
    void pokaz(t, blackout);
  };
  const zmienBlackout = (b: boolean) => {
    onBlackout(b);
    if (tryb === 'komunikacja') void pokaz('komunikacja', b);
  };

  return (
    <section className="arkusz-trasy" aria-label="Trasa do punktu">
      <header className="arkusz-naglowek">
        <div>
          <span className="arkusz-nadtytul">Trasa do</span>
          <h2>{cel.nazwa}</h2>
        </div>
        <button type="button" className="arkusz-zamknij" aria-label="Zamknij trasę" onClick={onZamknij}>
          <svg viewBox="0 0 256 256" width="16" height="16" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M205.66 194.34a8 8 0 0 1-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 0 1-11.32-11.32L116.69 128L50.34 61.66a8 8 0 0 1 11.32-11.32L128 116.69l66.34-66.35a8 8 0 0 1 11.32 11.32L139.31 128Z" />
          </svg>
        </button>
      </header>
      <WyborTrybu tryb={tryb} onTryb={zmienTryb} blackout={blackout} onBlackout={zmienBlackout} />
      {opis && <p role="status">{opis}</p>}
      {szczegoly && (
        <ul className="trasa-szczegoly">
          {szczegoly.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

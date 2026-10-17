import { useRef, type KeyboardEvent } from 'react';
import './trasa.css';

export type Tryb = 'pieszo' | 'komunikacja';
const TRYBY: Tryb[] = ['pieszo', 'komunikacja'];
const KROK: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

type Props = {
  tryb: Tryb;
  pierwszy?: string; // etykieta trybu bez komunikacji: „Pieszo” albo „Rowerem”
  onTryb: (t: Tryb) => void;
  blackout: boolean;
  onBlackout: (b: boolean) => void;
};

// Przełącznik „Pieszo | Komunikacja” pod trasą; przy komunikacji także założenie blackoutu.
// Wzorzec radiogroup: w kolejności Tab tylko zaznaczony przycisk, strzałki zmieniają wybór (w kółko).
export function WyborTrybu({ tryb, pierwszy = 'Pieszo', onTryb, blackout, onBlackout }: Props) {
  const przyciski = useRef<(HTMLButtonElement | null)[]>([]);
  const strzalka = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const krok = KROK[e.key];
    if (!krok) return;
    e.preventDefault();
    const j = (i + krok + TRYBY.length) % TRYBY.length;
    przyciski.current[j]?.focus();
    if (TRYBY[j] !== tryb) onTryb(TRYBY[j]);
  };
  return (
    <div className="tryb">
      <div className="tryb-przelacznik" role="radiogroup" aria-label="Jak dotrzeć">
        {TRYBY.map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              przyciski.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={tryb === t}
            tabIndex={tryb === t ? 0 : -1}
            onClick={() => tryb !== t && onTryb(t)}
            onKeyDown={(e) => strzalka(e, i)}
          >
            {t === 'pieszo' ? pierwszy : 'Komunikacja'}
          </button>
        ))}
      </div>
      {tryb === 'komunikacja' && (
        <label className="tryb-blackout">
          <input type="checkbox" role="switch" checked={blackout} onChange={(e) => onBlackout(e.target.checked)} />
          <span>Zakładam blackout</span>
        </label>
      )}
    </div>
  );
}

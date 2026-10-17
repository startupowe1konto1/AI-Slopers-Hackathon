import './trasa.css';

export type Tryb = 'pieszo' | 'komunikacja';

type Props = {
  tryb: Tryb;
  pierwszy?: string; // etykieta trybu bez komunikacji: „Pieszo” albo „Rowerem”
  onTryb: (t: Tryb) => void;
  blackout: boolean;
  onBlackout: (b: boolean) => void;
};

// Przełącznik „Pieszo | Komunikacja” pod trasą; przy komunikacji także założenie blackoutu.
export function WyborTrybu({ tryb, pierwszy = 'Pieszo', onTryb, blackout, onBlackout }: Props) {
  return (
    <div className="tryb">
      <div className="tryb-przelacznik" role="radiogroup" aria-label="Jak dotrzeć">
        <button type="button" role="radio" aria-checked={tryb === 'pieszo'} onClick={() => tryb !== 'pieszo' && onTryb('pieszo')}>
          {pierwszy}
        </button>
        <button type="button" role="radio" aria-checked={tryb === 'komunikacja'} onClick={() => tryb !== 'komunikacja' && onTryb('komunikacja')}>
          Komunikacja
        </button>
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

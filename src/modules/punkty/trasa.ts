import type { Wsp } from '../../contracts';

// Odcinek „wybrane miejsce → punkt”: ustawia go panel, rysują warstwy mapy.
export type Odcinek = { od: Wsp; do: Wsp } | null;
type Sluchacz = (o: Odcinek, dopasuj: boolean) => void;

const sluchacze = new Set<Sluchacz>();
let biezacy: Odcinek = null;

// dopasuj: przesuń mapę tak, żeby było widać oba końce odcinka
export function pokazOdcinek(o: Odcinek, dopasuj: boolean): void {
  biezacy = o;
  sluchacze.forEach((f) => f(o, dopasuj));
}

export function sluchajOdcinka(f: Sluchacz): () => void {
  sluchacze.add(f);
  f(biezacy, false);
  return () => void sluchacze.delete(f);
}

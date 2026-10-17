import { get, set } from 'idb-keyval';
import { useEffect, useState } from 'react';
import type { MiejsceUzytkownika } from '../contracts';

// Adresy użytkownika zostają w przeglądarce (IndexedDB), nie trafiają na serwer.
const KLUCZ = 'miejsca';
const sluchacze = new Set<(m: MiejsceUzytkownika[]) => void>();

export async function zapiszMiejsca(m: MiejsceUzytkownika[]): Promise<void> {
  await set(KLUCZ, m);
  sluchacze.forEach((f) => f(m));
}

export function useMiejsca(): { miejsca: MiejsceUzytkownika[]; gotowe: boolean } {
  const [miejsca, setMiejsca] = useState<MiejsceUzytkownika[]>([]);
  const [gotowe, setGotowe] = useState(false);
  useEffect(() => {
    get<MiejsceUzytkownika[]>(KLUCZ).then((v) => {
      setMiejsca(v ?? []);
      setGotowe(true);
    });
    sluchacze.add(setMiejsca);
    return () => {
      sluchacze.delete(setMiejsca);
    };
  }, []);
  return { miejsca, gotowe };
}

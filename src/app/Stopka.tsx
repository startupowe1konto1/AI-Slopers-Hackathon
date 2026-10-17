import { useEffect, useState } from 'react';
import type { Manifest } from '../contracts';
import { zrodlaDoStopki } from './zrodla';

const data = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pl-PL');
};

// Atrybucje i licencje (docs/SPEC.md §7). Manifest jest w paczce offline, więc działa też bez sieci.
export function Stopka() {
  const [manifest, setManifest] = useState<Manifest | null>(null);

  useEffect(() => {
    fetch('/pack/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setManifest)
      .catch(() => setManifest(null));
  }, []);

  return (
    <details className="stopka">
      <summary>Źródła danych i licencje</summary>
      <ul>
        {zrodlaDoStopki(manifest).map((z) => (
          <li key={z.nazwa}>
            <a href={z.url} target="_blank" rel="noreferrer">
              {z.nazwa}
            </a>
            {/* Bez nawiasu wokół licencji: nazwy i licencje źródeł mają własne nawiasy. */}
            {` · ${z.licencja}, pobrano ${data(z.pobrano)}`}
          </li>
        ))}
      </ul>
      <p>Aplikacja nie ogłasza alarmów. Komunikaty o zagrożeniu: syreny, Alert RCB, RSO.</p>
    </details>
  );
}

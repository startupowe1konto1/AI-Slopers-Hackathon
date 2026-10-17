import { useEffect, useState } from 'react';
import type { Modul, RolaMiejsca } from '../contracts';
import { moduly } from '../modules';
import { useSiec } from '../offline/siec';
import { useMiejsca } from './miejsca';
import { Onboarding } from './Onboarding';
import { MapView } from '../map/MapView';
import { stanPaczki } from '../offline/paczka';
import { Stopka } from './Stopka';

export default function App() {
  const { miejsca, gotowe } = useMiejsca();
  const { online, wymuszonyOffline } = useSiec();
  const [edycja, setEdycja] = useState(false);
  const [rola, setRola] = useState<RolaMiejsca>('dom');
  const [aktywny, setAktywny] = useState<Modul['id']>(moduly[0].id);
  const [paczka, setPaczka] = useState<string | null>(null);

  useEffect(() => {
    stanPaczki().then((s) =>
      setPaczka(s ? new Date(s.zbudowano).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : null),
    );
  }, [edycja]);

  useEffect(() => {
    if (miejsca.length && !miejsca.some((m) => m.rola === rola)) setRola(miejsca[0].rola);
  }, [miejsca, rola]);

  if (!gotowe) return null;
  if (!miejsca.length || edycja) {
    return (
      <div className="aplikacja" style={{ display: 'block' }}>
        <Onboarding poczatkowe={miejsca} onGotowe={() => setEdycja(false)} />
      </div>
    );
  }

  const wybrane = miejsca.find((m) => m.rola === rola)?.adres ?? null;
  const modul = moduly.find((m) => m.id === aktywny) ?? moduly[0];
  const Panel = modul.Panel;

  return (
    <div className="aplikacja">
      <header className="pasek">
        <select aria-label="Wybrane miejsce" value={rola} onChange={(e) => setRola(e.target.value as RolaMiejsca)}>
          {miejsca.map((m) => (
            <option key={m.rola} value={m.rola}>
              {m.etykieta}: {m.adres.ulica} {m.adres.numer}
            </option>
          ))}
        </select>
        <button className="siec" onClick={() => setEdycja(true)} aria-label="Edytuj adresy" style={{ border: '1px solid var(--linia)', background: '#fff' }}>
          Adresy
        </button>
        <span className={`siec ${online ? 'online' : 'offline'}`} role="status">
          {online ? 'Online' : wymuszonyOffline ? 'Offline (symulacja)' : 'Offline'}
          {!online && (paczka ? ` · paczka z ${paczka}` : ' · brak paczki')}
        </span>
      </header>
      <main className="mapa">
        <MapView centrum={wybrane} moduly={moduly} />
      </main>
      <section className="panel" aria-label={modul.nazwa}>
        <Panel miejsca={miejsca} wybrane={wybrane} online={online} />
      </section>
      <nav className="menu" aria-label="Moduły">
        {moduly.map((m) => (
          <button key={m.id} aria-pressed={m.id === aktywny} onClick={() => setAktywny(m.id)}>
            {m.nazwa}
          </button>
        ))}
      </nav>
      <Stopka />
    </div>
  );
}

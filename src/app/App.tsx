import { useEffect, useState } from 'react';
import type { Modul, RolaMiejsca } from '../contracts';
import { moduly } from '../modules';
import { useSiec } from '../offline/siec';
import type { Przygotowanie } from '../offline/polaczenie';
import { useMiejsca, zapiszMiejsca } from './miejsca';
import { miejsceTutaj, zTutaj } from './lokalizacja';
import { Onboarding } from './Onboarding';
import { Polaczenie } from './Polaczenie';
import { MapView } from '../map/MapView';
import { stanPaczki } from '../offline/paczka';
import { Stopka } from './Stopka';

export default function App() {
  const { miejsca, gotowe } = useMiejsca();
  const [przygotowanie, setPrzygotowanie] = useState<Przygotowanie | null>(null);
  const siec = useSiec();
  // Sieć wróciła po starcie bez sieci: przechodzimy na online bez ponownego ekranu sprawdzania.
  useEffect(() => {
    if (siec.online) setPrzygotowanie((p) => (p && !p.siec ? { ...p, siec: true } : p));
  }, [siec.online]);
  const online = siec.online && przygotowanie?.siec !== false;
  const [edycja, setEdycja] = useState(false);
  const [rola, setRola] = useState<RolaMiejsca>('dom');
  const [aktywny, setAktywny] = useState<Modul['id']>(moduly[0].id);
  const [paczka, setPaczka] = useState<string | null>(null);

  useEffect(() => {
    stanPaczki().then((s) =>
      setPaczka(s ? new Date(s.zbudowano).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : null),
    );
  }, [edycja, przygotowanie]);

  useEffect(() => {
    if (miejsca.length && !miejsca.some((m) => m.rola === rola)) setRola(miejsca[0].rola);
  }, [miejsca, rola]);

  const [bladLokalizacji, setBladLokalizacji] = useState<string | null>(null);
  const [ustalam, setUstalam] = useState(false);
  const tutaj = async () => {
    setUstalam(true);
    try {
      await zapiszMiejsca(zTutaj(miejsca, await miejsceTutaj()));
      setRola('tutaj');
      setBladLokalizacji(null);
    } catch (e) {
      setBladLokalizacji(e instanceof Error ? e.message : 'Nie udało się ustalić lokalizacji.');
    } finally {
      setUstalam(false);
    }
  };

  if (!gotowe) return null;
  if (!miejsca.length || edycja) {
    return (
      <div className="aplikacja" style={{ display: 'block' }}>
        <Onboarding poczatkowe={miejsca} onGotowe={() => setEdycja(false)} />
      </div>
    );
  }

  if (!przygotowanie) {
    return (
      <div className="aplikacja" style={{ display: 'block' }}>
        <Polaczenie onGotowe={setPrzygotowanie} />
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
        <button className="pasek-przycisk" onClick={tutaj} disabled={ustalam} aria-label="Użyj mojej lokalizacji">
          {ustalam ? 'Ustalam…' : 'Tutaj'}
        </button>
        <button className="pasek-przycisk" onClick={() => setEdycja(true)} aria-label="Edytuj adresy">
          Adresy
        </button>
        <span className={`siec ${online ? 'online' : 'offline'}`} role="status">
          {online ? (przygotowanie.api ? 'Online' : 'Online · bez danych na żywo') : siec.wymuszonyOffline ? 'Offline (symulacja)' : 'Offline'}
          {!online && (paczka ? ` · paczka z ${paczka}` : ' · brak paczki')}
        </span>
        {bladLokalizacji && <p className="pasek-blad" role="alert">{bladLokalizacji}</p>}
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

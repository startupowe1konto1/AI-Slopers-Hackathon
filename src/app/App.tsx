import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { KontekstWskazowek, RolaMiejsca, WyznaczTrase } from '../contracts';
import { moduly } from '../modules';
import { useSiec } from '../offline/siec';
import { zapiszTrasyOffline } from '../offline/zapisTras';
import { sprawdzPolaczenie, type Przygotowanie } from '../offline/polaczenie';
import { tylkoOnline } from '../offline/tryb';
import { useMiejsca, zapiszMiejsca } from './miejsca';
import { miejsceTutaj, zTutaj } from './lokalizacja';
import { Onboarding } from './Onboarding';
import { Polaczenie } from './Polaczenie';
import { MapView } from '../map/MapView';
import { stanPaczki } from '../offline/paczka';
import { Kafelki } from './Kafelki';
import { Karty } from './Karty';
import { ArkuszTrasy } from './ArkuszTrasy';
import { useWskazowki } from './wskazowki';
import { Stopka } from './Stopka';

const KAFELKI = moduly.flatMap((m) => m.kafelki ?? []);

export default function App() {
  const { miejsca, gotowe } = useMiejsca();
  // Wersja tylko online: bez ekranu „Sprawdzam połączenie” (nic nie pobieramy na offline), połączenie sprawdzamy w tle.
  const [przygotowanie, setPrzygotowanie] = useState<Przygotowanie | null>(() => (tylkoOnline() ? { siec: true, api: true, paczka: null } : null));
  useEffect(() => {
    if (tylkoOnline()) void sprawdzPolaczenie().then((w) => setPrzygotowanie({ ...w, paczka: null }));
  }, []);
  const siec = useSiec();
  // Sieć wróciła po starcie bez sieci: przechodzimy na online bez ponownego ekranu sprawdzania.
  useEffect(() => {
    if (siec.online) setPrzygotowanie((p) => (p && !p.siec ? { ...p, siec: true } : p));
  }, [siec.online]);
  const online = siec.online && przygotowanie?.siec !== false;
  // Trasy na offline zapisujemy w tle, gdy jest sieć (HANDOFF-v3 §5): raz na zestaw miejsc, nie przy każdym renderze.
  // Zapisane trasy nie idą drugi raz do OSRM. Bez sieci zapominamy zestaw, żeby po jej powrocie dokończyć brakujące.
  const zapisTras = !!przygotowanie && online && !tylkoOnline();
  const kluczMiejsc = miejsca.map((m) => `${m.adres.lat},${m.adres.lon}`).sort().join(';');
  const zapisanyZestaw = useRef<string | null>(null);
  useEffect(() => {
    if (!zapisTras || !miejsca.length) {
      zapisanyZestaw.current = null;
      return;
    }
    if (zapisanyZestaw.current === kluczMiejsc) return;
    zapisanyZestaw.current = kluczMiejsc;
    void zapiszTrasyOffline(miejsca).catch(() => {});
  }, [zapisTras, kluczMiejsc, miejsca]);
  const [edycja, setEdycja] = useState(false);
  const [rola, setRola] = useState<RolaMiejsca>('dom');
  const [paczka, setPaczka] = useState<string | null>(null);
  const [mapa, setMapa] = useState<MapLibreMap | null>(null);
  const [proba, setProba] = useState(0);

  useEffect(() => {
    stanPaczki().then((s) =>
      setPaczka(s ? new Date(s.zbudowano).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : null),
    );
  }, [edycja, przygotowanie]);

  useEffect(() => {
    if (miejsca.length && !miejsca.some((m) => m.rola === rola)) setRola(miejsca[0].rola);
  }, [miejsca, rola]);

  const miejsce = miejsca.find((m) => m.rola === rola) ?? miejsca[0] ?? null;
  const kontekst = useMemo<KontekstWskazowek | null>(() => (miejsce ? { miejsce, miejsca, online } : null), [miejsce, miejsca, online]);
  // Karty liczą się dopiero po ekranie „Sprawdzam połączenie” (V3), żeby wiedzieć, czy jest sieć.
  const { karty, ladowanie } = useWskazowki(moduly, przygotowanie ? kontekst : null, proba);
  const odswiez = useCallback(() => setProba((p) => p + 1), []);

  // Trasa do punktu z dymka na mapie (src/modules/punkty/warstwy.ts) otwiera arkusz zamiast listy kart.
  const [celMapy, setCelMapy] = useState<WyznaczTrase | null>(null);
  const [blackout, setBlackout] = useState(false);
  useEffect(() => {
    const sluchaj = (e: Event) => setCelMapy((e as CustomEvent<WyznaczTrase>).detail);
    window.addEventListener('wyznacz-trase', sluchaj);
    return () => window.removeEventListener('wyznacz-trase', sluchaj);
  }, []);
  useEffect(() => setCelMapy(null), [miejsce?.adres.lat, miejsce?.adres.lon]);

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

  if (!przygotowanie || !miejsce) {
    return (
      <div className="aplikacja" style={{ display: 'block' }}>
        <Polaczenie onGotowe={setPrzygotowanie} />
      </div>
    );
  }

  return (
    <div className="aplikacja">
      <header className="pasek">
        <select aria-label="Wybrane miejsce" value={miejsce.rola} onChange={(e) => setRola(e.target.value as RolaMiejsca)}>
          {miejsca.map((m) => (
            <option key={m.rola} value={m.rola}>
              {m.rola === 'tutaj' ? 'Lokalizacja' : m.etykieta}: {m.adres.ulica} {m.adres.numer}
            </option>
          ))}
        </select>
        <button className="pasek-przycisk" onClick={tutaj} disabled={ustalam} aria-label="Użyj mojej lokalizacji">
          {ustalam ? 'Ustalam…' : 'Lokalizacja'}
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
        <MapView centrum={miejsce.adres} moduly={moduly} onMapa={setMapa} />
        <Kafelki kafelki={KAFELKI} mapa={mapa} />
      </main>
      {celMapy ? (
        <ArkuszTrasy mapa={mapa} od={miejsce.adres} cel={celMapy} blackout={blackout} onBlackout={setBlackout} onZamknij={() => setCelMapy(null)} />
      ) : (
        <Karty karty={karty} ladowanie={ladowanie} mapa={mapa} od={miejsce.adres} onOdswiez={odswiez} blackout={blackout} onBlackout={setBlackout} />
      )}
      <Stopka />
    </div>
  );
}

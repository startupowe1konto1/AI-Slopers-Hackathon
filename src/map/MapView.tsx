import { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, addProtocol, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { FileSource, PMTiles, Protocol } from 'pmtiles';
import type { Modul, Wsp } from '../contracts';
import { plikMapy } from '../offline/paczka';
import { styl } from './styl';

const BBOX: [number, number, number, number] = [20.85, 52.09, 21.28, 52.37];
// Vite: worker MapLibre musi przejść przez ?worker&url (dokumentacja MapLibre 6).
setWorkerUrl(workerUrl);
const protocol = new Protocol();
addProtocol('pmtiles', protocol.tile);

// Mapa z OPFS (po pobraniu paczki) albo z serwera.
async function zrodloMapy(): Promise<string> {
  const plik = await plikMapy();
  if (plik) {
    protocol.add(new PMTiles(new FileSource(plik)));
    return `pmtiles://${plik.name}`;
  }
  return `pmtiles://${location.origin}/map/warszawa.pmtiles`;
}

export function MapView({ centrum, moduly }: { centrum: Wsp | null; moduly: Modul[] }) {
  const kontener = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapLibreMap | null>(null);
  const znacznik = useRef<Marker | null>(null);
  const [gotowa, setGotowa] = useState(false);

  useEffect(() => {
    let anulowano = false;
    const sprzatanie: (() => void)[] = [];
    zrodloMapy().then((url) => {
      if (anulowano || !kontener.current) return;
      const m = new MapLibreMap({
        container: kontener.current,
        style: styl(url),
        center: centrum ? [centrum.lon, centrum.lat] : [21.012, 52.23],
        zoom: 13,
        minZoom: 10,
        maxBounds: [
          [BBOX[0] - 0.05, BBOX[1] - 0.05],
          [BBOX[2] + 0.05, BBOX[3] + 0.05],
        ],
        attributionControl: { compact: true },
      });
      m.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      m.on('load', () => {
        for (const mod of moduly) {
          if (mod.dodajWarstwy) sprzatanie.push(mod.dodajWarstwy(m));
        }
        setGotowa(true);
      });
      mapa.current = m;
    });
    return () => {
      anulowano = true;
      sprzatanie.forEach((f) => f());
      mapa.current?.remove();
      mapa.current = null;
    };
    // mapa tworzona raz; centrum aktualizuje osobny efekt
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduly]);

  useEffect(() => {
    const m = mapa.current;
    if (!m || !centrum) return;
    m.flyTo({ center: [centrum.lon, centrum.lat], zoom: Math.max(m.getZoom(), 14) });
    znacznik.current?.remove();
    znacznik.current = new Marker({ color: '#b91c1c' }).setLngLat([centrum.lon, centrum.lat]).addTo(m);
  }, [centrum, gotowa]);

  return <div ref={kontener} aria-label="Mapa Warszawy" />;
}

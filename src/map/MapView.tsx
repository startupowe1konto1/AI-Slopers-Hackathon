import type { Modul, Wsp } from '../contracts';

// Atrapa ze szkieletu. O1-A2 podmienia ją na MapLibre + pmtiles.
export function MapView({ centrum }: { centrum: Wsp | null; moduly: Modul[] }) {
  return (
    <div style={{ display: 'grid', placeItems: 'center', color: '#6b7280', fontSize: 14 }}>
      Mapa Warszawy {centrum ? `(${centrum.lat.toFixed(4)}, ${centrum.lon.toFixed(4)})` : ''}
    </div>
  );
}

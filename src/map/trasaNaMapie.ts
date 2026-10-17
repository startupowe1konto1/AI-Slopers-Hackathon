import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';

let licznik = 0;

// Każde wywołanie ma własne id, więc spóźnione sprzątanie starej trasy nie usuwa nowej.
// Sprzątanie sprawdza getLayer/getSource, więc jest bezpieczne także po map.remove() (styl jest wtedy pusty).
export function pokazTrase(map: MapLibreMap, t: Trasa): () => void {
  // Z jednego punktu nie ma linii ani sensownych granic: nic nie rysujemy i nie ruszamy mapy.
  if (t.linia.length < 2) return () => {};
  const lon = t.linia.map((p) => p[0]);
  const lat = t.linia.map((p) => p[1]);
  const granice: [[number, number], [number, number]] = [[Math.min(...lon), Math.min(...lat)], [Math.max(...lon), Math.max(...lat)]];
  const id = `trasa-${++licznik}`;
  map.addSource(id, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: t.linia } } });
  map.addLayer({
    id,
    type: 'line',
    source: id,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#1d4ed8', 'line-width': 5, 'line-opacity': 0.85, ...(t.zrodlo === 'prosta' ? { 'line-dasharray': [1.5, 1.5] } : {}) },
  });
  map.fitBounds(granice, { padding: 60, maxZoom: 17 });
  return () => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  };
}

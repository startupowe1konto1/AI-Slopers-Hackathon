import type { Map as MapLibreMap } from 'maplibre-gl';

// Strefy, w których według SOIA najgłośniejsza jest syrena analogowa (pipeline/syreny/strefy.py).
// Jeśli zabraknie prądu, może tam być ciszej (założenie o syrenach analogowych). Panel włącza je przełącznikiem; mapa może załadować się później.
const ZRODLO = 'syreny-strefy-analogowe';
const WARSTWY = ['syreny-strefy-wypelnienie', 'syreny-strefy-kontur'];

let mapa: MapLibreMap | null = null;
let widoczne = false;

const widocznosc = () => (widoczne ? 'visible' : 'none');

export const strefyWidoczne = () => widoczne;

export function pokazStrefy(tak: boolean) {
  widoczne = tak;
  for (const id of WARSTWY) if (mapa?.getLayer(id)) mapa.setLayoutProperty(id, 'visibility', widocznosc());
}

export function dodajWarstwy(map: MapLibreMap): () => void {
  mapa = map;
  map.addSource(ZRODLO, { type: 'geojson', data: '/pack/syreny/strefy-analogowe.json' });
  map.addLayer({
    id: WARSTWY[0],
    type: 'fill',
    source: ZRODLO,
    layout: { visibility: widocznosc() },
    paint: { 'fill-color': '#b45309', 'fill-opacity': 0.25 },
  });
  map.addLayer({
    id: WARSTWY[1],
    type: 'line',
    source: ZRODLO,
    layout: { visibility: widocznosc() },
    paint: { 'line-color': '#b45309', 'line-width': 1 },
  });
  return () => {
    for (const id of WARSTWY) if (map.getLayer(id)) map.removeLayer(id);
    map.removeSource(ZRODLO);
    if (mapa === map) mapa = null;
  };
}

import { Popup, type ExpressionSpecification, type GeoJSONSource, type Map as MapLibreMap, type MapLayerMouseEvent, type Subscription } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { Manifest, Punkt } from '../../contracts';
import { wczytajPunkty, zrodlaPaczki } from './najblizsze';
import { RODZAJE } from './rodzaje';

// PSP (ok. 8 tys.) w klastrach, pozostałe rodzaje zawsze widoczne pojedynczo.
const PSP = 'punkty-psp';
const INNE = 'punkty-inne';
const KLASTRY = 'punkty-psp-klastry';
const PUNKTY = ['punkty-psp-punkty', 'punkty-inne-punkty'];
const WARSTWY = [KLASTRY, 'punkty-psp-liczba', ...PUNKTY];

const kolor = ['match', ['get', 'rodzaj'], ...RODZAJE.flatMap((r) => [r.rodzaj, r.kolor]), '#6b7280'] as unknown as ExpressionSpecification;

const kolekcja = (p: Punkt[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: p.map((x) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [x.lon, x.lat] },
    properties: { nazwa: x.nazwa, rodzaj: x.rodzaj, zrodlo: x.zrodlo },
  })),
});

function popup(map: MapLibreMap, e: MapLayerMouseEvent, zrodla: Manifest['zrodla']) {
  const f = e.features?.[0];
  if (!f || f.geometry.type !== 'Point') return;
  const el = document.createElement('div');
  const nazwa = document.createElement('strong');
  nazwa.textContent = f.properties.nazwa;
  const zrodlo = document.createElement('div');
  zrodlo.textContent = `Źródło: ${zrodla[f.properties.zrodlo]?.nazwa ?? f.properties.zrodlo}`;
  el.append(nazwa, zrodlo);
  new Popup().setLngLat(f.geometry.coordinates as [number, number]).setDOMContent(el).addTo(map);
}

export function dodajWarstwy(map: MapLibreMap): () => void {
  let aktywne = true;
  const subskrypcje: Subscription[] = [];

  Promise.all([wczytajPunkty(), zrodlaPaczki().catch(() => ({}))])
    .then(([punkty, zrodla]) => {
      if (!aktywne) return;
      map.addSource(PSP, { type: 'geojson', data: kolekcja(punkty.filter((p) => p.rodzaj === 'schronienie_psp')), cluster: true, clusterRadius: 40 });
      map.addSource(INNE, { type: 'geojson', data: kolekcja(punkty.filter((p) => p.rodzaj !== 'schronienie_psp')) });
      map.addLayer({
        id: KLASTRY,
        type: 'circle',
        source: PSP,
        filter: ['has', 'point_count'],
        paint: { 'circle-color': '#b91c1c', 'circle-opacity': 0.85, 'circle-radius': ['step', ['get', 'point_count'], 14, 50, 18, 500, 24] },
      });
      map.addLayer({
        id: 'punkty-psp-liczba',
        type: 'symbol',
        source: PSP,
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Medium'], 'text-size': 12 },
        paint: { 'text-color': '#ffffff' },
      });
      const punkt = { 'circle-color': kolor, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 };
      map.addLayer({ id: PUNKTY[0], type: 'circle', source: PSP, filter: ['!', ['has', 'point_count']], paint: punkt });
      map.addLayer({ id: PUNKTY[1], type: 'circle', source: INNE, paint: punkt });

      subskrypcje.push(
        map.on('click', PUNKTY, (e) => popup(map, e, zrodla)),
        map.on('click', KLASTRY, async (e) => {
          const f = e.features?.[0];
          if (!f || f.geometry.type !== 'Point') return;
          const zoom = await map.getSource<GeoJSONSource>(PSP)?.getClusterExpansionZoom(f.properties.cluster_id);
          map.easeTo({ center: f.geometry.coordinates as [number, number], zoom });
        }),
      );
    })
    // bez paczki mapa zostaje bez punktów; panel pokazuje błąd źródła
    .catch(() => {});

  return () => {
    aktywne = false;
    subskrypcje.forEach((s) => s.unsubscribe());
    WARSTWY.forEach((id) => map.getLayer(id) && map.removeLayer(id));
    [PSP, INNE].forEach((id) => map.getSource(id) && map.removeSource(id));
  };
}

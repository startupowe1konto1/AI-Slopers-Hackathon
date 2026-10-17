import { Popup, type ExpressionSpecification, type GeoJSONSource, type Map as MapLibreMap, type MapLayerMouseEvent, type Subscription } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { Manifest, Punkt, RodzajPunktu } from '../../contracts';
import { wczytajPunkty, zrodlaPaczki } from './najblizsze';
import { RODZAJE } from './rodzaje';
import { sluchajOdcinka, type Odcinek } from './trasa';

// PSP (ok. 8 tys.) w klastrach, pozostałe rodzaje zawsze widoczne pojedynczo.
const PSP = 'punkty-psp';
const INNE = 'punkty-inne';
const ODCINEK = 'punkty-odcinek';
const KLASTRY = 'punkty-psp-klastry';
const PUNKTY = ['punkty-psp-punkty', 'punkty-inne-punkty'];
const WARSTWY = [ODCINEK, KLASTRY, 'punkty-psp-liczba', ...PUNKTY];

const kolor = ['match', ['get', 'rodzaj'], ...RODZAJE.flatMap((r) => [r.rodzaj, r.kolor]), '#6b7280'] as unknown as ExpressionSpecification;

const kolekcja = (p: Punkt[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: p.map((x) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [x.lon, x.lat] },
    properties: { nazwa: x.nazwa, rodzaj: x.rodzaj, zrodlo: x.zrodlo },
  })),
});

const odcinek = (o: Odcinek): FeatureCollection => ({
  type: 'FeatureCollection',
  features: o
    ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[o.od.lon, o.od.lat], [o.do.lon, o.do.lat]] } }]
    : [],
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
  let przestanSluchac = () => {};

  Promise.all([wczytajPunkty(), zrodlaPaczki().catch(() => ({}))])
    .then(([punkty, zrodla]) => {
      if (!aktywne) return;
      // Odcinek pod punktami: dodany przed ich warstwami.
      map.addSource(ODCINEK, { type: 'geojson', data: odcinek(null) });
      map.addLayer({
        id: ODCINEK,
        type: 'line',
        source: ODCINEK,
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': '#b91c1c', 'line-width': 3, 'line-dasharray': [2, 1.5] },
      });
      przestanSluchac = sluchajOdcinka((o, dopasuj) => {
        map.getSource<GeoJSONSource>(ODCINEK)?.setData(odcinek(o));
        if (o && dopasuj) {
          const lon = [o.od.lon, o.do.lon].sort((a, b) => a - b);
          const lat = [o.od.lat, o.do.lat].sort((a, b) => a - b);
          map.fitBounds([[lon[0], lat[0]], [lon[1], lat[1]]], { padding: 60, maxZoom: 17 });
        }
      });
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
    przestanSluchac();
    subskrypcje.forEach((s) => s.unsubscribe());
    WARSTWY.forEach((id) => map.getLayer(id) && map.removeLayer(id));
    [ODCINEK, PSP, INNE].forEach((id) => map.getSource(id) && map.removeSource(id));
  };
}

// Kafelek (P4): warstwa jednego rodzaju punktów. PSP (ok. 8 tys.) w klastrach, reszta pojedynczo.
export function dodajWarstweRodzaju(map: MapLibreMap, rodzaj: RodzajPunktu): () => void {
  let aktywne = true;
  const id = `punkty-${rodzaj}`;
  const klastry = rodzaj === 'schronienie_psp';
  const warstwy = klastry ? [`${id}-klastry`, `${id}-liczba`, `${id}-punkty`] : [`${id}-punkty`];
  const subskrypcje: Subscription[] = [];

  Promise.all([wczytajPunkty(), zrodlaPaczki().catch(() => ({}))])
    .then(([punkty, zrodla]) => {
      if (!aktywne) return;
      map.addSource(id, { type: 'geojson', data: kolekcja(punkty.filter((p) => p.rodzaj === rodzaj)), ...(klastry ? { cluster: true, clusterRadius: 40 } : {}) });
      if (klastry) {
        map.addLayer({
          id: warstwy[0],
          type: 'circle',
          source: id,
          filter: ['has', 'point_count'],
          paint: { 'circle-color': '#b91c1c', 'circle-opacity': 0.85, 'circle-radius': ['step', ['get', 'point_count'], 14, 50, 18, 500, 24] },
        });
        map.addLayer({
          id: warstwy[1],
          type: 'symbol',
          source: id,
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Medium'], 'text-size': 12 },
          paint: { 'text-color': '#ffffff' },
        });
      }
      map.addLayer({
        id: `${id}-punkty`,
        type: 'circle',
        source: id,
        ...(klastry ? { filter: ['!', ['has', 'point_count']] as ExpressionSpecification } : {}),
        paint: { 'circle-color': kolor, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
      });
      subskrypcje.push(map.on('click', `${id}-punkty`, (e) => popup(map, e, zrodla)));
      if (klastry) {
        subskrypcje.push(
          map.on('click', warstwy[0], async (e) => {
            const f = e.features?.[0];
            if (!f || f.geometry.type !== 'Point') return;
            const zoom = await map.getSource<GeoJSONSource>(id)?.getClusterExpansionZoom(f.properties.cluster_id);
            map.easeTo({ center: f.geometry.coordinates as [number, number], zoom });
          }),
        );
      }
    })
    // bez paczki kafelek nic nie rysuje; karty pokazują błąd źródła
    .catch(() => {});

  return () => {
    aktywne = false;
    subskrypcje.forEach((s) => s.unsubscribe());
    warstwy.forEach((l) => map.getLayer(l) && map.removeLayer(l));
    if (map.getSource(id)) map.removeSource(id);
  };
}

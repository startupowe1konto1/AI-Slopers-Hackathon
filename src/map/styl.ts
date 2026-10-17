import { layers, namedFlavor } from '@protomaps/basemaps';
import type { StyleSpecification } from 'maplibre-gl';

// Styl Protomaps z fontami i ikonami z public/map/ (bez zależności od sieci).
export function styl(pmtilesUrl: string): StyleSpecification {
  return {
    version: 8,
    glyphs: `${location.origin}/map/fonts/{fontstack}/{range}.pbf`,
    sprite: `${location.origin}/map/sprites/light`,
    sources: {
      osm: {
        type: 'vector',
        url: pmtilesUrl,
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> (ODbL), Protomaps',
      },
    },
    layers: layers('osm', namedFlavor('light'), { lang: 'pl' }),
  };
}

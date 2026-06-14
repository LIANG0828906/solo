declare module 'leaflet.heat' {
  import * as L from 'leaflet';

  interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends L.Layer {
    setLatLngs(latlngs: L.LatLngExpression[]): HeatLayer;
    addLatLng(latlng: L.LatLngExpression): HeatLayer;
    setOptions(options: HeatLayerOptions): HeatLayer;
    redraw(): HeatLayer;
  }

  export function heatLayer(
    latlngs: L.LatLngExpression[],
    options?: HeatLayerOptions
  ): HeatLayer;
}

declare module 'leaflet' {
  function heatLayer(
    latlngs: L.LatLngExpression[],
    options?: import('leaflet.heat').HeatLayerOptions
  ): import('leaflet.heat').HeatLayer;
}

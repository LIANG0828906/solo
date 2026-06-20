import 'leaflet'

declare module 'leaflet' {
  export interface HeatLayerOptions {
    minOpacity?: number
    maxZoom?: number
    max?: number
    radius?: number
    blur?: number
    gradient?: { [key: number]: string }
  }

  export class HeatLayer extends Layer {
    constructor(latlngs: [number, number, number][], options?: HeatLayerOptions)
    setLatLngs(latlngs: [number, number, number][]): this
    addLatLng(latlng: [number, number, number] | LatLng): this
    setOptions(options: HeatLayerOptions): this
    redraw(): this
  }

  export function heatLayer(
    latlngs: [number, number, number][],
    options?: HeatLayerOptions,
  ): HeatLayer
}

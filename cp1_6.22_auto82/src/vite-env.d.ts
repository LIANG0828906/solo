/// <reference types="vite/client" />

declare module 'colorthief' {
  export default class ColorThief {
    getColor(
      sourceImage: HTMLImageElement | HTMLCanvasElement | ImageData,
      quality?: number,
    ): [number, number, number]

    getPalette(
      sourceImage: HTMLImageElement | HTMLCanvasElement | ImageData,
      colorCount?: number,
      quality?: number,
    ): [number, number, number][]

    getColorFromImageData(
      imageData: ImageData,
      quality?: number,
    ): [number, number, number]

    getPaletteFromImageData(
      imageData: ImageData,
      colorCount?: number,
      quality?: number,
    ): [number, number, number][]
  }
}

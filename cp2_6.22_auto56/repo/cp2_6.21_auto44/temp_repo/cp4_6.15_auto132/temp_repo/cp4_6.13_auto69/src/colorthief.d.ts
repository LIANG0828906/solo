declare module 'colorthief/dist/color-thief.mjs' {
  export type RGBColor = [number, number, number];

  export interface ColorThiefOptions {
    colorCount?: number;
    quality?: number;
    ignoreWhite?: boolean;
    whiteThreshold?: number;
    alphaThreshold?: number;
    minSaturation?: number;
  }

  export type ImageSource = HTMLImageElement | HTMLCanvasElement | ImageData | ImageBitmap;

  export default class ColorThief {
    getColor(sourceImage: ImageSource, quality?: number): RGBColor | null;
    getColor(sourceImage: ImageSource, options?: ColorThiefOptions): RGBColor | null;
    getPalette(sourceImage: ImageSource, colorCount?: number, quality?: number): RGBColor[] | null;
    getPalette(sourceImage: ImageSource, options?: ColorThiefOptions): RGBColor[] | null;
  }
}

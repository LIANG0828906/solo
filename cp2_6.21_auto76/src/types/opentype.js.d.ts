declare module 'opentype.js' {
  export interface FontOptions {
    empty?: boolean;
  }

  export interface GlyphOptions {
    font?: Font;
    unicodes?: number[];
    path?: Path;
    advanceWidth?: number;
    leftSideBearing?: number;
    name?: string;
  }

  export class Path {
    commands: Array<{
      type: string;
      x?: number;
      y?: number;
      x1?: number;
      y1?: number;
      x2?: number;
      y2?: number;
    }>;
    fill: string;
    stroke: string | null;
    strokeWidth: number;
    unitsPerEm: number;

    constructor(commands?: any[], fill?: string, stroke?: string | null, strokeWidth?: number);
    getPath(x: number, y: number, fontSize: number): Path;
    getBoundingBox(): { xMin: number; yMin: number; xMax: number; yMax: number };
    toPathData(decimalPlaces?: number): string;
    toSVG(decimalPlaces?: number): string;
    draw(ctx: CanvasRenderingContext2D): void;
    toCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number): void;
  }

  export class Glyph {
    constructor(options?: GlyphOptions);
    getPath(x: number, y: number, fontSize: number): Path;
    getMetrics(): {
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
      advanceWidth: number;
      leftSideBearing: number;
    };
    advanceWidth: number;
    leftSideBearing: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
    name: string;
    unicode: number;
  }

  export class Font {
    constructor(options?: FontOptions);
    names: {
      fontFamily: { [lang: string]: string };
      fontSubfamily: { [lang: string]: string };
      fullName: { [lang: string]: string };
      postScriptName: { [lang: string]: string };
      manufacturer: { [lang: string]: string };
      designer: { [lang: string]: string };
    };
    unitsPerEm: number;
    ascender: number;
    descender: number;
    leading: number;
    underlinePosition: number;
    underlineThickness: number;
    glyphs: {
      get(index: number): Glyph;
      length: number;
    };

    charToGlyph(c: string): Glyph;
    charToGlyphIndex(c: string): number;
    getKerningValue(leftGlyphIndex: number, rightGlyphIndex: number): number;
    getAdvanceWidth(text: string, fontSize: number, options?: any): number;
    getPath(text: string, x: number, y: number, fontSize: number, options?: any): Path;
    draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, options?: any): void;
    measure(text: string, fontSize: number, options?: any): {
      width: number;
      height: number;
      advanceWidth: number;
      leftSideBearing: number;
    };
    toArrayBuffer(): ArrayBuffer;
  }

  export function parse(buffer: ArrayBuffer, opt?: { lowMemory?: boolean }): Font;
  export function load(url: string, callback: (err: any, font?: Font) => void): void;
  export function loadSync(url: string): Font;

  const opentype: {
    parse: typeof parse;
    load: typeof load;
    loadSync: typeof loadSync;
    Font: typeof Font;
    Glyph: typeof Glyph;
    Path: typeof Path;
  };

  export default opentype;
}

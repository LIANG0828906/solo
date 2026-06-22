declare module 'opentype.js' {
  export interface FontNames {
    fullName?: { en?: string }
    fontFamily?: { en?: string }
    postScriptName?: { en?: string }
    [key: string]: any
  }

  export interface OS2Table {
    usWeightClass?: number
    fsSelection?: number
    [key: string]: any
  }

  export interface FontTables {
    os2?: OS2Table
    name?: any
    [key: string]: any
  }

  export class Font {
    names: FontNames
    tables: FontTables
    unitsPerEm: number
    ascender: number
    descender: number
    [key: string]: any
  }

  export function parse(buffer: ArrayBuffer): Font
  export function load(url: string, callback: (err: Error | null, font?: Font) => void): void
  export function loadSync(url: string): Font
}

declare module 'chroma-js' {
  interface Color {
    hex(): string
    hsl(): [number, number, number]
    darken(amount?: number): Color
    brighten(amount?: number): Color
    saturate(amount?: number): Color
    desaturate(amount?: number): Color
    css(): string
  }

  function chroma(color: string): Color
  function chroma(h: number, s: number, l: number, mode?: string): Color
  function chroma(color: number[]): Color

  namespace chroma {
    function hsl(h: number, s: number, l: number): Color
    function hex(color: string): Color
    function valid(color: string): boolean
  }

  export default chroma
}

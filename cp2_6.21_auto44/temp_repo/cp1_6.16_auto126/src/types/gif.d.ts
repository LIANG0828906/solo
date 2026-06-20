declare module 'gif.js' {
  class GIF {
    constructor(options: {
      workers?: number
      quality?: number
      width?: number
      height?: number
      workerScript?: string
      repeat?: number
      background?: string
    })
    addFrame(imageData: CanvasRenderingContext2D | HTMLCanvasElement | ImageData, options: { delay?: number; copy?: boolean }): void
    render(): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'finished' | 'progress', callback: (...args: unknown[]) => void): void
    abort(): void
  }
  export default GIF
}

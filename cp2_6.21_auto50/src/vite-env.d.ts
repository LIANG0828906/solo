/// <reference types="vite/client" />

declare module 'gif.js' {
  class GIF {
    constructor(options: {
      workers?: number;
      quality?: number;
      width?: number;
      height?: number;
      workerScript?: string;
      repeat?: number;
      background?: string;
    });
    addFrame(
      canvasOrCtx: HTMLCanvasElement | CanvasRenderingContext2D,
      options: { copy?: boolean; delay?: number; transparent?: number }
    ): void;
    render(): void;
    on(event: 'finished', callback: (blob: Blob) => void): void;
    on(event: 'error', callback: (err: Error) => void): void;
    on(event: 'progress', callback: (p: number) => void): void;
    abort(): void;
  }

  export default GIF;
}

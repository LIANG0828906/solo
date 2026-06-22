/// <reference types="vite/client" />

declare module '*.gif.js' {
  const src: string;
  export default src;
}

declare module 'gif.js' {
  export interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    repeat?: number;
    background?: string;
    dither?: string | boolean;
    transparent?: number;
  }

  export default class GIF {
    constructor(options: GIFOptions);
    addFrame(imageData: ImageData | HTMLCanvasElement, options?: { delay?: number; copy?: boolean }): void;
    render(): this;
    on(event: 'progress', callback: (progress: number) => void): this;
    on(event: 'finished', callback: (blob: Blob) => void): this;
    on(event: string, callback: (...args: any[]) => void): this;
    abort(): void;
  }
}

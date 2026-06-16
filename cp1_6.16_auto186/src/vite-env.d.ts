/// <reference types="vite/client" />

declare module '@mediapipe/hands' {
  export interface Results {
    multiHandLandmarks: Array<Array<{ x: number; y: number; z: number }>>
    multiHandWorldLandmarks: Array<Array<{ x: number; y: number; z: number }>>
    multiHandedness: Array<{ label: string; score: number }>
    image: any
  }

  export interface Options {
    maxNumHands?: number
    modelComplexity?: number
    minDetectionConfidence?: number
    minTrackingConfidence?: number
  }

  export class Hands {
    constructor(config?: { locateFile?: (file: string) => string })
    setOptions(options: Options): void
    onResults(callback: (results: Results) => void): void
    send(input: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): Promise<void>
    close(): void
  }
}

import { KaleidoParams, RingData, MirrorMode } from './types';

export class ImageProcessor {
  private sourceImage: HTMLImageElement | null = null;
  private params: KaleidoParams;
  private ringStates: RingData[] = [];
  private lastTimestamp: number = 0;
  private seededSpeeds: number[] = [];

  constructor() {
    this.params = {
      ringCount: 8,
      rotationSpeedBase: 2,
      mirrorMode: 'none',
      dividerOpacity: 0.6
    };
  }

  setSourceImage(img: HTMLImageElement): void {
    this.sourceImage = img;
    this.rebuildRings();
  }

  setParams(params: Partial<KaleidoParams>): void {
    const prevRingCount = this.params.ringCount;
    this.params = { ...this.params, ...params };
    if (prevRingCount !== this.params.ringCount) {
      this.rebuildRings();
    }
  }

  getParams(): KaleidoParams {
    return { ...this.params };
  }

  getImage(): HTMLImageElement | null {
    return this.sourceImage;
  }

  private rebuildRings(): void {
    this.ringStates = [];
    this.seededSpeeds = [];
    for (let i = 0; i < this.params.ringCount; i++) {
      const baseSpeed = this.generateSeededSpeed(i);
      this.seededSpeeds.push(baseSpeed);
      this.ringStates.push({
        index: i,
        innerRadius: 0,
        outerRadius: 0,
        rotation: (Math.random() * Math.PI * 2) - Math.PI,
        rotationSpeed: baseSpeed,
        expandOffset: 1.05,
        direction: i % 2 === 0 ? 1 : -1
      });
    }
  }

  private generateSeededSpeed(ringIndex: number): number {
    const min = 0.18;
    const max = 0.55;
    const pseudo = Math.sin(ringIndex * 12.9898 + 78.233) * 43758.5453;
    const normalized = pseudo - Math.floor(pseudo);
    return min + normalized * (max - min);
  }

  updateAndGetRings(timestamp: number, canvasSize: number): RingData[] {
    if (this.ringStates.length === 0) return [];

    const dt = this.lastTimestamp === 0 ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;

    const safeDt = Math.min(dt, 0.05);
    const maxRadius = canvasSize / 2;
    const ringBaseWidth = maxRadius / this.params.ringCount;

    this.ringStates.forEach((ring, i) => {
      const speedBase = this.seededSpeeds[i] ?? this.generateSeededSpeed(i);
      const effectiveSpeed = speedBase * this.params.rotationSpeedBase * ring.direction;
      ring.rotation = this.wrapAngle(ring.rotation + effectiveSpeed * safeDt);

      const progressIn = (i) / this.params.ringCount;
      const progressOut = (i + 1) / this.params.ringCount;
      ring.innerRadius = progressIn * maxRadius * ring.expandOffset;
      ring.outerRadius = Math.min(progressOut * maxRadius * ring.expandOffset + (i > 0 ? 0 : 0), maxRadius * 1.12);
      ring.rotationSpeed = effectiveSpeed;
    });

    return this.ringStates;
  }

  private wrapAngle(angle: number): number {
    const twoPi = Math.PI * 2;
    return ((angle % twoPi) + twoPi) % twoPi;
  }

  getMirrorQuadrants(mode: MirrorMode): Array<{
    drawRegion: { x: number; y: number; w: number; h: number };
    sourceRegion: { x: number; y: number; w: number; h: number };
    flipX: boolean;
    flipY: boolean;
  }> {
    switch (mode) {
      case 'none':
        return [{
          drawRegion: { x: 0, y: 0, w: 1, h: 1 },
          sourceRegion: { x: 0, y: 0, w: 1, h: 1 },
          flipX: false,
          flipY: false
        }];
      case 'horizontal':
        return [
          {
            drawRegion: { x: 0, y: 0, w: 0.5, h: 1 },
            sourceRegion: { x: 0, y: 0, w: 0.5, h: 1 },
            flipX: false,
            flipY: false
          },
          {
            drawRegion: { x: 0.5, y: 0, w: 0.5, h: 1 },
            sourceRegion: { x: 0, y: 0, w: 0.5, h: 1 },
            flipX: true,
            flipY: false
          }
        ];
      case 'vertical':
        return [
          {
            drawRegion: { x: 0, y: 0, w: 1, h: 0.5 },
            sourceRegion: { x: 0, y: 0, w: 1, h: 0.5 },
            flipX: false,
            flipY: false
          },
          {
            drawRegion: { x: 0, y: 0.5, w: 1, h: 0.5 },
            sourceRegion: { x: 0, y: 0, w: 1, h: 0.5 },
            flipX: false,
            flipY: true
          }
        ];
      case 'quad':
        return [
          {
            drawRegion: { x: 0, y: 0, w: 0.5, h: 0.5 },
            sourceRegion: { x: 0, y: 0, w: 0.5, h: 0.5 },
            flipX: false,
            flipY: false
          },
          {
            drawRegion: { x: 0.5, y: 0, w: 0.5, h: 0.5 },
            sourceRegion: { x: 0, y: 0, w: 0.5, h: 0.5 },
            flipX: true,
            flipY: false
          },
          {
            drawRegion: { x: 0, y: 0.5, w: 0.5, h: 0.5 },
            sourceRegion: { x: 0, y: 0, w: 0.5, h: 0.5 },
            flipX: false,
            flipY: true
          },
          {
            drawRegion: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
            sourceRegion: { x: 0, y: 0, w: 0.5, h: 0.5 },
            flipX: true,
            flipY: true
          }
        ];
    }
  }
}

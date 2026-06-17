import type { SharedConfig, ParticleData } from './sharedConfig';

export class ImageParser {
  static async parse(file: File, config: SharedConfig): Promise<ParticleData[]> {
    const image = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const maxDim = 128;
    let width = image.width;
    let height = image.height;

    if (width > height) {
      if (width > maxDim) {
        height = (height / width) * maxDim;
        width = maxDim;
      }
    } else {
      if (height > maxDim) {
        width = (width / height) * maxDim;
        height = maxDim;
      }
    }

    width = Math.floor(width);
    height = Math.floor(height);

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    const allParticles: ParticleData[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = pixels[i] / 255;
        const g = pixels[i + 1] / 255;
        const b = pixels[i + 2] / 255;
        const a = pixels[i + 3] / 255;

        if (a < 0.1) continue;

        const hsv = this.rgbToHsv(r, g, b);

        if (!this.filterByBrightness(hsv, 0.05)) continue;

        const enhancedS = Math.min(1, hsv.s * 1.2);
        const enhancedRgb = this.hsvToRgb(hsv.h, enhancedS, hsv.v);

        const particle = this.mapToParticle(
          {
            r: enhancedRgb.r,
            g: enhancedRgb.g,
            b: enhancedRgb.b,
            h: hsv.h,
            s: enhancedS,
            v: hsv.v
          },
          config
        );

        allParticles.push(particle);
      }
    }

    const sampled = this.smartSample(allParticles, config.maxParticles);
    return sampled;
  }

  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let h = 0;
    const v = max;
    const s = max > 0 ? delta / max : 0;

    if (delta > 0) {
      if (max === r) {
        h = 60 * (((g - b) / delta) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
    }

    if (h < 0) h += 360;

    return { h, s, v };
  }

  static hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    return { r: r + m, g: g + m, b: b + m };
  }

  private static filterByBrightness(hsv: { h: number; s: number; v: number }, threshold: number): boolean {
    return hsv.v > threshold;
  }

  private static mapToParticle(
    pixel: { r: number; g: number; b: number; h: number; s: number; v: number },
    config: SharedConfig
  ): ParticleData {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const brightnessFactor = pixel.v * 0.5 + 0.5;

    const radius = config.spreadRadius * brightnessFactor;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    return {
      x,
      y,
      z,
      r: pixel.r,
      g: pixel.g,
      b: pixel.b,
      h: pixel.h,
      s: pixel.s,
      v: pixel.v,
      size: 1 + pixel.v * 3,
      phase: Math.random() * Math.PI * 2,
      period: 1 + Math.random() * 2
    };
  }

  private static smartSample(particles: ParticleData[], targetCount: number): ParticleData[] {
    if (particles.length <= targetCount) {
      return particles;
    }

    const result: ParticleData[] = [];
    const step = particles.length / targetCount;

    for (let i = 0; i < targetCount; i++) {
      const idx = Math.floor(i * step + Math.random() * step);
      if (idx < particles.length) {
        result.push(particles[idx]);
      }
    }

    return result;
  }

  static groupHue(h: number): number {
    const groupSize = 30;
    const group = Math.floor(h / groupSize);
    return group * groupSize + groupSize / 2;
  }
}

import { DyeParams, RGB, DYE_COLORS, TieKnotType } from './types';

export class TieDyeEngine {
  private width: number;
  private height: number;
  private randomSeed: number;

  constructor(width: number = 400, height: number = 400) {
    this.width = width;
    this.height = height;
    this.randomSeed = Math.random() * 10000;
  }

  private seededRandom(seed: number): number {
    const x = Math.sin(seed + this.randomSeed) * 10000;
    return x - Math.floor(x);
  }

  private noise2D(x: number, y: number, seed: number = 0): number {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
  }

  private smoothNoise(x: number, y: number, seed: number = 0): number {
    const corners = (
      this.noise2D(x - 1, y - 1, seed) +
      this.noise2D(x + 1, y - 1, seed) +
      this.noise2D(x - 1, y + 1, seed) +
      this.noise2D(x + 1, y + 1, seed)
    ) / 16;
    const sides = (
      this.noise2D(x - 1, y, seed) +
      this.noise2D(x + 1, y, seed) +
      this.noise2D(x, y - 1, seed) +
      this.noise2D(x, y + 1, seed)
    ) / 8;
    const center = this.noise2D(x, y, seed) / 4;
    return corners + sides + center;
  }

  private interpolatedNoise(x: number, y: number, seed: number = 0): number {
    const intX = Math.floor(x);
    const fracX = x - intX;
    const intY = Math.floor(y);
    const fracY = y - intY;

    const v1 = this.smoothNoise(intX, intY, seed);
    const v2 = this.smoothNoise(intX + 1, intY, seed);
    const v3 = this.smoothNoise(intX, intY + 1, seed);
    const v4 = this.smoothNoise(intX + 1, intY + 1, seed);

    const i1 = v1 * (1 - fracX) + v2 * fracX;
    const i2 = v3 * (1 - fracX) + v4 * fracX;

    return i1 * (1 - fracY) + i2 * fracY;
  }

  private perlinNoise(x: number, y: number, octaves: number = 4, seed: number = 0): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.interpolatedNoise(x * frequency, y * frequency, seed + i * 100) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return total / maxValue;
  }

  private mixColors(color1: RGB, color2: RGB, ratio: number): RGB {
    return {
      r: Math.round(color1.r * ratio + color2.r * (1 - ratio)),
      g: Math.round(color1.g * ratio + color2.g * (1 - ratio)),
      b: Math.round(color1.b * ratio + color2.b * (1 - ratio)),
    };
  }

  private getDyeColor(params: DyeParams): RGB {
    const primaryColor = DYE_COLORS[params.recipe.primary];
    if (params.recipe.secondary) {
      const secondaryColor = DYE_COLORS[params.recipe.secondary];
      const ratio = params.recipe.mixRatio ?? 0.6;
      return this.mixColors(primaryColor, secondaryColor, ratio);
    }
    return primaryColor;
  }

  private generateCloudPattern(
    pixels: Uint8ClampedArray,
    dyeColor: RGB,
    intensity: number,
    seed: number
  ): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxDist = Math.min(centerX, centerY) * 0.8;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) continue;

        const noiseVal = this.perlinNoise(x * 0.03, y * 0.03, 4, seed);
        const ringFactor = Math.sin(dist * 0.15 + noiseVal * 10) * 0.5 + 0.5;
        const distFactor = 1 - dist / maxDist;
        const alpha = ringFactor * distFactor * intensity * noiseVal;

        if (alpha > 0.1) {
          const existingAlpha = pixels[idx + 3] / 255;
          const blendedAlpha = alpha + existingAlpha * (1 - alpha);
          pixels[idx] = Math.round(dyeColor.r * alpha + pixels[idx] * existingAlpha * (1 - alpha)) / blendedAlpha * blendedAlpha;
          pixels[idx + 1] = Math.round(dyeColor.g * alpha + pixels[idx + 1] * existingAlpha * (1 - alpha)) / blendedAlpha * blendedAlpha;
          pixels[idx + 2] = Math.round(dyeColor.b * alpha + pixels[idx + 2] * existingAlpha * (1 - alpha)) / blendedAlpha * blendedAlpha;
          pixels[idx + 3] = Math.round(blendedAlpha * 255);
        }
      }
    }
  }

  private generateFishScalePattern(
    pixels: Uint8ClampedArray,
    dyeColor: RGB,
    intensity: number,
    seed: number
  ): void {
    const scaleSize = 40;
    const scaleGap = 5;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const rowOffset = Math.floor(y / (scaleSize + scaleGap)) % 2 === 0 ? 0 : scaleSize / 2;
        const adjustedX = x - rowOffset;

        const scaleX = Math.floor(adjustedX / (scaleSize + scaleGap));
        const scaleY = Math.floor(y / (scaleSize + scaleGap));
        const localX = adjustedX % (scaleSize + scaleGap) - scaleSize / 2;
        const localY = y % (scaleSize + scaleGap) - scaleSize / 2;

        const dist = Math.sqrt(localX * localX + localY * localY);
        if (dist > scaleSize / 2) continue;

        const noiseVal = this.perlinNoise(scaleX * 0.5, scaleY * 0.5, 2, seed);
        const edgeFactor = 1 - Math.pow(dist / (scaleSize / 2), 2);
        const alpha = edgeFactor * intensity * (0.7 + noiseVal * 0.3);

        if (alpha > 0.05) {
          const existingAlpha = pixels[idx + 3] / 255;
          const blendedAlpha = alpha + existingAlpha * (1 - alpha);
          pixels[idx] = Math.round(dyeColor.r * alpha + pixels[idx] * existingAlpha * (1 - alpha));
          pixels[idx + 1] = Math.round(dyeColor.g * alpha + pixels[idx + 1] * existingAlpha * (1 - alpha));
          pixels[idx + 2] = Math.round(dyeColor.b * alpha + pixels[idx + 2] * existingAlpha * (1 - alpha));
          pixels[idx + 3] = Math.round(blendedAlpha * 255);
        }
      }
    }
  }

  private generateSpiralPattern(
    pixels: Uint8ClampedArray,
    dyeColor: RGB,
    intensity: number,
    seed: number
  ): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxDist = Math.min(centerX, centerY);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (y * this.width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) continue;

        const angle = Math.atan2(dy, dx);
        const spiralVal = Math.sin(dist * 0.08 + angle * 3 + this.seededRandom(seed + dist) * 2);
        const noiseVal = this.perlinNoise(x * 0.04, y * 0.04, 3, seed);
        const distFactor = 1 - dist / maxDist;
        const bandFactor = spiralVal * 0.5 + 0.5;
        const alpha = bandFactor * distFactor * intensity * (0.6 + noiseVal * 0.4);

        if (alpha > 0.08) {
          const existingAlpha = pixels[idx + 3] / 255;
          const blendedAlpha = alpha + existingAlpha * (1 - alpha);
          pixels[idx] = Math.round(dyeColor.r * alpha + pixels[idx] * existingAlpha * (1 - alpha));
          pixels[idx + 1] = Math.round(dyeColor.g * alpha + pixels[idx + 1] * existingAlpha * (1 - alpha));
          pixels[idx + 2] = Math.round(dyeColor.b * alpha + pixels[idx + 2] * existingAlpha * (1 - alpha));
          pixels[idx + 3] = Math.round(blendedAlpha * 255);
        }
      }
    }
  }

  generatePattern(params: DyeParams): Uint8ClampedArray {
    const startTime = performance.now();
    const pixels = new Uint8ClampedArray(this.width * this.height * 4);

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 255;
      pixels[i + 1] = 255;
      pixels[i + 2] = 255;
      pixels[i + 3] = 255;
    }

    const dyeColor = this.getDyeColor(params);
    const intensity = Math.min(1, 0.3 + params.soakTime / 120 + params.dyeRound * 0.15);
    const seed = this.randomSeed + params.dyeRound * 1000;

    switch (params.knotType) {
      case 'bundle':
        this.generateCloudPattern(pixels, dyeColor, intensity, seed);
        break;
      case 'stitch':
        this.generateFishScalePattern(pixels, dyeColor, intensity, seed);
        break;
      case 'fold':
        this.generateSpiralPattern(pixels, dyeColor, intensity, seed);
        break;
    }

    const elapsed = performance.now() - startTime;
    console.debug(`[TieDyeEngine] Pattern generated in ${elapsed.toFixed(2)}ms`);

    return pixels;
  }

  layerPattern(
    basePixels: Uint8ClampedArray,
    newLayer: Uint8ClampedArray,
    opacity: number = 0.7
  ): Uint8ClampedArray {
    const startTime = performance.now();
    const result = new Uint8ClampedArray(basePixels.length);

    for (let i = 0; i < basePixels.length; i += 4) {
      const srcAlpha = (newLayer[i + 3] / 255) * opacity;
      const dstAlpha = basePixels[i + 3] / 255;
      const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

      if (outAlpha === 0) {
        result[i] = 255;
        result[i + 1] = 255;
        result[i + 2] = 255;
        result[i + 3] = 255;
      } else {
        result[i] = Math.round((newLayer[i] * srcAlpha + basePixels[i] * dstAlpha * (1 - srcAlpha)) / outAlpha);
        result[i + 1] = Math.round((newLayer[i + 1] * srcAlpha + basePixels[i + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha);
        result[i + 2] = Math.round((newLayer[i + 2] * srcAlpha + basePixels[i + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha);
        result[i + 3] = Math.round(outAlpha * 255);
      }
    }

    const elapsed = performance.now() - startTime;
    console.debug(`[TieDyeEngine] Pattern layered in ${elapsed.toFixed(2)}ms`);

    return result;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  regenerateSeed(): void {
    this.randomSeed = Math.random() * 10000;
  }
}

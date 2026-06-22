export interface IEffect {
  active: boolean;
  intensity: number;
  params: Record<string, number>;
  render(
    pixelData: ImageData,
    width: number,
    height: number,
    time: number
  ): ImageData;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  phase: number;
}

interface Snowflake {
  x: number;
  y: number;
  speed: number;
  size: number;
  drift: number;
}

export class WaterEffect implements IEffect {
  active = false;
  intensity = 50;
  params: Record<string, number> = {
    wavelength: 8,
    speed: 2,
    amplitude: 3
  };

  render(
    pixelData: ImageData,
    width: number,
    height: number,
    time: number
  ): ImageData {
    if (!this.active) return pixelData;
    const strength = this.intensity / 100;
    const src = pixelData.data;
    const out = new Uint8ClampedArray(src.length);
    const wl = this.params.wavelength;
    const spd = this.params.speed;
    const amp = this.params.amplitude * strength;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offsetX =
          Math.sin((y / wl) + (time * spd * 0.001)) * amp +
          Math.cos((x / wl) + (time * spd * 0.0015)) * amp * 0.6;
        const offsetY =
          Math.cos((x / wl * 0.8) + (time * spd * 0.0012)) * amp * 0.7;

        let srcX = Math.round(x + offsetX);
        let srcY = Math.round(y + offsetY);
        srcX = Math.max(0, Math.min(width - 1, srcX));
        srcY = Math.max(0, Math.min(height - 1, srcY));

        const dstIdx = (y * width + x) * 4;
        const srcIdx = (srcY * width + srcX) * 4;
        out[dstIdx] = src[srcIdx];
        out[dstIdx + 1] = src[srcIdx + 1];
        out[dstIdx + 2] = src[srcIdx + 2];
        out[dstIdx + 3] = src[srcIdx + 3];
      }
    }

    return new ImageData(out, width, height);
  }
}

export class StarEffect implements IEffect {
  active = false;
  intensity = 50;
  params: Record<string, number> = {
    density: 40,
    twinkleSpeed: 3,
    size: 2
  };
  private stars: Star[] = [];
  private lastWidth = 0;
  private lastHeight = 0;

  private initStars(width: number, height: number): void {
    if (this.lastWidth === width && this.lastHeight === height && this.stars.length > 0) {
      return;
    }
    this.lastWidth = width;
    this.lastHeight = height;
    const count = Math.floor((width * height / 1000) * (this.params.density / 50));
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * this.params.size + 1,
        speed: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  render(
    pixelData: ImageData,
    width: number,
    height: number,
    time: number
  ): ImageData {
    this.initStars(width, height);
    if (!this.active) return pixelData;
    const data = pixelData.data;
    const strength = this.intensity / 100;
    const twinkleSpd = this.params.twinkleSpeed;

    for (const star of this.stars) {
      const brightness =
        (Math.sin(time * twinkleSpd * 0.003 * star.speed + star.phase) + 1) / 2;
      const alpha = brightness * strength;
      if (alpha < 0.1) continue;

      const size = Math.ceil(star.size);
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const px = Math.floor(star.x) + dx;
          const py = Math.floor(star.y) + dy;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > size) continue;
          const falloff = 1 - dist / (size + 1);
          const idx = (py * width + px) * 4;
          const a = alpha * falloff;
          data[idx] = Math.min(255, data[idx] + 255 * a);
          data[idx + 1] = Math.min(255, data[idx + 1] + 255 * a);
          data[idx + 2] = Math.min(255, data[idx + 2] + 230 * a);
        }
      }
    }

    return pixelData;
  }
}

export class FireEffect implements IEffect {
  active = false;
  intensity = 50;
  params: Record<string, number> = {
    gradient: 1,
    riseSpeed: 2,
    heat: 60
  };

  private fireColors = [
    { r: 255, g: 255, b: 220 },
    { r: 255, g: 220, b: 80 },
    { r: 255, g: 140, b: 30 },
    { r: 220, g: 60, b: 20 },
    { r: 120, g: 20, b: 10 }
  ];

  render(
    pixelData: ImageData,
    width: number,
    height: number,
    time: number
  ): ImageData {
    if (!this.active) return pixelData;
    const data = pixelData.data;
    const strength = this.intensity / 100;
    const riseSpd = this.params.riseSpeed;
    const heat = this.params.heat / 100;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const srcR = data[idx];
        const srcG = data[idx + 1];
        const srcB = data[idx + 2];
        const srcA = data[idx + 3];
        if (srcA < 20) continue;

        const yRatio = y / height;
        const waveOffset = Math.sin((x / 20) + time * riseSpd * 0.004) * 0.05;
        const firePos = yRatio + waveOffset;
        const flicker = (Math.sin((x * 0.3 + time * 0.01)) + 1) * 0.1;
        const intensity = Math.max(0, 1 - firePos * 1.5) * heat + flicker * 0.3;
        const finalIntensity = Math.min(1, intensity * strength);

        if (finalIntensity <= 0) continue;

        const colorIdx = Math.min(
          this.fireColors.length - 1,
          Math.floor(firePos * this.fireColors.length)
        );
        const c1 = this.fireColors[colorIdx];
        const c2 = this.fireColors[Math.min(this.fireColors.length - 1, colorIdx + 1)];
        const t = (firePos * this.fireColors.length) % 1;

        const fireR = c1.r + (c2.r - c1.r) * t;
        const fireG = c1.g + (c2.g - c1.g) * t;
        const fireB = c1.b + (c2.b - c1.b) * t;

        data[idx] = Math.min(255, srcR + fireR * finalIntensity);
        data[idx + 1] = Math.min(255, srcG + fireG * finalIntensity);
        data[idx + 2] = Math.min(255, srcB + fireB * finalIntensity);
      }
    }

    return pixelData;
  }
}

export class SnowEffect implements IEffect {
  active = false;
  intensity = 50;
  params: Record<string, number> = {
    count: 60,
    fallSpeed: 2,
    size: 2
  };
  private snowflakes: Snowflake[] = [];
  private lastWidth = 0;
  private lastHeight = 0;

  private initSnow(width: number, height: number): void {
    if (
      this.lastWidth === width &&
      this.lastHeight === height &&
      this.snowflakes.length > 0
    ) {
      return;
    }
    this.lastWidth = width;
    this.lastHeight = height;
    this.snowflakes = [];
    for (let i = 0; i < this.params.count; i++) {
      this.snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: Math.random() * 1.5 + 0.5,
        size: Math.random() * this.params.size + 1,
        drift: Math.random() * Math.PI * 2
      });
    }
  }

  render(
    pixelData: ImageData,
    width: number,
    height: number,
    time: number
  ): ImageData {
    this.initSnow(width, height);
    if (!this.active) return pixelData;
    const data = pixelData.data;
    const strength = this.intensity / 100;
    const fallSpd = this.params.fallSpeed;

    for (const flake of this.snowflakes) {
      flake.y += flake.speed * fallSpd * 0.3;
      flake.x += Math.sin(time * 0.002 + flake.drift) * 0.4;

      if (flake.y > height) {
        flake.y = -flake.size * 2;
        flake.x = Math.random() * width;
      }
      if (flake.x > width) flake.x = 0;
      if (flake.x < 0) flake.x = width;

      const size = Math.ceil(flake.size);
      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const px = Math.floor(flake.x) + dx;
          const py = Math.floor(flake.y) + dy;
          if (px < 0 || px >= width || py < 0 || py >= height) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > size) continue;
          const falloff = 1 - dist / (size + 1);
          const idx = (py * width + px) * 4;
          const a = falloff * strength * 0.9;
          data[idx] = Math.min(255, data[idx] + 255 * a);
          data[idx + 1] = Math.min(255, data[idx + 1] + 255 * a);
          data[idx + 2] = Math.min(255, data[idx + 2] + 255 * a);
        }
      }
    }

    return pixelData;
  }
}

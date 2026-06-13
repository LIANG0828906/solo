export class SimplexNoise {
  private perm: number[] = [];
  private permMod12: number[] = [];
  private grad3: number[][] = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
  ];

  private static F2 = 0.5 * (Math.sqrt(3) - 1);
  private static G2 = (3 - Math.sqrt(3)) / 6;

  constructor(seed: number = Math.random() * 65536) {
    const p: number[] = new Array(256);
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    let s = seed >>> 0;
    if (s === 0) s = 1;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = Math.floor((s / 2147483647) * (i + 1));
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }

    this.perm = new Array(512);
    this.permMod12 = new Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  private dot(g: number[], x: number, y: number): number {
    return g[0] * x + g[1] * y;
  }

  noise2D(xin: number, yin: number): number {
    const F2 = SimplexNoise.F2;
    const G2 = SimplexNoise.G2;

    let n0: number, n1: number, n2: number;

    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = xin - X0;
    const y0 = yin - Y0;

    let i1: number, j1: number;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0) n0 = 0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0) n1 = 0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0) n2 = 0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }

    return 70 * (n0 + n1 + n2);
  }

  octaveNoise2D(x: number, y: number, octaves: number, persistence: number, lacunarity: number = 2): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

export function fbmNoise(
  noise: SimplexNoise,
  x: number,
  y: number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2
): number {
  return noise.octaveNoise2D(x, y, octaves, persistence, lacunarity);
}

export function turbulence(
  noise: SimplexNoise,
  x: number,
  y: number,
  octaves: number = 4,
  persistence: number = 0.5
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += Math.abs(noise.noise2D(x * frequency, y * frequency)) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return value / maxValue;
}

export function ridgedMultiFractal(
  noise: SimplexNoise,
  x: number,
  y: number,
  octaves: number = 4,
  persistence: number = 0.5,
  lacunarity: number = 2,
  offset: number = 1
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    const n = Math.abs(noise.noise2D(x * frequency, y * frequency));
    value += (offset - n * n) * amplitude;
    maxValue += amplitude * offset;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return (value / maxValue) * 2 - 1;
}

export function waveRipple(
  noise: SimplexNoise,
  x: number,
  y: number,
  numOctaves: number = 5
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < numOctaves; i++) {
    const nx = x * frequency;
    const ny = y * frequency;

    const axisNoise = noise.noise2D(nx * 0.1 + i * 3.7, ny * 0.1 - i * 2.3);
    const directionNoise = noise.noise2D(nx * 0.05 + i * 5.1, ny * 0.05 + i * 1.9);

    const angle = axisNoise * Math.PI + directionNoise * 0.5;
    const projected = nx * Math.cos(angle) + ny * Math.sin(angle);

    const wave1 = noise.noise2D(projected * 0.8, i * 7.3);
    const wave2 = noise.noise2D(projected * 1.3 + 100, i * 9.7) * 0.6;
    const wave3 = ridgedMultiFractal(noise, projected * 0.4, i * 4.1, 2, 0.5, 2, 1) * 0.4;

    value += (wave1 + wave2 + wave3) * amplitude;

    maxValue += amplitude * 2;
    amplitude *= 0.5;
    frequency *= 1.7;
  }

  return Math.max(-1, Math.min(1, value / maxValue));
}

export function domainWarpedNoise(
  noise: SimplexNoise,
  x: number,
  y: number,
  warpAmount: number = 1,
  octaves: number = 4
): number {
  const warpX = fbmNoise(noise, x + 5.2, y + 1.3, 3, 0.5, 2) * warpAmount;
  const warpY = fbmNoise(noise, x + 9.1, y + 8.7, 3, 0.5, 2) * warpAmount;

  return fbmNoise(noise, x + warpX, y + warpY, octaves, 0.5, 2);
}

export function billowNoise(
  noise: SimplexNoise,
  x: number,
  y: number,
  octaves: number = 4
): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    const n = noise.noise2D(x * frequency, y * frequency);
    total += (2 * Math.abs(n) - 1) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return total / maxValue;
}

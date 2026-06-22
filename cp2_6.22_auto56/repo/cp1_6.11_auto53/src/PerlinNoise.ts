export class PerlinNoise {
  private perm: number[] = [];
  private seed: number;

  constructor(seed: number = 1) {
    this.seed = seed;
    this.generatePermutation();
  }

  public setSeed(seed: number): void {
    this.seed = seed;
    this.generatePermutation();
  }

  private generatePermutation(): void {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    let n: number;
    let q: number;
    for (let i = 255; i > 0; i--) {
      n = this.seededRandom(i);
      q = p[i];
      p[i] = p[n];
      p[n] = q;
    }

    for (let i = 0; i < 256; i++) {
      this.perm[i] = p[i];
      this.perm[i + 256] = p[i];
    }
  }

  private seededRandom(index: number): number {
    const x = Math.sin(index * this.seed * 12.9898 + 78.233) * 43758.5453;
    return Math.floor((x - Math.floor(x)) * (index + 1));
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise2D(x: number, y: number, frequency: number = 1.0): number {
    const xf = x * frequency;
    const yf = y * frequency;

    const xi = Math.floor(xf) & 255;
    const yi = Math.floor(yf) & 255;

    const xf2 = xf - Math.floor(xf);
    const yf2 = yf - Math.floor(yf);

    const u = this.fade(xf2);
    const v = this.fade(yf2);

    const aa = this.perm[this.perm[xi] + yi];
    const ab = this.perm[this.perm[xi] + yi + 1];
    const ba = this.perm[this.perm[xi + 1] + yi];
    const bb = this.perm[this.perm[xi + 1] + yi + 1];

    const x1 = this.lerp(this.grad(aa, xf2, yf2), this.grad(ba, xf2 - 1, yf2), u);
    const x2 = this.lerp(this.grad(ab, xf2, yf2 - 1), this.grad(bb, xf2 - 1, yf2 - 1), u);

    const result = this.lerp(x1, x2, v);

    return (result + 1) / 2;
  }

  public fbm(x: number, y: number, frequency: number = 1.0, octaves: number = 4): number {
    let value = 0;
    let amplitude = 0.5;
    let freq = frequency;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x, y, freq) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      freq *= 2;
    }

    return value / maxValue;
  }
}

export class NoiseField {
  private perm: Uint8Array;
  private gradP: { x: number; y: number; z: number }[];

  private static readonly GRAD3 = [
    { x: 1, y: 1, z: 0 }, { x: -1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 }, { x: -1, y: -1, z: 0 },
    { x: 1, y: 0, z: 1 }, { x: -1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 }, { x: -1, y: 0, z: -1 },
    { x: 0, y: 1, z: 1 }, { x: 0, y: -1, z: 1 }, { x: 0, y: 1, z: -1 }, { x: 0, y: -1, z: -1 }
  ];

  constructor(
    public scale: number = 0.008,
    public speed: number = 0.15,
    public amplitude: number = 1.2
  ) {
    this.perm = new Uint8Array(512);
    this.gradP = new Array(512);
    this.buildPermutationTable(Math.floor(Math.random() * 65536));
  }

  private buildPermutationTable(seed: number): void {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      const tmp = p[i];
      p[i] = p[j];
      p[j] = tmp;
    }

    for (let i = 0; i < 512; i++) {
      const idx = i & 255;
      this.perm[i] = p[idx];
      this.gradP[i] = NoiseField.GRAD3[p[idx] % 12];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private dot(g: { x: number; y: number; z: number }, x: number, y: number, z: number): number {
    return g.x * x + g.y * y + g.z * z;
  }

  private noise3D(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;

    return this.lerp(
      this.lerp(
        this.lerp(this.dot(this.gradP[AA], x, y, z), this.dot(this.gradP[BA], x - 1, y, z), u),
        this.lerp(this.dot(this.gradP[AB], x, y - 1, z), this.dot(this.gradP[BB], x - 1, y - 1, z), u),
        v
      ),
      this.lerp(
        this.lerp(this.dot(this.gradP[AA + 1], x, y, z - 1), this.dot(this.gradP[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.dot(this.gradP[AB + 1], x, y - 1, z - 1), this.dot(this.gradP[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }

  sample(x: number, y: number, z: number, time: number): { vx: number; vy: number; vz: number } {
    const t = time * this.speed;
    const s = this.scale;

    const nx = this.noise3D(x * s + t, y * s, z * s);
    const ny = this.noise3D(x * s, y * s + t + 100, z * s);
    const nz = this.noise3D(x * s, y * s, z * s + t + 200);

    return {
      vx: nx * this.amplitude,
      vy: ny * this.amplitude,
      vz: nz * this.amplitude
    };
  }

  setSeed(seed: number): void {
    this.buildPermutationTable(seed);
  }
}

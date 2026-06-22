
import type { Vector3, CurrentParams } from '../types';
import type { ICurrentField } from '../api';

class PerlinNoise {
  private perm: number[];

  constructor(seed: number = Math.random() * 10000) {
    this.perm = this.generatePermutation(seed);
  }

  private generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 16807) % 2147483647;
      const j = n % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    return [...p, ...p];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise3D(x: number, y: number, z: number): number {
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
        this.lerp(this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z), u),
        this.lerp(this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z), u),
        v
      ),
      this.lerp(
        this.lerp(this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }
}

export class CurrentField implements ICurrentField {
  private noiseX: PerlinNoise;
  private noiseY: PerlinNoise;
  private noiseZ: PerlinNoise;
  private noiseVortex: PerlinNoise;

  constructor() {
    this.noiseX = new PerlinNoise(1);
    this.noiseY = new PerlinNoise(2);
    this.noiseZ = new PerlinNoise(3);
    this.noiseVortex = new PerlinNoise(4);
  }

  getVelocity(x: number, y: number, z: number, t: number, params: CurrentParams): Vector3 {
    const scale = 0.02;
    const timeScale = 0.3;
    
    const nx = this.noiseX.noise3D(x * scale, y * scale, z * scale + t * timeScale);
    const ny = this.noiseY.noise3D(x * scale + 100, y * scale + 100, z * scale + t * timeScale);
    const nz = this.noiseZ.noise3D(x * scale + 200, y * scale + 200, z * scale + t * timeScale);
    
    const vortexNoise = this.noiseVortex.noise3D(x * scale * 0.5, y * scale * 0.5, z * scale * 0.5 + t * timeScale * 0.5);
    
    const baseSpeed = params.currentSpeed;
    const vortexStrength = params.vortexStrength;
    
    const vx = (nx * baseSpeed + vortexNoise * vortexStrength * (-y * 0.02 + z * 0.01));
    const vy = (ny * baseSpeed * 0.5 + vortexNoise * vortexStrength * (x * 0.02 - z * 0.01));
    const vz = (nz * baseSpeed * 0.3 + vortexNoise * vortexStrength * (-x * 0.01 + y * 0.005));
    
    const boundaryFade = this.getBoundaryFade(x, y, z);
    
    return {
      x: vx * boundaryFade,
      y: vy * boundaryFade,
      z: vz * boundaryFade
    };
  }

  private getBoundaryFade(x: number, y: number, z: number): number {
    const halfSize = 25;
    const fadeDistance = 5;
    
    const fadeX = this.fadeValue(Math.abs(x), halfSize, fadeDistance);
    const fadeY = this.fadeValue(Math.abs(y), halfSize, fadeDistance);
    const fadeZ = this.fadeValue(Math.abs(z), halfSize * 0.5, fadeDistance);
    
    return Math.min(fadeX, fadeY, fadeZ);
  }

  private fadeValue(value: number, max: number, fadeDistance: number): number {
    if (value < max - fadeDistance) return 1;
    if (value > max) return 0;
    const t = (value - (max - fadeDistance)) / fadeDistance;
    return 1 - t * t * (3 - 2 * t);
  }
}

export const currentField = new CurrentField();

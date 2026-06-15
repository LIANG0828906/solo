export type PresetType = 'sphere' | 'spiral' | 'heart' | 'nebula' | 'cloud';

export interface PresetVoxel {
  x: number;
  y: number;
  z: number;
  colorIndex: number;
}

export class PresetManager {
  private readonly GRID_SIZE = 30;
  private readonly HALF = 15;
  private readonly MAX_VOXELS = 800;
  private readonly COLOR_COUNT = 7;

  generatePreset(type: PresetType): PresetVoxel[] {
    let voxels: PresetVoxel[] = [];

    switch (type) {
      case 'sphere':
        voxels = this.generateSphere();
        break;
      case 'spiral':
        voxels = this.generateSpiral();
        break;
      case 'heart':
        voxels = this.generateHeart();
        break;
      case 'nebula':
        voxels = this.generateNebula();
        break;
      case 'cloud':
        voxels = this.generateCloud();
        break;
    }

    return this.sortByDistanceFromCenter(voxels).slice(0, this.MAX_VOXELS);
  }

  private generateSphere(): PresetVoxel[] {
    const radius = 9;
    const voxels: PresetVoxel[] = [];

    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          const dist = Math.sqrt(x * x + y * y + z * z);
          if (dist <= radius && dist >= radius - 1.5) {
            const gx = Math.round(this.HALF + x);
            const gy = Math.round(this.HALF + y);
            const gz = Math.round(this.HALF + z);
            if (this.isValidPos(gx, gy, gz)) {
              const hue = Math.atan2(y, x) / (Math.PI * 2) + 0.5;
              const colorIdx = Math.floor(hue * this.COLOR_COUNT) % this.COLOR_COUNT;
              voxels.push({ x: gx, y: gy, z: gz, colorIndex: colorIdx });
            }
          }
        }
      }
    }

    return voxels;
  }

  private generateSpiral(): PresetVoxel[] {
    const voxels: PresetVoxel[] = [];
    const turns = 6;
    const heightScale = 8;
    const radiusMax = 9;
    const totalPoints = 200;

    const placed = new Set<string>();

    for (let i = 0; i <= totalPoints; i++) {
      const progress = i / totalPoints;
      const t = progress * turns * Math.PI * 2;
      const r = radiusMax * Math.sqrt(progress);

      const arcLength = r * t;
      const minStep = 0.8;
      const adaptiveStep = Math.max(minStep, minStep * (1 + progress * 0.5));
      if (i > 0) {
        const prevProgress = (i - 1) / totalPoints;
        const prevT = prevProgress * turns * Math.PI * 2;
        const prevR = radiusMax * Math.sqrt(prevProgress);
        const deltaArc = Math.abs(r * t - prevR * prevT);
        if (deltaArc < adaptiveStep) continue;
      }

      const x = Math.round(r * Math.cos(t));
      const z = Math.round(r * Math.sin(t));
      const y = Math.round(-heightScale + progress * heightScale * 2);

      const gx = Math.round(this.HALF + x);
      const gy = Math.round(this.HALF + y);
      const gz = Math.round(this.HALF + z);

      const key = `${gx},${gy},${gz}`;
      if (placed.has(key)) continue;

      if (this.isValidPos(gx, gy, gz)) {
        placed.add(key);
        const colorIndex = Math.floor(progress * this.COLOR_COUNT) % this.COLOR_COUNT;
        voxels.push({ x: gx, y: gy, z: gz, colorIndex });
      }

      for (let offset = 1; offset <= 1; offset++) {
        const offsetAngle = t + offset * 0.6;
        const offsetR = r + offset * 0.8;
        const x2 = Math.round(offsetR * Math.cos(offsetAngle));
        const z2 = Math.round(offsetR * Math.sin(offsetAngle));
        const y2 = Math.round(-heightScale + (progress + 0.015 * offset) * heightScale * 2);

        const gx2 = Math.round(this.HALF + x2);
        const gy2 = Math.round(this.HALF + y2);
        const gz2 = Math.round(this.HALF + z2);
        const key2 = `${gx2},${gy2},${gz2}`;

        if (!placed.has(key2) && this.isValidPos(gx2, gy2, gz2)) {
          placed.add(key2);
          const colorIdx2 = Math.floor(((progress + 0.12 * offset) % 1) * this.COLOR_COUNT) % this.COLOR_COUNT;
          voxels.push({ x: gx2, y: gy2, z: gz2, colorIndex: colorIdx2 });
        }
      }
    }

    return voxels;
  }

  private generateHeart(): PresetVoxel[] {
    const voxels: PresetVoxel[] = [];
    const scale = 0.45;
    const thickness = 3;
    const placed = new Set<string>();

    for (let u = 0; u <= Math.PI * 2; u += 0.06) {
      for (let v = 0; v <= Math.PI; v += 0.15) {
        const xHeart = 16 * Math.pow(Math.sin(u), 3);
        const yHeart = 13 * Math.cos(u) - 5 * Math.cos(2 * u)
          - 2 * Math.cos(3 * u) - Math.cos(4 * u);

        for (let t = -thickness; t <= thickness; t++) {
          const tv = v + t * 0.1;
          const zT = 8 * Math.sin(tv) * Math.cos(u / 2);

          const x = Math.round(xHeart * scale);
          const y = Math.round(yHeart * scale);
          const z = Math.round(zT * scale);

          const gx = Math.round(this.HALF + x);
          const gy = Math.round(this.HALF + y);
          const gz = Math.round(this.HALF + z);

          const key = `${gx},${gy},${gz}`;
          if (placed.has(key)) continue;

          if (this.isValidPos(gx, gy, gz)) {
            placed.add(key);
            const normY = (yHeart + 20) / 40;
            const colorIndex = Math.floor(normY * 3 + 4) % this.COLOR_COUNT;
            voxels.push({ x: gx, y: gy, z: gz, colorIndex });
          }
        }
      }
    }

    return voxels;
  }

  private generateNebula(): PresetVoxel[] {
    const voxels: PresetVoxel[] = [];
    const placed = new Set<string>();
    const arms = 4;
    const pointsPerArm = 180;

    for (let arm = 0; arm < arms; arm++) {
      const armOffset = (arm / arms) * Math.PI * 2;

      for (let i = 0; i < pointsPerArm; i++) {
        const progress = i / pointsPerArm;
        const angle = armOffset + progress * Math.PI * 2 * 2
          + (Math.random() - 0.5) * 0.5;
        const radius = 2 + progress * 10
          + (Math.random() - 0.5) * 3;

        for (let cluster = 0; cluster < 3; cluster++) {
          const r = radius + (Math.random() - 0.5) * 1.5;
          const a = angle + (Math.random() - 0.5) * 0.4;
          const yOffset = (Math.random() - 0.5) * 6;

          const x = Math.round(r * Math.cos(a));
          const y = Math.round(yOffset);
          const z = Math.round(r * Math.sin(a));

          const gx = Math.round(this.HALF + x);
          const gy = Math.round(this.HALF + y);
          const gz = Math.round(this.HALF + z);

          const key = `${gx},${gy},${gz}`;
          if (placed.has(key)) continue;

          if (this.isValidPos(gx, gy, gz)) {
            placed.add(key);
            const hueFromAngle = (angle + Math.PI) / (Math.PI * 2);
            const colorIndex = Math.floor(hueFromAngle * this.COLOR_COUNT) % this.COLOR_COUNT;
            voxels.push({ x: gx, y: gy, z: gz, colorIndex });
          }
        }
      }
    }

    const coreCount = 80;
    for (let i = 0; i < coreCount; i++) {
      const r = Math.pow(Math.random(), 0.5) * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = Math.round(r * Math.sin(phi) * Math.cos(theta));
      const y = Math.round(r * Math.sin(phi) * Math.sin(theta));
      const z = Math.round(r * Math.cos(phi));

      const gx = Math.round(this.HALF + x);
      const gy = Math.round(this.HALF + y);
      const gz = Math.round(this.HALF + z);

      const key = `${gx},${gy},${gz}`;
      if (placed.has(key)) continue;

      if (this.isValidPos(gx, gy, gz)) {
        placed.add(key);
        const colorIndex = Math.floor(Math.random() * this.COLOR_COUNT);
        voxels.push({ x: gx, y: gy, z: gz, colorIndex });
      }
    }

    return voxels;
  }

  private generateCloud(): PresetVoxel[] {
    const voxels: PresetVoxel[] = [];
    const placed = new Set<string>();
    const count = 600;

    function gaussianRandom(): number {
      const u1 = Math.random();
      const u2 = Math.random();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }

    for (let i = 0; i < count; i++) {
      const x = Math.round(gaussianRandom() * 7);
      const y = Math.round(gaussianRandom() * 6);
      const z = Math.round(gaussianRandom() * 7);

      const gx = Math.round(this.HALF + x);
      const gy = Math.round(this.HALF + y);
      const gz = Math.round(this.HALF + z);

      const key = `${gx},${gy},${gz}`;
      if (placed.has(key)) continue;

      if (this.isValidPos(gx, gy, gz)) {
        placed.add(key);
        const hue = Math.atan2(y, x) / (Math.PI * 2) + 0.5;
        const colorIndex = Math.floor(hue * this.COLOR_COUNT) % this.COLOR_COUNT;
        voxels.push({ x: gx, y: gy, z: gz, colorIndex });
      }
    }

    return voxels;
  }

  private sortByDistanceFromCenter(voxels: PresetVoxel[]): PresetVoxel[] {
    return voxels.sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.x - this.HALF, 2) +
        Math.pow(a.y - this.HALF, 2) +
        Math.pow(a.z - this.HALF, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.x - this.HALF, 2) +
        Math.pow(b.y - this.HALF, 2) +
        Math.pow(b.z - this.HALF, 2)
      );
      return distA - distB;
    });
  }

  private isValidPos(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.GRID_SIZE
      && y >= 0 && y < this.GRID_SIZE
      && z >= 0 && z < this.GRID_SIZE;
  }
}

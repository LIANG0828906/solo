import { ParticleState, WindVector, BuildingAttributes } from '../types';

const BOUNDARY = 100;
const DEFLECTION_DISTANCE = 0.5;
const SMOOTH_TIME = 0.3;
const BUILDING_HALF = 8;

export class FlowParticles {
  private targetWindX: number = 0;
  private targetWindZ: number = 0;
  private currentWindX: number = 0;
  private currentWindZ: number = 0;

  initParticles(count: number, wind: WindVector): ParticleState[] {
    const rad = (wind.direction * Math.PI) / 180;
    this.targetWindX = Math.sin(rad) * wind.speed;
    this.targetWindZ = Math.cos(rad) * wind.speed;
    this.currentWindX = this.targetWindX;
    this.currentWindZ = this.targetWindZ;

    const particles: ParticleState[] = [];
    for (let i = 0; i < count; i++) {
      const entry = this.getEntryPoint(wind);
      particles.push({
        id: `p-${i}`,
        position: [entry[0], 1, entry[1]],
        velocity: [this.currentWindX, 0, this.currentWindZ],
        hue: (i / count) * 360,
        active: true,
      });
    }
    return particles;
  }

  getEntryPoint(wind: WindVector): [number, number] {
    const rad = (wind.direction * Math.PI) / 180;
    const vx = Math.sin(rad);
    const vz = Math.cos(rad);

    let entryX: number, entryZ: number;

    if (Math.abs(vx) >= Math.abs(vz)) {
      entryX = vx >= 0 ? -BOUNDARY : BOUNDARY;
      entryZ = Math.random() * 2 * BOUNDARY - BOUNDARY;
    } else {
      entryZ = vz >= 0 ? -BOUNDARY : BOUNDARY;
      entryX = Math.random() * 2 * BOUNDARY - BOUNDARY;
    }

    return [entryX, entryZ];
  }

  updateParticlePositions(
    particles: ParticleState[],
    wind: WindVector,
    buildings: BuildingAttributes[],
    deltaTime: number
  ): ParticleState[] {
    const rad = (wind.direction * Math.PI) / 180;
    this.targetWindX = Math.sin(rad) * wind.speed;
    this.targetWindZ = Math.cos(rad) * wind.speed;

    const smoothFactor = Math.min(deltaTime / SMOOTH_TIME, 1);
    this.currentWindX += (this.targetWindX - this.currentWindX) * smoothFactor;
    this.currentWindZ += (this.targetWindZ - this.currentWindZ) * smoothFactor;

    return particles.map((particle) => {
      let [px, py, pz] = particle.position;
      let vx = this.currentWindX;
      let vz = this.currentWindZ;

      let nextX = px + vx;
      let nextZ = pz + vz;

      for (const building of buildings) {
        const bx = building.worldX;
        const bz = building.worldZ;

        if (
          nextX > bx - BUILDING_HALF &&
          nextX < bx + BUILDING_HALF &&
          nextZ > bz - BUILDING_HALF &&
          nextZ < bz + BUILDING_HALF &&
          py < building.height
        ) {
          const side = Math.random() > 0.5 ? 1 : -1;

          const distLeft = Math.abs(px - (bx - BUILDING_HALF));
          const distRight = Math.abs(px - (bx + BUILDING_HALF));
          const distTop = Math.abs(pz - (bz - BUILDING_HALF));
          const distBottom = Math.abs(pz - (bz + BUILDING_HALF));

          const minDist = Math.min(distLeft, distRight, distTop, distBottom);

          if (minDist === distLeft || minDist === distRight) {
            px = minDist === distLeft
              ? bx - BUILDING_HALF - DEFLECTION_DISTANCE
              : bx + BUILDING_HALF + DEFLECTION_DISTANCE;
            pz = side > 0
              ? bz - BUILDING_HALF - DEFLECTION_DISTANCE
              : bz + BUILDING_HALF + DEFLECTION_DISTANCE;
          } else {
            pz = minDist === distTop
              ? bz - BUILDING_HALF - DEFLECTION_DISTANCE
              : bz + BUILDING_HALF + DEFLECTION_DISTANCE;
            px = side > 0
              ? bx - BUILDING_HALF - DEFLECTION_DISTANCE
              : bx + BUILDING_HALF + DEFLECTION_DISTANCE;
          }

          nextX = px;
          nextZ = pz;
          break;
        }
      }

      px = nextX;
      pz = nextZ;
      py = 1;

      if (Math.abs(px) > BOUNDARY || Math.abs(pz) > BOUNDARY) {
        const entry = this.getEntryPoint(wind);
        px = entry[0];
        pz = entry[1];
      }

      return {
        ...particle,
        position: [px, py, pz],
        velocity: [vx, 0, vz],
      };
    });
  }

  calculateAverageSpeed(particles: ParticleState[]): number {
    if (particles.length === 0) return 0;
    const totalSpeed = particles.reduce((sum, p) => {
      const [vx, , vz] = p.velocity;
      return sum + Math.sqrt(vx * vx + vz * vz);
    }, 0);
    return totalSpeed / particles.length;
  }
}

export const flowParticles = new FlowParticles();

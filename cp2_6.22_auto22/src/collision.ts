import * as THREE from 'three';
import { Galaxy } from './galaxy';

export interface SimConfig {
  gravityConstant: number;
  softening: number;
  dt: number;
}

const DEFAULT_CONFIG: SimConfig = {
  gravityConstant: 2.0,
  softening: 3.0,
  dt: 0.016,
};

export class CollisionSimulator {
  public galaxyA: Galaxy;
  public galaxyB: Galaxy;
  public time: number = 0;
  public initialState: {
    posA: Float32Array;
    velA: Float32Array;
    posB: Float32Array;
    velB: Float32Array;
    corePosA: THREE.Vector3;
    coreVelA: THREE.Vector3;
    corePosB: THREE.Vector3;
    coreVelB: THREE.Vector3;
  } | null = null;

  private config: SimConfig;
  private heatmapTexture: THREE.DataTexture | null = null;
  private heatmapMesh: THREE.Mesh | null = null;
  private heatmapSize: number = 64;

  constructor(galaxyA: Galaxy, galaxyB: Galaxy, config?: Partial<SimConfig>) {
    this.galaxyA = galaxyA;
    this.galaxyB = galaxyB;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.saveInitialState();
  }

  public saveInitialState(): void {
    this.initialState = {
      posA: new Float32Array(this.galaxyA.positions),
      velA: new Float32Array(this.galaxyA.velocities),
      posB: new Float32Array(this.galaxyB.positions),
      velB: new Float32Array(this.galaxyB.velocities),
      corePosA: this.galaxyA.corePosition.clone(),
      coreVelA: this.galaxyA.coreVelocity.clone(),
      corePosB: this.galaxyB.corePosition.clone(),
      coreVelB: this.galaxyB.coreVelocity.clone(),
    };
  }

  public reset(): void {
    if (!this.initialState) return;
    this.galaxyA.positions.set(this.initialState.posA);
    this.galaxyA.velocities.set(this.initialState.velA);
    this.galaxyB.positions.set(this.initialState.posB);
    this.galaxyB.velocities.set(this.initialState.velB);
    this.galaxyA.corePosition.copy(this.initialState.corePosA);
    this.galaxyA.coreVelocity.copy(this.initialState.coreVelA);
    this.galaxyB.corePosition.copy(this.initialState.corePosB);
    this.galaxyB.coreVelocity.copy(this.initialState.coreVelB);
    this.galaxyA.updateGeometry();
    this.galaxyA.updateColorsByVelocity();
    this.galaxyB.updateGeometry();
    this.galaxyB.updateColorsByVelocity();
    this.time = 0;
  }

  public step(dt: number, speedMultiplier: number): void {
    const effectiveDt = dt * speedMultiplier;
    const subSteps = Math.max(1, Math.ceil(effectiveDt / this.config.dt));
    const subDt = effectiveDt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      this.computeGravity(subDt);
    }
    this.time += effectiveDt;
    this.galaxyA.updateGeometry();
    this.galaxyB.updateGeometry();
  }

  private computeGravity(subDt: number): void {
    const G = this.config.gravityConstant;
    const eps = this.config.softening;

    const ca = this.galaxyA.corePosition;
    const cb = this.galaxyB.corePosition;
    const ma = this.galaxyA.mass;
    const mb = this.galaxyB.mass;

    const dx = cb.x - ca.x;
    const dy = cb.y - ca.y;
    const dz = cb.z - ca.z;
    const distSq = dx * dx + dy * dy + dz * dz + eps * eps;
    const dist = Math.sqrt(distSq);
    const invDist3 = 1.0 / (distSq * dist);

    const ax_core = G * mb * dx * invDist3;
    const ay_core = G * mb * dy * invDist3;
    const az_core = G * mb * dz * invDist3;

    const bx_core = -G * ma * dx * invDist3;
    const by_core = -G * ma * dy * invDist3;
    const bz_core = -G * ma * dz * invDist3;

    this.galaxyA.coreVelocity.x += ax_core * subDt;
    this.galaxyA.coreVelocity.y += ay_core * subDt;
    this.galaxyA.coreVelocity.z += az_core * subDt;
    this.galaxyB.coreVelocity.x += bx_core * subDt;
    this.galaxyB.coreVelocity.y += by_core * subDt;
    this.galaxyB.coreVelocity.z += bz_core * subDt;

    this.galaxyA.corePosition.x += this.galaxyA.coreVelocity.x * subDt;
    this.galaxyA.corePosition.y += this.galaxyA.coreVelocity.y * subDt;
    this.galaxyA.corePosition.z += this.galaxyA.coreVelocity.z * subDt;
    this.galaxyB.corePosition.x += this.galaxyB.coreVelocity.x * subDt;
    this.galaxyB.corePosition.y += this.galaxyB.coreVelocity.y * subDt;
    this.galaxyB.corePosition.z += this.galaxyB.coreVelocity.z * subDt;

    const countA = this.galaxyA.particleCount;
    const countB = this.galaxyB.particleCount;
    const posA = this.galaxyA.positions;
    const velA = this.galaxyA.velocities;
    const posB = this.galaxyB.positions;
    const velB = this.galaxyB.velocities;

    for (let i = 0; i < countA; i++) {
      const i3 = i * 3;
      const px = posA[i3];
      const py = posA[i3 + 1];
      const pz = posA[i3 + 2];

      let ax = 0, ay = 0, az = 0;

      const ddx = cb.x - px;
      const ddy = cb.y - py;
      const ddz = cb.z - pz;
      const dSq = ddx * ddx + ddy * ddy + ddz * ddz + eps * eps;
      const d = Math.sqrt(dSq);
      const invD3 = 1.0 / (dSq * d);
      ax += G * mb * ddx * invD3;
      ay += G * mb * ddy * invD3;
      az += G * mb * ddz * invD3;

      const ddx2 = ca.x - px;
      const ddy2 = ca.y - py;
      const ddz2 = ca.z - pz;
      const dSq2 = ddx2 * ddx2 + ddy2 * ddy2 + ddz2 * ddz2 + (eps * 0.5) * (eps * 0.5);
      const d2 = Math.sqrt(dSq2);
      const invD3_2 = 1.0 / (dSq2 * d2);
      const innerMass = ma * Math.min(1.0, d2 / 30);
      ax += G * innerMass * ddx2 * invD3_2 * 0.5;
      ay += G * innerMass * ddy2 * invD3_2 * 0.5;
      az += G * innerMass * ddz2 * invD3_2 * 0.5;

      velA[i3] += ax * subDt;
      velA[i3 + 1] += ay * subDt;
      velA[i3 + 2] += az * subDt;
    }

    for (let i = 0; i < countB; i++) {
      const i3 = i * 3;
      const px = posB[i3];
      const py = posB[i3 + 1];
      const pz = posB[i3 + 2];

      let ax = 0, ay = 0, az = 0;

      const ddx = ca.x - px;
      const ddy = ca.y - py;
      const ddz = ca.z - pz;
      const dSq = ddx * ddx + ddy * ddy + ddz * ddz + eps * eps;
      const d = Math.sqrt(dSq);
      const invD3 = 1.0 / (dSq * d);
      ax += G * ma * ddx * invD3;
      ay += G * ma * ddy * invD3;
      az += G * ma * ddz * invD3;

      const ddx2 = cb.x - px;
      const ddy2 = cb.y - py;
      const ddz2 = cb.z - pz;
      const dSq2 = ddx2 * ddx2 + ddy2 * ddy2 + ddz2 * ddz2 + (eps * 0.5) * (eps * 0.5);
      const d2 = Math.sqrt(dSq2);
      const invD3_2 = 1.0 / (dSq2 * d2);
      const innerMass = mb * Math.min(1.0, d2 / 30);
      ax += G * innerMass * ddx2 * invD3_2 * 0.5;
      ay += G * innerMass * ddy2 * invD3_2 * 0.5;
      az += G * innerMass * ddz2 * invD3_2 * 0.5;

      velB[i3] += ax * subDt;
      velB[i3 + 1] += ay * subDt;
      velB[i3 + 2] += az * subDt;
    }

    for (let i = 0; i < countA; i++) {
      const i3 = i * 3;
      posA[i3] += velA[i3] * subDt;
      posA[i3 + 1] += velA[i3 + 1] * subDt;
      posA[i3 + 2] += velA[i3 + 2] * subDt;
    }

    for (let i = 0; i < countB; i++) {
      const i3 = i * 3;
      posB[i3] += velB[i3] * subDt;
      posB[i3 + 1] += velB[i3 + 1] * subDt;
      posB[i3 + 2] += velB[i3 + 2] * subDt;
    }
  }

  public getKineticEnergy(): number {
    let ke = 0;
    const velA = this.galaxyA.velocities;
    const velB = this.galaxyB.velocities;

    for (let i = 0; i < this.galaxyA.particleCount; i++) {
      const i3 = i * 3;
      const vx = velA[i3], vy = velA[i3 + 1], vz = velA[i3 + 2];
      ke += 0.5 * (vx * vx + vy * vy + vz * vz);
    }
    for (let i = 0; i < this.galaxyB.particleCount; i++) {
      const i3 = i * 3;
      const vx = velB[i3], vy = velB[i3 + 1], vz = velB[i3 + 2];
      ke += 0.5 * (vx * vx + vy * vy + vz * vz);
    }
    return ke / 1000;
  }

  public getPotentialEnergy(): number {
    const G = this.config.gravityConstant;
    const eps = this.config.softening;
    const ca = this.galaxyA.corePosition;
    const cb = this.galaxyB.corePosition;
    const ma = this.galaxyA.mass;
    const mb = this.galaxyB.mass;

    const dx = cb.x - ca.x;
    const dy = cb.y - ca.y;
    const dz = cb.z - ca.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz + eps * eps);
    let pe = -G * ma * mb / dist;

    const countA = this.galaxyA.particleCount;
    const countB = this.galaxyB.particleCount;
    const posA = this.galaxyA.positions;
    const posB = this.galaxyB.positions;
    const particleMassA = ma / countA;
    const particleMassB = mb / countB;

    const samples = Math.min(200, countA, countB);
    const stepA = Math.floor(countA / samples);
    const stepB = Math.floor(countB / samples);
    let samplePe = 0;
    let pairs = 0;

    for (let i = 0; i < countA; i += stepA) {
      const i3 = i * 3;
      const ax = posA[i3], ay = posA[i3 + 1], az = posA[i3 + 2];
      for (let j = 0; j < countB; j += stepB) {
        const j3 = j * 3;
        const bx = posB[j3], by = posB[j3 + 1], bz = posB[j3 + 2];
        const ddx = bx - ax, ddy = by - ay, ddz = bz - az;
        const d = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz + eps * eps);
        samplePe += -G * particleMassA * particleMassB / d;
        pairs++;
      }
    }

    const scale = (countA * countB) / pairs;
    pe += samplePe * scale * 0.3;

    return pe / 1000;
  }

  public getHeatmapMesh(): THREE.Mesh {
    if (this.heatmapMesh) return this.heatmapMesh;

    const size = this.heatmapSize;
    const data = new Uint8Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      data[i * 4] = 0;
      data[i * 4 + 1] = 0;
      data[i * 4 + 2] = 0;
      data[i * 4 + 3] = 0;
    }

    this.heatmapTexture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    this.heatmapTexture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(300, 300);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.heatmapTexture },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec2 vUv;
        void main() {
          vec4 tex = texture2D(uTexture, vUv);
          if (tex.a < 0.02) discard;
          float t = tex.r;
          vec3 cool = vec3(0.0, 0.2, 0.6);
          vec3 warm = vec3(1.0, 0.3, 0.1);
          vec3 hot = vec3(1.0, 0.9, 0.3);
          vec3 color = mix(cool, warm, smoothstep(0.0, 0.5, t));
          color = mix(color, hot, smoothstep(0.5, 1.0, t));
          float alpha = tex.a * 0.5;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.heatmapMesh = new THREE.Mesh(geometry, material);
    this.heatmapMesh.rotation.x = -Math.PI / 2;
    this.heatmapMesh.position.y = -20;
    return this.heatmapMesh;
  }

  public updateHeatmap(): void {
    if (!this.heatmapTexture || !this.heatmapMesh) return;

    const size = this.heatmapSize;
    const data = this.heatmapTexture.image.data as unknown as Uint8Array;
    const density = new Float32Array(size * size);

    const worldSize = 300;
    const half = worldSize / 2;
    const cellSize = worldSize / size;

    const ca = this.galaxyA.corePosition;
    const cb = this.galaxyB.corePosition;
    const centerX = (ca.x + cb.x) / 2;
    const centerZ = (ca.z + cb.z) / 2;

    this.heatmapMesh.position.x = centerX;
    this.heatmapMesh.position.z = centerZ;

    const processGalaxy = (galaxy: Galaxy) => {
      const pos = galaxy.positions;
      const count = galaxy.particleCount;
      const step = Math.max(1, Math.floor(count / 3000));
      for (let i = 0; i < count; i += step) {
        const i3 = i * 3;
        const x = pos[i3] - centerX;
        const z = pos[i3 + 2] - centerZ;

        const gx = Math.floor((x + half) / cellSize);
        const gz = Math.floor((z + half) / cellSize);

        if (gx >= 0 && gx < size && gz >= 0 && gz < size) {
          const radius = 2;
          for (let dx = -radius; dx <= radius; dx++) {
            for (let dz = -radius; dz <= radius; dz++) {
              const tx = gx + dx;
              const tz = gz + dz;
              if (tx >= 0 && tx < size && tz >= 0 && tz < size) {
                const d = Math.sqrt(dx * dx + dz * dz);
                const w = Math.exp(-d * d / 2);
                density[tz * size + tx] += w;
              }
            }
          }
        }
      }
    };

    processGalaxy(this.galaxyA);
    processGalaxy(this.galaxyB);

    let maxD = 0;
    for (let i = 0; i < size * size; i++) {
      if (density[i] > maxD) maxD = density[i];
    }
    const normalize = maxD > 0 ? 1.0 / maxD : 1;

    for (let i = 0; i < size * size; i++) {
      const d = density[i] * normalize;
      const idx = i * 4;
      if (d > 0.02) {
        data[idx] = Math.floor(d * 255);
        data[idx + 1] = Math.floor(d * 100);
        data[idx + 2] = Math.floor((1 - d) * 150);
        data[idx + 3] = Math.floor(Math.min(1, d * 3) * 255);
      } else {
        data[idx] = 0;
        data[idx + 1] = 0;
        data[idx + 2] = 0;
        data[idx + 3] = 0;
      }
    }

    this.heatmapTexture.needsUpdate = true;
  }
}

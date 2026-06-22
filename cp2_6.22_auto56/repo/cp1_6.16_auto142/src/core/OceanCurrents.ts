import * as THREE from 'three';
import { create } from 'zustand';

const EARTH_RADIUS = 5;
const PARTICLE_HEIGHT = 0.03;
const PARTICLES_PER_CURRENT = 3000;
const MIN_PARTICLE_SIZE = 0.1;
const MAX_PARTICLE_SIZE = 0.5;

interface LatLon {
  lat: number;
  lon: number;
}

interface OceanCurrentDefinition {
  name: string;
  nameEn: string;
  waypoints: LatLon[];
  colorStart: THREE.Color;
  colorEnd: THREE.Color;
  baseSpeed: number;
}

interface OceanCurrentData {
  definition: OceanCurrentDefinition;
  segmentLengths: number[];
  totalLength: number;
}

interface ParticleState {
  currentIndex: number;
  t: number;
}

interface OceanCurrentsStore {
  isInitialized: boolean;
  setInitialized: (value: boolean) => void;
}

const useOceanCurrentsStore = create<OceanCurrentsStore>((set) => ({
  isInitialized: false,
  setInitialized: (value: boolean) => set({ isInitialized: value }),
}));

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
  const phi = degToRad(90 - lat);
  const theta = degToRad(lon);
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const vector3ToLatLon = (vec: THREE.Vector3): LatLon => {
  const length = vec.length();
  const phi = Math.acos(vec.y / length);
  const theta = Math.atan2(vec.z, vec.x);
  return {
    lat: 90 - (phi * 180) / Math.PI,
    lon: (theta * 180) / Math.PI,
  };
};

const greatCircleInterpolate = (
  start: LatLon,
  end: LatLon,
  t: number
): THREE.Vector3 => {
  const startVec = latLonToVector3(start.lat, start.lon, 1);
  const endVec = latLonToVector3(end.lat, end.lon, 1);
  const dot = startVec.dot(endVec);
  const clampedDot = Math.max(-1, Math.min(1, dot));
  const omega = Math.acos(clampedDot);
  if (omega < 1e-10) {
    return startVec.clone().multiplyScalar(EARTH_RADIUS + PARTICLE_HEIGHT);
  }
  const sinOmega = Math.sin(omega);
  const ratio1 = Math.sin((1 - t) * omega) / sinOmega;
  const ratio2 = Math.sin(t * omega) / sinOmega;
  const result = new THREE.Vector3()
    .addScaledVector(startVec, ratio1)
    .addScaledVector(endVec, ratio2);
  return result.normalize().multiplyScalar(EARTH_RADIUS + PARTICLE_HEIGHT);
};

const greatCircleDistance = (a: LatLon, b: LatLon): number => {
  const startVec = latLonToVector3(a.lat, a.lon, 1);
  const endVec = latLonToVector3(b.lat, b.lon, 1);
  const dot = startVec.dot(endVec);
  const clampedDot = Math.max(-1, Math.min(1, dot));
  return Math.acos(clampedDot);
};

const OCEAN_CURRENT_DEFINITIONS: OceanCurrentDefinition[] = [
  {
    name: '湾流',
    nameEn: 'Gulf Stream',
    waypoints: [
      { lat: 16, lon: -78 },
      { lat: 20, lon: -76 },
      { lat: 25, lon: -74 },
      { lat: 29, lon: -72 },
      { lat: 32, lon: -70 },
      { lat: 35, lon: -65 },
      { lat: 38, lon: -58 },
      { lat: 40, lon: -50 },
      { lat: 43, lon: -40 },
      { lat: 46, lon: -30 },
      { lat: 48, lon: -20 },
      { lat: 52, lon: -10 },
      { lat: 56, lon: 0 },
      { lat: 60, lon: 5 },
      { lat: 64, lon: 10 },
    ],
    colorStart: new THREE.Color(0x001a4d),
    colorEnd: new THREE.Color(0xff4500),
    baseSpeed: 0.012,
  },
  {
    name: '黑潮',
    nameEn: 'Kuroshio',
    waypoints: [
      { lat: 8, lon: 128 },
      { lat: 10, lon: 127 },
      { lat: 13, lon: 126 },
      { lat: 16, lon: 124 },
      { lat: 20, lon: 122 },
      { lat: 24, lon: 123 },
      { lat: 28, lon: 127 },
      { lat: 31, lon: 131 },
      { lat: 34, lon: 135 },
      { lat: 37, lon: 140 },
      { lat: 40, lon: 144 },
      { lat: 42, lon: 148 },
      { lat: 44, lon: 152 },
      { lat: 46, lon: 156 },
    ],
    colorStart: new THREE.Color(0x001a4d),
    colorEnd: new THREE.Color(0x00cc66),
    baseSpeed: 0.009,
  },
  {
    name: '厄加勒斯',
    nameEn: 'Agulhas',
    waypoints: [
      { lat: -10, lon: 40 },
      { lat: -14, lon: 40 },
      { lat: -18, lon: 39 },
      { lat: -22, lon: 37 },
      { lat: -26, lon: 35 },
      { lat: -30, lon: 32 },
      { lat: -33, lon: 29 },
      { lat: -35, lon: 26 },
      { lat: -37, lon: 23 },
      { lat: -39, lon: 20 },
      { lat: -40, lon: 17 },
      { lat: -41, lon: 14 },
    ],
    colorStart: new THREE.Color(0x0044aa),
    colorEnd: new THREE.Color(0xffffff),
    baseSpeed: 0.007,
  },
  {
    name: '西风漂流',
    nameEn: 'West Wind Drift',
    waypoints: [
      { lat: -50, lon: 0 },
      { lat: -52, lon: 30 },
      { lat: -54, lon: 60 },
      { lat: -56, lon: 90 },
      { lat: -58, lon: 120 },
      { lat: -60, lon: 150 },
      { lat: -60, lon: 180 },
      { lat: -60, lon: -150 },
      { lat: -58, lon: -120 },
      { lat: -56, lon: -90 },
      { lat: -54, lon: -60 },
      { lat: -52, lon: -30 },
    ],
    colorStart: new THREE.Color(0x0044aa),
    colorEnd: new THREE.Color(0xffffff),
    baseSpeed: 0.004,
  },
  {
    name: '秘鲁寒流',
    nameEn: 'Peru Current',
    waypoints: [
      { lat: -45, lon: -75 },
      { lat: -40, lon: -74 },
      { lat: -35, lon: -73 },
      { lat: -30, lon: -72 },
      { lat: -25, lon: -71 },
      { lat: -20, lon: -71 },
      { lat: -15, lon: -72 },
      { lat: -10, lon: -74 },
      { lat: -5, lon: -77 },
      { lat: 0, lon: -80 },
      { lat: 5, lon: -82 },
      { lat: 8, lon: -85 },
    ],
    colorStart: new THREE.Color(0x0044aa),
    colorEnd: new THREE.Color(0xffffff),
    baseSpeed: 0.006,
  },
];

class OceanCurrent {
  private data: OceanCurrentData;
  private particles: ParticleState[];
  private startIndex: number;

  constructor(definition: OceanCurrentDefinition, startIndex: number) {
    this.startIndex = startIndex;
    this.data = {
      definition,
      segmentLengths: [],
      totalLength: 0,
    };
    this.particles = [];
    this.calculateSegmentLengths();
    this.initializeParticles();
  }

  private calculateSegmentLengths(): void {
    const { waypoints } = this.data.definition;
    this.data.segmentLengths = [];
    this.data.totalLength = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const dist = greatCircleDistance(waypoints[i], waypoints[i + 1]);
      this.data.segmentLengths.push(dist);
      this.data.totalLength += dist;
    }
  }

  private initializeParticles(): void {
    this.particles = [];
    for (let i = 0; i < PARTICLES_PER_CURRENT; i++) {
      this.particles.push({
        currentIndex: this.startIndex,
        t: i / PARTICLES_PER_CURRENT,
      });
    }
  }

  getData(): OceanCurrentData {
    return this.data;
  }

  getParticles(): ParticleState[] {
    return this.particles;
  }

  getPositionAt(t: number): THREE.Vector3 {
    const { waypoints } = this.data.definition;
    const normalizedT = ((t % 1) + 1) % 1;
    const targetLength = normalizedT * this.data.totalLength;
    let accumulatedLength = 0;
    for (let i = 0; i < this.data.segmentLengths.length; i++) {
      const segLen = this.data.segmentLengths[i];
      if (accumulatedLength + segLen >= targetLength) {
        const localT = (targetLength - accumulatedLength) / segLen;
        return greatCircleInterpolate(waypoints[i], waypoints[i + 1], localT);
      }
      accumulatedLength += segLen;
    }
    return latLonToVector3(
      waypoints[waypoints.length - 1].lat,
      waypoints[waypoints.length - 1].lon,
      EARTH_RADIUS + PARTICLE_HEIGHT
    );
  }

  getTangentAt(t: number): THREE.Vector3 {
    const eps = 0.001;
    const p1 = this.getPositionAt(t);
    const p2 = this.getPositionAt((t + eps) % 1);
    return p2.sub(p1).normalize();
  }

  getBaseSpeed(): number {
    return this.data.definition.baseSpeed;
  }

  getColorStart(): THREE.Color {
    return this.data.definition.colorStart;
  }

  getColorEnd(): THREE.Color {
    return this.data.definition.colorEnd;
  }
}

export class OceanCurrentsSystem {
  private currents: OceanCurrent[];
  private points: THREE.Points | null;
  private geometry: THREE.BufferGeometry | null;
  private material: THREE.PointsMaterial | null;
  private positionAttribute: THREE.Float32BufferAttribute | null;
  private colorAttribute: THREE.Float32BufferAttribute | null;
  private sizeAttribute: THREE.Float32BufferAttribute | null;
  private particleToCurrent: Map<number, number>;
  private totalParticles: number;
  private scene: THREE.Scene | null;

  constructor() {
    this.currents = [];
    this.points = null;
    this.geometry = null;
    this.material = null;
    this.positionAttribute = null;
    this.colorAttribute = null;
    this.sizeAttribute = null;
    this.particleToCurrent = new Map();
    this.totalParticles = OCEAN_CURRENT_DEFINITIONS.length * PARTICLES_PER_CURRENT;
    this.scene = null;
    this.initializeCurrents();
  }

  private initializeCurrents(): void {
    this.currents = [];
    this.particleToCurrent.clear();
    let globalIndex = 0;
    for (let c = 0; c < OCEAN_CURRENT_DEFINITIONS.length; c++) {
      const current = new OceanCurrent(OCEAN_CURRENT_DEFINITIONS[c], globalIndex);
      this.currents.push(current);
      for (let p = 0; p < PARTICLES_PER_CURRENT; p++) {
        this.particleToCurrent.set(globalIndex + p, c);
      }
      globalIndex += PARTICLES_PER_CURRENT;
    }
  }

  public init(scene: THREE.Scene): void {
    this.scene = scene;
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.totalParticles * 3);
    const colors = new Float32Array(this.totalParticles * 3);
    const sizes = new Float32Array(this.totalParticles);
    let particleIndex = 0;
    for (const current of this.currents) {
      const particles = current.getParticles();
      const colorStart = current.getColorStart();
      const colorEnd = current.getColorEnd();
      const baseSpeed = current.getBaseSpeed();
      for (const particle of particles) {
        const pos = current.getPositionAt(particle.t);
        positions[particleIndex * 3] = pos.x;
        positions[particleIndex * 3 + 1] = pos.y;
        positions[particleIndex * 3 + 2] = pos.z;
        const color = colorStart.clone().lerp(colorEnd, particle.t);
        colors[particleIndex * 3] = color.r;
        colors[particleIndex * 3 + 1] = color.g;
        colors[particleIndex * 3 + 2] = color.b;
        const normalizedSpeed = baseSpeed / 0.012;
        sizes[particleIndex] = MIN_PARTICLE_SIZE + normalizedSpeed * (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE);
        particleIndex++;
      }
    }
    this.positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
    this.colorAttribute = new THREE.Float32BufferAttribute(colors, 3);
    this.sizeAttribute = new THREE.Float32BufferAttribute(sizes, 1);
    this.geometry.setAttribute('position', this.positionAttribute);
    this.geometry.setAttribute('color', this.colorAttribute);
    this.geometry.setAttribute('size', this.sizeAttribute);
    this.material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    useOceanCurrentsStore.getState().setInitialized(true);
  }

  public update(dt: number, speedScale: number = 1, timeSpeed: number = 1): void {
    if (!this.positionAttribute || !this.colorAttribute || !this.sizeAttribute) {
      return;
    }
    const positions = this.positionAttribute.array as Float32Array;
    const colors = this.colorAttribute.array as Float32Array;
    const sizes = this.sizeAttribute.array as Float32Array;
    let particleIndex = 0;
    const delta = dt * speedScale * timeSpeed;
    for (const current of this.currents) {
      const particles = current.getParticles();
      const colorStart = current.getColorStart();
      const colorEnd = current.getColorEnd();
      const baseSpeed = current.getBaseSpeed();
      const moveAmount = baseSpeed * delta;
      const normalizedSpeed = baseSpeed / 0.012;
      for (const particle of particles) {
        particle.t = (particle.t + moveAmount) % 1;
        if (particle.t < 0) particle.t += 1;
        const pos = current.getPositionAt(particle.t);
        positions[particleIndex * 3] = pos.x;
        positions[particleIndex * 3 + 1] = pos.y;
        positions[particleIndex * 3 + 2] = pos.z;
        const color = colorStart.clone().lerp(colorEnd, particle.t);
        colors[particleIndex * 3] = color.r;
        colors[particleIndex * 3 + 1] = color.g;
        colors[particleIndex * 3 + 2] = color.b;
        sizes[particleIndex] = MIN_PARTICLE_SIZE + normalizedSpeed * (MAX_PARTICLE_SIZE - MIN_PARTICLE_SIZE);
        particleIndex++;
      }
    }
    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.sizeAttribute.needsUpdate = true;
  }

  public getVelocityAt(lat: number, lon: number): THREE.Vector3 {
    let bestCurrent: OceanCurrent | null = null;
    let bestT = 0;
    let minDist = Infinity;
    const targetPos = latLonToVector3(lat, lon, EARTH_RADIUS + PARTICLE_HEIGHT);
    for (const current of this.currents) {
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const pos = current.getPositionAt(t);
        const dist = pos.distanceTo(targetPos);
        if (dist < minDist) {
          minDist = dist;
          bestCurrent = current;
          bestT = t;
        }
      }
    }
    if (!bestCurrent) {
      return new THREE.Vector3(0, 0, 0);
    }
    const tangent = bestCurrent.getTangentAt(bestT);
    const speedFactor = bestCurrent.getBaseSpeed();
    return tangent.multiplyScalar(speedFactor * 100);
  }

  public getCurrentInfo(particleIndex: number): {
    currentName: string;
    currentNameEn: string;
    t: number;
    color: THREE.Color;
  } | null {
    if (particleIndex < 0 || particleIndex >= this.totalParticles) {
      return null;
    }
    const currentIdx = this.particleToCurrent.get(particleIndex);
    if (currentIdx === undefined) {
      return null;
    }
    const current = this.currents[currentIdx];
    const data = current.getData();
    const particles = current.getParticles();
    const localIndex = particleIndex - currentIdx * PARTICLES_PER_CURRENT;
    const safeLocalIndex = Math.max(0, Math.min(particles.length - 1, localIndex));
    const particle = particles[safeLocalIndex];
    const color = current.getColorStart().clone().lerp(current.getColorEnd(), particle.t);
    return {
      currentName: data.definition.name,
      currentNameEn: data.definition.nameEn,
      t: particle.t,
      color,
    };
  }

  public getParticleCount(): number {
    return this.totalParticles;
  }

  public dispose(): void {
    if (this.scene && this.points) {
      this.scene.remove(this.points);
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.points = null;
    this.positionAttribute = null;
    this.colorAttribute = null;
    this.sizeAttribute = null;
    this.currents = [];
    this.particleToCurrent.clear();
    this.scene = null;
    useOceanCurrentsStore.getState().setInitialized(false);
  }
}

export { useOceanCurrentsStore, OCEAN_CURRENT_DEFINITIONS, EARTH_RADIUS, PARTICLE_HEIGHT };
export type { LatLon, OceanCurrentDefinition, OceanCurrentData };

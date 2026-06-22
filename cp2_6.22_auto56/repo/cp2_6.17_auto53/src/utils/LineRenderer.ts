import * as THREE from 'three';
import { Point3D, NeonColor } from '../store/useSculptureStore';

export const PARTICLE_COUNT_PER_LINE = 100;
export const PARTICLE_SIZE = 0.03;
export const PARTICLE_DELAY = 300;
export const PARTICLE_PERIOD = 2000;
export const LINE_RADIUS = 0.08;
export const EMISSIVE_INTENSITY = 0.8;
export const MAX_TOTAL_PARTICLES = 5000;

export interface LineParticleData {
  curve: THREE.CatmullRomCurve3;
  color: NeonColor;
  createdAt: number;
  startIndex: number;
  count: number;
}

export interface LineRenderResult {
  mesh: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
  particleData: LineParticleData;
  dispose: () => void;
}

export interface UnifiedParticleSystem {
  points: THREE.Points;
  addLine: (curve: THREE.CatmullRomCurve3, color: NeonColor, createdAt: number) => LineParticleData | null;
  removeLine: (data: LineParticleData) => void;
  update: (time: number) => void;
  dispose: () => void;
  setOpacity: (opacity: number) => void;
  setScale: (scale: number) => void;
  getTotalParticles: () => number;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 0, b: 0.5 };
};

const getEmissiveColor = (color: NeonColor): THREE.Color => {
  const rgb = hexToRgb(color);
  return new THREE.Color(
    Math.min(1, rgb.r * 2),
    Math.min(1, rgb.g * 2),
    Math.min(1, rgb.b * 2)
  );
};

export const createCurveFromPoints = (points: Point3D[]): THREE.CatmullRomCurve3 => {
  const threePoints = points.map(
    (p) => new THREE.Vector3(p.x, p.y, p.z)
  );
  return new THREE.CatmullRomCurve3(threePoints, false, 'catmullrom', 0.5);
};

class TaperedTubeGeometry extends THREE.BufferGeometry {
  private originalPositions: Float32Array | null = null;
  private originalNormals: Float32Array | null = null;
  private tubularSegments: number = 0;
  private radius: number = 0;

  constructor(
    curve: THREE.Curve<THREE.Vector3>,
    tubularSegments: number,
    radius: number,
    radialSegments: number
  ) {
    super();
    this.tubularSegments = tubularSegments;
    this.radius = radius;

    const frames = curve.computeFrenetFrames(tubularSegments, false);
    const normals = frames.normals;
    const binormals = frames.binormals;

    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];

    for (let i = 0; i <= tubularSegments; i++) {
      const t = i / tubularSegments;
      const P = curve.getPointAt(t);
      const N = normals[i];
      const B = binormals[i];

      let taperFactor: number;
      if (i === 0 || i === tubularSegments) {
        taperFactor = 0;
      } else {
        const normalizedT = t;
        if (normalizedT < 0.15) {
          taperFactor = normalizedT / 0.15;
        } else if (normalizedT > 0.85) {
          taperFactor = (1 - normalizedT) / 0.15;
        } else {
          taperFactor = 1;
        }
        taperFactor = Math.pow(taperFactor, 0.7);
      }

      const currentRadius = radius * taperFactor;

      for (let j = 0; j <= radialSegments; j++) {
        const v = (j / radialSegments) * Math.PI * 2;
        const sin = Math.sin(v);
        const cos = Math.cos(v);

        const cx = -cos * N.x + sin * B.x;
        const cy = -cos * N.y + sin * B.y;
        const cz = -cos * N.z + sin * B.z;

        positions.push(
          P.x + currentRadius * cx,
          P.y + currentRadius * cy,
          P.z + currentRadius * cz
        );

        uvs.push(i / tubularSegments, j / radialSegments);
      }
    }

    for (let i = 0; i < tubularSegments; i++) {
      for (let j = 0; j < radialSegments; j++) {
        const a = (radialSegments + 1) * i + j;
        const b = (radialSegments + 1) * (i + 1) + j;
        const c = (radialSegments + 1) * (i + 1) + j + 1;
        const d = (radialSegments + 1) * i + j + 1;

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.setIndex(indices);
    this.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.computeVertexNormals();

    this.originalPositions = new Float32Array(positions);
    this.originalNormals = new Float32Array(
      (this.getAttribute('normal') as THREE.BufferAttribute).array as Float32Array
    );
  }

  applyDissolve(progress: number): void {
    if (!this.originalPositions || !this.originalNormals) return;

    const posAttr = this.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const dissolveStart = 1 - progress;

    const radialSegments = 16;
    for (let i = 0; i <= this.tubularSegments; i++) {
      const segT = i / this.tubularSegments;
      const segProgress = segT > dissolveStart ? (segT - dissolveStart) / (1 - dissolveStart) : 0;
      const shrinkFactor = segT > dissolveStart ? 1 - segProgress : 1;

      for (let j = 0; j <= radialSegments; j++) {
        const idx = (i * (radialSegments + 1) + j) * 3;
        const centerIdx = Math.floor(i * (radialSegments + 1) + radialSegments / 2) * 3;
        
        const originalX = this.originalPositions[idx];
        const originalY = this.originalPositions[idx + 1];
        const originalZ = this.originalPositions[idx + 2];
        
        const centerX = this.originalPositions[centerIdx];
        const centerY = this.originalPositions[centerIdx + 1];
        const centerZ = this.originalPositions[centerIdx + 2];

        positions[idx] = centerX + (originalX - centerX) * shrinkFactor;
        positions[idx + 1] = centerY + (originalY - centerY) * shrinkFactor;
        positions[idx + 2] = centerZ + (originalZ - centerZ) * shrinkFactor;
      }
    }

    posAttr.needsUpdate = true;
    this.computeVertexNormals();
  }
}

export const createTubeLine = (
  points: Point3D[],
  color: NeonColor
): { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3 } => {
  const curve = createCurveFromPoints(points);
  const tubularSegments = Math.max(64, points.length * 4);
  const geometry = new TaperedTubeGeometry(
    curve,
    tubularSegments,
    LINE_RADIUS,
    16
  );

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    emissive: getEmissiveColor(color),
    emissiveIntensity: EMISSIVE_INTENSITY,
    metalness: 0.3,
    roughness: 0.2,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return { mesh, curve };
};

export const createUnifiedParticleSystem = (): UnifiedParticleSystem => {
  const maxParticles = MAX_TOTAL_PARTICLES;
  const positions = new Float32Array(maxParticles * 3);
  const colors = new Float32Array(maxParticles * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  });

  const points = new THREE.Points(particleGeometry, particleMaterial);
  
  const lineDataList: LineParticleData[] = [];
  let nextFreeIndex = 0;

  const findFreeSlot = (count: number): number | null => {
    if (nextFreeIndex + count <= maxParticles) {
      const start = nextFreeIndex;
      nextFreeIndex += count;
      return start;
    }
    
    for (let i = 0; i <= maxParticles - count; i++) {
      let isFree = true;
      for (const data of lineDataList) {
        if (i < data.startIndex + data.count && i + count > data.startIndex) {
          isFree = false;
          break;
        }
      }
      if (isFree) return i;
    }
    return null;
  };

  const addLine = (
    curve: THREE.CatmullRomCurve3,
    color: NeonColor,
    createdAt: number
  ): LineParticleData | null => {
    if (lineDataList.length * PARTICLE_COUNT_PER_LINE >= MAX_TOTAL_PARTICLES) {
      if (lineDataList.length > 0) {
        const oldest = lineDataList.shift();
        if (oldest) {
          for (let i = oldest.startIndex; i < oldest.startIndex + oldest.count; i++) {
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 0;
            colors[i * 3 + 2] = 0;
            positions[i * 3] = 0;
            positions[i * 3 + 1] = -9999;
            positions[i * 3 + 2] = 0;
          }
        }
      } else {
        return null;
      }
    }

    const startIndex = findFreeSlot(PARTICLE_COUNT_PER_LINE);
    if (startIndex === null) return null;

    const rgb = hexToRgb(color);
    for (let i = 0; i < PARTICLE_COUNT_PER_LINE; i++) {
      const idx = (startIndex + i) * 3;
      colors[idx] = rgb.r;
      colors[idx + 1] = rgb.g;
      colors[idx + 2] = rgb.b;
      
      const t = i / PARTICLE_COUNT_PER_LINE;
      const point = curve.getPointAt(t);
      positions[idx] = point.x;
      positions[idx + 1] = point.y;
      positions[idx + 2] = point.z;
    }

    (particleGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (particleGeometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;

    const data: LineParticleData = {
      curve,
      color,
      createdAt,
      startIndex,
      count: PARTICLE_COUNT_PER_LINE,
    };
    lineDataList.push(data);

    return data;
  };

  const removeLine = (data: LineParticleData): void => {
    const index = lineDataList.indexOf(data);
    if (index > -1) {
      lineDataList.splice(index, 1);
      for (let i = data.startIndex; i < data.startIndex + data.count; i++) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -9999;
        positions[i * 3 + 2] = 0;
      }
      (particleGeometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      (particleGeometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    }
  };

  const update = (time: number): void => {
    const posAttr = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (const data of lineDataList) {
      const elapsed = time - data.createdAt;
      if (elapsed < PARTICLE_DELAY) continue;

      const activeTime = elapsed - PARTICLE_DELAY;
      for (let i = 0; i < data.count; i++) {
        const offset = (i / data.count) * PARTICLE_PERIOD;
        let t = ((activeTime + offset) % PARTICLE_PERIOD) / PARTICLE_PERIOD;

        const point = data.curve.getPointAt(t);
        const idx = (data.startIndex + i) * 3;
        posArray[idx] = point.x;
        posArray[idx + 1] = point.y;
        posArray[idx + 2] = point.z;
      }
    }

    posAttr.needsUpdate = true;
  };

  const setOpacity = (opacity: number): void => {
    particleMaterial.opacity = opacity;
  };

  const setScale = (scale: number): void => {
    points.scale.setScalar(scale);
  };

  const getTotalParticles = (): number => {
    return lineDataList.length * PARTICLE_COUNT_PER_LINE;
  };

  const dispose = (): void => {
    particleGeometry.dispose();
    particleMaterial.dispose();
    lineDataList.length = 0;
  };

  return {
    points,
    addLine,
    removeLine,
    update,
    dispose,
    setOpacity,
    setScale,
    getTotalParticles,
  };
};

export const createLineRender = (
  points: Point3D[],
  color: NeonColor,
  createdAt: number,
  particleSystem: UnifiedParticleSystem
): LineRenderResult | null => {
  const { mesh, curve } = createTubeLine(points, color);
  
  const particleData = particleSystem.addLine(curve, color, createdAt);
  if (!particleData) {
    const tubeGeo = mesh.geometry as TaperedTubeGeometry;
    tubeGeo.dispose();
    (mesh.material as THREE.Material).dispose();
    return null;
  }

  const dispose = () => {
    const tubeGeo = mesh.geometry as TaperedTubeGeometry;
    tubeGeo.dispose();
    (mesh.material as THREE.Material).dispose();
    particleSystem.removeLine(particleData);
  };

  return { mesh, curve, particleData, dispose };
};

export { TaperedTubeGeometry };

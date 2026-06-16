import * as THREE from 'three';
import { Point3D, NeonColor } from '../store/useSculptureStore';

export const PARTICLE_COUNT = 100;
export const PARTICLE_SIZE = 0.03;
export const PARTICLE_DELAY = 300;
export const PARTICLE_PERIOD = 2000;
export const LINE_RADIUS = 0.08;
export const EMISSIVE_INTENSITY = 0.8;

export interface LineRenderResult {
  mesh: THREE.Mesh;
  particles: THREE.Points;
  curve: THREE.CatmullRomCurve3;
  dispose: () => void;
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
  constructor(
    curve: THREE.Curve<THREE.Vector3>,
    tubularSegments: number,
    radius: number,
    radialSegments: number
  ) {
    super();

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

      const taperFactor = i === 0 || i === tubularSegments
        ? 0
        : i < tubularSegments / 2
        ? (i / (tubularSegments / 2))
        : ((tubularSegments - i) / (tubularSegments / 2));

      const currentRadius = radius * Math.min(1, taperFactor * 1.5);

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
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return { mesh, curve };
};

export const createParticleSystem = (
  curve: THREE.CatmullRomCurve3,
  color: NeonColor,
  createdAt: number
): { 
  particles: THREE.Points; 
  update: (time: number) => void;
  particleGeometry: THREE.BufferGeometry;
  particleMaterial: THREE.PointsMaterial;
} => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: PARTICLE_SIZE,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);

  const update = (time: number) => {
    const elapsed = time - createdAt;
    if (elapsed < PARTICLE_DELAY) return;

    const activeTime = elapsed - PARTICLE_DELAY;
    const positionAttribute = particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = positionAttribute.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const offset = (i / PARTICLE_COUNT) * PARTICLE_PERIOD;
      let t = ((activeTime + offset) % PARTICLE_PERIOD) / PARTICLE_PERIOD;

      const point = curve.getPointAt(t);
      posArray[i * 3] = point.x;
      posArray[i * 3 + 1] = point.y;
      posArray[i * 3 + 2] = point.z;
    }

    positionAttribute.needsUpdate = true;
  };

  return { particles, update, particleGeometry, particleMaterial };
};

export const createLineRender = (
  points: Point3D[],
  color: NeonColor,
  createdAt: number
): LineRenderResult => {
  const { mesh, curve } = createTubeLine(points, color);
  const { particles, update, particleGeometry, particleMaterial } = createParticleSystem(curve, color, createdAt);

  let animationFrameId: number | null = null;
  let running = true;

  const animate = () => {
    if (!running) return;
    update(performance.now());
    animationFrameId = requestAnimationFrame(animate);
  };
  animate();

  const dispose = () => {
    running = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    const tubeGeo = mesh.geometry as TaperedTubeGeometry;
    tubeGeo.dispose();
    (mesh.material as THREE.Material).dispose();
    particleGeometry.dispose();
    particleMaterial.dispose();
  };

  return { mesh, particles, curve, dispose };
};

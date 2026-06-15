import * as THREE from 'three';

export function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
}

export function bezier3(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatTime(progress: number): string {
  const years = (1 - progress) * 2.0;
  if (years >= 1.0) {
    return `${years.toFixed(1)}亿年前`;
  } else {
    return `${(years * 100).toFixed(0)}万年前`;
  }
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function generateIrregularPolygon(
  center: THREE.Vector3,
  radius: number,
  segments: number,
  irregularity: number,
  seed: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const normal = center.clone().normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, up).normalize();
  if (tangent.length() < 0.1) {
    tangent.set(1, 0, 0);
  }
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const r = radius * (1 + (seededRandom(seed + i) - 0.5) * irregularity * 2);
    const dx = tangent.x * Math.cos(angle) * r + bitangent.x * Math.sin(angle) * r;
    const dy = tangent.y * Math.cos(angle) * r + bitangent.y * Math.sin(angle) * r;
    const dz = tangent.z * Math.cos(angle) * r + bitangent.z * Math.sin(angle) * r;
    points.push(new THREE.Vector3(center.x + dx, center.y + dy, center.z + dz));
  }

  return points;
}

export function createPlateGeometry(
  surfacePoints: THREE.Vector3[],
  earthRadius: number,
  elevation: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];

  const center = new THREE.Vector3();
  surfacePoints.forEach(p => center.add(p));
  center.divideScalar(surfacePoints.length);
  const centerNormal = center.clone().normalize();
  centerNormal.multiplyScalar(earthRadius + elevation);

  surfacePoints.forEach(p => {
    const n = p.clone().normalize();
    const elevated = n.multiplyScalar(earthRadius + elevation * 0.8);
    vertices.push(elevated.x, elevated.y, elevated.z);
    const up = p.clone().normalize();
    normals.push(up.x, up.y, up.z);
  });

  for (let i = 1; i < surfacePoints.length - 1; i++) {
    indices.push(0, i, i + 1);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createEdgeGeometry(
  surfacePoints: THREE.Vector3[],
  earthRadius: number,
  elevation: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];

  for (let i = 0; i <= surfacePoints.length; i++) {
    const p = surfacePoints[i % surfacePoints.length];
    const n = p.clone().normalize();
    const elevated = n.multiplyScalar(earthRadius + elevation * 0.8 + 0.03);
    vertices.push(elevated.x, elevated.y, elevated.z);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

export function createCrackLineGeometry(
  points1: THREE.Vector3[],
  points2: THREE.Vector3[],
  earthRadius: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];

  const addLine = (p1: THREE.Vector3, p2: THREE.Vector3) => {
    const n1 = p1.clone().normalize();
    const n2 = p2.clone().normalize();
    const v1 = n1.multiplyScalar(earthRadius + 0.02);
    const v2 = n2.multiplyScalar(earthRadius + 0.02);
    vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z);
  };

  const steps = Math.min(points1.length, points2.length);
  for (let i = 0; i < steps; i++) {
    addLine(points1[i], points2[(i + 1) % steps]);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  return geometry;
}

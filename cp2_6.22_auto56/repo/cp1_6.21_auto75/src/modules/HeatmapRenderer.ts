import * as THREE from 'three';
import { CityData } from './types';

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const COLOR_BLUE  = { r: 0.0,   g: 0.267, b: 1.0 };
const COLOR_PURPLE = { r: 0.533, g: 0.0,   b: 1.0 };
const COLOR_RED   = { r: 1.0,   g: 0.0,   b: 0.267 };

function densityToColor(density: number): [number, number, number] {
  const d = Math.max(0, Math.min(1, density));

  if (d <= 0.2) {
    return [COLOR_BLUE.r, COLOR_BLUE.g, COLOR_BLUE.b];
  }

  if (d <= 0.6) {
    const t = smoothstep(0.2, 0.6, d);
    return [
      lerp(COLOR_BLUE.r, COLOR_PURPLE.r, t),
      lerp(COLOR_BLUE.g, COLOR_PURPLE.g, t),
      lerp(COLOR_BLUE.b, COLOR_PURPLE.b, t),
    ];
  }

  const t = smoothstep(0.6, 1.0, d);
  return [
    lerp(COLOR_PURPLE.r, COLOR_RED.r, t),
    lerp(COLOR_PURPLE.g, COLOR_RED.g, t),
    lerp(COLOR_PURPLE.b, COLOR_RED.b, t),
  ];
}

function findBlockAtPosition(
  x: number,
  z: number,
  cityData: CityData
): string | null {
  const { blockSize, streetWidth, gridWidth, gridDepth } = cityData;
  const stride = blockSize + streetWidth;

  const gx = Math.floor((x + streetWidth / 2) / stride);
  const gz = Math.floor((z + streetWidth / 2) / stride);

  if (gx < 0 || gx >= gridWidth || gz < 0 || gz >= gridDepth) {
    return null;
  }

  const blockX = gx * stride;
  const blockZ = gz * stride;

  if (x >= blockX && x < blockX + blockSize && z >= blockZ && z < blockZ + blockSize) {
    return `block_${gx}_${gz}`;
  }

  return null;
}

export function createHeatmapMesh(cityData: CityData, resolution = 40): THREE.Mesh {
  const { gridWidth, gridDepth, blockSize, streetWidth } = cityData;
  const stride = blockSize + streetWidth;

  const cityWidth = gridWidth * stride;
  const cityDepth = gridDepth * stride;

  const geometry = new THREE.PlaneGeometry(cityWidth, cityDepth, resolution, resolution);
  geometry.rotateX(-Math.PI / 2);

  const vertexCount = geometry.attributes.position.count;
  const colors = new Float32Array(vertexCount * 3);
  for (let i = 0; i < vertexCount; i++) {
    colors[i * 3]     = COLOR_BLUE.r;
    colors[i * 3 + 1] = COLOR_BLUE.g;
    colors[i * 3 + 2] = COLOR_BLUE.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(cityWidth / 2, 2, cityDepth / 2);

  return mesh;
}

export function updateHeatmapColors(
  mesh: THREE.Mesh,
  densityMap: Map<string, number>,
  cityData: CityData
): void {
  const geometry = mesh.geometry as THREE.BufferGeometry;
  const positionAttr = geometry.attributes.position;
  const colorAttr = geometry.attributes.color;

  for (let i = 0; i < positionAttr.count; i++) {
    const vx = positionAttr.getX(i) + mesh.position.x;
    const vz = positionAttr.getZ(i) + mesh.position.z;

    const blockId = findBlockAtPosition(vx, vz, cityData);
    const density = blockId !== null ? (densityMap.get(blockId) ?? 0) : 0;

    const [r, g, b] = densityToColor(density);
    colorAttr.setXYZ(i, r, g, b);
  }

  colorAttr.needsUpdate = true;
}

import * as THREE from 'three';

export interface TerrainData {
  width: number;
  depth: number;
  resolution: number;
  heights: number[][];
}

export function buildTerrainGeometry(data: TerrainData): THREE.BufferGeometry {
  const { width, depth, resolution, heights } = data;
  const segX = resolution;
  const segZ = resolution;
  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const col = i % (segX + 1);
    const row = Math.floor(i / (segX + 1));
    if (row < heights.length && col < heights[row].length) {
      pos.setY(i, heights[row][col]);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const maxH = 12;
    const t = Math.min(y / maxH, 1);
    const r = 0.08 + t * 0.25;
    const g = 0.35 + t * 0.3;
    const b = 0.06 + t * 0.08;
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return geo;
}

export function getHeightAt(
  x: number,
  z: number,
  data: TerrainData
): number {
  const { width, depth, resolution, heights } = data;
  const halfW = width / 2;
  const halfD = depth / 2;

  const u = (x + halfW) / width;
  const v = (z + halfD) / depth;

  const fi = v * resolution;
  const fj = u * resolution;

  const i0 = Math.max(0, Math.min(Math.floor(fi), resolution));
  const j0 = Math.max(0, Math.min(Math.floor(fj), resolution));
  const i1 = Math.min(i0 + 1, resolution);
  const j1 = Math.min(j0 + 1, resolution);

  const ti = fi - Math.floor(fi);
  const tj = fj - Math.floor(fj);

  const h00 = (heights[i0] && heights[i0][j0]) ?? 0;
  const h10 = (heights[i1] && heights[i1][j0]) ?? 0;
  const h01 = (heights[i0] && heights[i0][j1]) ?? 0;
  const h11 = (heights[i1] && heights[i1][j1]) ?? 0;

  const h0 = h00 * (1 - tj) + h01 * tj;
  const h1 = h10 * (1 - tj) + h11 * tj;

  return h0 * (1 - ti) + h1 * ti;
}

export function getTerrainNormalAt(
  x: number,
  z: number,
  data: TerrainData
): THREE.Vector3 {
  const eps = 0.5;
  const hC = getHeightAt(x, z, data);
  const hR = getHeightAt(x + eps, z, data);
  const hF = getHeightAt(x, z + eps, data);
  const n = new THREE.Vector3(hC - hR, eps, hC - hF);
  n.normalize();
  return n;
}

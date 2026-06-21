import * as THREE from 'three';
import * as d3 from 'd3';

export interface LayerData {
  id: string;
  name: string;
  color: string;
  depthTop: number;
  depthBottom: number;
  thickness: number;
  density: number;
  baseY: number;
  opacity: number;
}

interface LayerEntry {
  data: LayerData;
  mesh: THREE.Mesh;
  edges: THREE.LineSegments | null;
}

const layersMap = new Map<string, LayerEntry>();

const LAYER_PRESETS: Omit<LayerData, 'opacity'>[] = [
  {
    id: 'sandstone',
    name: '砂岩',
    color: '#e8b86a',
    depthTop: 0,
    depthBottom: 3.5,
    thickness: 3.5,
    density: 2.35,
    baseY: 3.25,
  },
  {
    id: 'shale',
    name: '页岩',
    color: '#7a9a7a',
    depthTop: 3.5,
    depthBottom: 7.0,
    thickness: 3.5,
    density: 2.65,
    baseY: -0.25,
  },
  {
    id: 'limestone',
    name: '石灰岩',
    color: '#8ab8e0',
    depthTop: 7.0,
    depthBottom: 10.0,
    thickness: 3.0,
    density: 2.71,
    baseY: -3.5,
  },
];

function waveHeight(x: number, z: number, phase: number): number {
  const amplitude = 0.3;
  const frequency = 0.6;
  return (
    Math.sin(x * frequency + phase) * Math.cos(z * frequency + phase * 0.7) * amplitude
  );
}

function createLayerMesh(preset: Omit<LayerData, 'opacity'>, phase: number): THREE.Mesh {
  const width = 20;
  const depth = 20;
  const thickness = preset.thickness;
  const baseY = preset.baseY;

  const topGeo = new THREE.PlaneGeometry(width, depth, 64, 64);
  topGeo.rotateX(-Math.PI / 2);
  const topPos = topGeo.attributes.position;
  for (let i = 0; i < topPos.count; i++) {
    const x = topPos.getX(i);
    const z = topPos.getZ(i);
    const y = topPos.getY(i);
    topPos.setY(i, y + waveHeight(x, z, phase) + thickness / 2);
  }
  topGeo.computeVertexNormals();

  const bottomGeo = new THREE.PlaneGeometry(width, depth, 64, 64);
  bottomGeo.rotateX(-Math.PI / 2);
  const bottomPos = bottomGeo.attributes.position;
  for (let i = 0; i < bottomPos.count; i++) {
    const x = bottomPos.getX(i);
    const z = bottomPos.getZ(i);
    const y = bottomPos.getY(i);
    bottomPos.setY(i, y + waveHeight(x, z, phase + 1.5) - thickness / 2);
  }
  bottomGeo.computeVertexNormals();

  const mergedGeo = mergeWavyVolumes(topGeo, bottomGeo, width, depth);

  const colorScale = d3.color(preset.color);
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.color),
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    roughness: 0.7,
    metalness: 0.05,
    transmission: 0.1,
    thickness: 1,
    clearcoat: 0.2,
  });

  const mesh = new THREE.Mesh(mergedGeo, material);
  mesh.position.y = baseY;
  mesh.userData.layerId = preset.id;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function mergeWavyVolumes(
  topGeo: THREE.PlaneGeometry,
  bottomGeo: THREE.PlaneGeometry,
  width: number,
  depth: number
): THREE.BufferGeometry {
  const topPos = topGeo.attributes.position;
  const bottomPos = bottomGeo.attributes.position;
  const topIdx = topGeo.index!;
  const bottomIdx = bottomGeo.index!;

  const vertexCount = topPos.count * 2;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);

  for (let i = 0; i < topPos.count; i++) {
    positions[i * 6] = topPos.getX(i);
    positions[i * 6 + 1] = topPos.getY(i);
    positions[i * 6 + 2] = topPos.getZ(i);

    positions[i * 6 + 3] = bottomPos.getX(i);
    positions[i * 6 + 4] = bottomPos.getY(i);
    positions[i * 6 + 5] = bottomPos.getZ(i);

    uvs[i * 4] = (topPos.getX(i) + width / 2) / width;
    uvs[i * 4 + 1] = (topPos.getZ(i) + depth / 2) / depth;
    uvs[i * 4 + 2] = (bottomPos.getX(i) + width / 2) / width;
    uvs[i * 4 + 3] = (bottomPos.getZ(i) + depth / 2) / depth;
  }

  const indices: number[] = [];

  for (let i = 0; i < topIdx.count; i += 3) {
    indices.push(topIdx.getX(i) * 2, topIdx.getX(i + 1) * 2, topIdx.getX(i + 2) * 2);
  }

  for (let i = 0; i < bottomIdx.count; i += 3) {
    indices.push(
      bottomIdx.getX(i) * 2 + 1,
      bottomIdx.getX(i + 2) * 2 + 1,
      bottomIdx.getX(i + 1) * 2 + 1
    );
  }

  const segW = 64;
  const segD = 64;

  for (let i = 0; i < segW; i++) {
    const a = i * 2;
    const b = (i + 1) * 2;
    const c = i * 2 + 1;
    const d = (i + 1) * 2 + 1;
    indices.push(a, c, b, b, c, d);

    const row = (segD + 1) * segW;
    const a2 = (row + i) * 2;
    const b2 = (row + i + 1) * 2;
    const c2 = (row + i) * 2 + 1;
    const d2 = (row + i + 1) * 2 + 1;
    indices.push(a2, b2, c2, b2, d2, c2);
  }

  for (let j = 0; j < segD; j++) {
    const rowIdx = j * (segW + 1);
    const a = rowIdx * 2;
    const b = (rowIdx + segW + 1) * 2;
    const c = rowIdx * 2 + 1;
    const d = (rowIdx + segW + 1) * 2 + 1;
    indices.push(a, b, c, b, d, c);

    const rightCol = rowIdx + segW;
    const a3 = rightCol * 2;
    const b3 = (rightCol + segW + 1) * 2;
    const c3 = rightCol * 2 + 1;
    const d3 = (rightCol + segW + 1) * 2 + 1;
    indices.push(a3, c3, b3, b3, c3, d3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function generateLayers(scene: THREE.Scene): LayerData[] {
  layersMap.clear();
  const result: LayerData[] = [];

  LAYER_PRESETS.forEach((preset, index) => {
    const mesh = createLayerMesh(preset, index * 0.8);
    scene.add(mesh);

    const data: LayerData = {
      ...preset,
      opacity: 0.75,
    };

    layersMap.set(preset.id, { data, mesh, edges: null });
    result.push(data);
  });

  return result;
}

export function updateLayerOpacity(layerId: string, opacity: number): void {
  const entry = layersMap.get(layerId);
  if (!entry) return;

  const clamped = Math.max(0.05, Math.min(1, opacity));
  const mat = entry.mesh.material as THREE.MeshPhysicalMaterial;
  mat.opacity = clamped;
  mat.transmission = (1 - clamped) * 0.15;
  entry.data.opacity = clamped;
}

export function getLayers(): Map<string, LayerEntry> {
  return layersMap;
}

export function getWaveAtPoint(x: number, z: number): { [layerId: string]: number } {
  const result: { [layerId: string]: number } = {};
  LAYER_PRESETS.forEach((preset, index) => {
    const phase = index * 0.8;
    const topY = preset.baseY + preset.thickness / 2 + waveHeight(x, z, phase);
    result[preset.id] = topY;
  });
  return result;
}

export function getLayerBoundaryDepths(x: number, z: number): { depth: number; name: string }[] {
  const boundaries: { depth: number; name: string }[] = [];
  LAYER_PRESETS.forEach((preset, index) => {
    const phase = index * 0.8;
    const worldY = preset.baseY + preset.thickness / 2 + waveHeight(x, z, phase);
    const depth = 5 - worldY;
    boundaries.push({ depth: Math.max(0, Math.min(10, depth)), name: preset.name });
  });
  return boundaries.sort((a, b) => a.depth - b.depth);
}

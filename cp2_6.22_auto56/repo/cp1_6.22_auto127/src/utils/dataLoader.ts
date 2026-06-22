export interface GridPoint {
  id: number;
  lat: number;
  lng: number;
  height: number;
  densities: number[];
  region: string;
}

export interface TerrainData {
  gridSize: number;
  points: GridPoint[];
  minDensity: number;
  maxDensity: number;
  minHeight: number;
  maxHeight: number;
  yearRange: [number, number];
}

export interface TerrainGeometryData {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  normals: Float32Array;
  uvs: Float32Array;
  pointCount: number;
}

import { getColorRGB } from './colorScale';

export function processTerrainData(data: TerrainData): TerrainGeometryData {
  const { gridSize, points } = data;
  const vertexCount = points.length;
  
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  
  const halfSize = (gridSize - 1) / 2;
  
  for (let i = 0; i < vertexCount; i++) {
    const point = points[i];
    const xi = i % gridSize;
    const zi = Math.floor(i / gridSize);
    const x = xi - halfSize;
    const z = zi - halfSize;
    const y = point.height;
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    uvs[i * 2] = xi / (gridSize - 1);
    uvs[i * 2 + 1] = zi / (gridSize - 1);
  }
  
  calculateNormals(positions, gridSize, normals);
  
  const indices = generateIndices(gridSize);
  
  return {
    positions,
    colors,
    indices,
    normals,
    uvs,
    pointCount: vertexCount
  };
}

function calculateNormals(positions: Float32Array, gridSize: number, normals: Float32Array): void {
  for (let z = 0; z < gridSize; z++) {
    for (let x = 0; x < gridSize; x++) {
      const idx = z * gridSize + x;
      
      const hL = x > 0 ? positions[((z * gridSize + x - 1) * 3) + 1] : positions[(idx * 3) + 1];
      const hR = x < gridSize - 1 ? positions[((z * gridSize + x + 1) * 3) + 1] : positions[(idx * 3) + 1];
      const hD = z > 0 ? positions[(((z - 1) * gridSize + x) * 3) + 1] : positions[(idx * 3) + 1];
      const hU = z < gridSize - 1 ? positions[(((z + 1) * gridSize + x) * 3) + 1] : positions[(idx * 3) + 1];
      
      const nx = hL - hR;
      const ny = 2.0;
      const nz = hD - hU;
      
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      normals[idx * 3] = nx / len;
      normals[idx * 3 + 1] = ny / len;
      normals[idx * 3 + 2] = nz / len;
    }
  }
}

function generateIndices(gridSize: number): Uint32Array {
  const indices: number[] = [];
  
  for (let z = 0; z < gridSize - 1; z++) {
    for (let x = 0; x < gridSize - 1; x++) {
      const topLeft = z * gridSize + x;
      const topRight = topLeft + 1;
      const bottomLeft = (z + 1) * gridSize + x;
      const bottomRight = bottomLeft + 1;
      
      indices.push(topLeft, bottomLeft, topRight);
      indices.push(topRight, bottomLeft, bottomRight);
    }
  }
  
  return new Uint32Array(indices);
}

export function updateColorsByYear(
  terrainData: TerrainData,
  geometryData: TerrainGeometryData,
  yearIndex: number
): Float32Array {
  const colors = new Float32Array(geometryData.colors.length);
  const { minDensity, maxDensity, points } = terrainData;
  
  for (let i = 0; i < points.length; i++) {
    const density = points[i].densities[yearIndex];
    const [r, g, b] = getColorRGB(density, minDensity, maxDensity);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  
  return colors;
}

export function interpolateColors(
  colors1: Float32Array,
  colors2: Float32Array,
  t: number
): Float32Array {
  const result = new Float32Array(colors1.length);
  for (let i = 0; i < colors1.length; i++) {
    result[i] = colors1[i] + (colors2[i] - colors1[i]) * t;
  }
  return result;
}

export function getGridIndexFromPosition(
  x: number,
  z: number,
  gridSize: number
): number | null {
  const halfSize = (gridSize - 1) / 2;
  const gridX = Math.round(x + halfSize);
  const gridZ = Math.round(z + halfSize);
  
  if (gridX >= 0 && gridX < gridSize && gridZ >= 0 && gridZ < gridSize) {
    return gridZ * gridSize + gridX;
  }
  return null;
}

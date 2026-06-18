function simpleNoise3D(x: number, y: number, z: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 45.164) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const v000 = simpleNoise3D(ix, iy, iz);
  const v100 = simpleNoise3D(ix + 1, iy, iz);
  const v010 = simpleNoise3D(ix, iy + 1, iz);
  const v110 = simpleNoise3D(ix + 1, iy + 1, iz);
  const v001 = simpleNoise3D(ix, iy, iz + 1);
  const v101 = simpleNoise3D(ix + 1, iy, iz + 1);
  const v011 = simpleNoise3D(ix, iy + 1, iz + 1);
  const v111 = simpleNoise3D(ix + 1, iy + 1, iz + 1);

  const x00 = v000 + ux * (v100 - v000);
  const x10 = v010 + ux * (v110 - v010);
  const x01 = v001 + ux * (v101 - v001);
  const x11 = v011 + ux * (v111 - v011);

  const y0 = x00 + uy * (x10 - x00);
  const y1 = x01 + uy * (x11 - x01);

  return y0 + uz * (y1 - y0);
}

class DeformationEngine {
  vertices: Float32Array;
  originalVertices: Float32Array;
  adjacency: Map<number, Set<number>>;
  laplacianCoords: Float32Array;
  smoothness: number = 0.8;

  constructor(originalVertices: Float32Array, indices: Uint16Array | Uint32Array) {
    this.originalVertices = new Float32Array(originalVertices);
    this.vertices = new Float32Array(originalVertices);
    this.adjacency = new Map();
    this.laplacianCoords = new Float32Array(originalVertices.length);
    this.buildAdjacency(indices);
    this.computeLaplacianCoords();
  }

  buildAdjacency(indices: Uint16Array | Uint32Array): void {
    this.adjacency.clear();
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];
      if (!this.adjacency.has(a)) this.adjacency.set(a, new Set());
      if (!this.adjacency.has(b)) this.adjacency.set(b, new Set());
      if (!this.adjacency.has(c)) this.adjacency.set(c, new Set());
      this.adjacency.get(a)!.add(b);
      this.adjacency.get(a)!.add(c);
      this.adjacency.get(b)!.add(a);
      this.adjacency.get(b)!.add(c);
      this.adjacency.get(c)!.add(a);
      this.adjacency.get(c)!.add(b);
    }
  }

  computeLaplacianCoords(): void {
    const vertexCount = this.originalVertices.length / 3;
    for (let i = 0; i < vertexCount; i++) {
      const neighbors = this.adjacency.get(i);
      if (!neighbors || neighbors.size === 0) {
        this.laplacianCoords[i * 3] = 0;
        this.laplacianCoords[i * 3 + 1] = 0;
        this.laplacianCoords[i * 3 + 2] = 0;
        continue;
      }
      let avgX = 0;
      let avgY = 0;
      let avgZ = 0;
      const n = neighbors.size;
      for (const j of neighbors) {
        avgX += this.originalVertices[j * 3];
        avgY += this.originalVertices[j * 3 + 1];
        avgZ += this.originalVertices[j * 3 + 2];
      }
      avgX /= n;
      avgY /= n;
      avgZ /= n;
      this.laplacianCoords[i * 3] = this.originalVertices[i * 3] - avgX;
      this.laplacianCoords[i * 3 + 1] = this.originalVertices[i * 3 + 1] - avgY;
      this.laplacianCoords[i * 3 + 2] = this.originalVertices[i * 3 + 2] - avgZ;
    }
  }

  applyControlPointDeformation(
    controlPointIndex: number,
    displacement: number,
    normal: [number, number, number]
  ): Float32Array {
    const vertexCount = this.vertices.length / 3;
    const propagatedDisplacement = new Float32Array(vertexCount);

    propagatedDisplacement[controlPointIndex] = 1.0;

    for (let iter = 0; iter < 3; iter++) {
      const next = new Float32Array(vertexCount);
      for (let i = 0; i < vertexCount; i++) {
        const neighbors = this.adjacency.get(i);
        if (!neighbors || neighbors.size === 0) continue;
        let sum = 0;
        for (const j of neighbors) {
          sum += propagatedDisplacement[j];
        }
        next[i] = propagatedDisplacement[i] * 0.5 + (sum / neighbors.size) * 0.5;
      }
      for (let i = 0; i < vertexCount; i++) {
        propagatedDisplacement[i] = next[i];
      }
    }

    for (let i = 0; i < vertexCount; i++) {
      const ox = this.originalVertices[i * 3];
      const oy = this.originalVertices[i * 3 + 1];
      const oz = this.originalVertices[i * 3 + 2];
      const lx = this.laplacianCoords[i * 3];
      const ly = this.laplacianCoords[i * 3 + 1];
      const lz = this.laplacianCoords[i * 3 + 2];
      const dispX = normal[0] * displacement * propagatedDisplacement[i];
      const dispY = normal[1] * displacement * propagatedDisplacement[i];
      const dispZ = normal[2] * displacement * propagatedDisplacement[i];
      const s = this.smoothness;
      this.vertices[i * 3] = ox + lx * (1 - s) + dispX * s;
      this.vertices[i * 3 + 1] = oy + ly * (1 - s) + dispY * s;
      this.vertices[i * 3 + 2] = oz + lz * (1 - s) + dispZ * s;
    }

    return this.vertices;
  }

  applyNoise(intensity: number, frequency: number = 2.0): Float32Array {
    const vertexCount = this.vertices.length / 3;
    for (let i = 0; i < vertexCount; i++) {
      const x = this.vertices[i * 3];
      const y = this.vertices[i * 3 + 1];
      const z = this.vertices[i * 3 + 2];
      const nx = smoothNoise(x * frequency, y * frequency, z * frequency);
      const ny = smoothNoise(x * frequency + 31.416, y * frequency + 47.853, z * frequency + 62.139);
      const nz = smoothNoise(x * frequency + 93.217, y * frequency + 18.462, z * frequency + 57.329);
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      let dirX: number, dirY: number, dirZ: number;
      if (len > 1e-6) {
        dirX = nx / len;
        dirY = ny / len;
        dirZ = nz / len;
      } else {
        const posLen = Math.sqrt(x * x + y * y + z * z);
        if (posLen > 1e-6) {
          dirX = x / posLen;
          dirY = y / posLen;
          dirZ = z / posLen;
        } else {
          dirX = 0;
          dirY = 1;
          dirZ = 0;
        }
      }
      const noiseVal = (nx * 2 - 1) * intensity;
      this.vertices[i * 3] += dirX * noiseVal;
      this.vertices[i * 3 + 1] += dirY * noiseVal;
      this.vertices[i * 3 + 2] += dirZ * noiseVal;
    }
    return this.vertices;
  }

  applySmooth(iterations: number = 3, factor: number = 0.5): Float32Array {
    const vertexCount = this.vertices.length / 3;
    for (let iter = 0; iter < iterations; iter++) {
      const temp = new Float32Array(this.vertices.length);
      for (let i = 0; i < vertexCount; i++) {
        const neighbors = this.adjacency.get(i);
        if (!neighbors || neighbors.size === 0) {
          temp[i * 3] = this.vertices[i * 3];
          temp[i * 3 + 1] = this.vertices[i * 3 + 1];
          temp[i * 3 + 2] = this.vertices[i * 3 + 2];
          continue;
        }
        let avgX = 0;
        let avgY = 0;
        let avgZ = 0;
        const n = neighbors.size;
        for (const j of neighbors) {
          avgX += this.vertices[j * 3];
          avgY += this.vertices[j * 3 + 1];
          avgZ += this.vertices[j * 3 + 2];
        }
        avgX /= n;
        avgY /= n;
        avgZ /= n;
        temp[i * 3] = this.vertices[i * 3] + (avgX - this.vertices[i * 3]) * factor;
        temp[i * 3 + 1] = this.vertices[i * 3 + 1] + (avgY - this.vertices[i * 3 + 1]) * factor;
        temp[i * 3 + 2] = this.vertices[i * 3 + 2] + (avgZ - this.vertices[i * 3 + 2]) * factor;
      }
      this.vertices.set(temp);
    }
    return this.vertices;
  }

  applyAll(params: {
    noiseIntensity: number;
    smoothness: number;
    controlPoints?: Array<{
      vertexIndex: number;
      displacement: number;
      normal: [number, number, number];
    }>;
  }): Float32Array {
    this.vertices.set(this.originalVertices);
    this.smoothness = params.smoothness;
    if (params.controlPoints) {
      for (const cp of params.controlPoints) {
        this.applyControlPointDeformation(cp.vertexIndex, cp.displacement, cp.normal);
      }
    }
    this.applyNoise(params.noiseIntensity);
    this.applySmooth();
    return this.vertices;
  }

  reset(): void {
    this.vertices.set(this.originalVertices);
  }

  updateOriginalVertices(vertices: Float32Array): void {
    this.originalVertices = new Float32Array(vertices);
    this.vertices = new Float32Array(vertices);
    this.computeLaplacianCoords();
  }
}

export default DeformationEngine;

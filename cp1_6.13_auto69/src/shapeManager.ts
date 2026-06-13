import * as THREE from 'three';

export type ShapeName = 'sphere' | 'cube' | 'torus' | 'octahedron';

interface ShapeData {
  positions: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
  vertexCount: number;
}

export class ShapeManager {
  private shapes: Map<ShapeName, ShapeData> = new Map();
  private unifiedVertexCount: number = 0;
  private targetVertexCount: number = 500;

  constructor() {
    this.initShapes();
  }

  private initShapes(): void {
    const sphereGeom = new THREE.SphereGeometry(1.2, 24, 20);
    const cubeGeom = new THREE.BoxGeometry(1.8, 1.8, 1.8, 10, 10, 10);
    const torusGeom = new THREE.TorusGeometry(1, 0.4, 16, 40);
    const octaGeom = new THREE.OctahedronGeometry(1.4, 6);

    const sphereData = this.extractGeometryData(sphereGeom);
    const cubeData = this.extractGeometryData(cubeGeom);
    const torusData = this.extractGeometryData(torusGeom);
    const octaData = this.extractGeometryData(octaGeom);

    this.unifiedVertexCount = Math.min(
      sphereData.vertexCount,
      cubeData.vertexCount,
      torusData.vertexCount,
      octaData.vertexCount
    );

    this.unifiedVertexCount = Math.max(this.unifiedVertexCount, this.targetVertexCount);

    this.shapes.set('sphere', this.normalizeShapeData(sphereData));
    this.shapes.set('cube', this.normalizeShapeData(cubeData));
    this.shapes.set('torus', this.normalizeShapeData(torusData));
    this.shapes.set('octahedron', this.normalizeShapeData(octaData));

    sphereGeom.dispose();
    cubeGeom.dispose();
    torusGeom.dispose();
    octaGeom.dispose();
  }

  private extractGeometryData(geometry: THREE.BufferGeometry): ShapeData {
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = new Float32Array(posAttr.array);
    const vertexCount = posAttr.count;

    const colors = new Float32Array(vertexCount * 3);
    this.computeColors(positions, colors, vertexCount);

    const indexAttr = geometry.getIndex();
    let indices: Uint32Array;
    if (indexAttr) {
      indices = new Uint32Array(indexAttr.array);
    } else {
      indices = new Uint32Array(vertexCount);
      for (let i = 0; i < vertexCount; i++) {
        indices[i] = i;
      }
    }

    return { positions, colors, indices, vertexCount };
  }

  private computeColors(positions: Float32Array, colors: Float32Array, count: number): void {
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    const range = maxY - minY || 1;

    for (let i = 0; i < count; i++) {
      const y = positions[i * 3 + 1];
      const t = (y - minY) / range;
      
      colors[i * 3] = t;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 1 - t;
    }
  }

  private normalizeShapeData(data: ShapeData): ShapeData {
    const positions = new Float32Array(this.unifiedVertexCount * 3);
    const colors = new Float32Array(this.unifiedVertexCount * 3);
    const indices = new Uint32Array(this.unifiedVertexCount);

    const srcCount = data.vertexCount;
    const dstCount = this.unifiedVertexCount;

    for (let i = 0; i < dstCount; i++) {
      const srcIdx = Math.min(Math.floor((i / dstCount) * srcCount), srcCount - 1);
      
      positions[i * 3] = data.positions[srcIdx * 3];
      positions[i * 3 + 1] = data.positions[srcIdx * 3 + 1];
      positions[i * 3 + 2] = data.positions[srcIdx * 3 + 2];
      
      colors[i * 3] = data.colors[srcIdx * 3];
      colors[i * 3 + 1] = data.colors[srcIdx * 3 + 1];
      colors[i * 3 + 2] = data.colors[srcIdx * 3 + 2];
      
      indices[i] = i;
    }

    return { positions, colors, indices, vertexCount: dstCount };
  }

  getShapeVertices(shapeName: ShapeName): Float32Array {
    const shape = this.shapes.get(shapeName);
    if (!shape) {
      throw new Error(`Shape "${shapeName}" not found`);
    }
    return shape.positions;
  }

  getShapeColors(shapeName: ShapeName): Float32Array {
    const shape = this.shapes.get(shapeName);
    if (!shape) {
      throw new Error(`Shape "${shapeName}" not found`);
    }
    return shape.colors;
  }

  getShapeIndex(shapeName: ShapeName): Uint32Array {
    const shape = this.shapes.get(shapeName);
    if (!shape) {
      throw new Error(`Shape "${shapeName}" not found`);
    }
    return shape.indices;
  }

  getVertexCount(): number {
    return this.unifiedVertexCount;
  }

  getShapeNames(): ShapeName[] {
    return Array.from(this.shapes.keys()) as ShapeName[];
  }
}

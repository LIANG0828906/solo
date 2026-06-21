import { IcosahedronGeometry, Vector3, BufferAttribute, MathUtils } from 'three';

export class TerrainEditor {
  private geometry: IcosahedronGeometry;
  private basePositions: Float32Array;
  private radiusMin = 8;
  private radiusMax = 12;
  private selectedVertices: Set<number> = new Set();

  constructor(detail: number = 4) {
    this.geometry = new IcosahedronGeometry(10, detail);
    this.basePositions = new Float32Array(this.geometry.attributes.position.array);
    this.generateCaveSurface();
    this.geometry.computeVertexNormals();
    this.flipNormals();
    this.initVertexColors();
  }

  private generateCaveSurface(): void {
    const pos = this.geometry.attributes.position as BufferAttribute;
    const arr = pos.array as Float32Array;
    const vertex = new Vector3();

    for (let i = 0; i < arr.length; i += 3) {
      vertex.set(arr[i], arr[i + 1], arr[i + 2]);
      const dir = vertex.clone().normalize();
      const baseRadius = this.radiusMin + Math.random() * (this.radiusMax - this.radiusMin);
      const noise = 1 + (Math.random() - 0.5) * 0.4;
      vertex.copy(dir).multiplyScalar(baseRadius * noise);
      arr[i] = vertex.x;
      arr[i + 1] = vertex.y;
      arr[i + 2] = vertex.z;
    }

    this.basePositions = new Float32Array(arr);
    pos.needsUpdate = true;
  }

  private flipNormals(): void {
    const normalAttr = this.geometry.attributes.normal as BufferAttribute;
    const normals = normalAttr.array as Float32Array;
    for (let i = 0; i < normals.length; i++) {
      normals[i] = -normals[i];
    }
    normalAttr.needsUpdate = true;
  }

  private initVertexColors(): void {
    const count = this.geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = 0.353;
      colors[i * 3 + 1] = 0.290;
      colors[i * 3 + 2] = 0.227;
    }
    this.geometry.setAttribute('color', new BufferAttribute(colors, 3));
  }

  getGeometry(): IcosahedronGeometry {
    return this.geometry;
  }

  getVertexPosition(index: number): Vector3 {
    const pos = this.geometry.attributes.position as BufferAttribute;
    return new Vector3(pos.getX(index), pos.getY(index), pos.getZ(index));
  }

  getVertexNormal(index: number): Vector3 {
    const normalAttr = this.geometry.attributes.normal as BufferAttribute;
    return new Vector3(normalAttr.getX(index), normalAttr.getY(index), normalAttr.getZ(index));
  }

  getVertexCount(): number {
    return this.geometry.attributes.position.count;
  }

  selectVertex(index: number, multi: boolean = false): void {
    if (!multi) this.selectedVertices.clear();
    this.selectedVertices.add(index);
  }

  deselectAll(): void {
    this.selectedVertices.clear();
  }

  getSelectedVertices(): Set<number> {
    return this.selectedVertices;
  }

  moveVertex(index: number, offset: Vector3): void {
    const pos = this.geometry.attributes.position as BufferAttribute;
    pos.setX(index, pos.getX(index) + offset.x);
    pos.setY(index, pos.getY(index) + offset.y);
    pos.setZ(index, pos.getZ(index) + offset.z);
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.flipNormals();
  }

  moveSelectedVertices(offset: Vector3): void {
    for (const idx of this.selectedVertices) {
      this.moveVertex(idx, offset);
    }
  }

  findNearestVertex(point: Vector3, maxDist: number = 1.0): number {
    const pos = this.geometry.attributes.position as BufferAttribute;
    let nearest = -1;
    let minDist = maxDist * maxDist;
    const v = new Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      const d = v.distanceToSquared(point);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    return nearest;
  }

  findVerticesInRadius(point: Vector3, radius: number): number[] {
    const pos = this.geometry.attributes.position as BufferAttribute;
    const result: number[] = [];
    const v = new Vector3();
    const r2 = radius * radius;

    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
      if (v.distanceToSquared(point) < r2) {
        result.push(i);
      }
    }
    return result;
  }

  serializeCaveData(): Float32Array {
    return new Float32Array(this.geometry.attributes.position.array);
  }

  applyCaveData(data: Float32Array): void {
    const pos = this.geometry.attributes.position as BufferAttribute;
    pos.array.set(data);
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.flipNormals();
  }

  reset(): void {
    const pos = this.geometry.attributes.position as BufferAttribute;
    pos.array.set(this.basePositions);
    pos.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.flipNormals();
    this.initVertexColors();
    const colorAttr = this.geometry.attributes.color as BufferAttribute;
    colorAttr.needsUpdate = true;
  }
}

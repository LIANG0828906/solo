import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { GeometryType, GeometryData, GeometryObject } from './GeometryFactory';
import {
  createGeometryObject,
  updateScale,
  updatePosition,
  updateRotation,
  setSelected,
  playSpawnAnimation,
  updateLabelCoords,
} from './GeometryFactory';

export type BooleanOperation = 'union' | 'intersect' | 'subtract';

type SelectionChangeCallback = (selected: GeometryObject[]) => void;
type SceneChangeCallback = () => void;

interface BSPVertex {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
  uv?: THREE.Vector2;
}

interface BSPPolygon {
  vertices: BSPVertex[];
  plane: THREE.Plane;
  shared?: { material: THREE.Material; color: THREE.Color };
}

class BSPNode {
  plane: THREE.Plane | null = null;
  front: BSPNode | null = null;
  back: BSPNode | null = null;
  polygons: BSPPolygon[] = [];

  clone(): BSPNode {
    const node = new BSPNode();
    if (this.plane) node.plane = this.plane.clone();
    if (this.front) node.front = this.front.clone();
    if (this.back) node.back = this.back.clone();
    node.polygons = this.polygons.map((p) => ({
      vertices: p.vertices.map((v) => ({
        pos: v.pos.clone(),
        normal: v.normal.clone(),
        uv: v.uv ? v.uv.clone() : undefined,
      })),
      plane: p.plane.clone(),
      shared: p.shared,
    }));
    return node;
  }

  invert(): void {
    for (const p of this.polygons) {
      p.vertices.reverse();
      p.plane.negate();
      for (const v of p.vertices) {
        v.normal.negate();
      }
    }
    if (this.plane) this.plane.negate();
    if (this.front) this.front.invert();
    if (this.back) this.back.invert();
    const temp = this.front;
    this.front = this.back;
    this.back = temp;
  }

  clipPolygons(polygons: BSPPolygon[]): BSPPolygon[] {
    if (!this.plane) return polygons.slice();
    let front: BSPPolygon[] = [];
    let back: BSPPolygon[] = [];
    for (const poly of polygons) {
      this.splitPolygon(poly, front, back, front, back);
    }
    if (this.front) front = this.front.clipPolygons(front);
    if (this.back) back = this.back.clipPolygons(back);
    else back = [];
    return front.concat(back);
  }

  clipTo(bsp: BSPNode): void {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) this.front.clipTo(bsp);
    if (this.back) this.back.clipTo(bsp);
  }

  allPolygons(): BSPPolygon[] {
    let polys = this.polygons.slice();
    if (this.front) polys = polys.concat(this.front.allPolygons());
    if (this.back) polys = polys.concat(this.back.allPolygons());
    return polys;
  }

  build(polygons: BSPPolygon[]): void {
    if (polygons.length === 0) return;
    if (!this.plane) {
      this.plane = polygons[Math.floor(polygons.length / 2)].plane.clone();
    }
    const front: BSPPolygon[] = [];
    const back: BSPPolygon[] = [];
    for (const poly of polygons) {
      this.splitPolygon(poly, this.polygons, this.polygons, front, back);
    }
    if (front.length > 0) {
      if (!this.front) this.front = new BSPNode();
      this.front.build(front);
    }
    if (back.length > 0) {
      if (!this.back) this.back = new BSPNode();
      this.back.build(back);
    }
  }

  private splitPolygon(
    poly: BSPPolygon,
    coplanarFront: BSPPolygon[],
    coplanarBack: BSPPolygon[],
    front: BSPPolygon[],
    back: BSPPolygon[]
  ): void {
    const COPLANAR = 0;
    const FRONT = 1;
    const BACK = 2;
    const SPANNING = 3;

    let polygonType = 0;
    const types: number[] = [];
    const normal = this.plane!.normal;
    const planeDist = this.plane!.constant;

    for (let i = 0; i < poly.vertices.length; i++) {
      const t = normal.dot(poly.vertices[i].pos) - planeDist;
      const type = t < -1e-5 ? BACK : t > 1e-5 ? FRONT : COPLANAR;
      polygonType |= type;
      types.push(type);
    }

    switch (polygonType) {
      case COPLANAR:
        (normal.dot(poly.plane.normal) > 0 ? coplanarFront : coplanarBack).push(poly);
        break;
      case FRONT:
        front.push(poly);
        break;
      case BACK:
        back.push(poly);
        break;
      case SPANNING: {
        const f: BSPVertex[] = [];
        const b: BSPVertex[] = [];
        for (let i = 0; i < poly.vertices.length; i++) {
          const j = (i + 1) % poly.vertices.length;
          const ti = types[i];
          const tj = types[j];
          const vi = poly.vertices[i];
          const vj = poly.vertices[j];
          if (ti !== BACK) f.push(vi);
          if (ti !== FRONT) b.push(vi);
          if ((ti | tj) === SPANNING) {
            const t =
              (planeDist - normal.dot(vi.pos)) / normal.dot(vj.pos.clone().sub(vi.pos));
            const ipos = vi.pos.clone().lerp(vj.pos, t);
            const inormal = vi.normal.clone().lerp(vj.normal, t);
            const iuv = vi.uv && vj.uv ? vi.uv.clone().lerp(vj.uv, t) : undefined;
            const intersection: BSPVertex = { pos: ipos, normal: inormal, uv: iuv };
            f.push(intersection);
            b.push(intersection);
          }
        }
        if (f.length >= 3) front.push({ vertices: f, plane: poly.plane, shared: poly.shared });
        if (b.length >= 3) back.push({ vertices: b, plane: poly.plane, shared: poly.shared });
        break;
      }
    }
  }
}

const meshToPolygons = (
  mesh: THREE.Mesh,
  matrixWorld: THREE.Matrix4,
  material: THREE.Material
): BSPPolygon[] => {
  const geometry = mesh.geometry.clone();
  geometry.applyMatrix4(matrixWorld);
  geometry.computeVertexNormals();

  const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const normAttr = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const uvAttr = geometry.getAttribute('uv') as THREE.BufferAttribute | undefined;
  const indexAttr = geometry.getIndex();

  const matColor = new THREE.Color(0xffffff);
  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
    matColor.copy(material.color);
  }

  const polygons: BSPPolygon[] = [];
  const shared = { material, color: matColor };

  const getTri = (i: number): THREE.Triangle => {
    const a = new THREE.Vector3().fromBufferAttribute(posAttr, i);
    const b = new THREE.Vector3().fromBufferAttribute(posAttr, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(posAttr, i + 2);
    return new THREE.Triangle(a, b, c);
  };

  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i += 3) {
      const ia = indexAttr.getX(i);
      const ib = indexAttr.getX(i + 1);
      const ic = indexAttr.getX(i + 2);
      const verts: BSPVertex[] = [ia, ib, ic].map((idx) => ({
        pos: new THREE.Vector3().fromBufferAttribute(posAttr, idx),
        normal: new THREE.Vector3().fromBufferAttribute(normAttr, idx),
        uv: uvAttr ? new THREE.Vector2().fromBufferAttribute(uvAttr, idx) : undefined,
      }));
      const tri = new THREE.Triangle(verts[0].pos, verts[1].pos, verts[2].pos);
      const normal = new THREE.Vector3();
      tri.getNormal(normal);
      if (normal.lengthSq() < 1e-10) continue;
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, verts[0].pos);
      polygons.push({ vertices: verts, plane, shared });
    }
  } else {
    for (let i = 0; i < posAttr.count; i += 3) {
      const verts: BSPVertex[] = [0, 1, 2].map((off) => ({
        pos: new THREE.Vector3().fromBufferAttribute(posAttr, i + off),
        normal: new THREE.Vector3().fromBufferAttribute(normAttr, i + off),
        uv: uvAttr ? new THREE.Vector2().fromBufferAttribute(uvAttr, i + off) : undefined,
      }));
      const tri = new THREE.Triangle(verts[0].pos, verts[1].pos, verts[2].pos);
      const normal = new THREE.Vector3();
      tri.getNormal(normal);
      if (normal.lengthSq() < 1e-10) continue;
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, verts[0].pos);
      polygons.push({ vertices: verts, plane, shared });
    }
  }

  geometry.dispose();
  return polygons;
};

const polygonsToMesh = (polygons: BSPPolygon[], color: THREE.Color): THREE.Mesh => {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let index = 0;

  let avgColor = color.clone();
  if (polygons.length > 0) {
    const colors: THREE.Color[] = [];
    for (const p of polygons) {
      if (p.shared) colors.push(p.shared.color);
    }
    if (colors.length > 0) {
      avgColor = new THREE.Color(0, 0, 0);
      for (const c of colors) avgColor.add(c);
      avgColor.multiplyScalar(1 / colors.length);
    }
  }

  for (const poly of polygons) {
    if (poly.vertices.length < 3) continue;
    for (let i = 1; i < poly.vertices.length - 1; i++) {
      const tri = [0, i, i + 1];
      for (const vi of tri) {
        const v = poly.vertices[vi];
        positions.push(v.pos.x, v.pos.y, v.pos.z);
        normals.push(v.normal.x, v.normal.y, v.normal.z);
        if (v.uv) uvs.push(v.uv.x, v.uv.y);
        indices.push(index++);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  if (uvs.length > 0) {
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  geometry.setIndex(indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const material = new THREE.MeshStandardMaterial({
    color: avgColor,
    metalness: 0.25,
    roughness: 0.55,
    side: THREE.DoubleSide,
    flatShading: false,
  });

  return new THREE.Mesh(geometry, material);
};

const performBoolean = (
  aMesh: THREE.Mesh,
  aMatrix: THREE.Matrix4,
  bMesh: THREE.Mesh,
  bMatrix: THREE.Matrix4,
  op: BooleanOperation,
  aMat: THREE.Material,
  bMat: THREE.Material
): THREE.Mesh | null => {
  try {
    const aPolys = meshToPolygons(aMesh, aMatrix, aMat);
    const bPolys = meshToPolygons(bMesh, bMatrix, bMat);

    if (aPolys.length === 0 || bPolys.length === 0) return null;

    const a = new BSPNode();
    a.build(aPolys);
    const b = new BSPNode();
    b.build(bPolys);

    let result: BSPPolygon[] = [];
    const a2 = a.clone();
    const b2 = b.clone();

    switch (op) {
      case 'union': {
        a2.clipTo(b);
        b2.clipTo(a2);
        b2.invert();
        b2.clipTo(a2);
        b2.invert();
        a2.build(b2.allPolygons());
        result = a2.allPolygons();
        break;
      }
      case 'intersect': {
        a2.invert();
        b2.clipTo(a2);
        b2.invert();
        a2.clipTo(b2);
        b2.clipTo(a2);
        result = a2.allPolygons().concat(b2.allPolygons());
        for (const p of result) {
          p.vertices.reverse();
          p.plane.negate();
          for (const v of p.vertices) v.normal.negate();
        }
        break;
      }
      case 'subtract': {
        a2.invert();
        a2.clipTo(b);
        b.clipTo(a2);
        b.invert();
        b.clipTo(a2);
        b.invert();
        a2.build(b.allPolygons());
        a2.invert();
        result = a2.allPolygons();
        break;
      }
    }

    if (result.length === 0) return null;

    const avgColor = new THREE.Color(0x3b82f6);
    return polygonsToMesh(result, avgColor);
  } catch (e) {
    console.warn('Boolean operation failed:', e);
    return null;
  }
};

export class SceneManager {
  private scene: THREE.Scene;
  private objects: Map<string, GeometryObject> = new Map();
  private selectedIds: string[] = [];
  private onSelectionChange: SelectionChangeCallback | null = null;
  private onSceneChange: SceneChangeCallback | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setSelectionChangeCallback(cb: SelectionChangeCallback): void {
    this.onSelectionChange = cb;
  }

  setSceneChangeCallback(cb: SceneChangeCallback): void {
    this.onSceneChange = cb;
  }

  addGeometry(type: GeometryType, position?: { x: number; y: number; z: number }): GeometryObject {
    const pos = position || { x: 0, y: 0, z: 0 };
    const obj = createGeometryObject(type, pos, 1.0);
    this.objects.set(obj.data.id, obj);
    this.scene.add(obj.group);
    updateLabelCoords(obj);

    obj.group.scale.setScalar(0.5);
    const startTime = performance.now();
    const duration = 200;
    const animate = () => {
      const t = Math.min(1, (performance.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const s = 0.5 + 0.5 * eased;
      obj.group.scale.setScalar(s);
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    this.onSceneChange?.();
    return obj;
  }

  getObjectById(id: string): GeometryObject | undefined {
    return this.objects.get(id);
  }

  getObjectByMesh(mesh: THREE.Object3D): GeometryObject | undefined {
    const id = (mesh as any).userData?.geometryId;
    if (id) return this.objects.get(id);
    for (const obj of this.objects.values()) {
      if (obj.mesh === mesh || obj.group === mesh) return obj;
    }
    return undefined;
  }

  getAllObjects(): GeometryObject[] {
    return Array.from(this.objects.values());
  }

  removeGeometry(id: string): boolean {
    const obj = this.objects.get(id);
    if (!obj) return false;

    this.scene.remove(obj.group);
    this.deselect(id);

    obj.mesh.geometry.dispose();
    const mat = obj.mesh.material as THREE.Material;
    mat.dispose();
    if (obj.wireframe) {
      obj.wireframe.geometry.dispose();
      (obj.wireframe.material as THREE.Material).dispose();
    }

    this.objects.delete(id);
    this.onSceneChange?.();
    return true;
  }

  clearAll(): void {
    for (const id of Array.from(this.objects.keys())) {
      this.removeGeometry(id);
    }
    this.selectedIds = [];
    this.onSelectionChange?.([]);
    this.onSceneChange?.();
  }

  select(id: string): void {
    if (this.selectedIds.includes(id)) return;
    const obj = this.objects.get(id);
    if (!obj) return;

    if (this.selectedIds.length >= 2) {
      const oldId = this.selectedIds.shift()!;
      const oldObj = this.objects.get(oldId);
      if (oldObj) setSelected(oldObj, false);
    }

    this.selectedIds.push(id);
    setSelected(obj, true);
    this.onSelectionChange?.(this.getSelectedObjects());
  }

  deselect(id: string): void {
    const idx = this.selectedIds.indexOf(id);
    if (idx === -1) return;
    this.selectedIds.splice(idx, 1);
    const obj = this.objects.get(id);
    if (obj) setSelected(obj, false);
    this.onSelectionChange?.(this.getSelectedObjects());
  }

  clearSelection(): void {
    for (const id of this.selectedIds) {
      const obj = this.objects.get(id);
      if (obj) setSelected(obj, false);
    }
    this.selectedIds = [];
    this.onSelectionChange?.([]);
  }

  getSelectedObjects(): GeometryObject[] {
    return this.selectedIds.map((id) => this.objects.get(id)).filter(Boolean) as GeometryObject[];
  }

  updateScale(id: string, scale: number): void {
    const obj = this.objects.get(id);
    if (!obj) return;
    updateScale(obj, Math.max(0.5, Math.min(3.0, scale)));
    this.onSceneChange?.();
  }

  updatePosition(id: string, x: number, y: number, z: number): void {
    const obj = this.objects.get(id);
    if (!obj) return;
    updatePosition(obj, x, y, z);
    this.onSceneChange?.();
  }

  updateRotation(id: string, xDeg: number, yDeg: number, zDeg: number): void {
    const obj = this.objects.get(id);
    if (!obj) return;
    updateRotation(obj, xDeg, yDeg, zDeg);
    this.onSceneChange?.();
  }

  performBooleanOperation(operation: BooleanOperation): GeometryObject | null {
    const selected = this.getSelectedObjects();
    if (selected.length !== 2) return null;

    const [a, b] = selected;
    a.group.updateMatrixWorld(true);
    b.group.updateMatrixWorld(true);

    const aMat = a.mesh.material as THREE.Material;
    const bMat = b.mesh.material as THREE.Material;

    const resultMesh = performBoolean(
      a.mesh,
      a.group.matrixWorld,
      b.mesh,
      b.group.matrixWorld,
      operation,
      aMat,
      bMat
    );

    if (!resultMesh) {
      console.warn('Boolean operation produced no result');
      return null;
    }

    const resultColorHex = (
      resultMesh.material as THREE.MeshStandardMaterial
    ).color.getHexString();
    const resultColor = `#${resultColorHex}`;

    const id = `bool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const group = new THREE.Group();
    resultMesh.castShadow = true;
    resultMesh.receiveShadow = true;
    resultMesh.userData.geometryId = id;
    group.add(resultMesh);

    const edges = new THREE.EdgesGeometry(resultMesh.geometry);
    const r = parseInt(resultColor.slice(1, 3), 16);
    const g = parseInt(resultColor.slice(3, 5), 16);
    const bb = parseInt(resultColor.slice(5, 7), 16);
    const wireframeColor = `rgb(${255 - r}, ${255 - g}, ${255 - bb})`;
    const wireframeMat = new THREE.LineBasicMaterial({
      color: wireframeColor,
      transparent: true,
      opacity: 0.35,
    });
    const wireframe = new THREE.LineSegments(edges, wireframeMat);
    wireframe.userData.geometryId = id;
    group.add(wireframe);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'geo-label';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'label-type';
    const opName = operation === 'union' ? '并集' : operation === 'intersect' ? '交集' : '差集';
    labelSpan.textContent = opName;
    const coordsSpan = document.createElement('span');
    coordsSpan.className = 'label-coords';
    coordsSpan.textContent = 'X:0.0 Y:0.0 Z:0.0';
    labelDiv.appendChild(labelSpan);
    labelDiv.appendChild(coordsSpan);

    const label = new CSS2DObject(labelDiv);
    const box = new THREE.Box3().setFromObject(resultMesh);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    label.position.set(0, size.y / 2 + 0.5, 0);
    label.userData.geometryId = id;
    group.add(label);
    group.position.copy(center);
    resultMesh.position.sub(center);
    wireframe.position.sub(center);

    const data: GeometryData = {
      id,
      type: a.data.type,
      scale: 1,
      position: { x: group.position.x, y: group.position.y, z: group.position.z },
      rotation: { x: 0, y: 0, z: 0 },
      color: resultColor,
      isBooleanResult: true,
    };

    resultMesh.userData.geometryData = data;

    const resultObj: GeometryObject = {
      group,
      mesh: resultMesh,
      wireframe,
      label,
      data,
    };

    this.removeGeometry(a.data.id);
    this.removeGeometry(b.data.id);

    this.objects.set(id, resultObj);
    this.scene.add(group);

    playSpawnAnimation(resultObj);

    this.onSceneChange?.();
    return resultObj;
  }

  restoreObjects(objects: GeometryObject[]): void {
    for (const obj of objects) {
      this.objects.set(obj.data.id, obj);
      this.scene.add(obj.group);
      updateLabelCoords(obj);
    }
    this.onSceneChange?.();
  }
}

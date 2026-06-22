import * as THREE from 'three';
import { CSG } from 'three-csg-ts';
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

const OPERATION_LABELS: Record<BooleanOperation, string> = {
  union: '并集',
  intersect: '交集',
  subtract: '差集',
};

const simplifyGeometry = (geometry: THREE.BufferGeometry, maxFaces: number = 20000): THREE.BufferGeometry => {
  const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const faceCount = geometry.index ? geometry.index.count / 3 : positionAttr.count / 3;

  if (faceCount <= maxFaces) {
    return geometry;
  }

  const ratio = Math.sqrt(maxFaces / faceCount);
  const simplified = geometry.clone();

  const pos = simplified.getAttribute('position') as THREE.BufferAttribute;
  const normal = simplified.getAttribute('normal') as THREE.BufferAttribute;
  const uv = simplified.getAttribute('uv') as THREE.BufferAttribute | undefined;

  const targetVerts = Math.floor(pos.count * ratio);
  const step = Math.max(1, Math.floor(pos.count / targetVerts));

  const newPositions: number[] = [];
  const newNormals: number[] = [];
  const newUvs: number[] = [];
  const newIndices: number[] = [];
  const vertexMap = new Map<number, number>();
  let newIndex = 0;

  const indexAttr = simplified.getIndex();

  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i += 3) {
      const i0 = indexAttr.getX(i);
      const i1 = indexAttr.getX(i + 1);
      const i2 = indexAttr.getX(i + 2);

      if (i % (step * 3) !== 0 && Math.random() > ratio * 0.8) {
        continue;
      }

      for (const idx of [i0, i1, i2]) {
        if (!vertexMap.has(idx)) {
          vertexMap.set(idx, newIndex);
          newPositions.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
          newNormals.push(normal.getX(idx), normal.getY(idx), normal.getZ(idx));
          if (uv) {
            newUvs.push(uv.getX(idx), uv.getY(idx));
          }
          newIndex++;
        }
        newIndices.push(vertexMap.get(idx)!);
      }
    }
  } else {
    for (let i = 0; i < pos.count; i += 3) {
      if (i % (step * 3) !== 0 && Math.random() > ratio * 0.8) {
        continue;
      }

      for (let j = 0; j < 3; j++) {
        const idx = i + j;
        if (!vertexMap.has(idx)) {
          vertexMap.set(idx, newIndex);
          newPositions.push(pos.getX(idx), pos.getY(idx), pos.getZ(idx));
          newNormals.push(normal.getX(idx), normal.getY(idx), normal.getZ(idx));
          if (uv) {
            newUvs.push(uv.getX(idx), uv.getY(idx));
          }
          newIndex++;
        }
        newIndices.push(vertexMap.get(idx)!);
      }
    }
  }

  if (newIndices.length < 3) {
    return geometry;
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  result.setAttribute('normal', new THREE.Float32BufferAttribute(newNormals, 3));
  if (newUvs.length > 0) {
    result.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2));
  }
  result.setIndex(newIndices);
  result.computeBoundingBox();
  result.computeBoundingSphere();

  simplified.dispose();
  return result;
};

const getComplementaryColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
};

const createBooleanResultObject = (
  geometry: THREE.BufferGeometry,
  operation: BooleanOperation,
  color: string
): GeometryObject => {
  const id = `bool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const group = new THREE.Group();

  const material = new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.25,
    roughness: 0.55,
    side: THREE.DoubleSide,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.geometryId = id;

  const box = new THREE.Box3().setFromObject(mesh);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  group.position.copy(center);
  mesh.position.sub(center);

  group.add(mesh);

  const edges = new THREE.EdgesGeometry(geometry);
  const wireframeColor = getComplementaryColor(color);
  const wireframeMat = new THREE.LineBasicMaterial({
    color: wireframeColor,
    transparent: true,
    opacity: 0.35,
  });
  const wireframe = new THREE.LineSegments(edges, wireframeMat);
  wireframe.position.copy(mesh.position);
  wireframe.userData.geometryId = id;
  group.add(wireframe);

  const labelDiv = document.createElement('div');
  labelDiv.className = 'geo-label';
  const labelSpan = document.createElement('span');
  labelSpan.className = 'label-type';
  labelSpan.textContent = OPERATION_LABELS[operation];
  const coordsSpan = document.createElement('span');
  coordsSpan.className = 'label-coords';
  coordsSpan.textContent = 'X:0.0 Y:0.0 Z:0.0';
  labelDiv.appendChild(labelSpan);
  labelDiv.appendChild(coordsSpan);

  const label = new CSS2DObject(labelDiv);
  label.position.set(0, size.y / 2 + 0.5, 0);
  label.userData.geometryId = id;
  group.add(label);

  const data: GeometryData = {
    id,
    type: 'cube',
    scale: 1,
    position: { x: group.position.x, y: group.position.y, z: group.position.z },
    rotation: { x: 0, y: 0, z: 0 },
    color: color,
    isBooleanResult: true,
  };

  mesh.userData.geometryData = data;

  return { group, mesh, wireframe, label, data };
};

const playColorAnimation = (obj: GeometryObject, duration: number = 1000): void => {
  const mat = obj.mesh.material as THREE.MeshStandardMaterial;
  const originalColor = new THREE.Color(obj.data.color).clone();
  const startTime = performance.now();

  const animate = () => {
    const elapsed = performance.now() - startTime;
    if (elapsed >= duration) {
      mat.color.copy(originalColor);
      return;
    }
    const t = elapsed / duration;
    const white = new THREE.Color(0xffffff);
    mat.color.copy(white).lerp(originalColor, t);
    requestAnimationFrame(animate);
  };
  animate();
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

    try {
      const aMesh = a.mesh.clone();
      aMesh.geometry = a.mesh.geometry.clone();
      aMesh.applyMatrix4(a.group.matrixWorld);

      const bMesh = b.mesh.clone();
      bMesh.geometry = b.mesh.geometry.clone();
      bMesh.applyMatrix4(b.group.matrixWorld);

      let resultMesh: THREE.Mesh;
      switch (operation) {
        case 'union':
          resultMesh = CSG.union(aMesh, bMesh);
          break;
        case 'intersect':
          resultMesh = CSG.intersect(aMesh, bMesh);
          break;
        case 'subtract':
          resultMesh = CSG.subtract(aMesh, bMesh);
          break;
      }

      if (!resultMesh || !resultMesh.geometry) {
        console.warn('Boolean operation produced no result');
        aMesh.geometry.dispose();
        (aMesh.material as THREE.Material).dispose();
        bMesh.geometry.dispose();
        (bMesh.material as THREE.Material).dispose();
        return null;
      }

      let resultGeometry = resultMesh.geometry;
      resultGeometry.computeVertexNormals();

      const positionAttr = resultGeometry.getAttribute('position') as THREE.BufferAttribute;
      if (!positionAttr || positionAttr.count < 3) {
        console.warn('Boolean operation produced empty geometry');
        resultGeometry.dispose();
        (resultMesh.material as THREE.Material).dispose();
        return null;
      }

      resultGeometry = simplifyGeometry(resultGeometry, 15000);

      const aColor = (a.mesh.material as THREE.MeshStandardMaterial).color;
      const bColor = (b.mesh.material as THREE.MeshStandardMaterial).color;
      const resultColorHex = aColor.clone().lerp(bColor, 0.5).getHexString();
      const resultColor = `#${resultColorHex}`;

      const resultObj = createBooleanResultObject(resultGeometry, operation, resultColor);

      aMesh.geometry.dispose();
      (aMesh.material as THREE.Material).dispose();
      bMesh.geometry.dispose();
      (bMesh.material as THREE.Material).dispose();
      (resultMesh.material as THREE.Material).dispose();

      this.removeGeometry(a.data.id);
      this.removeGeometry(b.data.id);

      this.objects.set(resultObj.data.id, resultObj);
      this.scene.add(resultObj.group);

      playColorAnimation(resultObj, 1000);
      playSpawnAnimation(resultObj);

      updateLabelCoords(resultObj);

      this.onSceneChange?.();
      return resultObj;
    } catch (e) {
      console.warn('Boolean operation failed:', e);
      return null;
    }
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

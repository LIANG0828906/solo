import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { GeometryType, GeometryData, GeometryObject } from './GeometryFactory';
import { createGeometryObject, updatePosition, updateRotation, updateScale } from './GeometryFactory';

export interface SnapshotGeometryData extends GeometryData {
  vertices?: Float32Array;
  normals?: Float32Array;
  indices?: Uint32Array | Uint16Array;
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  geometries: SnapshotGeometryData[];
  thumbnail: string;
}

type RestoreCallback = (objects: GeometryObject[]) => void;

export class HistoryManager {
  private snapshots: Snapshot[] = [];
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private onRestoreCallback: RestoreCallback | null = null;
  private onUpdateCallback: (() => void) | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
  }

  setRestoreCallback(cb: RestoreCallback): void {
    this.onRestoreCallback = cb;
  }

  setUpdateCallback(cb: () => void): void {
    this.onUpdateCallback = cb;
  }

  getSnapshots(): Snapshot[] {
    return this.snapshots;
  }

  saveSnapshot(geometryObjects: GeometryObject[]): Snapshot | null {
    if (geometryObjects.length === 0) {
      return null;
    }

    const geometries: SnapshotGeometryData[] = geometryObjects.map((obj) => {
      const geoData: SnapshotGeometryData = {
        ...obj.data,
        position: { ...obj.data.position },
        rotation: { ...obj.data.rotation },
      };

      if (obj.data.isBooleanResult) {
        const geometry = obj.mesh.geometry;

        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
        if (posAttr && posAttr.array) {
          geoData.vertices = new Float32Array(posAttr.array as Float32Array);
        }

        const normalAttr = geometry.getAttribute('normal') as THREE.BufferAttribute;
        if (normalAttr && normalAttr.array) {
          geoData.normals = new Float32Array(normalAttr.array as Float32Array);
        }

        const indexAttr = geometry.getIndex();
        if (indexAttr && indexAttr.array) {
          if (indexAttr.array instanceof Uint32Array) {
            geoData.indices = new Uint32Array(indexAttr.array);
          } else if (indexAttr.array instanceof Uint16Array) {
            geoData.indices = new Uint16Array(indexAttr.array);
          }
        }
      }

      return geoData;
    });

    const thumbnail = this.captureThumbnail();

    const snapshot: Snapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `雕塑 #${this.snapshots.length + 1}`,
      timestamp: Date.now(),
      geometries,
      thumbnail,
    };

    this.snapshots.unshift(snapshot);
    this.onUpdateCallback?.();
    return snapshot;
  }

  deleteSnapshot(id: string): void {
    this.snapshots = this.snapshots.filter((s) => s.id !== id);
    this.onUpdateCallback?.();
  }

  restoreSnapshot(id: string, clearScene: () => void): void {
    const snapshot = this.snapshots.find((s) => s.id === id);
    if (!snapshot) return;

    clearScene();

    const restoredObjects: GeometryObject[] = snapshot.geometries.map((geoData) => {
      if (geoData.isBooleanResult && geoData.vertices) {
        return this.restoreBooleanResult(geoData);
      } else {
        return this.restoreRegularGeometry(geoData);
      }
    });

    this.onRestoreCallback?.(restoredObjects);
  }

  clearAll(): void {
    this.snapshots = [];
    this.onUpdateCallback?.();
  }

  private restoreRegularGeometry(geoData: SnapshotGeometryData): GeometryObject {
    const obj = createGeometryObject(
      geoData.type,
      geoData.position,
      geoData.scale,
      geoData.color
    );
    obj.data.id = geoData.id;
    obj.mesh.userData.geometryId = geoData.id;
    if (obj.wireframe) {
      obj.wireframe.userData.geometryId = geoData.id;
    }
    obj.label.userData.geometryId = geoData.id;
    updatePosition(obj, geoData.position.x, geoData.position.y, geoData.position.z);
    updateRotation(obj, geoData.rotation.x, geoData.rotation.y, geoData.rotation.z);
    updateScale(obj, geoData.scale);
    if (geoData.isBooleanResult) {
      obj.data.isBooleanResult = true;
    }
    obj.mesh.userData.geometryData = obj.data;
    return obj;
  }

  private restoreBooleanResult(geoData: SnapshotGeometryData): GeometryObject {
    const geometry = new THREE.BufferGeometry();

    if (geoData.vertices) {
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(geoData.vertices), 3));
    }

    if (geoData.normals) {
      geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(geoData.normals), 3));
    } else {
      geometry.computeVertexNormals();
    }

    if (geoData.indices) {
      if (geoData.indices instanceof Uint32Array) {
        geometry.setIndex(new THREE.Uint32BufferAttribute(new Uint32Array(geoData.indices), 1));
      } else {
        geometry.setIndex(new THREE.Uint16BufferAttribute(new Uint16Array(geoData.indices), 1));
      }
    }

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const material = new THREE.MeshStandardMaterial({
      color: geoData.color,
      metalness: 0.25,
      roughness: 0.55,
      side: THREE.DoubleSide,
      flatShading: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.geometryId = geoData.id;
    mesh.scale.setScalar(geoData.scale);

    const tempBox = new THREE.Box3().setFromBufferAttribute(
      geometry.getAttribute('position') as THREE.BufferAttribute
    );
    const geoCenter = new THREE.Vector3();
    tempBox.getCenter(geoCenter);
    mesh.position.copy(geoCenter).multiplyScalar(-1);

    const group = new THREE.Group();
    group.add(mesh);

    const edges = new THREE.EdgesGeometry(geometry);
    const wireframeColor = this.getComplementaryColor(geoData.color);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: wireframeColor,
      transparent: true,
      opacity: 0.35,
    });
    const wireframe = new THREE.LineSegments(edges, wireframeMat);
    wireframe.position.copy(mesh.position);
    wireframe.scale.copy(mesh.scale);
    wireframe.userData.geometryId = geoData.id;
    group.add(wireframe);

    const labelDiv = document.createElement('div');
    labelDiv.className = 'geo-label';
    const labelSpan = document.createElement('span');
    labelSpan.className = 'label-type';
    labelSpan.textContent = '布尔结果';
    const coordsSpan = document.createElement('span');
    coordsSpan.className = 'label-coords';
    coordsSpan.textContent = 'X:0.0 Y:0.0 Z:0.0';
    labelDiv.appendChild(labelSpan);
    labelDiv.appendChild(coordsSpan);

    const label = new CSS2DObject(labelDiv);

    const size = new THREE.Vector3();
    tempBox.getSize(size);
    const scaledHeight = size.y * geoData.scale;
    label.position.set(0, scaledHeight / 2 + 0.5, 0);

    label.userData.geometryId = geoData.id;
    group.add(label);

    group.position.set(geoData.position.x, geoData.position.y, geoData.position.z);
    group.rotation.set(
      THREE.MathUtils.degToRad(geoData.rotation.x),
      THREE.MathUtils.degToRad(geoData.rotation.y),
      THREE.MathUtils.degToRad(geoData.rotation.z)
    );

    const data: GeometryData = {
      id: geoData.id,
      type: geoData.type,
      scale: geoData.scale,
      position: { ...geoData.position },
      rotation: { ...geoData.rotation },
      color: geoData.color,
      isBooleanResult: true,
    };

    mesh.userData.geometryData = data;

    return { group, mesh, wireframe, label, data };
  }

  private getComplementaryColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${255 - r}, ${255 - g}, ${255 - b})`;
  }

  private captureThumbnail(): string {
    this.renderer.render(this.scene, this.camera);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const targetSize = 120;
    canvas.width = targetSize;
    canvas.height = targetSize;

    const srcCanvas = this.renderer.domElement;
    const sw = srcCanvas.width;
    const sh = srcCanvas.height;
    const size = Math.min(sw, sh);
    const sx = (sw - size) / 2;
    const sy = (sh - size) / 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, targetSize, targetSize);

    ctx.drawImage(srcCanvas, sx, sy, size, size, 0, 0, targetSize, targetSize);

    return canvas.toDataURL('image/jpeg', 0.85);
  }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LayerOutput } from './inferenceEngine';

export interface VertexInfo {
  layerIndex: number;
  channel: number;
  position: { x: number; y: number };
  value: number;
  worldPos: { x: number; y: number; z: number };
}

export type VertexClickCallback = (info: VertexInfo | null) => void;

interface LayerMeshInfo {
  group: THREE.Group;
  planes: THREE.Mesh[];
  basePositions: Float32Array[];
  targetValues: Float32Array[];
  currentValues: Float32Array[];
  h: number;
  w: number;
  layerIndex: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function activationToColor(v: number, target: THREE.Color): void {
  const clamped = Math.max(0, Math.min(1, v));
  target.r = clamped;
  target.g = 0x33 / 255;
  target.b = 0x66 / 255 * (1 - clamped);
}

export class FeatureMapRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private layerInfos: (LayerMeshInfo | null)[] = [null, null, null, null];
  private layerLabels: (HTMLDivElement | null)[] = [null, null, null, null];
  private vertexClickCallback: VertexClickCallback | null = null;
  private animFrame: number | null = null;
  private transitionStart: number = 0;
  private transitionDuration: number = 600;
  private isTransitioning: boolean = false;
  private initialY: number[] = [4.5, 2.0, -0.5, -3.0];
  private resizeObserver: ResizeObserver | null = null;
  private tempColor: THREE.Color = new THREE.Color();
  private fadeStartTimes: (number | null)[] = [null, null, null, null];
  private introDuration = 500;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A1A2E);
    this.scene.fog = new THREE.FogExp2(0x1A1A2E, 0.04);

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(8, 6, 12);
    this.camera.lookAt(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = false;
    this.controls.enablePan = false;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;

    this.setupLights();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);

    this.animate();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(5, 10, 7);
    dir.castShadow = true;
    this.scene.add(dir);
    this.initialY.forEach((y, i) => {
      const pl = new THREE.PointLight(0x4488ff, 0.3, 15);
      pl.position.set(0, y - 1.2, 0);
      this.scene.add(pl);
    });
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: PointerEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const meshes: THREE.Mesh[] = [];
    for (const li of this.layerInfos) {
      if (li) meshes.push(...li.planes);
    }
    if (meshes.length === 0) return;

    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0];
      const mesh = hit.object as THREE.Mesh;
      const layerInfo = this.layerInfos.find(
        (li) => li && li.planes.includes(mesh)
      );
      if (layerInfo && hit.faceIndex !== undefined && hit.point) {
        const chIndex = layerInfo.planes.indexOf(mesh);
        const attrPos = mesh.geometry.getAttribute('position') as THREE.BufferAttribute;
        const triIdx = hit.faceIndex * 3;
        const closestV = this.findClosestVertex(
          attrPos,
          triIdx,
          hit.point,
          mesh.matrixWorld
        );
        const { row, col, value } = this.getVertexData(layerInfo, chIndex, closestV);
        const world = new THREE.Vector3();
        attrPos.setXYZ(closestV, attrPos.getX(closestV), attrPos.getY(closestV), attrPos.getZ(closestV));
        world.set(
          attrPos.getX(closestV),
          attrPos.getY(closestV),
          attrPos.getZ(closestV)
        ).applyMatrix4(mesh.matrixWorld);

        this.vertexClickCallback?.({
          layerIndex: layerInfo.layerIndex,
          channel: chIndex,
          position: { x: col, y: row },
          value,
          worldPos: { x: world.x, y: world.y, z: world.z }
        });
        return;
      }
    }
    this.vertexClickCallback?.(null);
  };

  private findClosestVertex(
    attr: THREE.BufferAttribute,
    triIdx: number,
    worldPoint: THREE.Vector3,
    worldMatrix: THREE.Matrix4
  ): number {
    let best = triIdx;
    let bestD = Infinity;
    const v = new THREE.Vector3();
    for (let i = 0; i < 3; i++) {
      const idx = triIdx + i;
      v.set(attr.getX(idx), attr.getY(idx), attr.getZ(idx)).applyMatrix4(worldMatrix);
      const d = v.distanceToSquared(worldPoint);
      if (d < bestD) {
        bestD = d;
        best = idx;
      }
    }
    return best;
  }

  private getVertexData(
    info: LayerMeshInfo,
    chIdx: number,
    vIdx: number
  ): { row: number; col: number; value: number } {
    const w = info.w;
    const col = vIdx % (w + 1);
    const row = Math.floor(vIdx / (w + 1));
    const flat = row * w + col;
    const valArr = info.currentValues[chIdx];
    let value = 0;
    if (flat < valArr.length) value = valArr[flat];
    else if (flat - w < valArr.length) value = valArr[flat - w];
    else if (flat - 1 < valArr.length) value = valArr[flat - 1];
    return { row, col, value };
  }

  public onVertexClick(callback: VertexClickCallback): void {
    this.vertexClickCallback = callback;
  }

  private buildLayer(layer: LayerOutput, yPos: number, layerIdx: number): LayerMeshInfo {
    const group = new THREE.Group();
    group.position.y = yPos;
    this.scene.add(group);

    const { width: w, height: h, channels: ch, activations: acts } = layer;
    const planes: THREE.Mesh[] = [];
    const basePositions: Float32Array[] = [];
    const targetValues: Float32Array[] = [];
    const currentValues: Float32Array[] = [];

    const totalWidth = (w + 0.15 * (ch - 1)) * 0.5;
    const stepX = 0.5 + 0.15;
    const startX = -totalWidth + w * 0.25;

    for (let c = 0; c < ch; c++) {
      const geom = new THREE.PlaneGeometry(w * 0.5, h * 0.5, w, h);
      geom.rotateX(-Math.PI / 2);
      const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
      const base = new Float32Array(posAttr.array as Float32Array);
      basePositions.push(base);

      const colors = new Float32Array(posAttr.count * 3);
      const initialVals = new Float32Array(acts[c]);
      targetValues.push(new Float32Array(initialVals));
      currentValues.push(new Float32Array(initialVals));

      for (let v = 0; v < posAttr.count; v++) {
        const row = Math.floor(v / (w + 1));
        const col = v % (w + 1);
        let flat = row * w + col;
        if (flat >= initialVals.length) {
          if (col === w) flat = row * w + (w - 1);
          else if (row === h) flat = (h - 1) * w + (col === w ? w - 1 : col);
        }
        const val = initialVals[flat] ?? 0;
        posAttr.setY(v, val * 2);
        activationToColor(val, this.tempColor);
        colors[v * 3] = this.tempColor.r;
        colors[v * 3 + 1] = this.tempColor.g;
        colors[v * 3 + 2] = this.tempColor.b;
      }
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      posAttr.needsUpdate = true;

      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.6,
        metalness: 0.2,
        wireframe: false,
        transparent: true,
        opacity: 0
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.x = startX + c * stepX;
      mesh.frustumCulled = true;
      group.add(mesh);
      planes.push(mesh);

      const edges = new THREE.EdgesGeometry(geom);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x2A2A4E, transparent: true, opacity: 0 });
      const line = new THREE.LineSegments(edges, edgeMat);
      mesh.add(line);
    }

    this.createLayerLabel(layer, group, layerIdx);

    const infoObj: LayerMeshInfo = {
      group,
      planes,
      basePositions,
      targetValues,
      currentValues,
      h,
      w,
      layerIndex: layerIdx
    };
    return infoObj;
  }

  private createLayerLabel(layer: LayerOutput, group: THREE.Group, _idx: number): void {
    const labelDiv = document.createElement('div');
    labelDiv.style.position = 'absolute';
    labelDiv.style.pointerEvents = 'none';
    labelDiv.style.color = '#E0E0E0';
    labelDiv.style.fontFamily = "'JetBrains Mono', monospace";
    labelDiv.style.fontSize = '13px';
    labelDiv.style.fontWeight = '600';
    labelDiv.style.background = 'rgba(22, 33, 62, 0.85)';
    labelDiv.style.padding = '4px 10px';
    labelDiv.style.borderRadius = '4px';
    labelDiv.style.border = '1px solid #2A2A4E';
    labelDiv.textContent = `${layer.layerName}  ${layer.channels}×${layer.height}×${layer.width}`;
    this.container.appendChild(labelDiv);
    this.layerLabels[layer.layerIndex] = labelDiv;
    (group as any)._labelDiv = labelDiv;
  }

  private updateLabels(): void {
    const tempV = new THREE.Vector3();
    for (let i = 0; i < 4; i++) {
      const info = this.layerInfos[i];
      const label = this.layerLabels[i];
      if (!info || !label) continue;
      tempV.set(-5.5, info.group.position.y + 0.8, -3.5);
      tempV.project(this.camera);
      const rect = this.container.getBoundingClientRect();
      const x = (tempV.x * 0.5 + 0.5) * rect.width;
      const y = (-tempV.y * 0.5 + 0.5) * rect.height;
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      label.style.transform = 'translate(-50%, -50%)';
    }
  }

  public renderLayer(layers: LayerOutput[], layerIndex?: number): void {
    if (layerIndex !== undefined) {
      const data = layers[layerIndex];
      if (this.layerInfos[layerIndex]) {
        this.updateLayer(layerIndex, data);
        return;
      }
      this.layerInfos[layerIndex] = this.buildLayer(data, this.initialY[layerIndex], layerIndex);
      this.fadeStartTimes[layerIndex] = performance.now();
      const info = this.layerInfos[layerIndex]!;
      info.group.scale.setScalar(0.01);
      return;
    }
    this.disposeAllLayers();
    for (let i = 0; i < layers.length; i++) {
      this.layerInfos[i] = this.buildLayer(layers[i], this.initialY[i], i);
      this.fadeStartTimes[i] = performance.now();
      const info = this.layerInfos[i]!;
      info.group.scale.setScalar(0.01);
    }
    this.isTransitioning = false;
  }

  public updateLayer(layerIndex: number, newData: LayerOutput): void {
    const info = this.layerInfos[layerIndex];
    if (!info) return;
    for (let c = 0; c < newData.channels; c++) {
      info.targetValues[c].set(newData.activations[c]);
    }
    this.transitionStart = performance.now();
    this.transitionDuration = 600;
    this.isTransitioning = true;
  }

  public async updateAll(layers: LayerOutput[], animateMs = 600): Promise<void> {
    for (let i = 0; i < layers.length; i++) {
      const info = this.layerInfos[i];
      if (!info) continue;
      for (let c = 0; c < layers[i].channels; c++) {
        info.targetValues[c].set(layers[i].activations[c]);
      }
    }
    this.transitionStart = performance.now();
    this.transitionDuration = animateMs;
    this.isTransitioning = true;
    await new Promise<void>((res) => setTimeout(res, animateMs + 50));
  }

  private disposeAllLayers(): void {
    for (let i = 0; i < 4; i++) {
      const info = this.layerInfos[i];
      if (info) {
        this.scene.remove(info.group);
        info.planes.forEach((mesh) => {
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        });
        this.layerInfos[i] = null;
      }
      if (this.layerLabels[i]) {
        this.layerLabels[i]?.remove();
        this.layerLabels[i] = null;
      }
      this.fadeStartTimes[i] = null;
    }
  }

  private animate = (): void => {
    this.animFrame = requestAnimationFrame(this.animate);
    const now = performance.now();

    for (let i = 0; i < 4; i++) {
      const t0 = this.fadeStartTimes[i];
      const info = this.layerInfos[i];
      if (t0 && info) {
        const t = Math.min(1, (now - t0) / this.introDuration);
        const eased = 1 - Math.pow(1 - t, 3);
        info.group.scale.setScalar(0.01 + 0.99 * eased);
        for (const m of info.planes) {
          (m.material as THREE.MeshStandardMaterial).opacity = eased;
          if (m.children[0]) {
            ((m.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity = eased * 0.5;
          }
        }
        if (t >= 1) this.fadeStartTimes[i] = null;
      }
    }

    if (this.isTransitioning) {
      const elapsed = now - this.transitionStart;
      let alpha = Math.min(1, elapsed / this.transitionDuration);
      const eased = easeInOutCubic(alpha);
      for (const info of this.layerInfos) {
        if (!info) continue;
        for (let c = 0; c < info.planes.length; c++) {
          const mesh = info.planes[c];
          const geom = mesh.geometry;
          const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
          const colorAttr = geom.getAttribute('color') as THREE.BufferAttribute;
          const cur = info.currentValues[c];
          const tgt = info.targetValues[c];
          const w = info.w, h = info.h;
          for (let row = 0; row <= h; row++) {
            for (let col = 0; col <= w; col++) {
              const vIdx = row * (w + 1) + col;
              let flat = row * w + col;
              if (flat >= tgt.length) {
                if (col === w) flat = row * w + (w - 1);
                else if (row === h) flat = (h - 1) * w + (col === w ? w - 1 : col);
              }
              const tv = tgt[flat];
              const cv = cur[flat];
              const iv = cv + (tv - cv) * eased;
              posAttr.setY(vIdx, iv * 2);
              activationToColor(iv, this.tempColor);
              colorAttr.setX(vIdx, this.tempColor.r);
              colorAttr.setY(vIdx, this.tempColor.g);
              colorAttr.setZ(vIdx, this.tempColor.b);
            }
          }
          posAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;
          geom.computeVertexNormals();
        }
      }
      if (alpha >= 1) {
        for (const info of this.layerInfos) {
          if (!info) continue;
          for (let c = 0; c < info.targetValues.length; c++) {
            info.currentValues[c].set(info.targetValues[c]);
          }
        }
        this.isTransitioning = false;
      }
    }

    this.controls.update();
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  };

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public worldToScreen(x: number, y: number, z: number): { x: number; y: number } | null {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    const rect = this.container.getBoundingClientRect();
    const sx = (v.x * 0.5 + 0.5) * rect.width;
    const sy = (-v.y * 0.5 + 0.5) * rect.height;
    if (sx < 0 || sy < 0 || sx > rect.width || sy > rect.height) return null;
    return { x: sx, y: sy };
  }

  public dispose(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.resizeObserver?.disconnect();
    this.disposeAllLayers();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.vertexClickCallback = null;
  }
}

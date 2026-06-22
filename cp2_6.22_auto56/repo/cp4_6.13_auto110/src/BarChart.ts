import * as THREE from 'three';

export interface StackLayer {
  name: string;
  value: number;
  color: string;
}

export interface Category {
  name: string;
  layers: StackLayer[];
}

export interface DataGroup {
  name: string;
  categories: Category[];
}

export type GroupMode = 'category' | 'layer';

export interface BarSegmentRef {
  mesh: THREE.Mesh;
  groupIndex: number;
  categoryIndex: number;
  layerIndex: number;
  dataGroup: DataGroup;
  category: Category;
  layer: StackLayer;
  barGroup: THREE.Group;
  baseEmissiveIntensity: number;
  targetScale: THREE.Vector3;
  targetRotation: THREE.Euler;
  animDelay: number;
  animStartTime: number;
  isAnimating: boolean;
}

const BAR_WIDTH = 0.8;
const BAR_DEPTH = 0.8;
const BAR_GAP_X = 0.35;
const BAR_GAP_Z = 0.35;
const CATEGORY_GAP = 1.2;
const LAYER_GAP = 0.03;
const HEIGHT_SCALE = 0.12;
const THIN_BAR_WIDTH = 0.35;
const THIN_BAR_DEPTH = 0.35;
const THIN_BAR_GAP = 0.12;

interface BarAnimation {
  mesh: THREE.Object3D;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startScale: THREE.Vector3;
  endScale: THREE.Vector3;
  startRotY: number;
  endRotY: number;
  startTime: number;
  duration: number;
  done: boolean;
}

export class BarChart {
  public chartGroup: THREE.Group;
  public segments: BarSegmentRef[] = [];
  public gridGroup: THREE.Group;
  public shadowGroup: THREE.Group;
  public currentMode: GroupMode = 'category';
  private scene: THREE.Scene;
  private shadowTexture: THREE.Texture | null = null;
  private animations: BarAnimation[] = [];
  public gridVisible = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.chartGroup = new THREE.Group();
    this.gridGroup = new THREE.Group();
    this.shadowGroup = new THREE.Group();
    this.gridGroup.visible = false;
    scene.add(this.chartGroup);
    scene.add(this.gridGroup);
    scene.add(this.shadowGroup);
    this.createShadowTexture();
  }

  private createShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    this.shadowTexture = new THREE.CanvasTexture(canvas);
  }

  clear() {
    this.animations = [];
    this.disposeChildren(this.chartGroup);
    this.disposeChildren(this.shadowGroup);
    this.disposeChildren(this.gridGroup);
    this.segments = [];
  }

  private disposeChildren(group: THREE.Group) {
    while (group.children.length > 0) {
      const child = group.children[0];
      this.deepDispose(child);
      group.remove(child);
    }
  }

  private deepDispose(obj: THREE.Object3D) {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material?.dispose();
      }
    }
    for (let i = obj.children.length - 1; i >= 0; i--) {
      this.deepDispose(obj.children[i]);
    }
  }

  createBarChart(data: DataGroup[], mode: GroupMode, animate = false) {
    this.clear();
    this.currentMode = mode;

    if (mode === 'category') {
      this.createCategoryMode(data, animate);
    } else {
      this.createLayerMode(data, animate);
    }

    this.centerChart();
    this.createShadows();
    this.createGridLines();
  }

  private createCategoryMode(data: DataGroup[], animate: boolean) {
    const numCategories = data[0].categories.length;
    const numGroups = data.length;
    const numLayers = data[0].categories[0].layers.length;

    for (let ci = 0; ci < numCategories; ci++) {
      for (let gi = 0; gi < numGroups; gi++) {
        const barGroup = new THREE.Group();
        let yOffset = 0;
        const category = data[gi].categories[ci];

        for (let li = 0; li < numLayers; li++) {
          const layer = category.layers[li];
          const height = Math.max(0.05, layer.value * HEIGHT_SCALE);
          const geometry = new THREE.BoxGeometry(BAR_WIDTH, height, BAR_DEPTH);
          const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(layer.color),
            transparent: true,
            opacity: 0.85,
            roughness: 0.3,
            metalness: 0.1,
            emissive: new THREE.Color(layer.color),
            emissiveIntensity: 0.12,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.y = yOffset + height / 2;
          mesh.castShadow = true;

          const ref: BarSegmentRef = {
            mesh,
            groupIndex: gi,
            categoryIndex: ci,
            layerIndex: li,
            dataGroup: data[gi],
            category,
            layer,
            barGroup,
            baseEmissiveIntensity: 0.12,
            targetScale: new THREE.Vector3(1, 1, 1),
            targetRotation: new THREE.Euler(0, 0, 0),
            animDelay: (ci * numGroups + gi) * 0.05,
            animStartTime: 0,
            isAnimating: false,
          };
          mesh.userData = ref;
          barGroup.add(mesh);
          this.segments.push(ref);
          yOffset += height + LAYER_GAP;
        }

        const clusterX = ci * (BAR_WIDTH + CATEGORY_GAP);
        const zOffset = (gi - (numGroups - 1) / 2) * (BAR_DEPTH + BAR_GAP_Z);
        barGroup.position.set(clusterX, 0, zOffset);

        if (animate) {
          this.setupEntryAnimation(barGroup, ci * numGroups + gi);
        }

        this.chartGroup.add(barGroup);
      }
    }
  }

  private createLayerMode(data: DataGroup[], animate: boolean) {
    const numLayers = data[0].categories[0].layers.length;
    const numGroups = data.length;
    const numCategories = data[0].categories.length;

    for (let li = 0; li < numLayers; li++) {
      for (let gi = 0; gi < numGroups; gi++) {
        for (let ci = 0; ci < numCategories; ci++) {
          const layer = data[gi].categories[ci].layers[li];
          const height = Math.max(0.05, layer.value * HEIGHT_SCALE);
          const geometry = new THREE.BoxGeometry(THIN_BAR_WIDTH, height, THIN_BAR_DEPTH);
          const material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(layer.color),
            transparent: true,
            opacity: 0.85,
            roughness: 0.3,
            metalness: 0.1,
            emissive: new THREE.Color(layer.color),
            emissiveIntensity: 0.12,
            clearcoat: 0.3,
            clearcoatRoughness: 0.25,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.y = height / 2;
          mesh.castShadow = true;

          const barGroup = new THREE.Group();

          const ref: BarSegmentRef = {
            mesh,
            groupIndex: gi,
            categoryIndex: ci,
            layerIndex: li,
            dataGroup: data[gi],
            category: data[gi].categories[ci],
            layer,
            barGroup,
            baseEmissiveIntensity: 0.12,
            targetScale: new THREE.Vector3(1, 1, 1),
            targetRotation: new THREE.Euler(0, 0, 0),
            animDelay: (li * numGroups * numCategories + gi * numCategories + ci) * 0.05,
            animStartTime: 0,
            isAnimating: false,
          };
          mesh.userData = ref;
          barGroup.add(mesh);
          this.segments.push(ref);

          const layerClusterX = li * (numCategories * (THIN_BAR_WIDTH + THIN_BAR_GAP) + CATEGORY_GAP * 2);
          const groupZ = (gi - (numGroups - 1) / 2) * (THIN_BAR_DEPTH * numCategories + THIN_BAR_GAP * (numCategories - 1) + BAR_GAP_Z);
          const catOffsetZ = (ci - (numCategories - 1) / 2) * (THIN_BAR_DEPTH + THIN_BAR_GAP);

          barGroup.position.set(layerClusterX, 0, groupZ + catOffsetZ);

          if (animate) {
            this.setupEntryAnimation(barGroup, li * numGroups * numCategories + gi * numCategories + ci);
          }

          this.chartGroup.add(barGroup);
        }
      }
    }
  }

  private setupEntryAnimation(barGroup: THREE.Group, index: number) {
    const delay = index * 0.05;
    const targetPos = barGroup.position.clone();
    const targetScale = new THREE.Vector3(1, 1, 1);

    barGroup.scale.set(0.01, 0.01, 0.01);
    barGroup.rotation.y = Math.PI * 0.5;
    barGroup.position.y = -2;

    this.animations.push({
      mesh: barGroup,
      startPos: new THREE.Vector3(targetPos.x, -2, targetPos.z),
      endPos: targetPos.clone(),
      startScale: new THREE.Vector3(0.01, 0.01, 0.01),
      endScale: targetScale,
      startRotY: Math.PI * 0.5,
      endRotY: 0,
      startTime: performance.now() + delay * 1000,
      duration: 600,
      done: false,
    });
  }

  updateAnimations(now: number) {
    for (const anim of this.animations) {
      if (anim.done) continue;
      if (now < anim.startTime) continue;

      const elapsed = now - anim.startTime;
      const t = Math.min(1, elapsed / anim.duration);
      const ease = 1 - Math.pow(1 - t, 3);

      anim.mesh.position.lerpVectors(anim.startPos, anim.endPos, ease);
      anim.mesh.scale.lerpVectors(anim.startScale, anim.endScale, ease);
      anim.mesh.rotation.y = anim.startRotY + (anim.endRotY - anim.startRotY) * ease;

      if (t >= 1) {
        anim.done = true;
      }
    }

    this.animations = this.animations.filter(a => !a.done);
  }

  private centerChart() {
    const box = new THREE.Box3().setFromObject(this.chartGroup);
    const center = box.getCenter(new THREE.Vector3());
    this.chartGroup.position.sub(center);
    this.chartGroup.position.y = 0;
  }

  private createShadows() {
    for (const seg of this.segments) {
      const totalHeight = this.getBarTotalHeight(seg);
      const shadowSize = Math.max(0.6, 0.4 + totalHeight * 0.15);
      const shadowGeo = new THREE.PlaneGeometry(shadowSize, shadowSize);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });
      const shadow = new THREE.Mesh(shadowGeo, shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.01;

      const worldPos = new THREE.Vector3();
      seg.barGroup.getWorldPosition(worldPos);
      shadow.position.x = worldPos.x;
      shadow.position.z = worldPos.z;

      this.shadowGroup.add(shadow);
    }
  }

  private getBarTotalHeight(seg: BarSegmentRef): number {
    let total = 0;
    for (const child of seg.barGroup.children) {
      if (child instanceof THREE.Mesh) {
        const h = child.geometry.parameters?.height ?? 1;
        total += h + LAYER_GAP;
      }
    }
    return total;
  }

  private createGridLines() {
    this.disposeChildren(this.gridGroup);

    const positions: THREE.Vector3[] = [];

    for (const seg of this.segments) {
      const wp = new THREE.Vector3();
      seg.mesh.getWorldPosition(wp);
      positions.push(wp);
    }

    if (positions.length < 2) return;

    const material = new THREE.LineDashedMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
      dashSize: 0.2,
      gapSize: 0.1,
    });

    const xs = [...new Set(positions.map(p => Math.round(p.x * 100) / 100))].sort((a, b) => a - b);
    const zs = [...new Set(positions.map(p => Math.round(p.z * 100) / 100))].sort((a, b) => a - b);

    const box = new THREE.Box3().setFromObject(this.chartGroup);
    const maxY = box.max.y + 0.5;

    for (const x of xs) {
      const pts = [
        new THREE.Vector3(x, 0, zs[0] - 0.6),
        new THREE.Vector3(x, 0, zs[zs.length - 1] + 0.6),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, material);
      line.computeLineDistances();
      this.gridGroup.add(line);

      const vPts = [
        new THREE.Vector3(x, 0, zs[0] - 0.6),
        new THREE.Vector3(x, maxY, zs[0] - 0.6),
      ];
      const vGeo = new THREE.BufferGeometry().setFromPoints(vPts);
      const vLine = new THREE.Line(vGeo, material.clone());
      (vLine.material as THREE.LineDashedMaterial).opacity = 0.08;
      vLine.computeLineDistances();
      this.gridGroup.add(vLine);
    }

    for (const z of zs) {
      const pts = [
        new THREE.Vector3(xs[0] - 0.6, 0, z),
        new THREE.Vector3(xs[xs.length - 1] + 0.6, 0, z),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, material);
      line.computeLineDistances();
      this.gridGroup.add(line);
    }
  }

  toggleGrid(visible: boolean) {
    this.gridVisible = visible;
    this.gridGroup.visible = visible;
  }

  getSegmentMeshes(): THREE.Mesh[] {
    return this.segments.map(s => s.mesh);
  }

  getBarGroupForMesh(mesh: THREE.Mesh): THREE.Group | null {
    const ref = mesh.userData as BarSegmentRef | undefined;
    return ref?.barGroup ?? null;
  }

  getAllBarGroups(): THREE.Group[] {
    const groups = new Set<THREE.Group>();
    for (const seg of this.segments) {
      groups.add(seg.barGroup);
    }
    return Array.from(groups);
  }

  getSegmentsForLayer(layerIndex: number): BarSegmentRef[] {
    return this.segments.filter(s => s.layerIndex === layerIndex);
  }

  flashLayer(layerIndex: number, flash: boolean) {
    const segs = this.getSegmentsForLayer(layerIndex);
    for (const seg of segs) {
      const mat = seg.mesh.material as THREE.MeshPhysicalMaterial;
      if (flash) {
        mat.emissiveIntensity = 0.5;
        mat.opacity = 0.6;
      } else {
        mat.emissiveIntensity = seg.baseEmissiveIntensity;
        mat.opacity = 0.85;
      }
    }
  }
}

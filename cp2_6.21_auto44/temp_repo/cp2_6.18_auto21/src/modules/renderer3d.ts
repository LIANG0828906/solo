import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  eventBus,
  EventType,
  CellData,
  CellType,
  SplitStartPayload,
  DifferentiatePayload,
} from '../eventBus';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

interface CellMeshGroup {
  outer: THREE.Mesh;
  inner: THREE.Mesh;
  group: THREE.Group;
  cellId: string;
  ring?: THREE.Mesh;
  data: CellData;
  baseGeometry?: THREE.BufferGeometry;
  currentType?: CellType;
}

interface StarData {
  mesh: THREE.Mesh;
  baseOpacity: number;
  size: number;
  period: number;
  phase: number;
}

export class Renderer3D {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private container!: HTMLElement;
  private cellMeshes: Map<string, CellMeshGroup> = new Map();
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private animationId: number = 0;
  private stars: StarData[] = [];
  private selectedCellId: string | null = null;
  private splitAnimations: {
    parentGroup: THREE.Group;
    child1Data: CellData;
    child2Data: CellData;
    parentPos: THREE.Vector3;
    startTime: number;
    duration: number;
    parentColor: THREE.Color;
    stretchAxis: THREE.Vector3;
  }[] = [];
  private diffAnimations: {
    cellId: string;
    targetColor: THREE.Color;
    startColor: THREE.Color;
    startTime: number;
    duration: number;
    startVertices?: Float32Array;
    targetVertices?: Float32Array;
    type: CellType;
  }[] = [];
  private fadeOverlay: HTMLDivElement | null = null;
  private disposed = false;

  init(container: HTMLElement): void {
    this.container = container;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );
    this.camera.position.set(0, 8, 18);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.zoomSpeed = 0.5;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 60;

    this.setupLighting();
    this.setupBackground();
    this.setupGrid();
    this.setupStars();
    this.setupFadeOverlay();

    this.listenEvents();
    this.animate();

    window.addEventListener('resize', () => this.resize());

    eventBus.emit(EventType.SCENE_READY);
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x404060, 1.2);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(10, 15, 10);
    this.scene.add(dir);

    const dir2 = new THREE.DirectionalLight(0x6688cc, 0.4);
    dir2.position.set(-8, 5, -6);
    this.scene.add(dir2);
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0A0A1A');
    grad.addColorStop(1, '#1A1A2E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.background = tex;
  }

  private setupGrid(): void {
    const size = 30;
    const divisions = 6;
    const gridHelper = new THREE.GridHelper(size, divisions, 0x3C4F5C, 0x3C4F5C);
    (gridHelper.material as THREE.LineBasicMaterial).transparent = true;
    (gridHelper.material as THREE.LineBasicMaterial).opacity = 0.2;
    gridHelper.position.y = -5;
    this.scene.add(gridHelper);
  }

  private setupStars(): void {
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      const size = 0.1 + Math.random() * 0.2;
      const period = 3 + Math.random() * 2;
      const phase = Math.random() * Math.PI * 2;
      const baseOpacity = 0.3 + Math.random() * 0.5;

      const geo = new THREE.SphereGeometry(size, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: baseOpacity,
      });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.set(
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80,
        (Math.random() - 0.5) * 80
      );

      this.scene.add(mesh);
      this.stars.push({
        mesh,
        baseOpacity,
        size,
        period,
        phase,
      });
    }
  }

  private setupFadeOverlay(): void {
    this.fadeOverlay = document.createElement('div');
    this.fadeOverlay.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      background: #0A0A1A; opacity: 0; pointer-events: none;
      transition: opacity 0.25s ease;
      z-index: 10;
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(this.fadeOverlay);
  }

  private createSphereGeometry(radius: number, segments: number): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(radius, segments, segments);
    this.applyNoiseVertices(geo);
    return geo;
  }

  private createEllipsoidGeometry(radius: number, ratioX: number, ratioY: number, ratioZ: number): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] *= ratioX;
      arr[i + 1] *= ratioY;
      arr[i + 2] *= ratioZ;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    this.applyNoiseVertices(geo);
    return geo;
  }

  private createSpindleGeometry(radius: number): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const y = arr[i + 1];
      const absY = Math.abs(y);
      const normY = absY / radius;
      const taper = 1 - Math.pow(normY, 1.8);
      const stretch = 1 + normY * 0.25;
      arr[i] *= taper;
      arr[i + 2] *= taper;
      arr[i + 1] = y * stretch;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    this.applyNoiseVertices(geo);
    return geo;
  }

  private createFlatGeometry(radius: number, heightRatio: number): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const y = arr[i + 1];
      const absY = Math.abs(y);
      const normY = absY / radius;
      const flatness = 1 - normY * 0.3;
      arr[i] *= flatness;
      arr[i + 2] *= flatness;
      arr[i + 1] *= heightRatio;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    this.applyNoiseVertices(geo);
    return geo;
  }

  private applyNoiseVertices(geometry: THREE.BufferGeometry): void {
    const pos = geometry.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i];
      const y = arr[i + 1];
      const z = arr[i + 2];
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len > 0) {
        const noise = 1 + (Math.random() - 0.5) * 0.04;
        arr[i] = x * noise;
        arr[i + 1] = y * noise;
        arr[i + 2] = z * noise;
      }
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  private createGeometryForType(type: CellType, radius: number = 1.25): THREE.BufferGeometry {
    switch (type) {
      case 'neuron':
        return this.createEllipsoidGeometry(radius, 1.5, 1, 1);
      case 'muscle':
        return this.createSpindleGeometry(radius);
      case 'epithelial':
        return this.createFlatGeometry(radius, 0.4);
      default:
        return this.createSphereGeometry(radius, 32);
    }
  }

  private createCellMesh(cellData: CellData, visible: boolean = true): CellMeshGroup {
    const group = new THREE.Group();
    group.visible = visible;

    const outerGeo = this.createGeometryForType(cellData.type);
    const outerMat = new THREE.MeshPhongMaterial({
      color: hexToThreeColor(cellData.color),
      transparent: true,
      opacity: 0.65,
      shininess: 40,
      specular: 0x333333,
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    group.add(outer);

    const innerRadius = 0.35;
    const innerGeo = new THREE.SphereGeometry(innerRadius, 16, 16);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x1a0a2e,
      transparent: true,
      opacity: 0.9,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    group.position.set(cellData.position.x, cellData.position.y, cellData.position.z);

    this.scene.add(group);

    const entry: CellMeshGroup = {
      outer,
      inner,
      group,
      cellId: cellData.id,
      data: { ...cellData },
      currentType: cellData.type,
    };

    this.cellMeshes.set(cellData.id, entry);
    return entry;
  }

  private morphGeometry(entry: CellMeshGroup, targetType: CellType): { start: Float32Array; target: Float32Array } {
    const currentGeo = entry.outer.geometry;
    const currentPos = currentGeo.attributes.position.array as Float32Array;
    const startVertices = new Float32Array(currentPos.length);
    startVertices.set(currentPos);

    const targetGeo = this.createGeometryForType(targetType);
    const targetPos = targetGeo.attributes.position.array as Float32Array;
    const targetVertices = new Float32Array(targetPos.length);
    targetVertices.set(targetPos);

    targetGeo.dispose();

    return { start: startVertices, target: targetVertices };
  }

  private listenEvents(): void {
    eventBus.on(EventType.CELL_CREATED, (payload) => {
      const cell = payload as CellData;
      this.createCellMesh(cell, true);
    });

    eventBus.on(EventType.CELL_REMOVED, (payload) => {
      const { cellId } = payload as { cellId: string };
      this.removeCellMesh(cellId);
    });

    eventBus.on(EventType.CELL_UPDATED, (payload) => {
      const { cell } = payload as { cell: CellData };
      this.updateCellAppearance(cell);
    });

    eventBus.on(EventType.CELL_SELECTED, (payload) => {
      const { cellId } = payload as { cellId: string | null };
      this.updateSelection(cellId);
    });

    eventBus.on(EventType.SPLIT_STARTED, (payload) => {
      const data = payload as SplitStartPayload;
      this.startSplitAnimation(data);
    });

    eventBus.on(EventType.DIFFERENTIATE_COMPLETED, (payload) => {
      const data = payload as DifferentiatePayload;
      this.startDifferentiationAnimation(data);
    });

    eventBus.on(EventType.RECORD_RESTORE_REQUESTED, () => {
      this.fadeOut();
    });

    eventBus.on(EventType.RECORD_RESTORED, (payload) => {
      const { cells } = payload as { cells: CellData[] };
      this.handleRestore(cells);
    });

    eventBus.on(EventType.RECORD_SAVED, (payload) => {
      const { recordId } = payload as { recordId: string };
      if (recordId) {
        this.captureThumbnailForSave(recordId);
      }
    });
  }

  private captureThumbnailForSave(recordId: string): void {
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png', 0.6);

    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2C2C3A';
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(0, 0, 60, 60, 8);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, 60, 60);
    }

    const img = new Image();
    img.onload = () => {
      const aspect = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (aspect > 1) {
        sx = (img.width - img.height) / 2;
        sw = img.height;
      } else {
        sy = (img.height - img.width) / 2;
        sh = img.width;
      }
      ctx.save();
      if (typeof ctx.beginPath === 'function' && typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(4, 4, 52, 52, 6);
        ctx.clip();
      }
      ctx.drawImage(img, sx, sy, sw, sh, 4, 4, 52, 52);
      ctx.restore();
      const thumbnail = canvas.toDataURL('image/png');
      eventBus.emit(EventType.THUMBNAIL_READY, { recordId, thumbnail });
    };
    img.src = dataUrl;
  }

  private removeCellMesh(cellId: string): void {
    const entry = this.cellMeshes.get(cellId);
    if (entry) {
      this.scene.remove(entry.group);
      entry.outer.geometry.dispose();
      (entry.outer.material as THREE.Material).dispose();
      entry.inner.geometry.dispose();
      (entry.inner.material as THREE.Material).dispose();
      if (entry.ring) {
        entry.ring.geometry.dispose();
        (entry.ring.material as THREE.Material).dispose();
      }
      this.cellMeshes.delete(cellId);
    }
  }

  private updateCellAppearance(cell: CellData): void {
    const entry = this.cellMeshes.get(cell.id);
    if (!entry) return;

    entry.data = { ...cell };

    if (entry.currentType !== cell.type) {
      const newGeo = this.createGeometryForType(cell.type);
      entry.outer.geometry.dispose();
      entry.outer.geometry = newGeo;
      entry.currentType = cell.type;
    }

    (entry.outer.material as THREE.MeshPhongMaterial).color.set(cell.color);
  }

  private updateSelection(cellId: string | null): void {
    const prevId = this.selectedCellId;
    if (prevId) {
      const prev = this.cellMeshes.get(prevId);
      if (prev && prev.ring) {
        prev.group.remove(prev.ring);
        prev.ring.geometry.dispose();
        (prev.ring.material as THREE.Material).dispose();
        prev.ring = undefined;
      }
    }

    this.selectedCellId = cellId;

    if (cellId) {
      const entry = this.cellMeshes.get(cellId);
      if (entry && !entry.ring) {
        const ringGeo = new THREE.RingGeometry(1.7, 2.0, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffa500,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        entry.group.add(ring);
        entry.ring = ring;
      }
    }
  }

  private startSplitAnimation(data: SplitStartPayload): void {
    const parentEntry = this.cellMeshes.get(data.parentId);
    if (!parentEntry) return;

    const parentPos = new THREE.Vector3(
      data.parentPosition.x,
      data.parentPosition.y,
      data.parentPosition.z
    );

    const parentColor = (parentEntry.outer.material as THREE.MeshPhongMaterial).color.clone();

    this.removeCellMesh(data.parentId);

    const tempGroup = new THREE.Group();
    tempGroup.position.copy(parentPos);

    const tempOuterGeo = this.createGeometryForType('default');
    const tempOuterMat = new THREE.MeshPhongMaterial({
      color: parentColor.clone(),
      transparent: true,
      opacity: 0.65,
      shininess: 40,
      specular: 0x333333,
    });
    const tempOuter = new THREE.Mesh(tempOuterGeo, tempOuterMat);
    tempGroup.add(tempOuter);

    const tempInnerGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const tempInnerMat = new THREE.MeshPhongMaterial({
      color: 0x1a0a2e,
      transparent: true,
      opacity: 0.9,
    });
    const tempInner = new THREE.Mesh(tempInnerGeo, tempInnerMat);
    tempGroup.add(tempInner);

    this.scene.add(tempGroup);

    this.createCellMesh(data.child1, false);
    this.createCellMesh(data.child2, false);

    const stretchAxis = new THREE.Vector3(
      data.child1.position.x - data.child2.position.x,
      data.child1.position.y - data.child2.position.y,
      data.child1.position.z - data.child2.position.z
    ).normalize();

    this.splitAnimations.push({
      parentGroup: tempGroup,
      child1Data: data.child1,
      child2Data: data.child2,
      parentPos: parentPos.clone(),
      startTime: performance.now(),
      duration: 2000,
      parentColor: parentColor.clone(),
      stretchAxis,
    });
  }

  private startDifferentiationAnimation(data: DifferentiatePayload): void {
    const entry = this.cellMeshes.get(data.cellId);
    if (!entry) return;

    const startColor = (entry.outer.material as THREE.MeshPhongMaterial).color.clone();
    const targetColor = hexToThreeColor(data.targetColor);

    const { start, target } = this.morphGeometry(entry, data.cellType);

    this.diffAnimations.push({
      cellId: data.cellId,
      targetColor,
      startColor,
      startTime: performance.now(),
      duration: 800,
      startVertices: start,
      targetVertices: target,
      type: data.cellType,
    });
  }

  private fadeOut(): void {
    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '1';
    }
  }

  private fadeIn(): void {
    if (this.fadeOverlay) {
      this.fadeOverlay.style.opacity = '0';
    }
  }

  private handleRestore(cells: CellData[]): void {
    const existingIds = new Set(this.cellMeshes.keys());
    const newIds = new Set(cells.map(c => c.id));

    for (const id of existingIds) {
      if (!newIds.has(id)) {
        this.removeCellMesh(id);
      }
    }

    for (const cell of cells) {
      const existing = this.cellMeshes.get(cell.id);
      if (existing) {
        (existing.outer.material as THREE.MeshPhongMaterial).color.set(cell.color);
        existing.group.position.set(cell.position.x, cell.position.y, cell.position.z);
        existing.data = { ...cell };

        if (existing.currentType !== cell.type) {
          const newGeo = this.createGeometryForType(cell.type);
          existing.outer.geometry.dispose();
          existing.outer.geometry = newGeo;
          existing.currentType = cell.type;
        }
      } else {
        this.createCellMesh(cell, true);
      }
    }

    this.selectedCellId = null;
    this.fadeIn();
  }

  private animate = (): void => {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    this.controls.update();
    this.updateStars(now);
    this.updateRingPulse(now);
    this.updateSplitAnimations(now);
    this.updateDiffAnimations(now);

    this.renderer.render(this.scene, this.camera);
  };

  private updateStars(now: number): void {
    const t = now / 1000;
    for (const star of this.stars) {
      const val = Math.sin((t / star.period) * Math.PI * 2 + star.phase);
      const opacity = star.baseOpacity * (0.3 + 0.7 * (0.5 + 0.5 * val));
      (star.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }

  private updateRingPulse(now: number): void {
    if (!this.selectedCellId) return;
    const entry = this.cellMeshes.get(this.selectedCellId);
    if (!entry || !entry.ring) return;

    const freq = 1.5;
    const t = now / 1000;
    const pulse = 0.5 + 0.5 * Math.sin(t * freq * Math.PI * 2);
    const mat = entry.ring.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.3 + 0.5 * pulse;
    const s = 1 + 0.08 * pulse;
    entry.ring.scale.set(s, s, s);
  }

  private updateSplitAnimations(now: number): void {
    const completed: number[] = [];

    for (let i = 0; i < this.splitAnimations.length; i++) {
      const anim = this.splitAnimations[i];
      const elapsed = now - anim.startTime;
      const rawProgress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = easeInOutCubic(rawProgress);

      const stretchProgress = easeInOutCubic(Math.min(rawProgress * 2.5, 1));
      const separateProgress = easeInOutCubic(Math.max((rawProgress - 0.35) / 0.65, 0));

      const scaleX = 1 + stretchProgress * 0.7;
      const scaleY = 1 - stretchProgress * 0.25;
      const scaleZ = 1 - stretchProgress * 0.25;

      if (rawProgress < 0.6) {
        anim.parentGroup.scale.set(scaleX, scaleY, scaleZ);
      } else {
        const fadeProgress = easeInOutCubic((rawProgress - 0.6) / 0.4);
        const fadeScale = 1 - fadeProgress * 0.3;
        anim.parentGroup.scale.set(
          scaleX * fadeScale,
          scaleY * fadeScale,
          scaleZ * fadeScale
        );
        const parentOuter = anim.parentGroup.children[0] as THREE.Mesh;
        const parentInner = anim.parentGroup.children[1] as THREE.Mesh;
        (parentOuter.material as THREE.MeshPhongMaterial).opacity = 0.65 * (1 - fadeProgress);
      }

      const child1Entry = this.cellMeshes.get(anim.child1Data.id);
      const child2Entry = this.cellMeshes.get(anim.child2Data.id);

      if (child1Entry && child2Entry && separateProgress > 0) {
        child1Entry.group.visible = true;
        child2Entry.group.visible = true;

        const appearProgress = easeInOutCubic(Math.min(separateProgress * 1.5, 1)) ;
        child1Entry.group.scale.setScalar(appearProgress);
        child2Entry.group.scale.setScalar(appearProgress);

        const offset1 = new THREE.Vector3(
          anim.child1Data.position.x - anim.parentPos.x,
          anim.child1Data.position.y - anim.parentPos.y,
          anim.child1Data.position.z - anim.parentPos.z
        ).multiplyScalar(separateProgress);

        const offset2 = new THREE.Vector3(
          anim.child2Data.position.x - anim.parentPos.x,
          anim.child2Data.position.y - anim.parentPos.y,
          anim.child2Data.position.z - anim.parentPos.z
        ).multiplyScalar(separateProgress);

        child1Entry.group.position.copy(anim.parentPos).add(offset1);
        child2Entry.group.position.copy(anim.parentPos).add(offset2);

        const childMat1 = child1Entry.outer.material as THREE.MeshPhongMaterial;
        const childMat2 = child2Entry.outer.material as THREE.MeshPhongMaterial;
        childMat1.opacity = 0.65 * appearProgress;
        childMat2.opacity = 0.65 * appearProgress;
      }

      if (rawProgress >= 1) {
        completed.push(i);
        this.scene.remove(anim.parentGroup);
        const parentOuter = anim.parentGroup.children[0] as THREE.Mesh;
        const parentInner = anim.parentGroup.children[1] as THREE.Mesh;
        parentOuter.geometry.dispose();
        (parentOuter.material as THREE.Material).dispose();
        parentInner.geometry.dispose();
        (parentInner.material as THREE.Material).dispose();

        if (child1Entry) {
          child1Entry.group.position.set(
            anim.child1Data.position.x,
            anim.child1Data.position.y,
            anim.child1Data.position.z
          );
          child1Entry.group.scale.set(1, 1, 1);
          (child1Entry.outer.material as THREE.MeshPhongMaterial).opacity = 0.65;
        }
        if (child2Entry) {
          child2Entry.group.position.set(
            anim.child2Data.position.x,
            anim.child2Data.position.y,
            anim.child2Data.position.z
          );
          child2Entry.group.scale.set(1, 1, 1);
          (child2Entry.outer.material as THREE.MeshPhongMaterial).opacity = 0.65;
        }
      }
    }

    for (let i = completed.length - 1; i >= 0; i--) {
      this.splitAnimations.splice(completed[i], 1);
    }
  }

  private updateDiffAnimations(now: number): void {
    const completed: number[] = [];

    for (let i = 0; i < this.diffAnimations.length; i++) {
      const anim = this.diffAnimations[i];
      const entry = this.cellMeshes.get(anim.cellId);
      if (!entry || !anim.startVertices || !anim.targetVertices) {
        completed.push(i);
        continue;
      }

      const elapsed = now - anim.startTime;
      const rawProgress = Math.min(elapsed / anim.duration, 1);
      const easedProgress = easeInOutCubic(rawProgress);

      const mat = entry.outer.material as THREE.MeshPhongMaterial;
      mat.color.copy(anim.startColor).lerp(anim.targetColor, easedProgress);

      const posAttr = entry.outer.geometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      const start = anim.startVertices;
      const target = anim.targetVertices;

      for (let j = 0; j < arr.length; j++) {
        arr[j] = start[j] + (target[j] - start[j]) * easedProgress;
      }
      posAttr.needsUpdate = true;
      entry.outer.geometry.computeVertexNormals();

      if (rawProgress >= 1) {
        completed.push(i);
        entry.currentType = anim.type;
      }
    }

    for (let i = completed.length - 1; i >= 0; i--) {
      this.diffAnimations.splice(completed[i], 1);
    }
  }

  handleClick(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes: THREE.Mesh[] = [];
    this.cellMeshes.forEach(entry => {
      if (entry.group.visible) {
        meshes.push(entry.outer);
      }
    });

    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      for (const [id, entry] of this.cellMeshes) {
        if (entry.outer === hit) {
          eventBus.emit(EventType.SCENE_CELL_CLICKED, { cellId: id });
          return;
        }
      }
    }

    eventBus.emit(EventType.SCENE_CELL_CLICKED, { cellId: null });
  }

  resize(): void {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    this.cellMeshes.forEach(entry => {
      entry.outer.geometry.dispose();
      (entry.outer.material as THREE.Material).dispose();
      entry.inner.geometry.dispose();
      (entry.inner.material as THREE.Material).dispose();
      if (entry.ring) {
        entry.ring.geometry.dispose();
        (entry.ring.material as THREE.Material).dispose();
      }
    });
    this.renderer.dispose();
    this.controls.dispose();
  }
}

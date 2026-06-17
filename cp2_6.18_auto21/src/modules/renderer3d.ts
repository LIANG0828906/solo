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
  private stars: { mesh: THREE.Mesh; baseOpacity: number; period: number; phase: number }[] = [];
  private selectedCellId: string | null = null;
  private ringTime: number = 0;
  private splitAnimations: {
    parentGroup: THREE.Group;
    child1Data: CellData;
    child2Data: CellData;
    parentPos: THREE.Vector3;
    startTime: number;
    duration: number;
  }[] = [];
  private diffAnimations: {
    cellId: string;
    targetColor: THREE.Color;
    targetScale: THREE.Vector3;
    startColor: THREE.Color;
    startScale: THREE.Vector3;
    startTime: number;
    duration: number;
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

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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

      const geo = new THREE.SphereGeometry(size, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4 + Math.random() * 0.4,
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
        baseOpacity: mat.opacity,
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
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(this.fadeOverlay);
  }

  private createCellMesh(cellData: CellData, visible: boolean = true): CellMeshGroup {
    const group = new THREE.Group();
    group.visible = visible;

    const outerGeo = new THREE.SphereGeometry(1.25, 32, 32);
    const outerMat = new THREE.MeshPhongMaterial({
      color: hexToThreeColor(cellData.color),
      transparent: true,
      opacity: 0.65,
      shininess: 40,
      specular: 0x333333,
    });
    this.applyNoiseVertices(outerGeo);
    const outer = new THREE.Mesh(outerGeo, outerMat);
    group.add(outer);

    const innerGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const innerMat = new THREE.MeshPhongMaterial({
      color: 0x1a0a2e,
      transparent: true,
      opacity: 0.9,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    group.position.set(cellData.position.x, cellData.position.y, cellData.position.z);
    group.scale.set(cellData.scale.x, cellData.scale.y, cellData.scale.z);

    this.scene.add(group);

    const entry: CellMeshGroup = {
      outer,
      inner,
      group,
      cellId: cellData.id,
      data: cellData,
    };

    this.cellMeshes.set(cellData.id, entry);
    return entry;
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

  private createSpindleGeometry(): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(1.25, 32, 32);
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const y = arr[i + 1];
      const absY = Math.abs(y);
      const taper = 1 - Math.pow(absY / 1.25, 1.8);
      arr[i] *= taper;
      arr[i + 2] *= taper;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
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

    eventBus.on(EventType.SPLIT_COMPLETED, () => {});

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
      this.generateThumbnail(recordId);
    });
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

    entry.data = cell;

    if (cell.type === 'muscle') {
      const newGeo = this.createSpindleGeometry();
      this.applyNoiseVertices(newGeo);
      entry.outer.geometry.dispose();
      entry.outer.geometry = newGeo;
    }

    entry.group.scale.set(cell.scale.x, cell.scale.y, cell.scale.z);
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
        const ringGeo = new THREE.RingGeometry(1.6, 1.85, 48);
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

    const parentGroup = parentEntry.group;
    const parentPos = new THREE.Vector3(
      data.parentPosition.x,
      data.parentPosition.y,
      data.parentPosition.z
    );

    parentGroup.scale.set(1, 1, 1);

    this.removeCellMesh(data.parentId);

    const tempGroup = new THREE.Group();
    tempGroup.position.copy(parentPos);

    const tempOuterGeo = new THREE.SphereGeometry(1.25, 32, 32);
    this.applyNoiseVertices(tempOuterGeo);
    const tempOuterMat = new THREE.MeshPhongMaterial({
      color: hexToThreeColor(data.parentColor),
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

    const child1Entry = this.createCellMesh(data.child1, false);
    const child2Entry = this.createCellMesh(data.child2, false);

    this.splitAnimations.push({
      parentGroup: tempGroup,
      child1Data: data.child1,
      child2Data: data.child2,
      parentPos,
      startTime: performance.now(),
      duration: 2000,
    });
  }

  private startDifferentiationAnimation(data: DifferentiatePayload): void {
    const entry = this.cellMeshes.get(data.cellId);
    if (!entry) return;

    const startColor = (entry.outer.material as THREE.MeshPhongMaterial).color.clone();
    const startScale = entry.group.scale.clone();
    const targetColor = hexToThreeColor(data.targetColor);
    const targetScale = new THREE.Vector3(
      data.targetScale.x,
      data.targetScale.y,
      data.targetScale.z
    );

    if (data.cellType === 'muscle') {
      const newGeo = this.createSpindleGeometry();
      this.applyNoiseVertices(newGeo);
      entry.outer.geometry.dispose();
      entry.outer.geometry = newGeo;
    }

    this.diffAnimations.push({
      cellId: data.cellId,
      targetColor,
      targetScale,
      startColor,
      startScale,
      startTime: performance.now(),
      duration: 800,
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
        existing.group.scale.set(cell.scale.x, cell.scale.y, cell.scale.z);
        existing.group.position.set(cell.position.x, cell.position.y, cell.position.z);
        existing.data = cell;

        if (cell.type === 'muscle' && existing.data.type !== 'muscle') {
          const newGeo = this.createSpindleGeometry();
          this.applyNoiseVertices(newGeo);
          existing.outer.geometry.dispose();
          existing.outer.geometry = newGeo;
        } else if (cell.type !== 'muscle' && existing.data.type === 'muscle') {
          const newGeo = new THREE.SphereGeometry(1.25, 32, 32);
          this.applyNoiseVertices(newGeo);
          existing.outer.geometry.dispose();
          existing.outer.geometry = newGeo;
        }
      } else {
        this.createCellMesh(cell, true);
      }
    }

    this.selectedCellId = null;
    this.fadeIn();
  }

  private generateThumbnail(recordId: string): void {
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png', 0.5);

    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2C2C3A';
    ctx.beginPath();
    ctx.roundRect(0, 0, 60, 60, 8);
    ctx.fill();

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
      ctx.drawImage(img, sx, sy, sw, sh, 4, 4, 52, 52);
      const thumbnail = canvas.toDataURL('image/png');
      eventBus.emit(EventType.RECORD_SAVED, { recordId, thumbnail });
    };
    img.src = dataUrl;
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
    const s = 1 + 0.08 * Math.sin(t * freq * Math.PI * 2);
    entry.ring.scale.set(s, s, s);
  }

  private updateSplitAnimations(now: number): void {
    const completed: number[] = [];

    for (let i = 0; i < this.splitAnimations.length; i++) {
      const anim = this.splitAnimations[i];
      const elapsed = now - anim.startTime;
      const rawProgress = Math.min(elapsed / anim.duration, 1);
      const progress = easeInOutCubic(rawProgress);

      const stretchPhase = Math.min(progress * 2, 1);
      const separatePhase = Math.max((progress - 0.5) * 2, 0);

      const scaleX = 1 + stretchPhase * 0.6;
      const scaleY = 1 - stretchPhase * 0.15;
      const scaleZ = 1 - stretchPhase * 0.15;
      anim.parentGroup.scale.set(scaleX, scaleY, scaleZ);

      if (progress >= 0.5) {
        anim.parentGroup.scale.set(
          scaleX * (1 - separatePhase),
          scaleY * (1 - separatePhase * 0.5),
          scaleZ * (1 - separatePhase * 0.5)
        );

        const child1Entry = this.cellMeshes.get(anim.child1Data.id);
        const child2Entry = this.cellMeshes.get(anim.child2Data.id);

        if (child1Entry && child2Entry) {
          child1Entry.group.visible = true;
          child2Entry.group.visible = true;

          const childScaleVal = separatePhase;
          child1Entry.group.scale.set(
            anim.child1Data.scale.x * childScaleVal,
            anim.child1Data.scale.y * childScaleVal,
            anim.child1Data.scale.z * childScaleVal
          );
          child2Entry.group.scale.set(
            anim.child2Data.scale.x * childScaleVal,
            anim.child2Data.scale.y * childScaleVal,
            anim.child2Data.scale.z * childScaleVal
          );

          const offset1 = new THREE.Vector3(
            anim.child1Data.position.x - anim.parentPos.x,
            anim.child1Data.position.y - anim.parentPos.y,
            anim.child1Data.position.z - anim.parentPos.z
          ).multiplyScalar(separatePhase);

          const offset2 = new THREE.Vector3(
            anim.child2Data.position.x - anim.parentPos.x,
            anim.child2Data.position.y - anim.parentPos.y,
            anim.child2Data.position.z - anim.parentPos.z
          ).multiplyScalar(separatePhase);

          child1Entry.group.position.copy(anim.parentPos).add(offset1);
          child2Entry.group.position.copy(anim.parentPos).add(offset2);
        }
      }

      if (rawProgress >= 1) {
        completed.push(i);
        this.scene.remove(anim.parentGroup);

        const child1Entry = this.cellMeshes.get(anim.child1Data.id);
        const child2Entry = this.cellMeshes.get(anim.child2Data.id);
        if (child1Entry) {
          child1Entry.group.position.set(
            anim.child1Data.position.x,
            anim.child1Data.position.y,
            anim.child1Data.position.z
          );
          child1Entry.group.scale.set(
            anim.child1Data.scale.x,
            anim.child1Data.scale.y,
            anim.child1Data.scale.z
          );
        }
        if (child2Entry) {
          child2Entry.group.position.set(
            anim.child2Data.position.x,
            anim.child2Data.position.y,
            anim.child2Data.position.z
          );
          child2Entry.group.scale.set(
            anim.child2Data.scale.x,
            anim.child2Data.scale.y,
            anim.child2Data.scale.z
          );
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
      if (!entry) {
        completed.push(i);
        continue;
      }

      const elapsed = now - anim.startTime;
      const rawProgress = Math.min(elapsed / anim.duration, 1);
      const progress = easeInOutCubic(rawProgress);

      const mat = entry.outer.material as THREE.MeshPhongMaterial;
      mat.color.copy(anim.startColor).lerp(anim.targetColor, progress);

      entry.group.scale.set(
        anim.startScale.x + (anim.targetScale.x - anim.startScale.x) * progress,
        anim.startScale.y + (anim.targetScale.y - anim.startScale.y) * progress,
        anim.startScale.z + (anim.targetScale.z - anim.startScale.z) * progress
      );

      if (rawProgress >= 1) {
        completed.push(i);
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

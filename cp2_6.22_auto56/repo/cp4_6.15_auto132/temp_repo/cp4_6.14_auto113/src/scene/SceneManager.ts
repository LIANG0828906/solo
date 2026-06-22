import * as THREE from 'three';
import { globalEvents, FragmentData } from '../types';

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public fragments: Map<string, FragmentData> = new Map();
  public matchLines: Map<string, THREE.Line> = new Map();
  public textureHighlights: Map<string, THREE.Mesh> = new Map();

  private container: HTMLElement;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private gridHelper: THREE.GridHelper;
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;
  private fpsAccum: number = 0;
  private fpsFrames: number = 0;

  private defaultCameraPos = new THREE.Vector3(10, 10, 15);
  private defaultCameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraAnimating = false;
  private cameraAnimStart: THREE.Vector3 = new THREE.Vector3();
  private cameraAnimEnd: THREE.Vector3 = new THREE.Vector3();
  private cameraAnimProgress = 0;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mouseNDC: THREE.Vector2 = new THREE.Vector2();
  private mouseScreen: { x: number; y: number } = { x: 0, y: 0 };
  private isDragging = false;
  private isRightDragging = false;
  private dragStart = { x: 0, y: 0 };
  private selectedFragmentId: string | null = null;
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private dragOffset = new THREE.Vector3();
  private dragIntersect = new THREE.Vector3();

  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;

  public onFragmentSelect?: (id: string | null) => void;
  public onFragmentTransform?: (id: string) => void;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId) as HTMLElement;
    if (!this.container) throw new Error(`Container ${containerId} not found`);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.copy(this.defaultCameraPos);
    this.camera.lookAt(this.defaultCameraTarget);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    this.directionalLight.position.set(8, 15, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.set(1024, 1024);
    this.directionalLight.shadow.camera.left = -20;
    this.directionalLight.shadow.camera.right = 20;
    this.directionalLight.shadow.camera.top = 20;
    this.directionalLight.shadow.camera.bottom = -20;
    this.scene.add(this.directionalLight);

    this.gridHelper = new THREE.GridHelper(40, 40, 0x334155, 0x1e293b);
    this.scene.add(this.gridHelper);

    this.minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
    this.minimapCtx = this.minimapCanvas.getContext('2d') as CanvasRenderingContext2D;

    this.setupEvents();
    this.animate();
  }

  private setupEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
    canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    window.addEventListener('resize', () => this.onResize());

    document.addEventListener('click', () => {
      const menu = document.getElementById('context-menu');
      if (menu) menu.style.display = 'none';
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateMouseNDC(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseScreen = { x: e.clientX, y: e.clientY };
    this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onMouseDown(e: MouseEvent): void {
    this.updateMouseNDC(e);

    if (e.button === 0) {
      this.raycaster.setFromCamera(this.mouseNDC, this.camera);
      const hit = this.pickFragment();

      if (hit) {
        this.selectFragment(hit.id);
        this.isDragging = true;
        this.dragStart = { x: e.clientX, y: e.clientY };

        const worldPos = new THREE.Vector3();
        hit.mesh.getWorldPosition(worldPos);
        this.dragPlane.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          worldPos
        );
        this.raycaster.setFromCamera(this.mouseNDC, this.camera);
        this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersect);
        this.dragOffset.copy(worldPos).sub(this.dragIntersect);
      } else {
        this.selectFragment(null);
      }
    } else if (e.button === 2 && this.selectedFragmentId) {
      this.isRightDragging = true;
      this.dragStart = { x: e.clientX, y: e.clientY };
    }
  }

  private onMouseMove(e: MouseEvent): void {
    this.updateMouseNDC(e);

    if (this.isDragging && this.selectedFragmentId) {
      this.raycaster.setFromCamera(this.mouseNDC, this.camera);
      const point = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, point)) {
        const frag = this.fragments.get(this.selectedFragmentId);
        if (frag) {
          const target = point.clone().add(this.dragOffset);
          const current = new THREE.Vector3();
          frag.mesh.getWorldPosition(current);
          const lerped = current.lerp(target, 0.15);
          frag.mesh.position.copy(lerped);
          this.updateFragmentBoundingBox(frag);
          this.onFragmentTransform?.(this.selectedFragmentId);
          globalEvents.emit('fragment:transformed', this.selectedFragmentId);
        }
      }
    } else if (this.isRightDragging && this.selectedFragmentId) {
      const dx = e.clientX - this.dragStart.x;
      this.dragStart = { x: e.clientX, y: e.clientY };
      const frag = this.fragments.get(this.selectedFragmentId);
      if (frag) {
        const angleDelta = (dx * 0.5 * Math.PI) / 180;
        frag.mesh.rotateY(angleDelta);
        this.updateFragmentBoundingBox(frag);
        this.onFragmentTransform?.(this.selectedFragmentId);
        globalEvents.emit('fragment:transformed', this.selectedFragmentId);
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    this.isDragging = false;
    this.isRightDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    if (!this.selectedFragmentId) return;
    const frag = this.fragments.get(this.selectedFragmentId);
    if (!frag) return;

    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    frag.mesh.scale.multiplyScalar(delta);
    frag.mesh.scale.clampScalar(0.3, 3.0);
    this.updateFragmentBoundingBox(frag);
    this.onFragmentTransform?.(this.selectedFragmentId);
    globalEvents.emit('fragment:transformed', this.selectedFragmentId);
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    this.updateMouseNDC(e);
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hit = this.pickFragment();

    if (hit && hit.groupId !== null) {
      const menu = document.getElementById('context-menu') as HTMLElement;
      menu.style.display = 'block';
      menu.style.left = `${e.clientX}px`;
      menu.style.top = `${e.clientY}px`;

      const splitBtn = document.getElementById('menu-split');
      if (splitBtn) {
        splitBtn.onclick = (ev) => {
          ev.stopPropagation();
          globalEvents.emit('group:split', hit.groupId);
          menu.style.display = 'none';
        };
      }
    }
  }

  private pickFragment(): FragmentData | null {
    const meshes: THREE.Object3D[] = [];
    this.fragments.forEach((f) => meshes.push(f.mesh));
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits.length === 0) return null;

    let hitObj: THREE.Object3D | null = hits[0].object;
    while (hitObj && hitObj.parent && !this.fragments.has((hitObj as any).userData?.fragmentId)) {
      hitObj = hitObj.parent;
    }
    const id = (hitObj as any)?.userData?.fragmentId;
    return id ? this.fragments.get(id) || null : null;
  }

  public selectFragment(id: string | null): void {
    this.fragments.forEach((f, fid) => {
      if (f.highlightWire) {
        const mat = f.highlightWire.material as THREE.LineBasicMaterial;
        if (fid === id) {
          mat.color.setHex(0xfbbf24);
          mat.opacity = 1;
        } else {
          mat.opacity = 0;
        }
      }
    });
    this.selectedFragmentId = id;
    this.onFragmentSelect?.(id);
    globalEvents.emit('fragment:selected', id);
  }

  public addFragment(mesh: THREE.Group, id: string, position: THREE.Vector3): FragmentData {
    mesh.userData.fragmentId = id;
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const bbox = this.computeBoundingBox(mesh);
    const { edgeVertices, averageNormal, vertexCount, hasTexture, textureData } = this.analyzeFragment(mesh);

    const wireframe = this.createWireframe(mesh, 0xfbbf24, 2);
    wireframe.visible = true;
    (wireframe.material as THREE.LineBasicMaterial).opacity = 0;
    (wireframe.material as THREE.LineBasicMaterial).transparent = true;
    mesh.add(wireframe);

    const data: FragmentData = {
      id,
      mesh,
      boundingBox: bbox,
      edgeVertices,
      averageNormal,
      vertexCount,
      hasTexture,
      textureData,
      highlightWire: wireframe,
      groupId: null,
    };

    this.fragments.set(id, data);
    globalEvents.emit('fragment:added', data);
    return data;
  }

  private createWireframe(mesh: THREE.Group, color: number, _linewidth: number): THREE.LineSegments {
    const edges: THREE.Vector3[][] = [];
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geo = child.geometry;
        const edge = new THREE.EdgesGeometry(geo, 30);
        const positions = edge.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i < positions.count; i += 2) {
          const v1 = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i));
          const v2 = new THREE.Vector3(positions.getX(i + 1), positions.getY(i + 1), positions.getZ(i + 1));
          child.localToWorld(v1);
          child.localToWorld(v2);
          mesh.worldToLocal(v1);
          mesh.worldToLocal(v2);
          edges.push([v1, v2]);
        }
      }
    });

    const positions: number[] = [];
    edges.forEach(([a, b]) => {
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    return new THREE.LineSegments(geo, mat);
  }

  private computeBoundingBox(mesh: THREE.Group): THREE.Box3 {
    const box = new THREE.Box3();
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        child.geometry.computeBoundingBox();
        const localBox = child.geometry.boundingBox!.clone();
        localBox.applyMatrix4(child.matrixWorld);
        box.union(localBox);
      }
    });
    return box;
  }

  private updateFragmentBoundingBox(frag: FragmentData): void {
    frag.mesh.updateMatrixWorld(true);
    frag.boundingBox = this.computeBoundingBox(frag.mesh);
  }

  private analyzeFragment(mesh: THREE.Group) {
    const edgeVertices: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    let vertexCount = 0;
    let hasTexture = false;
    let textureData: ImageData | null = null;

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geo = child.geometry;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
        vertexCount += posAttr.count;

        const indices: number[] = [];
        if (geo.index) {
          for (let i = 0; i < geo.index.count; i++) indices.push(geo.index.getX(i));
        } else {
          for (let i = 0; i < posAttr.count; i++) indices.push(i);
        }

        const edgeMap = new Map<string, number>();
        for (let i = 0; i < indices.length; i += 3) {
          const faces = [
            [indices[i], indices[i + 1]],
            [indices[i + 1], indices[i + 2]],
            [indices[i + 2], indices[i]],
          ];
          faces.forEach(([a, b]) => {
            const key = a < b ? `${a}_${b}` : `${b}_${a}`;
            edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
          });
        }

        const added = new Set<number>();
        edgeMap.forEach((count, key) => {
          if (count === 1) {
            const [a, b] = key.split('_').map(Number);
            if (!added.has(a)) {
              const v = new THREE.Vector3(
                posAttr.getX(a),
                posAttr.getY(a),
                posAttr.getZ(a)
              );
              child.localToWorld(v);
              mesh.worldToLocal(v);
              edgeVertices.push(v);
              added.add(a);
            }
            if (!added.has(b)) {
              const v = new THREE.Vector3(
                posAttr.getX(b),
                posAttr.getY(b),
                posAttr.getZ(b)
              );
              child.localToWorld(v);
              mesh.worldToLocal(v);
              edgeVertices.push(v);
              added.add(b);
            }
            if (normAttr) {
              const n = new THREE.Vector3(
                normAttr.getX(a),
                normAttr.getY(a),
                normAttr.getZ(a)
              );
              normals.push(n);
            }
          }
        });

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => {
            if (m.map) hasTexture = true;
          });
        }
      }
    });

    let averageNormal = new THREE.Vector3(0, 1, 0);
    if (normals.length > 0) {
      averageNormal = normals.reduce((acc, n) => acc.add(n), new THREE.Vector3())
        .normalize();
    }

    return { edgeVertices, averageNormal, vertexCount, hasTexture, textureData };
  }

  public clearMatchLines(): void {
    this.matchLines.forEach((line) => this.scene.remove(line));
    this.matchLines.clear();
  }

  public addMatchLine(key: string, a: THREE.Vector3, b: THREE.Vector3): void {
    if (this.matchLines.has(key)) {
      const line = this.matchLines.get(key)!;
      const pos = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      pos.setXYZ(0, a.x, a.y, a.z);
      pos.setXYZ(1, b.x, b.y, b.z);
      pos.needsUpdate = true;
      return;
    }

    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    const mat = new THREE.LineDashedMaterial({
      color: 0x22c55e,
      dashSize: 0.3,
      gapSize: 0.2,
      linewidth: 1,
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    this.scene.add(line);
    this.matchLines.set(key, line);
  }

  public removeMatchLine(key: string): void {
    const line = this.matchLines.get(key);
    if (line) {
      this.scene.remove(line);
      this.matchLines.delete(key);
    }
  }

  public highlightMatchLine(key: string, highlight: boolean): void {
    const line = this.matchLines.get(key);
    if (line) {
      const mat = line.material as THREE.LineDashedMaterial;
      mat.color.setHex(highlight ? 0xfbbf24 : 0x22c55e);
    }
  }

  public addTextureHighlight(fragAId: string, fragBId: string, posA: THREE.Vector3, posB: THREE.Vector3): void {
    const key = `${fragAId}_${fragBId}_tex`;
    if (this.textureHighlights.has(key)) return;

    const mid = posA.clone().add(posB).multiplyScalar(0.5);
    const dir = posB.clone().sub(posA);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.02, 0.02, len, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.4,
    });
    const cyl = new THREE.Mesh(geo, mat);
    cyl.position.copy(mid);
    cyl.lookAt(posB);
    cyl.rotateX(Math.PI / 2);
    this.scene.add(cyl);
    this.textureHighlights.set(key, cyl);
  }

  public clearTextureHighlights(): void {
    this.textureHighlights.forEach((m) => this.scene.remove(m));
    this.textureHighlights.clear();
  }

  public resetCamera(): void {
    this.cameraAnimating = true;
    this.cameraAnimProgress = 0;
    this.cameraAnimStart.copy(this.camera.position);
    this.cameraAnimEnd.copy(this.defaultCameraPos);
  }

  public degradeShadows(): void {
    this.renderer.shadowMap.enabled = false;
  }

  public restoreShadows(): void {
    this.renderer.shadowMap.enabled = true;
  }

  public getFPS(): number {
    return this.fps;
  }

  private updateMinimap(): void {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * w;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke();
    }

    const scale = w / 30;
    const cx = w / 2;
    const cy = h / 2;
    const matchedIds = new Set<string>();
    this.matchLines.forEach((_line, key) => {
      const [a, b] = key.split('_');
      matchedIds.add(a); matchedIds.add(b);
    });

    this.fragments.forEach((f, id) => {
      const x = cx + f.mesh.position.x * scale;
      const y = cy - f.mesh.position.z * scale;
      let color = '#64748b';
      if (id === this.selectedFragmentId) color = '#fbbf24';
      else if (matchedIds.has(id)) color = '#22c55e';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private animate = (): void => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.fpsAccum += delta;
    this.fpsFrames++;
    if (this.fpsAccum >= 500) {
      this.fps = (this.fpsFrames * 1000) / this.fpsAccum;
      this.fpsAccum = 0;
      this.fpsFrames = 0;
      const fpsEl = document.getElementById('fps-counter');
      if (fpsEl) fpsEl.textContent = `FPS: ${this.fps.toFixed(0)}`;
    }

    if (this.cameraAnimating) {
      this.cameraAnimProgress += delta / 1000;
      if (this.cameraAnimProgress >= 1) {
        this.cameraAnimProgress = 1;
        this.cameraAnimating = false;
      }
      const t = this.cameraAnimProgress;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.camera.position.lerpVectors(this.cameraAnimStart, this.cameraAnimEnd, ease);
      this.camera.lookAt(this.defaultCameraTarget);
    }

    this.fragments.forEach((f) => {
      if (f.highlightWire && f.id === this.selectedFragmentId) {
        const mat = f.highlightWire.material as THREE.LineBasicMaterial;
        mat.opacity = 0.7 + 0.3 * Math.sin(now / 300);
      }
    });

    this.renderer.render(this.scene, this.camera);
    this.updateMinimap();
  };

  public dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.renderer.dispose();
  }
}

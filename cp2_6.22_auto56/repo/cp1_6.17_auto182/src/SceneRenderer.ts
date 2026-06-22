import * as THREE from 'three';
import type { StarMapManager, StarPoint, StarConnection } from './StarMapManager';

interface StarMeshGroup {
  mesh: THREE.Mesh;
  halo: THREE.Mesh;
  label: HTMLDivElement | null;
}

interface ConnectionMeshGroup {
  line: THREE.Line;
  glow: THREE.Line;
  particles: THREE.Points | null;
  particleTime: number;
  pulseTime: number;
}

interface RippleEffect {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

type HitTarget =
  | { type: 'star'; id: string }
  | { type: 'gridSphere' }
  | { type: 'none' };

export class SceneRenderer {
  private container: HTMLElement;
  private manager: StarMapManager;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private clock: THREE.Clock;
  private bgParticles!: THREE.Points;
  private bgParticleData!: Float32Array;
  private bgTwinkleData!: Float32Array;
  private gridSphere!: THREE.LineSegments;
  private starMeshes: Map<string, StarMeshGroup> = new Map();
  private connectionMeshes: Map<string, ConnectionMeshGroup> = new Map();
  private ripples: RippleEffect[] = [];
  private labelLayer: HTMLDivElement;
  private animId = 0;
  private onResize: () => void;

  public onPlaceStar?: (position: THREE.Vector3) => void;
  public onStarClick?: (id: string, event: MouseEvent) => void;
  public onStarDragStart?: (id: string) => void;
  public onStarDragMove?: (id: string, position: THREE.Vector3) => void;
  public onStarDragEnd?: (id: string) => void;
  public onEmptyClick?: () => void;
  public onSceneContextMenu?: () => void;

  private draggingStarId: string | null = null;
  private dragPlane: THREE.Plane = new THREE.Plane();
  private dragIntersect: THREE.Vector3 = new THREE.Vector3();
  private pointerDownPos = { x: 0, y: 0 };
  private isDragging = false;
  private pointerDownTime = 0;

  constructor(container: HTMLElement, manager: StarMapManager) {
    this.container = container;
    this.manager = manager;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a14);

    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x0a0a14, 1);
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.labelLayer = document.createElement('div');
    this.labelLayer.style.cssText = `
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; overflow: hidden; z-index: 5;
    `;
    container.appendChild(this.labelLayer);

    this.setupBackgroundParticles();
    this.setupGridSphere();
    this.setupSimpleOrbit();

    this.onResize = () => this.handleResize();
    window.addEventListener('resize', this.onResize);

    this.bindPointerEvents();
  }

  private setupBackgroundParticles(): void {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.bgTwinkleData = new Float32Array(count * 2);

    const colorStart = new THREE.Color('#4A4A8A');
    const colorEnd = new THREE.Color('#B0C4DE');
    const tmpColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const r = 15 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      tmpColor.copy(colorStart).lerp(colorEnd, t);
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;

      this.bgTwinkleData[i * 2] = Math.random() * Math.PI * 2;
      this.bgTwinkleData[i * 2 + 1] = 0.6 + Math.random() * 1.4;
    }

    this.bgParticleData = positions;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.25,
      map: sprite,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.bgParticles = new THREE.Points(geometry, material);
    this.scene.add(this.bgParticles);
  }

  private setupGridSphere(): void {
    const radius = 5;
    const phiSegments = 16;
    const thetaSegments = 24;
    const geometry = new THREE.SphereGeometry(radius, thetaSegments, phiSegments);
    const edges = new THREE.EdgesGeometry(geometry, 25);
    const material = new THREE.LineDashedMaterial({
      color: 0x3a3a5a,
      dashSize: 0.12,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.55,
    });
    this.gridSphere = new THREE.LineSegments(edges, material);
    this.gridSphere.computeLineDistances();
    (this.gridSphere.userData as { isGridSphere: boolean }).isGridSphere = true;
    this.scene.add(this.gridSphere);

    const hitGeo = new THREE.SphereGeometry(radius, 48, 32);
    const hitMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0001,
      depthWrite: false,
    });
    const hitMesh = new THREE.Mesh(hitGeo, hitMat);
    (hitMesh.userData as { isGridSphere: boolean }).isGridSphere = true;
    this.gridSphere.add(hitMesh);
  }

  private orbitYaw = 0;
  private orbitPitch = 0.22;
  private orbitDistance = 8;
  private orbitTarget = new THREE.Vector3(0, 0, 0);
  private orbitDragging = false;
  private orbitLastX = 0;
  private orbitLastY = 0;
  private orbitButton = -1;

  private setupSimpleOrbit(): void {
    this.camera.position.set(
      this.orbitTarget.x + this.orbitDistance * Math.cos(this.orbitPitch) * Math.sin(this.orbitYaw),
      this.orbitTarget.y + this.orbitDistance * Math.sin(this.orbitPitch),
      this.orbitTarget.z + this.orbitDistance * Math.cos(this.orbitPitch) * Math.cos(this.orbitYaw),
    );
    this.camera.lookAt(this.orbitTarget);
  }

  private updateCameraFromOrbit(): void {
    this.camera.position.set(
      this.orbitTarget.x + this.orbitDistance * Math.cos(this.orbitPitch) * Math.sin(this.orbitYaw),
      this.orbitTarget.y + this.orbitDistance * Math.sin(this.orbitPitch),
      this.orbitTarget.z + this.orbitDistance * Math.cos(this.orbitPitch) * Math.cos(this.orbitYaw),
    );
    this.camera.lookAt(this.orbitTarget);
  }

  private handleResize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private bindPointerEvents(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('pointerdown', (e) => {
      this.pointerDownPos.x = e.clientX;
      this.pointerDownPos.y = e.clientY;
      this.pointerDownTime = performance.now();
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);

      const hit = this.getHitTarget();

      if (e.button === 2) {
        this.onSceneContextMenu?.();
        return;
      }

      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        this.orbitDragging = true;
        this.orbitLastX = e.clientX;
        this.orbitLastY = e.clientY;
        this.orbitButton = e.button;
        canvas.setPointerCapture(e.pointerId);
        return;
      }

      if (hit.type === 'star') {
        const id = hit.id;
        const star = this.manager.getStarById(id);
        if (star && !star.locked) {
          this.draggingStarId = id;
          const starMesh = this.starMeshes.get(id);
          if (starMesh) {
            const normal = new THREE.Vector3()
              .copy(starMesh.mesh.position)
              .sub(this.camera.position)
              .normalize();
            this.dragPlane.setFromNormalAndCoplanarPoint(normal, starMesh.mesh.position);
          }
          this.isDragging = false;
          canvas.setPointerCapture(e.pointerId);
          return;
        }
      }

      this.orbitDragging = true;
      this.orbitLastX = e.clientX;
      this.orbitLastY = e.clientY;
      this.orbitButton = e.button;
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.draggingStarId) {
        const dx = Math.abs(e.clientX - this.pointerDownPos.x);
        const dy = Math.abs(e.clientY - this.pointerDownPos.y);
        if (!this.isDragging && (dx > 3 || dy > 3)) {
          this.isDragging = true;
          this.onStarDragStart?.(this.draggingStarId);
        }
        if (this.isDragging) {
          this.raycaster.setFromCamera(this.pointer, this.camera);
          if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersect)) {
            const pos = this.dragIntersect.clone();
            const len = pos.length();
            const radius = 5;
            if (len > radius) {
              pos.multiplyScalar(radius / len);
            }
            this.onStarDragMove?.(this.draggingStarId, pos);
          }
        }
        return;
      }

      if (this.orbitDragging) {
        const dx = e.clientX - this.orbitLastX;
        const dy = e.clientY - this.orbitLastY;
        this.orbitLastX = e.clientX;
        this.orbitLastY = e.clientY;
        this.orbitYaw -= dx * 0.005;
        this.orbitPitch += dy * 0.005;
        this.orbitPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.orbitPitch));
        this.updateCameraFromOrbit();
      }
    });

    canvas.addEventListener('pointerup', (e) => {
      canvas.releasePointerCapture?.(e.pointerId);

      if (this.draggingStarId) {
        const id = this.draggingStarId;
        if (this.isDragging) {
          this.onStarDragEnd?.(id);
        } else {
          this.onStarClick?.(id, e as unknown as MouseEvent);
        }
        this.draggingStarId = null;
        this.isDragging = false;
        return;
      }

      if (this.orbitDragging) {
        const dx = Math.abs(e.clientX - this.pointerDownPos.x);
        const dy = Math.abs(e.clientY - this.pointerDownPos.y);
        const dt = performance.now() - this.pointerDownTime;
        this.orbitDragging = false;
        this.orbitButton = -1;
        if (dx < 4 && dy < 4 && dt < 350) {
          this.handleClick();
        }
      }
    });

    canvas.addEventListener('pointercancel', () => {
      this.draggingStarId = null;
      this.orbitDragging = false;
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      this.orbitDistance *= 1 + delta * 0.15;
      this.orbitDistance = Math.max(3, Math.min(30, this.orbitDistance));
      this.updateCameraFromOrbit();
    }, { passive: false });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  private getHitTarget(): HitTarget {
    const starMeshes: THREE.Object3D[] = [];
    this.starMeshes.forEach(g => starMeshes.push(g.mesh));
    const starHits = this.raycaster.intersectObjects(starMeshes, false);
    if (starHits.length > 0) {
      const obj = starHits[0].object;
      const ud = obj.userData as { starId?: string };
      if (ud.starId) return { type: 'star', id: ud.starId };
    }

    const gridHits = this.raycaster.intersectObject(this.gridSphere, true);
    for (const h of gridHits) {
      const ud = h.object.userData as { isGridSphere?: boolean };
      if (ud.isGridSphere) {
        return { type: 'gridSphere' };
      }
    }
    return { type: 'none' };
  }

  private getIntersectOnSphere(): THREE.Vector3 | null {
    const sphereGeo = new THREE.SphereGeometry(5, 64, 48);
    const mesh = new THREE.Mesh(sphereGeo);
    const hits = this.raycaster.intersectObject(mesh, false);
    if (hits.length > 0) {
      return hits[0].point.clone();
    }
    return null;
  }

  private handleClick(): void {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.getHitTarget();
    if (hit.type === 'gridSphere') {
      const pos = this.getIntersectOnSphere();
      if (pos) {
        this.onPlaceStar?.(pos);
      }
      return;
    }
    if (hit.type === 'none') {
      this.onEmptyClick?.();
    }
  }

  public spawnRipple(position: THREE.Vector3): void {
    const geo = new THREE.RingGeometry(0.05, 0.15, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    const normal = position.clone().normalize();
    mesh.lookAt(position.clone().add(normal));
    this.scene.add(mesh);
    this.ripples.push({ mesh, life: 0, maxLife: 0.9 });
  }

  public refreshAll(): void {
    this.syncStars();
    this.syncConnections();
    this.updateLabels();
  }

  private syncStars(): void {
    const currentStars = this.manager.getStars();
    const currentIds = new Set(currentStars.map(s => s.id));

    this.starMeshes.forEach((_g, id) => {
      if (!currentIds.has(id)) {
        this.removeStarMesh(id);
      }
    });

    const selectedId = this.manager.getSelectedStarId();
    const firstConnId = this.manager.getFirstConnectionId();

    for (const star of currentStars) {
      let group = this.starMeshes.get(star.id);
      if (!group) {
        group = this.createStarMesh(star);
        this.starMeshes.set(star.id, group);
      }
      group.mesh.position.set(star.position.x, star.position.y, star.position.z);
      const mat = group.mesh.material as THREE.MeshBasicMaterial;
      mat.color.set(star.color);
      const haloMat = group.halo.material as THREE.MeshBasicMaterial;
      haloMat.color.set(star.color);

      const isSelected = star.id === selectedId;
      const isFirstConn = star.id === firstConnId;
      const baseScale = (isSelected || isFirstConn) ? 1.2 : 1.0;
      group.mesh.scale.setScalar(baseScale * 0.15);
      group.halo.scale.setScalar(baseScale * (star.locked ? 0.45 : 0.55));
      haloMat.opacity = star.locked ? 0.9 : (isSelected || isFirstConn) ? 0.7 : 0.4;

      if (isFirstConn) {
        mat.color.set('#66FFFF');
        haloMat.color.set('#66FFFF');
      }
    }
  }

  private createStarMesh(star: StarPoint): StarMeshGroup {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(canvas);

    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: star.color,
      map: sprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(star.position.x, star.position.y, star.position.z);
    mesh.scale.setScalar(0.15);
    (mesh.userData as { starId: string }).starId = star.id;
    this.scene.add(mesh);

    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = 128;
    haloCanvas.height = 128;
    const hctx = haloCanvas.getContext('2d')!;
    const hgrad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    hgrad.addColorStop(0, 'rgba(255,255,255,0.5)');
    hgrad.addColorStop(0.3, 'rgba(255,255,255,0.2)');
    hgrad.addColorStop(1, 'rgba(255,255,255,0)');
    hctx.fillStyle = hgrad;
    hctx.fillRect(0, 0, 128, 128);
    const haloSprite = new THREE.CanvasTexture(haloCanvas);
    const haloMat = new THREE.MeshBasicMaterial({
      color: star.color,
      map: haloSprite,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.4,
    });
    const halo = new THREE.Mesh(geo.clone(), haloMat);
    halo.position.copy(mesh.position);
    halo.scale.setScalar(0.55);
    this.scene.add(halo);

    return { mesh, halo, label: null };
  }

  private removeStarMesh(id: string): void {
    const group = this.starMeshes.get(id);
    if (!group) return;
    this.scene.remove(group.mesh);
    this.scene.remove(group.halo);
    (group.mesh.material as THREE.Material).dispose();
    (group.halo.material as THREE.Material).dispose();
    group.mesh.geometry.dispose();
    group.halo.geometry.dispose();
    if (group.label) {
      group.label.remove();
    }
    this.starMeshes.delete(id);
  }

  private syncConnections(): void {
    const currentConns = this.manager.getConnections();
    const currentIds = new Set(currentConns.map(c => c.id));

    this.connectionMeshes.forEach((_g, id) => {
      if (!currentIds.has(id)) {
        this.removeConnectionMesh(id);
      }
    });

    for (const conn of currentConns) {
      let group = this.connectionMeshes.get(conn.id);
      if (!group) {
        group = this.createConnectionMesh(conn);
        this.connectionMeshes.set(conn.id, group);
        this.spawnConnectionParticles(conn);
      }
      this.updateConnectionGeometry(conn, group);
    }
  }

  private createConnectionMesh(conn: StarConnection): ConnectionMeshGroup {
    const startStar = this.manager.getStarById(conn.startId);
    const endStar = this.manager.getStarById(conn.endId);
    if (!startStar || !endStar) {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const mat = new THREE.LineBasicMaterial({ transparent: true });
      const line = new THREE.Line(geo, mat);
      const glow = new THREE.Line(geo.clone(), mat.clone());
      this.scene.add(line, glow);
      return { line, glow, particles: null, particleTime: -1, pulseTime: 0 };
    }

    const positions = new Float32Array(6);
    const colors = new Float32Array(6);
    const startColor = new THREE.Color(startStar.color);
    const endColor = new THREE.Color(endStar.color);
    colors[0] = startColor.r; colors[1] = startColor.g; colors[2] = startColor.b;
    colors[3] = endColor.r; colors[4] = endColor.g; colors[5] = endColor.b;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      linewidth: 1,
    });
    const line = new THREE.Line(geo, mat);
    (line.userData as { connectionId: string }).connectionId = conn.id;

    const glowGeo = geo.clone();
    const glowMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Line(glowGeo, glowMat);

    this.scene.add(glow, line);

    return { line, glow, particles: null, particleTime: -1, pulseTime: Math.random() * Math.PI * 2 };
  }

  private updateConnectionGeometry(conn: StarConnection, group: ConnectionMeshGroup): void {
    const startStar = this.manager.getStarById(conn.startId);
    const endStar = this.manager.getStarById(conn.endId);
    if (!startStar || !endStar) return;

    const positions = group.line.geometry.attributes.position.array as Float32Array;
    positions[0] = startStar.position.x;
    positions[1] = startStar.position.y;
    positions[2] = startStar.position.z;
    positions[3] = endStar.position.x;
    positions[4] = endStar.position.y;
    positions[5] = endStar.position.z;
    group.line.geometry.attributes.position.needsUpdate = true;
    group.glow.geometry.attributes.position.array.set(positions);
    group.glow.geometry.attributes.position.needsUpdate = true;

    const colors = group.line.geometry.attributes.color.array as Float32Array;
    const startColor = new THREE.Color(startStar.color);
    const endColor = new THREE.Color(endStar.color);
    colors[0] = startColor.r; colors[1] = startColor.g; colors[2] = startColor.b;
    colors[3] = endColor.r; colors[4] = endColor.g; colors[5] = endColor.b;
    group.line.geometry.attributes.color.needsUpdate = true;
    group.glow.geometry.attributes.color.array.set(colors);
    group.glow.geometry.attributes.color.needsUpdate = true;
  }

  private removeConnectionMesh(id: string): void {
    const group = this.connectionMeshes.get(id);
    if (!group) return;
    this.scene.remove(group.line, group.glow);
    if (group.particles) this.scene.remove(group.particles);
    (group.line.material as THREE.Material).dispose();
    (group.glow.material as THREE.Material).dispose();
    group.line.geometry.dispose();
    group.glow.geometry.dispose();
    if (group.particles) {
      (group.particles.material as THREE.Material).dispose();
      group.particles.geometry.dispose();
    }
    this.connectionMeshes.delete(id);
  }

  private spawnConnectionParticles(conn: StarConnection): void {
    const group = this.connectionMeshes.get(conn.id);
    if (!group) return;
    const startStar = this.manager.getStarById(conn.startId);
    const endStar = this.manager.getStarById(conn.endId);
    if (!startStar || !endStar) return;

    const particleCount = 16;
    const positions = new Float32Array(particleCount * 3);
    const start = new THREE.Vector3(startStar.position.x, startStar.position.y, startStar.position.z);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = start.x;
      positions[i * 3 + 1] = start.y;
      positions[i * 3 + 2] = start.z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const sprite = new THREE.CanvasTexture(canvas);
    const mat = new THREE.PointsMaterial({
      size: 0.18,
      map: sprite,
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(geo, mat);
    this.scene.add(particles);
    group.particles = particles;
    group.particleTime = 0;
  }

  private updateConnectionAnimations(dt: number, elapsed: number): void {
    this.connectionMeshes.forEach((group) => {
      const pulse = 0.65 + 0.35 * Math.sin(elapsed * 3 + group.pulseTime);
      (group.line.material as THREE.LineBasicMaterial).opacity = 0.85 + 0.15 * pulse;
      (group.glow.material as THREE.LineBasicMaterial).opacity = 0.25 + 0.2 * pulse;
      group.glow.scale.setScalar(1 + 0.15 * pulse);

      if (group.particles && group.particleTime >= 0) {
        const posAttr = group.particles.geometry.attributes.position as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;
        const id = (group.line.userData as { connectionId?: string }).connectionId;
        const conn = id ? this.manager.getConnections().find(c => c.id === id) : undefined;
        if (conn) {
          const s = this.manager.getStarById(conn.startId);
          const e = this.manager.getStarById(conn.endId);
          if (s && e) {
            const start = new THREE.Vector3(s.position.x, s.position.y, s.position.z);
            const end = new THREE.Vector3(e.position.x, e.position.y, e.position.z);
            const count = positions.length / 3;
            for (let i = 0; i < count; i++) {
              const t = Math.max(0, Math.min(1, group.particleTime - i * 0.01));
              const eased = t * t * (3 - 2 * t);
              const p = start.clone().lerp(end, eased);
              positions[i * 3] = p.x;
              positions[i * 3 + 1] = p.y;
              positions[i * 3 + 2] = p.z;
            }
            posAttr.needsUpdate = true;
            (group.particles.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - group.particleTime);
          }
        }
        group.particleTime += dt * 1.6;
        if (group.particleTime > 1.25) {
          this.scene.remove(group.particles);
          (group.particles.material as THREE.Material).dispose();
          group.particles.geometry.dispose();
          group.particles = null;
          group.particleTime = -1;
        }
      }
    });
  }

  private updateRipples(dt: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.life += dt;
      const t = r.life / r.maxLife;
      const s = 0.2 + t * 4.5;
      r.mesh.scale.setScalar(s);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - t));
      if (r.life >= r.maxLife) {
        this.scene.remove(r.mesh);
        (r.mesh.material as THREE.Material).dispose();
        r.mesh.geometry.dispose();
        this.ripples.splice(i, 1);
      }
    }
  }

  private updateBackground(dt: number, elapsed: number): void {
    this.bgParticles.rotation.y += dt * 0.005;
    this.bgParticles.rotation.x += dt * 0.002;
    const posAttr = this.bgParticles.geometry.attributes.position as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const count = positions.length / 3;
    for (let i = 0; i < count; i++) {
      const phase = this.bgTwinkleData[i * 2];
      const speed = this.bgTwinkleData[i * 2 + 1];
      const tw = 0.85 + 0.15 * Math.sin(elapsed * speed + phase);
      const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      positions[ix] = this.bgParticleData[ix] * tw;
      positions[iy] = this.bgParticleData[iy] * tw;
      positions[iz] = this.bgParticleData[iz] * tw;
    }
    posAttr.needsUpdate = true;
  }

  private starLabels: Map<string, HTMLDivElement> = new Map();

  private updateLabels(): void {
    const selectedId = this.manager.getSelectedStarId();
    const draggingId = this.draggingStarId;
    const showLabel = (id: string) => id === selectedId || id === draggingId;

    this.starLabels.forEach((el, id) => {
      const group = this.starMeshes.get(id);
      const star = this.manager.getStarById(id);
      if (!group || !star || !showLabel(id)) {
        el.remove();
        this.starLabels.delete(id);
        return;
      }
      const pos = group.mesh.position.clone().project(this.camera);
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      const x = (pos.x * 0.5 + 0.5) * w;
      const y = (-pos.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(-50%, calc(-100% - 14px)) translate(${x}px, ${y}px)`;
      el.textContent = `(${star.position.x.toFixed(2)}, ${star.position.y.toFixed(2)}, ${star.position.z.toFixed(2)})`;
    });

    this.manager.getStars().forEach(star => {
      if (!showLabel(star.id)) return;
      if (this.starLabels.has(star.id)) return;
      const el = document.createElement('div');
      el.style.cssText = `
        position: absolute; top: 0; left: 0;
        padding: 4px 8px;
        background: rgba(30, 30, 58, 0.92);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 6px;
        font-size: 11px;
        font-family: Consolas, Monaco, monospace;
        color: #E0E0FF;
        white-space: nowrap;
        pointer-events: none;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        z-index: 6;
        transition: opacity 0.15s;
        opacity: 0;
      `;
      this.labelLayer.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = '1'; });
      this.starLabels.set(star.id, el);
    });
  }

  private billboardUpdate(): void {
    this.starMeshes.forEach(group => {
      group.mesh.quaternion.copy(this.camera.quaternion);
      group.halo.quaternion.copy(this.camera.quaternion);
    });
    this.ripples.forEach(r => {
      const pos = r.mesh.position;
      const normal = pos.clone().normalize();
      r.mesh.lookAt(pos.clone().add(normal));
    });
  }

  private tick = (): void => {
    this.animId = requestAnimationFrame(this.tick);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.billboardUpdate();
    this.updateBackground(dt, elapsed);
    this.updateConnectionAnimations(dt, elapsed);
    this.updateRipples(dt);
    this.syncStars();
    this.syncConnections();
    this.updateLabels();
    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    if (this.animId === 0) this.tick();
  }

  public stop(): void {
    if (this.animId !== 0) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getCamera(): THREE.Camera {
    return this.camera;
  }

  public fadeOut(duration = 500): Promise<void> {
    return new Promise(resolve => {
      const start = performance.now();
      const initial = this.scene.background ? (this.scene.background as THREE.Color).getHex() : 0x0a0a14;
      const bg = this.scene.background as THREE.Color;
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        const alpha = 1 - t;
        this.starMeshes.forEach(g => {
          (g.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
          (g.halo.material as THREE.MeshBasicMaterial).opacity = alpha * 0.5;
        });
        this.connectionMeshes.forEach(g => {
          (g.line.material as THREE.LineBasicMaterial).opacity = alpha * 0.95;
          (g.glow.material as THREE.LineBasicMaterial).opacity = alpha * 0.35;
        });
        bg.setRGB(
          ((initial >> 16) & 255) / 255 * alpha + (0x0a / 255) * (1 - alpha),
          ((initial >> 8) & 255) / 255 * alpha + (0x0a / 255) * (1 - alpha),
          (initial & 255) / 255 * alpha + (0x14 / 255) * (1 - alpha),
        );
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          this.starMeshes.forEach(g => {
            (g.mesh.material as THREE.MeshBasicMaterial).opacity = 1;
            (g.halo.material as THREE.MeshBasicMaterial).opacity = 0.4;
          });
          resolve();
        }
      };
      step();
    });
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.starMeshes.forEach((_g, id) => this.removeStarMesh(id));
    this.connectionMeshes.forEach((_g, id) => this.removeConnectionMesh(id));
    this.ripples.forEach(r => {
      this.scene.remove(r.mesh);
      (r.mesh.material as THREE.Material).dispose();
      r.mesh.geometry.dispose();
    });
    this.ripples = [];
    this.scene.remove(this.bgParticles);
    (this.bgParticles.material as THREE.Material).dispose();
    this.bgParticles.geometry.dispose();
    this.scene.remove(this.gridSphere);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.labelLayer.remove();
  }
}

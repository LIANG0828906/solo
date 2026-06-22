import * as THREE from 'three';
import { gsap } from 'gsap';
import { GameEngine } from './GameEngine';
import { BlockPosition, ParticleConfig } from './types';

const GRID_SIZE = 10;
const MAX_HEIGHT = 5;
const CELL_SIZE = 1;

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private engine: GameEngine;
  private container: HTMLElement;
  private blockMeshes: Map<string, THREE.Mesh> = new Map();
  private ghostMesh: THREE.Mesh | null = null;
  private groundMesh: THREE.Mesh | null = null;
  private gridLineGroup: THREE.Group | null = null;
  private playerMesh: THREE.Mesh | null = null;
  private endMarkerMesh: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private animationFrameId: number | null = null;
  private particles: THREE.Points | null = null;
  private particlePool: { position: THREE.Vector3; velocity: THREE.Vector3; color: THREE.Color; life: number; maxLife: number; size: number }[] = [];
  private readonly MAX_PARTICLES = 50;
  private pendingBlocks: Map<string, { mesh: THREE.Mesh; type: 'place' | 'remove' }> = new Map();
  private lastBlockUpdate = 0;
  private readonly BLOCK_UPDATE_INTERVAL = 50;
  private resizeObserver?: ResizeObserver;

  constructor(container: HTMLElement, engine: GameEngine) {
    this.container = container;
    this.engine = engine;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1A1A2E);

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 14;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * aspect / -2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      frustumSize / -2,
      0.1,
      100
    );
    const dist = 10;
    const angleRad = (45 * Math.PI) / 180;
    this.camera.position.set(
      GRID_SIZE / 2 + dist * Math.cos(angleRad) * Math.sin(Math.PI / 4),
      dist * Math.sin(angleRad) + 3,
      GRID_SIZE / 2 + dist * Math.cos(angleRad) * Math.cos(Math.PI / 4)
    );
    this.camera.lookAt(GRID_SIZE / 2 - 0.5, 0, GRID_SIZE / 2 - 0.5);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLights();
    this.setupGround();
    this.setupEventListeners();
    this.setupEngineListeners();
    this.setupResizeObserver();
    this.startLoop();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(10, 20, 10);
    this.scene.add(dir);
    const fill = new THREE.DirectionalLight(0x88aaff, 0.3);
    fill.position.set(-10, 10, -5);
    this.scene.add(fill);
  }

  private setupGround(): void {
    const group = new THREE.Group();
    const baseGeo = new THREE.PlaneGeometry(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xD3D3D3, roughness: 0.9 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = -Math.PI / 2;
    base.position.set(GRID_SIZE / 2 - 0.5, -0.01, GRID_SIZE / 2 - 0.5);
    group.add(base);
    this.groundMesh = base;

    const gridHelper = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x9E9E9E, 0x9E9E9E);
    gridHelper.position.set(GRID_SIZE / 2 - 0.5, 0, GRID_SIZE / 2 - 0.5);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.LineBasicMaterial).linewidth = 1;
    group.add(gridHelper);
    this.gridLineGroup = group;
    this.scene.add(group);
  }

  private keyOf(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  private createBlockMesh(color: number = 0x5b8def, opacity: number = 1): THREE.Mesh {
    const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.6,
      metalness: 0.1,
      transparent: opacity < 1,
      opacity
    });
    return new THREE.Mesh(geo, mat);
  }

  private updateBlocksFromGrid(grid: number[][][]): void {
    const existing = new Set(this.blockMeshes.keys());
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        for (let y = 0; y <= MAX_HEIGHT; y++) {
          const val = grid[x][z][y];
          if (val > 0) {
            const key = this.keyOf(x, y, z);
            existing.delete(key);
            if (!this.blockMeshes.has(key) && !this.pendingBlocks.has(key)) {
              this.addBlockAnimated(x, y, z, val);
            }
          }
        }
      }
    }
    existing.forEach((key) => {
      const mesh = this.blockMeshes.get(key);
      if (mesh && !this.pendingBlocks.has(key)) {
        this.removeBlockAnimated(key, mesh);
      }
    });
  }

  private addBlockAnimated(x: number, y: number, z: number, type: number): void {
    let color = 0x5b8def;
    if (type === 2) color = 0xff6b6b;
    else if (y <= 0) color = 0x7db87d;
    else if (y <= 1) color = 0x8ecae6;
    else if (y <= 2) color = 0x6a8ebf;
    else if (y <= 3) color = 0x5b7aa8;
    else color = 0x4a6591;

    const mesh = this.createBlockMesh(color);
    mesh.position.set(x, y, z);
    mesh.scale.y = 0;
    mesh.userData = { x, y, z };
    this.scene.add(mesh);
    const key = this.keyOf(x, y, z);
    this.pendingBlocks.set(key, { mesh, type: 'place' });
    this.blockMeshes.set(key, mesh);

    gsap.to(mesh.scale, {
      y: 1,
      duration: 0.2,
      ease: 'power1.inOut',
      onComplete: () => {
        this.pendingBlocks.delete(key);
      }
    });
  }

  private removeBlockAnimated(key: string, mesh: THREE.Mesh): void {
    this.pendingBlocks.set(key, { mesh, type: 'remove' });
    const y = mesh.userData.y as number;
    const x = mesh.userData.x as number;
    const z = mesh.userData.z as number;
    const layers = 5;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    let currentLayer = 0;

    const removeLayer = () => {
      if (currentLayer >= layers) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
        this.blockMeshes.delete(key);
        this.pendingBlocks.delete(key);
        return;
      }
      const progress = (currentLayer + 1) / layers;
      mesh.scale.y = 1 - progress;
      mesh.position.y = y + progress * 0.5;
      gsap.to(mat, {
        opacity: 1 - progress,
        duration: 0.08,
        ease: 'power1.out',
        onComplete: () => {
          currentLayer++;
          setTimeout(removeLayer, 20);
        }
      });
    };
    removeLayer();
  }

  private setupEngineListeners(): void {
    this.engine.on('state:changed', ({ grid }: { grid: number[][][] }) => {
      this.updateBlocksFromGrid(grid);
    });

    this.engine.on('level:start', ({ level }: any) => {
      this.clearAllBlocks();
      this.updateBlocksFromGrid(this.engine.getGrid());
      this.updatePlayerMesh(level.startPos);
      this.updateEndMarker(level.endPos);
    });

    this.engine.on('block:placed', (pos: BlockPosition) => {
      this.spawnLandParticles(pos);
    });

    this.engine.on('level:complete', ({ endPos }: { endPos: BlockPosition }) => {
      this.spawnCelebrationParticles(endPos);
    });

    this.engine.on('loop:reset', () => {
      // fade handled by engine state change
    });
  }

  private clearAllBlocks(): void {
    this.blockMeshes.forEach((mesh) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat.dispose();
    });
    this.blockMeshes.clear();
    this.pendingBlocks.clear();
  }

  private updatePlayerMesh(pos: BlockPosition): void {
    if (!this.playerMesh) {
      const geo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: 0xff9500, emissive: 0x331100, roughness: 0.4 });
      this.playerMesh = new THREE.Mesh(geo, mat);
      this.scene.add(this.playerMesh);
    }
    this.playerMesh.position.set(pos.x, pos.y + 0.3, pos.z);
  }

  private updateEndMarker(pos: BlockPosition): void {
    if (!this.endMarkerMesh) {
      const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x553300 });
      this.endMarkerMesh = new THREE.Mesh(geo, mat);
      this.scene.add(this.endMarkerMesh);
    }
    this.endMarkerMesh.position.set(pos.x, pos.y + 0.05, pos.z);
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('mousemove', (e) => {
      this.updateMouse(e);
      this.updateGhost();
    });

    canvas.addEventListener('mouseleave', () => {
      this.hideGhost();
    });

    canvas.addEventListener('click', (e) => {
      if (e.button !== 0) return;
      const cell = this.pickCell(e);
      if (cell) {
        this.engine.placeBlock(cell.x, cell.z);
      }
    });

    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cell = this.pickCell(e);
      if (cell) {
        this.engine.removeBlock(cell.x, cell.z);
      }
    });
  }

  private updateMouse(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pickCell(e: MouseEvent): { x: number; z: number } | null {
    this.updateMouse(e);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    if (!this.groundMesh) return null;
    const intersects = this.raycaster.intersectObject(this.groundMesh, false);
    if (intersects.length === 0) {
      const blockMeshes = Array.from(this.blockMeshes.values());
      const blockHits = this.raycaster.intersectObjects(blockMeshes, false);
      if (blockHits.length > 0) {
        const hit = blockHits[0].object as THREE.Mesh;
        return { x: Math.round(hit.userData.x), z: Math.round(hit.userData.z) };
      }
      return null;
    }
    const point = intersects[0].point;
    const x = Math.floor(point.x + 0.5);
    const z = Math.floor(point.z + 0.5);
    if (x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) return null;
    return { x, z };
  }

  private updateGhost(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    if (!this.groundMesh) return;
    const intersects = this.raycaster.intersectObject(this.groundMesh, false);
    let cell: { x: number; z: number } | null = null;
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const x = Math.floor(point.x + 0.5);
      const z = Math.floor(point.z + 0.5);
      if (x >= 0 && x < GRID_SIZE && z >= 0 && z < GRID_SIZE) cell = { x, z };
    } else {
      const blockMeshes = Array.from(this.blockMeshes.values());
      const blockHits = this.raycaster.intersectObjects(blockMeshes, false);
      if (blockHits.length > 0) {
        const hit = blockHits[0].object as THREE.Mesh;
        cell = { x: Math.round(hit.userData.x), z: Math.round(hit.userData.z) };
      }
    }
    if (!cell) {
      this.hideGhost();
      return;
    }
    const grid = this.engine.getGrid();
    let topY = 0;
    for (let y = MAX_HEIGHT; y >= 0; y--) {
      if (grid[cell.x][cell.z][y] > 0) { topY = y; break; }
    }
    const placeY = topY + 1;
    if (placeY > MAX_HEIGHT) {
      this.hideGhost();
      return;
    }
    if (!this.ghostMesh) {
      const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
      this.ghostMesh = new THREE.Mesh(geo, mat);
      this.scene.add(this.ghostMesh);
    }
    this.ghostMesh.visible = true;
    this.ghostMesh.position.set(cell.x, placeY, cell.z);
  }

  private hideGhost(): void {
    if (this.ghostMesh) this.ghostMesh.visible = false;
  }

  private spawnLandParticles(pos: BlockPosition): void {
    const count = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      if (this.particlePool.length >= this.MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.01 + Math.random() * 0.02;
      this.particlePool.push({
        position: new THREE.Vector3(
          pos.x + (Math.random() - 0.5) * 0.5,
          pos.y - 0.45,
          pos.z + (Math.random() - 0.5) * 0.5
        ),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          0.015 + Math.random() * 0.015,
          Math.sin(angle) * speed
        ),
        color: new THREE.Color(0xffffff),
        life: 0.3,
        maxLife: 0.3,
        size: 0.02
      });
    }
    this.ensureParticlesGeometry();
  }

  private spawnCelebrationParticles(pos: BlockPosition): void {
    const colors = [0xFFD700, 0xFFFFFF, 0x00FFFF];
    const count = 30;
    for (let i = 0; i < count; i++) {
      if (this.particlePool.length >= this.MAX_PARTICLES) break;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.02 + Math.random() * 0.03;
      this.particlePool.push({
        position: new THREE.Vector3(pos.x, pos.y + 0.3, pos.z),
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          0.03 + Math.random() * 0.04,
          Math.sin(angle) * speed
        ),
        color: new THREE.Color(color),
        life: 1.5,
        maxLife: 1.5,
        size: 0.03
      });
    }
    this.ensureParticlesGeometry();
  }

  private ensureParticlesGeometry(): void {
    if (!this.particles) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(this.MAX_PARTICLES * 3);
      const colors = new Float32Array(this.MAX_PARTICLES * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const mat = new THREE.PointsMaterial({
        size: 12,
        vertexColors: true,
        transparent: true,
        opacity: 1,
        sizeAttenuation: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      this.particles = new THREE.Points(geo, mat);
      this.scene.add(this.particles);
    }
  }

  private updateParticles(delta: number): void {
    const colors = [0xFFD700, 0xFFFFFF, 0x00FFFF];
    for (let i = this.particlePool.length - 1; i >= 0; i--) {
      const p = this.particlePool[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.particlePool.splice(i, 1);
        continue;
      }
      p.velocity.y -= 0.25 * delta;
      p.position.addScaledVector(p.velocity, delta * 60);
      if (p.maxLife > 0.5 && Math.random() < 0.06) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        p.color.setHex(c);
      }
    }
    if (this.particles) {
      const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colorAttr = this.particles.geometry.getAttribute('color') as THREE.BufferAttribute;
      for (let i = 0; i < this.MAX_PARTICLES; i++) {
        if (i < this.particlePool.length) {
          const p = this.particlePool[i];
          const alpha = p.life / p.maxLife;
          posAttr.setXYZ(i, p.position.x, p.position.y, p.position.z);
          colorAttr.setXYZ(i, p.color.r * alpha, p.color.g * alpha, p.color.b * alpha);
        } else {
          posAttr.setXYZ(i, -1000, -1000, -1000);
          colorAttr.setXYZ(i, 0, 0, 0);
        }
      }
      posAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      this.particles.geometry.computeBoundingSphere();
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.container);
  }

  private onResize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    const aspect = w / h;
    const frustumSize = 14;
    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
  }

  private startLoop(): void {
    let last = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = (now - last) / 1000;
      last = now;
      this.updateParticles(delta);
      if (this.endMarkerMesh) {
        this.endMarkerMesh.rotation.y += delta * 2;
        this.endMarkerMesh.position.y += Math.sin(now * 0.003) * 0.003;
      }
      this.renderer.render(this.scene, this.camera);
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  destroy(): void {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.clearAllBlocks();
    this.renderer.dispose();
  }
}

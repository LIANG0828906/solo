import * as THREE from 'three';
import { PhysicsEngine, BrickData, CollisionEvent } from './engine';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface BrickAnim {
  mesh: THREE.Mesh;
  startTime: number;
  duration: number;
}

const MAX_PARTICLES = 200;

const BRICK_COLORS: Record<string, number> = {
  red: 0xff4444,
  blue: 0x4488ff,
  green: 0x44ff44
};

export class GameRenderer {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  webglRenderer: THREE.WebGLRenderer;

  private ballMesh!: THREE.Mesh;
  private ballGlow!: THREE.Mesh;
  private paddleMesh!: THREE.Mesh;
  private brickMeshes: Map<string, THREE.Mesh> = new Map();
  private gridGroup: THREE.Group | null = null;

  private particles: Particle[] = [];
  private brickAnims: BrickAnim[] = [];

  private fieldWidth = 30;
  private fieldHeight = 20;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    const fw = this.fieldWidth;
    const fh = this.fieldHeight;
    this.camera = new THREE.OrthographicCamera(
      -fw / 2, fw / 2, fh / 2, -fh / 2, 0.1, 100
    );
    this.camera.position.z = 10;

    this.webglRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.webglRenderer.setClearColor(0x000000, 0);

    this.createBall();
    this.createPaddle();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private createBall(): void {
    const geom = new THREE.SphereGeometry(0.3, 24, 24);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.ballMesh = new THREE.Mesh(geom, mat);
    this.ballMesh.visible = false;
    this.scene.add(this.ballMesh);

    const glowGeom = new THREE.SphereGeometry(0.45, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.15
    });
    this.ballGlow = new THREE.Mesh(glowGeom, glowMat);
    this.ballMesh.add(this.ballGlow);
  }

  private createPaddle(): void {
    const geom = new THREE.BoxGeometry(4, 0.4, 0.4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });
    this.paddleMesh = new THREE.Mesh(geom, mat);
    this.paddleMesh.visible = false;
    this.scene.add(this.paddleMesh);
  }

  private g2t(gx: number, gy: number): [number, number] {
    return [gx - this.fieldWidth / 2, this.fieldHeight / 2 - gy];
  }

  handleResize(): void {
    const container = this.webglRenderer.domElement.parentElement;
    if (!container) return;

    const maxWidth = 1000;
    const gameAspect = this.fieldWidth / this.fieldHeight;

    let width = Math.min(container.clientWidth, maxWidth);
    let height = width / gameAspect;

    if (height > window.innerHeight * 0.95) {
      height = window.innerHeight * 0.95;
      width = height * gameAspect;
    }

    this.webglRenderer.setSize(width, height);
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const fw = this.fieldWidth;
    const fh = this.fieldHeight;
    this.camera.left = -fw / 2;
    this.camera.right = fw / 2;
    this.camera.top = fh / 2;
    this.camera.bottom = -fh / 2;
    this.camera.updateProjectionMatrix();
  }

  screenToGame(clientX: number, clientY: number): { gx: number; gy: number } {
    const rect = this.webglRenderer.domElement.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    const gx = nx * this.fieldWidth;
    const gy = ny * this.fieldHeight;
    return { gx, gy };
  }

  updateFromEngine(engine: PhysicsEngine): void {
    this.ballMesh.visible = true;
    const [bx, by] = this.g2t(engine.ballX, engine.ballY);
    this.ballMesh.position.set(bx, by, 1);

    this.paddleMesh.visible = true;
    const [px, py] = this.g2t(engine.paddleX, engine.paddleY);
    this.paddleMesh.position.set(px, py, 0.5);

    const currentKeys = new Set<string>();
    for (const brick of engine.bricks) {
      const key = `${brick.x},${brick.y}`;
      currentKeys.add(key);
      if (!this.brickMeshes.has(key)) {
        this.createBrickMesh(brick, false);
      }
    }

    for (const [key, mesh] of this.brickMeshes) {
      if (!currentKeys.has(key)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.brickMeshes.delete(key);
      }
    }

    for (const evt of engine.collisionEvents) {
      if (evt.type === 'brick_destroy') {
        this.spawnBrickParticles(evt.x, evt.y, evt.brickColor || 'green');
      } else if (evt.type === 'wall' || evt.type === 'paddle') {
        this.spawnBounceParticles(evt.x, evt.y);
      }
    }
  }

  createBrickMesh(brick: BrickData, animate: boolean): THREE.Mesh {
    const color = BRICK_COLORS[brick.color] || 0xffffff;
    const geom = new THREE.BoxGeometry(0.94, 0.44, 0.3);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geom, mat);

    const [tx, ty] = this.g2t(brick.x + 0.5, brick.y + 0.25);
    mesh.position.set(tx, ty, 0.5);

    const edgeGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.94, 0.44, 0.3));
    const edgeMat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.4
    });
    const edge = new THREE.LineSegments(edgeGeom, edgeMat);
    mesh.add(edge);

    this.scene.add(mesh);
    this.brickMeshes.set(`${brick.x},${brick.y}`, mesh);

    if (animate) {
      mesh.scale.set(0, 0, 0);
      this.brickAnims.push({
        mesh, startTime: performance.now(), duration: 200
      });
    }

    return mesh;
  }

  removeBrickMesh(x: number, y: number): void {
    const key = `${x},${y}`;
    const mesh = this.brickMeshes.get(key);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.brickMeshes.delete(key);
    }
  }

  clearBrickMeshes(): void {
    for (const [, mesh] of this.brickMeshes) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.brickMeshes.clear();
    this.brickAnims.length = 0;
  }

  highlightBrick(x: number, y: number): void {
    for (const [, mesh] of this.brickMeshes) {
      const edge = mesh.children[0] as THREE.LineSegments;
      if (edge) {
        (edge.material as THREE.LineBasicMaterial).opacity = 0.4;
      }
      (mesh.material as THREE.MeshBasicMaterial).color.set(
        BRICK_COLORS[this.getBrickColorFromMesh(mesh)] || 0xffffff
      );
    }
    const key = `${x},${y}`;
    const mesh = this.brickMeshes.get(key);
    if (mesh) {
      const edge = mesh.children[0] as THREE.LineSegments;
      if (edge) {
        (edge.material as THREE.LineBasicMaterial).opacity = 1;
      }
    }
  }

  private getBrickColorFromMesh(mesh: THREE.Mesh): string {
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const hex = mat.color.getHex();
    if (hex === 0xff4444) return 'red';
    if (hex === 0x4488ff) return 'blue';
    if (hex === 0x44ff44) return 'green';
    return 'red';
  }

  showGrid(): void {
    if (this.gridGroup) return;
    this.gridGroup = new THREE.Group();

    const lineMat = new THREE.LineBasicMaterial({
      color: 0x888888, transparent: true, opacity: 0.2
    });

    for (let x = 0; x <= this.fieldWidth; x++) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x - this.fieldWidth / 2, -this.fieldHeight / 2, 0),
        new THREE.Vector3(x - this.fieldWidth / 2, this.fieldHeight / 2, 0)
      ]);
      this.gridGroup.add(new THREE.Line(geom, lineMat));
    }
    for (let y = 0; y <= this.fieldHeight; y++) {
      const geom = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-this.fieldWidth / 2, y - this.fieldHeight / 2, 0),
        new THREE.Vector3(this.fieldWidth / 2, y - this.fieldHeight / 2, 0)
      ]);
      this.gridGroup.add(new THREE.Line(geom, lineMat));
    }

    this.scene.add(this.gridGroup);
  }

  hideGrid(): void {
    if (this.gridGroup) {
      this.scene.remove(this.gridGroup);
      this.gridGroup = null;
    }
  }

  spawnBrickParticles(gameX: number, gameY: number, color: string): void {
    const c = BRICK_COLORS[color] || 0xffffff;
    for (let i = 0; i < 30; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.removeOldestParticle();
      }
      const size = 0.1 + Math.random() * 0.2;
      const geom = new THREE.SphereGeometry(size, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geom, mat);

      const [tx, ty] = this.g2t(gameX, gameY);
      mesh.position.set(tx, ty, 1.5);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5,
        maxLife: 1.5
      });
    }
  }

  spawnBounceParticles(gameX: number, gameY: number): void {
    for (let i = 0; i < 5; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.removeOldestParticle();
      }
      const size = 0.05 + Math.random() * 0.1;
      const geom = new THREE.SphereGeometry(size, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 1
      });
      const mesh = new THREE.Mesh(geom, mat);

      const [tx, ty] = this.g2t(gameX, gameY);
      mesh.position.set(tx, ty, 1.5);
      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;

      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3
      });
    }
  }

  private removeOldestParticle(): void {
    if (this.particles.length === 0) return;
    const p = this.particles.shift()!;
    this.scene.remove(p.mesh);
    p.mesh.geometry.dispose();
    (p.mesh.material as THREE.Material).dispose();
  }

  updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.vy -= 3 * dt;

      const alpha = Math.max(0, p.life / p.maxLife);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
    }

    const now = performance.now();
    for (let i = this.brickAnims.length - 1; i >= 0; i--) {
      const a = this.brickAnims[i];
      const elapsed = now - a.startTime;
      const t = Math.min(elapsed / a.duration, 1);
      const s = easeOutBack(t);
      a.mesh.scale.set(s, s, s);
      if (t >= 1) {
        this.brickAnims.splice(i, 1);
      }
    }
  }

  render(): void {
    this.webglRenderer.render(this.scene, this.camera);
  }
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

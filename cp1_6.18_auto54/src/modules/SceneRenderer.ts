import * as THREE from 'three';
import type { StarData, ConnectionData, SceneRendererAPI } from '@/types';

const STAR_ROTATION_SPEED = 0.02;
const STAR_FLOAT_AMPLITUDE = 2;
const STAR_FLOAT_PERIOD = 3;
const RING_ROTATION_SPEED = Math.PI;
const RING_OFFSET = 8;
const RING_COLOR = 0x00e5ff;
const PARTICLE_COUNT = 6;
const PARTICLE_SPEED = 0.3;

interface StarMeshGroup {
  group: THREE.Group;
  sphere: THREE.Mesh;
  glow: THREE.Sprite;
  ring: THREE.Mesh | null;
  baseY: number;
}

interface ConnectionMeshGroup {
  group: THREE.Group;
  line: THREE.Line;
  particles: THREE.Mesh[];
  progress: number[];
}

class SceneRenderer implements SceneRendererAPI {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animationId: number = 0;
  private clock: THREE.Clock;
  private starMeshes: Map<string, StarMeshGroup> = new Map();
  private connectionMeshes: Map<string, ConnectionMeshGroup> = new Map();
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  private rotationVelocity = { x: 0, y: 0 };
  private damping = 0.95;
  private inertia = 0.8;
  private canvas: HTMLCanvasElement;
  private onStarClick: ((id: string, shiftKey: boolean) => void) | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private targetZoom = 1;
  private currentZoom = 1;

  constructor(container: HTMLDivElement, onStarClick?: (id: string, shiftKey: boolean) => void) {
    this.onStarClick = onStarClick || null;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.canvas = this.renderer.domElement;
    this.canvas.style.display = 'block';
    container.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.scene.background = this.createGradientBackground();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 0, 600);

    this.setupLighting();
    this.createStarFieldSphere();
    this.setupControls();
    this.animate();
  }

  private createGradientBackground(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#0A0A2A');
    gradient.addColorStop(1, '#000011');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0x222244, 0.5);
    this.scene.add(ambient);
    const directional = new THREE.DirectionalLight(0x4466aa, 0.3);
    directional.position.set(100, 100, 200);
    this.scene.add(directional);
  }

  private createStarFieldSphere() {
    const geometry = new THREE.SphereGeometry(500, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0x0a0a2a,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
      wireframeLinewidth: 0.5,
    });
    const sphere = new THREE.Mesh(geometry, material);
    this.scene.add(sphere);

    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 490 + Math.random() * 10;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const dotsGeometry = new THREE.BufferGeometry();
    dotsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dotsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(dotsGeometry, dotsMaterial);
    this.scene.add(points);
  }

  private setupControls() {
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('mouseup', this.onMouseUp);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('click', this.onClick);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  private onMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
    this.rotationVelocity = { x: 0, y: 0 };
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const deltaX = e.clientX - this.previousMousePosition.x;
    const deltaY = e.clientY - this.previousMousePosition.y;
    this.rotationVelocity.x = deltaY * 0.005;
    this.rotationVelocity.y = deltaX * 0.005;
    this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), -deltaX * 0.005);
    const right = new THREE.Vector3();
    right.crossVectors(this.camera.up, this.camera.position).normalize();
    this.camera.position.applyAxisAngle(right, deltaY * 0.005);
    this.camera.lookAt(0, 0, 0);
    this.previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  private onMouseUp = () => {
    this.isDragging = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1.05 : 0.95;
    this.targetZoom = Math.max(0.5, Math.min(3, this.targetZoom * delta));
  };

  private onClick = (e: MouseEvent) => {
    if (this.rotationVelocity.x > 0.01 || this.rotationVelocity.y > 0.01) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const starMeshes = Array.from(this.starMeshes.values()).map(s => s.sphere);
    const intersects = this.raycaster.intersectObjects(starMeshes);
    if (intersects.length > 0 && this.onStarClick) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      for (const [id, group] of this.starMeshes) {
        if (group.sphere === hitMesh) {
          this.onStarClick(id, e.shiftKey);
          break;
        }
      }
    }
  };

  setOnStarClick(handler: (id: string, shiftKey: boolean) => void) {
    this.onStarClick = handler;
  }

  addStar(star: StarData) {
    if (this.starMeshes.has(star.id)) return;

    const group = new THREE.Group();
    group.position.set(star.position.x, star.position.y, star.position.z);

    const geometry = new THREE.SphereGeometry(star.radius, 32, 32);
    const color = new THREE.Color(star.color);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: star.brightness * 0.8,
      roughness: 0.3,
      metalness: 0.1,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    const glowTexture = this.createGlowTexture(star.color);
    const glowMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      transparent: true,
      opacity: star.brightness * 0.6,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Sprite(glowMaterial);
    glow.scale.set(star.radius * 4, star.radius * 4, 1);
    group.add(glow);

    this.scene.add(group);
    this.starMeshes.set(star.id, {
      group,
      sphere,
      glow,
      ring: null,
      baseY: star.position.y,
    });
  }

  private createGlowTexture(color: string): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    const c = new THREE.Color(color);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);
    gradient.addColorStop(0, `rgba(${r},${g},${b},1)`);
    gradient.addColorStop(0.3, `rgba(${r},${g},${b},0.4)`);
    gradient.addColorStop(0.7, `rgba(${r},${g},${b},0.1)`);
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  removeStar(id: string) {
    const entry = this.starMeshes.get(id);
    if (!entry) return;
    this.scene.remove(entry.group);
    entry.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
      if (child instanceof THREE.Sprite) {
        child.material.map?.dispose();
        child.material.dispose();
      }
    });
    this.starMeshes.delete(id);
  }

  selectStar(id: string, selected: boolean) {
    const entry = this.starMeshes.get(id);
    if (!entry) return;
    if (selected && !entry.ring) {
      const sphereGeo = entry.sphere.geometry as THREE.SphereGeometry;
      const ringGeometry = new THREE.TorusGeometry(
        sphereGeo.parameters.radius + RING_OFFSET,
        1.2,
        16,
        64
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: RING_COLOR,
        transparent: true,
        opacity: 0.8,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      entry.group.add(ring);
      entry.ring = ring;
    } else if (!selected && entry.ring) {
      entry.group.remove(entry.ring);
      entry.ring.geometry.dispose();
      (entry.ring.material as THREE.Material).dispose();
      entry.ring = null;
    }
  }

  addConnection(connection: ConnectionData, stars: [StarData, StarData]) {
    if (this.connectionMeshes.has(connection.id)) return;

    const group = new THREE.Group();
    const start = new THREE.Vector3(stars[0].position.x, stars[0].position.y, stars[0].position.z);
    const end = new THREE.Vector3(stars[1].position.x, stars[1].position.y, stars[1].position.z);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    mid.y += start.distanceTo(end) * 0.05;

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const lineColor = new THREE.Color(connection.color);
    const material = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });
    const line = new THREE.Line(geometry, material);
    group.add(line);

    const glowLineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.3,
      linewidth: 1,
    });
    const glowLine = new THREE.Line(geometry.clone(), glowLineMaterial);
    group.add(glowLine);

    const particles: THREE.Mesh[] = [];
    const progress: number[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const pGeo = new THREE.SphereGeometry(2, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0.9,
      });
      const particle = new THREE.Mesh(pGeo, pMat);
      const t = i / PARTICLE_COUNT;
      const pos = curve.getPoint(t);
      particle.position.copy(pos);
      group.add(particle);
      particles.push(particle);
      progress.push(t);
    }

    this.scene.add(group);
    this.connectionMeshes.set(connection.id, { group, line, particles, progress });
  }

  removeConnection(id: string) {
    const entry = this.connectionMeshes.get(id);
    if (!entry) return;
    this.scene.remove(entry.group);
    entry.group.traverse(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
    });
    this.connectionMeshes.delete(id);
  }

  setView(options: { damping?: number; inertia?: number; zoom?: number }) {
    if (options.damping !== undefined) this.damping = options.damping;
    if (options.inertia !== undefined) this.inertia = options.inertia;
    if (options.zoom !== undefined) this.targetZoom = options.zoom;
  }

  captureSnapshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.canvas.toDataURL('image/png');
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  screenTo3D(clientX: number, clientY: number): { x: number; y: number; z: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(this.camera);
    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));
    return { x: pos.x, y: pos.y, z: 0 };
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    if (!this.isDragging) {
      this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationVelocity.y);
      const right = new THREE.Vector3();
      right.crossVectors(this.camera.up, this.camera.position).normalize();
      this.camera.position.applyAxisAngle(right, this.rotationVelocity.x);
      this.camera.lookAt(0, 0, 0);
      this.rotationVelocity.x *= this.damping;
      this.rotationVelocity.y *= this.damping;
    }

    this.currentZoom += (this.targetZoom - this.currentZoom) * 0.1;
    const dist = 600 / this.currentZoom;
    const dir = this.camera.position.clone().normalize();
    this.camera.position.copy(dir.multiplyScalar(dist));

    for (const [, entry] of this.starMeshes) {
      entry.sphere.rotation.y += STAR_ROTATION_SPEED * delta;
      entry.group.position.y = entry.baseY + Math.sin(elapsed * (2 * Math.PI / STAR_FLOAT_PERIOD)) * STAR_FLOAT_AMPLITUDE;
      if (entry.ring) {
        entry.ring.rotation.z += RING_ROTATION_SPEED * delta;
      }
      const pulse = 0.7 + 0.3 * Math.sin(elapsed * 2);
      (entry.sphere.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      entry.glow.material.opacity = pulse * 0.6;
    }

    for (const [, conn] of this.connectionMeshes) {
      const pulse = 0.6 + 0.4 * Math.sin(elapsed * 2);
      (conn.line.material as THREE.LineBasicMaterial).opacity = pulse;
      for (let i = 0; i < conn.particles.length; i++) {
        conn.progress[i] = (conn.progress[i] + PARTICLE_SPEED * delta) % 1;
      }
      for (let i = 0; i < conn.particles.length; i++) {
        const t = (elapsed * PARTICLE_SPEED + i / PARTICLE_COUNT) % 1;
        const linePositions = (conn.line.geometry as THREE.BufferGeometry).attributes.position;
        const idx = Math.floor(t * (linePositions.count - 1));
        const nextIdx = Math.min(idx + 1, linePositions.count - 1);
        const frac = t * (linePositions.count - 1) - idx;
        const px = linePositions.getX(idx) + (linePositions.getX(nextIdx) - linePositions.getX(idx)) * frac;
        const py = linePositions.getY(idx) + (linePositions.getY(nextIdx) - linePositions.getY(idx)) * frac;
        const pz = linePositions.getZ(idx) + (linePositions.getZ(nextIdx) - linePositions.getZ(idx)) * frac;
        conn.particles[i].position.set(px, py, pz);
        conn.particles[i].scale.setScalar(0.8 + 0.4 * Math.sin(elapsed * 4 + i));
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.animationId);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('wheel', this.onWheel);
    this.canvas.removeEventListener('click', this.onClick);
    window.removeEventListener('mouseup', this.onMouseUp);
    for (const [, entry] of this.starMeshes) {
      this.scene.remove(entry.group);
      entry.group.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) child.material.dispose();
        }
        if (child instanceof THREE.Sprite) {
          child.material.map?.dispose();
          child.material.dispose();
        }
      });
    }
    this.starMeshes.clear();
    for (const [, entry] of this.connectionMeshes) {
      this.scene.remove(entry.group);
      entry.group.traverse(child => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) child.material.dispose();
        }
      });
    }
    this.connectionMeshes.clear();
    this.renderer.dispose();
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}

export default SceneRenderer;

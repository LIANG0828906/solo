import * as THREE from 'three';
import { Bubble } from './Bubble';
import { computeSimilarity } from './mockData';
import type { BubbleData } from './mockData';

interface Connection {
  from: string;
  to: string;
  similarity: number;
  line: THREE.Line;
  particles: THREE.Points;
  particleData: Float32Array;
  particleProgress: Float32Array;
}

interface SceneCallbacks {
  onBubbleClick: (data: BubbleData) => void;
  onBackgroundClick: () => void;
}

const MAX_BUBBLES = 30;
const MAX_CONNECTIONS = 80;
const SIMILARITY_THRESHOLD = 0.5;
const PARTICLE_COUNT_PER_LINE = 4;

export class Scene3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private bubbles: Map<string, Bubble> = new Map();
  private connections: Connection[] = [];
  private stars: THREE.Points | null = null;
  private clock: THREE.Clock;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean = false;
  private mouseDownPos: THREE.Vector2 = new THREE.Vector2();
  private mouseDownTime: number = 0;

  private cameraTheta: number = 0;
  private cameraPhi: number = Math.PI / 2;
  private cameraRadius: number = 12;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  private isAutoRoaming: boolean = false;
  private roamAngle: number = 0;

  private selectedBubbleId: string | null = null;
  private animationId: number = 0;

  private callbacks: SceneCallbacks;
  private container: HTMLElement;

  private hoveredBubbleId: string | null = null;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupLighting();
    this.createStarfield();
    this.updateCameraPosition();

    this.bindEvents();
    this.animate();
  }

  private setupLighting() {
    const ambient = new THREE.AmbientLight(0x404060, 1.2);
    this.scene.add(ambient);

    const point1 = new THREE.PointLight(0xFF6B6B, 0.8, 30);
    point1.position.set(5, 8, 5);
    this.scene.add(point1);

    const point2 = new THREE.PointLight(0x4ECDC4, 0.6, 30);
    point2.position.set(-5, -3, -8);
    this.scene.add(point2);

    const point3 = new THREE.PointLight(0x1A535C, 0.4, 25);
    point3.position.set(0, -6, 5);
    this.scene.add(point3);
  }

  private createStarfield() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const periods = new Float32Array(count);
    const baseOpacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 30 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      sizes[i] = 1 + Math.random() * 2;
      phases[i] = Math.random() * Math.PI * 2;
      periods[i] = 1.5 + Math.random() * 1.5;
      baseOpacities[i] = 0.2 + Math.random() * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.stars = new THREE.Points(geometry, material);
    (this.stars as any).__starData = { phases, periods, baseOpacities };
    this.scene.add(this.stars);
  }

  private updateStars(time: number) {
    if (!this.stars) return;
    const starData = (this.stars as any).__starData;
    const count = starData.phases.length;
    let avgOpacity = 0;
    for (let i = 0; i < count; i++) {
      const brightness = starData.baseOpacities[i] *
        (0.5 + 0.5 * Math.sin(time / starData.periods[i] * Math.PI * 2 + starData.phases[i]));
      avgOpacity += brightness;
    }
    avgOpacity /= count;
    (this.stars.material as THREE.PointsMaterial).opacity = Math.max(0.1, avgOpacity);
  }

  addBubble(data: BubbleData) {
    if (this.bubbles.size >= MAX_BUBBLES) {
      this.removeFarthestBubble();
    }

    const bubble = new Bubble(data);
    bubble.spawn(this.clock.getElapsedTime());
    this.bubbles.set(data.id, bubble);
    this.scene.add(bubble.mesh);
    this.scene.add(bubble.glowMesh);

    this.updateConnections();
  }

  private removeFarthestBubble() {
    let farthestId: string | null = null;
    let maxDist = -1;

    for (const [id, bubble] of this.bubbles) {
      const dist = bubble.basePosition.length();
      if (dist > maxDist) {
        maxDist = dist;
        farthestId = id;
      }
    }

    if (farthestId) {
      this.removeBubble(farthestId);
    }
  }

  removeBubble(id: string) {
    const bubble = this.bubbles.get(id);
    if (!bubble) return;

    this.scene.remove(bubble.mesh);
    this.scene.remove(bubble.glowMesh);
    bubble.dispose();
    this.bubbles.delete(id);

    if (this.selectedBubbleId === id) {
      this.selectedBubbleId = null;
    }

    this.updateConnections();
  }

  selectBubble(id: string) {
    if (this.selectedBubbleId) {
      const prev = this.bubbles.get(this.selectedBubbleId);
      if (prev) prev.deselect();
    }

    this.selectedBubbleId = id;
    const bubble = this.bubbles.get(id);
    if (bubble) {
      bubble.select();
    }

    this.updateConnectionHighlights();
  }

  deselectBubble() {
    if (this.selectedBubbleId) {
      const prev = this.bubbles.get(this.selectedBubbleId);
      if (prev) prev.deselect();
    }
    this.selectedBubbleId = null;
    this.updateConnectionHighlights();
  }

  private updateConnections() {
    for (const conn of this.connections) {
      this.scene.remove(conn.line);
      this.scene.remove(conn.particles);
      conn.line.geometry.dispose();
      (conn.line.material as THREE.Material).dispose();
      conn.particles.geometry.dispose();
      (conn.particles.material as THREE.Material).dispose();
    }
    this.connections = [];

    const bubbleArray = Array.from(this.bubbles.values());
    const candidates: { from: Bubble; to: Bubble; similarity: number }[] = [];

    for (let i = 0; i < bubbleArray.length; i++) {
      for (let j = i + 1; j < bubbleArray.length; j++) {
        const sim = computeSimilarity(bubbleArray[i].data, bubbleArray[j].data);
        if (sim >= SIMILARITY_THRESHOLD) {
          candidates.push({ from: bubbleArray[i], to: bubbleArray[j], similarity: sim });
        }
      }
    }

    candidates.sort((a, b) => b.similarity - a.similarity);
    const selected = candidates.slice(0, MAX_CONNECTIONS);

    for (const cand of selected) {
      const connection = this.createConnection(cand.from, cand.to, cand.similarity);
      this.connections.push(connection);
    }

    this.updateConnectionHighlights();
  }

  private createConnection(from: Bubble, to: Bubble, similarity: number): Connection {
    const start = from.mesh.position.clone();
    const end = to.mesh.position.clone();
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 2
    );
    mid.add(offset);

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.3,
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    const particleCount = PARTICLE_COUNT_PER_LINE;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleProgress = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particleProgress[i] = i / particleCount;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: 0.06,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(particles);

    return {
      from: from.data.id,
      to: to.data.id,
      similarity,
      line,
      particles,
      particleData: particlePositions,
      particleProgress,
    };
  }

  private updateConnectionHighlights() {
    const activeId = this.selectedBubbleId || this.hoveredBubbleId;

    for (const conn of this.connections) {
      const isActive = activeId !== null &&
        (conn.from === activeId || conn.to === activeId);

      const lineMat = conn.line.material as THREE.LineBasicMaterial;
      const particleMat = conn.particles.material as THREE.PointsMaterial;

      if (isActive) {
        lineMat.color.setHex(0xFF6B6B);
        lineMat.opacity = 0.8;
        particleMat.color.setHex(0xFF6B6B);
        particleMat.opacity = 0.9;
      } else if (activeId !== null) {
        lineMat.opacity = 0.05;
        particleMat.opacity = 0.05;
      } else {
        lineMat.color.setHex(0xFFFFFF);
        lineMat.opacity = 0.3;
        particleMat.color.setHex(0xFFFFFF);
        particleMat.opacity = 0.6;
      }
    }
  }

  private updateParticles(deltaTime: number) {
    for (const conn of this.connections) {
      const fromBubble = this.bubbles.get(conn.from);
      const toBubble = this.bubbles.get(conn.to);
      if (!fromBubble || !toBubble) continue;

      const start = fromBubble.mesh.position;
      const end = toBubble.mesh.position;
      const mid = start.clone().add(end).multiplyScalar(0.5);

      const speed = 0.5 / Math.max(0.1, start.distanceTo(end));
      const particleCount = conn.particleProgress.length;

      for (let i = 0; i < particleCount; i++) {
        conn.particleProgress[i] += deltaTime * speed;
        if (conn.particleProgress[i] > 1) {
          conn.particleProgress[i] -= 1;
        }

        const t = conn.particleProgress[i];
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * mid.x + t * t * end.x;
        const y = oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * mid.y + t * t * end.y;
        const z = oneMinusT * oneMinusT * start.z + 2 * oneMinusT * t * mid.z + t * t * end.z;

        conn.particleData[i * 3] = x;
        conn.particleData[i * 3 + 1] = y;
        conn.particleData[i * 3 + 2] = z;
      }

      const posAttr = conn.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
    }
  }

  private updateCameraPosition() {
    const x = this.cameraRadius * Math.sin(this.cameraPhi) * Math.cos(this.cameraTheta);
    const y = this.cameraRadius * Math.cos(this.cameraPhi);
    const z = this.cameraRadius * Math.sin(this.cameraPhi) * Math.sin(this.cameraTheta);

    this.camera.position.set(
      this.cameraTarget.x + x,
      this.cameraTarget.y + y,
      this.cameraTarget.z + z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  toggleAutoRoam(): boolean {
    this.isAutoRoaming = !this.isAutoRoaming;
    if (this.isAutoRoaming) {
      this.roamAngle = this.cameraTheta;
    }
    return this.isAutoRoaming;
  }

  getAutoRoamState(): boolean {
    return this.isAutoRoaming;
  }

  private bindEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private onMouseDown(e: MouseEvent) {
    this.mouseDownPos.set(e.clientX, e.clientY);
    this.mouseDownTime = performance.now();
    this.isDragging = false;
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.mouseDownPos) {
      const dx = e.clientX - this.mouseDownPos.x;
      const dy = e.clientY - this.mouseDownPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) {
        this.isDragging = true;
      }
    }

    if (this.isDragging && !this.isAutoRoaming) {
      const dx = e.movementX * 0.005 * 0.5;
      const dy = e.movementY * 0.005 * 0.5;
      this.cameraTheta -= dx;
      this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi + dy));
      this.updateCameraPosition();
    }

    this.updateHover();
  }

  private onMouseUp(e: MouseEvent) {
    const elapsed = performance.now() - this.mouseDownTime;
    const dx = e.clientX - this.mouseDownPos.x;
    const dy = e.clientY - this.mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (elapsed < 300 && dist < 5) {
      this.handleClick();
    }

    this.isDragging = false;
  }

  private onWheel(e: WheelEvent) {
    e.preventDefault();
    if (this.isAutoRoaming) return;
    this.cameraRadius += e.deltaY * 0.01;
    this.cameraRadius = Math.max(2, Math.min(12, this.cameraRadius));
    this.updateCameraPosition();
  }

  private touchStartPos: THREE.Vector2 = new THREE.Vector2();
  private touchStartTime: number = 0;

  private onTouchStart(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.touchStartPos.set(e.touches[0].clientX, e.touches[0].clientY);
      this.touchStartTime = performance.now();
      this.isDragging = false;
    }
  }

  private onTouchMove(e: TouchEvent) {
    if (e.touches.length === 1 && !this.isAutoRoaming) {
      const dx = e.touches[0].clientX - this.touchStartPos.x;
      const dy = e.touches[0].clientY - this.touchStartPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        this.isDragging = true;
        this.cameraTheta -= dx * 0.003;
        this.cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraPhi + dy * 0.003));
        this.updateCameraPosition();
        this.touchStartPos.set(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  }

  private onTouchEnd(e: TouchEvent) {
    const elapsed = performance.now() - this.touchStartTime;
    if (elapsed < 300 && !this.isDragging) {
      this.handleClick();
    }
    this.isDragging = false;
  }

  private updateHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.bubbles.values()).map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    const newHoveredId = intersects.length > 0
      ? (intersects[0].object.userData.bubbleId as string)
      : null;

    if (newHoveredId !== this.hoveredBubbleId) {
      this.hoveredBubbleId = newHoveredId;
      this.renderer.domElement.style.cursor = newHoveredId ? 'pointer' : 'default';
      this.updateConnectionHighlights();
    }
  }

  private handleClick() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.bubbles.values()).map(b => b.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const bubbleId = intersects[0].object.userData.bubbleId as string;
      const bubble = this.bubbles.get(bubbleId);
      if (bubble) {
        this.selectBubble(bubbleId);
        this.callbacks.onBubbleClick(bubble.data);
      }
    } else {
      this.deselectBubble();
      this.callbacks.onBackgroundClick();
    }
  }

  private onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.05);
    const elapsedTime = this.clock.getElapsedTime();

    for (const bubble of this.bubbles.values()) {
      bubble.update(deltaTime, elapsedTime);
    }

    if (this.isAutoRoaming) {
      this.roamAngle += deltaTime * (Math.PI * 2 / 20);
      this.cameraTheta = this.roamAngle;
      this.cameraPhi = Math.PI / 2 + Math.sin(this.roamAngle * 0.3) * 0.5;
      this.updateCameraPosition();
    }

    this.updateParticles(deltaTime);
    this.updateStars(elapsedTime);

    this.renderer.render(this.scene, this.camera);
  }

  focusOnBubble(id: string) {
    const bubble = this.bubbles.get(id);
    if (!bubble) return;

    this.selectBubble(id);
    this.callbacks.onBubbleClick(bubble.data);
  }

  getBubbleData(id: string): BubbleData | undefined {
    return this.bubbles.get(id)?.data;
  }

  getConnectedBubbleIds(id: string): string[] {
    const connected: string[] = [];
    for (const conn of this.connections) {
      if (conn.from === id) connected.push(conn.to);
      else if (conn.to === id) connected.push(conn.from);
    }
    return connected;
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    for (const bubble of this.bubbles.values()) {
      bubble.dispose();
    }
    for (const conn of this.connections) {
      conn.line.geometry.dispose();
      (conn.line.material as THREE.Material).dispose();
      conn.particles.geometry.dispose();
      (conn.particles.material as THREE.Material).dispose();
    }
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

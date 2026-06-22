import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CelestialObject, CelestialType } from '../data/CelestialDataModel';
import { getTypeLabel } from '../data/CelestialDataModel';

export interface LabelInfo {
  id: string;
  name: string;
  type: string;
  screenX: number;
  screenY: number;
  worldX: number;
  worldY: number;
  worldZ: number;
  isHighlighted: boolean;
}

type Callbacks = {
  onLabelUpdate: (labels: LabelInfo[]) => void;
  onHoverChange: (id: string | null) => void;
  onClickCelestial: (id: string) => void;
};

export class SceneRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private container: HTMLElement;
  private celestialGroups: Map<string, THREE.Group> = new Map();
  private hitSpheres: Map<string, THREE.Mesh> = new Map();
  private glowRings: Map<string, THREE.Mesh> = new Map();
  private connectionLines: Map<string, THREE.Line> = new Map();
  private starField: THREE.Points | null = null;
  private animationId = 0;
  private autoRotateEnabled = true;
  private focusedId: string | null = null;
  private hoveredId: string | null = null;
  private time = 0;
  private callbacks: Callbacks | null = null;
  private particleTexture: THREE.Texture;
  private galaxyRotations: Map<string, number> = new Map();
  private celestialData: CelestialObject[] = [];
  private targetCameraPos: THREE.Vector3 | null = null;
  private targetLookAt: THREE.Vector3 | null = null;
  private isTransitioning = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.mouse = new THREE.Vector2(-999, -999);
    this.raycaster = new THREE.Raycaster();

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 25, 60);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;

    this.particleTexture = this.createParticleTexture();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onResize = this.onResize.bind(this);
    this.animate = this.animate.bind(this);

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('click', this.onClick);
    window.addEventListener('resize', this.onResize);
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.9)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  setCallbacks(callbacks: Callbacks) {
    this.callbacks = callbacks;
  }

  init(celestialData: CelestialObject[]) {
    this.celestialData = celestialData;
    this.createStarField();

    for (const obj of celestialData) {
      this.createCelestialObject(obj);
    }

    this.animate(0);
  }

  private createStarField() {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 200 + Math.random() * 300;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.82 + Math.random() * 0.18;
      const blueShift = Math.random() * 0.15;
      colors[i * 3] = brightness - blueShift;
      colors[i * 3 + 1] = brightness - blueShift;
      colors[i * 3 + 2] = brightness;

      sizes[i] = 1 + Math.random() * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      map: this.particleTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.starField = new THREE.Points(geometry, material);
    this.scene.add(this.starField);
  }

  private createCelestialObject(data: CelestialObject) {
    const group = new THREE.Group();
    group.position.set(data.position.x, data.position.y, data.position.z);

    let points: THREE.Points;
    switch (data.type) {
      case 'nebula':
        points = this.createNebulaParticles(data);
        break;
      case 'galaxy':
        points = this.createGalaxyParticles(data);
        break;
      case 'starcluster':
        points = this.createStarClusterParticles(data);
        break;
    }

    group.add(points);
    this.celestialGroups.set(data.id, group);
    this.scene.add(group);

    const hitSphere = this.createHitSphere(data);
    this.hitSpheres.set(data.id, hitSphere);
    group.add(hitSphere);

    const glowRing = this.createGlowRing(data);
    glowRing.visible = false;
    this.glowRings.set(data.id, glowRing);
    group.add(glowRing);

    this.createConnectionLine(data, group);

    if (data.type === 'galaxy') {
      this.galaxyRotations.set(data.id, 0.005 + Math.random() * 0.003);
    }
  }

  private createNebulaParticles(data: CelestialObject): THREE.Points {
    const count = 500 + Math.floor(Math.random() * 500);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const baseColor = new THREE.Color(data.color);
    const secondaryColor = new THREE.Color(data.color).offsetHSL(0.05, -0.1, 0.2);

    for (let i = 0; i < count; i++) {
      const r = Math.abs(this.gaussianRandom()) * data.size * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      const c = baseColor.clone().lerp(secondaryColor, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 3 + Math.random() * 5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 5,
      vertexColors: true,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
      map: this.particleTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  private createGalaxyParticles(data: CelestialObject): THREE.Points {
    const count = 800 + Math.floor(Math.random() * 700);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const centerColor = new THREE.Color('#FFD700');
    const edgeColor = new THREE.Color('#7B68EE');
    const numArms = 2 + Math.floor(Math.random() * 2);
    const spiralTightness = 0.8 + Math.random() * 0.4;

    for (let i = 0; i < count; i++) {
      const armIndex = Math.floor(Math.random() * numArms);
      const distance = Math.random() * data.size;
      const normalizedDist = distance / data.size;

      const armAngle = (armIndex / numArms) * Math.PI * 2;
      const spiralAngle = armAngle + distance * spiralTightness;
      const spread = normalizedDist * 0.6 + 0.1;

      const angle = spiralAngle + (Math.random() - 0.5) * spread;

      positions[i * 3] = distance * Math.cos(angle) + (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 1] = (Math.random() - 0.5) * data.size * 0.08 * (1 - normalizedDist * 0.5);
      positions[i * 3 + 2] = distance * Math.sin(angle) + (Math.random() - 0.5) * 0.3;

      const c = centerColor.clone().lerp(edgeColor, normalizedDist);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      map: this.particleTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  private createStarClusterParticles(data: CelestialObject): THREE.Points {
    const count = 300 + Math.floor(Math.random() * 300);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const innerColor = new THREE.Color('#FFFFFF');
    const outerColor = new THREE.Color('#A9A9A9');

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 1 / 3) * data.size;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const t = r / data.size;
      const c = innerColor.clone().lerp(outerColor, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      map: this.particleTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return new THREE.Points(geometry, material);
  }

  private createHitSphere(data: CelestialObject): THREE.Mesh {
    const radius = Math.max(data.size * 1.2, 2);
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    return new THREE.Mesh(geometry, material);
  }

  private createGlowRing(data: CelestialObject): THREE.Mesh {
    const radius = Math.max(data.size * 1.2, 2);
    const innerRadius = radius * 0.95;
    const outerRadius = radius * 1.2;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    const material = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.lookAt(this.camera.position);
    return ring;
  }

  private createConnectionLine(data: CelestialObject, group: THREE.Group) {
    const labelOffset = data.size + 2;
    const points = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, labelOffset, 0),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.4,
    });
    const line = new THREE.Line(geometry, material);
    this.connectionLines.set(data.id, line);
    group.add(line);
  }

  private gaussianRandom(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  updateCamera(distance: number) {
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    const newPos = this.controls.target.clone().add(dir.multiplyScalar(distance));
    this.camera.position.copy(newPos);
    this.controls.update();
  }

  setAutoRotate(enabled: boolean) {
    this.autoRotateEnabled = enabled;
    this.controls.autoRotate = enabled;
  }

  focusOnObject(id: string) {
    const obj = this.celestialData.find((d) => d.id === id);
    if (!obj) return;

    this.focusedId = id;
    this.controls.autoRotate = false;

    const targetPos = new THREE.Vector3(obj.position.x, obj.position.y, obj.position.z);
    const cameraOffset = obj.size * 2 + 5;
    const cameraTarget = targetPos.clone().add(new THREE.Vector3(0, cameraOffset * 0.3, cameraOffset));

    this.targetCameraPos = cameraTarget;
    this.targetLookAt = targetPos;
    this.isTransitioning = true;
  }

  resetToOverview() {
    this.focusedId = null;
    this.controls.autoRotate = this.autoRotateEnabled;

    this.targetCameraPos = new THREE.Vector3(0, 25, 60);
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.isTransitioning = true;
  }

  filterByType(type: CelestialType | 'all') {
    for (const [id, group] of this.celestialGroups) {
      const obj = this.celestialData.find((d) => d.id === id);
      if (!obj) continue;
      const visible = type === 'all' || obj.type === type;
      group.visible = visible;
      const hitSphere = this.hitSpheres.get(id);
      if (hitSphere) hitSphere.visible = visible;
    }
  }

  getCameraInfo(): { position: THREE.Vector3; azimuth: number; polar: number } {
    const spherical = new THREE.Spherical().setFromVector3(
      this.camera.position.clone().sub(this.controls.target)
    );
    return {
      position: this.camera.position.clone(),
      azimuth: THREE.MathUtils.radToDeg(spherical.theta),
      polar: THREE.MathUtils.radToDeg(spherical.phi),
    };
  }

  private onMouseMove(event: MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onClick(_event: MouseEvent) {
    if (this.hoveredId) {
      this.callbacks?.onClickCelestial(this.hoveredId);
    }
  }

  private onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private updateRaycasting() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hitMeshes = Array.from(this.hitSpheres.values()).filter(
      (m) => m.visible && m.parent?.visible !== false
    );
    const intersects = this.raycaster.intersectObjects(hitMeshes, false);

    let newHoveredId: string | null = null;
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      for (const [id, mesh] of this.hitSpheres) {
        if (mesh === hitMesh) {
          newHoveredId = id;
          break;
        }
      }
    }

    if (newHoveredId !== this.hoveredId) {
      if (this.hoveredId) {
        const ring = this.glowRings.get(this.hoveredId);
        if (ring) ring.visible = false;
      }
      if (newHoveredId) {
        const ring = this.glowRings.get(newHoveredId);
        if (ring) ring.visible = true;
      }
      this.hoveredId = newHoveredId;
      this.callbacks?.onHoverChange(newHoveredId);
    }
  }

  private updateLabels() {
    const labels: LabelInfo[] = [];
    const halfW = this.container.clientWidth / 2;
    const halfH = this.container.clientHeight / 2;

    for (const data of this.celestialData) {
      const group = this.celestialGroups.get(data.id);
      if (!group || !group.visible) continue;

      const worldPos = new THREE.Vector3(
        data.position.x,
        data.position.y + data.size + 2.5,
        data.position.z
      );

      const projected = worldPos.clone().project(this.camera);
      if (projected.z > 1) continue;

      const screenX = (projected.x * halfW) + halfW;
      const screenY = -(projected.y * halfH) + halfH;

      const isHighlighted = this.focusedId === data.id;

      labels.push({
        id: data.id,
        name: data.name,
        type: getTypeLabel(data.type),
        screenX,
        screenY,
        worldX: data.position.x,
        worldY: data.position.y,
        worldZ: data.position.z,
        isHighlighted,
      });
    }

    this.callbacks?.onLabelUpdate(labels);
  }

  private animate(timestamp: number) {
    this.animationId = requestAnimationFrame(this.animate);

    const delta = (timestamp - this.time) / 1000;
    this.time = timestamp;

    if (this.isTransitioning && this.targetCameraPos && this.targetLookAt) {
      this.camera.position.lerp(this.targetCameraPos, 0.05);
      this.controls.target.lerp(this.targetLookAt, 0.05);

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.1) {
        this.camera.position.copy(this.targetCameraPos);
        this.controls.target.copy(this.targetLookAt);
        this.isTransitioning = false;
      }
    }

    this.controls.update();

    for (const [id, group] of this.celestialGroups) {
      const obj = this.celestialData.find((d) => d.id === id);
      if (!obj || !group.visible) continue;

      if (obj.type === 'nebula') {
        const breathe = 1 + Math.sin(timestamp * 0.0005) * 0.015;
        group.scale.setScalar(breathe);
      }

      if (obj.type === 'galaxy') {
        const speed = this.galaxyRotations.get(id) || 0.005;
        const points = group.children.find((c) => c instanceof THREE.Points);
        if (points) {
          points.rotation.y += speed;
        }
      }

      const ring = this.glowRings.get(id);
      if (ring && ring.visible) {
        ring.lookAt(this.camera.position);
      }
    }

    this.updateRaycasting();
    this.updateLabels();

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.animationId);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    window.removeEventListener('resize', this.onResize);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.Points) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.Line) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.particleTexture.dispose();
    this.renderer.dispose();
    this.controls.dispose();

    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

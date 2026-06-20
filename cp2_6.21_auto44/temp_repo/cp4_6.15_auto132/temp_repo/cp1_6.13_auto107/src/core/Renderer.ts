import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { eventBus } from '../utils/EventBus';

export interface MagnetData {
  id: string;
  position: { x: number; y: number; z: number };
  polarity: 'N' | 'S';
  strength: number;
}

export interface FieldLineData {
  points: { x: number; y: number; z: number }[];
  fieldStrengths: number[];
  magnetId: string;
}

interface MagnetObject {
  data: MagnetData;
  group: THREE.Group;
  sphere: THREE.Mesh;
  arrow: THREE.ArrowHelper;
  glow: THREE.Mesh;
  fadingOut?: boolean;
  fadeStartTime?: number;
}

interface FieldLineObject {
  id: string;
  line: THREE.Line;
  tube?: THREE.Mesh;
  particles: THREE.Points;
  particleSpeeds: number[];
  particleOffsets: number[];
  magnetId: string;
  animationPhase: 'growing' | 'stable' | 'shrinking';
  animationStartTime: number;
  totalLength: number;
  distances: number[];
  threePoints: THREE.Vector3[];
  pointCount: number;
}

const PARTICLES_PER_LINE = 10;
const PARTICLE_SPEED = 1.5;
const UPDATE_DELAY = 200;
const GROW_DURATION = 500;
const SHRINK_DURATION = 300;
const FADE_DURATION = 500;

export class Renderer {
  private container!: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private groundGrid!: THREE.GridHelper;
  private groundPlane!: THREE.Mesh;
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;

  private magnets: Map<string, MagnetObject> = new Map();
  private fieldLines: FieldLineObject[] = [];
  private pendingFieldLines: FieldLineData[] = [];
  private lastUpdateTime: number = 0;
  private updateScheduled: boolean = false;
  private pendingFieldLinesTimestamp: number = 0;

  private highlightedMagnetId: string | null = null;
  private selectedMagnetId: string | null = null;
  private isDragging: boolean = false;
  private dragOffset: THREE.Vector3 = new THREE.Vector3();

  private spotLights: THREE.SpotLight[] = [];
  private flashEffects: { light: THREE.PointLight; startTime: number; position: THREE.Vector3 }[] = [];

  private animationFrameId: number | null = null;
  private clock: THREE.Clock;

  private fieldWorker: Worker | null = null;
  private workerBusy: boolean = false;
  private pendingMagnets: MagnetData[] | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.clock = new THREE.Clock();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15 * Math.sin(Math.PI / 6), 15 * Math.cos(Math.PI / 6));
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 30;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupGround();
    this.setupLighting();
    this.setupEvents();
    this.initWorker();

    this.animate();
  }

  private setupGround() {
    const gridSize = 40;
    const gridDivisions = 40;
    this.groundGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x1a1a3a, 0x1a1a3a);
    (this.groundGrid.material as THREE.Material).transparent = true;
    (this.groundGrid.material as THREE.Material).opacity = 0.6;
    this.scene.add(this.groundGrid);

    const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x0a0a1a,
      transparent: true,
      opacity: 0.01,
      side: THREE.DoubleSide,
    });
    this.groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundPlane.rotation.x = -Math.PI / 2;
    this.groundPlane.name = 'groundPlane';
    this.scene.add(this.groundPlane);
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this.scene.add(dirLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 0.5, 50);
    pointLight1.position.set(-10, 10, -10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x9b59b6, 0.5, 50);
    pointLight2.position.set(10, 10, 10);
    this.scene.add(pointLight2);
  }

  private setupEvents() {
    window.addEventListener('resize', this.onWindowResize);
    this.renderer.domElement.addEventListener('click', this.onCanvasClick);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);

    eventBus.on('magnet:added', this.handleMagnetAdded.bind(this));
    eventBus.on('magnet:removed', this.handleMagnetRemoved.bind(this));
    eventBus.on('magnet:updated', this.handleMagnetUpdated.bind(this));
    eventBus.on('magnet:selected', this.handleMagnetSelected.bind(this));
    eventBus.on('scene:reset', this.handleSceneReset.bind(this));
  }

  private initWorker() {
    try {
      this.fieldWorker = new Worker(
        new URL('../workers/FieldWorker.ts', import.meta.url),
        { type: 'module' }
      );
      this.fieldWorker.onmessage = this.handleWorkerMessage.bind(this);
    } catch (e) {
      console.warn('Web Worker 初始化失败，降级为同步计算', e);
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    const { type, lines, timestamp } = e.data;
    if (type === 'result') {
      this.workerBusy = false;
      this.scheduleFieldLinesUpdate(lines, timestamp);

      if (this.pendingMagnets) {
        this.calculateFieldLinesAsync(this.pendingMagnets);
        this.pendingMagnets = null;
      }
    }
  }

  private handleMagnetAdded(magnet: MagnetData) {
    this.createMagnetObject(magnet);
    this.addFlashEffect(magnet.position);
    this.requestFieldUpdate();
  }

  private handleMagnetRemoved(id: string) {
    const magnetObj = this.magnets.get(id);
    if (magnetObj) {
      magnetObj.fadingOut = true;
      magnetObj.fadeStartTime = performance.now();
    }
    this.requestFieldUpdate();
  }

  private handleMagnetUpdated(magnet: MagnetData) {
    const magnetObj = this.magnets.get(magnet.id);
    if (magnetObj) {
      magnetObj.data = { ...magnet };
      this.updateMagnetVisual(magnetObj);
    }
    this.requestFieldUpdate();
  }

  private handleMagnetSelected(id: string | null) {
    this.highlightedMagnetId = id;
    this.selectedMagnetId = id;
    this.updateHighlightState();
  }

  private handleSceneReset() {
    this.resetView();
    this.clearAllMagnets();
  }

  private createMagnetObject(magnet: MagnetData) {
    const group = new THREE.Group();
    group.position.set(magnet.position.x, magnet.position.y, magnet.position.z);

    const sphereGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const color = magnet.polarity === 'N' ? 0xff3355 : 0x3366ff;
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3 + magnet.strength * 0.05,
      shininess: 100,
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    group.add(sphere);

    const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2 + magnet.strength * 0.02,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    const arrowDirection = new THREE.Vector3(0, 1, 0);
    const arrowColor = magnet.polarity === 'N' ? 0xff6677 : 0x6699ff;
    const arrow = new THREE.ArrowHelper(
      arrowDirection,
      new THREE.Vector3(0, 0, 0),
      0.8 + magnet.strength * 0.1,
      arrowColor,
      0.3,
      0.15
    );
    group.add(arrow);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 128;
    labelCanvas.height = 64;
    const ctx = labelCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 128, 64);
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(magnet.polarity, 64, 32);
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMaterial = new THREE.SpriteMaterial({
      map: labelTexture,
      transparent: true,
    });
    const labelSprite = new THREE.Sprite(labelMaterial);
    labelSprite.position.set(0, 0.9, 0);
    labelSprite.scale.set(0.8, 0.4, 1);
    group.add(labelSprite);

    group.userData.magnetId = magnet.id;
    group.userData.isMagnet = true;

    this.scene.add(group);
    this.magnets.set(magnet.id, { data: magnet, group, sphere, arrow, glow });

    eventBus.emit('magnet:created', magnet.id);
  }

  private updateMagnetVisual(magnetObj: MagnetObject) {
    const { data, sphere, glow, arrow, group } = magnetObj;
    const color = data.polarity === 'N' ? 0xff3355 : 0x3366ff;

    (sphere.material as THREE.MeshPhongMaterial).color.setHex(color);
    (sphere.material as THREE.MeshPhongMaterial).emissive.setHex(color);
    (sphere.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.3 + data.strength * 0.05;

    (glow.material as THREE.MeshBasicMaterial).color.setHex(color);
    (glow.material as THREE.MeshBasicMaterial).opacity = 0.2 + data.strength * 0.02;

    group.position.set(data.position.x, data.position.y, data.position.z);
  }

  private addFlashEffect(position: { x: number; y: number; z: number }) {
    const flashLight = new THREE.PointLight(0x00d4ff, 3, 10);
    flashLight.position.set(position.x, position.y + 0.5, position.z);
    this.scene.add(flashLight);

    this.flashEffects.push({
      light: flashLight,
      startTime: performance.now(),
      position: new THREE.Vector3(position.x, position.y + 0.5, position.z),
    });

    const spotLight = new THREE.SpotLight(0x00d4ff, 2, 15, Math.PI / 6, 0.5);
    spotLight.position.set(position.x, 8, position.z);
    spotLight.target.position.set(position.x, 0, position.z);
    this.scene.add(spotLight);
    this.scene.add(spotLight.target);
    this.spotLights.push(spotLight);

    setTimeout(() => {
      const idx = this.spotLights.indexOf(spotLight);
      if (idx > -1) {
        this.scene.remove(spotLight);
        this.scene.remove(spotLight.target);
        this.spotLights.splice(idx, 1);
      }
    }, 400);
  }

  private requestFieldUpdate() {
    const now = performance.now();
    const magnets = Array.from(this.magnets.values())
      .filter((m) => !m.fadingOut)
      .map((m) => m.data);

    if (this.updateScheduled) return;

    this.updateScheduled = true;
    setTimeout(() => {
      this.updateScheduled = false;
      this.calculateFieldLinesAsync(magnets);
    }, UPDATE_DELAY);
  }

  private calculateFieldLinesAsync(magnets: MagnetData[]) {
    if (this.fieldWorker && !this.workerBusy) {
      this.workerBusy = true;
      this.fieldWorker.postMessage({
        type: 'calculate',
        magnets,
        lineCount: 150,
        sceneBounds: 20,
      });
    } else if (this.fieldWorker && this.workerBusy) {
      this.pendingMagnets = magnets;
    } else {
      this.calculateFieldLinesFallback(magnets);
    }
  }

  private calculateFieldLinesFallback(magnets: MagnetData[]) {
    import('../core/FieldCalculator').then((module) => {
      const lines = module.calculateFieldLines(magnets, 150, 20);
      this.scheduleFieldLinesUpdate(lines, Date.now());
    });
  }

  private scheduleFieldLinesUpdate(lines: FieldLineData[], timestamp: number) {
    this.pendingFieldLines = lines;
    this.pendingFieldLinesTimestamp = timestamp;

    this.fieldLines.forEach((line) => {
      if (line.animationPhase === 'stable') {
        line.animationPhase = 'shrinking';
        line.animationStartTime = performance.now();
      }
    });
  }

  private createFieldLine(lineData: FieldLineData): FieldLineObject {
    const points = lineData.points;
    const threePoints = points.map(
      (p) => new THREE.Vector3(p.x, p.y, p.z)
    );
    const pointCount = threePoints.length;

    const geometry = new THREE.BufferGeometry().setFromPoints(threePoints);

    const colors = new Float32Array(points.length * 3);
    const maxStrength = Math.max(...lineData.fieldStrengths);
    const minStrength = Math.min(...lineData.fieldStrengths);
    const range = maxStrength - minStrength || 1;

    for (let i = 0; i < points.length; i++) {
      const t = (lineData.fieldStrengths[i] - minStrength) / range;
      const color = this.getGradientColor(t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      linewidth: 1,
    });

    const line = new THREE.Line(geometry, material);

    const distances: number[] = [];
    let totalLength = 0;
    distances.push(0);
    for (let i = 1; i < threePoints.length; i++) {
      totalLength += threePoints[i].distanceTo(threePoints[i - 1]);
      distances.push(totalLength);
    }

    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(PARTICLES_PER_LINE * 3);
    const particleColors = new Float32Array(PARTICLES_PER_LINE * 3);
    const particleSpeeds: number[] = [];
    const particleOffsets: number[] = [];

    for (let i = 0; i < PARTICLES_PER_LINE; i++) {
      particleOffsets.push((totalLength / PARTICLES_PER_LINE) * i);
      particleSpeeds.push(PARTICLE_SPEED * (0.8 + Math.random() * 0.4));

      const pos = this.getPointAtDistance(threePoints, distances, particleOffsets[i]);
      particlePositions[i * 3] = pos.x;
      particlePositions[i * 3 + 1] = pos.y;
      particlePositions[i * 3 + 2] = pos.z;

      const t = 1 - particleOffsets[i] / totalLength;
      const color = this.getGradientColor(t);
      particleColors[i * 3] = color.r;
      particleColors[i * 3 + 1] = color.g;
      particleColors[i * 3 + 2] = color.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);

    const fieldLineObj: FieldLineObject = {
      id: `line_${lineData.magnetId}_${Math.random().toString(36).substr(2, 9)}`,
      line,
      particles,
      particleSpeeds,
      particleOffsets,
      magnetId: lineData.magnetId,
      animationPhase: 'growing',
      animationStartTime: performance.now(),
      totalLength,
      distances,
      threePoints,
      pointCount,
    };

    this.scene.add(line);
    this.scene.add(particles);

    return fieldLineObj;
  }

  private getGradientColor(t: number): { r: number; g: number; b: number } {
    const r = Math.min(1, t * 1.5);
    const g = Math.max(0, Math.min(1, t * 2 - 0.3));
    const b = Math.min(1, (1 - t) * 1.5 + 0.2);
    return { r, g, b };
  }

  private getPointAtDistance(
    points: THREE.Vector3[],
    distances: number[],
    targetDist: number
  ): THREE.Vector3 {
    if (points.length < 2) return points[0] || new THREE.Vector3();

    targetDist = ((targetDist % this.totalLength(distances)) + this.totalLength(distances)) % this.totalLength(distances);

    for (let i = 1; i < distances.length; i++) {
      if (distances[i] >= targetDist) {
        const segmentDist = distances[i] - distances[i - 1];
        const t = segmentDist > 0 ? (targetDist - distances[i - 1]) / segmentDist : 0;
        return new THREE.Vector3().lerpVectors(points[i - 1], points[i], t);
      }
    }

    return points[points.length - 1];
  }

  private totalLength(distances: number[]): number {
    return distances[distances.length - 1] || 1;
  }

  private updateFieldLineAnimation(lineObj: FieldLineObject, now: number): boolean {
    const elapsed = now - lineObj.animationStartTime;

    if (lineObj.animationPhase === 'growing') {
      const progress = Math.min(1, elapsed / GROW_DURATION);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const visibleCount = Math.floor(lineObj.pointCount * easedProgress);

      lineObj.line.geometry.setDrawRange(0, Math.max(2, visibleCount));
      (lineObj.line.material as THREE.LineBasicMaterial).opacity = 0.85 * Math.min(1, progress * 1.5);
      (lineObj.particles.material as THREE.PointsMaterial).opacity = Math.min(1, progress * 2);

      const visibleLength = lineObj.totalLength * easedProgress;
      this.updateParticleVisibility(lineObj, visibleLength, progress);

      if (progress >= 1) {
        lineObj.animationPhase = 'stable';
        lineObj.line.geometry.setDrawRange(0, lineObj.pointCount);
        (lineObj.line.material as THREE.LineBasicMaterial).opacity = 0.85;
        (lineObj.particles.material as THREE.PointsMaterial).opacity = 1;
      }
      return true;
    } else if (lineObj.animationPhase === 'shrinking') {
      const progress = Math.min(1, elapsed / SHRINK_DURATION);
      const easedProgress = progress * progress;
      const visibleCount = Math.floor(lineObj.pointCount * (1 - easedProgress));

      lineObj.line.geometry.setDrawRange(0, Math.max(0, visibleCount));
      (lineObj.line.material as THREE.LineBasicMaterial).opacity = 0.85 * (1 - progress);
      (lineObj.particles.material as THREE.PointsMaterial).opacity = 1 - progress;

      const visibleLength = lineObj.totalLength * (1 - easedProgress);
      this.updateParticleVisibility(lineObj, visibleLength, 1 - progress);

      if (progress >= 1) {
        return false;
      }
      return true;
    }

    return true;
  }

  private updateParticleVisibility(lineObj: FieldLineObject, visibleLength: number, opacityFactor: number) {
    const positions = lineObj.particles.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLES_PER_LINE; i++) {
      if (lineObj.particleOffsets[i] > visibleLength) {
        positions[i * 3 + 1] = -1000;
      } else {
        const pos = this.getPointAtDistance(
          lineObj.threePoints,
          lineObj.distances,
          lineObj.particleOffsets[i]
        );
        positions[i * 3] = pos.x;
        positions[i * 3 + 1] = pos.y;
        positions[i * 3 + 2] = pos.z;
      }
    }

    lineObj.particles.geometry.attributes.position.needsUpdate = true;
  }

  private updateParticles(lineObj: FieldLineObject, deltaTime: number) {
    const positions = lineObj.particles.geometry.attributes.position.array as Float32Array;
    const colors = lineObj.particles.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < PARTICLES_PER_LINE; i++) {
      lineObj.particleOffsets[i] += lineObj.particleSpeeds[i] * deltaTime;
      if (lineObj.particleOffsets[i] > lineObj.totalLength) {
        lineObj.particleOffsets[i] -= lineObj.totalLength;
      }

      const pos = this.getPointAtDistance(
        lineObj.threePoints,
        lineObj.distances,
        lineObj.particleOffsets[i]
      );
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      const t = 1 - lineObj.particleOffsets[i] / lineObj.totalLength;
      const color = this.getGradientColor(t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    lineObj.particles.geometry.attributes.position.needsUpdate = true;
    lineObj.particles.geometry.attributes.color.needsUpdate = true;
  }

  private updateHighlightState() {
    this.fieldLines.forEach((lineObj) => {
      const isHighlighted =
        this.highlightedMagnetId === null ||
        lineObj.magnetId === this.highlightedMagnetId;

      const opacity = isHighlighted ? 0.85 : 0.2;
      (lineObj.line.material as THREE.LineBasicMaterial).opacity = opacity;
      (lineObj.particles.material as THREE.PointsMaterial).opacity =
        isHighlighted ? 1 : 0.15;
    });
  }

  private onWindowResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onCanvasClick = (event: MouseEvent) => {
    if (this.isDragging) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const magnetGroups = Array.from(this.magnets.values()).map((m) => m.group);
    const magnetIntersects = this.raycaster.intersectObjects(magnetGroups, true);

    if (magnetIntersects.length > 0) {
      let obj = magnetIntersects[0].object;
      while (obj.parent && !obj.userData.isMagnet) {
        obj = obj.parent;
      }
      if (obj.userData.magnetId) {
        const magnetId = obj.userData.magnetId;
        if (this.highlightedMagnetId === magnetId) {
          eventBus.emit('magnet:selected', null);
        } else {
          eventBus.emit('magnet:selected', magnetId);
        }
        return;
      }
    }

    const groundIntersects = this.raycaster.intersectObject(this.groundPlane);
    if (groundIntersects.length > 0) {
      const point = groundIntersects[0].point;
      eventBus.emit('ground:clicked', {
        x: point.x,
        y: 0.5,
        z: point.z,
      });
    } else {
      eventBus.emit('magnet:selected', null);
    }
  };

  private onMouseDown = (event: MouseEvent) => {
    if (event.button !== 0) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const magnetGroups = Array.from(this.magnets.values()).map((m) => m.group);
    const intersects = this.raycaster.intersectObjects(magnetGroups, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj.parent && !obj.userData.isMagnet) {
        obj = obj.parent;
      }
      if (obj.userData.magnetId) {
        this.selectedMagnetId = obj.userData.magnetId;
        this.isDragging = true;
        this.controls.enabled = false;

        const point = intersects[0].point;
        const magnetObj = this.magnets.get(obj.userData.magnetId);
        if (magnetObj) {
          this.dragOffset.copy(magnetObj.group.position).sub(point);
        }
      }
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.isDragging || !this.selectedMagnetId) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.groundPlane);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const magnetObj = this.magnets.get(this.selectedMagnetId);
      if (magnetObj && !magnetObj.fadingOut) {
        const newPos = new THREE.Vector3(
          point.x + this.dragOffset.x,
          0.5,
          point.z + this.dragOffset.z
        );

        magnetObj.group.position.copy(newPos);
        magnetObj.data.position = {
          x: newPos.x,
          y: newPos.y,
          z: newPos.z,
        };

        eventBus.emit('magnet:moved', {
          id: this.selectedMagnetId,
          position: magnetObj.data.position,
        });
      }
    }
  };

  private onMouseUp = (event: MouseEvent) => {
    if (this.isDragging && this.selectedMagnetId) {
      const magnetObj = this.magnets.get(this.selectedMagnetId);
      if (magnetObj) {
        eventBus.emit('magnet:updated', magnetObj.data);
      }
      this.requestFieldUpdate();
    }

    this.isDragging = false;
    this.controls.enabled = true;
  };

  private resetView() {
    const startPos = this.camera.position.clone();
    const targetPos = new THREE.Vector3(0, 15 * Math.sin(Math.PI / 6), 15 * Math.cos(Math.PI / 6));
    const startTarget = this.controls.target.clone();
    const targetTarget = new THREE.Vector3(0, 0, 0);

    const startTime = performance.now();
    const duration = 1000;

    const animateReset = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);

      this.camera.position.lerpVectors(startPos, targetPos, eased);
      this.controls.target.lerpVectors(startTarget, targetTarget, eased);
      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animateReset);
      }
    };

    animateReset();
  }

  private clearAllMagnets() {
    this.magnets.forEach((magnetObj) => {
      magnetObj.fadingOut = true;
      magnetObj.fadeStartTime = performance.now();
    });
    this.highlightedMagnetId = null;
    this.selectedMagnetId = null;
    this.requestFieldUpdate();
  }

  private updateFlashEffects(now: number) {
    for (let i = this.flashEffects.length - 1; i >= 0; i--) {
      const effect = this.flashEffects[i];
      const elapsed = now - effect.startTime;
      const duration = 400;

      if (elapsed > duration) {
        this.scene.remove(effect.light);
        this.flashEffects.splice(i, 1);
      } else {
        const t = 1 - elapsed / duration;
        effect.light.intensity = 3 * t;
      }
    }
  }

  private updateMagnetFading(now: number) {
    const toRemove: string[] = [];

    this.magnets.forEach((magnetObj, id) => {
      if (magnetObj.fadingOut && magnetObj.fadeStartTime !== undefined) {
        const elapsed = now - magnetObj.fadeStartTime;
        const progress = Math.min(1, elapsed / FADE_DURATION);
        const opacity = 1 - progress;

        (magnetObj.sphere.material as THREE.MeshPhongMaterial).transparent = true;
        (magnetObj.sphere.material as THREE.MeshPhongMaterial).opacity = opacity;
        (magnetObj.glow.material as THREE.MeshBasicMaterial).opacity =
          (0.2 + magnetObj.data.strength * 0.02) * opacity;
        magnetObj.group.traverse((child) => {
          if (child instanceof THREE.Sprite) {
            (child.material as THREE.SpriteMaterial).opacity = opacity;
          }
        });
        magnetObj.arrow.setLength(
          (0.8 + magnetObj.data.strength * 0.1) * opacity,
          0.3 * opacity,
          0.15 * opacity
        );

        if (progress >= 1) {
          toRemove.push(id);
        }
      }
    });

    toRemove.forEach((id) => {
      const magnetObj = this.magnets.get(id);
      if (magnetObj) {
        this.scene.remove(magnetObj.group);
        this.magnets.delete(id);
      }
    });
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();
    const now = performance.now();

    this.controls.update();

    this.updateFlashEffects(now);
    this.updateMagnetFading(now);

    const linesToRemove: number[] = [];
    this.fieldLines.forEach((lineObj, index) => {
      const alive = this.updateFieldLineAnimation(lineObj, now);
      if (!alive) {
        linesToRemove.push(index);
        return;
      }

      if (lineObj.animationPhase !== 'shrinking') {
        this.updateParticles(lineObj, deltaTime);
      }
    });

    for (let i = linesToRemove.length - 1; i >= 0; i--) {
      const idx = linesToRemove[i];
      const lineObj = this.fieldLines[idx];
      this.scene.remove(lineObj.line);
      this.scene.remove(lineObj.particles);
      lineObj.line.geometry.dispose();
      (lineObj.line.material as THREE.Material).dispose();
      lineObj.particles.geometry.dispose();
      (lineObj.particles.material as THREE.Material).dispose();
      this.fieldLines.splice(idx, 1);
    }

    if (this.pendingFieldLines.length > 0 && this.fieldLines.every(l => l.animationPhase !== 'growing')) {
      const shrinkingLines = this.fieldLines.filter(l => l.animationPhase === 'shrinking');
      const shrinkElapsed = shrinkingLines.length > 0
        ? now - shrinkingLines[0].animationStartTime
        : SHRINK_DURATION;

      if (shrinkElapsed >= SHRINK_DURATION * 0.3) {
        for (const lineData of this.pendingFieldLines) {
          const lineObj = this.createFieldLine(lineData);
          this.fieldLines.push(lineObj);
        }
        this.pendingFieldLines = [];
        this.updateHighlightState();
      }
    }

    this.magnets.forEach((magnetObj) => {
      const pulse = Math.sin(now * 0.003) * 0.05 + 1;
      magnetObj.glow.scale.setScalar(pulse);
    });

    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.domElement.removeEventListener('click', this.onCanvasClick);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);

    if (this.fieldWorker) {
      this.fieldWorker.terminate();
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export default Renderer;

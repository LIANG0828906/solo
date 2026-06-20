import * as THREE from 'three';
import { EffectComposer } from 'postprocessing';
import { RenderPass } from 'postprocessing';
import { BloomEffect } from 'postprocessing';
import { EffectPass } from 'postprocessing';
import { eventBus } from './EventBus';
import { RaySegment } from './RayTracer';

interface RendererOptions {
  container: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;

  private raysGroup: THREE.Group;
  private rayLines: THREE.LineSegments | null = null;
  private rayPoints: THREE.Points | null = null;
  private flowPoints: THREE.Points | null = null;

  private ground: THREE.Mesh | null = null;
  private gridHelper: THREE.GridHelper | null = null;
  private stars: THREE.Points | null = null;

  private lightSphere: THREE.Mesh | null = null;
  private lightGlow: THREE.Mesh | null = null;
  private obstacle: THREE.Mesh | null = null;
  private obstacleEdges: THREE.LineSegments | null = null;

  private ambientLight: THREE.AmbientLight | null = null;
  private pointLight: THREE.PointLight | null = null;

  private rayOpacity: number = 0.7;
  private raySegmentsPerRay: number = 8;
  private currentRays: RaySegment[] = [];

  private clock: THREE.Clock;
  private pulsePhase: number = 0;
  private flowTime: number = 0;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean = false;
  private dragTarget: 'light' | 'obstacle' | null = null;
  private dragPlane: THREE.Plane;
  private dragOffset: THREE.Vector3;

  constructor(options: RendererOptions) {
    this.container = options.container;
    this.scene = options.scene;
    this.camera = options.camera;
    this.renderer = options.renderer;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dragPlane = new THREE.Plane();
    this.dragOffset = new THREE.Vector3();

    this.raysGroup = new THREE.Group();
    this.scene.add(this.raysGroup);

    this.composer = new EffectComposer(this.renderer);

    this.setupPostProcessing();
    this.setupEnvironment();
    this.setupStars();
    this.setupGround();
    this.setupLightMarker();
    this.setupObstacle();
    this.setupEventListeners();
    this.setupInteraction();
  }

  private setupPostProcessing(): void {
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomEffect = new BloomEffect({
      intensity: 1.5,
      luminanceThreshold: 0.2,
      luminanceSmoothing: 0.8,
      mipmapBlur: true,
    });
    const bloomPass = new EffectPass(this.camera, bloomEffect);
    this.composer.addPass(bloomPass);
  }

  private setupEnvironment(): void {
    this.scene.background = new THREE.Color(0x0a0a14);
    this.scene.fog = new THREE.FogExp2(0x0a0a14, 0.015);

    this.ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(this.ambientLight);

    this.pointLight = new THREE.PointLight(0xffaa00, 1, 30);
    this.pointLight.position.set(5, 8, 5);
    this.scene.add(this.pointLight);
  }

  private setupStars(): void {
    const starCount = 1000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 30 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi) + 10;
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const alpha = 0.3 + Math.random() * 0.4;
      colors[i3] = alpha;
      colors[i3 + 1] = alpha;
      colors[i3 + 2] = alpha;

      sizes[i] = 1 + Math.random() * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  private setupGround(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'rgba(60, 80, 100, 0.15)');
    gradient.addColorStop(0.5, 'rgba(40, 50, 70, 0.08)');
    gradient.addColorStop(1, 'rgba(20, 25, 40, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });

    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -1.5;
    this.scene.add(this.ground);

    this.gridHelper = new THREE.GridHelper(20, 10, 0x253040, 0x1a2330);
    this.gridHelper.position.y = -1.5;
    (this.gridHelper.material as THREE.Material).opacity = 0.12;
    (this.gridHelper.material as THREE.Material).transparent = true;
    this.scene.add(this.gridHelper);
  }

  private setupLightMarker(): void {
    const sphereGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9,
    });
    this.lightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.lightSphere.position.set(5, 8, 5);
    this.lightSphere.userData.type = 'light';
    this.scene.add(this.lightSphere);

    const glowGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    });
    this.lightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.lightGlow.position.set(5, 8, 5);
    this.scene.add(this.lightGlow);
  }

  private setupObstacle(): void {
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const boxMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.5,
      thickness: 0.5,
    });
    this.obstacle = new THREE.Mesh(boxGeometry, boxMaterial);
    this.obstacle.position.set(0, 0, 0);
    this.obstacle.userData.type = 'obstacle';
    this.scene.add(this.obstacle);

    const edges = new THREE.EdgesGeometry(boxGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x6699ff,
      transparent: true,
      opacity: 0.8,
    });
    this.obstacleEdges = new THREE.LineSegments(edges, edgeMaterial);
    this.obstacleEdges.position.set(0, 0, 0);
    this.scene.add(this.obstacleEdges);
  }

  private setupEventListeners(): void {
    eventBus.on('raysUpdated', (rays: RaySegment[]) => {
      this.currentRays = rays;
      this.updateRayGeometry();
    });

    eventBus.on('rayOpacityChanged', (opacity: number) => {
      this.rayOpacity = opacity;
      this.updateRayMaterials();
    });

    eventBus.on('lightPositionChanged', (x: number, y: number, z: number) => {
      if (this.lightSphere) this.lightSphere.position.set(x, y, z);
      if (this.lightGlow) this.lightGlow.position.set(x, y, z);
      if (this.pointLight) this.pointLight.position.set(x, y, z);
    });

    eventBus.on('obstaclePositionChanged', (x: number, y: number, z: number) => {
      if (this.obstacle) this.obstacle.position.set(x, y, z);
      if (this.obstacleEdges) this.obstacleEdges.position.set(x, y, z);
    });

    window.addEventListener('resize', () => this.onResize());
  }

  private setupInteraction(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    canvas.addEventListener('mouseup', () => this.onMouseUp());
    canvas.addEventListener('mouseleave', () => this.onMouseUp());
  }

  private onMouseDown(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const targets: THREE.Object3D[] = [];
    if (this.lightSphere) targets.push(this.lightSphere);
    if (this.obstacle) targets.push(this.obstacle);

    const intersects = this.raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      this.isDragging = true;
      this.dragTarget = hitObject.userData.type as 'light' | 'obstacle';

      const hitPoint = intersects[0].point;
      const objectPos = hitObject.position;

      this.dragPlane.setFromNormalAndCoplanarPoint(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, objectPos.y, 0)
      );

      const planeIntersect = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);
      this.dragOffset.copy(objectPos).sub(planeIntersect);

      eventBus.emit('dragStart', this.dragTarget);
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.isDragging || !this.dragTarget) return;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectPoint = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint);

    const newPos = intersectPoint.add(this.dragOffset);
    newPos.y = this.dragTarget === 'light' ? this.lightSphere!.position.y : this.obstacle!.position.y;

    if (this.dragTarget === 'light') {
      eventBus.emit('lightPositionChanged', newPos.x, newPos.y, newPos.z);
    } else if (this.dragTarget === 'obstacle') {
      eventBus.emit('obstaclePositionChanged', newPos.x, newPos.y, newPos.z);
    }
  }

  private onMouseUp(): void {
    if (this.isDragging) {
      this.isDragging = false;
      eventBus.emit('dragEnd', this.dragTarget);
      this.dragTarget = null;
    }
  }

  private updateRayGeometry(): void {
    const rays = this.currentRays;
    if (rays.length === 0) return;

    const segmentsPerRay = this.raySegmentsPerRay;
    const totalSegments = rays.length * segmentsPerRay;
    const positions = new Float32Array(totalSegments * 6);
    const colors = new Float32Array(totalSegments * 6);

    let vertexIndex = 0;

    for (const ray of rays) {
      for (let i = 0; i < segmentsPerRay; i++) {
        const t1 = i / segmentsPerRay;
        const t2 = (i + 1) / segmentsPerRay;

        const p1 = new THREE.Vector3().lerpVectors(ray.start, ray.end, t1);
        const p2 = new THREE.Vector3().lerpVectors(ray.start, ray.end, t2);

        positions[vertexIndex * 3] = p1.x;
        positions[vertexIndex * 3 + 1] = p1.y;
        positions[vertexIndex * 3 + 2] = p1.z;

        const c1 = ray.startColor.clone().lerp(ray.endColor, t1);
        colors[vertexIndex * 3] = c1.r;
        colors[vertexIndex * 3 + 1] = c1.g;
        colors[vertexIndex * 3 + 2] = c1.b;
        vertexIndex++;

        positions[vertexIndex * 3] = p2.x;
        positions[vertexIndex * 3 + 1] = p2.y;
        positions[vertexIndex * 3 + 2] = p2.z;

        const c2 = ray.startColor.clone().lerp(ray.endColor, t2);
        colors[vertexIndex * 3] = c2.r;
        colors[vertexIndex * 3 + 1] = c2.g;
        colors[vertexIndex * 3 + 2] = c2.b;
        vertexIndex++;
      }
    }

    if (!this.rayLines) {
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      lineGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: this.rayOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      this.rayLines = new THREE.LineSegments(lineGeometry, lineMaterial);
      this.raysGroup.add(this.rayLines);
    } else {
      this.rayLines.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      this.rayLines.geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );

      this.rayLines.geometry.setDrawRange(0, totalSegments * 2);
      this.rayLines.geometry.computeBoundingSphere();
    }

    this.updateRayPoints(rays);
    this.updateFlowPointsGeometry(rays);
  }

  private updateRayPoints(rays: RaySegment[]): void {
    const pointsPerSegment = 5;
    const totalPoints = rays.length * this.raySegmentsPerRay * pointsPerSegment;
    const positions = new Float32Array(totalPoints * 3);
    const colors = new Float32Array(totalPoints * 3);
    const sizes = new Float32Array(totalPoints);

    let pointIndex = 0;

    for (const ray of rays) {
      for (let i = 0; i < this.raySegmentsPerRay; i++) {
        for (let j = 0; j < pointsPerSegment; j++) {
          const t = (i + j / pointsPerSegment) / this.raySegmentsPerRay;
          const p = new THREE.Vector3().lerpVectors(ray.start, ray.end, t);
          const c = ray.startColor.clone().lerp(ray.endColor, t);

          const idx = pointIndex * 3;
          positions[idx] = p.x;
          positions[idx + 1] = p.y;
          positions[idx + 2] = p.z;

          colors[idx] = c.r;
          colors[idx + 1] = c.g;
          colors[idx + 2] = c.b;

          const distFactor = 1 - t * 0.5;
          sizes[pointIndex] = (0.05 + ray.intensity * 0.1) * distFactor;

          pointIndex++;
        }
      }
    }

    if (!this.rayPoints) {
      const pointsGeometry = new THREE.BufferGeometry();
      pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const pointsMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: this.rayOpacity * 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      this.rayPoints = new THREE.Points(pointsGeometry, pointsMaterial);
      this.raysGroup.add(this.rayPoints);
    } else {
      this.rayPoints.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      this.rayPoints.geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );

      this.rayPoints.geometry.computeBoundingSphere();
    }
  }

  private updateFlowPointsGeometry(rays: RaySegment[]): void {
    const flowPointCount = rays.length;
    const positions = new Float32Array(flowPointCount * 3);
    const colors = new Float32Array(flowPointCount * 3);

    for (let i = 0; i < flowPointCount; i++) {
      const idx = i * 3;
      positions[idx] = 0;
      positions[idx + 1] = 0;
      positions[idx + 2] = 0;

      colors[idx] = 1.0;
      colors[idx + 1] = 0.9;
      colors[idx + 2] = 0.2;
    }

    if (!this.flowPoints) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      this.flowPoints = new THREE.Points(geometry, material);
      this.raysGroup.add(this.flowPoints);
    } else {
      this.flowPoints.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
      this.flowPoints.geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );
      this.flowPoints.geometry.computeBoundingSphere();
    }
  }

  private updateFlowPoints(deltaTime: number): void {
    if (!this.flowPoints || this.currentRays.length === 0) return;

    this.flowTime += deltaTime * 0.5;

    const posAttr = this.flowPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < this.currentRays.length; i++) {
      const ray = this.currentRays[i];
      const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
      const rayOffset = (i * GOLDEN_RATIO_CONJUGATE) % 1.0;
      const t = ((this.flowTime + rayOffset) % 1.0);

      const smoothT = t * t * (3 - 2 * t);

      const idx = i * 3;
      positions[idx] = ray.start.x + (ray.end.x - ray.start.x) * smoothT;
      positions[idx + 1] = ray.start.y + (ray.end.y - ray.start.y) * smoothT;
      positions[idx + 2] = ray.start.z + (ray.end.z - ray.start.z) * smoothT;
    }

    posAttr.needsUpdate = true;
  }

  private updateRayMaterials(): void {
    if (this.rayLines) {
      (this.rayLines.material as THREE.Material).opacity = this.rayOpacity;
    }
    if (this.rayPoints) {
      (this.rayPoints.material as THREE.PointsMaterial).opacity = this.rayOpacity * 0.5;
    }
  }

  update(deltaTime: number): void {
    this.pulsePhase += deltaTime * Math.PI;
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.05;

    if (this.lightSphere) {
      this.lightSphere.scale.setScalar(pulseScale);
    }
    if (this.lightGlow) {
      this.lightGlow.scale.setScalar(pulseScale * 1.5);
    }

    if (this.pointLight) {
      this.pointLight.intensity = 1 + Math.sin(this.pulsePhase) * 0.2;
    }

    this.updateFlowPoints(deltaTime);

    this.composer.render();
  }

  onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  getIsDragging(): boolean {
    return this.isDragging;
  }
}

export default SceneRenderer;

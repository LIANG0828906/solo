import * as THREE from 'three';

export type ViewMode = 'top' | 'firstPerson';

export interface LightConfig {
  x: number;
  y: number;
  z: number;
  color: string;
  intensity: number;
}

export interface LightPreset {
  name: string;
  color: string;
  intensity: number;
  position: { x: number; y: number; z: number };
  ambientColor: string;
  ambientIntensity: number;
}

export const PRESETS: Record<string, LightPreset> = {
  warmDusk: {
    name: '暖色黄昏',
    color: '#ffb06a',
    intensity: 2.5,
    position: { x: 2, y: 3.5, z: -2 },
    ambientColor: '#3a2a1a',
    ambientIntensity: 0.2
  },
  coolMorning: {
    name: '冷色清晨',
    color: '#8ec5ff',
    intensity: 3.0,
    position: { x: -2, y: 4, z: 2 },
    ambientColor: '#1a2a3a',
    ambientIntensity: 0.3
  }
};

const ROOM_SIZE = { width: 10, height: 5, depth: 8 };

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private pointLight: THREE.PointLight;
  private ambientLight: THREE.AmbientLight;
  private lightMesh: THREE.Mesh;
  private lightGlow: THREE.Mesh;
  private lightTrail: THREE.Points | null = null;
  private trailPositions: THREE.Vector3[] = [];
  private trailMaxLength = 20;

  private viewMode: ViewMode = 'top';
  private targetCameraPosition: THREE.Vector3;
  private targetCameraLookAt: THREE.Vector3;
  private isAnimatingView: boolean = false;
  private animationProgress: number = 0;
  private animationDuration: number = 1.2;

  private firstPersonPos: THREE.Vector3;
  private firstPersonLookAt: THREE.Vector3;
  private topViewPos: THREE.Vector3;
  private topViewLookAt: THREE.Vector3;

  private clock: THREE.Clock;
  private elapsedTime: number = 0;
  private container: HTMLElement;
  private lightConfig: LightConfig;
  private lastLightTarget: LightConfig;
  private isLightSmoothing: boolean = false;
  private smoothSpeed: number = 0.15;

  private fpsFrames: number = 0;
  private fpsTime: number = 0;
  private fpsCallback: ((fps: number) => void) | null = null;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private isDragging: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.lightConfig = {
      x: 0,
      y: 3,
      z: 0,
      color: '#ffb06a',
      intensity: 2.5
    };

    this.lastLightTarget = { ...this.lightConfig };

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1628);
    this.scene.fog = new THREE.Fog(0x0a1628, 15, 30);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);

    this.firstPersonPos = new THREE.Vector3(0, 2.5, 3.5);
    this.firstPersonLookAt = new THREE.Vector3(0, 1.5, -1);
    this.topViewPos = new THREE.Vector3(0, 12, 0.01);
    this.topViewLookAt = new THREE.Vector3(0, 0, 0);

    this.targetCameraPosition = this.topViewPos.clone();
    this.targetCameraLookAt = this.topViewLookAt.clone();

    this.camera.position.copy(this.topViewPos);
    this.camera.lookAt(this.topViewLookAt);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    container.appendChild(this.renderer.domElement);

    this.pointLight = new THREE.PointLight(0xffb06a, 2.5, 30, 1.5);
    this.pointLight.castShadow = true;
    this.pointLight.shadow.mapSize.width = 1024;
    this.pointLight.shadow.mapSize.height = 1024;
    this.pointLight.shadow.camera.near = 0.5;
    this.pointLight.shadow.camera.far = 30;
    this.pointLight.shadow.bias = -0.0005;

    this.ambientLight = new THREE.AmbientLight(0x2a2015, 0.2);
    this.scene.add(this.ambientLight);

    const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0xffb06a });
    this.lightMesh = new THREE.Mesh(lightGeo, lightMat);
    this.scene.add(this.lightMesh);

    const glowGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffb06a,
      transparent: true,
      opacity: 0.3
    });
    this.lightGlow = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.lightGlow);

    this.scene.add(this.pointLight);

    this.createRoom();
    this.createFurniture();
    this.setupEvents();
    this.updateLightPosition();
    this.setViewMode('top');
    this.animate();
  }

  private createRoom(): void {
    const { width, height, depth } = ROOM_SIZE;

    const floorGeo = new THREE.PlaneGeometry(width, depth, 10, 8);
    const positions = floorGeo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      positions.setZ(i, Math.random() * 0.02 - 0.01);
    }
    floorGeo.computeVertexNormals();

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3d4f6a,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    this.scene.add(floor);

    this.addFloorPattern();

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x4a5d7b,
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.BackSide
    });

    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      wallMat
    );
    backWall.position.set(0, height / 2, -depth / 2);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      wallMat
    );
    frontWall.position.set(0, height / 2, depth / 2);
    frontWall.receiveShadow = true;
    this.scene.add(frontWall);

    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(depth, height),
      wallMat
    );
    leftWall.position.set(-width / 2, height / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(depth, height),
      wallMat
    );
    rightWall.position.set(width / 2, height / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    this.scene.add(rightWall);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({
        color: 0x2a3a52,
        roughness: 0.95,
        metalness: 0,
        side: THREE.DoubleSide
      })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    this.scene.add(ceiling);

    const baseboardMat = new THREE.MeshStandardMaterial({
      color: 0x2a3a52,
      roughness: 0.8
    });

    const bbHeight = 0.15;
    const bbDepth = 0.05;

    const bbBack = new THREE.Mesh(
      new THREE.BoxGeometry(width, bbHeight, bbDepth),
      baseboardMat
    );
    bbBack.position.set(0, bbHeight / 2, -depth / 2 + bbDepth / 2);
    bbBack.receiveShadow = true;
    this.scene.add(bbBack);

    const bbFront = new THREE.Mesh(
      new THREE.BoxGeometry(width, bbHeight, bbDepth),
      baseboardMat
    );
    bbFront.position.set(0, bbHeight / 2, depth / 2 - bbDepth / 2);
    bbFront.receiveShadow = true;
    this.scene.add(bbFront);

    const bbLeft = new THREE.Mesh(
      new THREE.BoxGeometry(bbDepth, bbHeight, depth),
      baseboardMat
    );
    bbLeft.position.set(-width / 2 + bbDepth / 2, bbHeight / 2, 0);
    bbLeft.receiveShadow = true;
    this.scene.add(bbLeft);

    const bbRight = new THREE.Mesh(
      new THREE.BoxGeometry(bbDepth, bbHeight, depth),
      baseboardMat
    );
    bbRight.position.set(width / 2 - bbDepth / 2, bbHeight / 2, 0);
    bbRight.receiveShadow = true;
    this.scene.add(bbRight);
  }

  private addFloorPattern(): void {
    const { width, depth } = ROOM_SIZE;
    const tileSize = 1;
    const tileGeo = new THREE.BoxGeometry(tileSize * 0.95, 0.01, tileSize * 0.95);
    const tileMat1 = new THREE.MeshStandardMaterial({
      color: 0x4a5d7b,
      roughness: 0.85
    });
    const tileMat2 = new THREE.MeshStandardMaterial({
      color: 0x3d4f6a,
      roughness: 0.9
    });

    for (let x = -width / 2 + tileSize / 2; x < width / 2; x += tileSize) {
      for (let z = -depth / 2 + tileSize / 2; z < depth / 2; z += tileSize) {
        const isEven = (Math.floor(x / tileSize + 5) + Math.floor(z / tileSize + 5)) % 2 === 0;
        const tile = new THREE.Mesh(tileGeo, isEven ? tileMat1 : tileMat2);
        tile.position.set(x, 0.005, z);
        tile.receiveShadow = true;
        this.scene.add(tile);
      }
    }
  }

  private createFurniture(): void {
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x8b6f4e,
      roughness: 0.7,
      metalness: 0.1
    });

    const tableTop = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.08, 1.2),
      tableMat
    );
    tableTop.position.set(0, 1.0, -1.5);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.scene.add(tableTop);

    const legGeo = new THREE.BoxGeometry(0.1, 1.0, 0.1);
    const legPositions = [
      { x: -1.15, z: -1.05 },
      { x: 1.15, z: -1.05 },
      { x: -1.15, z: -1.95 },
      { x: 1.15, z: -1.95 }
    ];
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(pos.x, 0.5, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.scene.add(leg);
    });

    const bookColors = [0xc14444, 0x4a7c59, 0x3d5a8c, 0xe8b964];
    for (let i = 0; i < 3; i++) {
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.04 + Math.random() * 0.02, 0.28),
        new THREE.MeshStandardMaterial({
          color: bookColors[i % bookColors.length],
          roughness: 0.8
        })
      );
      book.position.set(-0.5 + i * 0.35, 1.06 + i * 0.04, -1.5 + (Math.random() - 0.5) * 0.3);
      book.rotation.y = (Math.random() - 0.5) * 0.3;
      book.castShadow = true;
      book.receiveShadow = true;
      this.scene.add(book);
    }

    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 0.03, 6),
      new THREE.MeshStandardMaterial({ color: 0x2a3a52, roughness: 0.6, metalness: 0.3 })
    );
    lampBase.position.set(1.5, 0.015, 2);
    lampBase.castShadow = true;
    lampBase.receiveShadow = true;
    this.scene.add(lampBase);

    const lampPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x2a3a52, roughness: 0.5, metalness: 0.4 })
    );
    lampPole.position.set(1.5, 0.63, 2);
    lampPole.castShadow = true;
    this.scene.add(lampPole);

    const shadeGeo = new THREE.ConeGeometry(0.25, 0.3, 8, 1, true);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xf5e6d3,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const lampShade = new THREE.Mesh(shadeGeo, shadeMat);
    lampShade.position.set(1.5, 1.25, 2);
    lampShade.castShadow = true;
    this.scene.add(lampShade);

    const box1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.7 })
    );
    box1.position.set(-3, 0.3, -2.5);
    box1.castShadow = true;
    box1.receiveShadow = true;
    this.scene.add(box1);

    const box2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.8, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x5a4535, roughness: 0.75 })
    );
    box2.position.set(-3.5, 0.4, -2.2);
    box2.castShadow = true;
    box2.receiveShadow = true;
    this.scene.add(box2);

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 2.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b7d9a, roughness: 0.8 })
    );
    pillar.position.set(3.5, 1.25, -2.5);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    this.scene.add(pillar);

    const sphere = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0xff8c3c,
        roughness: 0.5,
        metalness: 0.2,
        flatShading: true
      })
    );
    sphere.position.set(2, 0.35, 0);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    this.scene.add(sphere);

    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.2, 0.06, 32, 6),
      new THREE.MeshStandardMaterial({
        color: 0x4ecdc4,
        roughness: 0.3,
        metalness: 0.6
      })
    );
    torus.position.set(-2, 0.8, 1.5);
    torus.rotation.x = Math.PI / 3;
    torus.castShadow = true;
    torus.receiveShadow = true;
    this.scene.add(torus);
  }

  private setupEvents(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.renderer.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.renderer.domElement.addEventListener('touchend', this.onMouseUp.bind(this));
  }

  private onMouseDown(event: MouseEvent): void {
    if (this.viewMode !== 'top') return;
    this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.lightMesh);
    if (intersects.length > 0) {
      this.isDragging = true;
      this.renderer.domElement.style.cursor = 'grabbing';
    }
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    if (this.isDragging) {
      this.updateLightFromMouse();
    } else if (this.viewMode === 'top') {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.lightMesh);
        this.renderer.domElement.style.cursor = intersects.length > 0 ? 'grab' : 'default';
      }
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.renderer.domElement.style.cursor = 'default';
  }

  private onTouchStart(event: TouchEvent): void {
    if (this.viewMode !== 'top') return;
    const touch = event.touches[0];
    this.mouse.x = (touch.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObject(this.lightMesh);
    if (intersects.length > 0) {
      this.isDragging = true;
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    const touch = event.touches[0];
    this.mouse.x = (touch.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(touch.clientY / this.renderer.domElement.clientHeight) * 2 + 1;
    this.updateLightFromMouse();
  }

  private updateLightFromMouse(): void {
    if (this.viewMode !== 'top') return;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.lightConfig.y);
    const point = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(plane, point);

    if (point) {
      const halfW = ROOM_SIZE.width / 2 - 0.5;
      const halfD = ROOM_SIZE.depth / 2 - 0.5;
      const x = Math.max(-halfW, Math.min(halfW, point.x));
      const z = Math.max(-halfD, Math.min(halfD, point.z));

      this.lightConfig.x = x;
      this.lightConfig.z = z;
      this.updateLightPosition();
      this.dispatchLightChange();
    }
  }

  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.setSize(width, height);
  }

  private updateLightPosition(): void {
    const { x, y, z } = this.lightConfig;
    this.pointLight.position.set(x, y, z);
    this.lightMesh.position.set(x, y, z);
    this.lightGlow.position.set(x, y, z);

    this.addTrailPoint(new THREE.Vector3(x, y, z));
  }

  private addTrailPoint(pos: THREE.Vector3): void {
    this.trailPositions.unshift(pos.clone());
    if (this.trailPositions.length > this.trailMaxLength) {
      this.trailPositions.pop();
    }
    this.updateTrail();
  }

  private updateTrail(): void {
    if (this.trailPositions.length === 0) return;

    const positions = new Float32Array(this.trailPositions.length * 3);
    const colors = new Float32Array(this.trailPositions.length * 3);
    const sizes = new Float32Array(this.trailPositions.length);

    const color = new THREE.Color(this.lightConfig.color);

    for (let i = 0; i < this.trailPositions.length; i++) {
      const pos = this.trailPositions[i];
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      const alpha = 1 - i / this.trailPositions.length;
      sizes[i] = 0.2 * alpha;
    }

    if (!this.lightTrail) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const mat = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      });

      this.lightTrail = new THREE.Points(geo, mat);
      this.scene.add(this.lightTrail);
    } else {
      const posAttr = this.lightTrail.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = this.lightTrail.geometry.getAttribute('color') as THREE.BufferAttribute;

      posAttr.array = positions;
      colAttr.array = colors;
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      this.lightTrail.geometry.computeBoundingSphere();
    }
  }

  setLightPosition(x: number, y: number, z: number): void {
    this.lightConfig.x = x;
    this.lightConfig.y = y;
    this.lightConfig.z = z;
    this.updateLightPosition();
  }

  setLightColor(hex: string): void {
    this.lightConfig.color = hex;
    this.pointLight.color.set(hex);
    (this.lightMesh.material as THREE.MeshBasicMaterial).color.set(hex);
    (this.lightGlow.material as THREE.MeshBasicMaterial).color.set(hex);
  }

  setLightIntensity(intensity: number): void {
    this.lightConfig.intensity = intensity;
    this.pointLight.intensity = intensity;
  }

  applyPreset(presetKey: string): void {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    this.setLightColor(preset.color);
    this.setLightIntensity(preset.intensity);
    this.setLightPosition(preset.position.x, preset.position.y, preset.position.z);

    this.ambientLight.color.set(preset.ambientColor);
    this.ambientLight.intensity = preset.ambientIntensity;

    this.dispatchLightChange();
  }

  getLightConfig(): LightConfig {
    return { ...this.lightConfig };
  }

  setViewMode(mode: ViewMode): void {
    if (this.viewMode === mode) return;

    this.viewMode = mode;
    this.isAnimatingView = true;
    this.animationProgress = 0;

    if (mode === 'top') {
      this.targetCameraPosition.copy(this.topViewPos);
      this.targetCameraLookAt.copy(this.topViewLookAt);
    } else {
      this.targetCameraPosition.copy(this.firstPersonPos);
      this.targetCameraLookAt.copy(this.firstPersonLookAt);
    }
  }

  getViewMode(): ViewMode {
    return this.viewMode;
  }

  setFpsCallback(callback: (fps: number) => void): void {
    this.fpsCallback = callback;
  }

  private dispatchLightChange(): void {
    const event = new CustomEvent('lightchange', {
      detail: this.getLightConfig()
    });
    window.dispatchEvent(event);
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();
    this.elapsedTime += delta;

    if (this.isAnimatingView) {
      this.animationProgress += delta / this.animationDuration;
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.isAnimatingView = false;
      }

      const t = this.easeInOutCubic(this.animationProgress);

      const startPos = this.viewMode === 'top' ? this.firstPersonPos : this.topViewPos;
      const startLook = this.viewMode === 'top' ? this.firstPersonLookAt : this.topViewLookAt;

      this.camera.position.lerpVectors(startPos, this.targetCameraPosition, t);

      const currentLook = startLook.clone().lerp(this.targetCameraLookAt, t);

      if (this.camera instanceof THREE.PerspectiveCamera) {
        this.camera.lookAt(currentLook);
      }
    }

    const pulse = 1 + Math.sin(this.elapsedTime * 3) * 0.08;
    this.lightGlow.scale.setScalar(pulse);

    if (this.lightTrail) {
      const mat = this.lightTrail.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, mat.opacity - delta * 1.5);
      if (mat.opacity <= 0 && this.trailPositions.length > 0) {
        this.trailPositions = [];
      }
    }

    this.renderer.render(this.scene, this.camera);

    this.fpsFrames++;
    this.fpsTime += delta;
    if (this.fpsTime >= 0.5) {
      const fps = Math.round(this.fpsFrames / this.fpsTime);
      if (this.fpsCallback) {
        this.fpsCallback(fps);
      }
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  dispose(): void {
    this.renderer.dispose();
    window.removeEventListener('resize', this.onResize.bind(this));
  }
}

export const ROOM_DIMENSIONS = ROOM_SIZE;

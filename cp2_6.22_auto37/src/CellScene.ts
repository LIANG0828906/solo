import * as THREE from 'three';
import { OrganelleManager } from './OrganelleManager';
import { UIOverlay } from './UIOverlay';

const CELL_RADIUS = 45;

class SimplexNoise3D {
  private perm: Uint8Array;

  constructor(seed: number = 1337) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);
    const A = this.perm[X] + Y;
    const AA = this.perm[A] + Z;
    const AB = this.perm[A + 1] + Z;
    const B = this.perm[X + 1] + Y;
    const BA = this.perm[B] + Z;
    const BB = this.perm[B + 1] + Z;

    return this.lerp(
      this.lerp(
        this.lerp(this.grad(this.perm[AA], x, y, z), this.grad(this.perm[BA], x - 1, y, z), u),
        this.lerp(this.grad(this.perm[AB], x, y - 1, z), this.grad(this.perm[BB], x - 1, y - 1, z), u),
        v
      ),
      this.lerp(
        this.lerp(this.grad(this.perm[AA + 1], x, y, z - 1), this.grad(this.perm[BA + 1], x - 1, y, z - 1), u),
        this.lerp(this.grad(this.perm[AB + 1], x, y - 1, z - 1), this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1), u),
        v
      ),
      w
    );
  }
}

interface ParticleData {
  velocity: THREE.Vector3;
  phase: number;
  seed: THREE.Vector3;
}

interface CameraTween {
  active: boolean;
  startPos: THREE.Vector3;
  endPos: THREE.Vector3;
  startTarget: THREE.Vector3;
  endTarget: THREE.Vector3;
  startTime: number;
  duration: number;
  easing: (t: number) => number;
}

export class CellScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private organelleManager: OrganelleManager;
  private uiOverlay: UIOverlay;

  private cellMembrane: THREE.Mesh;
  private innerGlow: THREE.Mesh;
  private particleSystem: THREE.Points;
  private particleData: ParticleData[] = [];
  private noise: SimplexNoise3D = new SimplexNoise3D(42);

  private keys: Record<string, boolean> = {};
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private cameraYaw: number = Math.PI * 0.3;
  private cameraPitch: number = -0.2;
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private moveSpeed: number = 18;

  private startTime: number = performance.now();
  private lastFrameTime: number = this.startTime;

  private cameraTween: CameraTween = {
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    startTime: 0,
    duration: 1500,
    easing: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.organelleManager = new OrganelleManager(this.scene, CELL_RADIUS);
    this.uiOverlay = new UIOverlay();

    this.cellMembrane = this.createCellMembrane();
    this.innerGlow = this.createInnerGlow();
    this.particleSystem = this.createParticles();
    this.createFog();
    this.createLights();

    this.setupEventListeners();
    this.setupCallbacks();

    container.appendChild(this.renderer.domElement);
    this.onResize();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(65, aspect, 0.1, 500);
    const distance = 30;
    camera.position.set(
      Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * distance,
      Math.sin(this.cameraPitch) * distance + 5,
      Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * distance
    );
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
  }

  private createCellMembrane(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(CELL_RADIUS, 96, 96);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x2a68a8,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      roughness: 0.15,
      metalness: 0.05,
      transmission: 0.6,
      thickness: 0.8,
      emissive: new THREE.Color(0x1a4878),
      emissiveIntensity: 0.15
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    const wireGeom = new THREE.SphereGeometry(CELL_RADIUS + 0.1, 48, 48);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x5fa8d8,
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
      wireframe: true
    });
    const wire = new THREE.Mesh(wireGeom, wireMat);
    mesh.add(wire);

    return mesh;
  }

  private createInnerGlow(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(CELL_RADIUS * 0.98, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x3a8fd8) },
        intensity: { value: 0.35 },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          float rim = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
          rim = pow(rim, 2.5);
          float pulse = 0.9 + 0.1 * sin(time * 1.5);
          vec3 color = glowColor * rim * intensity * pulse;
          gl_FragColor = vec4(color, rim * 0.4);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    return mesh;
  }

  private createParticles(): THREE.Points {
    const count = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const colorPalette = [
      new THREE.Color(0x5fb8d8),
      new THREE.Color(0x88ccff),
      new THREE.Color(0xa0e0c8),
      new THREE.Color(0xccb0ff),
      new THREE.Color(0x7de3ff)
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = CELL_RADIUS * (0.08 + Math.random() * 0.88);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.08 + Math.random() * 0.18;

      this.particleData.push({
        velocity: new THREE.Vector3(0, 0, 0),
        phase: Math.random() * Math.PI * 2,
        seed: new THREE.Vector3(
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100
        )
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('customSize', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float customSize;
        attribute vec3 customColor;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float pulse = 0.8 + 0.2 * sin(time * 2.0 + position.x * 0.5 + position.y * 0.3);
          gl_PointSize = customSize * 300.0 / -mvPosition.z * pulse;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * 0.7;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    return points;
  }

  private createFog(): void {
    this.scene.fog = new THREE.FogExp2(0x0a0e1a, 0.012);
  }

  private createLights(): void {
    const ambient = new THREE.AmbientLight(0x406080, 0.55);
    this.scene.add(ambient);

    const topLight = new THREE.DirectionalLight(0xb0d8ff, 1.0);
    topLight.position.set(0, CELL_RADIUS * 0.9, 0);
    topLight.castShadow = true;
    topLight.shadow.mapSize.width = 2048;
    topLight.shadow.mapSize.height = 2048;
    topLight.shadow.camera.near = 1;
    topLight.shadow.camera.far = CELL_RADIUS * 2.5;
    topLight.shadow.camera.left = -CELL_RADIUS;
    topLight.shadow.camera.right = CELL_RADIUS;
    topLight.shadow.camera.top = CELL_RADIUS;
    topLight.shadow.camera.bottom = -CELL_RADIUS;
    topLight.shadow.bias = -0.0005;
    this.scene.add(topLight);

    const fillLight = new THREE.DirectionalLight(0x80b0ff, 0.25);
    fillLight.position.set(CELL_RADIUS * 0.7, CELL_RADIUS * 0.3, CELL_RADIUS * 0.5);
    this.scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xcc99ff, 0.2);
    backLight.position.set(-CELL_RADIUS * 0.6, -CELL_RADIUS * 0.2, -CELL_RADIUS * 0.7);
    this.scene.add(backLight);

    const nucleusLight = new THREE.PointLight(0x9966ff, 0.6, 35, 2);
    nucleusLight.position.set(0, 1, 0);
    this.scene.add(nucleusLight);

    const spot1 = new THREE.PointLight(0xff7755, 0.3, 20, 2);
    spot1.position.set(15, -8, 12);
    this.scene.add(spot1);

    const spot2 = new THREE.PointLight(0x55ddaa, 0.25, 18, 2);
    spot2.position.set(-18, 5, -10);
    this.scene.add(spot2);
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keys[e.key.toLowerCase()] = false;
    });

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      if (e.button === 0 || e.button === 2) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        if (this.cameraTween.active) {
          this.cancelCameraTween();
        }
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const normalizedX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normalizedY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.organelleManager.updateMouse(normalizedX, normalizedY);

      if (this.isDragging && !this.cameraTween.active) {
        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;
        this.cameraYaw -= deltaX * 0.0035;
        this.cameraPitch = Math.max(
          -Math.PI / 2 + 0.05,
          Math.min(Math.PI / 2 - 0.05, this.cameraPitch - deltaY * 0.0035)
        );
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }

      this.organelleManager.checkHover(this.camera, e.clientX, e.clientY);
    });

    let panelClosedThisFrame = false;
    const origOutsideCb = () => {
      this.uiOverlay.hideInfoPanel();
      this.organelleManager.clearSelected();
      panelClosedThisFrame = true;
    };
    this.uiOverlay.setOnPanelOutsideClickCallback(origOutsideCb);

    this.renderer.domElement.addEventListener('mousedown', (e) => {
      panelClosedThisFrame = false;
      (e as Event).stopPropagation();
    });

    this.renderer.domElement.addEventListener('click', (e) => {
      (e as Event).stopPropagation();
      if (panelClosedThisFrame) return;
      const clickedType = this.organelleManager.handleClick(this.camera);
      if (clickedType) {
        this.uiOverlay.showInfoPanel(clickedType);
      }
    });

    this.renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('resize', () => this.onResize());

    document.addEventListener('presetView', (e) => {
      const detail = (e as CustomEvent).detail;
      this.goToPresetView(detail.preset);
    });

    document.addEventListener('panelClosed', () => {
      this.organelleManager.clearSelected();
    });
  }

  private setupCallbacks(): void {
    this.organelleManager.setOnHoverCallback((x, y, name) => {
      this.uiOverlay.showHoverLabel(x, y, name);
    });
    this.organelleManager.setOnHoverLeaveCallback(() => {
      this.uiOverlay.hideHoverLabel();
    });
    this.organelleManager.setOnCurrentViewChangeCallback((name, nameEn) => {
      this.uiOverlay.setCurrentOrganelle(name, nameEn);
    });
  }

  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private updateCamera(delta: number): void {
    if (this.cameraTween.active) {
      this.updateCameraTween();
      return;
    }

    const forward = new THREE.Vector3(
      -Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch),
      Math.sin(this.cameraPitch),
      -Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch)
    );
    const right = new THREE.Vector3(
      Math.cos(this.cameraYaw),
      0,
      -Math.sin(this.cameraYaw)
    );
    const up = new THREE.Vector3(0, 1, 0);

    const move = new THREE.Vector3();
    if (this.keys['w'] || this.keys['KeyW']) move.add(forward);
    if (this.keys['s'] || this.keys['KeyS']) move.sub(forward);
    if (this.keys['d'] || this.keys['KeyD']) move.add(right);
    if (this.keys['a'] || this.keys['KeyA']) move.sub(right);
    if (this.keys[' '] || this.keys['Space']) move.add(up);
    if (this.keys['shift'] || this.keys['ShiftLeft'] || this.keys['ShiftRight']) move.sub(up);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(this.moveSpeed * delta);
      const newPos = this.camera.position.clone().add(move);
      if (!this.organelleManager.checkCollision(newPos, 0.8)) {
        this.camera.position.copy(newPos);
      } else {
        const components = [
          new THREE.Vector3(move.x, 0, 0),
          new THREE.Vector3(0, move.y, 0),
          new THREE.Vector3(0, 0, move.z)
        ];
        for (const comp of components) {
          const testPos = this.camera.position.clone().add(comp);
          if (!this.organelleManager.checkCollision(testPos, 0.8)) {
            this.camera.position.copy(testPos);
          }
        }
      }
    }

    const lookDir = forward.clone();
    this.cameraTarget.copy(this.camera.position.clone().add(lookDir));
    this.camera.lookAt(this.cameraTarget);
  }

  private goToPresetView(preset: string): void {
    const startPos = this.camera.position.clone();
    const startTarget = this.cameraTarget.clone();

    let endPos: THREE.Vector3;
    let endTarget: THREE.Vector3;

    switch (preset) {
      case 'overlook':
        endPos = new THREE.Vector3(0, CELL_RADIUS * 0.82, CELL_RADIUS * 0.45);
        endTarget = new THREE.Vector3(0, 0, 0);
        break;
      case 'nucleus': {
        const nucleus = this.organelleManager.getOrganellePosition('nucleus');
        if (nucleus) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 14;
          endPos = new THREE.Vector3(
            nucleus.x + Math.cos(angle) * dist,
            nucleus.y + 4,
            nucleus.z + Math.sin(angle) * dist
          );
          endTarget = nucleus.clone();
        } else {
          endPos = new THREE.Vector3(14, 4, 0);
          endTarget = new THREE.Vector3(0, 0, 0);
        }
        break;
      }
      case 'mitochondria': {
        const mito = this.organelleManager.getFirstOfType('mitochondrion');
        if (mito) {
          const dir = mito.group.position.clone().normalize();
          const offset = dir.multiplyScalar(5);
          endPos = mito.group.position.clone().add(offset).add(new THREE.Vector3(0, 1.5, 0));
          endTarget = mito.group.position.clone();
        } else {
          endPos = new THREE.Vector3(20, 0, 10);
          endTarget = new THREE.Vector3(0, 0, 0);
        }
        break;
      }
      default:
        return;
    }

    if (this.organelleManager.checkCollision(endPos, 1.5)) {
      const toCenter = new THREE.Vector3(0, 0, 0).sub(endPos).normalize();
      for (let i = 0; i < 10; i++) {
        endPos.add(toCenter.multiplyScalar(2));
        if (!this.organelleManager.checkCollision(endPos, 1.0)) break;
      }
    }

    this.startCameraTween(startPos, endPos, startTarget, endTarget, 1800);
  }

  private startCameraTween(
    startPos: THREE.Vector3,
    endPos: THREE.Vector3,
    startTarget: THREE.Vector3,
    endTarget: THREE.Vector3,
    duration: number
  ): void {
    this.cameraTween.startPos.copy(startPos);
    this.cameraTween.endPos.copy(endPos);
    this.cameraTween.startTarget.copy(startTarget);
    this.cameraTween.endTarget.copy(endTarget);
    this.cameraTween.startTime = performance.now();
    this.cameraTween.duration = duration;
    this.cameraTween.active = true;
    this.uiOverlay.setCameraTweenState(true);
  }

  private cancelCameraTween(): void {
    this.cameraTween.active = false;
    this.uiOverlay.setCameraTweenState(false);
  }

  private updateCameraTween(): void {
    const now = performance.now();
    const elapsed = now - this.cameraTween.startTime;
    let t = Math.min(1, elapsed / this.cameraTween.duration);
    const easeT = this.cameraTween.easing(t);

    this.camera.position.lerpVectors(
      this.cameraTween.startPos,
      this.cameraTween.endPos,
      easeT
    );
    this.cameraTarget.lerpVectors(
      this.cameraTween.startTarget,
      this.cameraTween.endTarget,
      easeT
    );
    this.camera.lookAt(this.cameraTarget);

    const toTarget = this.cameraTarget.clone().sub(this.camera.position);
    this.cameraPitch = Math.asin(toTarget.y / toTarget.length());
    this.cameraYaw = Math.atan2(-toTarget.x, -toTarget.z);

    if (t >= 1) {
      this.cancelCameraTween();
    }
  }

  private sampleFlowField(x: number, y: number, z: number, elapsed: number, seed: THREE.Vector3): THREE.Vector3 {
    const scale = 0.035;
    const tScale = 0.08;

    const nx = this.noise.noise(x * scale + seed.x, y * scale + seed.y, z * scale + elapsed * tScale);
    const ny = this.noise.noise(x * scale + 100 + seed.x, y * scale + 100 + seed.y, z * scale + elapsed * tScale + 50);
    const nz = this.noise.noise(x * scale + 200 + seed.x, y * scale + 200 + seed.y, z * scale + elapsed * tScale + 100);

    const angleX = nx * Math.PI * 2;
    const angleY = ny * Math.PI * 2;
    const angleZ = nz * Math.PI * 2;

    return new THREE.Vector3(
      Math.sin(angleX) * Math.cos(angleY),
      Math.sin(angleY),
      Math.cos(angleX) * Math.sin(angleZ)
    );
  }

  private updateParticles(delta: number, elapsed: number): void {
    const positions = this.particleSystem.geometry.attributes.position as THREE.BufferAttribute;
    const posArray = positions.array as Float32Array;

    const flowStrength = 4.5;
    const velocityDamping = 0.92;
    const flowBlend = 0.35;

    for (let i = 0; i < this.particleData.length; i++) {
      const data = this.particleData[i];
      const idx = i * 3;

      let x = posArray[idx];
      let y = posArray[idx + 1];
      let z = posArray[idx + 2];

      const flowDir = this.sampleFlowField(x, y, z, elapsed, data.seed);

      const flowVelocity = flowDir.multiplyScalar(flowStrength);
      data.velocity.lerp(flowVelocity, flowBlend);
      data.velocity.multiplyScalar(velocityDamping);

      const microWobble = new THREE.Vector3(
        Math.sin(elapsed * 1.8 + data.phase) * 0.08,
        Math.cos(elapsed * 1.5 + data.phase * 1.7) * 0.08,
        Math.sin(elapsed * 2.1 + data.phase * 0.9) * 0.08
      );

      x += data.velocity.x * delta + microWobble.x * delta;
      y += data.velocity.y * delta + microWobble.y * delta;
      z += data.velocity.z * delta + microWobble.z * delta;

      const dist = Math.sqrt(x * x + y * y + z * z);
      if (dist > CELL_RADIUS - 1.2) {
        const norm = 1 / dist;
        const nx = x * norm;
        const ny = y * norm;
        const nz = z * norm;
        const normal = new THREE.Vector3(nx, ny, nz);
        const vDotN = data.velocity.dot(normal);
        if (vDotN > 0) {
          data.velocity.sub(normal.clone().multiplyScalar(2 * vDotN));
          data.velocity.multiplyScalar(0.85);
        }
        const tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0));
        if (tangent.lengthSq() < 0.001) {
          tangent.set(1, 0, 0);
        }
        tangent.normalize();
        data.velocity.add(tangent.multiplyScalar(0.5));

        const clampR = CELL_RADIUS - 1.4;
        x = nx * clampR;
        y = ny * clampR;
        z = nz * clampR;
      }

      posArray[idx] = x;
      posArray[idx + 1] = y;
      posArray[idx + 2] = z;
    }
    positions.needsUpdate = true;

    (this.particleSystem.material as THREE.ShaderMaterial).uniforms.time.value = elapsed;
  }

  private updateMembraneEffects(elapsed: number): void {
    const innerGlowMat = this.innerGlow.material as THREE.ShaderMaterial;
    innerGlowMat.uniforms.time.value = elapsed;

    this.cellMembrane.rotation.y = elapsed * 0.01;
    this.cellMembrane.rotation.x = Math.sin(elapsed * 0.007) * 0.05;
  }

  public update(): void {
    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    const elapsed = (now - this.startTime) / 1000;
    this.lastFrameTime = now;

    this.updateCamera(delta);
    this.organelleManager.update(delta, elapsed);
    this.updateParticles(delta, elapsed);
    this.updateMembraneEffects(elapsed);

    this.renderer.render(this.scene, this.camera);
  }

  public animate(): void {
    requestAnimationFrame(() => this.animate());
    this.update();
  }

  public start(): void {
    this.animate();
  }

  public dispose(): void {
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

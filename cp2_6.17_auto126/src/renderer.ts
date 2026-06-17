import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { MagneticPole, FieldLineParams, FieldLineData, BarMagnetConfig, SceneConfig, Vec3, PoleType } from './types';

interface Callbacks {
  onPoleDropped: (type: PoleType, position: Vec3) => void;
}

export class Renderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private poleMeshes: Map<string, THREE.Group> = new Map();
  private fieldLineObjects: THREE.Group | null = null;
  private barMagnetGroup: THREE.Group | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private groundPlane: THREE.Plane;
  private draggingPole: { type: PoleType; mesh: THREE.Mesh } | null = null;
  private callbacks: Callbacks;
  private barMagnetConfig: BarMagnetConfig;
  private sceneConfig: SceneConfig;
  private animationTime: number = 0;
  private fieldLineData: FieldLineData[] = [];
  private fieldLineParams: FieldLineParams | null = null;
  private particleSystems: THREE.Points[] = [];

  constructor(
    container: HTMLElement,
    barMagnetConfig: BarMagnetConfig,
    sceneConfig: SceneConfig,
    callbacks: Callbacks
  ) {
    this.container = container;
    this.barMagnetConfig = barMagnetConfig;
    this.sceneConfig = sceneConfig;
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();
    this.setupBackground();
    this.setupStars();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.set(3, 2.5, 4);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = sceneConfig.dampingFactor;
    this.controls.minDistance = sceneConfig.minDistance;
    this.controls.maxDistance = sceneConfig.maxDistance;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    this.controls.target.set(0, 0, 0);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    this.setupLighting();
    this.setupEventListeners();
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, this.sceneConfig.backgroundColor[1]);
    gradient.addColorStop(1, this.sceneConfig.backgroundColor[0]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 512);

    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
  }

  private setupStars(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = this.sceneConfig.starCount;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const alphas = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const edge = Math.floor(Math.random() * 3);
      const dist = 15 + Math.random() * 5;
      if (edge === 0) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() > 0.5 ? 1 : -1) * dist;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      } else if (edge === 1) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() > 0.5 ? 1 : -1) * dist;
      } else {
        positions[i * 3] = (Math.random() > 0.5 ? 1 : -1) * dist;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      }
      sizes[i] = 1 + Math.random();
      alphas[i] = 0.3 + Math.random() * 0.3;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) }
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = (1.0 - dist * 2.0) * vAlpha;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 8, 5);
    this.scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
    fillLight.position.set(-5, 3, -5);
    this.scene.add(fillLight);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));

    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private onMouseMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (this.draggingPole) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersect = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
      if (intersect) {
        intersect.y = 0;
        this.draggingPole.mesh.position.copy(intersect);
      }
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    if (this.draggingPole) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersect = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
      if (intersect) {
        this.callbacks.onPoleDropped(this.draggingPole.type, {
          x: intersect.x,
          y: 0,
          z: intersect.z
        });
      }
      this.scene.remove(this.draggingPole.mesh);
      this.draggingPole.mesh.geometry.dispose();
      (this.draggingPole.mesh.material as THREE.Material).dispose();
      this.draggingPole = null;
      this.controls.enabled = true;
    }
  }

  startDragPole(type: PoleType, clientX: number, clientY: number): void {
    this.controls.enabled = false;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const color = type === 'N' ? 0xff4444 : 0x4444ff;
    const material = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      emissive: color,
      emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersect = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, intersect);
    if (intersect) {
      mesh.position.copy(intersect);
      mesh.position.y = 0;
    }

    this.scene.add(mesh);
    this.draggingPole = { type, mesh };
  }

  createBarMagnet(): void {
    if (this.barMagnetGroup) {
      this.scene.remove(this.barMagnetGroup);
    }

    this.barMagnetGroup = new THREE.Group();

    const halfLen = this.barMagnetConfig.length / 2;

    const northGeom = new THREE.BoxGeometry(this.barMagnetConfig.length / 2, this.barMagnetConfig.width, this.barMagnetConfig.height);
    const northMat = new THREE.MeshStandardMaterial({
      color: this.barMagnetConfig.colorN,
      emissive: this.barMagnetConfig.colorN,
      emissiveIntensity: this.barMagnetConfig.emissionIntensity,
      metalness: 0.3,
      roughness: 0.5
    });
    const northMesh = new THREE.Mesh(northGeom, northMat);
    northMesh.position.x = halfLen / 2;

    const southGeom = new THREE.BoxGeometry(this.barMagnetConfig.length / 2, this.barMagnetConfig.width, this.barMagnetConfig.height);
    const southMat = new THREE.MeshStandardMaterial({
      color: this.barMagnetConfig.colorS,
      emissive: this.barMagnetConfig.colorS,
      emissiveIntensity: this.barMagnetConfig.emissionIntensity,
      metalness: 0.3,
      roughness: 0.5
    });
    const southMesh = new THREE.Mesh(southGeom, southMat);
    southMesh.position.x = -halfLen / 2;

    const borderGeom = new THREE.EdgesGeometry(new THREE.BoxGeometry(this.barMagnetConfig.length, this.barMagnetConfig.width, this.barMagnetConfig.height));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x333333 });
    const border = new THREE.LineSegments(borderGeom, borderMat);

    this.barMagnetGroup.add(northMesh, southMesh, border);
    this.scene.add(this.barMagnetGroup);
  }

  createPoleMesh(pole: MagneticPole): void {
    if (this.poleMeshes.has(pole.id)) return;

    const group = new THREE.Group();

    const sphereGeom = new THREE.SphereGeometry(pole.radius, 32, 32);
    const color = pole.type === 'N' ? 0xff4444 : 0x4444ff;
    const sphereMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      metalness: 0.4,
      roughness: 0.4
    });
    const sphere = new THREE.Mesh(sphereGeom, sphereMat);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 128;
    labelCanvas.height = 128;
    const labelCtx = labelCanvas.getContext('2d')!;
    labelCtx.fillStyle = 'rgba(0,0,0,0)';
    labelCtx.fillRect(0, 0, 128, 128);
    labelCtx.font = 'bold 80px Arial';
    labelCtx.textAlign = 'center';
    labelCtx.textBaseline = 'middle';
    labelCtx.fillStyle = '#ffffff';
    labelCtx.fillText(pole.type, 64, 68);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true });
    const label = new THREE.Sprite(labelMat);
    label.position.y = pole.radius + 0.3;
    label.scale.set(0.6, 0.6, 0.6);

    const glowGeom = new THREE.SphereGeometry(pole.radius * 1.4, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);

    group.add(sphere, label, glow);
    group.position.set(pole.position.x, pole.position.y, pole.position.z);

    this.poleMeshes.set(pole.id, group);
    this.scene.add(group);
  }

  removePoleMesh(poleId: string): void {
    const mesh = this.poleMeshes.get(poleId);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
      this.poleMeshes.delete(poleId);
    }
  }

  clearAllCustomPoleMeshes(): void {
    for (const [id] of this.poleMeshes) {
      if (id !== 'bar-north' && id !== 'bar-south') {
        this.removePoleMesh(id);
      }
    }
  }

  updateFieldLines(data: FieldLineData[], params: FieldLineParams): void {
    this.fieldLineData = data;
    this.fieldLineParams = params;
    this.rebuildFieldLines();
  }

  private rebuildFieldLines(): void {
    if (this.fieldLineObjects) {
      this.scene.remove(this.fieldLineObjects);
      this.fieldLineObjects.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }
    this.particleSystems = [];

    this.fieldLineObjects = new THREE.Group();

    if (!this.fieldLineParams) return;

    for (let i = 0; i < this.fieldLineData.length; i++) {
      const lineData = this.fieldLineData[i];
      if (lineData.points.length < 2) continue;

      const curvePoints = lineData.points.map(
        p => new THREE.Vector3(p.x, p.y, p.z)
      );
      const curve = new THREE.CatmullRomCurve3(curvePoints);

      const particleCount = Math.floor(lineData.points.length * 1.5);
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      const offsets = new Float32Array(particleCount);
      const speedFactors = new Float32Array(particleCount);

      for (let j = 0; j < particleCount; j++) {
        const t = j / Math.max(1, particleCount - 1);
        const point = curve.getPoint(t);
        positions[j * 3] = point.x;
        positions[j * 3 + 1] = point.y;
        positions[j * 3 + 2] = point.z;

        const colorIdx = Math.min(Math.floor(t * lineData.colors.length), lineData.colors.length - 1);
        const hexColor = lineData.colors[colorIdx] || '#ffffff';
        const color = new THREE.Color(hexColor);
        colors[j * 3] = color.r;
        colors[j * 3 + 1] = color.g;
        colors[j * 3 + 2] = color.b;

        offsets[j] = Math.random();
        const speedIdx = Math.min(Math.floor(t * lineData.speedFactors.length), lineData.speedFactors.length - 1);
        speedFactors[j] = lineData.speedFactors[speedIdx] || 1.0;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
      geometry.setAttribute('speedFactor', new THREE.BufferAttribute(speedFactors, 1));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          glowIntensity: { value: this.fieldLineParams.glowIntensity },
          lineWidth: { value: this.fieldLineParams.lineWidth },
          flowSpeed: { value: this.fieldLineParams.flowSpeed }
        },
        vertexShader: `
          attribute vec3 color;
          attribute float offset;
          attribute float speedFactor;
          uniform float time;
          uniform float flowSpeed;
          uniform float lineWidth;
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vColor = color;
            float animOffset = mod(time * flowSpeed * speedFactor + offset, 1.0);
            vAlpha = smoothstep(0.0, 0.1, animOffset) * (1.0 - smoothstep(0.9, 1.0, animOffset));
            vAlpha *= 0.8;

            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = lineWidth * 120.0 * (1.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float glowIntensity;
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec2 center = gl_PointCoord - vec2(0.5);
            float dist = length(center);
            if (dist > 0.5) discard;

            float glow = 1.0 - dist * 2.0;
            glow = pow(glow, 1.5);

            vec3 finalColor = vColor * (1.0 + glowIntensity * glow);
            gl_FragColor = vec4(finalColor, vAlpha * (glow * 0.8 + 0.2));
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(geometry, material);
      this.fieldLineObjects.add(particles);
      this.particleSystems.push(particles);
    }

    this.scene.add(this.fieldLineObjects);
  }

  resetCamera(): void {
    this.camera.position.set(3, 2.5, 4);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  animate(deltaTime: number): void {
    this.animationTime += deltaTime;
    this.controls.update();

    for (const particles of this.particleSystems) {
      const mat = particles.material as THREE.ShaderMaterial;
      if (mat.uniforms && mat.uniforms.time) {
        mat.uniforms.time.value = this.animationTime;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }

  getDomElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}

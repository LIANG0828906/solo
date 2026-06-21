import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SceneConfig, FrameCallback } from '../types';

export class SceneManager {
  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera;
  public readonly renderer: THREE.WebGLRenderer;
  public readonly controls: OrbitControls;
  public config: SceneConfig;
  public rotationAngleY: number = 0;
  public starGroup: THREE.Group;

  private canvas: HTMLCanvasElement;
  private frameCallbacks: FrameCallback[] = [];
  private clock: THREE.Clock;
  private rafId: number | null = null;
  private hasClosedLoop: boolean = false;

  constructor(canvas: HTMLCanvasElement, config: SceneConfig) {
    this.canvas = canvas;
    this.config = config;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.setupBackground();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 20);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 50;
    this.controls.enablePan = true;

    this.starGroup = new THREE.Group();
    this.scene.add(this.starGroup);

    this.setupLights();
    this.setupStarfield();

    window.addEventListener('resize', this.handleResize);
  }

  private setupBackground(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#0A0B1E');
    gradient.addColorStop(1, '#1A1B3A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    this.scene.background = texture;
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const pointLight1 = new THREE.PointLight(0x8B5CF6, 1.5, 50);
    pointLight1.position.set(10, 10, 10);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xEC4899, 1.2, 50);
    pointLight2.position.set(-10, -5, -10);
    this.scene.add(pointLight2);
  }

  private setupStarfield(): void {
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = 40 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = Math.random() * 0.08 + 0.02;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float size;
        varying float vSize;
        varying float vTwinkle;
        uniform float uTime;
        void main() {
          vSize = size;
          vTwinkle = 0.5 + 0.5 * sin(uTime * 2.0 + position.x * 10.0 + position.y * 10.0);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vSize;
        varying float vTwinkle;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = (1.0 - d * 2.0) * (0.4 + 0.6 * vTwinkle);
          vec3 color = mix(vec3(0.7, 0.8, 1.0), vec3(1.0), vTwinkle);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.name = 'bgStarfield';
    points.userData.material = material;
    this.scene.add(points);
  }

  public addObject(obj: THREE.Object3D): void {
    this.starGroup.add(obj);
  }

  public removeObject(obj: THREE.Object3D): void {
    this.starGroup.remove(obj);
  }

  public clearStarGroup(): void {
    while (this.starGroup.children.length > 0) {
      const child = this.starGroup.children[0];
      this.starGroup.remove(child);
    }
  }

  public onFrame(callback: FrameCallback): void {
    this.frameCallbacks.push(callback);
  }

  public setHasClosedLoop(value: boolean): void {
    this.hasClosedLoop = value;
  }

  private handleResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public onResize(): void {
    this.handleResize();
  }

  private loop = (): void => {
    this.rafId = requestAnimationFrame(this.loop);
    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    const bgStarfield = this.scene.getObjectByName('bgStarfield') as THREE.Points;
    if (bgStarfield?.userData?.material) {
      bgStarfield.userData.material.uniforms.uTime.value = elapsed;
    }

    const effectiveRotationSpeed = this.hasClosedLoop ? this.config.rotationSpeed : 0;
    this.rotationAngleY += effectiveRotationSpeed;
    this.starGroup.rotation.y = this.rotationAngleY;

    this.controls.update();

    for (const cb of this.frameCallbacks) {
      cb(elapsed, delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    if (this.rafId === null) {
      this.loop();
    }
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    this.controls.dispose();
  }
}

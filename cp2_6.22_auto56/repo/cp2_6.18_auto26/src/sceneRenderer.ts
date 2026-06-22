import * as THREE from 'three';
import { gsap } from 'gsap';
import { ParticleSystem } from './particleSystem';
import { eventBus } from './eventBus';

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particleSystem: ParticleSystem;

  private isDragging = false;
  private previousMouse = { x: 0, y: 0 };
  private cameraAngle = { theta: Math.PI * 0.3, phi: Math.PI * 0.4 };
  private cameraDistance = 15;
  private targetCameraDistance = 15;
  private readonly minDistance = 5;
  private readonly maxDistance = 30;
  private readonly rotationSpeed = 0.005;

  private raycaster: THREE.Raycaster;
  private mouseNDC: THREE.Vector2;
  private hoverWorldPos: THREE.Vector3;

  private stars: THREE.Points;
  private gridHelper: THREE.GridHelper;

  private fpsPanel: HTMLElement;
  private frameCount = 0;
  private fpsTime = 0;
  private currentFps = 60;
  private readonly fpsWarningThreshold = 55;

  private clock: THREE.Clock;

  private resizeObserver?: ResizeObserver;

  constructor(containerId: string, particleSystem: ParticleSystem) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;
    this.particleSystem = particleSystem;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });

    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();
    this.hoverWorldPos = new THREE.Vector3();

    this.fpsPanel = document.getElementById('fps-panel')!;

    this.clock = new THREE.Clock();

    this.stars = this.createStars();
    this.gridHelper = this.createGrid();

    this.setupScene();
    this.setupRenderer();
    this.setupCamera();
    this.setupEventListeners();
    this.setupResizeObserver();
  }

  private setupScene(): void {
    this.scene.background = null;
    this.scene.add(this.particleSystem.points);
    this.scene.add(this.stars);
    this.scene.add(this.gridHelper);
  }

  private setupRenderer(): void {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.sortObjects = false;
    this.container.appendChild(this.renderer.domElement);
  }

  private setupCamera(): void {
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const x = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.cos(this.cameraAngle.theta);
    const y = this.cameraDistance * Math.cos(this.cameraAngle.phi);
    const z = this.cameraDistance * Math.sin(this.cameraAngle.phi) * Math.sin(this.cameraAngle.theta);
    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  private createStars(): THREE.Points {
    const starVertexShader = /* glsl */ `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const starFragmentShader = /* glsl */ `
      varying vec3 vColor;
      void main() {
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        if (dist > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, dist);
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 50 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const alpha = 0.3 + Math.random() * 0.4;
      colors[i * 3] = 1 * alpha;
      colors[i * 3 + 1] = 1 * alpha;
      colors[i * 3 + 2] = 1 * alpha;

      sizes[i] = 2 + Math.random() * 3;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return new THREE.Points(geometry, material);
  }

  private createGrid(): THREE.GridHelper {
    const grid = new THREE.GridHelper(60, 30, 0x4a5a6a, 0x4a5a6a);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.1;
    grid.position.y = -1.5;
    return grid;
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDragging = true;
        this.previousMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMouse.x;
        const deltaY = e.clientY - this.previousMouse.y;

        this.cameraAngle.theta -= deltaX * this.rotationSpeed;
        this.cameraAngle.phi = Math.max(
          0.1,
          Math.min(Math.PI - 0.1, this.cameraAngle.phi - deltaY * this.rotationSpeed)
        );

        this.previousMouse = { x: e.clientX, y: e.clientY };
      }

      this.handleMouseMove(e);
    });

    canvas.addEventListener('mouseleave', () => {
      eventBus.emit('hover:clear');
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const scrollAmount = e.deltaY * 0.01;
      this.targetCameraDistance = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, this.targetCameraDistance + scrollAmount)
      );

      gsap.to(this, {
        cameraDistance: this.targetCameraDistance,
        duration: 0.3,
        ease: 'power2.inOut',
      });
    }, { passive: false });
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseNDC, this.camera);

    const hoverRadius = this.particleSystem.getHoverRadius();
    const positions = this.particleSystem.points.geometry.attributes.position as THREE.BufferAttribute;
    const count = this.particleSystem.getParticleCount();

    let nearestIndex = -1;
    let nearestDist = Infinity;
    const pos = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      pos.fromBufferAttribute(positions, i);
      const dist = this.raycaster.ray.distanceSqToPoint(pos);
      if (dist < nearestDist && dist < hoverRadius * hoverRadius) {
        nearestDist = dist;
        nearestIndex = i;
        this.hoverWorldPos.copy(pos);
      }
    }

    if (nearestIndex >= 0) {
      eventBus.emit('hover:nearest', {
        index: nearestIndex,
        worldPos: this.hoverWorldPos.clone(),
      });
    } else {
      eventBus.emit('hover:clear');
    }
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this.container);
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private updateFps(deltaTime: number): void {
    this.frameCount++;
    this.fpsTime += deltaTime;

    if (this.fpsTime >= 0.5) {
      this.currentFps = Math.round(this.frameCount / this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = 0;

      this.fpsPanel.textContent = `${this.currentFps} FPS`;

      if (this.currentFps < this.fpsWarningThreshold) {
        this.fpsPanel.classList.add('warning');
      } else {
        this.fpsPanel.classList.remove('warning');
      }
    }
  }

  public animate(): void {
    const deltaTime = this.clock.getDelta();

    this.updateFps(deltaTime);
    this.updateCameraPosition();
    this.particleSystem.update(deltaTime);

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(() => this.animate());
  }

  public start(): void {
    this.clock.start();
    this.animate();
  }

  public dispose(): void {
    this.resizeObserver?.disconnect();
    this.renderer.dispose();
    (this.stars.geometry as THREE.BufferGeometry).dispose();
    (this.stars.material as THREE.Material).dispose();
    this.gridHelper.geometry.dispose();
    (this.gridHelper.material as THREE.Material).dispose();
  }
}

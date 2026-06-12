import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface EarthConfig {
  container: HTMLElement;
  earthRadius?: number;
  autoRotateSpeed?: number;
}

export class Earth {
  private container: HTMLElement;
  private earthRadius: number;
  private autoRotateSpeed: number;

  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public controls: OrbitControls;

  private earthGroup: THREE.Group;
  private earthMesh: THREE.Mesh | null = null;
  private atmosphereMesh: THREE.Mesh | null = null;
  private starsMesh: THREE.Points | null = null;
  private gridLines: THREE.LineSegments | null = null;

  private animationFrameId: number = 0;
  private clock: THREE.Clock;
  private userInteracting: boolean = false;
  private autoRotateEnabled: boolean = true;

  private resizeObserver: ResizeObserver | null = null;
  private onRenderCallbacks: Array<(delta: number, elapsed: number) => void> = [];
  private onMouseMoveCallbacks: Array<(event: MouseEvent, raycaster: THREE.Raycaster) => void> = [];
  private onMouseClickCallbacks: Array<(event: MouseEvent, raycaster: THREE.Raycaster) => void> = [];

  private raycaster: THREE.Raycaster;
  private mouseNDC: THREE.Vector2;

  constructor(config: EarthConfig) {
    this.container = config.container;
    this.earthRadius = config.earthRadius ?? 2;
    this.autoRotateSpeed = config.autoRotateSpeed ?? 0.0008;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000814);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 1.5, 7);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.7;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 15;
    this.controls.enablePan = false;

    this.earthGroup = new THREE.Group();
    this.scene.add(this.earthGroup);

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2();

    this.setupLights();
    this.createStars();
    this.createEarth();
    this.createAtmosphere();
    this.createGridLines();
    this.setupEventListeners();
    this.setupResizeObserver();
    this.startRenderLoop();
  }

  private setupLights(): void {
    const ambient = new THREE.AmbientLight(0x406080, 0.35);
    this.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x6080ff, 0.4);
    fillLight.position.set(-4, -2, -3);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x00aaff, 0.8, 20);
    rimLight.position.set(0, 2, -5);
    this.scene.add(rimLight);
  }

  private createEarthTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1628');
    gradient.addColorStop(0.3, '#0d2847');
    gradient.addColorStop(0.5, '#10345e');
    gradient.addColorStop(0.7, '#0d2847');
    gradient.addColorStop(1, '#0a1628');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = canvas.width;
    noiseCanvas.height = canvas.height;
    const noiseCtx = noiseCanvas.getContext('2d')!;
    const imageData = noiseCtx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random();
      const brightness = Math.floor(20 + v * 40);
      data[i] = brightness;
      data[i + 1] = Math.floor(brightness * 1.3);
      data[i + 2] = Math.floor(brightness * 1.8);
      data[i + 3] = 255;
    }
    noiseCtx.putImageData(imageData, 0, 0);

    ctx.globalAlpha = 0.3;
    ctx.drawImage(noiseCanvas, 0, 0);
    ctx.globalAlpha = 1;

    const continents: Array<[number, number, number, number, number][]> = [
      [
        [180, 200, 400, 280, 200],
        [200, 240, 350, 260, 220],
        [140, 280, 280, 320, 260]
      ],
      [
        [900, 180, 560, 220, 180],
        [950, 220, 500, 280, 200]
      ],
      [
        [1400, 280, 280, 360, 260],
        [1450, 320, 220, 300, 220]
      ],
      [
        [1000, 520, 280, 420, 220],
        [1020, 540, 240, 380, 200]
      ],
      [
        [250, 600, 200, 280, 160],
        [300, 620, 180, 260, 140]
      ],
      [
        [1600, 680, 240, 140, 80]
      ],
      [
        [800, 850, 250, 120, 60]
      ]
    ];

    continents.forEach(continent => {
      continent.forEach(blob => {
        const [cx, cy, rx, ry, r] = blob;
        const blobGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
        blobGrad.addColorStop(0, 'rgba(20, 80, 50, 0.5)');
        blobGrad.addColorStop(0.4, 'rgba(25, 90, 60, 0.4)');
        blobGrad.addColorStop(0.7, 'rgba(15, 60, 80, 0.3)');
        blobGrad.addColorStop(1, 'rgba(10, 40, 70, 0)');

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, r * Math.PI / 180, 0, Math.PI * 2);
        ctx.fillStyle = blobGrad;
        ctx.fill();
      });
    });

    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2;
      ctx.fillStyle = `rgba(100, 180, 220, ${Math.random() * 0.3})`;
      ctx.fillRect(x, y, size, size);
    }

    for (let i = 0; i < 150; i++) {
      const x = Math.random() * canvas.width;
      const y = 100 + Math.random() * (canvas.height - 200);
      const size = 1 + Math.random() * 3;
      ctx.fillStyle = `rgba(0, 229, 255, ${0.3 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  private createEarth(): void {
    const geometry = new THREE.SphereGeometry(this.earthRadius, 96, 96);
    const texture = this.createEarthTexture();

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.3,
      transparent: true,
      opacity: 0.95
    });

    this.earthMesh = new THREE.Mesh(geometry, material);
    this.earthGroup.add(this.earthMesh);

    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = 2048;
    glowCanvas.height = 1024;
    const glowCtx = glowCanvas.getContext('2d')!;

    glowCtx.fillStyle = 'rgba(0, 0, 0, 1)';
    glowCtx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);

    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * glowCanvas.width;
      const y = 100 + Math.random() * (glowCanvas.height - 200);
      const size = Math.random() * 2;
      const intensity = Math.random();
      glowCtx.fillStyle = `rgba(0, ${Math.floor(200 + intensity * 55)}, ${Math.floor(150 + intensity * 105)}, ${intensity * 0.9})`;
      glowCtx.fillRect(x, y, size, size);
    }

    const glowTexture = new THREE.CanvasTexture(glowCanvas);

    const lightsGeometry = new THREE.SphereGeometry(this.earthRadius * 1.002, 96, 96);
    const lightsMaterial = new THREE.MeshBasicMaterial({
      map: glowTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const lightsMesh = new THREE.Mesh(lightsGeometry, lightsMaterial);
    this.earthGroup.add(lightsMesh);
  }

  private createAtmosphere(): void {
    const atmosphereGeometry = new THREE.SphereGeometry(this.earthRadius * 1.15, 64, 64);

    const atmosphereVertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const atmosphereFragmentShader = `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
        vec3 atmosphereColor = vec3(0.0, 0.6, 1.0);
        gl_FragColor = vec4(atmosphereColor, intensity * 0.6);
      }
    `;

    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.earthGroup.add(this.atmosphereMesh);

    const rimGeometry = new THREE.SphereGeometry(this.earthRadius * 1.03, 64, 64);
    const rimMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.0);
          vec3 rimColor = vec3(0.2, 0.8, 1.0);
          gl_FragColor = vec4(rimColor, intensity * 0.4);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      transparent: true,
      depthWrite: false
    });

    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    this.earthGroup.add(rimMesh);
  }

  private createStars(): void {
    const starCount = 4000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = 50 + Math.random() * 450;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorVar = 0.7 + Math.random() * 0.3;
      const blueTint = 0.8 + Math.random() * 0.2;
      colors[i * 3] = colorVar * 0.85;
      colors[i * 3 + 1] = colorVar * 0.95;
      colors[i * 3 + 2] = colorVar * blueTint;

      sizes[i] = 0.5 + Math.random() * 2.5;
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsVertexShader = `
      attribute float size;
      varying vec3 vColor;
      uniform float uTime;
      attribute vec3 color;

      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        float twinkle = 0.7 + 0.3 * sin(uTime * 2.0 + position.x * 0.01 + position.y * 0.02 + position.z * 0.015);
        gl_PointSize = size * twinkle * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const starsFragmentShader = `
      varying vec3 vColor;
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
        gl_FragColor = vec4(vColor, alpha);
      }
    `;

    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: starsVertexShader,
      fragmentShader: starsFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starsMesh = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.starsMesh);
  }

  private createGridLines(): void {
    const segments: number[] = [];
    const earthR = this.earthRadius * 1.001;

    for (let lat = -80; lat <= 80; lat += 20) {
      const phi = (90 - lat) * (Math.PI / 180);
      const radius = earthR * Math.sin(phi);
      const y = earthR * Math.cos(phi);
      for (let lng = 0; lng < 360; lng += 2) {
        const theta1 = lng * (Math.PI / 180);
        const theta2 = (lng + 2) * (Math.PI / 180);
        segments.push(
          radius * Math.cos(theta1), y, radius * Math.sin(theta1),
          radius * Math.cos(theta2), y, radius * Math.sin(theta2)
        );
      }
    }

    for (let lng = 0; lng < 360; lng += 20) {
      const theta = lng * (Math.PI / 180);
      for (let lat = -90; lat < 90; lat += 2) {
        const phi1 = (90 - lat) * (Math.PI / 180);
        const phi2 = (90 - (lat + 2)) * (Math.PI / 180);
        const r1Sin = earthR * Math.sin(phi1);
        const r2Sin = earthR * Math.sin(phi2);
        segments.push(
          r1Sin * Math.cos(theta), earthR * Math.cos(phi1), r1Sin * Math.sin(theta),
          r2Sin * Math.cos(theta), earthR * Math.cos(phi2), r2Sin * Math.sin(theta)
        );
      }
    }

    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x0088aa,
      transparent: true,
      opacity: 0.15,
      depthWrite: false
    });

    this.gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
    this.earthGroup.add(this.gridLines);
  }

  private setupEventListeners(): void {
    this.controls.addEventListener('start', () => {
      this.userInteracting = true;
    });

    this.controls.addEventListener('end', () => {
      this.userInteracting = false;
    });

    this.renderer.domElement.addEventListener('mousemove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseNDC, this.camera);

      for (const cb of this.onMouseMoveCallbacks) {
        cb(event, this.raycaster);
      }
    });

    this.renderer.domElement.addEventListener('click', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouseNDC, this.camera);

      for (const cb of this.onMouseClickCallbacks) {
        cb(event, this.raycaster);
      }
    });
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
      }
    });

    this.resizeObserver.observe(this.container);
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      if (!this.userInteracting && this.autoRotateEnabled) {
        this.earthGroup.rotation.y += this.autoRotateSpeed * delta * 60;
      }

      if (this.starsMesh) {
        const material = this.starsMesh.material as THREE.ShaderMaterial;
        if (material.uniforms) {
          material.uniforms.uTime.value = elapsed;
        }
      }

      this.scene.rotation.y = elapsed * 0.005;

      this.controls.update();

      for (const cb of this.onRenderCallbacks) {
        cb(delta, elapsed);
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public onRender(callback: (delta: number, elapsed: number) => void): void {
    this.onRenderCallbacks.push(callback);
  }

  public onMouseMove(callback: (event: MouseEvent, raycaster: THREE.Raycaster) => void): void {
    this.onMouseMoveCallbacks.push(callback);
  }

  public onMouseClick(callback: (event: MouseEvent, raycaster: THREE.Raycaster) => void): void {
    this.onMouseClickCallbacks.push(callback);
  }

  public getEarthGroup(): THREE.Group {
    return this.earthGroup;
  }

  public getEarthRadius(): number {
    return this.earthRadius;
  }

  public setAutoRotate(enabled: boolean): void {
    this.autoRotateEnabled = enabled;
  }

  public addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  public addToEarthGroup(object: THREE.Object3D): void {
    this.earthGroup.add(object);
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public static latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
      if (obj instanceof THREE.LineSegments) {
        obj.geometry.dispose();
      }
      if (obj instanceof THREE.Points) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else {
          (obj.material as THREE.Material).dispose();
        }
      }
    });

    this.renderer.dispose();
    this.controls.dispose();
  }
}

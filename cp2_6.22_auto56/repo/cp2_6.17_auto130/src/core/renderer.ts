import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BodyState, EventBus } from '../types';
import gsap from 'gsap';

export class SceneRenderer {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private eventBus: EventBus;
  private bodyMeshes: Map<string, THREE.Mesh> = new Map();
  private bodyGlowMeshes: Map<string, THREE.Mesh> = new Map();
  private orbitLines: Map<string, THREE.Line> = new Map();
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private hoveredBody: string | null = null;
  private stars: THREE.Points | null = null;
  private backgroundStartColor: THREE.Color = new THREE.Color(0x0a001a);
  private backgroundEndColor: THREE.Color = new THREE.Color(0x001a3d);
  private isRotating: boolean = false;
  private lastCameraAngle: number = 0;
  private backgroundTransition: number = 0;
  private clock: THREE.Clock;

  constructor(container: HTMLElement, eventBus: EventBus) {
    this.container = container;
    this.eventBus = eventBus;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = this.backgroundStartColor.clone();
    this.scene.fog = new THREE.FogExp2(0x0a001a, 0.003);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 15, 30);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.target.set(0, 0, 0);

    this.setupLighting();
    this.createStarfield();
    this.setupEventListeners();
    this.addTestObject();
    this.animate();
  }

  private addTestObject(): void {
    const testGeo = new THREE.SphereGeometry(5, 32, 32);
    const testMat = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.5
    });
    const testMesh = new THREE.Mesh(testGeo, testMat);
    testMesh.position.set(0, 0, 0);
    testMesh.name = 'test-sphere';
    this.scene.add(testMesh);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x444466, 0.6);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffaa00, 3, 150);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    const rimLight = new THREE.DirectionalLight(0x6688ff, 0.4);
    rimLight.position.set(-10, 5, -10);
    this.scene.add(rimLight);
  }

  private createStarfield(): void {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 80 + Math.random() * 20;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      sizes[i] = 1 + Math.random() * 2;
      phases[i] = Math.random() * Math.PI * 2;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float phase;
        uniform float time;
        varying float vBrightness;
        void main() {
          vBrightness = 0.5 + 0.5 * sin(time * 2.0 + phase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * vBrightness;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vBrightness;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * vBrightness);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));

    this.controls.addEventListener('start', () => {
      this.isRotating = true;
    });

    this.controls.addEventListener('end', () => {
      this.isRotating = false;
    });

    this.eventBus.on('bodies:initialized', (bodies) => {
      this.createBodies(bodies as BodyState[]);
    });

    this.eventBus.on('bodies:updated', (bodies) => {
      this.updateBodies(bodies as BodyState[]);
    });
  }

  private createBodies(bodies: BodyState[]): void {
    bodies.forEach((body) => {
      const geometry = new THREE.SphereGeometry(body.radius, 32, 32);
      const emissiveIntensity = body.emissiveIntensity || 0;
      const material = new THREE.MeshStandardMaterial({
        color: body.color,
        emissive: body.type === 'star' ? body.color : new THREE.Color(body.color).multiplyScalar(0.3),
        emissiveIntensity: body.type === 'star' ? emissiveIntensity : 0.15,
        roughness: body.type === 'star' ? 0.2 : 0.6,
        metalness: body.type === 'star' ? 0.6 : 0.1
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(body.position.x, body.position.y, body.position.z);
      mesh.userData = { bodyId: body.id, bodyType: body.type };
      this.scene.add(mesh);
      this.bodyMeshes.set(body.id, mesh);

      if (body.type === 'planet') {
        const glowGeometry = new THREE.SphereGeometry(body.radius * 1.3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x00ffaa,
          transparent: true,
          opacity: 0.0,
          side: THREE.BackSide
        });
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.copy(mesh.position);
        this.scene.add(glowMesh);
        this.bodyGlowMeshes.set(body.id, glowMesh);
      }

      if (body.type === 'planet' && body.orbitRadius > 0) {
        this.createOrbitLine(body.id, body.orbitRadius);
      }
    });
  }

  private createOrbitLine(bodyId: string, radius: number): void {
    const points: THREE.Vector3[] = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      dashSize: 0.5,
      gapSize: 0.3
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    this.scene.add(line);
    this.orbitLines.set(bodyId, line);
  }

  private updateBodies(bodies: BodyState[]): void {
    bodies.forEach((body) => {
      const mesh = this.bodyMeshes.get(body.id);
      if (mesh) {
        mesh.position.set(body.position.x, body.position.y, body.position.z);

        if (body.type === 'star') {
          mesh.rotation.y += 0.001;
        }
      }

      const glowMesh = this.bodyGlowMeshes.get(body.id);
      if (glowMesh) {
        glowMesh.position.set(body.position.x, body.position.y, body.position.z);
      }
    });
  }

  private onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private onMouseMove(event: MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.checkHover();
  }

  private onClick(event: MouseEvent): void {
    if (this.isRotating) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = Array.from(this.bodyMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const bodyId = mesh.userData.bodyId as string;
      this.eventBus.emit('body:clicked', bodyId, event.clientX, event.clientY);
    } else {
      this.eventBus.emit('scene:clicked');
    }
  }

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const planetMeshes = Array.from(this.bodyMeshes.entries())
      .filter(([id]) => {
        const mesh = this.bodyMeshes.get(id);
        return mesh && mesh.userData.bodyType === 'planet';
      })
      .map(([, mesh]) => mesh);

    const intersects = this.raycaster.intersectObjects(planetMeshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      const bodyId = mesh.userData.bodyId as string;

      if (this.hoveredBody !== bodyId) {
        if (this.hoveredBody) {
          this.setGlowState(this.hoveredBody, false);
        }
        this.hoveredBody = bodyId;
        this.setGlowState(bodyId, true);
        this.renderer.domElement.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredBody) {
        this.setGlowState(this.hoveredBody, false);
        this.hoveredBody = null;
        this.renderer.domElement.style.cursor = 'grab';
      }
    }
  }

  private setGlowState(bodyId: string, isHovered: boolean): void {
    const glowMesh = this.bodyGlowMeshes.get(bodyId);
    if (!glowMesh) return;

    const material = glowMesh.material as THREE.MeshBasicMaterial;
    const targetScale = isHovered ? 1.6 : 1.3;
    const targetOpacity = isHovered ? 0.4 : 0.0;
    const targetColor = isHovered ? 0x00ccff : 0x00ffaa;

    gsap.to(glowMesh.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: 0.2,
      ease: 'power2.out'
    });

    gsap.to(material, {
      opacity: targetOpacity,
      duration: 0.2,
      ease: 'power2.out'
    });

    gsap.to(material.color, {
      r: ((targetColor >> 16) & 255) / 255,
      g: ((targetColor >> 8) & 255) / 255,
      b: (targetColor & 255) / 255,
      duration: 0.2,
      ease: 'power2.out'
    });
  }

  private updateBackground(delta: number): void {
    const cameraAngle = this.controls.getAzimuthalAngle();
    const angleDiff = Math.abs(cameraAngle - this.lastCameraAngle);

    if (this.isRotating || angleDiff > 0.01) {
      this.backgroundTransition = Math.min(1, this.backgroundTransition + delta / 2);
    } else {
      this.backgroundTransition = Math.max(0, this.backgroundTransition - delta / 2);
    }

    this.lastCameraAngle = cameraAngle;

    const bgColor = this.backgroundStartColor.clone().lerp(
      this.backgroundEndColor,
      this.backgroundTransition
    );
    this.scene.background = bgColor;

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(bgColor);
    }
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    if (this.stars && this.stars.material instanceof THREE.ShaderMaterial) {
      this.stars.material.uniforms.time.value += delta;
    }

    this.updateBackground(delta);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getBodyWorldPosition(bodyId: string): THREE.Vector3 | null {
    const mesh = this.bodyMeshes.get(bodyId);
    if (mesh) {
      return mesh.position.clone();
    }
    return null;
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize.bind(this));
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

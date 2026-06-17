import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { CelestialBody } from '../utils/types';
import { EventBus } from '../utils/eventBus';

interface BodyMesh {
  bodyId: string;
  mesh: THREE.Mesh;
  glowRing?: THREE.Mesh;
}

export class SceneRenderer {
  private container: HTMLElement;
  private bus: EventBus;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private bodyMeshes: Map<string, BodyMesh>;
  private orbitLines: Map<string, THREE.Line>;
  private planetMeshes: THREE.Mesh[];
  private starField: THREE.Points | null;
  private hoveredId: string | null;
  private clock: THREE.Clock;
  private backgroundColor: THREE.Color;
  private targetBgColor: THREE.Color;
  private colorPurple: THREE.Color;
  private colorBlue: THREE.Color;

  constructor(container: HTMLElement, bus: EventBus) {
    this.container = container;
    this.bus = bus;
    this.bodyMeshes = new Map();
    this.orbitLines = new Map();
    this.planetMeshes = [];
    this.hoveredId = null;
    this.clock = new THREE.Clock();
    this.colorPurple = new THREE.Color('#0A001A');
    this.colorBlue = new THREE.Color('#001A3D');
    this.backgroundColor = this.colorPurple.clone();
    this.targetBgColor = this.colorPurple.clone();
    this.starField = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.scene = new THREE.Scene();
    this.scene.background = this.backgroundColor;

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 25, 45);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 120;
    this.controls.screenSpacePanning = false;
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };

    this.initLights();
    this.createStarField();
    this.setupEventListeners();
    this.subscribeEvents();
    this.animate();
  }

  private initLights(): void {
    const ambient = new THREE.AmbientLight(0x333355, 0.4);
    this.scene.add(ambient);
  }

  private createStarField(): void {
    const starCount = 200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const r = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness + Math.random() * 0.1;

      sizes[i] = 1 + Math.random() * 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false
    });

    this.starField = new THREE.Points(geometry, material);
    this.scene.add(this.starField);
  }

  public createBodies(bodies: CelestialBody[]): void {
    for (const body of bodies) {
      this.createBodyMesh(body);
      if (body.type === 'planet') {
        this.createOrbitLine(body);
      }
    }
  }

  private createBodyMesh(body: CelestialBody): void {
    const geometry = new THREE.SphereGeometry(body.radius, 48, 48);
    let material: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;

    if (body.type === 'star') {
      material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(body.color)
      });
      const glowGeo = new THREE.SphereGeometry(body.radius * 1.4, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(body.color),
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.add(glowMesh);
      mesh.userData.bodyId = body.id;
      this.scene.add(mesh);

      const pointLight = new THREE.PointLight(
        new THREE.Color(body.color),
        body.emissiveIntensity ?? 1.5,
        200,
        1.5
      );
      mesh.add(pointLight);

      this.bodyMeshes.set(body.id, { bodyId: body.id, mesh });
    } else {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(body.color),
        roughness: 0.7,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.bodyId = body.id;
      mesh.position.set(body.position.x, body.position.y, body.position.z);
      this.scene.add(mesh);

      const ringGeo = new THREE.RingGeometry(
        body.radius * 1.4,
        body.radius * 1.8,
        32
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#00FFAA'),
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
      });
      const glowRing = new THREE.Mesh(ringGeo, ringMat);
      glowRing.rotation.x = -Math.PI / 2;
      mesh.add(glowRing);

      this.bodyMeshes.set(body.id, { bodyId: body.id, mesh, glowRing });
      this.planetMeshes.push(mesh);
    }
  }

  private createOrbitLine(body: CelestialBody): void {
    const points: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * body.orbitRadius,
          0,
          Math.sin(angle) * body.orbitRadius
        )
      );
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      dashSize: 0.5,
      gapSize: 0.3
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    this.scene.add(line);
    this.orbitLines.set(body.id, line);
  }

  private subscribeEvents(): void {
    this.bus.on('bodies:update', (bodies) => {
      this.updateBodies(bodies);
    });
  }

  private updateBodies(bodies: CelestialBody[]): void {
    for (const body of bodies) {
      const bodyMesh = this.bodyMeshes.get(body.id);
      if (bodyMesh) {
        bodyMesh.mesh.position.set(
          body.position.x,
          body.position.y,
          body.position.z
        );
      }
    }
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;

    window.addEventListener('resize', this.onResize);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);

    this.controls.addEventListener('start', () => {
      this.bus.emit('camera:rotate', { isRotating: true });
      this.targetBgColor = this.colorBlue.clone();
    });

    this.controls.addEventListener('end', () => {
      this.bus.emit('camera:rotate', { isRotating: false });
      this.targetBgColor = this.colorPurple.clone();
    });
  }

  private onResize = (): void => {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.checkHover();
  };

  private onClick = (): void => {
    if (this.hoveredId) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.planetMeshes);
      if (intersects.length > 0) {
        const bodyId = intersects[0].object.userData.bodyId as string;
        const bodyMesh = this.bodyMeshes.get(bodyId);
        if (bodyMesh) {
          this.bus.emit('body:select', { bodyId });
        }
      }
    }
  };

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planetMeshes);

    let newHoveredId: string | null = null;
    if (intersects.length > 0) {
      newHoveredId = intersects[0].object.userData.bodyId as string;
    }

    if (newHoveredId !== this.hoveredId) {
      if (this.hoveredId) {
        this.setHoverState(this.hoveredId, false);
      }
      if (newHoveredId) {
        this.setHoverState(newHoveredId, true);
      }
      this.hoveredId = newHoveredId;
      this.bus.emit('body:hover', { bodyId: this.hoveredId });
      document.body.style.cursor = this.hoveredId ? 'pointer' : 'grab';
    }
  }

  private setHoverState(bodyId: string, isHovered: boolean): void {
    const bodyMesh = this.bodyMeshes.get(bodyId);
    if (!bodyMesh || !bodyMesh.glowRing) return;

    const ring = bodyMesh.glowRing;
    const material = ring.material as THREE.MeshBasicMaterial;
    const targetScale = isHovered ? 1.4 : 1.0;
    const targetOpacity = isHovered ? 0.7 : 0.0;
    const targetColor = isHovered
      ? new THREE.Color('#00CCFF')
      : new THREE.Color('#00FFAA');

    const startScale = ring.scale.x;
    const startOpacity = material.opacity;
    const startColor = material.color.clone();
    const duration = 300;
    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      ring.scale.setScalar(startScale + (targetScale - startScale) * eased);
      material.opacity =
        startOpacity + (targetOpacity - startOpacity) * eased;
      material.color.lerpColors(startColor, targetColor, eased);

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    this.controls.update();

    if (this.starField) {
      this.starField.rotation.y += delta * 0.005;
      const positions = this.starField.geometry.attributes.position
        .array as Float32Array;
      const colors = this.starField.geometry.attributes.color
        .array as Float32Array;
      for (let i = 0; i < 200; i++) {
        const flicker = 0.7 + Math.sin(this.clock.elapsedTime * 2 + i) * 0.3;
        colors[i * 3] = flicker * 0.8 + 0.2;
        colors[i * 3 + 1] = flicker * 0.8 + 0.2;
        colors[i * 3 + 2] = flicker * 0.9 + 0.1;
        void positions;
      }
      this.starField.geometry.attributes.color.needsUpdate = true;
    }

    this.backgroundColor.lerp(this.targetBgColor, delta * 0.5);
    this.scene.background = this.backgroundColor;

    this.renderer.render(this.scene, this.camera);
  };

  public getBodyScreenPosition(bodyId: string): { x: number; y: number } | null {
    const bodyMesh = this.bodyMeshes.get(bodyId);
    if (!bodyMesh) return null;

    const pos = bodyMesh.mesh.position.clone();
    pos.project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (pos.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-pos.y * 0.5 + 0.5) * rect.height + rect.top
    };
  }

  public dispose(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.domElement.removeEventListener(
      'mousemove',
      this.onMouseMove
    );
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.dispose();
    this.controls.dispose();
  }
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import type { CelestialBody } from '../utils/types';
import { EventBus } from './bus';

interface BodyMesh {
  bodyId: string;
  mesh: THREE.Mesh;
  glowRing?: THREE.Mesh;
  glowTimeline?: gsap.core.Timeline;
}

const STAR_COUNT = 200;
const BG_COLOR_PURPLE = new THREE.Color('#0A001A');
const BG_COLOR_BLUE = new THREE.Color('#001A3D');
const COLOR_HOVER_DEFAULT = new THREE.Color('#00FFAA');
const COLOR_HOVER_ACTIVE = new THREE.Color('#00CCFF');
const BG_LERP_SPEED = 0.5;
const STAR_FLICKER_SPEED = 2.0;

export class SceneRenderer {
  private container: HTMLElement;
  private bus: EventBus;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private webglRenderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private bodyMeshes: Map<string, BodyMesh>;
  private orbitLines: Map<string, THREE.Line>;
  private planetMeshes: THREE.Mesh[];
  private starField: THREE.Points | null;
  private starBaseColors: Float32Array;
  private hoveredId: string | null;
  private clock: THREE.Clock;
  private backgroundColor: THREE.Color;
  private targetBgColor: THREE.Color;
  private animFrameId: number;

  constructor(container: HTMLElement, bus: EventBus) {
    this.container = container;
    this.bus = bus;
    this.bodyMeshes = new Map();
    this.orbitLines = new Map();
    this.planetMeshes = [];
    this.hoveredId = null;
    this.clock = new THREE.Clock();
    this.backgroundColor = BG_COLOR_PURPLE.clone();
    this.targetBgColor = BG_COLOR_PURPLE.clone();
    this.animFrameId = 0;
    this.starBaseColors = new Float32Array(0);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-9999, -9999);
    this.starField = null;

    this.scene = new THREE.Scene();
    this.scene.background = this.backgroundColor;

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 25, 45);

    this.webglRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });
    this.webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.webglRenderer.setSize(container.clientWidth, container.clientHeight);
    this.webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.webglRenderer.toneMappingExposure = 1.2;
    container.appendChild(this.webglRenderer.domElement);

    this.controls = new OrbitControls(
      this.camera,
      this.webglRenderer.domElement
    );
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
    this.startRenderLoop();
  }

  private initLights(): void {
    const ambient = new THREE.AmbientLight(0x333355, 0.4);
    this.scene.add(ambient);
  }

  private createStarField(): void {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    this.starBaseColors = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
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

      this.starBaseColors[i] = brightness;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

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

  private updateStarFlicker(elapsed: number): void {
    if (!this.starField) return;
    const colors = this.starField.geometry.attributes.color
      .array as Float32Array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const flicker =
        0.7 + Math.sin(elapsed * STAR_FLICKER_SPEED + i * 1.73) * 0.3;
      const base = this.starBaseColors[i];
      colors[i * 3] = base * flicker;
      colors[i * 3 + 1] = base * flicker;
      colors[i * 3 + 2] = (base + 0.1) * flicker;
    }
    this.starField.geometry.attributes.color.needsUpdate = true;
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

    if (body.type === 'star') {
      const material = new THREE.MeshBasicMaterial({
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
      const material = new THREE.MeshStandardMaterial({
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
        color: COLOR_HOVER_DEFAULT.clone(),
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
      });
      const glowRing = new THREE.Mesh(ringGeo, ringMat);
      glowRing.rotation.x = -Math.PI / 2;
      mesh.add(glowRing);

      this.bodyMeshes.set(body.id, {
        bodyId: body.id,
        mesh,
        glowRing
      });
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
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineDashedMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      dashSize: 0.5,
      gapSize: 0.3
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
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
    const canvas = this.webglRenderer.domElement;
    window.addEventListener('resize', this.onResize);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);

    this.controls.addEventListener('change', () => {
      const azimuth = this.controls.getAzimuthalAngle();
      this.onCameraAzimuthChange(azimuth);
    });
  }

  private onCameraAzimuthChange(azimuth: number): void {
    this.bus.emit('camera:rotate', { azimuthAngle: azimuth });

    const normalizedAngle = Math.abs(azimuth) / Math.PI;
    this.targetBgColor = BG_COLOR_PURPLE.clone().lerp(
      BG_COLOR_BLUE,
      normalizedAngle
    );
  }

  private onResize = (): void => {
    this.camera.aspect =
      this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.webglRenderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
  };

  private onMouseMove = (e: MouseEvent): void => {
    const rect = this.webglRenderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.checkHover();
  };

  private onClick = (): void => {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planetMeshes);
    if (intersects.length > 0) {
      const bodyId = intersects[0].object.userData.bodyId as string;
      const body = this.findBodyById(bodyId);
      if (body) {
        this.bus.emit('body:click', { body });
      }
    }
  };

  private findBodyById(bodyId: string): CelestialBody | null {
    for (const [, entry] of this.bodyMeshes) {
      if (entry.bodyId === bodyId) {
        const pos = entry.mesh.position;
        return {
          id: bodyId,
          name: '',
          type: 'planet',
          mass: 0,
          radius: 0,
          color: '',
          position: { x: pos.x, y: pos.y, z: pos.z },
          velocity: { x: 0, y: 0, z: 0 },
          orbitRadius: 0,
          orbitAngle: 0,
          orbitSpeed: 0
        };
      }
    }
    return null;
  }

  private checkHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.planetMeshes);

    let newHoveredId: string | null = null;
    if (intersects.length > 0) {
      newHoveredId = intersects[0].object.userData.bodyId as string;
    }

    if (newHoveredId !== this.hoveredId) {
      if (this.hoveredId) {
        this.setHoverStateGSAP(this.hoveredId, false);
      }
      if (newHoveredId) {
        this.setHoverStateGSAP(newHoveredId, true);
      }
      this.hoveredId = newHoveredId;
      this.bus.emit('body:hover', { bodyId: this.hoveredId });
      this.webglRenderer.domElement.style.cursor = this.hoveredId
        ? 'pointer'
        : 'grab';
    }
  }

  private setHoverStateGSAP(bodyId: string, isHovered: boolean): void {
    const bodyMesh = this.bodyMeshes.get(bodyId);
    if (!bodyMesh || !bodyMesh.glowRing) return;

    if (bodyMesh.glowTimeline) {
      bodyMesh.glowTimeline.kill();
    }

    const ring = bodyMesh.glowRing;
    const material = ring.material as THREE.MeshBasicMaterial;

    const targetScale = isHovered ? 1.4 : 1.0;
    const targetOpacity = isHovered ? 0.7 : 0.0;
    const targetColor = isHovered
      ? COLOR_HOVER_ACTIVE.clone()
      : COLOR_HOVER_DEFAULT.clone();

    const currentScale = ring.scale.x;
    const currentOpacity = material.opacity;
    const currentColor = material.color.clone();

    const proxy = {
      scale: currentScale,
      opacity: currentOpacity,
      colorR: currentColor.r,
      colorG: currentColor.g,
      colorB: currentColor.b
    };

    const tl = gsap.timeline();

    tl.to(proxy, {
      scale: targetScale,
      opacity: targetOpacity,
      colorR: targetColor.r,
      colorG: targetColor.g,
      colorB: targetColor.b,
      duration: 0.3,
      ease: 'power2.out',
      onUpdate: () => {
        ring.scale.setScalar(proxy.scale);
        material.opacity = proxy.opacity;
        material.color.setRGB(proxy.colorR, proxy.colorG, proxy.colorB);
      }
    });

    bodyMesh.glowTimeline = tl;
  }

  private startRenderLoop(): void {
    const loop = (): void => {
      this.animFrameId = requestAnimationFrame(loop);
      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      this.controls.update();

      this.updateStarFlicker(elapsed);

      if (this.starField) {
        this.starField.rotation.y += delta * 0.005;
      }

      this.backgroundColor.lerp(this.targetBgColor, delta * BG_LERP_SPEED);
      this.scene.background = this.backgroundColor.clone();

      this.webglRenderer.render(this.scene, this.camera);
    };
    loop();
  }

  public dispose(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.webglRenderer.domElement.removeEventListener(
      'mousemove',
      this.onMouseMove
    );
    this.webglRenderer.domElement.removeEventListener('click', this.onClick);
    this.webglRenderer.dispose();
    this.controls.dispose();
  }
}

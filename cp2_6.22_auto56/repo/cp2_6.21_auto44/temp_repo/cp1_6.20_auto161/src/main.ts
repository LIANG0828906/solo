import * as THREE from 'three';
import { MorphController, SculptureType, DEFAULT_PARAMS, SculptureParams } from './scene/sculpture';
import {
  createGradientMaterial,
  updateMaterialColor,
  updateMaterialTime,
  lerpColor,
  SCENE_BACKGROUNDS,
} from './scene/materialEffect';
import { ControlPanel } from './ui/controlPanel';
import { setupExportAction } from './ui/exportAction';

interface OrbitState {
  spherical: THREE.Spherical;
  targetSpherical: THREE.Spherical;
  target: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  isUserInteracting: boolean;
  lastX: number;
  lastY: number;
  damping: number;
}

class OrbitController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private state: OrbitState;
  private onInteractionStart: (() => void) | null = null;
  private onInteractionEnd: (() => void) | null = null;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    const offset = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(0, 0, 0));
    const sph = new THREE.Spherical().setFromVector3(offset);

    this.state = {
      spherical: sph.clone(),
      targetSpherical: sph.clone(),
      target: new THREE.Vector3(0, 0, 0),
      targetLookAt: new THREE.Vector3(0, 0, 0),
      isUserInteracting: false,
      lastX: 0,
      lastY: 0,
      damping: 0.08,
    };

    this.bindEvents();
  }

  setOnInteractionStart(cb: () => void): void {
    this.onInteractionStart = cb;
  }

  setOnInteractionEnd(cb: () => void): void {
    this.onInteractionEnd = cb;
  }

  private bindEvents(): void {
    const el = this.domElement;
    const ROTATE_SPEED = 0.005;
    const ZOOM_SPEED = 0.001;
    const PAN_SPEED = 0.002;

    el.addEventListener('pointerdown', (e) => {
      this.state.isUserInteracting = true;
      this.state.lastX = e.clientX;
      this.state.lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      if (this.onInteractionStart) this.onInteractionStart();
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.state.isUserInteracting) return;
      const dx = e.clientX - this.state.lastX;
      const dy = e.clientY - this.state.lastY;
      this.state.lastX = e.clientX;
      this.state.lastY = e.clientY;

      if (e.button === 0 || e.pointerType === 'touch') {
        this.state.targetSpherical.theta -= dx * ROTATE_SPEED;
        const EPS = 0.01;
        this.state.targetSpherical.phi = Math.max(
          EPS,
          Math.min(Math.PI - EPS, this.state.targetSpherical.phi - dy * ROTATE_SPEED)
        );
      } else if (e.button === 2) {
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        right.crossVectors(camDir, up).normalize();
        const panX = right.multiplyScalar(-dx * PAN_SPEED * this.state.targetSpherical.radius);
        const panY = up.multiplyScalar(dy * PAN_SPEED * this.state.targetSpherical.radius);
        this.state.targetLookAt.add(panX).add(panY);
      }
    });

    const endInteraction = (e: PointerEvent) => {
      if (!this.state.isUserInteracting) return;
      this.state.isUserInteracting = false;
      try { el.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      if (this.onInteractionEnd) this.onInteractionEnd();
    };

    el.addEventListener('pointerup', endInteraction);
    el.addEventListener('pointercancel', endInteraction);
    el.addEventListener('pointerleave', (e) => {
      if (this.state.isUserInteracting) {
        this.state.isUserInteracting = false;
        if (this.onInteractionEnd) this.onInteractionEnd();
      }
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const scale = Math.exp(e.deltaY * ZOOM_SPEED);
      this.state.targetSpherical.radius = Math.max(
        4,
        Math.min(30, this.state.targetSpherical.radius * scale)
      );
      if (this.onInteractionStart) this.onInteractionStart();
      clearTimeout((this as unknown as { _wheelTimer?: number })._wheelTimer);
      (this as unknown as { _wheelTimer?: number })._wheelTimer = window.setTimeout(() => {
        if (this.onInteractionEnd && !this.state.isUserInteracting) {
          this.onInteractionEnd();
        }
      }, 300);
    }, { passive: false });

    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  update(delta: number): void {
    const s = this.state;
    const factor = Math.min(1, s.damping * 60 * delta);

    s.spherical.theta += (s.targetSpherical.theta - s.spherical.theta) * factor;
    s.spherical.phi += (s.targetSpherical.phi - s.spherical.phi) * factor;
    s.spherical.radius += (s.targetSpherical.radius - s.spherical.radius) * factor;
    s.target.lerp(s.targetLookAt, factor);
    s.spherical.makeSafe();

    const offset = new THREE.Vector3().setFromSpherical(s.spherical);
    this.camera.position.copy(s.target).add(offset);
    this.camera.lookAt(s.target);
  }
}

class App {
  private container: HTMLElement;
  private canvasContainer: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sculpture: MorphController;
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private orbit: OrbitController;
  private controlPanel: ControlPanel;
  private clock: THREE.Clock;
  private autoRotationSpeed: number = (Math.PI * 2) / 15;
  private userRotationSpeedMultiplier: number = 1.0;
  private isUserInteracting: boolean = false;
  private autoRotateBlend: number = 1.0;
  private backgroundCurrent: { r: number; g: number; b: number };
  private backgroundTarget: { r: number; g: number; b: number };
  private rafId: number = 0;

  constructor() {
    this.container = document.getElementById('app') as HTMLElement;
    this.canvasContainer = document.getElementById('canvas-container') as HTMLElement;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0a0a2e, 12, 30);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(0, 2, 10);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0a2e, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.canvasContainer.appendChild(this.renderer.domElement);

    this.sculpture = new MorphController('torusKnot', DEFAULT_PARAMS);
    this.sculpture.setOnUpdate((p) => this.onMorphUpdate(p));

    this.material = createGradientMaterial({
      colorStart: '#00d2ff',
      colorEnd: '#7b2ff7',
      opacity: 0.82,
    });

    this.mesh = new THREE.Mesh(this.sculpture.getGeometry(), this.material);
    this.scene.add(this.mesh);

    this.addSceneLights();
    this.addParticleField();

    this.orbit = new OrbitController(this.camera, this.renderer.domElement);
    this.orbit.setOnInteractionStart(() => this.setUserInteracting(true));
    this.orbit.setOnInteractionEnd(() => this.setUserInteracting(false));

    this.controlPanel = new ControlPanel(this.container, {
      onSculptureChange: (type) => this.changeSculpture(type),
      onParamChange: (param, value) => this.updateSculptureParam(param, value),
      onRotationSpeedChange: (speed) => { this.userRotationSpeedMultiplier = speed; },
    });
    this.controlPanel.setOpacityCallback((value) => {
      updateMaterialColor(this.material, { opacity: value });
    });

    const exportBtn = this.controlPanel.getExportButton();
    if (exportBtn) {
      setupExportAction(this.renderer.domElement, exportBtn);
    }

    const initialBg = new THREE.Color(SCENE_BACKGROUNDS.torusKnot);
    this.backgroundCurrent = { r: initialBg.r, g: initialBg.g, b: initialBg.b };
    this.backgroundTarget = { ...this.backgroundCurrent };

    this.clock = new THREE.Clock();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private addSceneLights(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x88ccff, 0.9);
    keyLight.position.set(5, 8, 6);
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9966ff, 0.5);
    fillLight.position.set(-6, 3, -4);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x00d2ff, 1.2, 25);
    rimLight.position.set(0, -3, 8);
    this.scene.add(rimLight);
  }

  private addParticleField(): void {
    const count = 600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x6688ff,
      size: 0.06,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.userData.isParticles = true;
    this.scene.add(points);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private setUserInteracting(interacting: boolean): void {
    this.isUserInteracting = interacting;
  }

  private changeSculpture(type: SculptureType): void {
    this.sculpture.morphTo(type, 1.5);
    const targetBg = new THREE.Color(SCENE_BACKGROUNDS[type]);
    this.backgroundTarget = { r: targetBg.r, g: targetBg.g, b: targetBg.b };
    if (this.scene.fog instanceof THREE.Fog) {
      (this.scene.fog as THREE.Fog).color.copy(targetBg);
    }
  }

  private onMorphUpdate(_progress: number): void {
    /* update hook, reserved for UI progress indicators if needed */
  }

  private updateSculptureParam(param: string, value: number): void {
    const key = param as keyof SculptureParams;
    if (key === 'twist' || key === 'inflation' || key === 'branches') {
      this.sculpture.updateParams({ [key]: value } as Partial<SculptureParams>);
    }
  }

  private updateBackground(delta: number): void {
    const speed = Math.min(1, 2 * delta);
    this.backgroundCurrent.r += (this.backgroundTarget.r - this.backgroundCurrent.r) * speed;
    this.backgroundCurrent.g += (this.backgroundTarget.g - this.backgroundCurrent.g) * speed;
    this.backgroundCurrent.b += (this.backgroundTarget.b - this.backgroundCurrent.b) * speed;
    const color = new THREE.Color(
      this.backgroundCurrent.r,
      this.backgroundCurrent.g,
      this.backgroundCurrent.b
    );
    this.renderer.setClearColor(color, 1);
  }

  private animate = (): void => {
    this.rafId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;

    this.sculpture.update(delta);
    updateMaterialTime(this.material, elapsed);

    if (this.isUserInteracting) {
      this.autoRotateBlend += (0 - this.autoRotateBlend) * Math.min(1, 0.12 * 60 * delta);
    } else {
      this.autoRotateBlend += (1 - this.autoRotateBlend) * Math.min(1, 0.06 * 60 * delta);
    }

    const effectiveSpeed = this.autoRotationSpeed * this.userRotationSpeedMultiplier * this.autoRotateBlend;
    this.mesh.rotation.y += effectiveSpeed * delta;

    this.orbit.update(delta);
    this.updateBackground(delta);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Points && (obj.userData as { isParticles?: boolean }).isParticles) {
        obj.rotation.y = elapsed * 0.02;
        obj.rotation.x = Math.sin(elapsed * 0.1) * 0.05;
      }
    });

    this.renderer.render(this.scene, this.camera);
  };

  start(): void {
    this.clock.start();
    this.animate();
  }

  destroy(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize.bind(this));
    this.controlPanel.destroy();
    this.sculpture.getGeometry().dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}

const startApp = (): void => {
  const app = new App();
  (window as unknown as { __sculptureApp?: App }).__sculptureApp = app;
  app.start();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

export { App, OrbitController };

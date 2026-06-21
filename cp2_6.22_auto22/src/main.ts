import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Galaxy } from './galaxy';
import { CollisionSimulator } from './collision';
import {
  UIController,
  SimParams,
  buildGalaxyParams,
  applyInitialVelocities,
  reinitializeSimulation,
} from './ui';

const PARTICLE_COUNT = 7500;

class GalaxyApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private controls: OrbitControls;

  private galaxyA: Galaxy;
  private galaxyB: Galaxy;
  private simulator: CollisionSimulator;
  private ui: UIController;

  private clock: THREE.Clock;
  private frameId: number = 0;
  private colorUpdateTimer: number = 0;
  private heatmapUpdateTimer: number = 0;
  private savedState: {
    posA: Float32Array;
    velA: Float32Array;
    posB: Float32Array;
    velB: Float32Array;
    corePosA: THREE.Vector3;
    coreVelA: THREE.Vector3;
    corePosB: THREE.Vector3;
    coreVelB: THREE.Vector3;
    time: number;
  } | null = null;

  private container: HTMLElement;
  private starField: THREE.Points;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.composer = this.createComposer();
    this.controls = this.createControls();

    this.starField = this.createStarField();
    this.scene.add(this.starField);

    const defaultParams: SimParams = {
      massA: 1.0,
      massB: 1.0,
      initialDistance: 120,
      collisionAngle: 30,
      speedMultiplier: 1.0,
      playbackSpeed: 1.0,
    };

    const { galaxyA: gA, galaxyB: gB, initialVelA, initialVelB } = buildGalaxyParams(
      defaultParams,
      PARTICLE_COUNT,
    );

    this.galaxyA = new Galaxy(gA);
    this.galaxyB = new Galaxy(gB);
    applyInitialVelocities(this.galaxyA, this.galaxyB, initialVelA, initialVelB);

    this.scene.add(this.galaxyA.particles);
    this.scene.add(this.galaxyA.haloMesh);
    this.scene.add(this.galaxyB.particles);
    this.scene.add(this.galaxyB.haloMesh);

    this.simulator = new CollisionSimulator(this.galaxyA, this.galaxyB);
    this.scene.add(this.simulator.getHeatmapMesh());

    this.ui = new UIController(defaultParams, {
      onParamsChange: (p) => this.handleParamsChange(p),
      onReset: () => this.handleReset(),
      onPlayToggle: () => this.handlePlayToggle(),
      onPlaybackSpeedChange: (s) => this.handlePlaybackSpeed(s),
      onTimeSeek: (t) => this.handleTimeSeek(t),
    });

    this.addLights();
    this.addResizeListener();
    this.ui.setPlaying(true);
    this.animate();
  }

  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x0a0a1f, 0.002);
    return scene;
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      5000,
    );
    camera.position.set(0, 150, 250);
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  private createComposer(): EffectComposer {
    const composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.8,
      0.6,
      0.1,
    );
    composer.addPass(bloomPass);
    return composer;
  }

  private createControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 50;
    controls.maxDistance = 800;
    controls.autoRotate = false;
    return controls;
  }

  private createStarField(): THREE.Points {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 800 + Math.random() * 1200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.7;
      colors[i3] = brightness;
      colors[i3 + 1] = brightness;
      colors[i3 + 2] = brightness * (0.8 + Math.random() * 0.2);
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float uPixelRatio;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = length(c);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, a * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    return new THREE.Points(geo, mat);
  }

  private addLights(): void {
    const ambient = new THREE.AmbientLight(0x111122, 0.3);
    this.scene.add(ambient);
  }

  private addResizeListener(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private handleParamsChange(params: SimParams): void {
    this.galaxyA.setMass(params.massA);
    this.galaxyB.setMass(params.massB);
    reinitializeSimulation(params, PARTICLE_COUNT, this.galaxyA, this.galaxyB, this.simulator);
    this.ui.setTime(0);
    this.savedState = null;
  }

  private handleReset(): void {
    this.simulator.reset();
    this.savedState = null;
  }

  private handlePlayToggle(): void {
  }

  private handlePlaybackSpeed(speed: number): void {
  }

  private handleTimeSeek(targetTime: number): void {
    if (!this.savedState) {
      this.simulator.reset();
    } else {
      this.galaxyA.positions.set(this.savedState.posA);
      this.galaxyA.velocities.set(this.savedState.velA);
      this.galaxyB.positions.set(this.savedState.posB);
      this.galaxyB.velocities.set(this.savedState.velB);
      this.galaxyA.corePosition.copy(this.savedState.corePosA);
      this.galaxyA.coreVelocity.copy(this.savedState.coreVelA);
      this.galaxyB.corePosition.copy(this.savedState.corePosB);
      this.galaxyB.coreVelocity.copy(this.savedState.coreVelB);
      this.simulator.time = this.savedState.time;
    }

    const dt = 0.016;
    const steps = Math.max(0, Math.floor(targetTime / dt));
    for (let i = 0; i < steps; i++) {
      this.simulator.step(dt, this.ui.params.speedMultiplier);
    }

    this.galaxyA.updateGeometry();
    this.galaxyA.updateColorsByVelocity();
    this.galaxyB.updateGeometry();
    this.galaxyB.updateColorsByVelocity();
    this.simulator.updateHeatmap();
  }

  private saveCheckpoint(): void {
    this.savedState = {
      posA: new Float32Array(this.galaxyA.positions),
      velA: new Float32Array(this.galaxyA.velocities),
      posB: new Float32Array(this.galaxyB.positions),
      velB: new Float32Array(this.galaxyB.velocities),
      corePosA: this.galaxyA.corePosition.clone(),
      coreVelA: this.galaxyA.coreVelocity.clone(),
      corePosB: this.galaxyB.corePosition.clone(),
      coreVelB: this.galaxyB.coreVelocity.clone(),
      time: this.simulator.time,
    };
  }

  private animate = (): void => {
    this.frameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.controls.update();

    if (this.ui.isPlaying) {
      const effectiveDelta = delta * this.ui.playbackSpeed;
      this.simulator.step(effectiveDelta, this.ui.params.speedMultiplier);
      this.ui.incrementTime(effectiveDelta);

      this.colorUpdateTimer += delta;
      if (this.colorUpdateTimer > 0.2) {
        this.galaxyA.updateColorsByVelocity();
        this.galaxyB.updateColorsByVelocity();
        this.colorUpdateTimer = 0;
      }

      this.heatmapUpdateTimer += delta;
      if (this.heatmapUpdateTimer > 0.5) {
        this.simulator.updateHeatmap();
        this.heatmapUpdateTimer = 0;
        this.saveCheckpoint();
      }

      const ke = this.simulator.getKineticEnergy();
      const pe = this.simulator.getPotentialEnergy();
      this.ui.updateEnergyDisplay(ke, pe);
    }

    this.composer.render();
  };

  public dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GalaxyApp();
});

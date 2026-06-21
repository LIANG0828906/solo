import * as THREE from 'three';
import { Galaxy } from './galaxy';
import { CollisionSystem } from './collision';
import { UIController, createGalaxiesFromParams } from './ui';

class GalaxyCollisionApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  private galaxy1!: Galaxy;
  private galaxy2!: Galaxy;
  private collisionSystem!: CollisionSystem;
  private uiController: UIController;

  private isPlaying: boolean = false;
  private playbackSpeed: number = 1;
  private simulationTime: number = 0;
  private totalSimulationTime: number = 2;

  private clock: THREE.Clock;
  private starField: THREE.Points;

  private savedStates: { galaxy1: Float32Array; galaxy2: Float32Array; time: number }[] = [];
  private stateRecordInterval: number = 0.02;
  private lastRecordTime: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.002);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 150, 250);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0a1a, 1);
    this.container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();
    this.starField = this.createStarField();
    this.scene.add(this.starField);

    this.addAmbientGlow();

    this.uiController = new UIController();
    this.setupUICallbacks();

    this.createGalaxies();

    this.setupEventListeners();
    this.animate();
  }

  private createStarField(): THREE.Points {
    const starCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      const radius = 800 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const brightness = 0.3 + Math.random() * 0.7;
      const hue = 0.55 + Math.random() * 0.15;
      const color = new THREE.Color().setHSL(hue, 0.3, brightness);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.5 + Math.random() * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false
    });

    return new THREE.Points(geometry, material);
  }

  private addAmbientGlow(): void {
    const glowGeometry = new THREE.SphereGeometry(500, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x1a1a4a) }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity * 0.3);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(glow);
  }

  private createGalaxies(): void {
    if (this.galaxy1) {
      this.scene.remove(this.galaxy1.particles);
      this.galaxy1.dispose();
    }
    if (this.galaxy2) {
      this.scene.remove(this.galaxy2.particles);
      this.galaxy2.dispose();
    }

    const { galaxy1, galaxy2 } = createGalaxiesFromParams(this.uiController.params);
    this.galaxy1 = galaxy1;
    this.galaxy2 = galaxy2;

    this.scene.add(this.galaxy1.particles);
    this.scene.add(this.galaxy2.particles);

    if (this.collisionSystem) {
      this.collisionSystem.setGalaxies(this.galaxy1, this.galaxy2);
    } else {
      this.collisionSystem = new CollisionSystem(this.galaxy1, this.galaxy2);
    }

    this.simulationTime = 0;
    this.savedStates = [];
    this.lastRecordTime = 0;

    this.saveState();

    this.uiController.updateParticleCount(
      this.galaxy1.particleCount + this.galaxy2.particleCount
    );
  }

  private setupUICallbacks(): void {
    this.uiController.onParamsChange = () => {
      this.galaxy1.heatmapIntensity = this.uiController.params.heatmapIntensity;
      this.galaxy2.heatmapIntensity = this.uiController.params.heatmapIntensity;
      
      if (this.isGalaxyStructuralChange()) {
        this.createGalaxies();
      } else {
        this.updateGalaxyParams();
      }
    };

    this.uiController.onPlayPause = (playing: boolean) => {
      this.isPlaying = playing;
      if (playing) {
        this.clock.getDelta();
      }
    };

    this.uiController.onReset = () => {
      this.resetSimulation();
    };

    this.uiController.onTimelineChange = (normalizedTime: number) => {
      this.jumpToState(normalizedTime);
    };

    this.uiController.onSpeedChange = (speed: number) => {
      this.playbackSpeed = speed;
    };
  }

  private isGalaxyStructuralChange(): boolean {
    return (
      this.galaxy1.particleCount !== Math.floor(this.uiController.params.particleCount / 2)
    );
  }

  private updateGalaxyParams(): void {
    const params = this.uiController.params;
    
    this.galaxy1.mass = params.mass1 * 100;
    this.galaxy2.mass = params.mass2 * 100;

    const angleRad = (params.angle * Math.PI) / 180;
    const halfDist = params.distance / 2;

    if (this.simulationTime === 0) {
      this.galaxy1.center.set(-halfDist, 0, 0);
      this.galaxy2.center.set(
        halfDist * Math.cos(angleRad),
        0,
        halfDist * Math.sin(angleRad)
      );

      const relativeVelocity = params.velocity * 20;
      const velAngle = angleRad + Math.PI / 2;

      this.galaxy1.velocity.set(
        relativeVelocity * Math.cos(velAngle) * 0.5,
        0,
        relativeVelocity * Math.sin(velAngle) * 0.3
      );

      this.galaxy2.velocity.set(
        -relativeVelocity * Math.cos(velAngle) * 0.5,
        0,
        -relativeVelocity * Math.sin(velAngle) * 0.3
      );

      this.galaxy1.updateGeometry();
      this.galaxy2.updateGeometry();
    }
  }

  private resetSimulation(): void {
    this.simulationTime = 0;
    this.savedStates = [];
    this.lastRecordTime = 0;
    this.isPlaying = false;
    this.createGalaxies();
  }

  private saveState(): void {
    const state1 = new Float32Array(this.galaxy1.stars.length * 6);
    const state2 = new Float32Array(this.galaxy2.stars.length * 6);

    for (let i = 0; i < this.galaxy1.stars.length; i++) {
      const star = this.galaxy1.stars[i];
      state1[i * 6] = star.position.x;
      state1[i * 6 + 1] = star.position.y;
      state1[i * 6 + 2] = star.position.z;
      state1[i * 6 + 3] = star.velocity.x;
      state1[i * 6 + 4] = star.velocity.y;
      state1[i * 6 + 5] = star.velocity.z;
    }

    for (let i = 0; i < this.galaxy2.stars.length; i++) {
      const star = this.galaxy2.stars[i];
      state2[i * 6] = star.position.x;
      state2[i * 6 + 1] = star.position.y;
      state2[i * 6 + 2] = star.position.z;
      state2[i * 6 + 3] = star.velocity.x;
      state2[i * 6 + 4] = star.velocity.y;
      state2[i * 6 + 5] = star.velocity.z;
    }

    this.savedStates.push({
      galaxy1: state1,
      galaxy2: state2,
      time: this.simulationTime
    });
  }

  private jumpToState(normalizedTime: number): void {
    const targetTime = normalizedTime * this.totalSimulationTime;
    
    let closestIndex = 0;
    let closestDiff = Infinity;
    
    for (let i = 0; i < this.savedStates.length; i++) {
      const diff = Math.abs(this.savedStates[i].time - targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    }

    if (this.savedStates.length > 0 && closestIndex < this.savedStates.length) {
      const state = this.savedStates[closestIndex];
      this.restoreState(state);
      this.simulationTime = state.time;
      this.isPlaying = false;
      this.uiController.isPlaying = false;
      (document.getElementById('play-btn') as HTMLButtonElement).textContent = '▶';
    }
  }

  private restoreState(state: { galaxy1: Float32Array; galaxy2: Float32Array; time: number }): void {
    for (let i = 0; i < this.galaxy1.stars.length; i++) {
      const star = this.galaxy1.stars[i];
      star.position.set(
        state.galaxy1[i * 6],
        state.galaxy1[i * 6 + 1],
        state.galaxy1[i * 6 + 2]
      );
      star.velocity.set(
        state.galaxy1[i * 6 + 3],
        state.galaxy1[i * 6 + 4],
        state.galaxy1[i * 6 + 5]
      );
    }

    for (let i = 0; i < this.galaxy2.stars.length; i++) {
      const star = this.galaxy2.stars[i];
      star.position.set(
        state.galaxy2[i * 6],
        state.galaxy2[i * 6 + 1],
        state.galaxy2[i * 6 + 2]
      );
      star.velocity.set(
        state.galaxy2[i * 6 + 3],
        state.galaxy2[i * 6 + 4],
        state.galaxy2[i * 6 + 5]
      );
    }

    this.galaxy1.updateGeometry();
    this.galaxy2.updateGeometry();
    this.galaxy1.updateHeatmap();
    this.galaxy2.updateHeatmap();
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this));
    this.setupCameraControls();
  }

  private setupCameraControls(): void {
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let spherical = { theta: 0, phi: Math.PI / 3, radius: 300 };
    let target = new THREE.Vector3(0, 0, 0);

    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;

      spherical.theta -= deltaX * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * 0.01));

      previousMouse = { x: e.clientX, y: e.clientY };
      this.updateCameraFromSpherical(spherical, target);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      spherical.radius *= 1 + e.deltaY * 0.001;
      spherical.radius = Math.max(50, Math.min(1000, spherical.radius));
      this.updateCameraFromSpherical(spherical, target);
    }, { passive: false });

    let touchStart: { x: number; y: number } | null = null;
    let initialPinchDistance: number = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      
      if (e.touches.length === 1 && touchStart) {
        const deltaX = e.touches[0].clientX - touchStart.x;
        const deltaY = e.touches[0].clientY - touchStart.y;

        spherical.theta -= deltaX * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + deltaY * 0.01));

        touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.updateCameraFromSpherical(spherical, target);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const scale = initialPinchDistance / distance;
        spherical.radius *= scale;
        spherical.radius = Math.max(50, Math.min(1000, spherical.radius));
        
        initialPinchDistance = distance;
        this.updateCameraFromSpherical(spherical, target);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
      touchStart = null;
    });

    this.updateCameraFromSpherical(spherical, target);
  }

  private updateCameraFromSpherical(
    spherical: { theta: number; phi: number; radius: number },
    target: THREE.Vector3
  ): void {
    this.camera.position.x = target.x + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    this.camera.position.y = target.y + spherical.radius * Math.cos(spherical.phi);
    this.camera.position.z = target.z + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    this.camera.lookAt(target);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this));

    const delta = this.clock.getDelta();

    if (this.isPlaying && this.simulationTime < this.totalSimulationTime) {
      const scaledDelta = delta * this.playbackSpeed;
      
      const steps = Math.ceil(scaledDelta / 0.016);
      const stepDt = scaledDelta / steps;
      
      for (let i = 0; i < steps; i++) {
        this.collisionSystem.update(stepDt);
        this.simulationTime += stepDt;

        if (this.simulationTime - this.lastRecordTime >= this.stateRecordInterval) {
          this.saveState();
          this.lastRecordTime = this.simulationTime;
        }
      }

      const normalizedTime = this.simulationTime / this.totalSimulationTime;
      this.uiController.setTimelineValue(Math.min(normalizedTime, 1));

      if (this.simulationTime >= this.totalSimulationTime) {
        this.isPlaying = false;
        this.uiController.isPlaying = false;
        (document.getElementById('play-btn') as HTMLButtonElement).textContent = '▶';
      }
    }

    this.starField.rotation.y += delta * 0.01;

    const energy = this.collisionSystem.calculateTotalEnergy();
    this.uiController.updateEnergyDisplay(energy.kinetic, energy.potential, energy.total);

    this.uiController.updateFPS();

    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new GalaxyCollisionApp();
});

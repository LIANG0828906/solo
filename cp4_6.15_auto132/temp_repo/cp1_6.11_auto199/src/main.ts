import * as THREE from 'three';
import { Sundial } from './sundial';
import { ConstellationProjection } from './constellation';
import { UIManager, UICallbacks } from './ui';
import {
  clamp,
  randomRange,
  degToRad
} from './utils';

interface CameraControlState {
  theta: number;
  phi: number;
  radius: number;
  targetTheta: number;
  targetPhi: number;
  targetRadius: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
  dampingFactor: number;
}

const STAR_COUNT = 300;
const MIN_RADIUS = 3;
const MAX_RADIUS = 15;
const MIN_PHI = degToRad(5);
const MAX_PHI = degToRad(175);

class App {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private canvas!: HTMLCanvasElement;

  private sundial!: Sundial;
  private constellation!: ConstellationProjection;
  private uiManager!: UIManager;

  private cameraState!: CameraControlState;
  private cameraTarget = new THREE.Vector3(0, 2, 0);

  private stars!: THREE.Points;
  private starBaseOpacity!: Float32Array;
  private starPhases!: Float32Array;
  private starPeriods!: Float32Array;
  private starMaterial!: THREE.PointsMaterial;

  private ambientLight!: THREE.AmbientLight;
  private directionalLight!: THREE.DirectionalLight;
  private hemisphereLight!: THREE.HemisphereLight;

  private clock: THREE.Clock = new THREE.Clock();
  private isDayMode: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    this.canvas = document.getElementById('three-canvas') as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    this.initThree();
    this.initLights();
    this.initCameraControls();
    this.initStars();

    this.sundial = new Sundial();
    this.scene.add(this.sundial.group);

    this.constellation = new ConstellationProjection();
    this.scene.add(this.constellation.group);

    this.initUI();
    this.addEventListeners();
    this.onWindowResize();

    this.animate();
  }

  private initThree(): void {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  private initLights(): void {
    this.ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(this.ambientLight);

    this.hemisphereLight = new THREE.HemisphereLight(0x6B6BFF, 0x303050, 0.4);
    this.scene.add(this.hemisphereLight);

    this.directionalLight = new THREE.DirectionalLight(0xFFFFEE, 0.8);
    this.directionalLight.position.set(5, 10, 7);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 50;
    this.directionalLight.shadow.camera.left = -10;
    this.directionalLight.shadow.camera.right = 10;
    this.directionalLight.shadow.camera.top = 10;
    this.directionalLight.shadow.camera.bottom = -10;
    this.scene.add(this.directionalLight);

    const fillLight = new THREE.DirectionalLight(0x8888FF, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  private initCameraControls(): void {
    this.cameraState = {
      theta: degToRad(45),
      phi: degToRad(60),
      radius: 10,
      targetTheta: degToRad(45),
      targetPhi: degToRad(60),
      targetRadius: 10,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      dampingFactor: 0.85
    };

    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const { theta, phi, radius } = this.cameraState;

    const sinPhi = Math.sin(phi);
    const x = radius * sinPhi * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * sinPhi * Math.sin(theta);

    this.camera.position.set(
      x + this.cameraTarget.x,
      y + this.cameraTarget.y,
      z + this.cameraTarget.z
    );
    this.camera.lookAt(this.cameraTarget);
  }

  private initStars(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    this.starBaseOpacity = new Float32Array(STAR_COUNT);
    this.starPhases = new Float32Array(STAR_COUNT);
    this.starPeriods = new Float32Array(STAR_COUNT);

    const starRadius = 50;

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = starRadius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = starRadius * Math.cos(phi) + 10;
      positions[i * 3 + 2] = starRadius * Math.sin(phi) * Math.sin(theta);

      const starColor = 0.8 + Math.random() * 0.2;
      const colorTint = Math.random();
      colors[i * 3] = starColor * (0.9 + colorTint * 0.1);
      colors[i * 3 + 1] = starColor * (0.85 + (1 - colorTint) * 0.15);
      colors[i * 3 + 2] = starColor;

      this.starBaseOpacity[i] = randomRange(0.2, 1.0);
      this.starPhases[i] = Math.random() * Math.PI * 2;
      this.starPeriods[i] = randomRange(2, 4);
    }

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      'color',
      new THREE.BufferAttribute(colors, 3)
    );

    this.starMaterial = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.stars = new THREE.Points(geometry, this.starMaterial);
    this.scene.add(this.stars);
  }

  private updateStars(time: number): void {
    const opacities = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      const phase = (time / this.starPeriods[i]) * Math.PI * 2 + this.starPhases[i];
      const twinkle = 0.7 + 0.3 * Math.sin(phase);
      opacities[i] = this.starBaseOpacity[i] * twinkle;
    }

    if (this.isDayMode) {
      this.starMaterial.opacity = 0;
    } else {
      this.starMaterial.opacity = 1;
    }
  }

  private initUI(): void {
    const callbacks: UICallbacks = {
      onTimeChange: (hour: number, minute: number) => {
        this.sundial.setTime(hour, minute);
        this.updateSunLightPosition();

        if (this.constellation.isConstellationVisible()) {
          this.constellation.refresh(
            this.sundial.state.currentShichen,
            this.sundial.getDialTopY()
          );
        }

        this.uiManager.updateInfoPanel();
      },
      onConstellationToggle: () => {
        this.constellation.toggleConstellation(
          this.sundial.state.currentShichen,
          this.sundial.getDialTopY()
        );
        this.uiManager.updateInfoPanel();
      },
      onDayNightToggle: () => {
        this.toggleDayNightMode();
      }
    };

    this.uiManager = new UIManager(this.sundial, this.constellation, callbacks);
    this.uiManager.setDefaultSeason();
    this.uiManager.setTimeSliderValue(
      this.sundial.state.currentHour,
      this.sundial.state.currentMinute
    );
    this.updateSunLightPosition();
    this.uiManager.updateInfoPanel();
  }

  private toggleDayNightMode(): void {
    this.isDayMode = this.uiManager.toggleDayNight();
    this.sundial.setDayMode(this.isDayMode);
    this.constellation.setDayMode(this.isDayMode);

    if (this.isDayMode) {
      this.ambientLight.intensity = 0.8;
      this.ambientLight.color.setHex(0xFFFFFF);
      this.directionalLight.intensity = 1.2;
      this.directionalLight.color.setHex(0xFFFFCC);
      this.hemisphereLight.intensity = 0.6;
      this.hemisphereLight.color.setHex(0x87CEEB);
      this.hemisphereLight.groundColor.setHex(0xF0E68C);
      this.renderer.toneMappingExposure = 1.2;
    } else {
      this.ambientLight.intensity = 0.5;
      this.ambientLight.color.setHex(0x404060);
      this.directionalLight.intensity = 0.8;
      this.directionalLight.color.setHex(0xFFFFEE);
      this.hemisphereLight.intensity = 0.4;
      this.hemisphereLight.color.setHex(0x6B6BFF);
      this.hemisphereLight.groundColor.setHex(0x303050);
      this.renderer.toneMappingExposure = 1.0;
    }
  }

  private updateSunLightPosition(): void {
    const solarAngle = this.sundial.calculateSolarAngle();
    const sunHeight = Math.max(
      0.3,
      Math.sin(solarAngle + Math.PI / 2) * 10 + 5
    );

    const sunDistance = 15;
    const sunX = sunDistance * Math.cos(solarAngle);
    const sunZ = sunDistance * Math.sin(solarAngle);

    this.directionalLight.position.set(
      sunX,
      sunHeight,
      sunZ
    );

    if (this.isDayMode) {
      const sunIntensity = 0.8 + 0.4 * Math.max(0, Math.sin(solarAngle + Math.PI / 2));
      this.directionalLight.intensity = sunIntensity;
    }
  }

  private addEventListeners(): void {
    window.addEventListener('resize', () => this.onWindowResize());

    this.canvas.addEventListener('mousedown', (e: MouseEvent) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e: MouseEvent) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());

    this.canvas.addEventListener('touchstart', (e: TouchEvent) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e: TouchEvent) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.onTouchEnd());

    this.canvas.addEventListener('wheel', (e: WheelEvent) => this.onWheel(e), { passive: false });
  }

  private onMouseDown(e: MouseEvent): void {
    this.cameraState.isDragging = true;
    this.cameraState.lastX = e.clientX;
    this.cameraState.lastY = e.clientY;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.cameraState.isDragging) return;

    const deltaX = e.clientX - this.cameraState.lastX;
    const deltaY = e.clientY - this.cameraState.lastY;

    this.cameraState.lastX = e.clientX;
    this.cameraState.lastY = e.clientY;

    const rotationSpeed = 0.005;
    this.cameraState.targetTheta -= deltaX * rotationSpeed;
    this.cameraState.targetPhi -= deltaY * rotationSpeed;

    this.cameraState.targetPhi = clamp(
      this.cameraState.targetPhi,
      MIN_PHI,
      MAX_PHI
    );
  }

  private onMouseUp(): void {
    this.cameraState.isDragging = false;
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.cameraState.isDragging = true;
      this.cameraState.lastX = e.touches[0].clientX;
      this.cameraState.lastY = e.touches[0].clientY;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.cameraState.isDragging || e.touches.length !== 1) return;
    e.preventDefault();

    const deltaX = e.touches[0].clientX - this.cameraState.lastX;
    const deltaY = e.touches[0].clientY - this.cameraState.lastY;

    this.cameraState.lastX = e.touches[0].clientX;
    this.cameraState.lastY = e.touches[0].clientY;

    const rotationSpeed = 0.008;
    this.cameraState.targetTheta -= deltaX * rotationSpeed;
    this.cameraState.targetPhi -= deltaY * rotationSpeed;

    this.cameraState.targetPhi = clamp(
      this.cameraState.targetPhi,
      MIN_PHI,
      MAX_PHI
    );
  }

  private onTouchEnd(): void {
    this.cameraState.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();

    const zoomSpeed = 0.003;
    const delta = e.deltaY * zoomSpeed;
    this.cameraState.targetRadius += delta * this.cameraState.targetRadius * 0.5;

    this.cameraState.targetRadius = clamp(
      this.cameraState.targetRadius,
      MIN_RADIUS,
      MAX_RADIUS
    );
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private updateCameraControls(): void {
    const { dampingFactor } = this.cameraState;
    const lerpFactor = 1 - dampingFactor;

    const thetaDiff = this.cameraState.targetTheta - this.cameraState.theta;
    const phiDiff = this.cameraState.targetPhi - this.cameraState.phi;
    const radiusDiff = this.cameraState.targetRadius - this.cameraState.radius;

    this.cameraState.theta += thetaDiff * lerpFactor;
    this.cameraState.phi += phiDiff * lerpFactor;
    this.cameraState.radius += radiusDiff * lerpFactor;

    this.updateCameraPosition();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.updateCameraControls();
    this.updateStars(elapsedTime);
    this.constellation.update(deltaTime);

    this.renderer.render(this.scene, this.camera);
  };
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    new App();
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
});

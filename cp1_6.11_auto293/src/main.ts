import * as THREE from 'three';
import { WuPengBoat, type BoatInput, type BoatState } from './boat';
import { RiverWater } from './water';
import { ControlPanel } from './ui';

class BoatSimulation {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private boat: WuPengBoat;
  private water: RiverWater;
  private controlPanel: ControlPanel;
  private clock: THREE.Clock;
  private currentInput: BoatInput;
  private currentState: BoatState | null = null;

  private isDragging: boolean = false;
  private previousMouseX: number = 0;
  private previousMouseY: number = 0;
  private targetTheta: number = Math.PI / 4;
  private targetPhi: number = Math.PI / 4;
  private currentTheta: number = Math.PI / 4;
  private currentPhi: number = Math.PI / 4;
  private targetDistance: number = 20;
  private currentDistance: number = 20;
  private minDistance: number = 5;
  private maxDistance: number = 50;
  private shakeIntensity: number = 0;
  private shakeTime: number = 0;

  private frameCount: number = 0;
  private fpsUpdateTime: number = 0;
  private currentFPS: number = 60;

  private animationFrameId: number | null = null;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xA8D5E2);
    this.scene.fog = new THREE.Fog(0xA8D5E2, 50, 150);

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    this.boat = new WuPengBoat();
    this.water = new RiverWater();
    this.controlPanel = new ControlPanel();
    this.clock = new THREE.Clock();

    this.currentInput = this.controlPanel.getState();

    this.setupLighting();
    this.setupEnvironment();
    this.setupEventListeners(container);
    this.setupUI();
    this.updateCameraPosition();

    window.addEventListener('resize', () => this.onResize(container));
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    this.scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x4A90D9, 0.4);
    this.scene.add(hemisphereLight);
  }

  private setupEnvironment(): void {
    this.scene.add(this.boat.group);
    this.scene.add(this.water.group);

    const horizonGeometry = new THREE.SphereGeometry(200, 32, 32);
    const horizonMaterial = new THREE.MeshBasicMaterial({
      color: 0xA8D5E2,
      side: THREE.BackSide
    });
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    this.scene.add(horizon);

    for (let i = 0; i < 30; i++) {
      const reedGroup = this.createReeds();
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 50;
      reedGroup.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      this.scene.add(reedGroup);
    }
  }

  private createReeds(): THREE.Group {
    const group = new THREE.Group();
    const reedCount = 5 + Math.floor(Math.random() * 10);

    for (let i = 0; i < reedCount; i++) {
      const height = 2 + Math.random() * 4;
      const geometry = new THREE.CylinderGeometry(0.05, 0.08, height, 6);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.6, 0.3 + Math.random() * 0.2)
      });
      const reed = new THREE.Mesh(geometry, material);
      reed.position.set(
        (Math.random() - 0.5) * 1.5,
        height / 2,
        (Math.random() - 0.5) * 1.5
      );
      reed.rotation.z = (Math.random() - 0.5) * 0.3;
      group.add(reed);
    }

    return group;
  }

  private setupEventListeners(container: HTMLElement): void {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMouseX;
      const deltaY = e.clientY - this.previousMouseY;

      const rotationSpeed = 0.008;
      this.targetTheta -= deltaX * rotationSpeed;
      this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetPhi + deltaY * rotationSpeed));

      this.previousMouseX = e.clientX;
      this.previousMouseY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomSpeed = 0.0015;
      this.targetDistance = Math.max(
        this.minDistance,
        Math.min(this.maxDistance, this.targetDistance + e.deltaY * zoomSpeed * this.targetDistance)
      );
    }, { passive: false });

    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMouseX = e.touches[0].clientX;
        this.previousMouseY = e.touches[0].clientY;
      }
    });

    canvas.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;

      const deltaX = e.touches[0].clientX - this.previousMouseX;
      const deltaY = e.touches[0].clientY - this.previousMouseY;

      const rotationSpeed = 0.008;
      this.targetTheta -= deltaX * rotationSpeed;
      this.targetPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.targetPhi + deltaY * rotationSpeed));

      this.previousMouseX = e.touches[0].clientX;
      this.previousMouseY = e.touches[0].clientY;
    });

    canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });
  }

  private setupUI(): void {
    this.controlPanel.onChange((input) => {
      this.currentInput = input;
    });
  }

  private updateCameraPosition(): void {
    const boatPos = this.boat.state.position;
    const shakeX = this.shakeIntensity * (Math.random() - 0.5) * 0.5;
    const shakeY = this.shakeIntensity * (Math.random() - 0.5) * 0.5;
    const shakeZ = this.shakeIntensity * (Math.random() - 0.5) * 0.5;

    const x = boatPos.x + this.currentDistance * Math.sin(this.currentPhi) * Math.cos(this.currentTheta) + shakeX;
    const y = boatPos.y + this.currentDistance * Math.cos(this.currentPhi) + 2 + shakeY;
    const z = boatPos.z + this.currentDistance * Math.sin(this.currentPhi) * Math.sin(this.currentTheta) + shakeZ;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(boatPos.x, boatPos.y + 1, boatPos.z);
  }

  private onResize(container: HTMLElement): void {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  private update(deltaTime: number): void {
    this.boat.update(this.currentInput, deltaTime);
    this.currentState = this.boat.getState();
    this.water.update(this.currentState, deltaTime);

    this.controlPanel.updateBoatState(this.currentState);

    const easeFactor = 1 - Math.pow(0.001, deltaTime);
    this.currentTheta += (this.targetTheta - this.currentTheta) * easeFactor;
    this.currentPhi += (this.targetPhi - this.currentPhi) * easeFactor;
    this.currentDistance += (this.targetDistance - this.currentDistance) * easeFactor;

    const rollDegrees = Math.abs(this.currentState.rollAngle) * 180 / Math.PI;
    if (rollDegrees > 20) {
      this.shakeIntensity = Math.min(1, (rollDegrees - 20) / 20);
      this.shakeTime = 0.3;
    }

    if (this.shakeTime > 0) {
      this.shakeTime -= deltaTime;
      if (this.shakeTime <= 0) {
        this.shakeIntensity = 0;
      }
    }

    this.updateCameraPosition();

    this.frameCount++;
    this.fpsUpdateTime += deltaTime;
    if (this.fpsUpdateTime >= 0.5) {
      this.currentFPS = this.frameCount / this.fpsUpdateTime;
      this.controlPanel.updateFPS(this.currentFPS);
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    this.update(deltaTime);
    this.render();
  };

  public start(): void {
    this.clock.start();
    this.animate();
  }

  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public dispose(): void {
    this.stop();
    this.renderer.dispose();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  if (container) {
    const simulation = new BoatSimulation(container);
    simulation.start();
  }
});

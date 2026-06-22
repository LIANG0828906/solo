import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem, type ParticleData } from '../modules/ParticleSystem';
import type { CycloneType } from '../context/AppContext';

export class SceneRenderer {
  private container: HTMLElement;
  private particleSystem: ParticleSystem;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private controls: OrbitControls;
  private referenceCylinder: THREE.Mesh;
  private points: THREE.Points;
  private positionAttribute: THREE.Float32BufferAttribute;
  private colorAttribute: THREE.Float32BufferAttribute;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private isRunning: boolean = false;
  private resetAnimation: {
    active: boolean;
    startTime: number;
    startPosition: THREE.Vector3;
    startTarget: THREE.Vector3;
  } | null = null;

  private static readonly INITIAL_CAMERA_POSITION = new THREE.Vector3(25, 15, 25);
  private static readonly CAMERA_TARGET = new THREE.Vector3(0, 0, 0);
  private static readonly RESET_DURATION = 1500;
  private static readonly MAX_PARTICLES = 5000;

  constructor(container: HTMLElement) {
    this.container = container;
    this.particleSystem = new ParticleSystem();
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0F172A);

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.copy(SceneRenderer.INITIAL_CAMERA_POSITION);
    this.camera.lookAt(SceneRenderer.CAMERA_TARGET);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight, false);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minPolarAngle = Math.PI / 3;
    this.controls.maxPolarAngle = (5 * Math.PI) / 6;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.target.copy(SceneRenderer.CAMERA_TARGET);
    this.controls.update();

    const cylinderGeometry = new THREE.CylinderGeometry(8, 8, 12, 16, 1, true);
    const cylinderMaterial = new THREE.MeshBasicMaterial({
      color: 0x334155,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    this.referenceCylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    this.scene.add(this.referenceCylinder);

    const geometry = new THREE.BufferGeometry();
    this.positionAttribute = new THREE.Float32BufferAttribute(new Float32Array(SceneRenderer.MAX_PARTICLES * 3), 3);
    this.colorAttribute = new THREE.Float32BufferAttribute(new Float32Array(SceneRenderer.MAX_PARTICLES * 3), 3);
    geometry.setAttribute('position', this.positionAttribute);
    geometry.setAttribute('color', this.colorAttribute);
    geometry.setDrawRange(0, this.particleSystem.getActiveCount());

    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);

    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private updateCameraReset(elapsedTime: number): void {
    if (!this.resetAnimation || !this.resetAnimation.active) return;

    const progress = Math.min(elapsedTime / SceneRenderer.RESET_DURATION, 1);

    this.camera.position.lerpVectors(
      this.resetAnimation.startPosition,
      SceneRenderer.INITIAL_CAMERA_POSITION,
      progress
    );

    this.controls.target.lerpVectors(
      this.resetAnimation.startTarget,
      SceneRenderer.CAMERA_TARGET,
      progress
    );

    this.controls.update();

    if (progress >= 1) {
      this.resetAnimation.active = false;
      this.resetAnimation = null;
    }
  }

  private updateParticles(particles: ParticleData[]): void {
    const positions = this.positionAttribute.array as Float32Array;
    const colors = this.colorAttribute.array as Float32Array;

    for (let i = 0; i < particles.length; i++) {
      const i3 = i * 3;
      positions[i3] = particles[i].x;
      positions[i3 + 1] = particles[i].y;
      positions[i3 + 2] = particles[i].z;
      colors[i3] = particles[i].r;
      colors[i3 + 1] = particles[i].g;
      colors[i3 + 2] = particles[i].b;
    }

    this.positionAttribute.needsUpdate = true;
    this.colorAttribute.needsUpdate = true;
    this.points.geometry.setDrawRange(0, particles.length);
  }

  private animate = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const particles = this.particleSystem.update(delta);
    this.updateParticles(particles);

    if (this.resetAnimation && this.resetAnimation.active) {
      const elapsedTime = performance.now() - this.resetAnimation.startTime;
      this.updateCameraReset(elapsedTime);
    } else {
      this.controls.update();
    }

    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  public dispose(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    window.removeEventListener('resize', this.handleResize);

    this.particleSystem.dispose();
    this.controls.dispose();
    (this.referenceCylinder.geometry as THREE.BufferGeometry).dispose();
    (this.referenceCylinder.material as THREE.Material).dispose();
    (this.points.geometry as THREE.BufferGeometry).dispose();
    (this.points.material as THREE.Material).dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  public resetCamera(): void {
    this.resetAnimation = {
      active: true,
      startTime: performance.now(),
      startPosition: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
    };
  }

  public setCycloneType(type: CycloneType): void {
    this.particleSystem.setCycloneType(type);
    const material = this.referenceCylinder.material as THREE.MeshBasicMaterial;
    const baseColor = type === 'cyclone' ? 0x2196F3 : 0xFF5722;
    const darkColor = new THREE.Color(baseColor).multiplyScalar(0.2);
    material.color.copy(darkColor);
  }

  public setWindSpeed(speed: number): void {
    this.particleSystem.setWindSpeed(speed);
  }

  public setDensity(density: number): void {
    this.particleSystem.setDensity(density);
  }
}

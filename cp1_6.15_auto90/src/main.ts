import * as THREE from 'three';
import { MoleculeBuilder } from './MoleculeBuilder';
import { UIManager } from './UIManager';

class MoleculeViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private moleculeBuilder: MoleculeBuilder;
  private uiManager: UIManager;
  private clock: THREE.Clock;
  private particleSystem: THREE.Points;
  private autoRotationAngle: number = 0;

  constructor() {
    const container = document.getElementById('canvas-container')!;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);

    this.setupLighting();
    this.particleSystem = this.createParticles();
    this.scene.add(this.particleSystem);

    this.moleculeBuilder = new MoleculeBuilder();
    this.moleculeBuilder.buildMolecule('h2o');
    this.scene.add(this.moleculeBuilder.getGroup());

    this.uiManager = new UIManager(this.renderer, this.camera, this.moleculeBuilder);
    this.uiManager.setBaseDistance(5);
    this.setupCallbacks();

    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x8888cc, 0.6);
    this.scene.add(ambient);

    const directional1 = new THREE.DirectionalLight(0xffffff, 0.9);
    directional1.position.set(5, 5, 5);
    this.scene.add(directional1);

    const directional2 = new THREE.DirectionalLight(0x4466ff, 0.3);
    directional2.position.set(-5, -3, -5);
    this.scene.add(directional2);

    const point = new THREE.PointLight(0x6644ff, 0.4, 20);
    point.position.set(0, 3, 0);
    this.scene.add(point);
  }

  private createParticles(): THREE.Points {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 5;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const colorMix = Math.random();
      colors[i * 3] = 0.2 + colorMix * 0.2;
      colors[i * 3 + 1] = 0.1 + colorMix * 0.2;
      colors[i * 3 + 2] = 0.6 + colorMix * 0.3;

      sizes[i] = 0.02 + Math.random() * 0.04;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return new THREE.Points(geometry, material);
  }

  private setupCallbacks(): void {
    this.uiManager.setDisplayModeChangeCallback((mode) => {
      this.moleculeBuilder.setDisplayMode(mode);
    });
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.uiManager.updateMoleculeTransition(delta);
    this.moleculeBuilder.updateTransition(delta);
    this.uiManager.updateWeightAnimation(delta);

    if (!this.uiManager.getAutoRotatePaused() && !this.uiManager.isTransitioning()) {
      this.autoRotationAngle += delta * this.uiManager.getRotationSpeed() * Math.PI * 2;
    }

    this.uiManager.updateDragRotation();

    const group = this.moleculeBuilder.getGroup();
    group.rotation.y = this.autoRotationAngle + this.uiManager.getCurrentRotationY();
    group.rotation.x = this.uiManager.getCurrentRotationX();

    this.moleculeBuilder.updateLabelPositions();
    this.uiManager.updateLabelSizes(this.camera);

    this.updateParticles(elapsed);

    this.renderer.render(this.scene, this.camera);
  }

  private updateParticles(elapsed: number): void {
    const positions = this.particleSystem.geometry.attributes.position as THREE.BufferAttribute;
    const arr = positions.array as Float32Array;

    for (let i = 0; i < arr.length / 3; i++) {
      const idx = i * 3;
      const x = arr[idx];
      const y = arr[idx + 1];
      const z = arr[idx + 2];
      const angle = elapsed * 0.05 + i * 0.01;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      arr[idx] = x * cos - z * sin;
      arr[idx + 2] = x * sin + z * cos;
    }

    positions.needsUpdate = true;
    (this.particleSystem.material as THREE.PointsMaterial).opacity = 0.3 + Math.sin(elapsed * 0.5) * 0.15;
  }
}

new MoleculeViewer();

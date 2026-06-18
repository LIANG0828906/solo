import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class VisualEffects {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  public composer!: EffectComposer;
  private bloomPass!: UnrealBloomPass;
  private renderPass!: RenderPass;

  private stars!: THREE.Points;
  private starGeometry!: THREE.BufferGeometry;
  private starMaterial!: THREE.PointsMaterial;

  private bloomStrength: number = 0.2;
  private targetBloomStrength: number = 0.2;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.starGeometry = new THREE.BufferGeometry();
    this.starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8
    });
    this.stars = new THREE.Points(this.starGeometry, this.starMaterial);

    this.initStars();
    this.initPostProcessing();
  }

  private initStars(): void {
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);
    const radius = 200;

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
    }

    this.starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.scene.add(this.stars);
  }

  private initPostProcessing(): void {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);

    this.composer = new EffectComposer(this.renderer);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.bloomStrength,
      0.4,
      0.85
    );
    this.composer.addPass(this.bloomPass);
  }

  update(averageAmplitude: number, deltaTime: number): void {
    this.targetBloomStrength = 0.1 + averageAmplitude * 0.2;
    this.bloomStrength += (this.targetBloomStrength - this.bloomStrength) * deltaTime * 3;
    this.bloomPass.strength = this.bloomStrength;

    this.stars.rotation.y += deltaTime * 0.02;
  }

  render(deltaTime: number): void {
    this.composer.render();
  }

  resize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.resolution = new THREE.Vector2(width, height);
  }

  dispose(): void {
    this.starGeometry.dispose();
    this.starMaterial.dispose();
    this.bloomPass.dispose();
    this.composer.dispose();
  }
}

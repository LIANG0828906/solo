import * as THREE from 'three';
import { StarField } from './starField';
import { Galaxy } from './galaxy';
import { Interaction, PickedStar } from './interaction';
import { UI } from './ui';

class StarfieldApp {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private starField: StarField;
  private galaxy: Galaxy;
  private interaction: Interaction;
  private ui: UI;

  private lastHighlightedIndex: number | null = null;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();

    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 2;
    bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext('2d')!;
    const bgGradient = bgCtx.createLinearGradient(0, 0, 0, 512);
    bgGradient.addColorStop(0, '#1a0a3e');
    bgGradient.addColorStop(0.5, '#0f0826');
    bgGradient.addColorStop(1, '#0a0a2e');
    bgCtx.fillStyle = bgGradient;
    bgCtx.fillRect(0, 0, 2, 512);
    const bgTexture = new THREE.CanvasTexture(bgCanvas);
    this.scene.background = bgTexture;

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    this.camera.position.set(0, 40, 500);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.starField = new StarField(this.scene, 5200);
    this.galaxy = new Galaxy(this.scene);

    this.interaction = new Interaction(
      this.container,
      this.camera,
      this.renderer,
      this.starField.getStarsMesh()
    );

    this.ui = new UI({
      onResetView: () => {
        this.interaction.resetView();
      },
      onToggleAutoRotate: () => {
        return this.interaction.toggleAutoRotate();
      }
    });

    this.ui.setOnHighlightStar((index) => {
      if (this.lastHighlightedIndex !== null) {
        this.starField.resetHighlight(this.lastHighlightedIndex);
      }
      if (index !== null) {
        this.starField.highlightStar(index);
      }
      this.lastHighlightedIndex = index;
    });

    this.interaction.onStarClick((picked: PickedStar | null) => {
      if (picked) {
        const starData = picked.starData;

        const vector = picked.point.clone();
        vector.project(this.camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

        this.ui.showStarInfo(starData, x, y, picked.index);
      } else {
        this.ui.hideStarInfo();
      }
    });

    this.animate();
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const currentTime = performance.now();

    this.starField.update(this.camera, deltaTime);
    this.galaxy.update(deltaTime);
    this.interaction.update();

    this.ui.updateFPS(currentTime);

    this.renderer.render(this.scene, this.camera);
  }

  public dispose(): void {
    this.starField.dispose();
    this.galaxy.dispose();
    this.interaction.dispose();
    this.ui.dispose();
    this.renderer.dispose();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new StarfieldApp();
});

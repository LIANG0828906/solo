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
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      3000
    );
    this.camera.position.set(0, 40, 500);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0a2e, 1);
    this.container.appendChild(this.renderer.domElement);

    this.setupBackground();

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

  private setupBackground(): void {
    const bgGeometry = new THREE.SphereGeometry(1400, 64, 64);
    const bgMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x1a0a3e) },
        bottomColor: { value: new THREE.Color(0x0a0a2e) },
        offset: { value: 300 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        }

        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float t = max(pow(max(h, 0.0), exponent), 0.0);
          vec3 color = mix(bottomColor, topColor, t);

          float n = noise(vWorldPosition * 0.001) * 0.05;
          color += n;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    this.scene.add(bgMesh);

    const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
    this.scene.add(ambientLight);
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

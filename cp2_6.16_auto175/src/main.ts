import * as THREE from 'three';
import { Renderer } from './renderer';
import { ParticleSystem } from './particleSystem';
import { FieldController } from './fieldController';
import { CameraState, DEFAULT_FIELD_PARAMS } from './types';

class VortexFieldApp {
  private renderer: Renderer;
  private particleSystem: ParticleSystem;
  private fieldController: FieldController;
  private container: HTMLElement;
  private cameraState: CameraState = {
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    distance: 20,
    isRotating: false,
    lastMouseX: 0,
    lastMouseY: 0
  };
  private paused = false;
  private clock = new THREE.Clock();
  private mouseNDC = new THREE.Vector2(-999, -999);
  private hoveredParticleId: number | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    this.container = document.getElementById('canvas-container')!;
    this.renderer = new Renderer(this.container);
    this.particleSystem = new ParticleSystem();
    this.fieldController = new FieldController(this.container, (params) => {
      this.particleSystem.setParams(params);
    });

    this.particleSystem.setParams({
      magneticFieldStrength: DEFAULT_FIELD_PARAMS.magneticFieldStrength,
      particleCount: DEFAULT_FIELD_PARAMS.particleCount,
      emissionSpeed: DEFAULT_FIELD_PARAMS.emissionSpeed
    });

    this.setupEventListeners();
    this.updateCamera();
    this.animate();
  }

  private setupEventListeners() {
    const canvas = this.renderer.webglRenderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.cameraState.isRotating = true;
        this.cameraState.lastMouseX = e.clientX;
        this.cameraState.lastMouseY = e.clientY;
        this.renderer.showCrosshair(true);
      }
    });

    window.addEventListener('mouseup', () => {
      this.cameraState.isRotating = false;
      this.renderer.showCrosshair(false);
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (this.cameraState.isRotating) {
        const dx = e.clientX - this.cameraState.lastMouseX;
        const dy = e.clientY - this.cameraState.lastMouseY;
        this.cameraState.theta -= dx * 0.005;
        this.cameraState.phi -= dy * 0.005;

        this.cameraState.theta = this.cameraState.theta % (Math.PI * 2);
        if (this.cameraState.theta < 0) this.cameraState.theta += Math.PI * 2;

        this.cameraState.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.cameraState.phi));

        this.cameraState.lastMouseX = e.clientX;
        this.cameraState.lastMouseY = e.clientY;
        this.updateCamera();
      }
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraState.distance += e.deltaY * 0.02;
      this.cameraState.distance = Math.max(5, Math.min(30, this.cameraState.distance));
      this.updateCamera();
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.paused = !this.paused;
      }
    });

    window.addEventListener('resize', () => {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.renderer.resize(width, height);
    });
  }

  private updateCamera() {
    this.renderer.updateCamera(
      this.cameraState.theta,
      this.cameraState.phi,
      this.cameraState.distance
    );
  }

  private checkHover() {
    const hovered = this.particleSystem.getParticleAtScreenPos(
      this.mouseNDC,
      this.renderer.camera,
      0.5
    );

    for (const p of this.particleSystem.particles) {
      p.highlight = false;
    }

    if (hovered) {
      hovered.highlight = true;

      const vector = hovered.position.clone().project(this.renderer.camera);
      const rect = this.renderer.webglRenderer.domElement.getBoundingClientRect();
      const x = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
      const y = (-vector.y * 0.5 + 0.5) * rect.height + rect.top;

      this.fieldController.showTooltip(hovered, x, y);
      this.hoveredParticleId = hovered.id;
    } else {
      this.fieldController.hideTooltip();
      this.hoveredParticleId = null;
    }
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    if (!this.paused) {
      this.particleSystem.update(delta);
    }

    this.checkHover();
    this.renderer.updateParticles(this.particleSystem.particles);
    this.renderer.updateFieldFlow(this.clock.elapsedTime);

    const stats = this.particleSystem.getStats();
    this.fieldController.updateStats(stats);

    this.renderer.render();
  };
}

new VortexFieldApp();

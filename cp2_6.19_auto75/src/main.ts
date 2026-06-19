import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';
import { UIControls } from './uiControls';
import type { ColorMode } from './types';

class App {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private particleSystem!: ParticleSystem;
  private uiControls!: UIControls;
  private clock: THREE.Clock;
  private isMouseDown: boolean = false;
  private mousePosition: THREE.Vector3 = new THREE.Vector3();
  private isDragging: boolean = false;
  private dragStart: { x: number; y: number; time: number } = { x: 0, y: 0, time: 0 };
  private animationId: number = 0;

  constructor() {
    this.canvas = document.getElementById('scene-canvas') as HTMLCanvasElement;
    this.clock = new THREE.Clock();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 15);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.init();
  }

  private init(): void {
    this.particleSystem = new ParticleSystem(this.scene);

    this.uiControls = new UIControls({
      onParticleCountChange: (count: number) => {
        this.particleSystem.setParticleCount(count);
      },
      onVortexSpeedChange: (speed: number) => {
        this.particleSystem.setVortexSpeed(speed);
      },
      onSpringStrengthChange: (strength: number) => {
        this.particleSystem.setSpringStrength(strength);
      },
      onColorModeChange: (mode: ColorMode) => {
        this.particleSystem.setColorMode(mode);
      },
      onPresetChange: (preset: string) => {
        this.particleSystem.applyPreset(preset);
      },
      onShowParticleHalo: (particleIndex: number) => {
        this.particleSystem.showParticleHalo(particleIndex);
      },
      onHideParticleHalo: (particleIndex: number) => {
        this.particleSystem.hideParticleHalo(particleIndex);
      }
    });

    this.bindEvents();
    this.animate();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.onWindowResize());

    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('click', (e) => this.onClick(e));

    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('touchend', () => this.onTouchEnd());
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    const ndcX = (clientX / window.innerWidth) * 2 - 1;
    const ndcY = -(clientY / window.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
    vector.unproject(this.camera);

    const dir = vector.sub(this.camera.position).normalize();
    const distance = -this.camera.position.z / dir.z;
    const pos = this.camera.position.clone().add(dir.multiplyScalar(distance));

    this.mousePosition.copy(pos);
  }

  private onMouseDown(e: MouseEvent): void {
    this.isMouseDown = true;
    this.isDragging = false;
    this.dragStart = { x: e.clientX, y: e.clientY, time: Date.now() };
    this.updateMousePosition(e.clientX, e.clientY);
  }

  private onMouseMove(e: MouseEvent): void {
    this.updateMousePosition(e.clientX, e.clientY);

    if (this.isMouseDown) {
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5 || Date.now() - this.dragStart.time > 200) {
        this.isDragging = true;
      }
    }
  }

  private onMouseUp(): void {
    this.isMouseDown = false;
  }

  private onClick(e: MouseEvent): void {
    if (this.isDragging) return;

    const particleIndex = this.particleSystem.getParticleAtScreenPoint(
      e.clientX,
      e.clientY,
      this.camera,
      window.innerWidth,
      window.innerHeight
    );

    if (particleIndex !== null) {
      const position = this.particleSystem.getParticleWorldPosition(particleIndex);
      const velocity = this.particleSystem.getParticleVelocity(particleIndex);

      if (position && velocity) {
        const screenPos = this.particleSystem.projectToScreen(
          position,
          this.camera,
          window.innerWidth,
          window.innerHeight
        );

        this.uiControls.showTooltip(
          particleIndex,
          screenPos.x,
          screenPos.y,
          { x: position.x, y: position.y, z: position.z },
          { x: velocity.x, y: velocity.y, z: velocity.z }
        );
      }
    }
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.isMouseDown = true;
      this.isDragging = false;
      this.dragStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      this.updateMousePosition(touch.clientX, touch.clientY);
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.updateMousePosition(touch.clientX, touch.clientY);

      if (this.isMouseDown) {
        const dx = touch.clientX - this.dragStart.x;
        const dy = touch.clientY - this.dragStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 10 || Date.now() - this.dragStart.time > 200) {
          this.isDragging = true;
        }
      }
    }
  }

  private onTouchEnd(): void {
    this.isMouseDown = false;
  }

  private animate(): void {
    this.animationId = requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);

    const force = this.isMouseDown && this.isDragging ? this.mousePosition : undefined;
    this.particleSystem.update(delta, force);

    this.updateTooltips();

    this.renderer.render(this.scene, this.camera);
  }

  private updateTooltips(): void {
    const activeParticles = this.uiControls.getActiveTooltipParticles();

    activeParticles.forEach((particleIndex) => {
      const position = this.particleSystem.getParticleWorldPosition(particleIndex);
      if (position) {
        const screenPos = this.particleSystem.projectToScreen(
          position,
          this.camera,
          window.innerWidth,
          window.innerHeight
        );
        this.uiControls.updateTooltipPosition(particleIndex, screenPos.x, screenPos.y);
      }
    });
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationId);
    this.particleSystem.dispose();
    this.renderer.dispose();
  }
}

const app = new App();

window.addEventListener('beforeunload', () => {
  app.dispose();
});

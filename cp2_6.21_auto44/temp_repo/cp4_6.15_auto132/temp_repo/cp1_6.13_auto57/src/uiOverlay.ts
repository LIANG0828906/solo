import * as THREE from 'three';
import { ForceManager, ForceFieldType } from './forceManager';
import { ParticleSystem } from './particleSystem';

interface UIOverlayOptions {
  container: HTMLElement;
  camera: THREE.PerspectiveCamera;
  forceManager: ForceManager;
  particleSystem: ParticleSystem;
}

const MODE_TEXT: Record<ForceFieldType, string> = {
  attract: '吸引力场激活',
  repel: '排斥力场激活',
  spiral: '螺旋力场激活',
};

const MODE_LABEL: Record<ForceFieldType, string> = {
  attract: '吸引',
  repel: '排斥',
  spiral: '螺旋',
};

export class UIOverlay {
  private container: HTMLElement;
  private camera: THREE.PerspectiveCamera;
  private forceManager: ForceManager;
  private particleSystem: ParticleSystem;

  private hudElement: HTMLDivElement;
  private particleCountEl: HTMLSpanElement;
  private forceModeEl: HTMLSpanElement;
  private fpsEl: HTMLSpanElement;

  private toastEl: HTMLDivElement;
  private toastTimer: number = 0;

  private isRightDragging: boolean = false;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private lastFpsUpdate: number = 0;
  private frameCount: number = 0;
  private currentFps: number = 0;

  private plane: THREE.Plane;

  constructor(options: UIOverlayOptions) {
    this.container = options.container;
    this.camera = options.camera;
    this.forceManager = options.forceManager;
    this.particleSystem = options.particleSystem;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.hudElement = this.createHUD();
    this.toastEl = this.createToast();

    this.particleCountEl = this.hudElement.querySelector(
      '.particle-count',
    ) as HTMLSpanElement;
    this.forceModeEl = this.hudElement.querySelector(
      '.force-mode',
    ) as HTMLSpanElement;
    this.fpsEl = this.hudElement.querySelector('.fps') as HTMLSpanElement;

    this.bindEvents();
    this.updateHUD();
  }

  private createHUD(): HTMLDivElement {
    const hud = document.createElement('div');
    hud.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: rgba(255, 255, 255, 0.75);
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 13px;
      line-height: 1.8;
      pointer-events: none;
      z-index: 100;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
    `;
    hud.innerHTML = `
      <div>粒子数量: <span class="particle-count" style="color: rgba(255,255,255,0.9)">10000</span></div>
      <div>力场模式: <span class="force-mode" style="color: #00ff66">吸引</span></div>
      <div>FPS: <span class="fps" style="color: rgba(255,255,255,0.9)">60</span></div>
    `;
    this.container.appendChild(hud);
    return hud;
  }

  private createToast(): HTMLDivElement {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 30vh;
      left: 50%;
      transform: translateX(-50%) translateY(30px);
      color: rgba(255, 255, 255, 0);
      font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      font-size: 20px;
      font-weight: 300;
      letter-spacing: 4px;
      pointer-events: none;
      z-index: 100;
      text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
      transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), color 0.6s ease;
      opacity: 0;
    `;
    toast.textContent = '';
    this.container.appendChild(toast);
    return toast;
  }

  private bindEvents(): void {
    const canvas = this.container.querySelector('canvas');
    const target = canvas || this.container;

    target.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    target.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    if (e.button === 0) {
      const worldPos = this.getWorldPosition(e);
      if (worldPos) {
        if (this.forceManager.currentMode === 'spiral') {
          this.forceManager.startSpiral(worldPos);
          this.isRightDragging = true;
        } else {
          this.forceManager.addPointForce(worldPos);
        }
      }
    } else if (e.button === 2) {
      e.preventDefault();
      const worldPos = this.getWorldPosition(e);
      if (worldPos) {
        this.forceManager.startSpiral(worldPos);
        this.isRightDragging = true;
      }
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (e.button === 2 && this.isRightDragging) {
      this.forceManager.endSpiral();
      this.isRightDragging = false;
    }
    if (e.button === 0 && this.forceManager.currentMode === 'spiral' && this.isRightDragging) {
      this.forceManager.endSpiral();
      this.isRightDragging = false;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isRightDragging) {
      const worldPos = this.getWorldPosition(e);
      if (worldPos) {
        const toSpawn = this.forceManager.updateSpiral(worldPos, 1 / 60);
        if (toSpawn > 0) {
          const spawnPos = this.forceManager.getSpiralSpawnPosition();
          if (spawnPos) {
            this.particleSystem.addParticles(spawnPos, Math.min(toSpawn, 5));
          }
        }
      }
    }
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 5 : -5;
    const fov = this.camera.fov + delta;
    this.camera.fov = Math.max(30, Math.min(100, fov));
    this.camera.updateProjectionMatrix();
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === '1') {
      this.switchMode('attract');
    } else if (e.key === '2') {
      this.switchMode('repel');
    } else if (e.key === '3') {
      this.switchMode('spiral');
    }
  }

  private switchMode(mode: ForceFieldType): void {
    this.forceManager.setMode(mode);
    this.showToast(MODE_TEXT[mode], mode);
    this.updateHUD();
  }

  private showToast(text: string, mode: ForceFieldType): void {
    const colors: Record<ForceFieldType, string> = {
      attract: 'rgba(0, 255, 102, 0.9)',
      repel: 'rgba(255, 51, 68, 0.9)',
      spiral: 'rgba(51, 153, 255, 0.9)',
    };

    this.toastEl.textContent = text;
    this.toastEl.style.color = colors[mode];
    this.toastEl.style.opacity = '1';
    this.toastEl.style.transform = 'translateX(-50%) translateY(0)';

    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.style.opacity = '0';
      this.toastEl.style.transform = 'translateX(-50%) translateY(-20px)';
    }, 2000);
  }

  private getWorldPosition(e: MouseEvent): THREE.Vector3 | null {
    const rect = (
      e.currentTarget as HTMLElement
    ).getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const target = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.plane, target)) {
      return target;
    }
    return null;
  }

  public update(dt: number): void {
    this.frameCount++;
    this.lastFpsUpdate += dt;

    if (this.lastFpsUpdate >= 1) {
      this.currentFps = Math.round(this.frameCount / this.lastFpsUpdate);
      this.frameCount = 0;
      this.lastFpsUpdate = 0;
      this.updateHUD();
    }
  }

  private updateHUD(): void {
    this.particleCountEl.textContent = String(this.particleSystem.getParticleCount());
    const mode = this.forceManager.currentMode;
    this.forceModeEl.textContent = MODE_LABEL[mode];

    const colors: Record<ForceFieldType, string> = {
      attract: '#00ff66',
      repel: '#ff3344',
      spiral: '#3399ff',
    };
    this.forceModeEl.style.color = colors[mode];

    this.fpsEl.textContent = String(this.currentFps || 60);
  }

  public updatePlaneFromCamera(): void {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.plane.normal.copy(dir).negate();
    this.plane.constant = 0;
  }

  public dispose(): void {
    window.clearTimeout(this.toastTimer);
  }
}

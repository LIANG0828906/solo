import * as THREE from 'three';
import { Nebula, ColorTheme } from './nebula';
import { CameraControls } from './controls';
import './style.css';

class NebulaApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private nebula: Nebula;
  private controls: CameraControls;
  private clock: THREE.Clock;
  private canvas: HTMLCanvasElement;

  private loadingOverlay: HTMLElement;
  private loadingBar: HTMLElement;
  private controlPanel: HTMLElement;
  private panelToggle: HTMLElement;
  private panelClose: HTMLElement;

  private particleCountSlider: HTMLInputElement;
  private rotationSpeedSlider: HTMLInputElement;
  private countValue: HTMLElement;
  private speedValue: HTMLElement;
  private themeButtons: NodeListOf<HTMLElement>;

  private countAnimationTimer: number | null = null;
  private speedAnimationTimer: number | null = null;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.loadingOverlay = document.getElementById('loading-overlay') as HTMLElement;
    this.loadingBar = document.getElementById('loading-bar') as HTMLElement;
    this.controlPanel = document.getElementById('control-panel') as HTMLElement;
    this.panelToggle = document.getElementById('panel-toggle') as HTMLElement;
    this.panelClose = document.getElementById('panel-close') as HTMLElement;

    this.particleCountSlider = document.getElementById('particle-count') as HTMLInputElement;
    this.rotationSpeedSlider = document.getElementById('rotation-speed') as HTMLInputElement;
    this.countValue = document.getElementById('count-value') as HTMLElement;
    this.speedValue = document.getElementById('speed-value') as HTMLElement;
    this.themeButtons = document.querySelectorAll('.theme-btn');

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 50, 280);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0a0a1a, 1);

    this.clock = new THREE.Clock();

    this.nebula = new Nebula(7500);
    this.scene.add(this.nebula.points);

    this.controls = new CameraControls(this.camera, this.canvas);
    this.controls.onMouseMove((worldPos, isOver) => {
      this.nebula.setMousePosition(worldPos, isOver);
    });

    this.setupUI();
    this.setupResizeHandler();
    this.simulateLoading();
  }

  private triggerValueAnimation(element: HTMLElement, timerKey: 'count' | 'speed'): void {
    element.classList.remove('value-changed');
    void element.offsetWidth;
    element.classList.add('value-changed');

    if (timerKey === 'count') {
      if (this.countAnimationTimer !== null) {
        window.clearTimeout(this.countAnimationTimer);
      }
      this.countAnimationTimer = window.setTimeout(() => {
        element.classList.remove('value-changed');
        this.countAnimationTimer = null;
      }, 300);
    } else {
      if (this.speedAnimationTimer !== null) {
        window.clearTimeout(this.speedAnimationTimer);
      }
      this.speedAnimationTimer = window.setTimeout(() => {
        element.classList.remove('value-changed');
        this.speedAnimationTimer = null;
      }, 300);
    }
  }

  private simulateLoading(): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        this.loadingBar.style.width = '100%';
        setTimeout(() => {
          this.loadingOverlay.classList.add('fade-out');
          setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
          }, 500);
        }, 200);
      } else {
        this.loadingBar.style.width = `${progress}%`;
      }
    }, 80);
  }

  private setupUI(): void {
    this.panelClose.addEventListener('click', () => {
      this.controlPanel.classList.add('hidden');
      this.panelToggle.classList.add('pulse');
    });

    this.panelToggle.addEventListener('click', () => {
      this.controlPanel.classList.remove('hidden');
      this.panelToggle.classList.remove('pulse');
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes value-pop {
        0% { transform: scale(1); color: #6c63ff; }
        50% { transform: scale(1.3); color: #ff6584; }
        100% { transform: scale(1); color: #ff6584; }
      }
      .control-group label span.value-changed {
        display: inline-block;
        animation: value-pop 0.3s ease-out forwards;
        text-shadow: 0 0 10px rgba(255, 101, 132, 0.6);
      }
    `;
    document.head.appendChild(style);

    this.particleCountSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const count = parseInt(target.value, 10);
      this.countValue.textContent = count.toString();
      this.triggerValueAnimation(this.countValue, 'count');
      this.nebula.setParticleCount(count);
    });

    this.rotationSpeedSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const speed = parseFloat(target.value);
      this.speedValue.textContent = speed.toFixed(1);
      this.triggerValueAnimation(this.speedValue, 'speed');
      this.nebula.setRotationSpeed(speed);
    });

    this.themeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.themeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.getAttribute('data-theme') as ColorTheme;
        this.nebula.setColorTheme(theme);
      });
    });
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const deltaTime = Math.min(this.clock.getDelta(), 0.1);

    this.controls.update();
    this.nebula.update(deltaTime);

    this.renderer.render(this.scene, this.camera);
  };

  public start(): void {
    this.animate();
  }

  public dispose(): void {
    this.controls.dispose();
    this.nebula.dispose();
    this.renderer.dispose();
  }
}

const app = new NebulaApp();
app.start();

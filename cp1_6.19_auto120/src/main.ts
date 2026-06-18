import './styles.css';
import { ParticleSystem } from './particleSystem';
import { RippleSystem } from './rippleSystem';
import { AudioEngine, getKeyZone } from './audioEngine';
import { ControlPanel, type ControlPanelState } from './controlPanel';

const VISUALIZER_SIZE = 560;
const VISUALIZER_RADIUS = 280;

interface ResetAnimation {
  active: boolean;
  startTime: number;
}

class KeyboardVisualizer {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particleSystem: ParticleSystem;
  private rippleSystem: RippleSystem;
  private audioEngine: AudioEngine;
  private controlPanel: ControlPanel;
  private state: ControlPanelState;
  private animationId: number | null = null;
  private resetAnimation: ResetAnimation = { active: false, startTime: 0 };

  constructor(appContainer: HTMLElement) {
    this.container = appContainer;
    this.state = { audioEnabled: true, particleCount: 32 };
    this.audioEngine = new AudioEngine();
    this.controlPanel = new ControlPanel();

    const centerX = VISUALIZER_SIZE / 2;
    const centerY = VISUALIZER_SIZE / 2;

    this.particleSystem = new ParticleSystem(centerX, centerY);
    this.rippleSystem = new RippleSystem();

    this.canvas = document.createElement('canvas');
    this.canvas.width = VISUALIZER_SIZE;
    this.canvas.height = VISUALIZER_SIZE;
    this.canvas.className = 'visualizer-canvas';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;

    this.setupUI();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  private setupUI(): void {
    const visualizerContainer = document.createElement('div');
    visualizerContainer.className = 'visualizer-container';

    const border = document.createElement('div');
    border.className = 'visualizer-border';

    const scanlines = document.createElement('div');
    scanlines.className = 'scanlines';

    visualizerContainer.appendChild(border);
    visualizerContainer.appendChild(this.canvas);
    visualizerContainer.appendChild(scanlines);

    this.container.appendChild(visualizerContainer);
    this.container.appendChild(this.controlPanel.getElement());

    this.controlPanel.setOnStateChange((state) => {
      this.state = state;
      this.audioEngine.setEnabled(state.audioEnabled);
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerReset();
        return;
      }

      if (e.key.length !== 1) return;

      const zone = getKeyZone(e.key);
      if (zone === 'other') return;

      this.particleSystem.emit(this.state.particleCount, zone);
      this.rippleSystem.emit(VISUALIZER_SIZE / 2, VISUALIZER_SIZE / 2);
      this.audioEngine.playNote(zone);
    });
  }

  private triggerReset(): void {
    this.particleSystem.clearAll();
    this.resetAnimation = {
      active: true,
      startTime: performance.now()
    };
  }

  private renderResetAnimation(): void {
    if (!this.resetAnimation.active) return;

    const now = performance.now();
    const elapsed = (now - this.resetAnimation.startTime) / 1000;

    if (elapsed > 0.8) {
      this.resetAnimation.active = false;
      return;
    }

    const centerX = VISUALIZER_SIZE / 2;
    const centerY = VISUALIZER_SIZE / 2;

    if (elapsed < 0.3) {
      return;
    }

    const glowElapsed = elapsed - 0.3;
    const glowProgress = Math.min(glowElapsed / 0.5, 1);
    const easedProgress = 1 - Math.pow(1 - glowProgress, 3);

    const glowRadius = 3 + easedProgress * VISUALIZER_RADIUS;
    const alpha = (1 - easedProgress) * 0.8;

    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, glowRadius
    );
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(108, 99, 255, ${alpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  private render(): void {
    this.ctx.clearRect(0, 0, VISUALIZER_SIZE, VISUALIZER_SIZE);

    this.rippleSystem.render(this.ctx);
    this.particleSystem.render(this.ctx);
    this.renderResetAnimation();
  }

  private update(): void {
    this.particleSystem.update();
    this.rippleSystem.update();
  }

  private startAnimationLoop(): void {
    const loop = () => {
      this.update();
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  destroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

function initApp(): void {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App container not found');
    return;
  }
  new KeyboardVisualizer(app);
}

initApp();

import { PhysicsEngine } from '../utils/PhysicsEngine';
import { Ball } from '../entity/Ball';

const COLORS = [
  { name: '红', value: '#E74C3C' },
  { name: '蓝', value: '#3498DB' },
  { name: '绿', value: '#2ECC71' },
  { name: '黄', value: '#F1C40F' },
  { name: '紫', value: '#9B59B6' },
  { name: '橙', value: '#E67E22' },
];

export interface PanelCallbacks {
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetAll: () => void;
  onTogglePrediction: () => void;
  onGravityChange: (value: number) => void;
  onDragChange: (value: number) => void;
  onPredictDurationChange: (value: number) => void;
}

export class PanelManager {
  public selectedColor: string = COLORS[0].value;
  public selectedRadius: number = 20;
  private callbacks: PanelCallbacks;
  private physicsEngine: PhysicsEngine;

  private radiusSlider!: HTMLInputElement;
  private radiusValue!: HTMLSpanElement;
  private gravitySlider!: HTMLInputElement;
  private gravityValue!: HTMLSpanElement;
  private dragSlider!: HTMLInputElement;
  private dragValue!: HTMLSpanElement;
  private predictSlider!: HTMLInputElement;
  private predictValue!: HTMLSpanElement;
  private startBtn!: HTMLButtonElement;
  private predictBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private statusText!: HTMLDivElement;
  private colorButtons: HTMLButtonElement[] = [];

  constructor(physicsEngine: PhysicsEngine, callbacks: PanelCallbacks) {
    this.physicsEngine = physicsEngine;
    this.callbacks = callbacks;
    this.init();
  }

  private init(): void {
    this.initColorGrid();
    this.initRadiusSlider();
    this.initGravitySlider();
    this.initDragSlider();
    this.initPredictSlider();
    this.initActionButtons();
    this.initStatusText();
  }

  private updateSliderProgress(slider: HTMLInputElement): void {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const value = parseFloat(slider.value);
    const progress = ((value - min) / (max - min)) * 100;
    slider.style.setProperty('--progress', `${progress}%`);
  }

  private initColorGrid(): void {
    const grid = document.getElementById('colorGrid');
    if (!grid) return;

    COLORS.forEach((color, index) => {
      const btn = document.createElement('button');
      btn.className = 'color-btn';
      btn.title = color.name;
      if (index === 0) btn.classList.add('active');

      const dot = document.createElement('div');
      dot.className = 'color-dot';
      dot.style.backgroundColor = color.value;
      btn.appendChild(dot);

      btn.addEventListener('click', () => {
        this.selectedColor = color.value;
        this.colorButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });

      this.colorButtons.push(btn);
      grid.appendChild(btn);
    });
  }

  private initRadiusSlider(): void {
    this.radiusSlider = document.getElementById('radiusSlider') as HTMLInputElement;
    this.radiusValue = document.getElementById('radiusValue') as HTMLSpanElement;

    if (this.radiusSlider && this.radiusValue) {
      this.updateSliderProgress(this.radiusSlider);
      this.radiusSlider.addEventListener('input', () => {
        this.selectedRadius = parseInt(this.radiusSlider.value, 10);
        this.radiusValue.textContent = `${this.selectedRadius}px`;
        this.updateSliderProgress(this.radiusSlider);
      });
    }
  }

  private initGravitySlider(): void {
    this.gravitySlider = document.getElementById('gravitySlider') as HTMLInputElement;
    this.gravityValue = document.getElementById('gravityValue') as HTMLSpanElement;

    if (this.gravitySlider && this.gravityValue) {
      this.updateSliderProgress(this.gravitySlider);
      this.gravitySlider.addEventListener('input', () => {
        const value = parseFloat(this.gravitySlider.value);
        this.gravityValue.textContent = value.toFixed(1);
        this.callbacks.onGravityChange(value);
        this.updateSliderProgress(this.gravitySlider);
      });
    }
  }

  private initDragSlider(): void {
    this.dragSlider = document.getElementById('dragSlider') as HTMLInputElement;
    this.dragValue = document.getElementById('dragValue') as HTMLSpanElement;

    if (this.dragSlider && this.dragValue) {
      this.updateSliderProgress(this.dragSlider);
      this.dragSlider.addEventListener('input', () => {
        const value = parseFloat(this.dragSlider.value);
        this.dragValue.textContent = value.toFixed(3);
        this.callbacks.onDragChange(value);
        this.updateSliderProgress(this.dragSlider);
      });
    }
  }

  private initPredictSlider(): void {
    this.predictSlider = document.getElementById('predictSlider') as HTMLInputElement;
    this.predictValue = document.getElementById('predictValue') as HTMLSpanElement;

    if (this.predictSlider && this.predictValue) {
      this.updateSliderProgress(this.predictSlider);
      this.predictSlider.addEventListener('input', () => {
        const value = parseFloat(this.predictSlider.value);
        this.predictValue.textContent = value.toFixed(1);
        this.callbacks.onPredictDurationChange(value);
        this.updateSliderProgress(this.predictSlider);
      });
    }
  }

  private initActionButtons(): void {
    this.startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    this.predictBtn = document.getElementById('predictBtn') as HTMLButtonElement;
    this.resetBtn = document.getElementById('resetBtn') as HTMLButtonElement;

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        if (this.physicsEngine.isSimulating) {
          this.callbacks.onPauseSimulation();
          this.startBtn.textContent = '开始模拟';
          this.startBtn.classList.remove('active');
        } else {
          this.callbacks.onStartSimulation();
          this.startBtn.textContent = '暂停模拟';
          this.startBtn.classList.add('active');
        }
      });
    }

    if (this.predictBtn) {
      this.predictBtn.addEventListener('click', () => {
        this.callbacks.onTogglePrediction();
        if (this.physicsEngine.isPredicting) {
          this.predictBtn.textContent = '关闭预测';
          this.predictBtn.classList.add('predict-active');
        } else {
          this.predictBtn.textContent = '轨迹预测';
          this.predictBtn.classList.remove('predict-active');
        }
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.callbacks.onResetAll();
      });
    }
  }

  private initStatusText(): void {
    this.statusText = document.getElementById('statusText') as HTMLDivElement;
  }

  public updateStatus(fps: number): void {
    if (!this.statusText) return;
    const status = this.physicsEngine.isSimulating ? '运行中' : '就绪';
    const ballCount = this.physicsEngine.balls.length;
    this.statusText.innerHTML = `状态：${status}<br />球数：${ballCount}<br />帧率：${fps.toFixed(0)} FPS`;
  }

  public createBall(x: number, y: number, vx: number = 0, vy: number = 0): Ball {
    const ball = new Ball(x, y, this.selectedRadius, this.selectedColor, vx, vy);
    this.physicsEngine.addBall(ball);
    return ball;
  }
}

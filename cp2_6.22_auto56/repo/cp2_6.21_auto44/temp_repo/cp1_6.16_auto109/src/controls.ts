import * as THREE from 'three';
import { easeInOutQuad } from './virus';

export interface ControlCallbacks {
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onViewChange: (view: 'default' | 'top' | 'side') => void;
  onToggleSlowMotion: () => void;
  onStepFrame: (direction: number) => void;
}

export interface CameraViewPreset {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const CAMERA_VIEWS: Record<'default' | 'top' | 'side', CameraViewPreset> = {
  default: {
    position: new THREE.Vector3(0, 3, 7),
    target: new THREE.Vector3(0, 0, 0)
  },
  top: {
    position: new THREE.Vector3(0, 10, 0.01),
    target: new THREE.Vector3(0, 0, 0)
  },
  side: {
    position: new THREE.Vector3(8, 1.5, 0),
    target: new THREE.Vector3(0, 0, 0)
  }
};

export class Controls {
  private container: HTMLElement;
  private callbacks: ControlCallbacks;
  private panel: HTMLDivElement;
  private phaseLabel: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressFill: HTMLDivElement;
  private speedSlider: HTMLInputElement;
  private speedLabel: HTMLSpanElement;
  private isSlowMotion = false;
  private currentView: 'default' | 'top' | 'side' = 'default';
  private cameraTransitionActive = false;
  private cameraFromPos = new THREE.Vector3();
  private cameraFromTarget = new THREE.Vector3();
  private cameraToPos = new THREE.Vector3();
  private cameraToTarget = new THREE.Vector3();
  private cameraTransitionT = 0;
  private readonly TRANSITION_DURATION = 0.5;

  constructor(container: HTMLElement, callbacks: ControlCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      position: absolute;
      bottom: 80px;
      right: 20px;
      width: 15%;
      min-width: 200px;
      background: rgba(10, 10, 26, 0.85);
      border-radius: 16px;
      padding: 18px;
      color: #E0E0E0;
      font-family: sans-serif;
      font-size: 13px;
      border: 1px solid rgba(0, 212, 255, 0.25);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      z-index: 30;
    `;

    const title = document.createElement('div');
    title.textContent = '控制面板';
    title.style.cssText = `
      font-size: 15px;
      font-weight: bold;
      color: #00D4FF;
      margin-bottom: 14px;
      text-align: center;
      letter-spacing: 1px;
    `;
    this.panel.appendChild(title);

    const resetBtn = this.createButton('重置动画');
    resetBtn.onclick = () => this.callbacks.onReset();
    this.panel.appendChild(resetBtn);

    const speedSection = document.createElement('div');
    speedSection.style.marginTop = '14px';
    const speedTitle = document.createElement('div');
    speedTitle.textContent = '播放速度';
    speedTitle.style.marginBottom = '6px';
    speedSection.appendChild(speedTitle);

    this.speedLabel = document.createElement('span');
    this.speedLabel.textContent = '1.0x';
    this.speedLabel.style.cssText = 'float: right; color: #00D4FF; font-weight: bold;';
    speedTitle.appendChild(this.speedLabel);

    this.speedSlider = document.createElement('input');
    this.speedSlider.type = 'range';
    this.speedSlider.min = '0.1';
    this.speedSlider.max = '2';
    this.speedSlider.step = '0.1';
    this.speedSlider.value = '1';
    this.speedSlider.style.cssText = `
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #00D4FF, #7B2FBE);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      -webkit-appearance: none;
      appearance: none;
    `;
    this.speedSlider.oninput = () => {
      const val = parseFloat(this.speedSlider.value);
      this.speedLabel.textContent = val.toFixed(1) + 'x';
      this.callbacks.onSpeedChange(val);
    };
    speedSection.appendChild(this.speedSlider);
    this.panel.appendChild(speedSection);

    const viewSection = document.createElement('div');
    viewSection.style.marginTop = '14px';
    const viewTitle = document.createElement('div');
    viewTitle.textContent = '视角切换';
    viewTitle.style.marginBottom = '8px';
    viewSection.appendChild(viewTitle);

    const btnContainer = document.createElement('div');
    btnContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px;';

    const defaultBtn = this.createSmallButton('默认');
    defaultBtn.onclick = () => this.switchView('default');
    btnContainer.appendChild(defaultBtn);

    const topBtn = this.createSmallButton('俯视');
    topBtn.onclick = () => this.switchView('top');
    btnContainer.appendChild(topBtn);

    const sideBtn = this.createSmallButton('侧面');
    sideBtn.onclick = () => this.switchView('side');
    btnContainer.appendChild(sideBtn);

    viewSection.appendChild(btnContainer);
    this.panel.appendChild(viewSection);

    const phaseSection = document.createElement('div');
    phaseSection.style.marginTop = '14px';
    const phaseTitle = document.createElement('div');
    phaseTitle.textContent = '当前步骤';
    phaseTitle.style.marginBottom = '6px';
    phaseSection.appendChild(phaseTitle);

    this.phaseLabel = document.createElement('div');
    this.phaseLabel.textContent = '等待交互';
    this.phaseLabel.style.cssText = `
      background: rgba(0, 212, 255, 0.15);
      border: 1px solid rgba(0, 212, 255, 0.4);
      border-radius: 8px;
      padding: 8px 12px;
      text-align: center;
      color: #00D4FF;
      font-weight: bold;
      letter-spacing: 0.5px;
    `;
    phaseSection.appendChild(this.phaseLabel);
    this.panel.appendChild(phaseSection);

    const progressSection = document.createElement('div');
    progressSection.style.marginTop = '14px';
    const progressTitle = document.createElement('div');
    progressTitle.textContent = '动画进度';
    progressTitle.style.marginBottom = '8px';
    progressSection.appendChild(progressTitle);

    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
    `;

    this.progressFill = document.createElement('div');
    this.progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #00D4FF, #7B2FBE);
      border-radius: 4px;
      transition: width 0.15s ease;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    `;
    this.progressBar.appendChild(this.progressFill);
    progressSection.appendChild(this.progressBar);

    const progressPercent = document.createElement('div');
    progressPercent.style.cssText = 'text-align: right; margin-top: 4px; font-size: 11px; opacity: 0.7;';
    progressPercent.id = 'progress-text';
    progressPercent.textContent = '0%';
    progressSection.appendChild(progressPercent);

    this.panel.appendChild(progressSection);

    this.container.appendChild(this.panel);
    this.bindKeyboard();

    setTimeout(() => {
      const hint = document.getElementById('hint-bar');
      if (hint) hint.classList.add('fade-out');
    }, 5000);
  }

  private createButton(text: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      width: 100%;
      padding: 10px 14px;
      background: linear-gradient(135deg, #00D4FF, #7B2FBE);
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      font-family: sans-serif;
      letter-spacing: 0.5px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 10px rgba(0, 212, 255, 0.3);
    `;
    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.6)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 2px 10px rgba(0, 212, 255, 0.3)';
    };
    return btn;
  }

  private createSmallButton(text: string): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 6px 4px;
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.8), rgba(123, 47, 190, 0.8));
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 11px;
      font-weight: bold;
      cursor: pointer;
      font-family: sans-serif;
      transition: all 0.2s ease;
    `;
    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 2px 12px rgba(0, 212, 255, 0.5)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = 'none';
    };
    return btn;
  }

  private switchView(view: 'default' | 'top' | 'side'): void {
    this.currentView = view;
    this.callbacks.onViewChange(view);
  }

  startCameraTransition(fromPos: THREE.Vector3, fromTarget: THREE.Vector3,
                         toPos: THREE.Vector3, toTarget: THREE.Vector3): void {
    this.cameraFromPos.copy(fromPos);
    this.cameraFromTarget.copy(fromTarget);
    this.cameraToPos.copy(toPos);
    this.cameraToTarget.copy(toTarget);
    this.cameraTransitionActive = true;
    this.cameraTransitionT = 0;
  }

  updateCameraTransition(delta: number, camera: THREE.PerspectiveCamera, target: THREE.Vector3): boolean {
    if (!this.cameraTransitionActive) return false;

    this.cameraTransitionT += delta / this.TRANSITION_DURATION;
    const t = easeInOutQuad(Math.min(this.cameraTransitionT, 1));

    camera.position.lerpVectors(this.cameraFromPos, this.cameraToPos, t);
    target.lerpVectors(this.cameraFromTarget, this.cameraToTarget, t);

    if (this.cameraTransitionT >= 1) {
      this.cameraTransitionActive = false;
      camera.position.copy(this.cameraToPos);
      target.copy(this.cameraToTarget);
    }
    return true;
  }

  private bindKeyboard(): void {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.isSlowMotion = !this.isSlowMotion;
        this.callbacks.onToggleSlowMotion();
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        e.preventDefault();
        const dir = e.code === 'ArrowRight' ? 1 : -1;
        this.callbacks.onStepFrame(dir);
      }
    };
    window.addEventListener('keydown', handleKey);

    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const dir = e.deltaY > 0 ? -1 : 1;
        this.callbacks.onStepFrame(dir);
      }
    }, { passive: false });
  }

  updatePhaseLabel(text: string): void {
    this.phaseLabel.textContent = text;
  }

  updateProgress(value: number): void {
    const pct = Math.max(0, Math.min(100, value * 100));
    this.progressFill.style.width = pct.toFixed(1) + '%';
    const txt = document.getElementById('progress-text');
    if (txt) txt.textContent = pct.toFixed(0) + '%';
  }

  getSpeed(): number {
    return parseFloat(this.speedSlider.value);
  }

  resetUI(): void {
    this.speedSlider.value = '1';
    this.speedLabel.textContent = '1.0x';
    this.updateProgress(0);
    this.updatePhaseLabel('等待交互');
  }

  getCurrentView(): 'default' | 'top' | 'side' {
    return this.currentView;
  }

  slowMotionActive(): boolean {
    return this.isSlowMotion;
  }

  setSlowMotion(val: boolean): void {
    this.isSlowMotion = val;
  }
}

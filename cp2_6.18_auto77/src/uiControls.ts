import type { AudioSourceType } from './audioManager';
import type { VisualMode, VisualParams } from './visualization';

interface UIControlsCallbacks {
  onAudioSourceChange: (type: AudioSourceType, file?: File) => void;
  onParamsChange: (params: Partial<VisualParams>) => void;
}

export class UIControls {
  private callbacks: UIControlsCallbacks;
  private sourceLabel: HTMLDivElement;
  private waveformCanvas: HTMLCanvasElement;
  private waveformCtx: CanvasRenderingContext2D;
  private controlPanel: HTMLDivElement;
  private micBtn: HTMLButtonElement;
  private fileBtn: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private hideTimer: number | null = null;
  private isPanelVisible: boolean = true;
  private params: VisualParams;
  private isMobile: boolean;

  constructor(callbacks: UIControlsCallbacks) {
    this.callbacks = callbacks;
    this.isMobile = window.innerWidth < 768;

    this.params = {
      sensitivity: 1.0,
      rotationSpeed: 0.5,
      spread: 0.5,
      mode: 'both',
      isMobile: this.isMobile
    };

    this.sourceLabel = this.createSourceLabel();
    this.waveformCanvas = this.createWaveformCanvas();
    this.waveformCtx = this.waveformCanvas.getContext('2d')!;
    this.micBtn = this.createAudioButton('🎤 麦克风', 'microphone');
    this.fileBtn = this.createAudioButton('📁 文件', 'file');
    this.fileInput = this.createFileInput();
    this.controlPanel = this.createControlPanel();
    this.createSlider('sensitivity', 0.5, 2.0, 1.0, 0.01);
    this.createSlider('rotationSpeed', 0, 2.0, 0.5, 0.01);
    this.createSlider('spread', 0, 1.0, 0.5, 0.01);
    this.createModeButtons();

    this.assembleUI();
    this.setupPanelAutoHide();
    this.setupResponsiveListener();
  }

  private createSourceLabel(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'source-label';
    el.textContent = '未选择音频源';
    return el;
  }

  private createWaveformCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'waveform-canvas';
    canvas.width = 400;
    canvas.height = 80;
    return canvas;
  }

  private createAudioButton(text: string, type: AudioSourceType): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'audio-btn';
    btn.textContent = text;
    btn.addEventListener('click', () => {
      if (type === 'microphone') {
        this.callbacks.onAudioSourceChange('microphone');
        this.setActiveAudioButton('microphone');
      } else if (type === 'file') {
        this.fileInput.click();
      }
    });
    return btn;
  }

  private createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.id = 'fileInput';
    input.accept = 'audio/*';
    input.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        this.callbacks.onAudioSourceChange('file', file);
        this.setActiveAudioButton('file');
      }
    });
    return input;
  }

  private createControlPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'control-panel';
    return panel;
  }

  private createSlider(paramKey: keyof VisualParams, min: number, max: number, value: number, step: number): HTMLInputElement {
    const group = document.createElement('div');
    group.className = 'control-group';

    const label = document.createElement('label');
    label.className = 'control-label';
    const labels: Record<string, string> = {
      sensitivity: '灵敏度',
      rotationSpeed: '旋转速度',
      spread: '粒子扩散度'
    };
    label.textContent = labels[paramKey] || paramKey;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'slider';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.value = value.toString();
    slider.step = step.toString();

    slider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      (this.params as any)[paramKey] = val;
      this.callbacks.onParamsChange({ [paramKey]: val } as Partial<VisualParams>);
    });

    group.appendChild(label);
    group.appendChild(slider);
    this.controlPanel.appendChild(group);

    return slider;
  }

  private createModeButtons(): HTMLButtonElement[] {
    const container = document.createElement('div');
    container.className = 'mode-buttons';

    const modes: { key: VisualMode; label: string }[] = [
      { key: 'particles', label: '粒子模式' },
      { key: 'waveform', label: '波形模式' },
      { key: 'both', label: '混合模式' }
    ];

    const buttons: HTMLButtonElement[] = [];

    modes.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.className = 'mode-btn';
      btn.textContent = label;
      btn.dataset.mode = key;
      if (key === this.params.mode) {
        btn.classList.add('active');
      }
      btn.addEventListener('click', () => {
        this.params.mode = key;
        this.callbacks.onParamsChange({ mode: key });
        buttons.forEach(b => b.classList.toggle('active', b === btn));
      });
      container.appendChild(btn);
      buttons.push(btn);
    });

    this.controlPanel.appendChild(container);
    return buttons;
  }

  private assembleUI(): void {
    const app = document.getElementById('app')!;
    app.appendChild(this.sourceLabel);
    app.appendChild(this.fileInput);

    const audioBar = document.createElement('div');
    audioBar.className = 'audio-bar';
    audioBar.appendChild(this.micBtn);
    audioBar.appendChild(this.fileBtn);
    audioBar.appendChild(this.waveformCanvas);
    app.appendChild(audioBar);

    app.appendChild(this.controlPanel);
  }

  private setupPanelAutoHide(): void {
    const showPanel = () => {
      if (this.hideTimer) {
        window.clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      if (!this.isPanelVisible) {
        this.controlPanel.classList.remove('hidden');
        this.isPanelVisible = true;
      }
    };

    const startHideTimer = () => {
      if (this.hideTimer) {
        window.clearTimeout(this.hideTimer);
      }
      this.hideTimer = window.setTimeout(() => {
        this.controlPanel.classList.add('hidden');
        this.isPanelVisible = false;
        this.hideTimer = null;
      }, 1000);
    };

    this.controlPanel.addEventListener('mouseenter', showPanel);
    this.controlPanel.addEventListener('mouseleave', startHideTimer);

    document.addEventListener('mousemove', (e) => {
      const rect = this.controlPanel.getBoundingClientRect();
      const isNearPanel =
        e.clientX >= rect.left - 50 &&
        e.clientX <= rect.right + 50 &&
        e.clientY >= rect.top - 50 &&
        e.clientY <= rect.bottom + 50;

      if (isNearPanel) {
        showPanel();
      } else if (!this.controlPanel.matches(':hover')) {
        if (!this.hideTimer) {
          startHideTimer();
        }
      }
    });
  }

  private setupResponsiveListener(): void {
    window.addEventListener('resize', () => {
      const nowMobile = window.innerWidth < 768;
      if (nowMobile !== this.isMobile) {
        this.isMobile = nowMobile;
        this.params.isMobile = nowMobile;
        this.callbacks.onParamsChange({ isMobile: nowMobile });
      }

      const dpr = window.devicePixelRatio || 1;
      this.waveformCanvas.width = this.waveformCanvas.offsetWidth * dpr;
      this.waveformCanvas.height = this.waveformCanvas.offsetHeight * dpr;
      this.waveformCtx.scale(dpr, dpr);
    });

    const dpr = window.devicePixelRatio || 1;
    this.waveformCanvas.width = this.waveformCanvas.offsetWidth * dpr;
    this.waveformCanvas.height = this.waveformCanvas.offsetHeight * dpr;
    this.waveformCtx.scale(dpr, dpr);
  }

  private setActiveAudioButton(type: AudioSourceType): void {
    this.micBtn.classList.toggle('active', type === 'microphone');
    this.fileBtn.classList.toggle('active', type === 'file');
  }

  setAudioSourceName(name: string): void {
    this.sourceLabel.textContent = name;
  }

  drawWaveformPreview(data: Uint8Array): void {
    const ctx = this.waveformCtx;
    const width = this.waveformCanvas.offsetWidth;
    const height = this.waveformCanvas.offsetHeight;

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.strokeStyle = '#00FF88';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const sliceWidth = width / data.length;
    let x = 0;

    for (let i = 0; i < data.length; i++) {
      const v = data[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }

  getCurrentParams(): VisualParams {
    return { ...this.params };
  }
}

import { COLOR_GRADIENTS, ParticleShape } from './ParticleSystem';

export interface UIOptions {
  onFileSelect: (file: File) => void;
  onPlayPause: () => void;
  onParticleSizeChange: (size: number) => void;
  onRotationSpeedChange: (speed: number) => void;
  onGradientChange: (index: number) => void;
  onShapeChange: (shape: ParticleShape) => void;
}

export class UI {
  private container: HTMLElement;
  private panel: HTMLElement;
  private options: UIOptions;
  
  private fileInput: HTMLInputElement;
  private fileNameDisplay: HTMLElement;
  private progressBar: HTMLElement;
  private progressFill: HTMLElement;
  private playPauseBtn: HTMLElement;
  private particleSizeSlider: HTMLInputElement;
  private particleSizeValue: HTMLElement;
  private rotationSpeedSlider: HTMLInputElement;
  private rotationSpeedValue: HTMLElement;
  private gradientButtons: HTMLElement[] = [];
  private shapeButtons: HTMLElement[] = [];
  
  private isPlaying: boolean = false;

  constructor(container: HTMLElement, options: UIOptions) {
    this.container = container;
    this.options = options;
    
    this.panel = document.createElement('div');
    this.panel.className = 'control-panel';
    
    this.fileInput = document.createElement('input');
    this.fileNameDisplay = document.createElement('div');
    this.progressBar = document.createElement('div');
    this.progressFill = document.createElement('div');
    this.playPauseBtn = document.createElement('button');
    this.particleSizeSlider = document.createElement('input');
    this.particleSizeValue = document.createElement('span');
    this.rotationSpeedSlider = document.createElement('input');
    this.rotationSpeedValue = document.createElement('span');
    
    this.createStyles();
    this.buildUI();
    this.attachEventListeners();
    
    this.container.appendChild(this.panel);
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .control-panel {
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 24px;
        color: white;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        min-width: 320px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 1000;
        user-select: none;
      }
      
      .panel-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 20px;
        color: #4da6ff;
        letter-spacing: 1px;
      }
      
      .control-group {
        margin-bottom: 20px;
      }
      
      .control-label {
        display: block;
        font-size: 13px;
        color: #aaa;
        margin-bottom: 8px;
        font-weight: 500;
      }
      
      .file-select-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 20px;
        background: rgba(77, 166, 255, 0.2);
        border: 1px solid rgba(77, 166, 255, 0.5);
        border-radius: 8px;
        color: white;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        justify-content: center;
      }
      
      .file-select-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(77, 166, 255, 0.8);
        transform: translateY(-1px);
      }
      
      .file-select-btn:active {
        transform: translateY(0);
      }
      
      .file-icon {
        width: 18px;
        height: 18px;
      }
      
      .file-name {
        margin-top: 10px;
        font-size: 13px;
        color: #4da6ff;
        word-break: break-all;
        display: none;
      }
      
      .file-name.visible {
        display: block;
      }
      
      .progress-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 10px;
        display: none;
      }
      
      .progress-container.visible {
        display: flex;
      }
      
      .progress-bar {
        flex: 1;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        position: relative;
      }
      
      .progress-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #0066ff, #ff3300);
        border-radius: 2px;
        transition: width 0.1s linear;
      }
      
      .play-pause-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(77, 166, 255, 0.3);
        border: 1px solid rgba(77, 166, 255, 0.5);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }
      
      .play-pause-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .play-pause-btn svg {
        width: 16px;
        height: 16px;
      }
      
      .slider-container {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        background: #333;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
      }
      
      .slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        background: #4da6ff;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 0 10px rgba(77, 166, 255, 0.5);
      }
      
      .slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 15px rgba(77, 166, 255, 0.8);
      }
      
      .slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: #4da6ff;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease;
        box-shadow: 0 0 10px rgba(77, 166, 255, 0.5);
      }
      
      .slider::-moz-range-thumb:hover {
        transform: scale(1.2);
        box-shadow: 0 0 15px rgba(77, 166, 255, 0.8);
      }
      
      .slider-value {
        min-width: 45px;
        text-align: right;
        font-size: 13px;
        color: #4da6ff;
        font-weight: 600;
      }
      
      .gradient-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      
      .gradient-btn {
        flex: 1;
        min-width: 60px;
        height: 36px;
        border-radius: 8px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }
      
      .gradient-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }
      
      .gradient-btn.active {
        border-color: #fff;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
      }
      
      .gradient-btn::after {
        content: attr(data-name);
        position: absolute;
        bottom: 2px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 10px;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        pointer-events: none;
      }
      
      .shape-buttons {
        display: flex;
        gap: 8px;
      }
      
      .shape-btn {
        flex: 1;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        color: white;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .shape-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      .shape-btn.active {
        background: rgba(77, 166, 255, 0.3);
        border-color: #4da6ff;
      }
      
      .divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 16px 0;
      }
    `;
    document.head.appendChild(style);
  }

  private buildUI(): void {
    this.panel.innerHTML = '';
    
    const title = document.createElement('div');
    title.className = 'panel-title';
    title.textContent = '🎵 3D粒子音乐可视化';
    this.panel.appendChild(title);
    
    const fileGroup = document.createElement('div');
    fileGroup.className = 'control-group';
    
    const fileLabel = document.createElement('label');
    fileLabel.className = 'control-label';
    fileLabel.textContent = '音频文件';
    fileGroup.appendChild(fileLabel);
    
    this.fileInput.type = 'file';
    this.fileInput.accept = 'audio/*';
    this.fileInput.style.display = 'none';
    fileGroup.appendChild(this.fileInput);
    
    const fileBtn = document.createElement('button');
    fileBtn.className = 'file-select-btn';
    fileBtn.innerHTML = `
      <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      选择音频文件
    `;
    fileBtn.addEventListener('click', () => this.fileInput.click());
    fileGroup.appendChild(fileBtn);
    
    this.fileNameDisplay.className = 'file-name';
    fileGroup.appendChild(this.fileNameDisplay);
    
    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';
    
    this.progressBar.className = 'progress-bar';
    this.progressFill.className = 'progress-fill';
    this.progressBar.appendChild(this.progressFill);
    progressContainer.appendChild(this.progressBar);
    
    this.playPauseBtn.className = 'play-pause-btn';
    this.updatePlayPauseIcon();
    this.playPauseBtn.addEventListener('click', () => this.options.onPlayPause());
    progressContainer.appendChild(this.playPauseBtn);
    
    fileGroup.appendChild(progressContainer);
    this.panel.appendChild(fileGroup);
    
    const divider1 = document.createElement('div');
    divider1.className = 'divider';
    this.panel.appendChild(divider1);
    
    const sizeGroup = document.createElement('div');
    sizeGroup.className = 'control-group';
    
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'control-label';
    sizeLabel.textContent = '粒子大小';
    sizeGroup.appendChild(sizeLabel);
    
    const sizeSliderContainer = document.createElement('div');
    sizeSliderContainer.className = 'slider-container';
    
    this.particleSizeSlider.type = 'range';
    this.particleSizeSlider.min = '1';
    this.particleSizeSlider.max = '10';
    this.particleSizeSlider.step = '0.5';
    this.particleSizeSlider.value = '3';
    this.particleSizeSlider.className = 'slider';
    sizeSliderContainer.appendChild(this.particleSizeSlider);
    
    this.particleSizeValue.className = 'slider-value';
    this.particleSizeValue.textContent = '3.0';
    sizeSliderContainer.appendChild(this.particleSizeValue);
    
    sizeGroup.appendChild(sizeSliderContainer);
    this.panel.appendChild(sizeGroup);
    
    const speedGroup = document.createElement('div');
    speedGroup.className = 'control-group';
    
    const speedLabel = document.createElement('label');
    speedLabel.className = 'control-label';
    speedLabel.textContent = '旋转速度倍率';
    speedGroup.appendChild(speedLabel);
    
    const speedSliderContainer = document.createElement('div');
    speedSliderContainer.className = 'slider-container';
    
    this.rotationSpeedSlider.type = 'range';
    this.rotationSpeedSlider.min = '0.5';
    this.rotationSpeedSlider.max = '2.0';
    this.rotationSpeedSlider.step = '0.1';
    this.rotationSpeedSlider.value = '1.0';
    this.rotationSpeedSlider.className = 'slider';
    speedSliderContainer.appendChild(this.rotationSpeedSlider);
    
    this.rotationSpeedValue.className = 'slider-value';
    this.rotationSpeedValue.textContent = '1.0x';
    speedSliderContainer.appendChild(this.rotationSpeedValue);
    
    speedGroup.appendChild(speedSliderContainer);
    this.panel.appendChild(speedGroup);
    
    const divider2 = document.createElement('div');
    divider2.className = 'divider';
    this.panel.appendChild(divider2);
    
    const shapeGroup = document.createElement('div');
    shapeGroup.className = 'control-group';
    
    const shapeLabel = document.createElement('label');
    shapeLabel.className = 'control-label';
    shapeLabel.textContent = '粒子形状';
    shapeGroup.appendChild(shapeLabel);
    
    const shapeButtonsContainer = document.createElement('div');
    shapeButtonsContainer.className = 'shape-buttons';
    
    const shapes: { key: ParticleShape; label: string }[] = [
      { key: 'point', label: '圆点' },
      { key: 'cube', label: '立方体' }
    ];
    
    shapes.forEach((shape, index) => {
      const btn = document.createElement('button');
      btn.className = 'shape-btn' + (index === 0 ? ' active' : '');
      btn.textContent = shape.label;
      btn.addEventListener('click', () => {
        this.shapeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.options.onShapeChange(shape.key);
      });
      shapeButtonsContainer.appendChild(btn);
      this.shapeButtons.push(btn);
    });
    
    shapeGroup.appendChild(shapeButtonsContainer);
    this.panel.appendChild(shapeGroup);
    
    const gradientGroup = document.createElement('div');
    gradientGroup.className = 'control-group';
    
    const gradientLabel = document.createElement('label');
    gradientLabel.className = 'control-label';
    gradientLabel.textContent = '颜色渐变';
    gradientGroup.appendChild(gradientLabel);
    
    const gradientButtonsContainer = document.createElement('div');
    gradientButtonsContainer.className = 'gradient-buttons';
    
    COLOR_GRADIENTS.forEach((gradient, index) => {
      const btn = document.createElement('button');
      btn.className = 'gradient-btn' + (index === 0 ? ' active' : '');
      btn.dataset.name = gradient.name;
      btn.style.background = `linear-gradient(135deg, ${this.colorToHex(gradient.start)}, ${this.colorToHex(gradient.end)})`;
      btn.addEventListener('click', () => {
        this.gradientButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.options.onGradientChange(index);
      });
      gradientButtonsContainer.appendChild(btn);
      this.gradientButtons.push(btn);
    });
    
    gradientGroup.appendChild(gradientButtonsContainer);
    this.panel.appendChild(gradientGroup);
  }

  private attachEventListeners(): void {
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.fileNameDisplay.textContent = file.name;
        this.fileNameDisplay.classList.add('visible');
        this.progressBar.parentElement?.classList.add('visible');
        this.options.onFileSelect(file);
      }
    });
    
    this.particleSizeSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.particleSizeValue.textContent = value.toFixed(1);
      this.options.onParticleSizeChange(value);
    });
    
    this.rotationSpeedSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.rotationSpeedValue.textContent = value.toFixed(1) + 'x';
      this.options.onRotationSpeedChange(value);
    });
  }

  private colorToHex(color: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  private updatePlayPauseIcon(): void {
    if (this.isPlaying) {
      this.playPauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      `;
    } else {
      this.playPauseBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21"/>
        </svg>
      `;
    }
  }

  setProgress(progress: number, highFrequencyEnergy: number): void {
    this.progressFill.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
    
    const hue = 240 - highFrequencyEnergy * 240;
    this.progressFill.style.background = `linear-gradient(90deg, hsl(${hue}, 100%, 50%), hsl(${hue - 60}, 100%, 50%))`;
  }

  setIsPlaying(playing: boolean): void {
    this.isPlaying = playing;
    this.updatePlayPauseIcon();
  }

  setActiveGradient(index: number): void {
    this.gradientButtons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
  }

  setActiveShape(shape: ParticleShape): void {
    this.shapeButtons.forEach((btn, i) => {
      const shapes: ParticleShape[] = ['point', 'cube'];
      btn.classList.toggle('active', shapes[i] === shape);
    });
  }

  reset(): void {
    this.fileNameDisplay.textContent = '';
    this.fileNameDisplay.classList.remove('visible');
    this.progressBar.parentElement?.classList.remove('visible');
    this.progressFill.style.width = '0%';
    this.isPlaying = false;
    this.updatePlayPauseIcon();
    this.fileInput.value = '';
  }
}

import * as THREE from 'three';
import { ParticleSystem } from './particleSystem';

export class UIController {
  private particleSystem: ParticleSystem;
  private panel: HTMLDivElement;
  private statusBar: HTMLDivElement;
  private statusText: HTMLSpanElement;
  private exportButton: HTMLButtonElement;
  private visible: boolean = false;
  private fpsLow: boolean = false;

  private densitySlider: HTMLInputElement;
  private densityValue: HTMLSpanElement;
  private gravitySlider: HTMLInputElement;
  private gravityValue: HTMLSpanElement;
  private startColorInput: HTMLInputElement;
  private endColorInput: HTMLInputElement;
  private resetButton: HTMLButtonElement;

  constructor(particleSystem: ParticleSystem) {
    this.particleSystem = particleSystem;

    this.panel = this.createPanel();
    this.statusBar = this.createStatusBar();
    this.statusText = this.statusBar.querySelector('.status-text') as HTMLSpanElement;
    this.exportButton = this.statusBar.querySelector('.export-btn') as HTMLButtonElement;

    this.densitySlider = this.panel.querySelector('.density-slider') as HTMLInputElement;
    this.densityValue = this.panel.querySelector('.density-value') as HTMLSpanElement;
    this.gravitySlider = this.panel.querySelector('.gravity-slider') as HTMLInputElement;
    this.gravityValue = this.panel.querySelector('.gravity-value') as HTMLSpanElement;
    this.startColorInput = this.panel.querySelector('.start-color') as HTMLInputElement;
    this.endColorInput = this.panel.querySelector('.end-color') as HTMLInputElement;
    this.resetButton = this.panel.querySelector('.reset-btn') as HTMLButtonElement;

    this.bindEvents();
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      top: 0;
      right: -280px;
      width: 280px;
      height: calc(100vh - 40px);
      background: #111122CC;
      border-radius: 12px 0 0 12px;
      padding: 24px 20px;
      z-index: 100;
      transition: right 0.3s ease-out;
      backdrop-filter: blur(12px);
      border-left: 1px solid rgba(255,255,255,0.05);
      overflow-y: auto;
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 28px;">
        <h3 style="color: #AAAACC; font-size: 16px; margin-bottom: 6px; font-weight: 600; letter-spacing: 1px;">控制面板</h3>
        <div style="width: 40px; height: 2px; background: linear-gradient(90deg, #4422FF, #FF66AA); border-radius: 1px;"></div>
      </div>

      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="color: #AAAACC; font-size: 14px;">粒子密度</label>
          <span class="density-value" style="color: #FF66AA; font-size: 14px;">5000</span>
        </div>
        <input type="range" class="density-slider" min="3000" max="15000" step="500" value="5000"
          style="width: 100%; accent-color: #4422FF; height: 4px;" />
      </div>

      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label style="color: #AAAACC; font-size: 14px;">引力强度</label>
          <span class="gravity-value" style="color: #FF66AA; font-size: 14px;">1.0</span>
        </div>
        <input type="range" class="gravity-slider" min="2" max="20" step="1" value="10"
          style="width: 100%; accent-color: #FFD700; height: 4px;" />
      </div>

      <div style="margin-bottom: 24px;">
        <label style="color: #AAAACC; font-size: 14px; display: block; margin-bottom: 8px;">颜色渐变</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex: 1;">
            <div style="color: #8888AA; font-size: 11px; margin-bottom: 4px;">起始色</div>
            <input type="color" class="start-color" value="#4422FF"
              style="width: 100%; height: 36px; border: 1px solid #333355; border-radius: 6px; background: transparent; cursor: pointer;" />
          </div>
          <div style="color: #555577; font-size: 18px;">→</div>
          <div style="flex: 1;">
            <div style="color: #8888AA; font-size: 11px; margin-bottom: 4px;">结束色</div>
            <input type="color" class="end-color" value="#FF66AA"
              style="width: 100%; height: 36px; border: 1px solid #333355; border-radius: 6px; background: transparent; cursor: pointer;" />
          </div>
        </div>
      </div>

      <div style="margin-top: 36px;">
        <button class="reset-btn"
          style="width: 100%; padding: 10px 0; border: none; border-radius: 6px;
          background: linear-gradient(135deg, #FF4444, #CC2222); color: #FFFFFF;
          font-size: 14px; font-weight: 600; cursor: pointer; letter-spacing: 1px;
          transition: opacity 0.15s;">
          重置场景
        </button>
      </div>

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.05);">
        <div style="color: #666688; font-size: 11px; line-height: 1.8;">
          <div>按 <span style="color: #AAAACC;">G</span> + 点击 → 放置引力节点</div>
          <div>按 <span style="color: #AAAACC;">R</span> → 切换控制面板</div>
          <div>左键拖拽 → 旋转视角</div>
          <div>右键拖拽 → 平移视角</div>
          <div>滚轮 → 缩放</div>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    return panel;
  }

  private createStatusBar(): HTMLDivElement {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 40px;
      background: #0A0A1ACC;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      backdrop-filter: blur(8px);
      border-top: 1px solid rgba(255,255,255,0.03);
    `;

    bar.innerHTML = `
      <span class="status-text" style="color: #8888AA; font-size: 12px; letter-spacing: 0.5px;">
        粒子: 5000  FPS: 60  节点: 0
      </span>
      <button class="export-btn" title="导出配置JSON"
        style="position: absolute; right: 16px; width: 24px; height: 24px;
        border-radius: 50%; border: none; background: #FF666644;
        color: #FF666688; font-size: 10px; cursor: pointer; display: flex;
        align-items: center; justify-content: center; transition: background 0.2s;">
        ✦
      </button>
    `;

    document.body.appendChild(bar);
    return bar;
  }

  private bindEvents(): void {
    this.densitySlider.addEventListener('input', () => {
      const val = parseInt(this.densitySlider.value);
      this.densityValue.textContent = val.toString();
      this.particleSystem.setDensity(val);
    });

    this.gravitySlider.addEventListener('input', () => {
      const val = parseInt(this.gravitySlider.value) / 10;
      this.gravityValue.textContent = val.toFixed(1);
      this.particleSystem.setGravityStrength(val);
    });

    this.startColorInput.addEventListener('input', () => {
      this.updateColors();
    });

    this.endColorInput.addEventListener('input', () => {
      this.updateColors();
    });

    this.resetButton.addEventListener('click', () => {
      this.resetButton.style.opacity = '0.5';
      setTimeout(() => {
        this.resetButton.style.opacity = '1';
      }, 150);
      this.particleSystem.reset();
    });

    this.exportButton.addEventListener('mouseenter', () => {
      this.exportButton.style.background = '#FF666688';
    });
    this.exportButton.addEventListener('mouseleave', () => {
      this.exportButton.style.background = '#FF666644';
    });
    this.exportButton.addEventListener('click', () => {
      this.exportConfig();
    });
  }

  private updateColors(): void {
    const startColor = new THREE.Color(this.startColorInput.value);
    const endColor = new THREE.Color(this.endColorInput.value);
    this.particleSystem.setColorRange(startColor, endColor);
  }

  private exportConfig(): void {
    const config = {
      particleDensity: parseInt(this.densitySlider.value),
      gravityStrength: parseInt(this.gravitySlider.value) / 10,
      startColor: this.startColorInput.value,
      endColor: this.endColorInput.value,
      timestamp: new Date().toISOString()
    };
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      const orig = this.exportButton.innerHTML;
      this.exportButton.innerHTML = '✓';
      this.exportButton.style.color = '#66FF66';
      setTimeout(() => {
        this.exportButton.innerHTML = orig;
        this.exportButton.style.color = '#FF666688';
      }, 1000);
    });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.panel.style.right = this.visible ? '0px' : '-280px';
  }

  updateStatus(particleCount: number, fps: number, nodeCount: number): void {
    if (fps < 30) {
      if (!this.fpsLow) {
        this.fpsLow = true;
        this.statusText.style.color = '#FF4444';
        this.statusText.style.animation = 'fpsBlink 0.8s ease-in-out infinite';
        if (!document.getElementById('fps-blink-style')) {
          const style = document.createElement('style');
          style.id = 'fps-blink-style';
          style.textContent = `@keyframes fpsBlink { 0%,100%{opacity:1} 50%{opacity:0.3} }`;
          document.head.appendChild(style);
        }
      }
    } else {
      if (this.fpsLow) {
        this.fpsLow = false;
        this.statusText.style.color = '#8888AA';
        this.statusText.style.animation = 'none';
      }
    }
    this.statusText.textContent = `粒子: ${particleCount}  FPS: ${Math.round(fps)}  节点: ${nodeCount}`;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getDensity(): number {
    return parseInt(this.densitySlider.value);
  }

  getGravityStrength(): number {
    return parseInt(this.gravitySlider.value) / 10;
  }

  getStartColor(): string {
    return this.startColorInput.value;
  }

  getEndColor(): string {
    return this.endColorInput.value;
  }
}

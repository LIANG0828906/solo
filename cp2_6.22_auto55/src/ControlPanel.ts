import { EnvParams } from './SceneInitializer';
import * as THREE from 'three';

export interface ControlPanelCallbacks {
  onParamsChange: (p: EnvParams) => void;
}

export class ControlPanel {
  private container: HTMLElement;
  private callbacks: ControlPanelCallbacks;
  public params: EnvParams = {
    currentSpeed: 2.0,
    lightIntensity: 65,
    nutrientLevel: 55,
  };

  private fpsDisplay!: HTMLElement;
  private scoreDisplay!: HTMLElement;
  private scoreRing!: HTMLElement;
  private infoPanel!: HTMLElement;
  private currentScore = 72;
  private targetScore = 72;
  private lastDisplayedScore = -1;
  private autoTimer: number | null = null;

  constructor(callbacks: ControlPanelCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.buildPanel();
    this.buildStatsPanel();
    this.buildInfoPanel();
    document.body.appendChild(this.container);
    this.bindEvents();
    this.updateTargetScore();
  }

  private buildPanel(): void {
    this.container.id = 'control-panel';
    this.container.innerHTML = `
      <style>
        #control-panel {
          position: fixed;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          width: 310px;
          padding: 30px 26px;
          border-radius: 20px;
          background: rgba(8, 25, 50, 0.38);
          backdrop-filter: blur(20px) saturate(1.7);
          -webkit-backdrop-filter: blur(20px) saturate(1.7);
          border: 1px solid rgba(0, 229, 255, 0.28);
          box-shadow:
            0 10px 40px rgba(0, 0, 0, 0.35),
            inset 0 0 0 1px rgba(255, 255, 255, 0.06),
            0 0 50px rgba(0, 180, 255, 0.1);
          z-index: 100;
          font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
          color: rgba(255, 255, 255, 0.93);
          transition: box-shadow 0.35s ease, border-color 0.35s ease;
        }
        #control-panel::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 21px;
          padding: 1.5px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.65), rgba(0, 140, 255, 0.2) 45%, transparent 75%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.85;
        }
        #control-panel:hover {
          box-shadow:
            0 10px 40px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1),
            0 0 80px rgba(0, 200, 255, 0.18);
          border-color: rgba(0, 229, 255, 0.45);
        }
        .cp-header {
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(0, 229, 255, 0.14);
        }
        .cp-title {
          font-size: 19px;
          font-weight: 600;
          letter-spacing: 2.5px;
          margin-bottom: 6px;
          background: linear-gradient(90deg, #ffffff, #6ee7ff 75%, #a8ffd0);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cp-subtitle {
          font-size: 11px;
          letter-spacing: 3.5px;
          color: rgba(110, 231, 255, 0.52);
          text-transform: uppercase;
        }
        .cp-group {
          margin-bottom: 22px;
        }
        .cp-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .cp-label {
          font-size: 12.5px;
          letter-spacing: 1.8px;
          color: rgba(255, 255, 255, 0.72);
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cp-label-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }
        .cp-value {
          font-size: 14px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: #6ee7ff;
          text-shadow: 0 0 10px rgba(0, 229, 255, 0.45);
          min-width: 42px;
          text-align: right;
        }
        .cp-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 5px;
          border-radius: 5px;
          background: linear-gradient(90deg, rgba(0, 229, 255, 0.75), rgba(100, 150, 255, 0.28));
          outline: none;
          cursor: pointer;
          position: relative;
          transition: box-shadow 0.2s ease;
        }
        .cp-slider:hover {
          box-shadow: 0 0 14px rgba(0, 229, 255, 0.35);
        }
        .cp-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffffff, #6ee7ff 58%, #00a8cc);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.18), 0 0 18px rgba(0, 229, 255, 0.7);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .cp-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 6px rgba(0, 229, 255, 0.22), 0 0 30px rgba(0, 229, 255, 0.9);
        }
        .cp-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffffff, #6ee7ff 58%, #00a8cc);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.18), 0 0 18px rgba(0, 229, 255, 0.7);
        }
        .cp-buttons {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(0, 229, 255, 0.14);
        }
        .cp-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 11px;
          border: 1px solid rgba(0, 229, 255, 0.32);
          background: rgba(0, 229, 255, 0.09);
          color: rgba(255, 255, 255, 0.92);
          font-size: 12px;
          letter-spacing: 1.8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.22s ease;
          font-family: inherit;
          position: relative;
          overflow: hidden;
        }
        .cp-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent 50%);
          opacity: 0;
          transition: opacity 0.22s ease;
        }
        .cp-btn:hover {
          background: rgba(0, 229, 255, 0.2);
          border-color: rgba(0, 229, 255, 0.65);
          box-shadow: 0 0 28px rgba(0, 229, 255, 0.38), inset 0 0 24px rgba(0, 229, 255, 0.12);
          transform: translateY(-2px);
        }
        .cp-btn:hover::before {
          opacity: 1;
        }
        .cp-btn:active {
          transform: translateY(0);
        }
        .cp-btn-primary {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.32), rgba(80, 150, 255, 0.22));
        }
        .cp-btn-primary:hover {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.42), rgba(80, 150, 255, 0.32));
        }
        .cp-btn.active-auto {
          background: linear-gradient(135deg, rgba(100, 255, 200, 0.28), rgba(0, 229, 255, 0.28));
          border-color: rgba(100, 255, 200, 0.5);
        }
      </style>
      <div class="cp-header">
        <div class="cp-title">生态控制台</div>
        <div class="cp-subtitle">ECOSYSTEM CONTROL</div>
      </div>
      <div class="cp-group" data-group="current">
        <div class="cp-group-header">
          <div class="cp-label">
            <span class="cp-label-icon" style="background: rgba(0,200,255,0.22);">🌊</span>
            洋流速度
          </div>
          <div class="cp-value" id="val-current">2.0</div>
        </div>
        <input type="range" class="cp-slider" id="slider-current" min="0" max="5" step="0.1" value="2.0" />
      </div>
      <div class="cp-group" data-group="light">
        <div class="cp-group-header">
          <div class="cp-label">
            <span class="cp-label-icon" style="background: rgba(255,220,100,0.22);">☀️</span>
            光照强度
          </div>
          <div class="cp-value" id="val-light">65%</div>
        </div>
        <input type="range" class="cp-slider" id="slider-light" min="5" max="100" step="1" value="65" />
      </div>
      <div class="cp-group" data-group="nutrient">
        <div class="cp-group-header">
          <div class="cp-label">
            <span class="cp-label-icon" style="background: rgba(180,255,150,0.18);">🧪</span>
            营养盐
          </div>
          <div class="cp-value" id="val-nutrient">55%</div>
        </div>
        <input type="range" class="cp-slider" id="slider-nutrient" min="0" max="100" step="1" value="55" />
      </div>
      <div class="cp-buttons">
        <button class="cp-btn cp-btn-primary" id="btn-reset">重置参数</button>
        <button class="cp-btn" id="btn-auto">自动模式</button>
      </div>
    `;
  }

  private buildStatsPanel(): void {
    const stats = document.createElement('div');
    stats.id = 'stats-panel';
    stats.innerHTML = `
      <style>
        #stats-panel {
          position: fixed;
          right: 24px;
          top: 24px;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 16px 22px;
          border-radius: 18px;
          background: rgba(8, 25, 50, 0.35);
          backdrop-filter: blur(20px) saturate(1.6);
          -webkit-backdrop-filter: blur(20px) saturate(1.6);
          border: 1px solid rgba(0, 229, 255, 0.24);
          box-shadow: 0 0 40px rgba(0, 180, 255, 0.12);
          z-index: 100;
          font-family: 'Segoe UI', 'PingFang SC', sans-serif;
          transition: box-shadow 0.3s ease;
        }
        #stats-panel::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 19px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.55), transparent 60%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        #stats-panel:hover {
          box-shadow: 0 0 60px rgba(0, 180, 255, 0.2);
        }
        .stat-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 64px;
        }
        .stat-label {
          font-size: 9px;
          letter-spacing: 2.5px;
          color: rgba(110, 231, 255, 0.62);
          text-transform: uppercase;
          margin-bottom: 6px;
          font-weight: 600;
        }
        #fps-val {
          font-size: 22px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #6ee7ff;
          text-shadow: 0 0 12px rgba(0, 229, 255, 0.6);
          line-height: 1;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }
        .score-wrap {
          position: relative;
          width: 58px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #score-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(#00e5ff 0%, #66ffdd 50%, #6688ff var(--score-pct, 72%), rgba(255,255,255,0.09) var(--score-pct, 72%));
          transition: background 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 0 22px rgba(0, 229, 255, 0.35), inset 0 0 12px rgba(0, 229, 255, 0.1);
          animation: ring-pulse 3s ease-in-out infinite;
        }
        @keyframes ring-pulse {
          0%, 100% { box-shadow: 0 0 22px rgba(0, 229, 255, 0.35), inset 0 0 12px rgba(0, 229, 255, 0.1); }
          50% { box-shadow: 0 0 30px rgba(0, 229, 255, 0.5), inset 0 0 16px rgba(0, 229, 255, 0.15); }
        }
        #score-ring::before {
          content: '';
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          background: rgba(8, 25, 50, 0.92);
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.3);
        }
        #score-val {
          position: relative;
          z-index: 1;
          font-size: 19px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #ffffff;
          line-height: 1;
          text-shadow: 0 0 8px rgba(110, 231, 255, 0.4);
        }
        .stat-sep {
          width: 1px;
          height: 40px;
          background: linear-gradient(180deg, transparent, rgba(0, 229, 255, 0.35), transparent);
        }
      </style>
      <div class="stat-block">
        <div class="stat-label">FPS</div>
        <div id="fps-val">60</div>
      </div>
      <div class="stat-sep"></div>
      <div class="stat-block">
        <div class="stat-label">ECO</div>
        <div class="score-wrap">
          <div id="score-ring"><span id="score-val">72</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(stats);

    this.fpsDisplay = stats.querySelector('#fps-val') as HTMLElement;
    this.scoreDisplay = stats.querySelector('#score-val') as HTMLElement;
    this.scoreRing = stats.querySelector('#score-ring') as HTMLElement;
    this.scoreRing.style.setProperty('--score-pct', '72%');
  }

  private buildInfoPanel(): void {
    this.infoPanel = document.createElement('div');
    this.infoPanel.className = 'cp-info';
    this.infoPanel.innerHTML = `
      <style>
        .cp-info {
          position: fixed;
          z-index: 150;
          padding: 16px 20px;
          border-radius: 14px;
          background: rgba(8, 25, 50, 0.72);
          backdrop-filter: blur(16px) saturate(1.5);
          -webkit-backdrop-filter: blur(16px) saturate(1.5);
          border: 1px solid rgba(0, 229, 255, 0.4);
          box-shadow: 0 0 36px rgba(0, 229, 255, 0.3);
          font-size: 12.5px;
          color: rgba(255, 255, 255, 0.96);
          pointer-events: none;
          opacity: 0;
          transform: translateY(4px) scale(0.98);
          transition: opacity 0.28s ease, transform 0.28s ease;
          min-width: 200px;
          font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
        }
        .cp-info.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        .cp-info::before {
          content: '';
          position: absolute;
          left: -7px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 7px solid transparent;
          border-bottom: 7px solid transparent;
          border-right: 8px solid rgba(0, 229, 255, 0.4);
        }
        .cp-info-title {
          font-size: 11px;
          letter-spacing: 2.5px;
          color: #6ee7ff;
          margin-bottom: 12px;
          font-weight: 600;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cp-info-title::before {
          content: '';
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6ee7ff;
          box-shadow: 0 0 8px #6ee7ff;
          animation: dot-blink 1.5s ease-in-out infinite;
        }
        @keyframes dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .cp-info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid rgba(0, 229, 255, 0.09);
          align-items: center;
        }
        .cp-info-row:last-child { border-bottom: none; }
        .cp-info-label { color: rgba(255, 255, 255, 0.62); letter-spacing: 1.2px; font-size: 11.5px; }
        .cp-info-val { font-weight: 600; color: #fff; font-variant-numeric: tabular-nums; font-size: 13px; }
      </style>
      <div class="cp-info-title">区域生态数据</div>
      <div class="cp-info-row"><span class="cp-info-label">🪸 珊瑚密度</span><span class="cp-info-val" id="info-density">—</span></div>
      <div class="cp-info-row"><span class="cp-info-label">🌡️ 水温</span><span class="cp-info-val" id="info-temp">—</span></div>
      <div class="cp-info-row"><span class="cp-info-label">🧪 营养盐</span><span class="cp-info-val" id="info-nutri">—</span></div>
    `;
    document.body.appendChild(this.infoPanel);
  }

  private bindEvents(): void {
    const sCur = this.container.querySelector('#slider-current') as HTMLInputElement;
    const sLight = this.container.querySelector('#slider-light') as HTMLInputElement;
    const sNut = this.container.querySelector('#slider-nutrient') as HTMLInputElement;
    const vCur = this.container.querySelector('#val-current') as HTMLElement;
    const vLight = this.container.querySelector('#val-light') as HTMLElement;
    const vNut = this.container.querySelector('#val-nutrient') as HTMLElement;
    const btnReset = this.container.querySelector('#btn-reset') as HTMLButtonElement;
    const btnAuto = this.container.querySelector('#btn-auto') as HTMLButtonElement;

    const emit = () => {
      this.params.currentSpeed = parseFloat(sCur.value);
      this.params.lightIntensity = parseFloat(sLight.value);
      this.params.nutrientLevel = parseFloat(sNut.value);
      vCur.textContent = this.params.currentSpeed.toFixed(1);
      vLight.textContent = this.params.lightIntensity.toFixed(0) + '%';
      vNut.textContent = this.params.nutrientLevel.toFixed(0) + '%';
      this.updateTargetScore();
      this.callbacks.onParamsChange({ ...this.params });
    };

    sCur.addEventListener('input', emit);
    sLight.addEventListener('input', emit);
    sNut.addEventListener('input', emit);

    btnReset.addEventListener('click', () => {
      sCur.value = '2.0';
      sLight.value = '65';
      sNut.value = '55';
      emit();
    });

    btnAuto.addEventListener('click', () => {
      if (this.autoTimer) {
        clearInterval(this.autoTimer);
        this.autoTimer = null;
        btnAuto.textContent = '自动模式';
        btnAuto.classList.remove('active-auto');
        return;
      }
      btnAuto.textContent = '停止自动';
      btnAuto.classList.add('active-auto');
      let t = 0;
      this.autoTimer = window.setInterval(() => {
        t += 0.025;
        sCur.value = String((2 + Math.sin(t * 0.75) * 1.8).toFixed(1));
        sLight.value = String(Math.round(65 + Math.sin(t * 1.15) * 28));
        sNut.value = String(Math.round(55 + Math.cos(t * 0.95) * 28));
        emit();
      }, 70);
    });

    emit();
  }

  private updateTargetScore(): void {
    const light = this.params.lightIntensity / 100;
    const nutrient = this.params.nutrientLevel / 100;
    const current = this.params.currentSpeed / 5;

    const lScore = 1 - Math.abs(light - 0.65) * 1.3;
    const nScore = 1 - Math.abs(nutrient - 0.55) * 1.4;
    const cScore = 1 - Math.abs(current - 0.4) * 1.2;

    const total = Math.max(20, Math.min(100, Math.round(lScore * 35 + nScore * 35 + cScore * 30)));
    this.targetScore = total;
  }

  public setFPS(fps: number): void {
    if (!this.fpsDisplay) return;
    const rounded = Math.round(fps);
    this.fpsDisplay.textContent = String(rounded);
    if (rounded >= 50) {
      this.fpsDisplay.style.color = '#6ee7ff';
      this.fpsDisplay.style.textShadow = '0 0 12px rgba(0, 229, 255, 0.6)';
    } else if (rounded >= 30) {
      this.fpsDisplay.style.color = '#ffd66e';
      this.fpsDisplay.style.textShadow = '0 0 12px rgba(255, 214, 110, 0.55)';
    } else {
      this.fpsDisplay.style.color = '#ff7b7b';
      this.fpsDisplay.style.textShadow = '0 0 12px rgba(255, 123, 123, 0.6)';
    }
  }

  public updateScore(dt: number): void {
    if (this.currentScore !== this.targetScore) {
      const diff = this.targetScore - this.currentScore;
      this.currentScore += diff * Math.min(1, dt * 3.5);
    }
    const display = Math.round(this.currentScore);
    if (display !== this.lastDisplayedScore) {
      this.lastDisplayedScore = display;
      if (this.scoreDisplay) this.scoreDisplay.textContent = String(display);
      if (this.scoreRing) this.scoreRing.style.setProperty('--score-pct', display + '%');
    }
  }

  public updateInfoPanel(
    info: { coralDensity: number; temperature: number; nutrients: number; position: THREE.Vector3 } | null,
    camera: THREE.Camera,
    rendererSize: THREE.Vector2,
  ): void {
    if (!this.infoPanel) return;
    const densityEl = this.infoPanel.querySelector('#info-density') as HTMLElement;
    const tempEl = this.infoPanel.querySelector('#info-temp') as HTMLElement;
    const nutriEl = this.infoPanel.querySelector('#info-nutri') as HTMLElement;

    if (!info) {
      this.infoPanel.classList.remove('visible');
      return;
    }

    densityEl.textContent = info.coralDensity.toFixed(1) + ' /km²';
    tempEl.textContent = info.temperature.toFixed(1) + ' °C';
    nutriEl.textContent = info.nutrients.toFixed(0) + ' %';

    const v = info.position.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * rendererSize.x;
    const y = (-v.y * 0.5 + 0.5) * rendererSize.y;

    const panelW = 210;
    const panelH = 140;
    const margin = 16;

    let left = x + 24;
    let top = y - panelH / 2;

    if (left + panelW > window.innerWidth - margin) {
      left = x - panelW - 24;
    }
    if (left < margin) left = margin;
    if (top < margin) top = margin;
    if (top + panelH > window.innerHeight - margin) {
      top = window.innerHeight - panelH - margin;
    }

    this.infoPanel.style.left = left + 'px';
    this.infoPanel.style.top = top + 'px';
    this.infoPanel.classList.add('visible');
  }
}

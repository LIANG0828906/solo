import { EnvParams } from './SceneInitializer';

export interface ControlPanelCallbacks {
  onParamsChange: (params: EnvParams) => void;
}

export class ControlPanel {
  private container: HTMLElement;
  private callbacks: ControlPanelCallbacks;
  public params: EnvParams = {
    currentSpeed: 2.0,
    lightIntensity: 60,
    nutrientLevel: 55,
  };

  private fpsDisplay!: HTMLElement;
  private scoreDisplay!: HTMLElement;
  private scoreRing!: HTMLElement;
  private infoPanel!: HTMLElement;
  private infoPanelTimer = 0;
  private currentScore = 72;
  private targetScore = 72;
  private lastDisplayedScore = -1;

  constructor(callbacks: ControlPanelCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement('div');
    this.buildPanel();
    this.buildStatsPanel();
    document.body.appendChild(this.container);
  }

  private buildPanel(): void {
    this.container.id = 'control-panel';
    this.container.innerHTML = `
      <style>
        #control-panel {
          position: fixed;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 300px;
          padding: 28px 24px;
          border-radius: 18px;
          background: rgba(10, 30, 60, 0.35);
          backdrop-filter: blur(20px) saturate(1.6);
          -webkit-backdrop-filter: blur(20px) saturate(1.6);
          border: 1px solid rgba(0, 229, 255, 0.25);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05),
            0 0 40px rgba(0, 180, 255, 0.08);
          z-index: 100;
          font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
          color: rgba(255, 255, 255, 0.92);
          transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        #control-panel::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 19px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.55), rgba(0, 100, 255, 0.15) 40%, transparent 70%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          opacity: 0.8;
        }
        #control-panel:hover {
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.35),
            inset 0 0 0 1px rgba(255, 255, 255, 0.08),
            0 0 60px rgba(0, 200, 255, 0.15);
          border-color: rgba(0, 229, 255, 0.4);
        }
        .cp-header {
          margin-bottom: 22px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 229, 255, 0.12);
        }
        .cp-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 2px;
          margin-bottom: 4px;
          background: linear-gradient(90deg, #ffffff, #6ee7ff 80%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cp-subtitle {
          font-size: 11px;
          letter-spacing: 3px;
          color: rgba(110, 231, 255, 0.5);
          text-transform: uppercase;
        }
        .cp-group {
          margin-bottom: 20px;
        }
        .cp-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .cp-label {
          font-size: 12px;
          letter-spacing: 1.5px;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cp-label-icon {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        .cp-value {
          font-size: 13px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: #6ee7ff;
          text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
        }
        .cp-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 4px;
          background: linear-gradient(90deg, rgba(0, 229, 255, 0.7), rgba(100, 150, 255, 0.3));
          outline: none;
          cursor: pointer;
          position: relative;
        }
        .cp-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffffff, #6ee7ff 60%, #00a8cc);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.15), 0 0 16px rgba(0, 229, 255, 0.6);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .cp-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 0 5px rgba(0, 229, 255, 0.2), 0 0 24px rgba(0, 229, 255, 0.8);
        }
        .cp-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ffffff, #6ee7ff 60%, #00a8cc);
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.15), 0 0 16px rgba(0, 229, 255, 0.6);
        }
        .cp-buttons {
          display: flex;
          gap: 10px;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid rgba(0, 229, 255, 0.12);
        }
        .cp-btn {
          flex: 1;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1px solid rgba(0, 229, 255, 0.3);
          background: rgba(0, 229, 255, 0.08);
          color: rgba(255, 255, 255, 0.9);
          font-size: 12px;
          letter-spacing: 1.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .cp-btn:hover {
          background: rgba(0, 229, 255, 0.18);
          border-color: rgba(0, 229, 255, 0.6);
          box-shadow: 0 0 20px rgba(0, 229, 255, 0.3), inset 0 0 20px rgba(0, 229, 255, 0.08);
          transform: translateY(-1px);
        }
        .cp-btn:active {
          transform: translateY(0);
        }
        .cp-btn-primary {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.3), rgba(80, 150, 255, 0.2));
        }
        .cp-info {
          position: fixed;
          z-index: 150;
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(10, 30, 60, 0.7);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(0, 229, 255, 0.35);
          box-shadow: 0 0 30px rgba(0, 229, 255, 0.25);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.95);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
          min-width: 180px;
        }
        .cp-info.visible { opacity: 1; }
        .cp-info-title {
          font-size: 11px;
          letter-spacing: 2px;
          color: #6ee7ff;
          margin-bottom: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .cp-info-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px solid rgba(0, 229, 255, 0.08);
        }
        .cp-info-row:last-child { border-bottom: none; }
        .cp-info-label { color: rgba(255, 255, 255, 0.6); letter-spacing: 1px; }
        .cp-info-val { font-weight: 600; color: #fff; font-variant-numeric: tabular-nums; }
      </style>
      <div class="cp-header">
        <div class="cp-title">生态控制台</div>
        <div class="cp-subtitle">ENVIRONMENT CONTROL</div>
      </div>
      <div class="cp-group" data-group="current">
        <div class="cp-group-header">
          <div class="cp-label">
            <span class="cp-label-icon" style="background: rgba(0,200,255,0.2);">🌊</span>
            洋流速度
          </div>
          <div class="cp-value" id="val-current">2.0</div>
        </div>
        <input type="range" class="cp-slider" id="slider-current" min="0" max="5" step="0.1" value="2.0" />
      </div>
      <div class="cp-group" data-group="light">
        <div class="cp-group-header">
          <div class="cp-label">
            <span class="cp-label-icon" style="background: rgba(255,220,100,0.2);">☀️</span>
            光照强度
          </div>
          <div class="cp-value" id="val-light">60%</div>
        </div>
        <input type="range" class="cp-slider" id="slider-light" min="5" max="100" step="1" value="60" />
      </div>
      <div class="cp-group" data-group="nutrient">
        <div class="cp-group-header">
          <div class="cp-label">
            <span class="cp-label-icon" style="background: rgba(180,255,150,0.15);">🧪</span>
            营养盐浓度
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

    this.infoPanel = document.createElement('div');
    this.infoPanel.className = 'cp-info';
    this.infoPanel.innerHTML = `
      <div class="cp-info-title">区域生态数据</div>
      <div class="cp-info-row"><span class="cp-info-label">珊瑚密度</span><span class="cp-info-val" id="info-density">—</span></div>
      <div class="cp-info-row"><span class="cp-info-label">水温</span><span class="cp-info-val" id="info-temp">—</span></div>
      <div class="cp-info-row"><span class="cp-info-label">营养盐</span><span class="cp-info-val" id="info-nutri">—</span></div>
    `;
    document.body.appendChild(this.infoPanel);

    this.bindEvents();
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
          gap: 16px;
          padding: 14px 20px;
          border-radius: 16px;
          background: rgba(10, 30, 60, 0.32);
          backdrop-filter: blur(18px) saturate(1.5);
          -webkit-backdrop-filter: blur(18px) saturate(1.5);
          border: 1px solid rgba(0, 229, 255, 0.22);
          box-shadow: 0 0 35px rgba(0, 180, 255, 0.1);
          z-index: 100;
          font-family: 'Segoe UI', 'PingFang SC', sans-serif;
        }
        .stat-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 60px;
        }
        .stat-label {
          font-size: 9px;
          letter-spacing: 2px;
          color: rgba(110, 231, 255, 0.6);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        #fps-val {
          font-size: 22px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #6ee7ff;
          text-shadow: 0 0 10px rgba(0, 229, 255, 0.55);
          line-height: 1;
        }
        .score-wrap {
          position: relative;
          width: 54px;
          height: 54px;
        }
        #score-ring {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: conic-gradient(#00e5ff 0%, #6688ff var(--score-pct, 72%), rgba(255,255,255,0.08) var(--score-pct, 72%));
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.5s ease;
          box-shadow: 0 0 18px rgba(0, 229, 255, 0.3);
        }
        #score-ring::before {
          content: '';
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(10, 30, 60, 0.9);
          position: absolute;
        }
        #score-val {
          position: relative;
          z-index: 1;
          font-size: 18px;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          color: #fff;
          line-height: 1;
        }
        .stat-sep {
          width: 1px;
          height: 36px;
          background: linear-gradient(180deg, transparent, rgba(0, 229, 255, 0.3), transparent);
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
      sCur.value = '2'; sLight.value = '60'; sNut.value = '55'; emit();
    });

    let autoTimer: number | null = null;
    btnAuto.addEventListener('click', () => {
      if (autoTimer) {
        clearInterval(autoTimer); autoTimer = null;
        btnAuto.textContent = '自动模式';
        btnAuto.style.background = '';
        return;
      }
      btnAuto.textContent = '停止自动';
      btnAuto.style.background = 'linear-gradient(135deg, rgba(100,255,200,0.25), rgba(0,229,255,0.25))';
      let t = 0;
      autoTimer = window.setInterval(() => {
        t += 0.02;
        sCur.value = String((2 + Math.sin(t * 0.7) * 1.5).toFixed(1));
        sLight.value = String(Math.round(60 + Math.sin(t * 1.1) * 30));
        sNut.value = String(Math.round(55 + Math.cos(t * 0.9) * 30));
        emit();
      }, 80);
    });

    emit();
  }

  private updateTargetScore(): void {
    const light = this.params.lightIntensity / 100;
    const nutri = this.params.nutrientLevel / 100;
    const cur = this.params.currentSpeed / 5;
    const lScore = 1 - Math.abs(light - 0.65) * 1.3;
    const nScore = 1 - Math.abs(nutri - 0.55) * 1.4;
    const cScore = 1 - Math.abs(cur - 0.4) * 1.2;
    const total = Math.max(20, Math.min(100, Math.round((lScore * 35 + nScore * 35 + cScore * 30))));
    this.targetScore = total;
  }

  public setFPS(fps: number): void {
    if (!this.fpsDisplay) return;
    const rounded = Math.round(fps);
    this.fpsDisplay.textContent = String(rounded);
    this.fpsDisplay.style.color = rounded >= 50 ? '#6ee7ff' : rounded >= 30 ? '#ffd66e' : '#ff7b7b';
  }

  public updateScore(dt: number): void {
    if (this.currentScore !== this.targetScore) {
      const diff = this.targetScore - this.currentScore;
      this.currentScore += diff * Math.min(1, dt * 3);
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
      this.infoPanelTimer = 0;
      return;
    }
    densityEl.textContent = info.coralDensity.toFixed(1) + ' /k㎡';
    tempEl.textContent = info.temperature.toFixed(1) + ' °C';
    nutriEl.textContent = info.nutrients.toFixed(0) + ' %';

    const v = info.position.clone().project(camera);
    const x = (v.x * 0.5 + 0.5) * rendererSize.x;
    const y = (-v.y * 0.5 + 0.5) * rendererSize.y;
    this.infoPanel.style.left = Math.min(window.innerWidth - 220, Math.max(10, x + 20)) + 'px';
    this.infoPanel.style.top = Math.min(window.innerHeight - 140, Math.max(10, y - 60)) + 'px';
    this.infoPanel.classList.add('visible');
  }
}

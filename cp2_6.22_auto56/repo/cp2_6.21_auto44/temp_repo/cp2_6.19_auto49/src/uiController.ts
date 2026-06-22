import * as TWEEN from '@tweenjs/tween.js';
import { WeatherType, TimeOfDay } from './environmentManager';

export interface UICallbacks {
  onToggleDayNight: () => void;
  onWeatherChange: (weather: WeatherType) => void;
  onRequestFps: () => number;
}

export class UIController {
  private container: HTMLElement;
  private callbacks: UICallbacks;

  private fpsDisplay: HTMLElement;
  private timeDisplay: HTMLElement;
  private dayNightBtn: HTMLElement;
  private dayNightIcon: HTMLElement;
  private weatherSelect: HTMLSelectElement;

  private lastFpsUpdate = 0;
  private isNight = false;
  private currentWeather: WeatherType = 'sunny';

  constructor(container: HTMLElement, callbacks: UICallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.injectStyles();
    this.fpsDisplay = this.createFpsDisplay();
    this.timeDisplay = this.createTimeDisplay();
    this.dayNightBtn = this.createDayNightButton();
    this.dayNightIcon = this.dayNightBtn.querySelector('.dn-icon') as HTMLElement;
    this.weatherSelect = this.createWeatherSelect();

    this.startUpdateLoop();
  }

  private injectStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .ui-panel {
        position: fixed;
        z-index: 100;
        pointer-events: auto;
        user-select: none;
        -webkit-user-select: none;
      }

      .ui-top-left {
        top: 20px;
        left: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .ui-top-right {
        top: 20px;
        right: 20px;
      }

      .ui-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .info-box {
        background: rgba(26, 26, 46, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: #e0e0e0;
        padding: 10px 18px;
        border-radius: 10px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        border: 1px solid rgba(74, 144, 217, 0.2);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        min-width: 140px;
      }

      .info-box:hover {
        transform: scale(1.03);
        border-color: rgba(74, 144, 217, 0.5);
      }

      .info-label {
        font-size: 11px;
        color: #888899;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 2px;
      }

      .info-value {
        font-size: 18px;
        font-weight: 600;
        background: linear-gradient(135deg, #4a90d9, #6f42c1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .fps-low .info-value {
        background: linear-gradient(135deg, #ff6b6b, #ff4444);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .day-night-btn {
        position: relative;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: rgba(26, 26, 46, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 2px solid rgba(74, 144, 217, 0.4);
        color: #e0e0e0;
        font-size: 26px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                    border-color 0.3s,
                    box-shadow 0.3s;
        overflow: hidden;
      }

      .day-night-btn:hover {
        transform: scale(1.1);
        border-color: rgba(111, 66, 193, 0.6);
        box-shadow: 0 6px 30px rgba(74, 144, 217, 0.3);
      }

      .day-night-btn:active {
        transform: scale(0.95);
      }

      .dn-icon {
        transition: transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .dn-icon.rotated {
        transform: rotate(180deg);
      }

      .ripple {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(74, 144, 217, 0.5), transparent);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
      }

      @keyframes ripple-animation {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }

      .weather-container {
        position: relative;
      }

      .weather-select {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        background: rgba(26, 26, 46, 0.85);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: #e0e0e0;
        padding: 12px 42px 12px 18px;
        border-radius: 12px;
        border: 1px solid rgba(74, 144, 217, 0.3);
        font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3),
                    inset 0 1px 0 rgba(255, 255, 255, 0.05);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
                    border-color 0.3s,
                    box-shadow 0.3s;
        min-width: 140px;
        outline: none;
      }

      .weather-select:hover {
        transform: scale(1.03);
        border-color: rgba(111, 66, 193, 0.6);
        box-shadow: 0 6px 25px rgba(74, 144, 217, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .weather-select:focus {
        border-color: rgba(74, 144, 217, 0.8);
      }

      .weather-select option {
        background: #1a1a2e;
        color: #e0e0e0;
        padding: 10px;
      }

      .weather-arrow {
        position: absolute;
        right: 14px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: #4a90d9;
        font-size: 12px;
        transition: transform 0.3s;
      }

      .weather-container.open .weather-arrow {
        transform: translateY(-50%) rotate(180deg);
      }

      .controls-hint {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(26, 26, 46, 0.7);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        color: #9999aa;
        padding: 10px 16px;
        border-radius: 10px;
        font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
        font-size: 12px;
        line-height: 1.6;
        border: 1px solid rgba(74, 144, 217, 0.15);
        pointer-events: none;
        z-index: 100;
      }

      .controls-hint kbd {
        background: linear-gradient(135deg, #4a90d9, #6f42c1);
        color: white;
        padding: 1px 7px;
        border-radius: 4px;
        font-family: 'Consolas', monospace;
        font-size: 11px;
        margin: 0 2px;
      }

      @media (max-width: 1440px) {
        .ui-top-left { top: 15px; left: 15px; gap: 8px; }
        .ui-top-right { top: 15px; right: 15px; }
        .ui-bottom-left { bottom: 15px; left: 15px; }
        .controls-hint { bottom: 15px; right: 15px; font-size: 11px; }
        .info-box { padding: 8px 14px; font-size: 13px; }
        .info-value { font-size: 16px; }
        .day-night-btn { width: 48px; height: 48px; font-size: 22px; }
      }

      @media (max-width: 768px) {
        .controls-hint { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  private createFpsDisplay(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'ui-panel ui-top-left';
    div.innerHTML = `
      <div class="info-box" id="fps-box">
        <div class="info-label">FPS</div>
        <div class="info-value" id="fps-value">--</div>
      </div>
    `;
    this.container.appendChild(div);
    return div;
  }

  private createTimeDisplay(): HTMLElement {
    const wrap = this.container.querySelector('.ui-top-left') as HTMLElement;
    const div = document.createElement('div');
    div.className = 'info-box';
    div.innerHTML = `
      <div class="info-label">时间</div>
      <div class="info-value" id="time-value">--:--</div>
    `;
    wrap.appendChild(div);
    return div.querySelector('#time-value') as HTMLElement;
  }

  private createDayNightButton(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'ui-panel ui-top-right';
    div.innerHTML = `
      <button class="day-night-btn" id="dn-btn" title="切换日夜模式">
        <span class="dn-icon">☀️</span>
      </button>
    `;
    this.container.appendChild(div);

    const btn = div.querySelector('#dn-btn') as HTMLElement;
    btn.addEventListener('click', (e) => {
      this.createRipple(btn, e);
      this.toggleDayNight();
    });
    btn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    return btn;
  }

  private createWeatherSelect(): HTMLSelectElement {
    const div = document.createElement('div');
    div.className = 'ui-panel ui-bottom-left';
    div.innerHTML = `
      <div class="weather-container" id="weather-wrap">
        <select class="weather-select" id="weather-select">
          <option value="sunny">☀️ 晴天</option>
          <option value="rainy">🌧️ 雨天</option>
          <option value="snowy">❄️ 雪天</option>
        </select>
        <span class="weather-arrow">▼</span>
      </div>
    `;
    this.container.appendChild(div);

    const select = div.querySelector('#weather-select') as HTMLSelectElement;
    const wrap = div.querySelector('#weather-wrap') as HTMLElement;

    select.addEventListener('change', () => {
      this.currentWeather = select.value as WeatherType;
      this.callbacks.onWeatherChange(this.currentWeather);
    });

    select.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      wrap.classList.toggle('open');
    });

    select.addEventListener('blur', () => {
      wrap.classList.remove('open');
    });

    select.addEventListener('mouseleave', () => {
      setTimeout(() => wrap.classList.remove('open'), 200);
    });

    return select;
  }

  private createRipple(element: HTMLElement, event: MouseEvent): void {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }

  private toggleDayNight(): void {
    this.isNight = !this.isNight;
    this.dayNightIcon.textContent = this.isNight ? '🌙' : '☀️';
    this.dayNightIcon.classList.toggle('rotated');
    this.callbacks.onToggleDayNight();
  }

  private startUpdateLoop(): void {
    const update = () => {
      const now = performance.now();

      if (now - this.lastFpsUpdate >= 500) {
        this.updateFps();
        this.updateTime();
        this.lastFpsUpdate = now;
      }

      requestAnimationFrame(update);
    };
    update();
  }

  private updateFps(): void {
    const fps = this.callbacks.onRequestFps();
    const fpsValue = this.fpsDisplay.querySelector('#fps-value') as HTMLElement;
    const fpsBox = this.fpsDisplay.querySelector('#fps-box') as HTMLElement;

    if (fpsValue) {
      fpsValue.textContent = fps.toFixed(0);
    }

    if (fpsBox) {
      if (fps < 30) {
        fpsBox.classList.add('fps-low');
      } else {
        fpsBox.classList.remove('fps-low');
      }
    }
  }

  private updateTime(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    this.timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
  }

  public setTimeOfDay(isNight: boolean): void {
    if (this.isNight !== isNight) {
      this.isNight = isNight;
      this.dayNightIcon.textContent = this.isNight ? '🌙' : '☀️';
      this.dayNightIcon.classList.toggle('rotated', this.isNight);
    }
  }

  public setWeather(weather: WeatherType): void {
    if (this.currentWeather !== weather) {
      this.currentWeather = weather;
      this.weatherSelect.value = weather;
    }
  }

  public createControlsHint(): void {
    const div = document.createElement('div');
    div.className = 'controls-hint';
    div.innerHTML = `
      <div><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动</div>
      <div><kbd>Shift</kbd> 加速</div>
      <div>🖱️ 拖拽 旋转视角</div>
    `;
    this.container.appendChild(div);
  }
}

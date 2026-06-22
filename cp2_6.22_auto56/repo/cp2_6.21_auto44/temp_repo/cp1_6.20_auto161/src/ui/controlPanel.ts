import { SculptureType, DEFAULT_PARAMS } from '../scene/sculpture';

export interface ControlPanelCallbacks {
  onSculptureChange: (type: SculptureType) => void;
  onParamChange: (param: string, value: number) => void;
  onRotationSpeedChange: (speed: number) => void;
}

interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'twist', label: '扭曲度', min: 0, max: 5, step: 0.01, defaultValue: DEFAULT_PARAMS.twist },
  { key: 'inflation', label: '膨胀系数', min: 0.5, max: 2.0, step: 0.01, defaultValue: DEFAULT_PARAMS.inflation },
  { key: 'branches', label: '分支数量', min: 3, max: 12, step: 1, defaultValue: DEFAULT_PARAMS.branches },
  { key: 'rotationSpeed', label: '旋转速度', min: 0.1, max: 2.0, step: 0.01, defaultValue: 1.0 },
  { key: 'opacity', label: '透明度', min: 0.2, max: 1.0, step: 0.01, defaultValue: 0.82 },
];

const SCULPTURE_OPTIONS: { type: SculptureType; label: string }[] = [
  { type: 'torusKnot', label: '环面结' },
  { type: 'spiralBranch', label: '螺旋分支' },
  { type: 'fractalTree', label: '分形树' },
];

const STYLE_TEXT = `
.panel-root {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 320px;
  max-height: calc(100vh - 48px - 80px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: rgba(30, 30, 46, 0.72);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  z-index: 100;
  overflow-y: auto;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
}
.panel-root::-webkit-scrollbar { width: 6px; }
.panel-root::-webkit-scrollbar-track { background: transparent; }
.panel-root::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
.section { display: flex; flex-direction: column; gap: 12px; }
.section-title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}
.morph-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.morph-btn {
  flex: 1;
  min-width: 86px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}
.morph-btn:hover {
  background: rgba(123, 47, 247, 0.2);
  border-color: rgba(123, 47, 247, 0.5);
  transform: translateY(-1px);
}
.morph-btn.active {
  background: linear-gradient(135deg, rgba(0, 210, 255, 0.3), rgba(123, 47, 247, 0.35));
  border-color: rgba(0, 210, 255, 0.6);
  box-shadow: 0 0 16px rgba(0, 210, 255, 0.18);
}
.slider-wrap { display: flex; flex-direction: column; gap: 6px; }
.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.slider-label { color: rgba(255, 255, 255, 0.75); font-weight: 500; }
.slider-value {
  color: #00d2ff;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  min-width: 44px;
  text-align: right;
}
.slider-track {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  cursor: pointer;
}
.slider-fill {
  position: absolute;
  top: 0; left: 0; bottom: 0;
  background: linear-gradient(90deg, #00d2ff, #7b2ff7);
  border-radius: 999px;
  pointer-events: none;
  box-shadow: 0 0 8px rgba(0, 210, 255, 0.35);
}
.slider-thumb {
  position: absolute;
  top: 50%;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.4);
  cursor: grab;
  transition: box-shadow 0.2s ease, transform 0.1s ease;
  pointer-events: none;
}
.slider-track:hover .slider-thumb,
.slider-track.active .slider-thumb {
  box-shadow: 0 0 0 4px rgba(0, 210, 255, 0.5), 0 2px 12px rgba(0, 210, 255, 0.45);
}
.slider-track.active .slider-thumb { cursor: grabbing; transform: translate(-50%, -50%) scale(1.12); }
.slider-thumb::after {
  content: '';
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d2ff, #7b2ff7);
}
.bottom-bar {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 100;
}
.export-btn {
  position: relative;
  overflow: hidden;
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, rgba(0, 210, 255, 0.85), rgba(123, 47, 247, 0.9));
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(123, 47, 247, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(123, 47, 247, 0.48);
}
.export-btn:active { transform: translateY(0); }
.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  transform: scale(0);
  animation: rippleAnim 0.7s ease-out;
  pointer-events: none;
}
@keyframes rippleAnim {
  to { transform: scale(4.5); opacity: 0; }
}
@media (max-width: 768px) {
  .panel-root {
    top: auto;
    right: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    max-height: 55vh;
    padding: 18px;
    border-radius: 20px 20px 0 0;
    transform: translateY(calc(100% - 72px));
  }
  .panel-root.expanded { transform: translateY(0); }
  .panel-root::before {
    content: '';
    position: absolute;
    top: 10px; left: 50%;
    transform: translateX(-50%);
    width: 44px; height: 5px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 999px;
    cursor: pointer;
  }
  .bottom-bar {
    bottom: calc(55vh - 48px);
    width: calc(100% - 32px);
    justify-content: center;
    transition: bottom 0.3s ease;
  }
  .panel-root.expanded ~ .bottom-bar { bottom: calc(55vh + 16px); }
}
`;

export class ControlPanel {
  private container: HTMLElement;
  private panel: HTMLDivElement;
  private bottomBar: HTMLDivElement;
  private callbacks: ControlPanelCallbacks;
  private sliderValues: Map<string, number> = new Map();
  private currentType: SculptureType = 'torusKnot';
  private pendingAnimationFrame: number | null = null;
  private opacityCallback: ((value: number) => void) | null = null;

  constructor(container: HTMLElement, callbacks: ControlPanelCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.injectStyles();
    this.panel = this.createPanel();
    this.bottomBar = this.createBottomBar();
    this.container.appendChild(this.panel);
    this.container.appendChild(this.bottomBar);
    this.setupMobileToggle();
  }

  private injectStyles(): void {
    if (document.getElementById('sculpture-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'sculpture-panel-styles';
    style.textContent = STYLE_TEXT;
    document.head.appendChild(style);
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'panel-root';

    const morphSection = document.createElement('div');
    morphSection.className = 'section';
    const morphTitle = document.createElement('div');
    morphTitle.className = 'section-title';
    morphTitle.textContent = '形态选择';
    const morphButtons = document.createElement('div');
    morphButtons.className = 'morph-buttons';

    SCULPTURE_OPTIONS.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'morph-btn' + (opt.type === this.currentType ? ' active' : '');
      btn.textContent = opt.label;
      btn.dataset.type = opt.type;
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        this.currentType = opt.type;
        morphButtons.querySelectorAll('.morph-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.callbacks.onSculptureChange(opt.type);
      });
      morphButtons.appendChild(btn);
    });

    morphSection.appendChild(morphTitle);
    morphSection.appendChild(morphButtons);

    const paramsSection = document.createElement('div');
    paramsSection.className = 'section';
    const paramsTitle = document.createElement('div');
    paramsTitle.className = 'section-title';
    paramsTitle.textContent = '参数控制';
    paramsSection.appendChild(paramsTitle);

    SLIDERS.forEach((config) => {
      this.sliderValues.set(config.key, config.defaultValue);
      const slider = this.createSlider(config);
      paramsSection.appendChild(slider);
    });

    panel.appendChild(morphSection);
    panel.appendChild(paramsSection);
    return panel;
  }

  private createSlider(config: SliderConfig): HTMLDivElement {
    const wrap = document.createElement('div');
    wrap.className = 'slider-wrap';

    const header = document.createElement('div');
    header.className = 'slider-header';
    const label = document.createElement('span');
    label.className = 'slider-label';
    label.textContent = config.label;
    const valueEl = document.createElement('span');
    valueEl.className = 'slider-value';
    valueEl.textContent = this.formatValue(config.defaultValue, config.step);
    header.appendChild(label);
    header.appendChild(valueEl);

    const track = document.createElement('div');
    track.className = 'slider-track';
    track.dataset.key = config.key;

    const fill = document.createElement('div');
    fill.className = 'slider-fill';
    const thumb = document.createElement('div');
    thumb.className = 'slider-thumb';

    const pct = ((config.defaultValue - config.min) / (config.max - config.min)) * 100;
    fill.style.width = `${pct}%`;
    thumb.style.left = `${pct}%`;

    track.appendChild(fill);
    track.appendChild(thumb);

    let isDragging = false;

    const updateFromPointer = (clientX: number): void => {
      const rect = track.getBoundingClientRect();
      let ratio = (clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      const raw = config.min + ratio * (config.max - config.min);
      const stepped = Math.round(raw / config.step) * config.step;
      const value = Math.max(config.min, Math.min(config.max, stepped));
      this.sliderValues.set(config.key, value);
      const newPct = ((value - config.min) / (config.max - config.min)) * 100;
      fill.style.width = `${newPct}%`;
      thumb.style.left = `${newPct}%`;
      valueEl.textContent = this.formatValue(value, config.step);
      this.scheduleParamUpdate(config.key, value);
    };

    track.addEventListener('pointerdown', (e) => {
      isDragging = true;
      track.classList.add('active');
      (track as HTMLElement).setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX);
    });

    track.addEventListener('pointermove', (e) => {
      if (isDragging) updateFromPointer(e.clientX);
    });

    track.addEventListener('pointerup', (e) => {
      isDragging = false;
      track.classList.remove('active');
      try { (track as HTMLElement).releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });

    track.addEventListener('pointercancel', () => {
      isDragging = false;
      track.classList.remove('active');
    });

    wrap.appendChild(header);
    wrap.appendChild(track);
    return wrap;
  }

  private formatValue(value: number, step: number): string {
    if (step >= 1) return `${Math.round(value)}`;
    const decimals = step < 0.05 ? 2 : 1;
    return value.toFixed(decimals);
  }

  private scheduleParamUpdate(key: string, value: number): void {
    if (this.pendingAnimationFrame !== null) {
      cancelAnimationFrame(this.pendingAnimationFrame);
    }
    this.pendingAnimationFrame = requestAnimationFrame(() => {
      this.pendingAnimationFrame = null;
      if (key === 'rotationSpeed') {
        this.callbacks.onRotationSpeedChange(value);
      } else if (key === 'opacity') {
        if (this.opacityCallback) this.opacityCallback(value);
      } else {
        this.callbacks.onParamChange(key, value);
      }
    });
  }

  private createBottomBar(): HTMLDivElement {
    const bar = document.createElement('div');
    bar.className = 'bottom-bar';
    const exportBtn = document.createElement('button');
    exportBtn.className = 'export-btn';
    exportBtn.id = 'export-screenshot-btn';
    exportBtn.textContent = '📷 导出截图';

    exportBtn.addEventListener('click', (e) => {
      const rect = exportBtn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      const clickX = (e as MouseEvent).clientX - rect.left - size / 2;
      const clickY = (e as MouseEvent).clientY - rect.top - size / 2;
      ripple.style.left = `${clickX}px`;
      ripple.style.top = `${clickY}px`;
      exportBtn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 750);
    });

    bar.appendChild(exportBtn);
    return bar;
  }

  private setupMobileToggle(): void {
    const toggle = (): void => {
      this.panel.classList.toggle('expanded');
    };
    let touchStartY = 0;
    this.panel.addEventListener('click', (e) => {
      if (window.innerWidth > 768) return;
      const rect = this.panel.getBoundingClientRect();
      if (e.clientY < rect.top + 44) toggle();
    });
    this.panel.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    this.panel.addEventListener('touchend', (e) => {
      if (window.innerWidth > 768) return;
      const touchEndY = e.changedTouches[0].clientY;
      const rect = this.panel.getBoundingClientRect();
      if (touchStartY < rect.top + 44) {
        const diff = touchEndY - touchStartY;
        if (Math.abs(diff) < 10) toggle();
        else if (diff < -20) this.panel.classList.add('expanded');
        else if (diff > 20) this.panel.classList.remove('expanded');
      }
    }, { passive: true });
  }

  setOpacityCallback(callback: (value: number) => void): void {
    this.opacityCallback = callback;
  }

  setActiveSculpture(type: SculptureType): void {
    this.currentType = type;
    const btns = this.panel.querySelectorAll('.morph-btn');
    btns.forEach((btn) => {
      if ((btn as HTMLElement).dataset.type === type) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  getExportButton(): HTMLButtonElement | null {
    return this.bottomBar.querySelector('#export-screenshot-btn');
  }

  destroy(): void {
    if (this.pendingAnimationFrame !== null) {
      cancelAnimationFrame(this.pendingAnimationFrame);
    }
    this.panel.remove();
    this.bottomBar.remove();
  }
}

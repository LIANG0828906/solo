import { BuildingParams } from '../core/buildingGenerator';
import { ColorTheme, THEME_LIST, hexToString, stringToHex } from '../utils/colorTheme';

export interface ControlPanelCallbacks {
  onBuildingChange: (params: BuildingParams) => void;
  onThemeChange: (theme: ColorTheme) => void;
  onTimeChange: (hour: number) => void;
  onAutoRotate: (enabled: boolean) => void;
}

interface ControlState {
  density: number;
  minHeight: number;
  maxHeight: number;
  minBase: number;
  maxBase: number;
  themeName: string;
  customBuilding: string;
  customWindows: string;
  customGround: string;
  hour: number;
  autoRotate: boolean;
}

const DEFAULTS: ControlState = {
  density: 30,
  minHeight: 10,
  maxHeight: 150,
  minBase: 5,
  maxBase: 20,
  themeName: 'sunsetGold',
  customBuilding: '#8b5a3c',
  customWindows: '#ffc857',
  customGround: '#2d1f3d',
  hour: 17,
  autoRotate: false
};

let state: ControlState = { ...DEFAULTS };
let callbacks: ControlPanelCallbacks | null = null;
let rebuildTimer: number | null = null;
let panelRoot: HTMLElement | null = null;

function scheduleRebuild(): void {
  if (rebuildTimer !== null) {
    cancelAnimationFrame(rebuildTimer);
  }
  rebuildTimer = requestAnimationFrame(() => {
    if (!callbacks) return;
    callbacks.onBuildingChange({
      density: state.density,
      minHeight: state.minHeight,
      maxHeight: state.maxHeight,
      minBase: state.minBase,
      maxBase: state.maxBase
    });
    rebuildTimer = null;
  });
}

function getCurrentTheme(): ColorTheme {
  const preset = THEME_LIST.find((t) => t.name === state.themeName);
  if (preset) {
    state.customBuilding = hexToString(preset.building);
    state.customWindows = hexToString(preset.windows);
    state.customGround = hexToString(preset.ground);
    return preset;
  }
  return {
    name: 'custom',
    label: '自定义',
    building: stringToHex(state.customBuilding),
    windows: stringToHex(state.customWindows),
    ground: stringToHex(state.customGround),
    accent: stringToHex(state.customWindows)
  };
}

function updateAccentColor(el: HTMLElement, hex: string): void {
  el.style.setProperty('--accent-color', hex);
  el.style.setProperty('--accent-color-soft', hex + '33');
  el.style.setProperty('--accent-color-glow', hex + '66');
}

function createSlider(
  label: string,
  min: number,
  max: number,
  value: number,
  step: number,
  unit: string,
  onChange: (v: number) => void
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'slider-wrap';

  const head = document.createElement('div');
  head.className = 'slider-head';

  const labelEl = document.createElement('span');
  labelEl.className = 'slider-label';
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'slider-value';
  valueEl.textContent = `${value.toFixed(step < 1 ? 1 : 0)}${unit}`;

  head.appendChild(labelEl);
  head.appendChild(valueEl);

  const track = document.createElement('div');
  track.className = 'slider-track';

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.className = 'slider-input';

  const fill = document.createElement('div');
  fill.className = 'slider-fill';

  const updateFill = (): void => {
    const pct = ((Number(input.value) - min) / (max - min)) * 100;
    fill.style.width = pct + '%';
  };
  updateFill();

  input.addEventListener('input', () => {
    const v = Number(input.value);
    valueEl.textContent = `${v.toFixed(step < 1 ? 1 : 0)}${unit}`;
    updateFill();
    onChange(v);
  });

  track.appendChild(fill);
  track.appendChild(input);
  wrap.appendChild(head);
  wrap.appendChild(track);

  return wrap;
}

function createThemeButtons(currentName: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'theme-buttons';

  THEME_LIST.forEach((theme) => {
    const btn = document.createElement('button');
    btn.className = 'theme-btn' + (theme.name === currentName ? ' active' : '');
    btn.title = theme.label;
    btn.dataset.theme = theme.name;

    const swatch = document.createElement('div');
    swatch.className = 'theme-swatch';
    swatch.style.background = `linear-gradient(135deg, ${hexToString(theme.building)} 0%, ${hexToString(theme.windows)} 50%, ${hexToString(theme.ground)} 100%)`;

    const nameEl = document.createElement('span');
    nameEl.className = 'theme-name';
    nameEl.textContent = theme.label;

    btn.appendChild(swatch);
    btn.appendChild(nameEl);

    btn.addEventListener('click', () => {
      state.themeName = theme.name;
      wrap.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const t = getCurrentTheme();
      if (panelRoot) updateAccentColor(panelRoot, hexToString(t.accent));
      syncCustomPickers();
      if (callbacks) callbacks.onThemeChange(t);
    });

    wrap.appendChild(btn);
  });

  return wrap;
}

function createColorPicker(label: string, value: string, onChange: (v: string) => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'color-picker-wrap';

  const labelEl = document.createElement('span');
  labelEl.className = 'color-picker-label';
  labelEl.textContent = label;

  const inputWrap = document.createElement('div');
  inputWrap.className = 'color-input-wrap';

  const preview = document.createElement('div');
  preview.className = 'color-preview';
  preview.style.backgroundColor = value;

  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.className = 'color-input';

  input.addEventListener('input', () => {
    preview.style.backgroundColor = input.value;
    onChange(input.value);
  });

  inputWrap.appendChild(preview);
  inputWrap.appendChild(input);
  wrap.appendChild(labelEl);
  wrap.appendChild(inputWrap);

  return wrap;
}

function syncCustomPickers(): void {
  if (!panelRoot) return;
  const inputs = panelRoot.querySelectorAll<HTMLInputElement>('.color-input');
  const previews = panelRoot.querySelectorAll<HTMLDivElement>('.color-preview');
  if (inputs.length >= 3) {
    inputs[0].value = state.customBuilding;
    inputs[1].value = state.customWindows;
    inputs[2].value = state.customGround;
  }
  if (previews.length >= 3) {
    previews[0].style.backgroundColor = state.customBuilding;
    previews[1].style.backgroundColor = state.customWindows;
    previews[2].style.backgroundColor = state.customGround;
  }
}

function buildPanelStyles(): void {
  if (document.getElementById('city-panel-styles')) return;
  const style = document.createElement('style');
  style.id = 'city-panel-styles';
  style.textContent = `
    .city-control-panel {
      --accent-color: #ff9f43;
      --accent-color-soft: rgba(255,159,67,0.2);
      --accent-color-glow: rgba(255,159,67,0.4);
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 340px;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
      background: rgba(26, 26, 46, 0.75);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 20px;
      color: #e8e8f0;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset;
      transform: translateY(20px);
      opacity: 0;
      animation: panelSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) 0.1s forwards;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      scrollbar-width: thin;
      scrollbar-color: var(--accent-color) transparent;
    }
    .city-control-panel::-webkit-scrollbar { width: 6px; }
    .city-control-panel::-webkit-scrollbar-thumb { background: var(--accent-color-soft); border-radius: 3px; }

    @keyframes panelSlideIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .panel-title {
      font-size: 17px;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: #fff;
    }
    .panel-subtitle {
      font-size: 11px;
      color: #8888a0;
      margin-top: 2px;
    }
    .panel-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--accent-color-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-color);
    }

    .panel-section {
      margin-bottom: 18px;
    }
    .section-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #8888a0;
      margin-bottom: 10px;
      padding-left: 2px;
    }

    .slider-wrap + .slider-wrap { margin-top: 12px; }
    .slider-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
    }
    .slider-label {
      font-size: 13px;
      color: #c8c8d8;
    }
    .slider-value {
      font-family: "SF Mono", "JetBrains Mono", Consolas, monospace;
      font-size: 12px;
      font-weight: 600;
      color: var(--accent-color);
      background: var(--accent-color-soft);
      padding: 2px 8px;
      border-radius: 4px;
      min-width: 44px;
      text-align: center;
    }
    .slider-track {
      position: relative;
      height: 6px;
      background: rgba(255,255,255,0.06);
      border-radius: 3px;
      overflow: hidden;
    }
    .slider-fill {
      position: absolute;
      left: 0; top: 0;
      height: 100%;
      background: linear-gradient(90deg, var(--accent-color), var(--accent-color-glow));
      border-radius: 3px;
      transition: width 0.05s linear;
      box-shadow: 0 0 8px var(--accent-color-glow);
    }
    .slider-input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      opacity: 0;
      cursor: pointer;
    }
    .slider-track:hover .slider-fill {
      box-shadow: 0 0 12px var(--accent-color-glow);
    }

    .theme-buttons {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .theme-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px 4px;
      background: rgba(255,255,255,0.03);
      border: 1.5px solid transparent;
      border-radius: 10px;
      cursor: pointer;
      color: #c8c8d8;
      font-size: 11px;
      transition: all 0.2s ease;
    }
    .theme-btn:hover {
      background: rgba(255,255,255,0.07);
      transform: translateY(-1px);
    }
    .theme-btn.active {
      border-color: var(--accent-color);
      background: var(--accent-color-soft);
      box-shadow: 0 0 0 1px var(--accent-color-glow);
    }
    .theme-swatch {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .theme-name {
      font-size: 10.5px;
      white-space: nowrap;
    }

    .custom-colors {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px dashed rgba(255,255,255,0.06);
    }
    .color-picker-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .color-picker-label {
      font-size: 12px;
      color: #b8b8c8;
    }
    .color-input-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .color-preview {
      width: 22px;
      height: 22px;
      border-radius: 5px;
      border: 1.5px solid rgba(255,255,255,0.1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .color-input {
      width: 32px;
      height: 24px;
      border: none;
      background: transparent;
      padding: 0;
      cursor: pointer;
    }
    .color-input::-webkit-color-swatch-wrapper { padding: 0; }
    .color-input::-webkit-color-swatch {
      border: 1.5px solid rgba(255,255,255,0.15);
      border-radius: 4px;
    }

    .time-display {
      font-family: "SF Mono", "JetBrains Mono", Consolas, monospace;
      font-size: 15px;
      font-weight: 700;
      color: var(--accent-color);
      background: var(--accent-color-soft);
      padding: 3px 10px;
      border-radius: 5px;
      letter-spacing: 0.05em;
    }

    .action-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      color: #d8d8e8;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .action-btn:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.15);
      transform: translateY(-1px);
    }
    .action-btn.active {
      background: var(--accent-color-soft);
      border-color: var(--accent-color);
      color: var(--accent-color);
      box-shadow: 0 0 0 1px var(--accent-color-glow), 0 2px 12px var(--accent-color-soft);
    }
    .action-btn svg {
      width: 16px;
      height: 16px;
    }

    .panel-toggle {
      display: none;
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: rgba(26,26,46,0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.1);
      color: var(--accent-color);
      cursor: pointer;
      z-index: 1001;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      align-items: center;
      justify-content: center;
    }
    .panel-toggle svg { width: 22px; height: 22px; }

    @media (max-width: 768px) {
      .city-control-panel {
        right: 0;
        bottom: 0;
        left: 0;
        width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        overflow-x: hidden;
        -webkit-overflow-scrolling: touch;
        border-radius: 16px 16px 0 0;
        padding: 16px;
        transform: translateY(100%);
        display: none;
        padding-bottom: 80px;
      }
      .city-control-panel.open {
        display: block;
        animation: panelSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
      }
      @keyframes panelSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      .panel-toggle {
        display: flex;
        transition: transform 0.2s ease, background 0.2s ease;
      }
      .panel-toggle.open {
        transform: rotate(45deg);
        background: var(--accent-color);
        color: #fff;
      }
      .panel-toggle:active {
        transform: scale(0.92);
      }
    }
  `;
  document.head.appendChild(style);
}

export function createControlPanel(container: HTMLElement, cbs: ControlPanelCallbacks): void {
  callbacks = cbs;
  buildPanelStyles();

  const theme = THEME_LIST[0];
  state.themeName = theme.name;
  state.customBuilding = hexToString(theme.building);
  state.customWindows = hexToString(theme.windows);
  state.customGround = hexToString(theme.ground);

  panelRoot = document.createElement('div');
  panelRoot.className = 'city-control-panel';
  updateAccentColor(panelRoot, hexToString(theme.accent));

  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'panel-toggle';
  toggleBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="18" x2="20" y2="18"/>
    </svg>
  `;
  toggleBtn.addEventListener('click', () => {
    const isOpen = panelRoot?.classList.toggle('open');
    toggleBtn.classList.toggle('open', isOpen || false);
  });
  container.appendChild(toggleBtn);

  panelRoot.innerHTML = `
    <div class="panel-header">
      <div>
        <div class="panel-title">天际线生成器</div>
        <div class="panel-subtitle">拖动滑块实时调节参数</div>
      </div>
      <div class="panel-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21V7l6-4 6 4v14"/>
          <path d="M9 21V11"/>
          <path d="M15 21V5l6-3v19"/>
        </svg>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-label">建筑参数</div>
      <div id="sliders-density"></div>
      <div id="sliders-height"></div>
      <div id="sliders-base"></div>
    </div>

    <div class="panel-section">
      <div class="section-label">颜色主题</div>
      <div id="theme-buttons"></div>
      <div class="custom-colors">
        <div id="color-building"></div>
        <div id="color-windows"></div>
        <div id="color-ground"></div>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-label">动态光照</div>
      <div id="sliders-time"></div>
    </div>

    <div class="panel-section">
      <div class="section-label">视角控制</div>
      <div class="action-row">
        <button id="btn-orbit" class="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
          </svg>
          <span>轨道巡航</span>
        </button>
      </div>
    </div>
  `;

  panelRoot.querySelector('#sliders-density')!.appendChild(
    createSlider('建筑密度', 10, 50, state.density, 1, '栋', (v) => {
      state.density = v;
      scheduleRebuild();
    })
  );

  const heightWrap = document.createElement('div');
  heightWrap.appendChild(
    createSlider('最小高度', 10, 80, state.minHeight, 1, '', (v) => {
      state.minHeight = Math.min(v, state.maxHeight - 5);
      scheduleRebuild();
    })
  );
  heightWrap.appendChild(
    createSlider('最大高度', 40, 150, state.maxHeight, 1, '', (v) => {
      state.maxHeight = Math.max(v, state.minHeight + 5);
      scheduleRebuild();
    })
  );
  panelRoot.querySelector('#sliders-height')!.appendChild(heightWrap);

  const baseWrap = document.createElement('div');
  baseWrap.appendChild(
    createSlider('最小基底', 5, 12, state.minBase, 1, '', (v) => {
      state.minBase = Math.min(v, state.maxBase - 2);
      scheduleRebuild();
    })
  );
  baseWrap.appendChild(
    createSlider('最大基底', 8, 20, state.maxBase, 1, '', (v) => {
      state.maxBase = Math.max(v, state.minBase + 2);
      scheduleRebuild();
    })
  );
  panelRoot.querySelector('#sliders-base')!.appendChild(baseWrap);

  panelRoot.querySelector('#theme-buttons')!.appendChild(
    createThemeButtons(state.themeName)
  );

  panelRoot.querySelector('#color-building')!.appendChild(
    createColorPicker('建筑立面', state.customBuilding, (v) => {
      state.themeName = 'custom';
      state.customBuilding = v;
      panelRoot?.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      if (callbacks) callbacks.onThemeChange(getCurrentTheme());
    })
  );
  panelRoot.querySelector('#color-windows')!.appendChild(
    createColorPicker('窗户发光', state.customWindows, (v) => {
      state.themeName = 'custom';
      state.customWindows = v;
      panelRoot?.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      if (panelRoot) updateAccentColor(panelRoot, v);
      if (callbacks) callbacks.onThemeChange(getCurrentTheme());
    })
  );
  panelRoot.querySelector('#color-ground')!.appendChild(
    createColorPicker('地面颜色', state.customGround, (v) => {
      state.themeName = 'custom';
      state.customGround = v;
      panelRoot?.querySelectorAll('.theme-btn').forEach((b) => b.classList.remove('active'));
      if (callbacks) callbacks.onThemeChange(getCurrentTheme());
    })
  );

  const timeWrap = document.createElement('div');
  const timeHead = document.createElement('div');
  timeHead.className = 'slider-head';
  const timeLabel = document.createElement('span');
  timeLabel.className = 'slider-label';
  timeLabel.textContent = '时间 (24h)';
  const timeDisplay = document.createElement('span');
  timeDisplay.className = 'time-display';
  timeDisplay.textContent = `${String(Math.floor(state.hour)).padStart(2, '0')}:00`;
  timeHead.appendChild(timeLabel);
  timeHead.appendChild(timeDisplay);

  const timeTrack = document.createElement('div');
  timeTrack.className = 'slider-track';
  const timeFill = document.createElement('div');
  timeFill.className = 'slider-fill';
  timeFill.style.width = (state.hour / 24) * 100 + '%';
  const timeInput = document.createElement('input');
  timeInput.type = 'range';
  timeInput.min = '0';
  timeInput.max = '24';
  timeInput.step = '0.1';
  timeInput.value = String(state.hour);
  timeInput.className = 'slider-input';
  timeInput.addEventListener('input', () => {
    state.hour = Number(timeInput.value);
    timeDisplay.textContent = `${String(Math.floor(state.hour)).padStart(2, '0')}:${String(Math.floor((state.hour % 1) * 60)).padStart(2, '0')}`;
    timeFill.style.width = (state.hour / 24) * 100 + '%';
    if (callbacks) callbacks.onTimeChange(state.hour);
  });
  timeTrack.appendChild(timeFill);
  timeTrack.appendChild(timeInput);
  timeWrap.appendChild(timeHead);
  timeWrap.appendChild(timeTrack);
  panelRoot.querySelector('#sliders-time')!.appendChild(timeWrap);

  const orbitBtn = panelRoot.querySelector<HTMLButtonElement>('#btn-orbit')!;
  orbitBtn.addEventListener('click', () => {
    state.autoRotate = !state.autoRotate;
    orbitBtn.classList.toggle('active', state.autoRotate);
    if (callbacks) callbacks.onAutoRotate(state.autoRotate);
  });

  container.appendChild(panelRoot);

  if (callbacks) {
    callbacks.onThemeChange(getCurrentTheme());
  }
}

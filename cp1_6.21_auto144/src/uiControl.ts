import type { ParticleType, SimulationParams } from './particleEmitter';

export interface UIControlHandlers {
  onParamsChange: (params: Partial<SimulationParams>) => void;
  onReset: () => void;
  onTogglePause: () => void;
  onToggleEmit: () => void;
}

export function createUIControl(container: HTMLElement, handlers: UIControlHandlers) {
  const state = {
    isPaused: false,
    isEmitting: true
  };

  const panel = document.createElement('div');
  panel.className = 'control-panel';

  panel.innerHTML = `
    <h2>粒子模拟器</h2>

    <div class="control-group">
      <label>粒子类型</label>
      <select id="particle-type">
        <option value="electron">电子 (e⁻)</option>
        <option value="proton">质子 (p⁺)</option>
        <option value="alpha">α 粒子 (He²⁺)</option>
      </select>
    </div>

    <div class="control-group">
      <label>
        电场强度 (X轴)
        <span class="slider-value" id="ef-value">0</span>
      </label>
      <input type="range" id="electric-field" min="-100" max="100" step="1" value="0" />
    </div>

    <div class="control-group">
      <label>
        磁场强度 (Y轴)
        <span class="slider-value" id="mf-value">0</span>
      </label>
      <input type="range" id="magnetic-field" min="0" max="100" step="1" value="0" />
    </div>

    <div class="control-group">
      <label>
        发射速度
        <span class="slider-value" id="speed-value">5</span>
      </label>
      <input type="range" id="initial-speed" min="1" max="20" step="1" value="5" />
    </div>

    <div class="button-group">
      <button class="btn btn-secondary" id="reset-btn">重置</button>
      <button class="btn" id="pause-btn">暂停</button>
      <button class="btn" id="emit-btn">停止</button>
    </div>
  `;

  container.appendChild(panel);

  const statsPanel = document.createElement('div');
  statsPanel.className = 'stats-panel';
  statsPanel.innerHTML = `
    <div class="stat-item">
      <span>粒子总数:</span>
      <span class="stat-value" id="particle-count">0</span>
    </div>
    <div class="stat-item">
      <span>发射速率:</span>
      <span class="stat-value" id="emit-rate">10/s</span>
    </div>
  `;
  document.getElementById('app')!.appendChild(statsPanel);

  const infoPanel = document.createElement('div');
  infoPanel.className = 'info-panel';
  infoPanel.innerHTML = `
    <div class="info-row">
      <span class="info-label">粒子:</span>
      <span class="info-value" id="info-type">电子</span>
    </div>
    <div class="info-row">
      <span class="info-label">电场 E:</span>
      <span class="info-value" id="info-ef">0</span>
    </div>
    <div class="info-row">
      <span class="info-label">磁场 B:</span>
      <span class="info-value" id="info-mf">0</span>
    </div>
    <div class="info-row">
      <span class="info-label">初速度 v₀:</span>
      <span class="info-value" id="info-speed">5</span>
    </div>
  `;
  document.getElementById('app')!.appendChild(infoPanel);

  const particleTypeSelect = panel.querySelector('#particle-type') as HTMLSelectElement;
  const electricFieldSlider = panel.querySelector('#electric-field') as HTMLInputElement;
  const magneticFieldSlider = panel.querySelector('#magnetic-field') as HTMLInputElement;
  const initialSpeedSlider = panel.querySelector('#initial-speed') as HTMLInputElement;
  const resetBtn = panel.querySelector('#reset-btn') as HTMLButtonElement;
  const pauseBtn = panel.querySelector('#pause-btn') as HTMLButtonElement;
  const emitBtn = panel.querySelector('#emit-btn') as HTMLButtonElement;

  const efValue = panel.querySelector('#ef-value') as HTMLSpanElement;
  const mfValue = panel.querySelector('#mf-value') as HTMLSpanElement;
  const speedValue = panel.querySelector('#speed-value') as HTMLSpanElement;

  const particleNames: Record<ParticleType, string> = {
    electron: '电子',
    proton: '质子',
    alpha: 'α粒子'
  };

  particleTypeSelect.addEventListener('change', () => {
    const type = particleTypeSelect.value as ParticleType;
    handlers.onParamsChange({ particleType: type });
    (document.getElementById('info-type') as HTMLSpanElement).textContent = particleNames[type];
  });

  electricFieldSlider.addEventListener('input', () => {
    const value = parseInt(electricFieldSlider.value);
    efValue.textContent = value.toString();
    (document.getElementById('info-ef') as HTMLSpanElement).textContent = value.toString();
    handlers.onParamsChange({ electricField: value });
  });

  magneticFieldSlider.addEventListener('input', () => {
    const value = parseInt(magneticFieldSlider.value);
    mfValue.textContent = value.toString();
    (document.getElementById('info-mf') as HTMLSpanElement).textContent = value.toString();
    handlers.onParamsChange({ magneticField: value });
  });

  initialSpeedSlider.addEventListener('input', () => {
    const value = parseInt(initialSpeedSlider.value);
    speedValue.textContent = value.toString();
    (document.getElementById('info-speed') as HTMLSpanElement).textContent = value.toString();
    handlers.onParamsChange({ initialSpeed: value });
  });

  resetBtn.addEventListener('click', () => {
    handlers.onReset();
  });

  pauseBtn.addEventListener('click', () => {
    state.isPaused = !state.isPaused;
    pauseBtn.textContent = state.isPaused ? '继续' : '暂停';
    if (state.isPaused) {
      pauseBtn.classList.add('btn-paused');
    } else {
      pauseBtn.classList.remove('btn-paused');
    }
    handlers.onTogglePause();
  });

  emitBtn.addEventListener('click', () => {
    state.isEmitting = !state.isEmitting;
    emitBtn.textContent = state.isEmitting ? '停止' : '发射';
    if (!state.isEmitting) {
      emitBtn.classList.add('btn-secondary');
    } else {
      emitBtn.classList.remove('btn-secondary');
    }
    handlers.onToggleEmit();
  });

  return {
    updateStats(count: number, rate: number) {
      (document.getElementById('particle-count') as HTMLSpanElement).textContent = count.toString();
      (document.getElementById('emit-rate') as HTMLSpanElement).textContent = `${rate}/s`;
    },

    getState() {
      return { ...state };
    }
  };
}

export type UIControl = ReturnType<typeof createUIControl>;

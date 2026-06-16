import type { ColorPalette, NebulaParams } from './types';

export interface UIState {
  density: number;
  colorPalette: ColorPalette;
  turbulence: number;
}

export type ParamsChangeCallback = (params: Partial<NebulaParams>) => void;

export interface UIControls {
  container: HTMLDivElement;
  fpsCounter: HTMLDivElement;
  modeIndicator: HTMLDivElement;
  onParamsChange: (callback: ParamsChangeCallback) => void;
  setFPS: (fps: number) => void;
  setMode: (mode: 'orbit' | 'fly') => void;
}

export function createUI(initialState: UIState): UIControls {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    background: rgba(20, 20, 30, 0.7);
    border-radius: 12px;
    padding: 20px;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    z-index: 100;
    min-width: 240px;
    user-select: none;
  `;
  container.addEventListener('mouseenter', () => {
    container.style.boxShadow = '0 8px 32px rgba(74, 144, 217, 0.25)';
    container.style.filter = 'brightness(1.1)';
  });
  container.addEventListener('mouseleave', () => {
    container.style.boxShadow = 'none';
    container.style.filter = 'brightness(1)';
  });

  const title = document.createElement('div');
  title.textContent = '星云参数控制';
  title.style.cssText = `
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 16px;
    color: #4A90D9;
    letter-spacing: 1px;
  `;
  container.appendChild(title);

  let paramsChangeCallback: ParamsChangeCallback = () => {};

  const densityGroup = createSlider(
    '密度',
    initialState.density,
    1,
    100,
    1,
    (value) => {
      paramsChangeCallback({ density: value });
    }
  );
  container.appendChild(densityGroup.element);

  const paletteGroup = createDropdown(
    '颜色主题',
    [
      { value: 'rainbow', label: '虹彩' },
      { value: 'aurora', label: '极光' },
      { value: 'lava', label: '熔岩' },
    ],
    initialState.colorPalette,
    (value) => {
      paramsChangeCallback({ colorPalette: value as ColorPalette });
    }
  );
  container.appendChild(paletteGroup.element);

  const turbulenceGroup = createSlider(
    '湍流强度',
    initialState.turbulence,
    0,
    5,
    0.1,
    (value) => {
      paramsChangeCallback({ turbulence: value });
    }
  );
  container.appendChild(turbulenceGroup.element);

  const hint = document.createElement('div');
  hint.textContent = 'WASD:移动 | 鼠标拖拽:旋转 | 滚轮:缩放 | 空格:切换模式';
  hint.style.cssText = `
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.6;
  `;
  container.appendChild(hint);

  const fpsCounter = document.createElement('div');
  fpsCounter.textContent = 'FPS: --';
  fpsCounter.style.cssText = `
    position: fixed;
    right: 20px;
    top: 20px;
    color: #00FF88;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    opacity: 0.7;
    z-index: 100;
    text-shadow: 0 0 8px rgba(0, 255, 136, 0.5);
    user-select: none;
  `;

  const modeIndicator = document.createElement('div');
  modeIndicator.textContent = '模式: 环绕观察';
  modeIndicator.style.cssText = `
    position: fixed;
    left: 20px;
    top: 20px;
    color: rgba(255, 255, 255, 0.7);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    z-index: 100;
    padding: 8px 16px;
    background: rgba(20, 20, 30, 0.5);
    border-radius: 8px;
    backdrop-filter: blur(5px);
    user-select: none;
  `;

  return {
    container,
    fpsCounter,
    modeIndicator,
    onParamsChange: (cb: ParamsChangeCallback) => {
      paramsChangeCallback = cb;
    },
    setFPS: (fps: number) => {
      fpsCounter.textContent = `FPS: ${fps.toFixed(0)}`;
    },
    setMode: (mode: 'orbit' | 'fly') => {
      modeIndicator.textContent = `模式: ${mode === 'orbit' ? '环绕观察' : '自由飞行'}`;
    },
  };
}

function createSlider(
  label: string,
  initialValue: number,
  min: number,
  max: number,
  step: number,
  onChange: (value: number) => void
): { element: HTMLElement } {
  const group = document.createElement('div');
  group.style.marginBottom = '14px';

  const labelEl = document.createElement('div');
  labelEl.style.cssText = `
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 13px;
  `;

  const labelText = document.createElement('span');
  labelText.textContent = label;

  const valueText = document.createElement('span');
  valueText.textContent = step < 1 ? initialValue.toFixed(1) : String(initialValue);
  valueText.style.color = '#4A90D9';
  valueText.style.fontWeight = '600';

  labelEl.appendChild(labelText);
  labelEl.appendChild(valueText);
  group.appendChild(labelEl);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(initialValue);
  input.style.cssText = `
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #333333;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  `;

  const style = document.createElement('style');
  style.textContent = `
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4A90D9;
      cursor: pointer;
      box-shadow: 0 0 8px rgba(74, 144, 217, 0.6);
      transition: all 0.2s ease;
    }
    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 12px rgba(74, 144, 217, 0.8);
    }
    input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #4A90D9;
      cursor: pointer;
      border: none;
      box-shadow: 0 0 8px rgba(74, 144, 217, 0.6);
    }
  `;
  document.head.appendChild(style);

  input.addEventListener('input', () => {
    const value = parseFloat(input.value);
    valueText.textContent = step < 1 ? value.toFixed(1) : String(value);
    onChange(value);
  });

  group.appendChild(input);

  return { element: group };
}

function createDropdown(
  label: string,
  options: { value: string; label: string }[],
  initialValue: string,
  onChange: (value: string) => void
): { element: HTMLElement } {
  const group = document.createElement('div');
  group.style.marginBottom = '14px';

  const labelEl = document.createElement('div');
  labelEl.textContent = label;
  labelEl.style.cssText = `
    margin-bottom: 6px;
    font-size: 13px;
  `;
  group.appendChild(labelEl);

  const select = document.createElement('select');
  select.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    background: rgba(51, 51, 51, 0.8);
    color: #ffffff;
    border: 1px solid rgba(74, 144, 217, 0.3);
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    transition: all 0.2s ease;
  `;
  select.addEventListener('focus', () => {
    select.style.borderColor = '#4A90D9';
    select.style.boxShadow = '0 0 8px rgba(74, 144, 217, 0.4)';
  });
  select.addEventListener('blur', () => {
    select.style.borderColor = 'rgba(74, 144, 217, 0.3)';
    select.style.boxShadow = 'none';
  });

  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    option.style.background = '#1a1a2e';
    if (opt.value === initialValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    onChange(select.value);
  });

  group.appendChild(select);

  return { element: group };
}

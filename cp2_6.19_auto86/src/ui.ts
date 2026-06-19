import { EnvironmentParams, PlantObject } from './plant';

export interface UIHandlers {
  onParamChange: (params: EnvironmentParams) => void;
}

interface SliderConfig {
  key: keyof EnvironmentParams;
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  gradientStart: string;
  gradientEnd: string;
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'light',
    label: '光照强度',
    min: 0,
    max: 100,
    defaultValue: 50,
    gradientStart: '#FFD700',
    gradientEnd: '#FF8C00'
  },
  {
    key: 'water',
    label: '水分含量',
    min: 0,
    max: 100,
    defaultValue: 60,
    gradientStart: '#87CEEB',
    gradientEnd: '#1E90FF'
  },
  {
    key: 'nutrients',
    label: '养分浓度',
    min: 0,
    max: 100,
    defaultValue: 40,
    gradientStart: '#90EE90',
    gradientEnd: '#228B22'
  }
];

export function createUI(handlers: UIHandlers): {
  updateValues: (params: EnvironmentParams, height: number) => void;
} {
  const app = document.getElementById('app')!;

  const panel = document.createElement('div');
  panel.style.cssText = `
    position: absolute;
    top: 50%;
    right: 24px;
    transform: translateY(-50%);
    width: 190px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 100;
  `;

  const title = document.createElement('h3');
  title.textContent = '生长控制面板';
  title.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #1B5E20;
    margin-bottom: 12px;
    text-align: center;
  `;
  panel.appendChild(title);

  const sliderContainers: { [key: string]: HTMLElement } = {};

  sliderConfigs.forEach((config, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      margin-bottom: ${index < sliderConfigs.length - 1 ? '12px' : '0'};
    `;

    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    const label = document.createElement('span');
    label.textContent = config.label;
    label.style.cssText = `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1B5E20;
    `;

    const valueDisplay = document.createElement('span');
    valueDisplay.id = `value-${config.key}`;
    valueDisplay.textContent = config.defaultValue.toString();
    valueDisplay.style.cssText = `
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-size: 13px;
      font-weight: 600;
      color: #2E7D32;
      min-width: 32px;
      text-align: right;
      transition: color 100ms ease;
    `;

    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);
    wrapper.appendChild(labelRow);

    const sliderWrapper = document.createElement('div');
    sliderWrapper.style.cssText = `
      position: relative;
      width: 100%;
      height: 24px;
      display: flex;
      align-items: center;
    `;

    const track = document.createElement('div');
    track.style.cssText = `
      position: absolute;
      width: 100%;
      height: 6px;
      background: linear-gradient(to right, ${config.gradientStart}, ${config.gradientEnd});
      border-radius: 3px;
      opacity: 0.3;
    `;

    const fill = document.createElement('div');
    fill.id = `fill-${config.key}`;
    fill.style.cssText = `
      position: absolute;
      left: 0;
      height: 6px;
      background: linear-gradient(to right, ${config.gradientStart}, ${config.gradientEnd});
      border-radius: 3px;
      width: ${(config.defaultValue / config.max) * 100}%;
      pointer-events: none;
    `;

    const thumb = document.createElement('div');
    thumb.id = `thumb-${config.key}`;
    thumb.style.cssText = `
      position: absolute;
      width: 16px;
      height: 16px;
      background: #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      cursor: grab;
      left: calc(${(config.defaultValue / config.max) * 100}% - 8px);
      top: 50%;
      transform: translateY(-50%);
      transition: transform 100ms ease, box-shadow 100ms ease;
    `;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = config.min.toString();
    input.max = config.max.toString();
    input.value = config.defaultValue.toString();
    input.style.cssText = `
      position: absolute;
      width: 100%;
      height: 24px;
      opacity: 0;
      cursor: pointer;
      margin: 0;
      padding: 0;
      -webkit-appearance: none;
      appearance: none;
    `;

    input.addEventListener('input', () => {
      const value = parseInt(input.value, 10);
      const percent = (value - config.min) / (config.max - config.min);
      fill.style.width = `${percent * 100}%`;
      thumb.style.left = `calc(${percent * 100}% - 8px)`;
      valueDisplay.textContent = value.toString();

      const currentParams = getCurrentParams();
      currentParams[config.key] = value;
      handlers.onParamChange(currentParams);
    });

    input.addEventListener('mousedown', () => {
      thumb.style.transform = 'translateY(-50%) scale(1.2)';
      thumb.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
    });

    input.addEventListener('mouseup', () => {
      thumb.style.transform = 'translateY(-50%) scale(1)';
      thumb.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    });

    sliderWrapper.appendChild(track);
    sliderWrapper.appendChild(fill);
    sliderWrapper.appendChild(thumb);
    sliderWrapper.appendChild(input);
    wrapper.appendChild(sliderWrapper);

    panel.appendChild(wrapper);
    sliderContainers[config.key] = wrapper;
  });

  app.appendChild(panel);

  const statsPanel = document.createElement('div');
  statsPanel.style.cssText = `
    position: absolute;
    left: 24px;
    bottom: 24px;
    padding: 16px 20px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif;
    z-index: 100;
    min-width: 180px;
  `;

  const statsTitle = document.createElement('div');
  statsTitle.textContent = '环境状态';
  statsTitle.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    opacity: 0.9;
  `;
  statsPanel.appendChild(statsTitle);

  const statItems: { [key: string]: HTMLElement } = {};
  const stats = [
    { key: 'light', label: '光照' },
    { key: 'water', label: '水分' },
    { key: 'nutrients', label: '养分' },
    { key: 'height', label: '植物高度', suffix: ' 单位' }
  ];

  stats.forEach((stat, index) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      ${index < stats.length - 1 ? 'margin-bottom: 6px;' : ''}
    `;

    const label = document.createElement('span');
    label.textContent = stat.label;
    label.style.opacity = '0.8';

    const value = document.createElement('span');
    value.id = `stat-${stat.key}`;
    value.style.cssText = `
      font-family: 'SF Mono', Monaco, Consolas, monospace;
      font-weight: 500;
    `;

    row.appendChild(label);
    row.appendChild(value);
    statsPanel.appendChild(row);
    statItems[stat.key] = value;
  });

  app.appendChild(statsPanel);

  function getCurrentParams(): EnvironmentParams {
    const params: EnvironmentParams = { light: 50, water: 60, nutrients: 40 };
    sliderConfigs.forEach((config) => {
      const input = sliderContainers[config.key].querySelector('input');
      if (input) {
        params[config.key] = parseInt(input.value, 10);
      }
    });
    return params;
  }

  function updateValues(params: EnvironmentParams, height: number): void {
    const lightEl = document.getElementById('stat-light');
    const waterEl = document.getElementById('stat-water');
    const nutrientsEl = document.getElementById('stat-nutrients');
    const heightEl = document.getElementById('stat-height');

    if (lightEl) lightEl.textContent = `${params.light.toFixed(0)}`;
    if (waterEl) waterEl.textContent = `${params.water.toFixed(0)}`;
    if (nutrientsEl) nutrientsEl.textContent = `${params.nutrients.toFixed(0)}`;
    if (heightEl) heightEl.textContent = `${height.toFixed(2)} 单位`;
  }

  return { updateValues };
}

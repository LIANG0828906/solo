import type { GeometryParams } from './geometryGenerator';
import { PRESET_COLORS } from './geometryGenerator';

export const PARAMS_CHANGE_EVENT = 'params-change';
export const EXPORT_GLTF_EVENT = 'export-gltf';
export const CLEAR_SCENE_EVENT = 'clear-scene';
export const ADD_TO_GALLERY_EVENT = 'add-to-gallery';

let currentParams: GeometryParams = {
  size: 1.0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  color: PRESET_COLORS[1]
};

export function getCurrentParams(): GeometryParams {
  return { ...currentParams };
}

export function setParams(params: Partial<GeometryParams>): void {
  currentParams = { ...currentParams, ...params };
  updateUIFromParams();
  dispatchParamsChange();
}

function dispatchParamsChange(): void {
  const event = new CustomEvent(PARAMS_CHANGE_EVENT, {
    detail: { ...currentParams }
  });
  document.dispatchEvent(event);
}

function createSlider(
  label: string,
  key: keyof GeometryParams,
  min: number,
  max: number,
  step: number,
  unit: string = ''
): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'control-row';
  const labelDiv = document.createElement('div');
  labelDiv.className = 'control-label';
  const labelText = document.createElement('span');
  labelText.textContent = label;
  const valueSpan = document.createElement('span');
  valueSpan.className = 'control-value';
  valueSpan.id = `value-${key}`;
  valueSpan.textContent = `${currentParams[key]}${unit}`;
  labelDiv.appendChild(labelText);
  labelDiv.appendChild(valueSpan);
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(min);
  slider.max = String(max);
  slider.step = String(step);
  slider.value = String(currentParams[key]);
  slider.addEventListener('input', () => {
    const val = parseFloat(slider.value);
    (currentParams as unknown as Record<string, number>)[key] = val;
    valueSpan.textContent = `${val}${unit}`;
    dispatchParamsChange();
  });
  row.appendChild(labelDiv);
  row.appendChild(slider);
  return row;
}

function createColorPicker(): HTMLDivElement {
  const row = document.createElement('div');
  row.className = 'control-row';
  const labelDiv = document.createElement('div');
  labelDiv.className = 'control-label';
  const labelText = document.createElement('span');
  labelText.textContent = '材质颜色';
  const valueSpan = document.createElement('span');
  valueSpan.className = 'control-value';
  valueSpan.id = 'value-color';
  valueSpan.textContent = currentParams.color;
  labelDiv.appendChild(labelText);
  labelDiv.appendChild(valueSpan);
  const picker = document.createElement('div');
  picker.className = 'color-picker';
  PRESET_COLORS.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'color-btn';
    btn.style.background = color;
    btn.style.color = color;
    btn.dataset.color = color;
    if (color === currentParams.color) {
      btn.classList.add('active');
    }
    btn.addEventListener('click', () => {
      currentParams.color = color;
      valueSpan.textContent = color;
      picker.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dispatchParamsChange();
    });
    picker.appendChild(btn);
  });
  row.appendChild(labelDiv);
  row.appendChild(picker);
  return row;
}

function createActionButton(
  text: string,
  eventName: string,
  isPrimary: boolean = false
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = `action-btn${isPrimary ? ' primary' : ''}`;
  btn.textContent = text;
  btn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent(eventName));
  });
  return btn;
}

export function initControlPanel(containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const sizeSection = document.createElement('div');
  sizeSection.className = 'panel-section';
  const sizeTitle = document.createElement('h3');
  sizeTitle.textContent = '几何体参数';
  sizeSection.appendChild(sizeTitle);
  sizeSection.appendChild(createSlider('尺寸', 'size', 0.5, 3.0, 0.1));
  container.appendChild(sizeSection);

  const rotSection = document.createElement('div');
  rotSection.className = 'panel-section';
  const rotTitle = document.createElement('h3');
  rotTitle.textContent = '旋转角度';
  rotSection.appendChild(rotTitle);
  rotSection.appendChild(createSlider('X 轴', 'rotationX', 0, 360, 1, '°'));
  rotSection.appendChild(createSlider('Y 轴', 'rotationY', 0, 360, 1, '°'));
  rotSection.appendChild(createSlider('Z 轴', 'rotationZ', 0, 360, 1, '°'));
  container.appendChild(rotSection);

  const colorSection = document.createElement('div');
  colorSection.className = 'panel-section';
  const colorTitle = document.createElement('h3');
  colorTitle.textContent = '外观';
  colorSection.appendChild(colorTitle);
  colorSection.appendChild(createColorPicker());
  container.appendChild(colorSection);

  const actionSection = document.createElement('div');
  actionSection.className = 'panel-section';
  const actionTitle = document.createElement('h3');
  actionTitle.textContent = '操作';
  actionSection.appendChild(actionTitle);
  actionSection.appendChild(createActionButton('添加到对比画廊', ADD_TO_GALLERY_EVENT, true));
  actionSection.appendChild(createActionButton('导出为 GLTF', EXPORT_GLTF_EVENT));
  actionSection.appendChild(createActionButton('清空场景', CLEAR_SCENE_EVENT));
  container.appendChild(actionSection);
}

function updateUIFromParams(): void {
  const sizeVal = document.getElementById('value-size');
  const rotXVal = document.getElementById('value-rotationX');
  const rotYVal = document.getElementById('value-rotationY');
  const rotZVal = document.getElementById('value-rotationZ');
  const colorVal = document.getElementById('value-color');
  if (sizeVal) sizeVal.textContent = String(currentParams.size);
  if (rotXVal) rotXVal.textContent = `${currentParams.rotationX}°`;
  if (rotYVal) rotYVal.textContent = `${currentParams.rotationY}°`;
  if (rotZVal) rotZVal.textContent = `${currentParams.rotationZ}°`;
  if (colorVal) colorVal.textContent = currentParams.color;

  const sliders = document.querySelectorAll<HTMLInputElement>('#control-panel input[type="range"]');
  sliders.forEach(slider => {
    const key = slider.parentElement?.querySelector('.control-value')?.id?.replace('value-', '');
    if (key && key in currentParams) {
      slider.value = String((currentParams as unknown as Record<string, number>)[key]);
    }
  });

  const colorBtns = document.querySelectorAll<HTMLButtonElement>('#control-panel .color-btn');
  colorBtns.forEach(btn => {
    if (btn.dataset.color === currentParams.color) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

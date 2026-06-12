import * as THREE from 'three';
import * as selectionManager from './selectionManager';

interface SliderElements {
  x: HTMLInputElement;
  y: HTMLInputElement;
  z: HTMLInputElement;
}

interface ValueElements {
  x: HTMLSpanElement;
  y: HTMLSpanElement;
  z: HTMLSpanElement;
}

let panel: HTMLElement;
let toggleBtn: HTMLElement;
let floatingBtn: HTMLElement;
let nameDisplay: HTMLElement;
let positionSliders: SliderElements;
let positionValues: ValueElements;
let scaleSliders: SliderElements;
let scaleValues: ValueElements;
let rotationSlider: HTMLInputElement;
let rotationValue: HTMLSpanElement;
let rotationSpeedSlider: HTMLInputElement;
let rotationSpeedValue: HTMLSpanElement;
let rotationToggleBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;

let isPanelCollapsed = false;
let isMobileView = false;

const MOBILE_BREAKPOINT = 1024;
const POSITION_MIN = -20;
const POSITION_MAX = 20;
const SCALE_MIN = 0.5;
const SCALE_MAX = 2.0;
const ROTATION_MIN = 0;
const ROTATION_MAX = 360;
const SPEED_MIN = 0;
const SPEED_MAX = 360;

export function initUI(
  container: HTMLElement,
  onResetAll: () => void,
  onPositionChange: (axis: 'x' | 'y' | 'z', value: number) => void,
  onScaleChange: (axis: 'x' | 'y' | 'z', value: number) => void,
  onRotationChange: (value: number) => void,
  onRotationSpeedChange: (value: number) => void
): void {
  createPanelElements();
  attachToContainer(container);
  bindEvents(onResetAll, onPositionChange, onScaleChange, onRotationChange, onRotationSpeedChange);
  checkViewport();
  updateUI(null);
  
  window.addEventListener('resize', checkViewport);
}

function createPanelElements(): void {
  panel = document.createElement('div');
  panel.id = 'control-panel';
  panel.style.cssText = `
    position: fixed;
    left: 20px;
    bottom: 20px;
    width: 320px;
    background: rgba(26, 26, 46, 0.85);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
    color: #fff;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    transition: transform 0.3s ease, opacity 0.3s ease;
    transform-origin: bottom left;
    z-index: 100;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  `;
  
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  `;
  
  const title = document.createElement('h3');
  title.textContent = '属性面板';
  title.style.cssText = `
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #48dbfb, #ff9ff3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  `;
  
  toggleBtn = document.createElement('button');
  toggleBtn.innerHTML = '&#8211;';
  toggleBtn.style.cssText = `
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;
  
  header.appendChild(title);
  header.appendChild(toggleBtn);
  
  const content = document.createElement('div');
  content.id = 'panel-content';
  
  nameDisplay = document.createElement('div');
  nameDisplay.style.cssText = `
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    margin-bottom: 16px;
    font-weight: 500;
  `;
  nameDisplay.textContent = '未选中几何体';
  
  positionSliders = createSliderGroup('位置', POSITION_MIN, POSITION_MAX, '0.1');
  scaleSliders = createSliderGroup('缩放', SCALE_MIN, SCALE_MAX, '0.01');
  
  positionValues = {
    x: positionSliders.x.parentElement?.querySelector('.value') as HTMLSpanElement,
    y: positionSliders.y.parentElement?.querySelector('.value') as HTMLSpanElement,
    z: positionSliders.z.parentElement?.querySelector('.value') as HTMLSpanElement
  };
  
  scaleValues = {
    x: scaleSliders.x.parentElement?.querySelector('.value') as HTMLSpanElement,
    y: scaleSliders.y.parentElement?.querySelector('.value') as HTMLSpanElement,
    z: scaleSliders.z.parentElement?.querySelector('.value') as HTMLSpanElement
  };
  
  const rotationGroup = createSingleSliderGroup('旋转角度', ROTATION_MIN, ROTATION_MAX, '1', '°');
  rotationSlider = rotationGroup.slider;
  rotationValue = rotationGroup.value;
  
  const speedGroup = createSingleSliderGroup('自转速度', SPEED_MIN, SPEED_MAX, '1', '°/s');
  rotationSpeedSlider = speedGroup.slider;
  rotationSpeedValue = speedGroup.value;
  
  rotationToggleBtn = document.createElement('button') as HTMLButtonElement;
  rotationToggleBtn.textContent = '开始自转 (R)';
  rotationToggleBtn.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-top: 8px;
    margin-bottom: 16px;
    border: none;
    background: linear-gradient(135deg, #5f27cd, #48dbfb);
    color: #fff;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  `;
  
  resetBtn = document.createElement('button') as HTMLButtonElement;
  resetBtn.textContent = '重置所有';
  resetBtn.style.cssText = `
    width: 100%;
    padding: 12px;
    border: none;
    background: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
    border: 1px solid rgba(255, 107, 107, 0.3);
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
  `;
  
  floatingBtn = document.createElement('button');
  floatingBtn.innerHTML = '&#9881;';
  floatingBtn.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 56px;
    height: 56px;
    border: none;
    background: linear-gradient(135deg, #48dbfb, #ff9ff3);
    color: #fff;
    border-radius: 50%;
    cursor: pointer;
    font-size: 24px;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(72, 219, 251, 0.4);
    transition: all 0.3s ease;
    z-index: 101;
  `;
  
  content.appendChild(nameDisplay);
  content.appendChild(positionSliders.x.closest('.slider-group')!);
  content.appendChild(scaleSliders.x.closest('.slider-group')!);
  content.appendChild(rotationGroup.container);
  content.appendChild(speedGroup.container);
  content.appendChild(rotationToggleBtn);
  content.appendChild(resetBtn);
  
  panel.appendChild(header);
  panel.appendChild(content);
  
  addButtonHoverEffects(toggleBtn);
  addButtonHoverEffects(rotationToggleBtn);
  addButtonHoverEffects(resetBtn);
  addButtonHoverEffects(floatingBtn);
}

function createSliderGroup(label: string, min: number, max: number, step: string): SliderElements {
  const group = document.createElement('div');
  group.className = 'slider-group';
  group.style.cssText = `
    margin-bottom: 16px;
  `;
  
  const groupLabel = document.createElement('div');
  groupLabel.textContent = label;
  groupLabel.style.cssText = `
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  group.appendChild(groupLabel);
  
  const axes = ['x', 'y', 'z'];
  const colors = ['#ff6b6b', '#1dd1a1', '#48dbfb'];
  const sliders: Partial<SliderElements> = {};
  
  axes.forEach((axis, index) => {
    const row = document.createElement('div');
    row.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    `;
    
    const axisLabel = document.createElement('span');
    axisLabel.textContent = axis.toUpperCase();
    axisLabel.style.cssText = `
      width: 20px;
      font-weight: 600;
      color: ${colors[index]};
      font-size: 12px;
    `;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = step;
    slider.dataset.axis = axis;
    slider.style.cssText = `
      flex: 1;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    `;
    
    const value = document.createElement('span');
    value.className = 'value';
    value.style.cssText = `
      width: 50px;
      text-align: right;
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    `;
    
    addSliderStyles(slider, colors[index]);
    
    row.appendChild(axisLabel);
    row.appendChild(slider);
    row.appendChild(value);
    group.appendChild(row);
    
    sliders[axis as keyof SliderElements] = slider;
  });
  
  return sliders as SliderElements;
}

function createSingleSliderGroup(label: string, min: number, max: number, step: string, unit: string): {
  container: HTMLElement;
  slider: HTMLInputElement;
  value: HTMLSpanElement;
} {
  const container = document.createElement('div');
  container.style.cssText = `
    margin-bottom: 12px;
  `;
  
  const groupLabel = document.createElement('div');
  groupLabel.textContent = label;
  groupLabel.style.cssText = `
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  
  const row = document.createElement('div');
  row.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = min.toString();
  slider.max = max.toString();
  slider.step = step;
  slider.style.cssText = `
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  `;
  
  const value = document.createElement('span');
  value.style.cssText = `
    width: 70px;
    text-align: right;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
  `;
  
  addSliderStyles(slider, '#ff9ff3');
  
  row.appendChild(slider);
  row.appendChild(value);
  container.appendChild(groupLabel);
  container.appendChild(row);
  
  return { container, slider, value };
}

function addSliderStyles(slider: HTMLInputElement, color: string): void {
  const style = document.createElement('style');
  const uniqueId = 'slider-' + Math.random().toString(36).substr(2, 9);
  slider.classList.add(uniqueId);
  
  style.textContent = `
    .${uniqueId}::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      background: ${color};
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 0 10px ${color};
    }
    
    .${uniqueId}::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 15px ${color};
    }
    
    .${uniqueId}::-moz-range-thumb {
      width: 14px;
      height: 14px;
      background: ${color};
      border: none;
      border-radius: 50%;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      box-shadow: 0 0 10px ${color};
    }
    
    .${uniqueId}::-moz-range-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 15px ${color};
    }
  `;
  
  document.head.appendChild(style);
}

function addButtonHoverEffects(btn: HTMLElement): void {
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px)';
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
  });
  
  btn.addEventListener('mousedown', () => {
    btn.style.transform = 'scale(0.95)';
  });
  
  btn.addEventListener('mouseup', () => {
    btn.style.transform = 'translateY(-2px) scale(1)';
  });
}

function attachToContainer(container: HTMLElement): void {
  container.appendChild(panel);
  container.appendChild(floatingBtn);
}

function bindEvents(
  onResetAll: () => void,
  onPositionChange: (axis: 'x' | 'y' | 'z', value: number) => void,
  onScaleChange: (axis: 'x' | 'y' | 'z', value: number) => void,
  onRotationChange: (value: number) => void,
  onRotationSpeedChange: (value: number) => void
): void {
  toggleBtn.addEventListener('click', togglePanel);
  floatingBtn.addEventListener('click', toggleMobilePanel);
  
  ['x', 'y', 'z'].forEach(axis => {
    positionSliders[axis as keyof SliderElements].addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      onPositionChange(axis as 'x' | 'y' | 'z', value);
      positionValues[axis as keyof ValueElements].textContent = value.toFixed(1);
    });
    
    scaleSliders[axis as keyof SliderElements].addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      onScaleChange(axis as 'x' | 'y' | 'z', value);
      scaleValues[axis as keyof ValueElements].textContent = value.toFixed(2);
    });
  });
  
  rotationSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    onRotationChange(value);
    rotationValue.textContent = value + '°';
  });
  
  rotationSpeedSlider.addEventListener('input', (e) => {
    const value = parseInt((e.target as HTMLInputElement).value);
    onRotationSpeedChange(value);
    rotationSpeedValue.textContent = value + '°/s';
  });
  
  rotationToggleBtn.addEventListener('click', () => {
    selectionManager.toggleRotation();
    updateRotationToggleButton();
  });
  
  resetBtn.addEventListener('click', () => {
    if (confirm('确定要重置所有几何体到初始状态吗？')) {
      onResetAll();
    }
  });
}

function checkViewport(): void {
  isMobileView = window.innerWidth < MOBILE_BREAKPOINT;
  
  if (isMobileView) {
    floatingBtn.style.display = 'flex';
    if (isPanelCollapsed) {
      panel.style.transform = 'translateX(-120%)';
      panel.style.opacity = '0';
    } else {
      panel.style.left = '0';
      panel.style.bottom = '0';
      panel.style.borderRadius = '0 16px 0 0';
      panel.style.transform = 'translateX(-120%)';
      panel.style.opacity = '0';
    }
  } else {
    floatingBtn.style.display = 'none';
    panel.style.left = '20px';
    panel.style.bottom = '20px';
    panel.style.borderRadius = '16px';
    
    if (isPanelCollapsed) {
      panel.style.transform = 'scale(0.95)';
      panel.style.opacity = '0';
      panel.style.pointerEvents = 'none';
    } else {
      panel.style.transform = 'scale(1)';
      panel.style.opacity = '1';
      panel.style.pointerEvents = 'auto';
    }
  }
}

function togglePanel(): void {
  isPanelCollapsed = !isPanelCollapsed;
  toggleBtn.innerHTML = isPanelCollapsed ? '+' : '&#8211;';
  checkViewport();
}

function toggleMobilePanel(): void {
  isPanelCollapsed = !isPanelCollapsed;
  
  if (!isPanelCollapsed) {
    panel.style.transform = 'translateX(0)';
    panel.style.opacity = '1';
    floatingBtn.innerHTML = '&times;';
  } else {
    panel.style.transform = 'translateX(-120%)';
    panel.style.opacity = '0';
    floatingBtn.innerHTML = '&#9881;';
  }
}

function updateRotationToggleButton(): void {
  const isRotating = selectionManager.isObjectRotating();
  rotationToggleBtn.textContent = isRotating ? '停止自转 (R)' : '开始自转 (R)';
  
  if (isRotating) {
    rotationToggleBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #feca57)';
  } else {
    rotationToggleBtn.style.background = 'linear-gradient(135deg, #5f27cd, #48dbfb)';
  }
}

export function updateUI(mesh: THREE.Mesh | null): void {
  if (!mesh) {
    nameDisplay.textContent = '未选中几何体';
    nameDisplay.style.color = 'rgba(255, 255, 255, 0.5)';
    
    ['x', 'y', 'z'].forEach(axis => {
      positionSliders[axis as keyof SliderElements].disabled = true;
      scaleSliders[axis as keyof SliderElements].disabled = true;
      positionValues[axis as keyof ValueElements].textContent = '—';
      scaleValues[axis as keyof ValueElements].textContent = '—';
    });
    
    rotationSlider.disabled = true;
    rotationSpeedSlider.disabled = true;
    rotationToggleBtn.disabled = true;
    rotationToggleBtn.style.opacity = '0.5';
    rotationValue.textContent = '—';
    rotationSpeedValue.textContent = '—';
    
    return;
  }
  
  const material = mesh.material as THREE.MeshStandardMaterial;
  const colorHex = '#' + material.color.getHexString();
  
  nameDisplay.innerHTML = `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${colorHex};margin-right:8px;box-shadow:0 0 10px ${colorHex};"></span>${mesh.userData.name}`;
  nameDisplay.style.color = '#fff';
  
  ['x', 'y', 'z'].forEach(axis => {
    const posKey = axis as keyof SliderElements;
    const valKey = axis as keyof ValueElements;
    
    positionSliders[posKey].disabled = false;
    positionSliders[posKey].value = mesh.position[axis].toString();
    positionValues[valKey].textContent = mesh.position[axis].toFixed(1);
    
    scaleSliders[posKey].disabled = false;
    scaleSliders[posKey].value = mesh.scale[axis].toString();
    scaleValues[valKey].textContent = mesh.scale[axis].toFixed(2);
  });
  
  rotationSlider.disabled = false;
  rotationSlider.value = selectionManager.getRotationYDegrees().toString();
  rotationValue.textContent = selectionManager.getRotationYDegrees() + '°';
  
  rotationSpeedSlider.disabled = false;
  rotationSpeedSlider.value = selectionManager.getRotationSpeed().toString();
  rotationSpeedValue.textContent = selectionManager.getRotationSpeed() + '°/s';
  
  rotationToggleBtn.disabled = false;
  rotationToggleBtn.style.opacity = '1';
  updateRotationToggleButton();
}

export function updateRotationSpeedUI(speed: number): void {
  rotationSpeedSlider.value = speed.toString();
  rotationSpeedValue.textContent = speed + '°/s';
}

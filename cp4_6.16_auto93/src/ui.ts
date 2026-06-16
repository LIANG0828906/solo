import { useStore, WindState, PlantData } from './store';

export function createUI(): {
  updateWindIndicator: (wind: WindState) => void;
  updatePlantInfo: (plant: PlantData | null) => void;
  container: HTMLDivElement;
} {
  const container = document.createElement('div');
  container.id = 'ui-overlay';
  container.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 10;
  `;
  document.getElementById('canvas-container')!.appendChild(container);

  createHelpPanel(container);
  const windIndicator = createWindIndicator(container);
  const infoPanel = createInfoPanel(container);

  return {
    updateWindIndicator: (wind) => updateWindIndicator(windIndicator, wind),
    updatePlantInfo: (plant) => updatePlantInfo(infoPanel, plant),
    container,
  };
}

function createHelpPanel(parent: HTMLElement): void {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-radius: 12px; padding: 18px 20px;
    color: white; font-size: 13px; line-height: 2;
    border: 1px solid rgba(255,255,255,0.2);
    pointer-events: auto;
    max-width: 200px;
  `;
  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 14px; font-weight: 600; margin-bottom: 8px;
    letter-spacing: 1px; opacity: 0.9;
  `;
  title.textContent = '操作指南';
  panel.appendChild(title);

  const items = [
    ['🖱 左键点击', '放置禾苗'],
    ['🖱 右键拖拽', '旋转视角'],
    ['🔄 滚轮', '缩放场景'],
    ['📋 左键点击禾苗', '查看信息'],
  ];
  items.forEach(([icon, desc]) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:6px;opacity:0.85;';
    const label = document.createElement('span');
    label.textContent = icon;
    label.style.cssText = 'min-width:90px;font-size:12px;';
    const val = document.createElement('span');
    val.textContent = desc;
    val.style.cssText = 'font-size:12px;opacity:0.8;';
    row.appendChild(label);
    row.appendChild(val);
    panel.appendChild(row);
  });

  parent.appendChild(panel);
}

interface WindIndicatorElements {
  arrow: HTMLDivElement;
  dots: HTMLDivElement[];
  strengthText: HTMLDivElement;
}

function createWindIndicator(parent: HTMLElement): WindIndicatorElements {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border-radius: 24px; padding: 8px 24px;
    display: flex; align-items: center; gap: 16px;
    color: white; font-size: 13px;
    border: 1px solid rgba(255,255,255,0.15);
    pointer-events: auto;
  `;

  const arrow = document.createElement('div');
  arrow.style.cssText = `
    width: 28px; height: 28px; display: flex; align-items: center;
    justify-content: center; transition: transform 0.5s ease;
    font-size: 20px;
  `;
  arrow.textContent = '🧭';

  const label = document.createElement('span');
  label.style.cssText = 'opacity:0.7;font-size:12px;';
  label.textContent = '风力';

  const dotsContainer = document.createElement('div');
  dotsContainer.style.cssText = 'display:flex;gap:4px;align-items:center;';

  const dots: HTMLDivElement[] = [];
  for (let i = 0; i < 5; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 10px; height: 10px; border-radius: 50%;
      background: rgba(255,255,255,0.2); transition: all 0.4s ease;
    `;
    dots.push(dot);
    dotsContainer.appendChild(dot);
  }

  const strengthText = document.createElement('div');
  strengthText.style.cssText = 'font-size:12px;opacity:0.8;min-width:24px;text-align:center;';

  wrapper.appendChild(arrow);
  wrapper.appendChild(label);
  wrapper.appendChild(dotsContainer);
  wrapper.appendChild(strengthText);
  parent.appendChild(wrapper);

  return { arrow, dots, strengthText };
}

function updateWindIndicator(elements: WindIndicatorElements, wind: WindState): void {
  elements.arrow.style.transform = `rotate(${wind.direction}deg)`;

  const level = Math.round(wind.strength);
  const colors = ['#42A5F5', '#66BB6A', '#FDD835', '#FF9800', '#EF5350'];

  elements.dots.forEach((dot, i) => {
    if (i < level) {
      dot.style.background = colors[Math.min(i, colors.length - 1)];
      dot.style.transform = 'scale(1.2)';
      dot.style.boxShadow = `0 0 6px ${colors[Math.min(i, colors.length - 1)]}`;
    } else {
      dot.style.background = 'rgba(255,255,255,0.2)';
      dot.style.transform = 'scale(1)';
      dot.style.boxShadow = 'none';
    }
  });

  elements.strengthText.textContent = `${level}级`;
}

interface InfoPanelElements {
  panel: HTMLDivElement;
  age: HTMLDivElement;
  height: HTMLDivElement;
  leaves: HTMLDivElement;
  particles: HTMLDivElement;
}

function createInfoPanel(parent: HTMLElement): InfoPanelElements {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: absolute; top: 16px; left: 16px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    border-radius: 8px; padding: 16px 20px;
    color: white; font-size: 13px; line-height: 1.8;
    min-width: 160px;
    opacity: 0; transform: translateY(-8px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  `;

  const title = document.createElement('div');
  title.style.cssText = 'font-size:14px;font-weight:600;margin-bottom:8px;opacity:0.9;';
  title.textContent = '禾苗信息';
  panel.appendChild(title);

  const age = createInfoRow(panel, '年龄');
  const height = createInfoRow(panel, '高度');
  const leaves = createInfoRow(panel, '叶片数');
  const particles = createInfoRow(panel, '穗粒子数');

  parent.appendChild(panel);

  return { panel, age, height, leaves, particles };
}

function createInfoRow(parent: HTMLElement, label: string): HTMLDivElement {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

  const lbl = document.createElement('span');
  lbl.style.cssText = 'opacity:0.7;font-size:12px;';
  lbl.textContent = label;

  const val = document.createElement('span');
  val.style.cssText = 'font-size:13px;font-weight:500;transition:opacity 0.3s ease;';

  row.appendChild(lbl);
  row.appendChild(val);
  parent.appendChild(row);
  return val;
}

function updatePlantInfo(elements: InfoPanelElements, plant: PlantData | null): void {
  if (!plant) {
    elements.panel.style.opacity = '0';
    elements.panel.style.transform = 'translateY(-8px)';
    return;
  }

  elements.panel.style.opacity = '1';
  elements.panel.style.transform = 'translateY(0)';

  const age = ((Date.now() - plant.createdAt) / 1000).toFixed(1);
  elements.age.textContent = `${age}s`;
  elements.age.style.opacity = '0';
  requestAnimationFrame(() => { elements.age.style.opacity = '1'; });

  elements.height.textContent = `${plant.currentHeight.toFixed(2)}m`;
  elements.height.style.opacity = '0';
  requestAnimationFrame(() => { elements.height.style.opacity = '1'; });

  elements.leaves.textContent = `${plant.leafCount}`;
  elements.leaves.style.opacity = '0';
  requestAnimationFrame(() => { elements.leaves.style.opacity = '1'; });

  elements.particles.textContent = `${plant.earParticleCount}`;
  elements.particles.style.opacity = '0';
  requestAnimationFrame(() => { elements.particles.style.opacity = '1'; });
}

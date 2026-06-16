import { useStore, WindState, PlantData } from './store';

interface UIHandlers {
  updateWindIndicator: (wind: WindState) => void;
  updatePlantInfo: (plant: PlantData | null) => void;
  container: HTMLDivElement;
}

interface WindIndicatorElements {
  arrow: HTMLDivElement;
  dots: HTMLDivElement[];
  strengthText: HTMLDivElement;
}

interface InfoPanelElements {
  panel: HTMLDivElement;
  age: HTMLDivElement;
  height: HTMLDivElement;
  leaves: HTMLDivElement;
  particles: HTMLDivElement;
  lastValues: { age: string; height: string; leaves: string; particles: string };
}

export function createUI(): UIHandlers {
  const container = document.createElement('div');
  container.id = 'ui-overlay';
  container.style.cssText = `
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 10;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  document.getElementById('canvas-container')!.appendChild(container);

  createHelpPanel(container);
  const windIndicator = createWindIndicator(container);
  const infoPanel = createInfoPanel(container);

  let infoPanelVisible = false;

  useStore.subscribe(
    (state) => state.selectedPlantId,
    (selectedId) => {
      if (!selectedId) {
        infoPanelVisible = false;
        infoPanel.panel.style.opacity = '0';
        infoPanel.panel.style.transform = 'translateY(-8px)';
        return;
      }
      infoPanelVisible = true;
      infoPanel.panel.style.opacity = '1';
      infoPanel.panel.style.transform = 'translateY(0)';
    },
    { fireImmediately: true }
  );

  return {
    updateWindIndicator: (wind) => applyWindUpdate(windIndicator, wind),
    updatePlantInfo: (plant) => {
      if (!plant) {
        if (infoPanelVisible) {
          infoPanelVisible = false;
          infoPanel.panel.style.opacity = '0';
          infoPanel.panel.style.transform = 'translateY(-8px)';
        }
        return;
      }
      if (!infoPanelVisible) {
        infoPanelVisible = true;
        infoPanel.panel.style.opacity = '1';
        infoPanel.panel.style.transform = 'translateY(0)';
      }
      applyPlantInfoUpdate(infoPanel, plant);
    },
    container,
  };
}

function createHelpPanel(parent: HTMLElement): void {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    background: rgba(20, 40, 25, 0.35);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    backdrop-filter: blur(14px) saturate(180%);
    border-radius: 12px; padding: 18px 20px;
    color: white; font-size: 13px; line-height: 2.1;
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
    max-width: 220px;
  `;
  const title = document.createElement('div');
  title.style.cssText = `
    font-size: 14px; font-weight: 700; margin-bottom: 10px;
    letter-spacing: 1.2px; opacity: 0.95;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  `;
  title.textContent = '操作指南';
  panel.appendChild(title);

  const items: [string, string][] = [
    ['🖱 左键点击空地', '放置禾苗'],
    ['🖱 左键点击禾苗', '查看信息'],
    ['� 右键拖拽', '旋转视角'],
    ['� 滚轮滚动', '缩放场景'],
  ];
  items.forEach(([icon, desc]) => {
    const row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;gap:8px;opacity:0.9;';
    const label = document.createElement('span');
    label.textContent = icon;
    label.style.cssText = 'min-width:110px;font-size:12px;';
    const val = document.createElement('span');
    val.textContent = desc;
    val.style.cssText = 'font-size:12px;opacity:0.85;';
    row.appendChild(label);
    row.appendChild(val);
    panel.appendChild(row);
  });

  parent.appendChild(panel);
}

function createWindIndicator(parent: HTMLElement): WindIndicatorElements {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    position: absolute; top: 16px; left: 50%; transform: translateX(-50%);
    background: rgba(20, 30, 45, 0.4);
    -webkit-backdrop-filter: blur(14px) saturate(180%);
    backdrop-filter: blur(14px) saturate(180%);
    border-radius: 28px; padding: 10px 26px;
    display: flex; align-items: center; gap: 14px;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    pointer-events: auto;
  `;

  const arrowWrap = document.createElement('div');
  arrowWrap.style.cssText = `
    width: 30px; height: 30px; display: flex; align-items: center;
    justify-content: center; transition: transform 0.5s cubic-bezier(.4,0,.2,1);
    font-size: 22px; line-height: 1;
  `;
  arrowWrap.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3L8 12L12 10L16 12L12 3Z" fill="#ffffff" stroke="#ffffff" stroke-width="0.5" stroke-linejoin="round"/><path d="M12 10L9 21L12 19L15 21L12 10Z" fill="#ffd700" stroke="#ffd700" stroke-width="0.5" stroke-linejoin="round"/></svg>';

  const arrow = arrowWrap;

  const label = document.createElement('span');
  label.style.cssText = 'opacity:0.75;font-size:12px;font-weight:500;';
  label.textContent = '风力';

  const dotsContainer = document.createElement('div');
  dotsContainer.style.cssText =
    'display:flex;gap:5px;align-items:center;';

  const dots: HTMLDivElement[] = [];
  for (let i = 0; i < 5; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 11px; height: 11px; border-radius: 50%;
      background: rgba(255,255,255,0.2);
      transition: all 0.45s cubic-bezier(.4,0,.2,1);
      border: 1px solid rgba(255,255,255,0.15);
    `;
    dots.push(dot);
    dotsContainer.appendChild(dot);
  }

  const strengthText = document.createElement('div');
  strengthText.style.cssText =
    'font-size:13px;opacity:0.9;min-width:28px;text-align:center;font-weight:600;';

  wrapper.appendChild(arrow);
  wrapper.appendChild(label);
  wrapper.appendChild(dotsContainer);
  wrapper.appendChild(strengthText);
  parent.appendChild(wrapper);

  return { arrow, dots, strengthText };
}

function applyWindUpdate(elements: WindIndicatorElements, wind: WindState): void {
  elements.arrow.style.transform = `rotate(${wind.direction}deg)`;

  const level = Math.max(0, Math.min(5, Math.round(wind.strength)));

  const dotColors = [
    '#4FC3F7',
    '#66BB6A',
    '#FFEE58',
    '#FF9800',
    '#EF5350',
  ];

  elements.dots.forEach((dot, i) => {
    if (i < level) {
      const c = dotColors[Math.min(i, dotColors.length - 1)];
      dot.style.background = c;
      dot.style.transform = 'scale(1.25)';
      dot.style.boxShadow = `0 0 7px ${c}, 0 0 12px ${c}66`;
      dot.style.borderColor = c;
    } else {
      dot.style.background = 'rgba(255,255,255,0.18)';
      dot.style.transform = 'scale(1)';
      dot.style.boxShadow = 'none';
      dot.style.borderColor = 'rgba(255,255,255,0.15)';
    }
  });

  elements.strengthText.textContent = `${level}级`;
}

function createInfoPanel(parent: HTMLElement): InfoPanelElements {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: absolute; top: 16px; left: 16px;
    background: rgba(10, 15, 20, 0.62);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    backdrop-filter: blur(12px) saturate(180%);
    border-radius: 8px; padding: 16px 20px;
    color: white; font-size: 13px; line-height: 1.9;
    min-width: 180px;
    opacity: 0; transform: translateY(-8px);
    transition: opacity 0.35s cubic-bezier(.4,0,.2,1), transform 0.35s cubic-bezier(.4,0,.2,1);
    pointer-events: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
  `;

  const title = document.createElement('div');
  title.style.cssText =
    'font-size:14px;font-weight:700;margin-bottom:10px;opacity:0.95;letter-spacing:0.5px;';
  title.textContent = '禾苗信息';
  panel.appendChild(title);

  const age = createInfoRow(panel, '年龄');
  const height = createInfoRow(panel, '高度');
  const leaves = createInfoRow(panel, '叶片数');
  const particles = createInfoRow(panel, '穗粒子数');

  parent.appendChild(panel);

  return {
    panel,
    age,
    height,
    leaves,
    particles,
    lastValues: { age: '', height: '', leaves: '', particles: '' },
  };
}

function createInfoRow(parent: HTMLElement, label: string): HTMLDivElement {
  const row = document.createElement('div');
  row.style.cssText =
    'display:flex;justify-content:space-between;align-items:center;';

  const lbl = document.createElement('span');
  lbl.style.cssText = 'opacity:0.7;font-size:12px;';
  lbl.textContent = label;

  const val = document.createElement('span');
  val.style.cssText = `
    font-size:13px;font-weight:600;
    opacity: 1;
    transition: opacity 0.25s ease, transform 0.25s ease;
    display:inline-block;
  `;

  row.appendChild(lbl);
  row.appendChild(val);
  parent.appendChild(row);
  return val;
}

function fadeUpdate(el: HTMLDivElement, newValue: string): void {
  el.style.opacity = '0.2';
  el.style.transform = 'translateY(2px)';
  window.setTimeout(() => {
    el.textContent = newValue;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }, 120);
}

function applyPlantInfoUpdate(
  elements: InfoPanelElements,
  plant: PlantData
): void {
  const age = ((Date.now() - plant.createdAt) / 1000).toFixed(1) + 's';
  const height = plant.currentHeight.toFixed(2) + 'm';
  const leaves = String(plant.leafCount);
  const particles = String(plant.earParticleCount);

  if (elements.lastValues.age !== age) {
    fadeUpdate(elements.age, age);
    elements.lastValues.age = age;
  }
  if (elements.lastValues.height !== height) {
    fadeUpdate(elements.height, height);
    elements.lastValues.height = height;
  }
  if (elements.lastValues.leaves !== leaves) {
    fadeUpdate(elements.leaves, leaves);
    elements.lastValues.leaves = leaves;
  }
  if (elements.lastValues.particles !== particles) {
    fadeUpdate(elements.particles, particles);
    elements.lastValues.particles = particles;
  }
}

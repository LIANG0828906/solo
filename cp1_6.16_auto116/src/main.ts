import { initScene, createTrailPath, startFlyingStar, playClickSound, CONSTELLATIONS } from './core/main';
import { createConstellationPanel } from './weave/panel';
import { createTimelinePanel, generateThumbnailFromPoints } from './weave/timeline';
import { useStore } from './store';
import * as THREE from 'three';

function createCentralConsole(container: HTMLElement): void {
  const consoleDiv = document.createElement('div');
  consoleDiv.className = 'ui-panel central-console';
  consoleDiv.style.cssText = `
    position: absolute;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  `;

  const weaveBtn = createOctagonButton();
  consoleDiv.appendChild(weaveBtn);

  const hintText = document.createElement('span');
  hintText.textContent = '连接星宿后点击编织';
  hintText.style.cssText = `
    color: rgba(224, 240, 255, 0.5);
    font-size: 12px;
    letter-spacing: 2px;
  `;
  consoleDiv.appendChild(hintText);

  let prevConnected = useStore.getState().connectedConstellations;
  useStore.subscribe((state) => {
    if (state.connectedConstellations === prevConnected) return;
    prevConnected = state.connectedConstellations;
    const canWeave = state.connectedConstellations.length >= 2;
    const btnInner = weaveBtn.querySelector('.octagon-inner') as HTMLElement;
    const btnText = weaveBtn.querySelector('.weave-text') as HTMLElement;
    if (canWeave) {
      weaveBtn.style.cursor = 'pointer';
      if (btnInner) {
        btnInner.style.fill = 'url(#btnGradientActive)';
        btnInner.setAttribute('filter', 'brightness(1.1)');
      }
      if (btnText) {
        btnText.setAttribute('fill', '#FFF8DC');
      }
    } else {
      weaveBtn.style.cursor = 'not-allowed';
      if (btnInner) {
        btnInner.style.fill = 'url(#btnGradient)';
        btnInner.setAttribute('filter', 'none');
      }
      if (btnText) {
        btnText.setAttribute('fill', 'rgba(255, 248, 220, 0.4)');
      }
    }
  });

  weaveBtn.addEventListener('click', () => {
    const { connectedConstellations, currentColorStart, currentColorEnd, addTrail } = useStore.getState();
    if (connectedConstellations.length < 2) return;

    const points: THREE.Vector3[] = [];
    connectedConstellations.forEach((id) => {
      const c = CONSTELLATIONS.find((c) => c.id === id);
      if (c && c.stars.length > 0) {
        const centerIdx = Math.floor(c.stars.length / 2);
        points.push(c.stars[centerIdx].position.clone());
      }
    });

    createTrailPath(points, currentColorStart, currentColorEnd);
    startFlyingStar();

    const thumbnail = generateThumbnailFromPoints(points, currentColorStart, currentColorEnd);
    const now = Date.now();

    addTrail({
      id: `trail-${now}`,
      name: `星轨 ${new Date(now).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`,
      createdAt: now,
      constellationIds: [...connectedConstellations],
      colorStart: currentColorStart,
      colorEnd: currentColorEnd,
      thumbnail,
    });

    playClickSound();
  });

  container.appendChild(consoleDiv);
}

function createOctagonButton(): HTMLElement {
  const btn = document.createElement('div');
  btn.className = 'octagon-button';
  btn.style.cssText = `
    position: relative;
    width: 120px;
    height: 120px;
    cursor: not-allowed;
    transition: transform 0.3s ease;
  `;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '120');
  svg.setAttribute('height', '120');
  svg.setAttribute('viewBox', '0 0 120 120');

  const octagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  const points = [];
  const cx = 60;
  const cy = 60;
  const r = 56;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  octagon.setAttribute('points', points.join(' '));
  octagon.setAttribute('fill', 'none');
  octagon.setAttribute('stroke', '#D4AF37');
  octagon.setAttribute('stroke-width', '2');
  svg.appendChild(octagon);

  const innerOctagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  const innerPoints = [];
  const innerR = 48;
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 8;
    const x = cx + innerR * Math.cos(angle);
    const y = cy + innerR * Math.sin(angle);
    innerPoints.push(`${x},${y}`);
  }
  innerOctagon.setAttribute('points', innerPoints.join(' '));
  innerOctagon.setAttribute('fill', 'url(#btnGradient)');
  innerOctagon.classList.add('octagon-inner');
  innerOctagon.style.transition = 'all 0.3s ease';
  svg.appendChild(innerOctagon);

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', 'btnGradient');
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '100%');
  gradient.setAttribute('y2', '100%');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#6B5344');
  gradient.appendChild(stop1);

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#4A3C30');
  gradient.appendChild(stop2);

  defs.appendChild(gradient);
  svg.insertBefore(defs, octagon);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '60');
  text.setAttribute('y', '65');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', 'rgba(255, 248, 220, 0.4)');
  text.setAttribute('font-size', '16');
  text.setAttribute('font-family', '"Noto Serif SC", "STKaiti", serif');
  text.setAttribute('letter-spacing', '4');
  text.classList.add('weave-text');
  text.textContent = '编织';
  svg.appendChild(text);

  btn.appendChild(svg);

  btn.addEventListener('mouseenter', () => {
    const { connectedConstellations } = useStore.getState();
    if (connectedConstellations.length >= 2) {
      btn.style.transform = 'scale(1.05)';
      innerOctagon.setAttribute('filter', 'brightness(1.2)');
    }
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    innerOctagon.setAttribute('filter', 'none');
  });

  return btn;
}

function createColorControlPanel(container: HTMLElement): void {
  const panel = document.createElement('div');
  panel.className = 'ui-panel color-control-panel';
  panel.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(42, 42, 62, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 12px;
    padding: 16px 28px;
    z-index: 100;
    display: flex;
    gap: 36px;
    align-items: center;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  `;

  const controls = [
    {
      label: '星轨颜色',
      min: 0,
      max: 360,
      value: 180,
      onChange: (value: number) => {
        const hue = value;
        const startColor = hslToHex(hue, 0.7, 0.6);
        const endColor = hslToHex((hue + 60) % 360, 0.7, 0.6);
        useStore.getState().setColorStart(startColor);
        useStore.getState().setColorEnd(endColor);
      },
      getColor: () => useStore.getState().currentColorStart,
    },
    {
      label: '星点亮度',
      min: 0.2,
      max: 2.0,
      value: 1.0,
      onChange: (value: number) => {
        useStore.getState().setStarBrightness(value);
      },
      getColor: () => '#E0F0FF',
    },
    {
      label: '星云密度',
      min: 0,
      max: 1.0,
      value: 0.3,
      onChange: (value: number) => {
        useStore.getState().setNebulaDensity(value);
      },
      getColor: () => '#8866ff',
    },
  ];

  controls.forEach((control) => {
    const controlDiv = document.createElement('div');
    controlDiv.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    `;

    const label = document.createElement('span');
    label.textContent = control.label;
    label.style.cssText = `
      color: #D4AF37;
      font-size: 12px;
      letter-spacing: 2px;
    `;
    controlDiv.appendChild(label);

    const slider = createGoldenSlider(control.min, control.max, control.value, control.onChange);
    controlDiv.appendChild(slider);

    panel.appendChild(controlDiv);
  });

  container.appendChild(panel);
}

function createGoldenSlider(
  min: number,
  max: number,
  initialValue: number,
  onChange: (value: number) => void
): HTMLElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: relative;
    width: 120px;
    height: 24px;
    display: flex;
    align-items: center;
  `;

  const track = document.createElement('div');
  track.style.cssText = `
    width: 100%;
    height: 4px;
    background: rgba(212, 175, 55, 0.2);
    border-radius: 2px;
    position: absolute;
  `;
  container.appendChild(track);

  const fill = document.createElement('div');
  fill.style.cssText = `
    height: 100%;
    background: linear-gradient(to right, #D4AF37, #FFD700);
    border-radius: 2px;
    position: absolute;
    left: 0;
    transition: width 0.1s ease;
  `;
  track.appendChild(fill);

  const knob = document.createElement('div');
  knob.style.cssText = `
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #FFD700, #B8860B);
    border: 2px solid #D4AF37;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    cursor: grab;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3);
    transition: box-shadow 0.3s ease, transform 0.1s ease;
    z-index: 1;
  `;
  container.appendChild(knob);

  let dragging = false;

  function updatePosition(value: number): void {
    const percent = ((value - min) / (max - min)) * 100;
    const clampedPercent = Math.max(0, Math.min(100, percent));
    knob.style.left = `calc(${clampedPercent}% - 10px)`;
    fill.style.width = `${clampedPercent}%`;
  }

  function updateValue(clientX: number): void {
    const rect = container.getBoundingClientRect();
    const percent = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, percent));
    const value = min + clamped * (max - min);
    updatePosition(value);
    onChange(value);
  }

  updatePosition(initialValue);

  knob.addEventListener('mousedown', (e) => {
    dragging = true;
    knob.style.cursor = 'grabbing';
    knob.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.3)';
    knob.style.transform = 'translateY(-50%) scale(1.1)';
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    updateValue(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      knob.style.cursor = 'grab';
      knob.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.3)';
      knob.style.transform = 'translateY(-50%) scale(1)';
      playClickSound();
    }
  });

  container.addEventListener('click', (e) => {
    if (e.target === knob) return;
    updateValue(e.clientX);
    playClickSound();
  });

  return container;
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16).padStart(2, '0');
    return hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function createDividers(container: HTMLElement): void {
  const leftDivider = document.createElement('div');
  leftDivider.style.cssText = `
    position: absolute;
    left: 290px;
    top: 10%;
    bottom: 10%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(212, 175, 55, 0.5), transparent);
    z-index: 50;
  `;
  container.appendChild(leftDivider);

  const rightDivider = document.createElement('div');
  rightDivider.style.cssText = `
    position: absolute;
    right: 320px;
    top: 10%;
    bottom: 10%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, rgba(212, 175, 55, 0.5), transparent);
    z-index: 50;
  `;
  container.appendChild(rightDivider);
}

function createTitle(container: HTMLElement): void {
  const title = document.createElement('div');
  title.style.cssText = `
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    text-align: center;
    pointer-events: none;
  `;

  const mainTitle = document.createElement('h1');
  mainTitle.textContent = '古星象仪';
  mainTitle.style.cssText = `
    color: #D4AF37;
    font-size: 28px;
    letter-spacing: 12px;
    font-weight: 400;
    text-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
    margin-bottom: 4px;
  `;
  title.appendChild(mainTitle);

  const subTitle = document.createElement('p');
  subTitle.textContent = '星轨编织器';
  subTitle.style.cssText = `
    color: rgba(224, 240, 255, 0.6);
    font-size: 14px;
    letter-spacing: 8px;
  `;
  title.appendChild(subTitle);

  container.appendChild(title);
}

function init(): void {
  const app = document.getElementById('app');
  if (!app) return;

  const canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) return;

  initScene(canvasContainer);
  createConstellationPanel(app);
  createTimelinePanel(app);
  createCentralConsole(app);
  createColorControlPanel(app);
  createDividers(app);
  createTitle(app);
}

document.addEventListener('DOMContentLoaded', init);

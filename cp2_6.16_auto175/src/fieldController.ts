import * as THREE from 'three';
import {
  FieldParams,
  ControlPanelState,
  Stats,
  ACCENT_COLOR,
  TEXT_COLOR,
  DEFAULT_FIELD_PARAMS,
  MAX_TRAIL_LENGTH
} from './types';
import { ParticleSystem } from './particleSystem';

export class FieldController {
  private panel: HTMLDivElement;
  private statsPanel: HTMLDivElement;
  private tooltip: HTMLDivElement;
  private panelState: ControlPanelState = {
    activeTab: 'basic',
    fieldStrength: DEFAULT_FIELD_PARAMS.magneticFieldStrength,
    particleCount: DEFAULT_FIELD_PARAMS.particleCount,
    emissionSpeed: DEFAULT_FIELD_PARAMS.emissionSpeed,
    trailEnabled: true,
    trailLength: MAX_TRAIL_LENGTH
  };
  private onParamsChange: (params: Partial<FieldParams>) => void;
  private animatedCount = 0;
  private targetCount = 0;
  private countAnimFrame: number | null = null;

  constructor(
    container: HTMLElement,
    onParamsChange: (params: Partial<FieldParams>) => void
  ) {
    this.onParamsChange = onParamsChange;
    this.panel = this.createControlPanel();
    this.statsPanel = this.createStatsPanel();
    this.tooltip = this.createTooltip();
    container.appendChild(this.panel);
    container.appendChild(this.statsPanel);
    container.appendChild(this.tooltip);
  }

  private createControlPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 280px;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 0;
      font-family: 'Inter', sans-serif;
      color: ${TEXT_COLOR};
      z-index: 100;
      overflow: hidden;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px 20px;
      font-size: 16px;
      font-weight: 600;
      color: ${ACCENT_COLOR};
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      letter-spacing: 0.5px;
    `;
    header.textContent = 'VortexField Controls';
    panel.appendChild(header);

    const tabs = document.createElement('div');
    tabs.style.cssText = `
      display: flex;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    `;
    const tabNames: Array<{ key: 'basic' | 'trail' | 'stats'; label: string }> = [
      { key: 'basic', label: 'Parameters' },
      { key: 'trail', label: 'Trails' },
      { key: 'stats', label: 'Statistics' }
    ];
    for (const tab of tabNames) {
      const btn = document.createElement('button');
      btn.style.cssText = `
        flex: 1;
        padding: 10px 0;
        background: transparent;
        border: none;
        color: ${TEXT_COLOR};
        font-family: 'Inter', sans-serif;
        font-size: 13px;
        cursor: pointer;
        transition: color 0.2s, border-bottom 0.2s;
        border-bottom: 2px solid transparent;
      `;
      btn.textContent = tab.label;
      btn.dataset.tab = tab.key;
      if (tab.key === this.panelState.activeTab) {
        btn.style.color = ACCENT_COLOR;
        btn.style.borderBottomColor = ACCENT_COLOR;
      }
      btn.addEventListener('mouseenter', () => {
        btn.style.boxShadow = `0 0 10px ${ACCENT_COLOR}`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.boxShadow = 'none';
      });
      btn.addEventListener('click', () => {
        this.panelState.activeTab = tab.key;
        this.updateTabContent();
        tabs.querySelectorAll('button').forEach(b => {
          (b as HTMLButtonElement).style.color = TEXT_COLOR;
          (b as HTMLButtonElement).style.borderBottomColor = 'transparent';
        });
        btn.style.color = ACCENT_COLOR;
        btn.style.borderBottomColor = ACCENT_COLOR;
      });
      tabs.appendChild(btn);
    }
    panel.appendChild(tabs);

    const content = document.createElement('div');
    content.id = 'panel-content';
    content.style.cssText = `
      padding: 16px 20px;
      transition: opacity 0.3s ease;
    `;
    panel.appendChild(content);

    this.populateTabContent(content);
    return panel;
  }

  private populateTabContent(content: HTMLDivElement) {
    content.innerHTML = '';
    switch (this.panelState.activeTab) {
      case 'basic':
        this.createBasicTab(content);
        break;
      case 'trail':
        this.createTrailTab(content);
        break;
      case 'stats':
        this.createStatsTab(content);
        break;
    }
  }

  private updateTabContent() {
    const content = this.panel.querySelector('#panel-content') as HTMLDivElement;
    if (!content) return;
    content.style.opacity = '0';

    setTimeout(() => {
      this.populateTabContent(content);
      content.style.opacity = '1';
    }, 150);
  }

  private createSlider(
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    step: number,
    value: number,
    gradient?: string,
    showValue: boolean = true
  ): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `margin-bottom: 20px;`;

    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    `;

    const lbl = document.createElement('span');
    lbl.style.cssText = `font-size: 14px; color: ${TEXT_COLOR};`;
    lbl.textContent = label;

    labelRow.appendChild(lbl);

    if (showValue) {
      const valSpan = document.createElement('span');
      valSpan.style.cssText = `font-size: 14px; color: ${ACCENT_COLOR}; font-weight: 500;`;
      valSpan.textContent = value.toFixed(step < 1 ? 1 : 0);
      valSpan.id = `val-${label.replace(/\s/g, '-')}`;
      labelRow.appendChild(valSpan);
    }

    wrapper.appendChild(labelRow);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    slider.style.cssText = `
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
      ${gradient ? `background: ${gradient};` : `background: linear-gradient(90deg, #1a3a5c, ${ACCENT_COLOR});`}
    `;

    const thumbStyle = `
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: ${ACCENT_COLOR};
      cursor: pointer;
      box-shadow: 0 0 8px rgba(0, 188, 212, 0.5);
      transition: box-shadow 0.2s;
    `;
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      input[type="range"]::-webkit-slider-thumb { ${thumbStyle} }
      input[type="range"]::-moz-range-thumb { ${thumbStyle} border: none; }
    `;
    slider.appendChild(styleEl);

    slider.addEventListener('mouseenter', () => {
      slider.style.boxShadow = `0 0 10px ${ACCENT_COLOR}`;
    });
    slider.addEventListener('mouseleave', () => {
      slider.style.boxShadow = 'none';
    });

    wrapper.appendChild(slider);
    parent.appendChild(wrapper);

    return slider;
  }

  private createBasicTab(content: HTMLDivElement) {
    const bSlider = this.createSlider(
      content,
      'Magnetic Field',
      0.5,
      5.0,
      0.1,
      this.panelState.fieldStrength,
      'linear-gradient(90deg, #2196F3, #F44336)'
    );
    const valSpan = content.querySelector('#val-Magnetic-Field') as HTMLSpanElement;
    bSlider.addEventListener('input', () => {
      this.panelState.fieldStrength = parseFloat(bSlider.value);
      if (valSpan) valSpan.textContent = this.panelState.fieldStrength.toFixed(1);
      this.onParamsChange({ magneticFieldStrength: this.panelState.fieldStrength });
    });

    const pSlider = this.createSlider(
      content,
      'Particle Count',
      10,
      100,
      5,
      this.panelState.particleCount
    );
    const pVal = content.querySelector('#val-Particle-Count') as HTMLSpanElement;
    pSlider.addEventListener('input', () => {
      this.panelState.particleCount = parseInt(pSlider.value);
      if (pVal) pVal.textContent = String(this.panelState.particleCount);
      this.onParamsChange({ particleCount: this.panelState.particleCount });
    });

    const sSlider = this.createSlider(
      content,
      'Emission Speed',
      1,
      10,
      0.5,
      this.panelState.emissionSpeed
    );
    const sVal = content.querySelector('#val-Emission-Speed') as HTMLSpanElement;
    sSlider.addEventListener('input', () => {
      this.panelState.emissionSpeed = parseFloat(sSlider.value);
      if (sVal) sVal.textContent = this.panelState.emissionSpeed.toFixed(1);
      this.onParamsChange({ emissionSpeed: this.panelState.emissionSpeed });
    });
  }

  private createTrailTab(content: HTMLDivElement) {
    const info = document.createElement('p');
    info.style.cssText = `font-size: 14px; color: ${TEXT_COLOR}; margin-bottom: 16px; line-height: 1.5;`;
    info.textContent = 'Trail visualization settings. Trails show particle paths with gradient opacity.';
    content.appendChild(info);

    const trailInfo = document.createElement('div');
    trailInfo.style.cssText = `
      padding: 12px;
      background: rgba(0, 188, 212, 0.08);
      border-radius: 8px;
      border: 1px solid rgba(0, 188, 212, 0.15);
      font-size: 13px;
      color: ${TEXT_COLOR};
      line-height: 1.6;
    `;
    trailInfo.innerHTML = `
      <div style="margin-bottom: 6px; color: ${ACCENT_COLOR}; font-weight: 500;">Trail Info</div>
      <div>Max trail length: ${MAX_TRAIL_LENGTH} points</div>
      <div>Trail opacity: gradient fade</div>
      <div>Boundary radius: 20 units</div>
    `;
    content.appendChild(trailInfo);
  }

  private createStatsTab(content: HTMLDivElement) {
    const info = document.createElement('p');
    info.style.cssText = `font-size: 14px; color: ${TEXT_COLOR}; margin-bottom: 16px; line-height: 1.5;`;
    info.textContent = 'Real-time simulation statistics are displayed in the bottom-left panel.';
    content.appendChild(info);

    const physicsInfo = document.createElement('div');
    physicsInfo.style.cssText = `
      padding: 12px;
      background: rgba(0, 188, 212, 0.08);
      border-radius: 8px;
      border: 1px solid rgba(0, 188, 212, 0.15);
      font-size: 13px;
      color: ${TEXT_COLOR};
      line-height: 1.6;
    `;
    physicsInfo.innerHTML = `
      <div style="margin-bottom: 6px; color: ${ACCENT_COLOR}; font-weight: 500;">Physics Model</div>
      <div>Lorentz Force: F = qv × B</div>
      <div>Integration: RK4 (4th order)</div>
      <div>Time step: 0.01s</div>
      <div>Electron: q = -1, m = 1</div>
      <div>Proton: q = +1, m = 1836</div>
    `;
    content.appendChild(physicsInfo);
  }

  private createStatsPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px 20px;
      font-family: 'Inter', sans-serif;
      color: ${TEXT_COLOR};
      z-index: 100;
      min-width: 200px;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: ${ACCENT_COLOR};
      margin-bottom: 12px;
    `;
    title.textContent = 'Real-time Stats';
    panel.appendChild(title);

    const countRow = document.createElement('div');
    countRow.style.cssText = `font-size: 14px; margin-bottom: 8px;`;
    countRow.innerHTML = `Particles: <span id="stat-count" style="color: ${ACCENT_COLOR}; font-weight: 500;">0</span>`;
    panel.appendChild(countRow);

    const speedRow = document.createElement('div');
    speedRow.style.cssText = `font-size: 14px; margin-bottom: 12px;`;
    speedRow.innerHTML = `Avg Speed: <span id="stat-speed" style="color: ${ACCENT_COLOR}; font-weight: 500;">0.00</span> m/s`;
    panel.appendChild(speedRow);

    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `display: flex; align-items: center; gap: 12px;`;

    const canvas = document.createElement('canvas');
    canvas.id = 'ring-chart';
    canvas.width = 80;
    canvas.height = 80;
    canvas.style.cssText = `width: 80px; height: 80px;`;
    chartContainer.appendChild(canvas);

    const legend = document.createElement('div');
    legend.style.cssText = `font-size: 12px; line-height: 1.8;`;
    legend.innerHTML = `
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #00E5FF; display: inline-block;"></span>
        <span>Electrons</span>
        <span id="stat-electrons" style="color: #00E5FF; font-weight: 500;">0</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: #FF6F00; display: inline-block;"></span>
        <span>Protons</span>
        <span id="stat-protons" style="color: #FF6F00; font-weight: 500;">0</span>
      </div>
    `;
    chartContainer.appendChild(legend);
    panel.appendChild(chartContainer);

    return panel;
  }

  private createTooltip(): HTMLDivElement {
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed;
      display: none;
      background: rgba(30, 30, 50, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 12px 16px;
      font-family: 'Inter', sans-serif;
      color: ${TEXT_COLOR};
      font-size: 13px;
      z-index: 200;
      pointer-events: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      min-width: 180px;
    `;
    tooltip.id = 'particle-tooltip';
    return tooltip;
  }

  updateStats(stats: Stats) {
    const countEl = document.getElementById('stat-count');
    if (countEl) {
      const target = stats.totalParticles;
      const current = parseInt(countEl.textContent || '0');
      if (current !== target) {
        this.animateCount(countEl, current, target, 500);
      }
    }

    const speedEl = document.getElementById('stat-speed');
    if (speedEl) {
      speedEl.textContent = stats.averageSpeed.toFixed(2);
    }

    const electronEl = document.getElementById('stat-electrons');
    if (electronEl) electronEl.textContent = String(stats.electronCount);

    const protonEl = document.getElementById('stat-protons');
    if (protonEl) protonEl.textContent = String(stats.protonCount);

    this.drawRingChart(stats.electronCount, stats.protonCount);
  }

  private animateCount(el: HTMLElement, from: number, to: number, duration: number) {
    if (this.countAnimFrame) cancelAnimationFrame(this.countAnimFrame);
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      el.textContent = String(current);
      if (progress < 1) {
        this.countAnimFrame = requestAnimationFrame(animate);
      }
    };
    this.countAnimFrame = requestAnimationFrame(animate);
  }

  private drawRingChart(electrons: number, protons: number) {
    const canvas = document.getElementById('ring-chart') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const total = electrons + protons;
    if (total === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 80 * dpr;
    canvas.height = 80 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 40;
    const cy = 40;
    const outerR = 35;
    const innerR = 22;

    ctx.clearRect(0, 0, 80, 80);

    const electronAngle = (electrons / total) * Math.PI * 2;
    const protonAngle = (protons / total) * Math.PI * 2;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, -Math.PI / 2, -Math.PI / 2 + electronAngle);
    ctx.arc(cx, cy, innerR, -Math.PI / 2 + electronAngle, -Math.PI / 2, true);
    ctx.closePath();
    ctx.fillStyle = '#00E5FF';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, -Math.PI / 2 + electronAngle, -Math.PI / 2 + electronAngle + protonAngle);
    ctx.arc(cx, cy, innerR, -Math.PI / 2 + electronAngle + protonAngle, -Math.PI / 2 + electronAngle, true);
    ctx.closePath();
    ctx.fillStyle = '#FF6F00';
    ctx.fill();
  }

  showTooltip(
    particle: { type: string; velocity: THREE.Vector3; charge: number; mass: number },
    x: number,
    y: number
  ) {
    const tooltip = document.getElementById('particle-tooltip');
    if (!tooltip) return;

    const speed = particle.velocity.length();
    const isElectron = particle.type === 'electron';

    const velDir = particle.velocity.clone().normalize();
    const B = new THREE.Vector3(0, 1, 0);
    const crossVel = new THREE.Vector3().crossVectors(velDir, B);
    const sinTheta = crossVel.length();
    const radius = (particle.mass * speed) / (Math.abs(particle.charge) * 1 * Math.max(0.001, sinTheta));

    tooltip.style.display = 'block';
    tooltip.style.left = `${x + 15}px`;
    tooltip.style.top = `${y - 10}px`;

    tooltip.innerHTML = `
      <div style="font-weight: 600; color: ${isElectron ? '#00E5FF' : '#FF6F00'}; margin-bottom: 8px; font-size: 14px;">
        ${isElectron ? '⚛ Electron' : '⚛ Proton'}
      </div>
      <div style="margin-bottom: 4px;">Speed: ${speed.toFixed(2)} u/s</div>
      <div style="margin-bottom: 4px;">Velocity: (${particle.velocity.x.toFixed(1)}, ${particle.velocity.y.toFixed(1)}, ${particle.velocity.z.toFixed(1)})</div>
      <div style="margin-bottom: 8px;">Orbit Radius: ~${radius.toFixed(2)} u</div>
      <svg width="160" height="40" viewBox="0 0 160 40">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="${isElectron ? '#00E5FF' : '#FF6F00'}" />
          </marker>
        </defs>
        <line x1="20" y1="20" x2="${20 + velDir.x * 50 + 50}" y1="${20 - velDir.y * 20}" 
              stroke="${isElectron ? '#00E5FF' : '#FF6F00'}" stroke-width="2" marker-end="url(#arrowhead)" />
        <line x1="20" y1="20" x2="20" y2="5" stroke="#4488cc" stroke-width="1.5" stroke-dasharray="3,3" />
        <text x="2" y="6" fill="#4488cc" font-size="9">B</text>
      </svg>
    `;
  }

  hideTooltip() {
    const tooltip = document.getElementById('particle-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
}

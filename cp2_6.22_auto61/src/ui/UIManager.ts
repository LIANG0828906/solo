import { StatsChart } from './StatsChart';
import type { Creature } from '../ecosystem/Creature';

interface StatsData {
  population: number;
  avgEnergy: number;
  resourceCount: number;
  tick: number;
}

export class UIManager {
  public container: HTMLElement;
  public controlPanel: HTMLElement;
  public playPauseBtn: HTMLButtonElement;
  public speedSlider: HTMLInputElement;
  public speedLabel: HTMLElement;
  public resetBtn: HTMLButtonElement;
  public statsPanel: HTMLElement;
  public populationDisplay: HTMLElement;
  public energyDisplay: HTMLElement;
  public resourceDisplay: HTMLElement;
  public tickDisplay: HTMLElement;
  public statsChart: StatsChart;
  public creaturePopup: HTMLElement;
  public isMobile: boolean;

  private playPauseCallback: (() => void) | null = null;
  private speedChangeCallback: ((speed: number) => void) | null = null;
  private resetCallback: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.isMobile = window.innerWidth < 768;

    this.controlPanel = this.createControlPanel();
    this.playPauseBtn = this.createPlayPauseBtn();
    this.speedSlider = this.createSpeedSlider();
    this.speedLabel = this.createSpeedLabel();
    this.resetBtn = this.createResetBtn();
    this.statsPanel = this.createStatsPanel();
    this.populationDisplay = this.createStatItem('生物总数', '0');
    this.energyDisplay = this.createStatItem('平均能量', '0');
    this.resourceDisplay = this.createStatItem('资源总量', '0');
    this.tickDisplay = this.createStatItem('时间步', '0');
    this.statsChart = this.createStatsChart();
    this.creaturePopup = this.createCreaturePopup();

    this.assemblePanel();
    this.bindEvents();
    this.handleResize();
  }

  private createControlPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      width: 280px;
      padding: 20px;
      background: rgba(10, 22, 40, 0.7);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 100;
      transition: all 0.3s ease;
    `;
    return panel;
  }

  private createPlayPauseBtn(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = '开始';
    btn.style.cssText = `
      width: 100%;
      padding: 12px 20px;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
    });
    return btn;
  }

  private createSpeedSlider(): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '3';
    slider.step = '1';
    slider.value = '1';
    slider.style.cssText = `
      width: 100%;
      margin: 8px 0;
      accent-color: #3b82f6;
      cursor: pointer;
    `;
    return slider;
  }

  private createSpeedLabel(): HTMLElement {
    const label = document.createElement('div');
    label.textContent = '速度: 1x';
    label.style.cssText = `
      font-size: 13px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 16px;
      text-align: center;
    `;
    return label;
  }

  private createResetBtn(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = '重置';
    btn.style.cssText = `
      width: 100%;
      padding: 10px 20px;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
    });
    return btn;
  }

  private createStatsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      margin-bottom: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    `;
    return panel;
  }

  private createStatItem(label: string, value: string): HTMLElement {
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    `;
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.color = 'rgba(255, 255, 255, 0.6)';

    const valueEl = document.createElement('span');
    valueEl.textContent = value;
    valueEl.style.fontWeight = '600';
    valueEl.style.color = '#4ade80';
    valueEl.className = 'stat-value';

    item.appendChild(labelEl);
    item.appendChild(valueEl);
    return item;
  }

  private createStatsChart(): StatsChart {
    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `
      margin-top: 12px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.08);
    `;

    const title = document.createElement('div');
    title.textContent = '统计图表';
    title.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.8);
    `;
    chartContainer.appendChild(title);

    const legend = document.createElement('div');
    legend.style.cssText = `
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 11px;
    `;
    const popLegend = document.createElement('span');
    popLegend.innerHTML = '<span style="display:inline-block;width:12px;height:2px;background:#4ade80;vertical-align:middle;margin-right:4px;"></span>种群';
    const energyLegend = document.createElement('span');
    energyLegend.innerHTML = '<span style="display:inline-block;width:12px;height:2px;background:#60a5fa;vertical-align:middle;margin-right:4px;"></span>能量';
    legend.appendChild(popLegend);
    legend.appendChild(energyLegend);
    chartContainer.appendChild(legend);

    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 80;
    canvas.style.width = '100%';
    canvas.style.height = '80px';
    chartContainer.appendChild(canvas);

    this.statsPanel.appendChild(chartContainer);
    return new StatsChart(canvas);
  }

  private createCreaturePopup(): HTMLElement {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position: absolute;
      display: none;
      padding: 12px 16px;
      background: rgba(10, 22, 40, 0.95);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      z-index: 200;
      pointer-events: none;
      min-width: 180px;
    `;
    return popup;
  }

  private assemblePanel(): void {
    const title = document.createElement('div');
    title.textContent = '生态系统控制面板';
    title.style.cssText = `
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
      background: linear-gradient(135deg, #4ade80, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    `;
    this.controlPanel.appendChild(title);

    this.controlPanel.appendChild(this.playPauseBtn);
    this.controlPanel.appendChild(this.speedLabel);
    this.controlPanel.appendChild(this.speedSlider);
    this.controlPanel.appendChild(this.resetBtn);

    const statsTitle = document.createElement('div');
    statsTitle.textContent = '实时统计';
    statsTitle.style.cssText = `
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      color: rgba(255, 255, 255, 0.8);
    `;
    this.controlPanel.appendChild(statsTitle);

    this.statsPanel.appendChild(this.populationDisplay);
    this.statsPanel.appendChild(this.energyDisplay);
    this.statsPanel.appendChild(this.resourceDisplay);
    this.statsPanel.appendChild(this.tickDisplay);
    this.controlPanel.appendChild(this.statsPanel);

    this.container.appendChild(this.controlPanel);
    this.container.appendChild(this.creaturePopup);
  }

  private bindEvents(): void {
    this.playPauseBtn.addEventListener('click', () => {
      if (this.playPauseCallback) {
        this.playPauseCallback();
      }
    });

    this.speedSlider.addEventListener('input', () => {
      const speeds = [0.5, 1, 2, 4];
      const index = parseInt(this.speedSlider.value, 10);
      const speed = speeds[index];
      this.speedLabel.textContent = `速度: ${speed}x`;
      if (this.speedChangeCallback) {
        this.speedChangeCallback(speed);
      }
    });

    this.resetBtn.addEventListener('click', () => {
      if (this.resetCallback) {
        this.resetCallback();
      }
    });

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  public updateStats(stats: StatsData): void {
    const popValue = this.populationDisplay.querySelector('.stat-value');
    const energyValue = this.energyDisplay.querySelector('.stat-value');
    const resourceValue = this.resourceDisplay.querySelector('.stat-value');
    const tickValue = this.tickDisplay.querySelector('.stat-value');

    if (popValue) popValue.textContent = stats.population.toString();
    if (energyValue) energyValue.textContent = stats.avgEnergy.toFixed(1);
    if (resourceValue) resourceValue.textContent = stats.resourceCount.toString();
    if (tickValue) tickValue.textContent = stats.tick.toString();
  }

  public addChartData(population: number, avgEnergy: number): void {
    this.statsChart.addDataPoint(population, avgEnergy);
  }

  public showCreatureInfo(creature: Creature, x: number, y: number): void {
    const { genotype, energy, age, isAlive } = creature;
    this.creaturePopup.innerHTML = `
      <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:#4ade80;">
        ${isAlive ? '🟢 生物信息' : '🔴 已死亡'}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;">
        <span style="color:rgba(255,255,255,0.6);">能量:</span>
        <span style="font-weight:600;">${energy.toFixed(1)}</span>
        <span style="color:rgba(255,255,255,0.6);">年龄:</span>
        <span style="font-weight:600;">${age.toFixed(1)}</span>
        <span style="color:rgba(255,255,255,0.6);">攻击:</span>
        <span style="font-weight:600;color:#f87171;">${genotype.attack.toFixed(0)}</span>
        <span style="color:rgba(255,255,255,0.6);">防御:</span>
        <span style="font-weight:600;color:#60a5fa;">${genotype.defense.toFixed(0)}</span>
        <span style="color:rgba(255,255,255,0.6);">速度:</span>
        <span style="font-weight:600;color:#4ade80;">${genotype.speed.toFixed(2)}</span>
        <span style="color:rgba(255,255,255,0.6);">感知:</span>
        <span style="font-weight:600;color:#a78bfa;">${genotype.perception.toFixed(0)}</span>
        <span style="color:rgba(255,255,255,0.6);">繁殖阈值:</span>
        <span style="font-weight:600;color:#fbbf24;">${genotype.breedThreshold.toFixed(0)}</span>
      </div>
    `;

    const popupWidth = 200;
    const popupHeight = 200;
    const containerRect = this.container.getBoundingClientRect();
    let posX = x + 15;
    let posY = y + 15;

    if (posX + popupWidth > containerRect.width) {
      posX = x - popupWidth - 15;
    }
    if (posY + popupHeight > containerRect.height) {
      posY = y - popupHeight - 15;
    }

    this.creaturePopup.style.left = `${posX}px`;
    this.creaturePopup.style.top = `${posY}px`;
    this.creaturePopup.style.display = 'block';
  }

  public hideCreatureInfo(): void {
    this.creaturePopup.style.display = 'none';
  }

  public setIsPaused(isPaused: boolean): void {
    this.playPauseBtn.textContent = isPaused ? '继续' : '暂停';
  }

  public setSpeed(speed: number): void {
    const speeds = [0.5, 1, 2, 4];
    const index = speeds.indexOf(speed);
    if (index >= 0) {
      this.speedSlider.value = index.toString();
      this.speedLabel.textContent = `速度: ${speed}x`;
    }
  }

  public onPlayPause(callback: () => void): void {
    this.playPauseCallback = callback;
  }

  public onSpeedChange(callback: (speed: number) => void): void {
    this.speedChangeCallback = callback;
  }

  public onReset(callback: () => void): void {
    this.resetCallback = callback;
  }

  public handleResize(): void {
    this.isMobile = window.innerWidth < 768;

    if (this.isMobile) {
      this.controlPanel.style.top = 'auto';
      this.controlPanel.style.left = '0';
      this.controlPanel.style.bottom = '0';
      this.controlPanel.style.width = '100%';
      this.controlPanel.style.borderRadius = '12px 12px 0 0';
      this.controlPanel.style.padding = '12px';
    } else {
      this.controlPanel.style.top = '20px';
      this.controlPanel.style.left = '20px';
      this.controlPanel.style.bottom = 'auto';
      this.controlPanel.style.width = '280px';
      this.controlPanel.style.borderRadius = '12px';
      this.controlPanel.style.padding = '20px';
    }
  }
}

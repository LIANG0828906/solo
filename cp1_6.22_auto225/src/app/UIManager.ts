import { BeeRole, StatisticsData } from '@/engine/BeeAgent';

export interface UICallbacks {
  onAddWorkers: () => void;
  onTriggerAlarm: () => void;
  onReleaseFoodSignal: () => void;
  onToggleHeatmap: () => void;
  onReset: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks: UICallbacks | null = null;

  private statsPanel!: HTMLElement;
  private controlPanel!: HTMLElement;
  private resetButton!: HTMLElement;

  private totalBeesElement!: HTMLElement;
  private healthElement!: HTMLElement;
  private barElements: Map<BeeRole, HTMLElement> = new Map();
  private barValueElements: Map<BeeRole, HTMLElement> = new Map();
  private heatmapButton!: HTMLElement;
  private heatmapIcon!: HTMLElement;
  private addWorkersButton!: HTMLElement;
  private alarmButton!: HTMLElement;
  private foodSignalButton!: HTMLElement;

  private lastStatsUpdate: number = 0;
  private statsUpdateInterval: number = 3000;
  private currentStats: StatisticsData | null = null;
  private targetPercentages: Record<BeeRole, number> = {
    [BeeRole.WORKER]: 0,
    [BeeRole.NURSE]: 0,
    [BeeRole.GUARD]: 0,
    [BeeRole.DRONE]: 0
  };
  private currentPercentages: Record<BeeRole, number> = {
    [BeeRole.WORKER]: 0,
    [BeeRole.NURSE]: 0,
    [BeeRole.GUARD]: 0,
    [BeeRole.DRONE]: 0
  };
  private heatmapVisible: boolean = false;
  private healthWarningInterval: number | null = null;

  private roleLabels: Record<BeeRole, string> = {
    [BeeRole.WORKER]: '工蜂',
    [BeeRole.NURSE]: '哺育蜂',
    [BeeRole.GUARD]: '守卫蜂',
    [BeeRole.DRONE]: '雄蜂'
  };

  private roleColors: Record<BeeRole, string> = {
    [BeeRole.WORKER]: '#FF9F43',
    [BeeRole.NURSE]: '#2ED573',
    [BeeRole.GUARD]: '#FF4757',
    [BeeRole.DRONE]: '#747D8C'
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.createUI();
    this.animateBars();
  }

  private createUI(): void {
    this.createStatsPanel();
    this.createControlPanel();
    this.createResetButton();
    this.createStyles();
  }

  private createStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spring {
        0% { transform: scale(1); }
        30% { transform: scale(0.92); }
        50% { transform: scale(1.02); }
        70% { transform: scale(0.98); }
        100% { transform: scale(1); }
      }
      
      @keyframes pulse-red {
        0%, 100% { color: #E74C3C; opacity: 1; }
        50% { color: #E74C3C; opacity: 0.3; }
      }
      
      @keyframes icon-morph {
        0% { transform: scale(1) rotate(0deg); opacity: 1; }
        50% { transform: scale(0.5) rotate(180deg); opacity: 0.5; }
        100% { transform: scale(1) rotate(360deg); opacity: 1; }
      }
      
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 5px rgba(230, 126, 34, 0.5); }
        50% { box-shadow: 0 0 20px rgba(230, 126, 34, 0.8); }
      }
      
      .btn-spring {
        transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .btn-spring:active {
        animation: spring 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .health-warning {
        animation: pulse-red 0.8s ease-in-out infinite;
      }
      
      .icon-morph {
        animation: icon-morph 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      .bar-transition {
        transition: height 3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `;
    document.head.appendChild(style);
  }

  private createStatsPanel(): void {
    this.statsPanel = document.createElement('div');
    this.statsPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 260px;
      background: rgba(44, 62, 80, 0.85);
      backdrop-filter: blur(10px);
      border-radius: 10px;
      padding: 20px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1000;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #F1C40F;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    title.innerHTML = `<span style="font-size: 18px;">🐝</span> 蜂巢状态`;
    this.statsPanel.appendChild(title);

    const totalSection = document.createElement('div');
    totalSection.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const totalLabel = document.createElement('span');
    totalLabel.textContent = '总蜜蜂数量';
    totalLabel.style.cssText = 'font-size: 13px; color: #BDC3C7;';
    
    this.totalBeesElement = document.createElement('span');
    this.totalBeesElement.style.cssText = `
      font-size: 24px;
      font-weight: 700;
      color: #E67E22;
    `;
    this.totalBeesElement.textContent = '0';
    
    totalSection.appendChild(totalLabel);
    totalSection.appendChild(this.totalBeesElement);
    this.statsPanel.appendChild(totalSection);

    const chartTitle = document.createElement('div');
    chartTitle.style.cssText = `
      font-size: 13px;
      color: #BDC3C7;
      margin-bottom: 10px;
    `;
    chartTitle.textContent = '工种比例';
    this.statsPanel.appendChild(chartTitle);

    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 100px;
      margin-bottom: 16px;
      padding: 10px 0;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    `;

    const roles: BeeRole[] = [BeeRole.WORKER, BeeRole.NURSE, BeeRole.GUARD, BeeRole.DRONE];
    for (const role of roles) {
      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      `;

      const barValue = document.createElement('span');
      barValue.style.cssText = `
        font-size: 11px;
        color: ${this.roleColors[role]};
        font-weight: 600;
        min-height: 14px;
      `;
      barValue.textContent = '0%';
      this.barValueElements.set(role, barValue);
      barWrapper.appendChild(barValue);

      const barContainer = document.createElement('div');
      barContainer.style.cssText = `
        width: 28px;
        height: 60px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: flex-end;
      `;

      const bar = document.createElement('div');
      bar.style.cssText = `
        width: 100%;
        height: 0%;
        background: ${this.roleColors[role]};
        border-radius: 4px;
        transition: height 3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 8px ${this.roleColors[role]};
      `;
      bar.className = 'bar-transition';
      this.barElements.set(role, bar);
      barContainer.appendChild(bar);
      barWrapper.appendChild(barContainer);

      const barLabel = document.createElement('span');
      barLabel.style.cssText = `
        font-size: 10px;
        color: #95A5A6;
      `;
      barLabel.textContent = this.roleLabels[role];
      barWrapper.appendChild(barLabel);

      chartContainer.appendChild(barWrapper);
    }
    this.statsPanel.appendChild(chartContainer);

    const healthSection = document.createElement('div');
    healthSection.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    const healthLabel = document.createElement('span');
    healthLabel.textContent = '蜂巢健康度';
    healthLabel.style.cssText = 'font-size: 13px; color: #BDC3C7;';
    
    this.healthElement = document.createElement('span');
    this.healthElement.style.cssText = `
      font-size: 18px;
      font-weight: 700;
      color: #2ED573;
    `;
    this.healthElement.textContent = '0%';
    
    healthSection.appendChild(healthLabel);
    healthSection.appendChild(this.healthElement);
    this.statsPanel.appendChild(healthSection);

    this.container.appendChild(this.statsPanel);
  }

  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 320px;
      background: rgba(30, 39, 46, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 20px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 1000;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #F1C40F;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    title.innerHTML = `<span style="font-size: 18px;">⚙️</span> 控制面板`;
    this.controlPanel.appendChild(title);

    this.addWorkersButton = this.createButton(
      '➕ 增加工蜂 (+10)',
      '#E67E22',
      () => this.callbacks?.onAddWorkers()
    );
    this.controlPanel.appendChild(this.addWorkersButton);

    this.alarmButton = this.createButton(
      '🚨 触发警报',
      '#E74C3C',
      () => this.callbacks?.onTriggerAlarm()
    );
    this.controlPanel.appendChild(this.alarmButton);

    this.foodSignalButton = this.createButton(
      '🍯 释放蜜源信号',
      '#F1C40F',
      () => this.callbacks?.onReleaseFoodSignal()
    );
    this.controlPanel.appendChild(this.foodSignalButton);

    const divider = document.createElement('div');
    divider.style.cssText = `
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 16px 0;
    `;
    this.controlPanel.appendChild(divider);

    this.heatmapButton = document.createElement('div');
    this.heatmapButton.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: rgba(52, 73, 94, 0.8);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    `;
    this.heatmapButton.className = 'btn-spring';
    
    this.heatmapButton.addEventListener('mouseenter', () => {
      this.heatmapButton.style.background = 'rgba(52, 73, 94, 1)';
    });
    this.heatmapButton.addEventListener('mouseleave', () => {
      this.heatmapButton.style.background = 'rgba(52, 73, 94, 0.8)';
    });
    this.heatmapButton.addEventListener('click', () => {
      this.heatmapButton.classList.add('btn-spring');
      setTimeout(() => this.heatmapButton.classList.remove('btn-spring'), 200);
      this.callbacks?.onToggleHeatmap();
    });

    const heatmapLabel = document.createElement('span');
    heatmapLabel.style.cssText = `
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    heatmapLabel.innerHTML = `<span>🌈</span> 信息素热力图`;

    this.heatmapIcon = document.createElement('span');
    this.heatmapIcon.style.cssText = `
      font-size: 20px;
      transition: all 0.4s ease;
    `;
    this.heatmapIcon.textContent = '🧹';

    this.heatmapButton.appendChild(heatmapLabel);
    this.heatmapButton.appendChild(this.heatmapIcon);
    this.controlPanel.appendChild(this.heatmapButton);

    const hint = document.createElement('div');
    hint.style.cssText = `
      font-size: 11px;
      color: #7F8C8D;
      margin-top: 12px;
      text-align: center;
    `;
    hint.innerHTML = '🖱️ 拖拽旋转视角 · 滚轮缩放';
    this.controlPanel.appendChild(hint);

    this.container.appendChild(this.controlPanel);
  }

  private createButton(label: string, color: string, onClick: () => void): HTMLElement {
    const button = document.createElement('div');
    button.style.cssText = `
      padding: 14px 16px;
      background: ${color};
      border-radius: 12px;
      cursor: pointer;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;
      transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      user-select: none;
      box-shadow: 0 4px 15px ${color}40;
    `;
    button.className = 'btn-spring';
    button.textContent = label;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = `0 6px 20px ${color}60`;
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = `0 4px 15px ${color}40`;
    });
    button.addEventListener('click', () => {
      button.classList.add('btn-spring');
      setTimeout(() => button.classList.remove('btn-spring'), 200);
      onClick();
    });

    return button;
  }

  private createResetButton(): void {
    this.resetButton = document.createElement('div');
    this.resetButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 48px;
      height: 48px;
      background: #E74C3C;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(231, 76, 60, 0.5);
      transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      z-index: 1000;
      user-select: none;
      font-size: 20px;
    `;
    this.resetButton.className = 'btn-spring';
    this.resetButton.innerHTML = '🔄';
    this.resetButton.title = '重置模拟';

    this.resetButton.addEventListener('mouseenter', () => {
      this.resetButton.style.transform = 'scale(1.1)';
      this.resetButton.style.boxShadow = '0 6px 25px rgba(231, 76, 60, 0.7)';
    });
    this.resetButton.addEventListener('mouseleave', () => {
      this.resetButton.style.transform = 'scale(1)';
      this.resetButton.style.boxShadow = '0 4px 20px rgba(231, 76, 60, 0.5)';
    });
    this.resetButton.addEventListener('click', () => {
      this.resetButton.classList.add('btn-spring');
      setTimeout(() => this.resetButton.classList.remove('btn-spring'), 200);
      if (confirm('确定要重置整个模拟吗？所有蜜蜂和信息素数据将被清空。')) {
        this.callbacks?.onReset();
      }
    });

    this.container.appendChild(this.resetButton);
  }

  bindEvents(callbacks: UICallbacks): void {
    this.callbacks = callbacks;
  }

  updateStatistics(stats: StatisticsData, currentTime: number): void {
    this.currentStats = stats;

    if (currentTime - this.lastStatsUpdate >= this.statsUpdateInterval) {
      this.lastStatsUpdate = currentTime;
      
      this.totalBeesElement.textContent = stats.totalBees.toString();
      
      this.targetPercentages = { ...stats.rolePercentages };

      const health = Math.round(stats.health);
      this.healthElement.textContent = `${health}%`;
      
      if (health < 30) {
        if (!this.healthWarningInterval) {
          this.healthElement.classList.add('health-warning');
          this.healthWarningInterval = window.setInterval(() => {
            this.healthElement.style.color = this.healthElement.style.color === '#E74C3C' ? '#FF6B6B' : '#E74C3C';
          }, 400);
        }
      } else {
        if (this.healthWarningInterval) {
          clearInterval(this.healthWarningInterval);
          this.healthWarningInterval = null;
          this.healthElement.classList.remove('health-warning');
        }
        this.healthElement.style.color = health < 60 ? '#F1C40F' : '#2ED573';
      }
    }
  }

  private animateBars(): void {
    const ease = (t: number): number => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    const animate = () => {
      for (const role of [BeeRole.WORKER, BeeRole.NURSE, BeeRole.GUARD, BeeRole.DRONE]) {
        const diff = this.targetPercentages[role] - this.currentPercentages[role];
        if (Math.abs(diff) > 0.1) {
          this.currentPercentages[role] += diff * 0.05;
          const bar = this.barElements.get(role);
          const value = this.barValueElements.get(role);
          if (bar) {
            bar.style.height = `${Math.max(2, this.currentPercentages[role])}%`;
          }
          if (value) {
            value.textContent = `${Math.round(this.currentPercentages[role])}%`;
          }
        }
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  toggleHeatmapIcon(visible: boolean): void {
    this.heatmapVisible = visible;
    this.heatmapIcon.style.animation = 'icon-morph 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    setTimeout(() => {
      this.heatmapIcon.textContent = visible ? '📊' : '🧹';
      this.heatmapButton.style.background = visible 
        ? 'rgba(46, 213, 115, 0.3)' 
        : 'rgba(52, 73, 94, 0.8)';
    }, 200);
    
    setTimeout(() => {
      this.heatmapIcon.style.animation = '';
    }, 400);
  }

  setButtonEnabled(button: 'addWorkers' | 'alarm' | 'foodSignal', enabled: boolean): void {
    const btn = button === 'addWorkers' ? this.addWorkersButton 
      : button === 'alarm' ? this.alarmButton 
      : this.foodSignalButton;
    
    btn.style.opacity = enabled ? '1' : '0.5';
    btn.style.pointerEvents = enabled ? 'auto' : 'none';
    btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  dispose(): void {
    if (this.healthWarningInterval) {
      clearInterval(this.healthWarningInterval);
    }
  }
}

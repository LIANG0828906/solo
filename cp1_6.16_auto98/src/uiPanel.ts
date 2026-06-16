import { SeatData } from './theaterBuilder';
import { SimulationMode } from './speakerSystem';

export interface UIPanelCallbacks {
  onModeChange: (mode: SimulationMode) => void;
  onReverbChange: (value: number) => void;
  onReset: () => void;
}

interface BarData {
  label: string;
  minDb: number;
  maxDb: number;
  count: number;
  targetCount: number;
}

export class UIPanel {
  private container: HTMLElement;
  private callbacks: UIPanelCallbacks;
  
  private leftPanel: HTMLDivElement;
  private rightPanel: HTMLDivElement;
  
  private barData: BarData[] = [];
  private bars: HTMLDivElement[] = [];
  private barValueLabels: HTMLDivElement[] = [];
  
  private currentMode: SimulationMode = 'simulation';
  private currentReverb: number = 1.5;
  
  private lastUpdateTime: number = 0;
  private animationFrameId: number | null = null;
  private pendingUpdate: SeatData[] | null = null;

  constructor(container: HTMLElement, callbacks: UIPanelCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    
    this.initBarData();
    this.leftPanel = this.createLeftPanel();
    this.rightPanel = this.createRightPanel();
    
    this.container.appendChild(this.leftPanel);
    this.container.appendChild(this.rightPanel);
    
    this.startAnimation();
  }

  private initBarData(): void {
    const ranges = [
      { label: '60-70', min: 60, max: 70 },
      { label: '70-80', min: 70, max: 80 },
      { label: '80-85', min: 80, max: 85 },
      { label: '85-90', min: 85, max: 90 },
      { label: '90-95', min: 90, max: 95 },
      { label: '95-100', min: 95, max: 100 },
      { label: '100-110', min: 100, max: 110 },
    ];
    
    this.barData = ranges.map(r => ({
      ...r,
      count: 0,
      targetCount: 0,
    }));
  }

  private createLeftPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 260px;
      background: rgba(15, 20, 40, 0.92);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(100, 150, 255, 0.3);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 100;
    `;

    const title = document.createElement('div');
    title.textContent = '声压级分布统计';
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #aaccff;
      margin-bottom: 16px;
      text-align: center;
      letter-spacing: 1px;
    `;
    panel.appendChild(title);

    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `
      position: relative;
      height: 200px;
      border-bottom: 1px solid rgba(150, 180, 255, 0.3);
      border-left: 1px solid rgba(150, 180, 255, 0.3);
      margin-bottom: 8px;
      padding-left: 30px;
    `;

    const yAxisLabels = document.createElement('div');
    yAxisLabels.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 4px 0;
    `;
    for (let i = 5; i >= 0; i--) {
      const label = document.createElement('span');
      label.textContent = (i * 10).toString();
      label.style.cssText = `
        font-size: 10px;
        color: rgba(180, 200, 255, 0.6);
        text-align: right;
        padding-right: 4px;
        line-height: 1;
      `;
      yAxisLabels.appendChild(label);
    }
    chartContainer.appendChild(yAxisLabels);

    const barsContainer = document.createElement('div');
    barsContainer.style.cssText = `
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 100%;
      padding: 0 4px;
    `;

    this.barData.forEach((data, index) => {
      const barWrapper = document.createElement('div');
      barWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        height: 100%;
        justify-content: flex-end;
      `;

      const valueLabel = document.createElement('div');
      valueLabel.textContent = '0';
      valueLabel.style.cssText = `
        font-size: 11px;
        color: #88ddff;
        margin-bottom: 4px;
        font-weight: 600;
        transition: all 0.2s ease;
      `;
      this.barValueLabels.push(valueLabel);
      barWrapper.appendChild(valueLabel);

      const bar = document.createElement('div');
      const barColor = this.getBarColor(data.minDb);
      bar.style.cssText = `
        width: 75%;
        height: 0%;
        background: linear-gradient(180deg, ${barColor}, ${barColor}88);
        border-radius: 3px 3px 0 0;
        transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 0 8px ${barColor}66;
      `;
      this.bars.push(bar);
      barWrapper.appendChild(bar);

      const xLabel = document.createElement('div');
      xLabel.textContent = data.label;
      xLabel.style.cssText = `
        font-size: 9px;
        color: rgba(180, 200, 255, 0.7);
        margin-top: 6px;
        white-space: nowrap;
      `;
      barWrapper.appendChild(xLabel);

      barsContainer.appendChild(barWrapper);
    });

    chartContainer.appendChild(barsContainer);
    panel.appendChild(chartContainer);

    const axisLabels = document.createElement('div');
    axisLabels.style.cssText = `
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: rgba(180, 200, 255, 0.5);
      padding: 0 8px 0 30px;
    `;
    
    const xLabel = document.createElement('span');
    xLabel.textContent = 'dB 区间';
    const yLabel = document.createElement('span');
    yLabel.textContent = '座位数';
    axisLabels.appendChild(xLabel);
    axisLabels.appendChild(yLabel);
    panel.appendChild(axisLabels);

    return panel;
  }

  private createRightPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      width: 280px;
      background: rgba(15, 20, 40, 0.92);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(100, 150, 255, 0.3);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      z-index: 100;
    `;

    const title = document.createElement('div');
    title.textContent = '声场控制面板';
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #aaccff;
      margin-bottom: 24px;
      text-align: center;
      letter-spacing: 1px;
    `;
    panel.appendChild(title);

    const modeSection = this.createModeSection();
    panel.appendChild(modeSection);

    const divider1 = document.createElement('div');
    divider1.style.cssText = `
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(100, 150, 255, 0.3), transparent);
      margin: 20px 0;
    `;
    panel.appendChild(divider1);

    const reverbSection = this.createReverbSection();
    panel.appendChild(reverbSection);

    const divider2 = document.createElement('div');
    divider2.style.cssText = `
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(100, 150, 255, 0.3), transparent);
      margin: 20px 0;
    `;
    panel.appendChild(divider2);

    const resetButton = this.createResetButton();
    panel.appendChild(resetButton);

    return panel;
  }

  private createModeSection(): HTMLDivElement {
    const section = document.createElement('div');

    const label = document.createElement('div');
    label.textContent = '计算模式';
    label.style.cssText = `
      font-size: 13px;
      color: rgba(200, 220, 255, 0.8);
      margin-bottom: 12px;
    `;
    section.appendChild(label);

    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      display: flex;
      background: rgba(30, 40, 70, 0.8);
      border-radius: 8px;
      padding: 4px;
      border: 1px solid rgba(80, 120, 200, 0.3);
    `;

    const simButton = document.createElement('div');
    simButton.textContent = '模拟模式';
    simButton.style.cssText = `
      flex: 1;
      text-align: center;
      padding: 10px 8px;
      font-size: 13px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      background: linear-gradient(135deg, #3a5fcf, #2a4fbf);
      color: white;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(58, 95, 207, 0.4);
    `;

    const measButton = document.createElement('div');
    measButton.textContent = '测量模式';
    measButton.style.cssText = `
      flex: 1;
      text-align: center;
      padding: 10px 8px;
      font-size: 13px;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s ease;
      color: rgba(180, 200, 255, 0.7);
      font-weight: 500;
    `;

    const setMode = (mode: SimulationMode) => {
      this.currentMode = mode;
      if (mode === 'simulation') {
        simButton.style.background = 'linear-gradient(135deg, #3a5fcf, #2a4fbf)';
        simButton.style.color = 'white';
        simButton.style.boxShadow = '0 2px 8px rgba(58, 95, 207, 0.4)';
        measButton.style.background = 'transparent';
        measButton.style.color = 'rgba(180, 200, 255, 0.7)';
        measButton.style.boxShadow = 'none';
      } else {
        measButton.style.background = 'linear-gradient(135deg, #3a5fcf, #2a4fbf)';
        measButton.style.color = 'white';
        measButton.style.boxShadow = '0 2px 8px rgba(58, 95, 207, 0.4)';
        simButton.style.background = 'transparent';
        simButton.style.color = 'rgba(180, 200, 255, 0.7)';
        simButton.style.boxShadow = 'none';
      }
      this.callbacks.onModeChange(mode);
    };

    simButton.addEventListener('click', () => setMode('simulation'));
    measButton.addEventListener('click', () => setMode('measurement'));

    toggleContainer.appendChild(simButton);
    toggleContainer.appendChild(measButton);
    section.appendChild(toggleContainer);

    const desc = document.createElement('div');
    desc.textContent = this.currentMode === 'simulation' 
      ? '使用预生成的声学模型数据' 
      : '使用实时声强计算公式';
    desc.id = 'mode-desc';
    desc.style.cssText = `
      font-size: 11px;
      color: rgba(150, 180, 255, 0.5);
      margin-top: 8px;
      text-align: center;
    `;
    section.appendChild(desc);

    return section;
  }

  private createReverbSection(): HTMLDivElement {
    const section = document.createElement('div');

    const labelRow = document.createElement('div');
    labelRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;

    const label = document.createElement('div');
    label.textContent = '环境混响时间';
    label.style.cssText = `
      font-size: 13px;
      color: rgba(200, 220, 255, 0.8);
    `;

    const valueDisplay = document.createElement('div');
    valueDisplay.id = 'reverb-value';
    valueDisplay.textContent = `${this.currentReverb.toFixed(1)}s`;
    valueDisplay.style.cssText = `
      font-size: 14px;
      color: #66ddff;
      font-weight: 600;
      font-family: 'Consolas', monospace;
    `;

    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);
    section.appendChild(labelRow);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0.5';
    slider.max = '3.0';
    slider.step = '0.1';
    slider.value = this.currentReverb.toString();
    slider.style.cssText = `
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      appearance: none;
      background: rgba(30, 40, 70, 0.8);
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4a8fff, #2a6fdf);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(74, 143, 255, 0.5);
        transition: transform 0.15s ease;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.1);
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4a8fff, #2a6fdf);
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 8px rgba(74, 143, 255, 0.5);
      }
    `;
    section.appendChild(styleEl);

    slider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.currentReverb = value;
      valueDisplay.textContent = `${value.toFixed(1)}s`;
      this.callbacks.onReverbChange(value);
    });

    section.appendChild(slider);

    const ticks = document.createElement('div');
    ticks.style.cssText = `
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 10px;
      color: rgba(150, 180, 255, 0.5);
    `;
    ['0.5s', '1.0s', '1.5s', '2.0s', '2.5s', '3.0s'].forEach(t => {
      const tick = document.createElement('span');
      tick.textContent = t;
      ticks.appendChild(tick);
    });
    section.appendChild(ticks);

    return section;
  }

  private createResetButton(): HTMLDivElement {
    const button = document.createElement('div');
    button.textContent = '重置音响位置';
    button.style.cssText = `
      text-align: center;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      background: linear-gradient(135deg, #cc5555, #aa3333);
      color: white;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(204, 85, 85, 0.3);
      user-select: none;
      letter-spacing: 0.5px;
    `;

    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 6px 16px rgba(204, 85, 85, 0.4)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(204, 85, 85, 0.3)';
    });
    button.addEventListener('mousedown', () => {
      button.style.transform = 'translateY(1px)';
      button.style.boxShadow = '0 2px 8px rgba(204, 85, 85, 0.3)';
    });
    button.addEventListener('mouseup', () => {
      button.style.transform = 'translateY(-1px)';
      button.style.boxShadow = '0 6px 16px rgba(204, 85, 85, 0.4)';
    });
    button.addEventListener('click', () => {
      this.callbacks.onReset();
    });

    return button;
  }

  private getBarColor(minDb: number): string {
    if (minDb >= 100) return '#cc2222';
    if (minDb >= 95) return '#ff8844';
    if (minDb >= 90) return '#ffcc44';
    if (minDb >= 85) return '#dddd44';
    if (minDb >= 80) return '#44cccc';
    if (minDb >= 70) return '#4488cc';
    return '#2244aa';
  }

  public updateSoundFieldData(seats: SeatData[]): void {
    this.pendingUpdate = seats;
  }

  private processPendingUpdate(): void {
    if (!this.pendingUpdate) return;
    
    const seats = this.pendingUpdate;
    this.pendingUpdate = null;

    this.barData.forEach(bar => {
      bar.targetCount = 0;
    });

    seats.forEach(seat => {
      for (const bar of this.barData) {
        if (seat.soundPressureLevel >= bar.minDb && seat.soundPressureLevel < bar.maxDb) {
          bar.targetCount++;
          break;
        }
      }
      if (seat.soundPressureLevel >= 110) {
        this.barData[this.barData.length - 1].targetCount++;
      }
    });
  }

  private startAnimation(): void {
    const animate = () => {
      const now = performance.now();
      const delta = now - this.lastUpdateTime;
      
      if (delta > 16) {
        this.lastUpdateTime = now;
        
        this.processPendingUpdate();
        
        const maxCount = Math.max(1, ...this.barData.map(b => b.targetCount));
        
        this.barData.forEach((data, index) => {
          const easeSpeed = 0.12;
          data.count += (data.targetCount - data.count) * easeSpeed;
          
          const displayCount = Math.round(data.count);
          const heightPercent = (data.count / maxCount) * 100;
          
          this.bars[index].style.height = `${Math.max(2, heightPercent)}%`;
          this.barValueLabels[index].textContent = displayCount.toString();
        });
      }
      
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.leftPanel.remove();
    this.rightPanel.remove();
  }
}

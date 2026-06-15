import { ImpactConfig } from './impact';

export interface UIControls {
  onReset?: () => void;
  getImpactConfig: () => ImpactConfig;
  setImpactConfig: (config: Partial<ImpactConfig>) => void;
}

export class UIManager {
  private container: HTMLElement;
  private asteroidRadiusSlider!: HTMLInputElement;
  private impactSpeedSlider!: HTMLInputElement;
  private asteroidRadiusValue!: HTMLElement;
  private impactSpeedValue!: HTMLElement;
  private impactCountElement!: HTMLElement;
  private avgSizeElement!: HTMLElement;
  private resetButton!: HTMLElement;

  private impactCount = 0;
  private totalSize = 0;

  private controls: UIControls;

  constructor(containerId: string, controls: UIControls) {
    this.container = document.getElementById(containerId)!;
    this.controls = controls;
    this.buildUI();
  }

  private buildUI(): void {
    this.container.style.cssText = `
      flex: 0 0 30%;
      background-color: #2d2d2d;
      color: #ffffff;
      font-family: sans-serif;
      padding: 24px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 24px;
      overflow-y: auto;
      min-width: 300px;
    `;

    const title = document.createElement('div');
    title.innerHTML = '<h1 style="font-size: 20px; font-weight: 600; margin: 0; color: #ffffff; border-bottom: 1px solid #444; padding-bottom: 12px;">陨石撞击控制面板</h1>';
    this.container.appendChild(title);

    this.buildStatsSection();
    this.buildAsteroidSizeSection();
    this.buildImpactSpeedSection();
    this.buildHintSection();
    this.buildResetButton();
  }

  private buildStatsSection(): void {
    const section = document.createElement('div');
    section.style.cssText = `
      background-color: #3a3a3a;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-size: 14px; color: #aaaaaa; font-weight: 500; margin-bottom: 4px;';
    title.textContent = '撞击统计';

    const statsGrid = document.createElement('div');
    statsGrid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 12px;';

    const countBox = this.createStatBox('撞击次数', '0', 'impact-count');
    const avgBox = this.createStatBox('平均陨石大小', '0', 'avg-size');

    statsGrid.appendChild(countBox);
    statsGrid.appendChild(avgBox);

    section.appendChild(title);
    section.appendChild(statsGrid);
    this.container.appendChild(section);
  }

  private createStatBox(label: string, initialValue: string, dataId: string): HTMLElement {
    const box = document.createElement('div');
    box.style.cssText = `
      background-color: #2d2d2d;
      border-radius: 6px;
      padding: 12px;
    `;

    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size: 11px; color: #888888; margin-bottom: 6px;';
    labelEl.textContent = label;

    const valueEl = document.createElement('div');
    valueEl.style.cssText = 'font-size: 20px; font-weight: 700; color: #ffffff;';
    valueEl.textContent = initialValue;
    valueEl.id = `stat-${dataId}`;

    box.appendChild(labelEl);
    box.appendChild(valueEl);

    if (dataId === 'impact-count') {
      this.impactCountElement = valueEl;
    } else {
      this.avgSizeElement = valueEl;
    }

    return box;
  }

  private buildAsteroidSizeSection(): void {
    const section = document.createElement('div');
    section.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

    const label = document.createElement('label');
    label.style.cssText = 'font-size: 14px; color: #ffffff; font-weight: 500;';
    label.textContent = '陨石大小 (半径)';
    label.htmlFor = 'asteroid-radius-slider';

    const valueDisplay = document.createElement('span');
    valueDisplay.style.cssText = `
      background-color: #4a90d9;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    `;
    valueDisplay.id = 'asteroid-radius-value';
    valueDisplay.textContent = this.controls.getImpactConfig().asteroidRadius.toString() + ' 单位';
    this.asteroidRadiusValue = valueDisplay;

    header.appendChild(label);
    header.appendChild(valueDisplay);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'asteroid-radius-slider';
    slider.min = '5';
    slider.max = '20';
    slider.step = '1';
    slider.value = this.controls.getImpactConfig().asteroidRadius.toString();
    slider.style.cssText = this.getSliderStyle();

    const rangeLabels = document.createElement('div');
    rangeLabels.style.cssText = 'display: flex; justify-content: space-between; font-size: 11px; color: #888;';
    rangeLabels.innerHTML = '<span>5</span><span>20 单位</span>';

    slider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.asteroidRadiusValue.textContent = val.toString() + ' 单位';
      this.controls.setImpactConfig({ asteroidRadius: val });
    });

    slider.addEventListener('mouseenter', () => this.onSliderHover(slider, true));
    slider.addEventListener('mouseleave', () => this.onSliderHover(slider, false));

    this.asteroidRadiusSlider = slider;

    section.appendChild(header);
    section.appendChild(slider);
    section.appendChild(rangeLabels);
    this.container.appendChild(section);
  }

  private buildImpactSpeedSection(): void {
    const section = document.createElement('div');
    section.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

    const label = document.createElement('label');
    label.style.cssText = 'font-size: 14px; color: #ffffff; font-weight: 500;';
    label.textContent = '撞击速度';
    label.htmlFor = 'impact-speed-slider';

    const valueDisplay = document.createElement('span');
    valueDisplay.style.cssText = `
      background-color: #e67e22;
      color: white;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
      min-width: 50px;
      text-align: center;
    `;
    valueDisplay.id = 'impact-speed-value';
    valueDisplay.textContent = this.controls.getImpactConfig().impactSpeed.toString();
    this.impactSpeedValue = valueDisplay;

    header.appendChild(label);
    header.appendChild(valueDisplay);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'impact-speed-slider';
    slider.min = '1';
    slider.max = '10';
    slider.step = '0.5';
    slider.value = this.controls.getImpactConfig().impactSpeed.toString();
    slider.style.cssText = this.getSliderStyle();

    const rangeLabels = document.createElement('div');
    rangeLabels.style.cssText = 'display: flex; justify-content: space-between; font-size: 11px; color: #888;';
    rangeLabels.innerHTML = '<span>1</span><span>10</span>';

    slider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.impactSpeedValue.textContent = val.toString();
      this.controls.setImpactConfig({ impactSpeed: val });
    });

    slider.addEventListener('mouseenter', () => this.onSliderHover(slider, true));
    slider.addEventListener('mouseleave', () => this.onSliderHover(slider, false));

    this.impactSpeedSlider = slider;

    section.appendChild(header);
    section.appendChild(slider);
    section.appendChild(rangeLabels);
    this.container.appendChild(section);
  }

  private buildHintSection(): void {
    const section = document.createElement('div');
    section.style.cssText = `
      background-color: #3a3a3a;
      border-left: 3px solid #4a90d9;
      border-radius: 4px;
      padding: 12px 14px;
      font-size: 12px;
      color: #cccccc;
      line-height: 1.6;
    `;
    section.innerHTML = `
      <div style="font-weight: 600; color: #ffffff; margin-bottom: 6px;">操作提示</div>
      <div>• 点击星球表面：触发陨石撞击</div>
      <div>• 拖拽星球：自由旋转视角</div>
      <div>• 滚轮：缩放视角</div>
    `;
    this.container.appendChild(section);
  }

  private buildResetButton(): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '重置星球';
    button.style.cssText = `
      width: 100%;
      padding: 14px 20px;
      background-color: #c0392b;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: sans-serif;
      transition: filter 0.15s ease, transform 0.1s ease;
      margin-top: auto;
      letter-spacing: 1px;
    `;

    button.addEventListener('click', () => {
      button.style.transform = 'scale(0.98)';
      setTimeout(() => { button.style.transform = ''; }, 100);
      this.controls.onReset?.();
      this.resetStats();
    });

    button.addEventListener('mouseenter', () => {
      button.style.filter = 'brightness(1.2)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.filter = 'brightness(1)';
    });

    this.resetButton = button;
    this.container.appendChild(button);
  }

  private getSliderStyle(): string {
    return `
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: linear-gradient(to right, #555 0%, #555 100%);
      outline: none;
      transition: filter 0.15s ease;
      cursor: pointer;
    `;
  }

  private onSliderHover(slider: HTMLInputElement, isHover: boolean): void {
    if (isHover) {
      slider.style.filter = 'brightness(1.2)';
    } else {
      slider.style.filter = 'brightness(1)';
    }
  }

  public recordImpact(asteroidRadius: number): void {
    this.impactCount++;
    this.totalSize += asteroidRadius;
    this.updateStatsDisplay();
  }

  private updateStatsDisplay(): void {
    this.impactCountElement.textContent = this.impactCount.toString();
    const avg = this.impactCount > 0 ? (this.totalSize / this.impactCount).toFixed(1) : '0';
    this.avgSizeElement.textContent = avg + ' 单位';
  }

  public resetStats(): void {
    this.impactCount = 0;
    this.totalSize = 0;
    this.updateStatsDisplay();
  }

  public getCurrentConfig(): ImpactConfig {
    return {
      asteroidRadius: parseFloat(this.asteroidRadiusSlider.value),
      impactSpeed: parseFloat(this.impactSpeedSlider.value)
    };
  }
}

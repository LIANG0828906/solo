import { PlanetData } from './PlanetFactory';

export interface ControlPanelCallbacks {
  onPlanetSelect: (planetName: string) => void;
  onTimeScaleChange: (scale: number) => void;
  onAutoRotateChange: (enabled: boolean) => void;
}

export class ControlPanel {
  private container: HTMLElement;
  private panel: HTMLElement;
  private infoCard: HTMLElement;
  private timeScaleButtons: HTMLButtonElement[] = [];
  private autoRotateToggle: HTMLInputElement;
  private dropdownList: HTMLElement;
  private searchInput: HTMLInputElement;
  private planetNames: string[];
  private callbacks: ControlPanelCallbacks;

  constructor(container: HTMLElement, planetNames: string[], callbacks: ControlPanelCallbacks) {
    this.container = container;
    this.planetNames = planetNames;
    this.callbacks = callbacks;
    this.panel = this.createPanel();
    this.infoCard = this.createInfoCard();
    this.searchInput = this.createPlanetSelector();
    this.dropdownList = this.createDropdownList();
    this.createTimeControls();
    this.autoRotateToggle = this.createAutoRotateToggle();
    this.container.appendChild(this.panel);
    this.container.appendChild(this.infoCard);
    this.setupEventListeners();
  }

  private createPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position: absolute;
      left: 16px;
      bottom: 16px;
      background: rgba(10, 10, 30, 0.85);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 16px;
      color: #E2E8F0;
      font-size: 14px;
      z-index: 1000;
      transition: all 0.2s ease;
      min-width: 240px;
      border: 1px solid rgba(79, 70, 229, 0.3);
    `;
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #7C3AED;
    `;
    title.textContent = '🚀 SunTrail 控制面板';
    panel.appendChild(title);
    return panel;
  }

  private createPlanetSelector(): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; margin-bottom: 16px;';
    const label = document.createElement('div');
    label.style.cssText = 'margin-bottom: 6px; font-size: 12px; color: #94A3B8;';
    label.textContent = '行星搜索';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '搜索行星';
    input.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid rgba(79, 70, 229, 0.3);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.3);
      color: #E2E8F0;
      font-size: 13px;
      outline: none;
      box-sizing: border-box;
    `;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    this.panel.appendChild(wrapper);
    return input;
  }

  private createDropdownList(): HTMLElement {
    const list = document.createElement('div');
    list.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: rgba(10, 10, 30, 0.95);
      border: 1px solid rgba(79, 70, 229, 0.3);
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      display: none;
      z-index: 1001;
    `;
    this.planetNames.forEach(name => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        transition: background 0.15s;
      `;
      item.textContent = name;
      item.dataset.planetName = name;
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(79, 70, 229, 0.3)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
      });
      item.addEventListener('click', () => {
        this.searchInput.value = name;
        this.callbacks.onPlanetSelect(name);
        list.style.display = 'none';
      });
      list.appendChild(item);
    });
    const inputWrapper = this.searchInput.parentElement;
    if (inputWrapper) {
      inputWrapper.appendChild(list);
      inputWrapper.style.position = 'relative';
    }
    return list;
  }

  private createTimeControls(): void {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '16px';
    const label = document.createElement('div');
    label.style.cssText = 'margin-bottom: 8px; font-size: 12px; color: #94A3B8;';
    label.textContent = '时间倍速';
    wrapper.appendChild(label);
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = 'display: flex; gap: 8px;';
    const scales = [1, 10, 100, 1000];
    scales.forEach((scale, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${scale}x`;
      btn.dataset.scale = String(scale);
      const isActive = index === 0;
      btn.style.cssText = `
        flex: 1;
        padding: 8px 0;
        border: none;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.15s ease;
        background: ${isActive ? '#4F46E5' : 'rgba(79, 70, 229, 0.2)'};
        color: ${isActive ? '#FFFFFF' : '#E2E8F0'};
        border: ${isActive ? '2px solid #7C3AED' : '2px solid transparent'};
      `;
      btn.addEventListener('click', () => {
        this.updateTimeScale(scale);
      });
      buttonGroup.appendChild(btn);
      this.timeScaleButtons.push(btn);
    });
    wrapper.appendChild(buttonGroup);
    this.panel.appendChild(wrapper);
  }

  private createAutoRotateToggle(): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
    const label = document.createElement('span');
    label.style.cssText = 'font-size: 12px; color: #94A3B8;';
    label.textContent = '自动旋转';
    const toggleWrapper = document.createElement('label');
    toggleWrapper.style.cssText = `
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    `;
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.style.cssText = 'opacity: 0; width: 0; height: 0;';
    const slider = document.createElement('span');
    slider.style.cssText = `
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(79, 70, 229, 0.2);
      transition: 0.2s;
      border-radius: 24px;
      border: 1px solid rgba(79, 70, 229, 0.3);
    `;
    const knob = document.createElement('span');
    knob.style.cssText = `
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background-color: #E2E8F0;
      transition: 0.2s;
      border-radius: 50%;
    `;
    slider.appendChild(knob);
    toggleWrapper.appendChild(input);
    toggleWrapper.appendChild(slider);
    input.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      slider.style.backgroundColor = checked ? '#4F46E5' : 'rgba(79, 70, 229, 0.2)';
      knob.style.transform = checked ? 'translateX(20px)' : 'translateX(0)';
      this.callbacks.onAutoRotateChange(checked);
    });
    wrapper.appendChild(label);
    wrapper.appendChild(toggleWrapper);
    this.panel.appendChild(wrapper);
    return input;
  }

  private createInfoCard(): HTMLElement {
    const card = document.createElement('div');
    card.style.cssText = `
      position: absolute;
      right: 16px;
      top: 16px;
      background: rgba(10, 10, 30, 0.85);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 20px;
      color: #E2E8F0;
      z-index: 1000;
      min-width: 280px;
      opacity: 0;
      transform: translateY(-10px);
      transition: opacity 0.3s ease-out, transform 0.3s ease-out;
      pointer-events: none;
      border: 1px solid rgba(79, 70, 229, 0.3);
    `;
    return card;
  }

  private setupEventListeners(): void {
    this.searchInput.addEventListener('focus', () => {
      this.filterDropdown('');
      this.dropdownList.style.display = 'block';
    });
    this.searchInput.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.filterDropdown(value);
    });
    document.addEventListener('click', (e) => {
      if (!this.panel.contains(e.target as Node)) {
        this.dropdownList.style.display = 'none';
      }
    });
  }

  private filterDropdown(query: string): void {
    const items = this.dropdownList.children;
    let hasVisible = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      const name = item.dataset.planetName || '';
      const matches = name.toLowerCase().includes(query.toLowerCase());
      item.style.display = matches ? 'block' : 'none';
      if (matches) hasVisible = true;
    }
    this.dropdownList.style.display = hasVisible ? 'block' : 'none';
  }

  private updateTimeScaleUI(scale: number): void {
    this.timeScaleButtons.forEach(btn => {
      const btnScale = parseInt(btn.dataset.scale || '1');
      const isActive = btnScale === scale;
      btn.style.background = isActive ? '#4F46E5' : 'rgba(79, 70, 229, 0.2)';
      btn.style.color = isActive ? '#FFFFFF' : '#E2E8F0';
      btn.style.border = isActive ? '2px solid #7C3AED' : '2px solid transparent';
    });
  }

  private updateTimeScale(scale: number): void {
    this.updateTimeScaleUI(scale);
    this.callbacks.onTimeScaleChange(scale);
  }

  showInfoCard(data: PlanetData): void {
    const massFormatted = data.mass;
    const periodFormatted = data.orbitalPeriod.toLocaleString();
    this.infoCard.innerHTML = `
      <div style="font-size: 20px; font-weight: bold; color: #7C3AED; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${data.color};"></span>
      ${data.name}
    </div>
    <div style="display: grid; gap: 8px;">
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #94A3B8;">质量</span>
        <span>${massFormatted}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #94A3B8;">公转周期</span>
        <span>${periodFormatted} 地球日</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #94A3B8;">卫星数量</span>
        <span>${data.moons} 颗</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #94A3B8;">自转周期</span>
        <span>${data.rotationPeriod} 小时</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #94A3B8;">轨道半径</span>
        <span>${data.orbitRadius} 单位</span>
      </div>
    </div>
    `;
    this.infoCard.style.opacity = '1';
    this.infoCard.style.transform = 'translateY(0)';
    this.infoCard.style.pointerEvents = 'auto';
  }

  hideInfoCard(): void {
    this.infoCard.style.opacity = '0';
    this.infoCard.style.transform = 'translateY(-10px)';
    this.infoCard.style.pointerEvents = 'none';
  }

  updateTimeScaleButton(scale: number): void {
    this.updateTimeScaleUI(scale);
  }

  setAutoRotate(enabled: boolean): void {
    this.autoRotateToggle.checked = enabled;
  }

  dispose(): void {
    this.panel.remove();
    this.infoCard.remove();
  }
}

export interface UIControls {
  repulsionStrength: number;
  gravityScale: number;
  colorFlickerFrequency: number;
}

export class UIManager {
  private infoPanel: HTMLDivElement;
  private controlBar: HTMLDivElement;
  private particleCountEl: HTMLDivElement;
  private fpsEl: HTMLDivElement;
  private mouseCoordsEl: HTMLDivElement;
  private repulsionSlider: HTMLInputElement;
  private gravitySlider: HTMLInputElement;
  private flickerSlider: HTMLInputElement;
  private repulsionValue: HTMLSpanElement;
  private gravityValue: HTMLSpanElement;
  private flickerValue: HTMLSpanElement;
  private controls: UIControls;
  private onControlChange: (controls: UIControls) => void;

  constructor(container: HTMLElement, onControlChange: (controls: UIControls) => void) {
    this.controls = {
      repulsionStrength: 2,
      gravityScale: 1,
      colorFlickerFrequency: 1,
    };
    this.onControlChange = onControlChange;

    this.infoPanel = document.createElement('div');
    this.infoPanel.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      width: 220px;
      background: #0D1B2A;
      opacity: 0.85;
      border-radius: 12px;
      border: 1px solid #2E5984;
      padding: 16px;
      color: white;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      pointer-events: none;
      z-index: 100;
    `;

    this.particleCountEl = document.createElement('div');
    this.particleCountEl.style.marginBottom = '8px';
    this.fpsEl = document.createElement('div');
    this.fpsEl.style.marginBottom = '8px';
    this.mouseCoordsEl = document.createElement('div');

    this.infoPanel.appendChild(this.particleCountEl);
    this.infoPanel.appendChild(this.fpsEl);
    this.infoPanel.appendChild(this.mouseCoordsEl);

    this.controlBar = document.createElement('div');
    this.controlBar.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 800px;
      height: 60px;
      background: #1B2838;
      opacity: 0.7;
      border-radius: 8px;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-around;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 100;
    `;

    this.repulsionSlider = this.createSlider(
      '排斥力强度',
      1,
      5,
      2,
      'repulsion'
    );
    this.gravitySlider = this.createSlider(
      '粒子吸引速度系数',
      0.5,
      2,
      1,
      'gravity'
    );
    this.flickerSlider = this.createSlider(
      '粒子颜色闪烁频率',
      0,
      3,
      1,
      'flicker'
    );

    container.appendChild(this.infoPanel);
    container.appendChild(this.controlBar);

    const label1 = document.createElement('div');
    label1.style.cssText = 'position:fixed;bottom:90px;left:20px;color:#8899AA;font-size:11px;z-index:100;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
    label1.textContent = '数字键 1/2/3 释放彩色粒子 (红/蓝/绿)';
    container.appendChild(label1);

    const label2 = document.createElement('div');
    label2.style.cssText = 'position:fixed;bottom:72px;left:20px;color:#8899AA;font-size:11px;z-index:100;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
    label2.textContent = '鼠标拖拽旋转视角 · 滚轮缩放 · 按住拖拽产生排斥力场';
    container.appendChild(label2);
  }

  private createSlider(
    label: string,
    min: number,
    max: number,
    value: number,
    type: 'repulsion' | 'gravity' | 'flicker'
  ): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;margin:0 10px;';

    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size:12px;color:#fff;white-space:nowrap;';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.style.cssText = 'font-size:12px;color:#4A90D9;margin-left:6px;';
    valueEl.textContent = value.toFixed(1);
    labelEl.appendChild(valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min.toString();
    slider.max = max.toString();
    slider.step = type === 'gravity' ? '0.1' : '0.1';
    slider.value = value.toString();
    slider.style.cssText = 'width:100%;cursor:pointer;';

    slider.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      valueEl.textContent = val.toFixed(1);
      if (type === 'repulsion') this.controls.repulsionStrength = val;
      if (type === 'gravity') this.controls.gravityScale = val;
      if (type === 'flicker') this.controls.colorFlickerFrequency = val;
      this.onControlChange({ ...this.controls });
    });

    wrapper.appendChild(labelEl);
    wrapper.appendChild(slider);
    this.controlBar.appendChild(wrapper);

    if (type === 'repulsion') this.repulsionValue = valueEl;
    if (type === 'gravity') this.gravityValue = valueEl;
    if (type === 'flicker') this.flickerValue = valueEl;

    return slider;
  }

  public updateInfo(particleCount: number, fps: number, theta: number, phi: number) {
    this.particleCountEl.innerHTML = `<span style="color:#8899AA">粒子总数：</span><span style="color:#50E3C2;font-weight:bold">${particleCount}</span>`;
    this.fpsEl.innerHTML = `<span style="color:#8899AA">帧率：</span><span style="color:${fps >= 50 ? '#50E3C2' : fps >= 30 ? '#FFB347' : '#FF6B6B'};font-weight:bold">${fps.toFixed(0)} FPS</span>`;
    this.mouseCoordsEl.innerHTML = `<span style="color:#8899AA">球面坐标：</span><span style="color:#4A90D9">Theta: ${theta.toFixed(1)}°, Phi: ${phi.toFixed(1)}°</span>`;
  }

  public getControls(): UIControls {
    return { ...this.controls };
  }

  public destroy() {
    this.infoPanel.remove();
    this.controlBar.remove();
  }
}

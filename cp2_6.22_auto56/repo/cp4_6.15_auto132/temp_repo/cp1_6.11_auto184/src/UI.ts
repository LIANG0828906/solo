import { SHICHEN_NAMES, SHICHEN_DESCS, WaterClock } from './WaterClock';

const PANEL_WIDTH = 150;
const PANEL_HEIGHT = 300;
const TICK_COUNT = 12;
const TICK_HEIGHT = 25;

export class UI {
  private container: HTMLDivElement;
  private panel: HTMLDivElement;
  private buoyIndicator: HTMLDivElement;
  private hourLabel: HTMLDivElement;
  private waterLevelLabel: HTMLDivElement;
  private startBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private starDescPopup: HTMLDivElement;
  private waterClock: WaterClock | null = null;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
    parent.appendChild(this.container);

    this.panel = this.createPanel();
    this.container.appendChild(this.panel);

    this.buoyIndicator = this.createBuoyIndicator();
    this.panel.appendChild(this.buoyIndicator);

    this.hourLabel = this.createHourLabel();
    this.panel.appendChild(this.hourLabel);

    this.waterLevelLabel = this.createWaterLevelLabel();
    this.panel.appendChild(this.waterLevelLabel);

    this.starDescPopup = this.createStarDescPopup();
    this.container.appendChild(this.starDescPopup);

    this.startBtn = this.createStartButton();
    this.container.appendChild(this.startBtn);

    this.resetBtn = this.createResetButton();
    this.container.appendChild(this.resetBtn);

    this.createTickMarks();
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.cssText = `
      position:absolute;
      right:20px;
      top:50%;
      transform:translateY(-50%);
      width:${PANEL_WIDTH}px;
      height:${PANEL_HEIGHT}px;
      background: linear-gradient(135deg, #3E2A1A 0%, #2B1A10 100%);
      border: 2px solid #8B6914;
      border-radius: 8px;
      pointer-events:auto;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5), 0 0 10px rgba(139,105,20,0.3);
      overflow:hidden;
      cursor:pointer;
    `;

    const topDecor = document.createElement('div');
    topDecor.style.cssText = `
      position:absolute;top:0;left:0;right:0;height:8px;
      background:linear-gradient(to bottom, #D4A76A, #8B6914);
      border-radius:6px 6px 0 0;
    `;
    panel.appendChild(topDecor);

    const botDecor = document.createElement('div');
    botDecor.style.cssText = `
      position:absolute;bottom:0;left:0;right:0;height:8px;
      background:linear-gradient(to top, #D4A76A, #8B6914);
      border-radius:0 0 6px 6px;
    `;
    panel.appendChild(botDecor);

    return panel;
  }

  private createTickMarks() {
    const innerHeight = PANEL_HEIGHT - 16;
    const topOffset = 12;
    for (let i = 0; i < TICK_COUNT; i++) {
      const y = topOffset + (TICK_COUNT - 1 - i) * TICK_HEIGHT;

      const tick = document.createElement('div');
      tick.style.cssText = `
        position:absolute;
        left:8px;
        top:${y}px;
        width:30px;
        height:1px;
        background:#D4A76A;
      `;
      this.panel.appendChild(tick);

      const label = document.createElement('div');
      label.style.cssText = `
        position:absolute;
        left:38px;
        top:${y - 8}px;
        font-size:11px;
        color:#D4A76A;
        font-family:SimSun,STSong,serif;
        white-space:nowrap;
        pointer-events:auto;
        cursor:pointer;
        transition:color 0.2s,text-shadow 0.2s;
      `;
      label.textContent = SHICHEN_NAMES[i];
      label.addEventListener('mouseenter', () => {
        label.style.color = '#FFD700';
        label.style.textShadow = '0 0 6px #FFD700';
      });
      label.addEventListener('mouseleave', () => {
        label.style.color = '#D4A76A';
        label.style.textShadow = 'none';
      });
      label.addEventListener('click', () => {
        this.showStarDesc(i);
      });
      this.panel.appendChild(label);
    }
  }

  private createBuoyIndicator(): HTMLDivElement {
    const buoy = document.createElement('div');
    buoy.style.cssText = `
      position:absolute;
      right:8px;
      top:12px;
      width:8px;
      height:12px;
      background:#CC3333;
      border-radius:2px;
      transition:top 0.3s ease-out;
      pointer-events:auto;
      cursor:pointer;
      box-shadow:0 0 4px rgba(204,51,51,0.5);
    `;
    buoy.addEventListener('mouseenter', () => {
      buoy.style.boxShadow = '0 0 8px rgba(255,215,0,0.8)';
      buoy.style.background = '#FFD700';
    });
    buoy.addEventListener('mouseleave', () => {
      buoy.style.boxShadow = '0 0 4px rgba(204,51,51,0.5)';
      buoy.style.background = '#CC3333';
    });
    buoy.addEventListener('click', () => {
      const hour = this.waterClock ? this.waterClock.getCurrentHour() : 0;
      this.showStarDesc(hour);
    });
    return buoy;
  }

  private createHourLabel(): HTMLDivElement {
    const label = document.createElement('div');
    label.style.cssText = `
      position:absolute;
      bottom:20px;
      left:0;right:0;
      text-align:center;
      font-size:14px;
      color:#D4A24C;
      font-family:SimSun,STSong,serif;
      text-shadow:0 0 4px rgba(212,162,76,0.3);
    `;
    label.textContent = SHICHEN_NAMES[0];
    return label;
  }

  private createWaterLevelLabel(): HTMLDivElement {
    const label = document.createElement('div');
    label.style.cssText = `
      position:absolute;
      bottom:8px;
      left:0;right:0;
      text-align:center;
      font-size:10px;
      color:#8BA8A8;
      font-family:monospace;
    `;
    label.textContent = '0.000 m';
    return label;
  }

  private createStartButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = '开始计时';
    btn.style.cssText = `
      position:absolute;
      left:20px;
      bottom:30px;
      width:60px;
      height:60px;
      border-radius:50%;
      border:2px solid #D4A24C;
      background:radial-gradient(circle, #8B6914 0%, #5C4410 100%);
      color:#D4A76A;
      font-size:12px;
      font-family:SimSun,STSong,serif;
      cursor:pointer;
      pointer-events:auto;
      box-shadow:0 0 8px rgba(139,105,20,0.4);
      transition:box-shadow 0.2s,background 0.2s;
      line-height:1.2;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.boxShadow = '0 0 16px #D4A24C';
      btn.style.background = 'radial-gradient(circle, #D4A24C 0%, #8B6914 100%)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.boxShadow = '0 0 8px rgba(139,105,20,0.4)';
      btn.style.background = 'radial-gradient(circle, #8B6914 0%, #5C4410 100%)';
    });
    return btn;
  }

  private createResetButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = '重置';
    btn.style.cssText = `
      position:absolute;
      left:95px;
      bottom:42px;
      padding:6px 14px;
      border:1px solid #8B6914;
      border-radius:4px;
      background:rgba(62,42,26,0.8);
      color:#D4A76A;
      font-size:12px;
      font-family:SimSun,STSong,serif;
      cursor:pointer;
      pointer-events:auto;
      transition:box-shadow 0.2s,background 0.2s;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.boxShadow = '0 0 10px rgba(212,162,76,0.4)';
      btn.style.background = 'rgba(139,105,20,0.5)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.boxShadow = 'none';
      btn.style.background = 'rgba(62,42,26,0.8)';
    });
    return btn;
  }

  private createStarDescPopup(): HTMLDivElement {
    const popup = document.createElement('div');
    popup.style.cssText = `
      position:absolute;
      display:none;
      padding:12px 16px;
      background:linear-gradient(135deg, #3E2A1A 0%, #2B1A10 100%);
      border:1px solid #D4A76A;
      border-radius:6px;
      color:#D4A76A;
      font-size:13px;
      font-family:SimSun,STSong,serif;
      max-width:200px;
      pointer-events:auto;
      box-shadow:0 0 12px rgba(212,167,106,0.3);
      z-index:20;
    `;
    return popup;
  }

  private showStarDesc(hour: number) {
    this.starDescPopup.innerHTML = `
      <div style="font-size:15px;color:#FFD700;margin-bottom:6px;font-weight:bold;">${SHICHEN_NAMES[hour]}</div>
      <div style="font-size:12px;color:#A0C4FF;margin-bottom:4px;">${SHICHEN_DESCS[hour]}</div>
    `;
    const panelRect = this.panel.getBoundingClientRect();
    this.starDescPopup.style.display = 'block';
    this.starDescPopup.style.left = `${panelRect.left - 210}px`;
    this.starDescPopup.style.top = `${panelRect.top + hour * TICK_HEIGHT}px`;

    setTimeout(() => {
      this.starDescPopup.style.display = 'none';
    }, 3000);
  }

  bindWaterClock(wc: WaterClock) {
    this.waterClock = wc;

    this.startBtn.addEventListener('click', () => {
      if (!this.waterClock) return;
      if (this.waterClock.getIsRunning()) {
        this.waterClock.stop();
        this.startBtn.textContent = '继续计时';
      } else {
        this.waterClock.start();
        this.startBtn.textContent = '暂停';
      }
    });

    this.resetBtn.addEventListener('click', () => {
      if (!this.waterClock) return;
      this.waterClock.reset();
      this.startBtn.textContent = '开始计时';
    });
  }

  update(hour: number, normalizedBuoyPos: number, waterLevel: number) {
    const innerHeight = PANEL_HEIGHT - 28;
    const topY = 14 + innerHeight * (1 - normalizedBuoyPos);
    this.buoyIndicator.style.top = `${topY}px`;
    this.hourLabel.textContent = SHICHEN_NAMES[hour];
    this.waterLevelLabel.textContent = `${waterLevel.toFixed(3)} m`;
  }

  setResponsive(isSmall: boolean) {
    if (isSmall) {
      this.panel.style.right = '10px';
      this.panel.style.transform = 'translateY(-50%) scale(0.8)';
      this.startBtn.style.width = '48px';
      this.startBtn.style.height = '48px';
      this.startBtn.style.fontSize = '10px';
    } else {
      this.panel.style.right = '20px';
      this.panel.style.transform = 'translateY(-50%) scale(1)';
      this.startBtn.style.width = '60px';
      this.startBtn.style.height = '60px';
      this.startBtn.style.fontSize = '12px';
    }
  }
}

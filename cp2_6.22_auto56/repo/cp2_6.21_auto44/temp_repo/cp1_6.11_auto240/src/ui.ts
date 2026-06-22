import type { StarData } from './celestial';

export interface UIState {
  latitude: number;
  date: Date;
  timeMinutes: number;
  playbackSpeed: 1 | 10 | 100 | 1000;
  isPlaying: boolean;
  planets: Record<string, boolean>;
}

export interface InfoBarData {
  date: string;
  time: string;
  lat: string;
  sunLon: string;
  moonLon: string;
  visiblePlanets: string[];
}

export type UIEventType =
  | 'latitudeChange'
  | 'dateTimeChange'
  | 'playbackChange'
  | 'reset'
  | 'planetToggle';

export class UIController {
  state: UIState;
  controlPanel!: HTMLElement;
  playbackBar!: HTMLElement;
  infoBar!: HTMLElement;
  tooltip!: HTMLElement;
  starInfoPanel!: HTMLElement;
  mobileToggle!: HTMLElement;
  overlayMask!: HTMLElement;

  latitudeSlider!: HTMLInputElement;
  latitudeValue!: HTMLElement;
  dateSlider!: HTMLInputElement;
  dateValue!: HTMLElement;
  timeSlider!: HTMLInputElement;
  timeValue!: HTMLElement;
  playPauseBtn!: HTMLButtonElement;
  resetBtn!: HTMLButtonElement;
  speedBtns: HTMLButtonElement[] = [];
  planetCheckboxes: Record<string, HTMLInputElement> = {};
  starCloseBtn!: HTMLElement;

  private listeners: Partial<Record<UIEventType, Function[]>> = {};
  private defaultState: UIState;
  private tooltipVisible = false;
  private isMobile = false;

  constructor() {
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    this.defaultState = {
      latitude: 40,
      date: today,
      timeMinutes: 12 * 60,
      playbackSpeed: 100,
      isPlaying: false,
      planets: { '金星': false, '木星': false, '水星': false, '火星': false, '土星': false }
    };
    this.state = { ...this.defaultState, planets: { ...this.defaultState.planets }, date: new Date(today) };

    this.createAll();
    this.bindInternalEvents();
    this.applyInitialState();
  }

  private createAll(): void {
    this.createInfoBar();
    this.createControlPanel();
    this.createPlaybackBar();
    this.createTooltip();
    this.createStarInfoPanel();
    this.createMobileToggle();
    this.createOverlayMask();
    this.checkMobileViewport();
    window.addEventListener('resize', () => this.checkMobileViewport());
  }

  private createControlPanel(): void {
    this.controlPanel = document.createElement('div');
    this.controlPanel.id = 'ui-control-panel';
    this.controlPanel.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      width: 250px; padding: 20px;
      background: rgba(26, 26, 46, 0.85);
      border-radius: 12px;
      border: 1px solid rgba(218, 165, 32, 0.3);
      color: #fff;
      font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 100;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
      max-height: calc(100vh - 130px);
      overflow-y: auto;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 18px; font-weight: 700; color: #FFD700;
      margin-bottom: 16px; text-align: center;
      letter-spacing: 2px;
    `;
    title.textContent = '控制面板';
    this.controlPanel.appendChild(title);

    this.latitudeSlider = this.createSlider(
      '地理纬度', -90, 90, 40, 1,
      (v) => `${v > 0 ? '北纬' : v < 0 ? '南纬' : '赤道'} ${Math.abs(v)}°`,
      '🌐'
    );
    this.dateSlider = this.createDateSlider();
    this.timeSlider = this.createTimeSlider();

    const planetTitle = document.createElement('div');
    planetTitle.style.cssText = `
      margin-top: 18px; padding-top: 14px;
      border-top: 1px solid rgba(218,165,32,0.25);
      font-size: 15px; font-weight: 600;
      color: #FFE55C; margin-bottom: 10px;
      display: flex; align-items: center; gap: 6px;
    `;
    planetTitle.innerHTML = '<span>✨</span> 五星显示';
    this.controlPanel.appendChild(planetTitle);

    const planetContainer = document.createElement('div');
    planetContainer.style.display = 'grid';
    planetContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    planetContainer.style.gap = '8px';

    const planetDefs: { key: string; label: string; color: string }[] = [
      { key: '水星', label: '水星', color: '#708090' },
      { key: '金星', label: '金星', color: '#FFD700' },
      { key: '火星', label: '火星', color: '#FF4500' },
      { key: '木星', label: '木星', color: '#FFA500' },
      { key: '土星', label: '土星', color: '#8B4513' }
    ];

    planetDefs.forEach((pd) => {
      const label = document.createElement('label');
      label.style.cssText = `
        display: flex; align-items: center; gap: 6px;
        font-size: 13px; cursor: pointer;
        padding: 5px 8px; border-radius: 6px;
        transition: background 0.2s;
      `;
      label.onmouseenter = () => { label.style.background = 'rgba(218,165,32,0.15)'; };
      label.onmouseleave = () => { label.style.background = 'transparent'; };

      const colorDot = document.createElement('span');
      colorDot.style.cssText = `
        width: 10px; height: 10px; border-radius: 50%;
        background: ${pd.color}; box-shadow: 0 0 6px ${pd.color};
        flex-shrink: 0;
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.cssText = `
        width: 15px; height: 15px; accent-color: #DAA520;
        cursor: pointer;
      `;
      this.planetCheckboxes[pd.key] = checkbox;

      const text = document.createElement('span');
      text.textContent = pd.label;

      label.append(colorDot, checkbox, text);
      planetContainer.appendChild(label);
    });

    this.controlPanel.appendChild(planetContainer);
    document.body.appendChild(this.controlPanel);
  }

  private createSlider(
    label: string,
    min: number, max: number, value: number, step: number,
    format: (v: number) => string,
    icon: string
  ): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '14px';

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px; font-size: 13px;
    `;

    const labelEl = document.createElement('span');
    labelEl.style.cssText = `
      display: flex; align-items: center; gap: 5px;
      color: #E8E8F0; font-weight: 500;
    `;
    labelEl.innerHTML = `<span>${icon}</span> ${label}`;

    const valueEl = document.createElement('span');
    valueEl.style.cssText = `
      color: #FFD700; font-weight: 600;
      background: rgba(218,165,32,0.12);
      padding: 2px 8px; border-radius: 4px;
      font-size: 12px;
    `;
    valueEl.textContent = format(value);
    this['latitudeValue'] ??= valueEl;

    header.append(labelEl, valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(min);
    slider.max = String(max);
    slider.value = String(value);
    slider.step = String(step);

    slider.style.cssText = `
      width: 100%; height: 6px;
      border-radius: 3px; outline: none;
      -webkit-appearance: none; appearance: none;
      background: linear-gradient(to right, #DAA520 0%, #DAA520 ${((value - min) / (max - min)) * 100}%, #3a3a50 ${((value - min) / (max - min)) * 100}%, #3a3a50 100%);
      cursor: pointer;
    `;
    this.applySliderPseudoStyle(slider);

    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      const pct = ((v - min) / (max - min)) * 100;
      slider.style.background = `linear-gradient(to right, #DAA520 0%, #DAA520 ${pct}%, #3a3a50 ${pct}%, #3a3a50 100%)`;
      valueEl.textContent = format(v);
    });

    wrapper.append(header, slider);
    this.controlPanel.appendChild(wrapper);

    return slider;
  }

  private createDateSlider(): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '14px';

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px; font-size: 13px;
    `;

    const labelEl = document.createElement('span');
    labelEl.style.cssText = `
      display: flex; align-items: center; gap: 5px;
      color: #E8E8F0; font-weight: 500;
    `;
    labelEl.innerHTML = '<span>📅</span> 观测日期';

    const valueEl = document.createElement('span');
    valueEl.style.cssText = `
      color: #FFD700; font-weight: 600;
      background: rgba(218,165,32,0.12);
      padding: 2px 8px; border-radius: 4px;
      font-size: 12px;
    `;
    this.dateValue = valueEl;

    const startOfYear = new Date(this.state.date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((this.state.date.getTime() - startOfYear.getTime()) / 86400000);
    this.updateDateDisplay(valueEl, dayOfYear);

    header.append(labelEl, valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '364';
    slider.value = String(dayOfYear);
    slider.step = '1';

    const pct = (dayOfYear / 364) * 100;
    slider.style.cssText = `
      width: 100%; height: 6px; border-radius: 3px; outline: none;
      -webkit-appearance: none; appearance: none; cursor: pointer;
      background: linear-gradient(to right, #DAA520 0%, #DAA520 ${pct}%, #3a3a50 ${pct}%, #3a3a50 100%);
    `;
    this.applySliderPseudoStyle(slider);

    slider.addEventListener('input', () => {
      const d = Number(slider.value);
      const p = (d / 364) * 100;
      slider.style.background = `linear-gradient(to right, #DAA520 0%, #DAA520 ${p}%, #3a3a50 ${p}%, #3a3a50 100%)`;
      this.updateDateDisplay(valueEl, d);
    });

    wrapper.append(header, slider);
    this.controlPanel.appendChild(wrapper);
    return slider;
  }

  private createTimeSlider(): HTMLInputElement {
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '8px';

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 6px; font-size: 13px;
    `;

    const labelEl = document.createElement('span');
    labelEl.style.cssText = `
      display: flex; align-items: center; gap: 5px;
      color: #E8E8F0; font-weight: 500;
    `;
    labelEl.innerHTML = '<span>🕐</span> 观测时刻';

    const valueEl = document.createElement('span');
    valueEl.style.cssText = `
      color: #FFD700; font-weight: 600;
      background: rgba(218,165,32,0.12);
      padding: 2px 8px; border-radius: 4px;
      font-size: 12px;
    `;
    this.timeValue = valueEl;
    this.updateTimeDisplay(valueEl, this.state.timeMinutes);

    header.append(labelEl, valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1440';
    slider.value = String(this.state.timeMinutes);
    slider.step = '10';

    const pct = (this.state.timeMinutes / 1440) * 100;
    slider.style.cssText = `
      width: 100%; height: 6px; border-radius: 3px; outline: none;
      -webkit-appearance: none; appearance: none; cursor: pointer;
      background: linear-gradient(to right, #DAA520 0%, #DAA520 ${pct}%, #3a3a50 ${pct}%, #3a3a50 100%);
    `;
    this.applySliderPseudoStyle(slider);

    slider.addEventListener('input', () => {
      const t = Number(slider.value);
      const p = (t / 1440) * 100;
      slider.style.background = `linear-gradient(to right, #DAA520 0%, #DAA520 ${p}%, #3a3a50 ${p}%, #3a3a50 100%)`;
      this.updateTimeDisplay(valueEl, t);
    });

    wrapper.append(header, slider);
    this.controlPanel.appendChild(wrapper);
    return slider;
  }

  private applySliderPseudoStyle(slider: HTMLInputElement): void {
    const style = document.createElement('style');
    const uniqueClass = `slider-${Math.random().toString(36).slice(2, 9)}`;
    slider.classList.add(uniqueClass);
    style.textContent = `
      .${uniqueClass}::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 18px; height: 18px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #FFE55C, #DAA520);
        border: 2px solid #8B6914;
        cursor: pointer; box-shadow: 0 0 8px rgba(218,165,32,0.6);
        transition: all 0.15s ease;
      }
      .${uniqueClass}::-webkit-slider-thumb:hover {
        width: 22px; height: 18px; border-radius: 45%;
        box-shadow: 0 0 14px rgba(255,215,0,0.9);
      }
      .${uniqueClass}::-moz-range-thumb {
        width: 18px; height: 18px; border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #FFE55C, #DAA520);
        border: 2px solid #8B6914;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  private updateDateDisplay(el: HTMLElement, dayOfYear: number): void {
    const d = new Date(this.state.date.getFullYear(), 0, 1);
    d.setDate(d.getDate() + dayOfYear);
    el.textContent = `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  private updateTimeDisplay(el: HTMLElement, minutes: number): void {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    el.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private createPlaybackBar(): void {
    this.playbackBar = document.createElement('div');
    this.playbackBar.style.cssText = `
      position: fixed; bottom: 20px; left: 50%;
      transform: translateX(-50%);
      height: 50px; padding: 0 20px;
      background: rgba(62, 39, 35, 0.8);
      border-radius: 12px;
      border: 1px solid rgba(218,165,32,0.35);
      display: flex; align-items: center; gap: 12px;
      z-index: 100; backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      transition: all 0.3s ease-out, transform 0.3s ease-out;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    `;

    this.playPauseBtn = this.createButton('▶ 播放');
    this.resetBtn = this.createButton('⟲ 重置');

    const divider = document.createElement('div');
    divider.style.cssText = `
      width: 1px; height: 28px;
      background: rgba(218,165,32,0.4);
      margin: 0 4px;
    `;

    const speeds: (1 | 10 | 100 | 1000)[] = [1, 10, 100, 1000];
    speeds.forEach((s) => {
      const btn = this.createButton(`${s}x`, true);
      this.speedBtns.push(btn);
    });

    this.playbackBar.append(this.playPauseBtn, this.resetBtn, divider, ...this.speedBtns);
    this.updateSpeedButtonStates();
    document.body.appendChild(this.playbackBar);
  }

  private createButton(text: string, isSpeed: boolean = false): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 0 ${isSpeed ? '12px' : '16px'};
      height: 36px; min-width: ${isSpeed ? '52px' : '90px'};
      background: linear-gradient(180deg, #E8B930 0%, #DAA520 50%, #B8860B 100%);
      color: #2a1a00;
      border: none;
      border-radius: 8px;
      font-size: ${isSpeed ? '12px' : '13px'};
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.3),
                  0 2px 6px rgba(0,0,0,0.3);
    `;
    btn.onmouseenter = () => {
      btn.style.filter = 'brightness(1.15)';
      btn.style.transform = 'translateY(-1px)';
    };
    btn.onmouseleave = () => {
      btn.style.filter = 'brightness(1)';
      btn.style.transform = 'translateY(0)';
    };
    btn.onmousedown = () => {
      btn.style.transform = 'translateY(1px)';
    };
    btn.onmouseup = () => {
      btn.style.transform = 'translateY(-1px)';
    };
    return btn;
  }

  private createInfoBar(): void {
    this.infoBar = document.createElement('div');
    this.infoBar.style.cssText = `
      position: fixed; top: 20px; left: 20px;
      padding: 14px 18px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 12px;
      color: #fff;
      font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
      font-size: 16px; line-height: 1.9;
      z-index: 100; backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      border: 1px solid rgba(255,255,255,0.08);
      min-width: 230px;
      transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    `;
    this.infoBar.id = 'ui-info-bar';
    document.body.appendChild(this.infoBar);
    this.updateInfoBar({
      date: '', time: '', lat: '',
      sunLon: '', moonLon: '', visiblePlanets: []
    });
  }

  private createTooltip(): void {
    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: fixed;
      padding: 8px 14px;
      background: #2F2F2F;
      color: #fff;
      border: 1.5px solid #DAA520;
      border-radius: 8px;
      font-size: 13px;
      font-family: -apple-system, "Segoe UI", sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.12s ease;
      z-index: 9999;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(this.tooltip);
  }

  private createStarInfoPanel(): void {
    this.starInfoPanel = document.createElement('div');
    this.starInfoPanel.style.cssText = `
      position: fixed; top: 50%; right: 290px;
      transform: translate(20px, -50%);
      width: 240px; padding: 20px;
      background: rgba(20, 20, 35, 0.95);
      border-radius: 12px;
      border: 1px solid rgba(218,165,32,0.4);
      color: #fff;
      font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
      z-index: 150;
      opacity: 0; pointer-events: none;
      transition: all 0.1s ease-out;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
    `;

    const closeBtn = document.createElement('div');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute; top: 10px; right: 14px;
      width: 26px; height: 26px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%;
      color: #aaa; font-size: 15px; cursor: pointer;
      transition: all 0.15s;
    `;
    closeBtn.onmouseenter = () => {
      closeBtn.style.background = 'rgba(255,80,80,0.25)';
      closeBtn.style.color = '#ff6060';
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.background = 'transparent';
      closeBtn.style.color = '#aaa';
    };
    this.starCloseBtn = closeBtn;
    this.starInfoPanel.appendChild(closeBtn);

    const title = document.createElement('div');
    title.id = 'star-title';
    title.style.cssText = `
      font-size: 20px; font-weight: 700;
      color: #FFE55C;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(218,165,32,0.3);
    `;
    title.textContent = '—';
    this.starInfoPanel.appendChild(title);

    const rows = [
      { label: '星名', id: 'star-name', color: '#FFD700' },
      { label: '星等', id: 'star-mag', color: '#E8E8E8' },
      { label: '星宿', id: 'star-cons', color: '#C8F5C8' }
    ];
    rows.forEach((r) => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between;
        padding: 7px 0;
        font-size: 14px;
        border-bottom: 1px dashed rgba(255,255,255,0.07);
      `;
      const lab = document.createElement('span');
      lab.style.color = '#9a9ab0';
      lab.textContent = r.label;
      const val = document.createElement('span');
      val.id = r.id;
      val.style.color = r.color;
      val.style.fontWeight = '600';
      val.textContent = '—';
      row.append(lab, val);
      this.starInfoPanel.appendChild(row);
    });

    document.body.appendChild(this.starInfoPanel);
  }

  private createMobileToggle(): void {
    this.mobileToggle = document.createElement('button');
    this.mobileToggle.innerHTML = '⚙';
    this.mobileToggle.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      width: 48px; height: 48px;
      border-radius: 50%;
      background: linear-gradient(180deg, #E8B930, #DAA520);
      color: #2a1a00;
      border: none;
      font-size: 22px;
      display: none;
      align-items: center; justify-content: center;
      cursor: pointer; z-index: 120;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(this.mobileToggle);
  }

  private createOverlayMask(): void {
    this.overlayMask = document.createElement('div');
    this.overlayMask.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 110;
      display: none;
      backdrop-filter: blur(4px);
    `;
    document.body.appendChild(this.overlayMask);
  }

  private checkMobileViewport(): void {
    const mobile = window.innerWidth < 768;
    if (mobile === this.isMobile) return;
    this.isMobile = mobile;

    if (mobile) {
      this.mobileToggle.style.display = 'flex';
      this.controlPanel.style.opacity = '0';
      this.controlPanel.style.pointerEvents = 'none';
      this.infoBar.style.opacity = '0';
      this.infoBar.style.transform = 'translateX(-20px)';
      this.playbackBar.style.opacity = '0';
      this.playbackBar.style.pointerEvents = 'none';
      this.playbackBar.style.transform = 'translate(-50%, 30px)';
    } else {
      this.mobileToggle.style.display = 'none';
      this.controlPanel.style.opacity = '1';
      this.controlPanel.style.pointerEvents = 'auto';
      this.infoBar.style.opacity = '1';
      this.infoBar.style.transform = 'translateX(0)';
      this.playbackBar.style.opacity = '1';
      this.playbackBar.style.pointerEvents = 'auto';
      this.playbackBar.style.transform = 'translateX(-50%)';
      this.overlayMask.style.display = 'none';
    }
  }

  private toggleMobilePanel(): void {
    const show = this.controlPanel.style.opacity === '0';
    this.overlayMask.style.display = show ? 'block' : 'none';

    if (show) {
      this.controlPanel.style.position = 'fixed';
      this.controlPanel.style.inset = '0';
      this.controlPanel.style.width = '100%';
      this.controlPanel.style.maxHeight = '100vh';
      this.controlPanel.style.borderRadius = '0';
      this.controlPanel.style.border = 'none';
      this.controlPanel.style.zIndex = '115';
      this.controlPanel.style.opacity = '1';
      this.controlPanel.style.pointerEvents = 'auto';

      this.infoBar.style.opacity = '1';
      this.infoBar.style.transform = 'translateX(0)';
      this.playbackBar.style.opacity = '1';
      this.playbackBar.style.pointerEvents = 'auto';
      this.playbackBar.style.transform = 'translateX(-50%)';
      this.playbackBar.style.bottom = '80px';
    } else {
      this.controlPanel.style.opacity = '0';
      this.controlPanel.style.pointerEvents = 'none';
      this.infoBar.style.opacity = '0';
      this.infoBar.style.transform = 'translateX(-20px)';
      this.playbackBar.style.opacity = '0';
      this.playbackBar.style.pointerEvents = 'none';
      this.playbackBar.style.bottom = '20px';
    }
  }

  private bindInternalEvents(): void {
    this.latitudeSlider.addEventListener('change', () => {
      this.state.latitude = Number(this.latitudeSlider.value);
      this.emit('latitudeChange', this.state.latitude);
    });
    this.latitudeSlider.addEventListener('input', () => {
      this.state.latitude = Number(this.latitudeSlider.value);
      this.emit('latitudeChange', this.state.latitude);
    });

    this.dateSlider.addEventListener('change', () => this.handleDateTimeChange());
    this.dateSlider.addEventListener('input', () => this.handleDateTimeChange());
    this.timeSlider.addEventListener('change', () => this.handleDateTimeChange());
    this.timeSlider.addEventListener('input', () => this.handleDateTimeChange());

    this.playPauseBtn.addEventListener('click', () => {
      this.state.isPlaying = !this.state.isPlaying;
      this.updatePlayButton();
      this.emit('playbackChange', this.state.isPlaying, this.state.playbackSpeed);
    });

    this.resetBtn.addEventListener('click', () => {
      this.resetState();
      this.emit('reset');
    });

    this.speedBtns.forEach((btn, i) => {
      const speeds: (1 | 10 | 100 | 1000)[] = [1, 10, 100, 1000];
      btn.addEventListener('click', () => {
        this.state.playbackSpeed = speeds[i];
        this.updateSpeedButtonStates();
        this.emit('playbackChange', this.state.isPlaying, this.state.playbackSpeed);
      });
    });

    Object.entries(this.planetCheckboxes).forEach(([key, cb]) => {
      cb.addEventListener('change', () => {
        this.state.planets[key] = cb.checked;
        this.emit('planetToggle', key, cb.checked);
      });
    });

    this.starCloseBtn.addEventListener('click', () => this.hideStarInfo());
    this.mobileToggle.addEventListener('click', () => this.toggleMobilePanel());
    this.overlayMask.addEventListener('click', () => this.toggleMobilePanel());
  }

  private handleDateTimeChange(): void {
    const dayOfYear = Number(this.dateSlider.value);
    const timeMin = Number(this.timeSlider.value);
    this.state.timeMinutes = timeMin;

    const d = new Date(this.state.date.getFullYear(), 0, 1);
    d.setDate(d.getDate() + dayOfYear);
    d.setHours(Math.floor(timeMin / 60), Math.floor(timeMin % 60), 0, 0);
    this.state.date = d;
    this.emit('dateTimeChange', new Date(d), timeMin);
  }

  private resetState(): void {
    this.state = {
      ...this.defaultState,
      planets: { ...this.defaultState.planets },
      date: new Date(this.defaultState.date)
    };
    this.applyInitialState();
  }

  private applyInitialState(): void {
    this.latitudeSlider.value = String(this.state.latitude);
    this.latitudeSlider.dispatchEvent(new Event('input'));

    const start = new Date(this.state.date.getFullYear(), 0, 1);
    const day = Math.floor((this.state.date.getTime() - start.getTime()) / 86400000);
    this.dateSlider.value = String(day);
    this.dateSlider.dispatchEvent(new Event('input'));

    this.timeSlider.value = String(this.state.timeMinutes);
    this.timeSlider.dispatchEvent(new Event('input'));

    this.updatePlayButton();
    this.updateSpeedButtonStates();

    Object.entries(this.planetCheckboxes).forEach(([k, cb]) => {
      cb.checked = !!this.state.planets[k];
    });
  }

  private updatePlayButton(): void {
    this.playPauseBtn.textContent = this.state.isPlaying ? '⏸ 暂停' : '▶ 播放';
  }

  private updateSpeedButtonStates(): void {
    this.speedBtns.forEach((btn) => {
      const isActive = btn.textContent === `${this.state.playbackSpeed}x`;
      if (isActive) {
        btn.style.background = 'linear-gradient(180deg, #FFF59D 0%, #FFD700 50%, #FFB300 100%)';
        btn.style.boxShadow = '0 0 14px rgba(255,215,0,0.7), inset 0 1px 0 rgba(255,255,255,0.4)';
        btn.style.transform = 'scale(1.05)';
      } else {
        btn.style.background = 'linear-gradient(180deg, #E8B930 0%, #DAA520 50%, #B8860B 100%)';
        btn.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.3)';
        btn.style.transform = 'scale(1)';
      }
    });
  }

  updateInfoBar(data: InfoBarData): void {
    const rows: [string, string, string][] = [
      ['📅 日期', data.date || '—', '#FFE55C'],
      ['🕐 时间', data.time || '—', '#E0E0FF'],
      ['🌐 纬度', data.lat || '—', '#FFD88A'],
      ['☀ 太阳黄经', data.sunLon || '—', '#FF9966'],
      ['🌙 月亮黄经', data.moonLon || '—', '#C0C0C0'],
      ['✨ 可见行星', data.visiblePlanets.length ? data.visiblePlanets.join('、') : '无', '#B0FFB0']
    ];
    this.infoBar.innerHTML = rows.map(([label, val, color]) => `
      <div style="display:flex;justify-content:space-between;gap:16px;">
        <span style="opacity:0.75;">${label}</span>
        <span style="font-weight:600;color:${color};">${val}</span>
      </div>
    `).join('');
  }

  showTooltip(x: number, y: number, text: string): void {
    this.tooltip.textContent = text;
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${Math.max(10, y - 46)}px`;
    if (!this.tooltipVisible) {
      this.tooltip.style.opacity = '1';
      this.tooltipVisible = true;
    }
  }

  hideTooltip(): void {
    if (this.tooltipVisible) {
      this.tooltip.style.opacity = '0';
      this.tooltipVisible = false;
    }
  }

  showStarInfo(star: StarData): void {
    const title = this.starInfoPanel.querySelector('#star-title') as HTMLElement;
    const name = this.starInfoPanel.querySelector('#star-name') as HTMLElement;
    const mag = this.starInfoPanel.querySelector('#star-mag') as HTMLElement;
    const cons = this.starInfoPanel.querySelector('#star-cons') as HTMLElement;

    if (title) title.textContent = `⭐ ${star.name}`;
    if (name) name.textContent = star.name;
    if (mag) name && (mag.textContent = `${star.magnitude.toFixed(2)} 等`);
    if (cons) cons.textContent = star.constellation;

    this.starInfoPanel.style.opacity = '1';
    this.starInfoPanel.style.transform = 'translate(0, -50%)';
    this.starInfoPanel.style.pointerEvents = 'auto';
  }

  hideStarInfo(): void {
    this.starInfoPanel.style.opacity = '0';
    this.starInfoPanel.style.transform = 'translate(20px, -50%)';
    this.starInfoPanel.style.pointerEvents = 'none';
  }

  setButtonHighlight(active: boolean): void {
    if (active) {
      this.playbackBar.style.boxShadow = '0 0 20px rgba(255,80,80,0.7), 0 4px 20px rgba(0,0,0,0.4)';
      this.playbackBar.style.borderColor = 'rgba(255,100,100,0.8)';
    } else {
      this.playbackBar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)';
      this.playbackBar.style.borderColor = 'rgba(218,165,32,0.35)';
    }
  }

  addListener(event: UIEventType, cb: Function): void {
    (this.listeners[event] ||= []).push(cb);
  }

  private emit(event: UIEventType, ...args: unknown[]): void {
    (this.listeners[event] || []).forEach((cb) => cb(...args));
  }

  setDateTimeFromOutside(date: Date, timeMinutes: number): void {
    this.state.date = new Date(date);
    this.state.timeMinutes = timeMinutes;

    const start = new Date(date.getFullYear(), 0, 1);
    const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
    if (Number(this.dateSlider.value) !== day) {
      this.dateSlider.value = String(Math.min(364, Math.max(0, day)));
      this.dateSlider.dispatchEvent(new Event('input'));
    }
    if (Number(this.timeSlider.value) !== timeMinutes) {
      this.timeSlider.value = String(timeMinutes);
      this.timeSlider.dispatchEvent(new Event('input'));
    }
  }

  setPlayingState(playing: boolean): void {
    this.state.isPlaying = playing;
    this.updatePlayButton();
  }

  dispose(): void {
    [this.controlPanel, this.playbackBar, this.infoBar,
      this.tooltip, this.starInfoPanel, this.mobileToggle, this.overlayMask
    ].forEach((el) => el?.remove());
    this.listeners = {};
  }
}

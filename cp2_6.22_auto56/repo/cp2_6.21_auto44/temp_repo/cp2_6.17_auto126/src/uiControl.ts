import type { PoleType } from './types';

interface Callbacks {
  onFieldLineDensityChange: (value: number) => void;
  onClear: () => void;
  onResetCamera: () => void;
  onStartDragPole: (type: PoleType, clientX: number, clientY: number) => void;
}

interface UIConfig {
  toolbarWidth: number;
  toolbarBg: string;
  toolbarRadius: number;
  toolbarPadding: number;
  panelHeight: number;
  panelBg: string;
  panelBlur: number;
  panelPadding: number;
  sliderTrackWidth: number;
  sliderTrackHeight: number;
  sliderTrackColor: string;
  sliderDotSize: number;
  sliderDotColor: string;
  sliderDotHoverColor: string;
  sliderMin: number;
  sliderMax: number;
  sliderDefault: number;
  buttonWidth: number;
  buttonHeight: number;
  buttonRadius: number;
  buttonClearBg: string;
  buttonResetBg: string;
  buttonTextColor: string;
  buttonFontSize: number;
  poleSize: number;
  poleColorN: string;
  poleColorS: string;
}

export class UIControl {
  private container: HTMLElement;
  private callbacks: Callbacks;
  private config: UIConfig;
  private toolbar: HTMLElement | null = null;
  private topPanel: HTMLElement | null = null;
  private densitySlider: HTMLInputElement | null = null;
  private densityLabel: HTMLElement | null = null;
  private clearBtn: HTMLElement | null = null;
  private resetBtn: HTMLElement | null = null;

  constructor(container: HTMLElement, config: UIConfig, callbacks: Callbacks) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
  }

  build(): void {
    this.createToolbar();
    this.createTopPanel();
  }

  private createToolbar(): void {
    this.toolbar = document.createElement('div');
    this.toolbar.style.position = 'fixed';
    this.toolbar.style.left = '0';
    this.toolbar.style.top = '50%';
    this.toolbar.style.transform = 'translateY(-50%)';
    this.toolbar.style.width = `${this.config.toolbarWidth}px`;
    this.toolbar.style.backgroundColor = this.config.toolbarBg;
    this.toolbar.style.borderTopRightRadius = `${this.config.toolbarRadius}px`;
    this.toolbar.style.borderBottomRightRadius = `${this.config.toolbarRadius}px`;
    this.toolbar.style.padding = `${this.config.toolbarPadding}px`;
    this.toolbar.style.display = 'flex';
    this.toolbar.style.flexDirection = 'column';
    this.toolbar.style.gap = '16px';
    this.toolbar.style.alignItems = 'center';
    this.toolbar.style.zIndex = '100';
    this.toolbar.style.backdropFilter = 'blur(8px)';
    this.toolbar.style.boxShadow = '2px 0 20px rgba(0,0,0,0.3)';

    const nPole = this.createPoleIcon('N', this.config.poleColorN);
    const sPole = this.createPoleIcon('S', this.config.poleColorS);

    const labelN = document.createElement('div');
    labelN.textContent = 'N极';
    labelN.style.color = '#ffffff';
    labelN.style.fontSize = '12px';
    labelN.style.opacity = '0.8';
    labelN.style.marginTop = '-8px';

    const labelS = document.createElement('div');
    labelS.textContent = 'S极';
    labelS.style.color = '#ffffff';
    labelS.style.fontSize = '12px';
    labelS.style.opacity = '0.8';
    labelS.style.marginTop = '-8px';

    this.toolbar.appendChild(nPole);
    this.toolbar.appendChild(labelN);
    this.toolbar.appendChild(sPole);
    this.toolbar.appendChild(labelS);

    this.container.appendChild(this.toolbar);
  }

  private createPoleIcon(type: PoleType, color: string): HTMLElement {
    const pole = document.createElement('div');
    const size = this.config.poleSize;
    pole.style.width = `${size}px`;
    pole.style.height = `${size}px`;
    pole.style.borderRadius = '50%';
    pole.style.backgroundColor = color;
    pole.style.cursor = 'grab';
    pole.style.position = 'relative';
    pole.style.display = 'flex';
    pole.style.alignItems = 'center';
    pole.style.justifyContent = 'center';
    pole.style.color = '#ffffff';
    pole.style.fontWeight = 'bold';
    pole.style.fontSize = '18px';
    pole.style.boxShadow = `0 0 20px ${color}66, inset 0 0 10px rgba(255,255,255,0.2)`;
    pole.style.transition = 'transform 0.2s, box-shadow 0.2s';
    pole.style.userSelect = 'none';
    pole.textContent = type;

    pole.addEventListener('mouseenter', () => {
      pole.style.transform = 'scale(1.1)';
      pole.style.boxShadow = `0 0 30px ${color}99, inset 0 0 15px rgba(255,255,255,0.3)`;
    });

    pole.addEventListener('mouseleave', () => {
      pole.style.transform = 'scale(1)';
      pole.style.boxShadow = `0 0 20px ${color}66, inset 0 0 10px rgba(255,255,255,0.2)`;
    });

    pole.addEventListener('mousedown', (e) => {
      e.preventDefault();
      pole.style.cursor = 'grabbing';
      this.callbacks.onStartDragPole(type, e.clientX, e.clientY);
    });

    return pole;
  }

  private createTopPanel(): void {
    this.topPanel = document.createElement('div');
    this.topPanel.style.position = 'fixed';
    this.topPanel.style.top = '0';
    this.topPanel.style.left = '0';
    this.topPanel.style.right = '0';
    this.topPanel.style.height = `${this.config.panelHeight}px`;
    this.topPanel.style.backgroundColor = this.config.panelBg;
    this.topPanel.style.backdropFilter = `blur(${this.config.panelBlur}px)`;
    (this.topPanel.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter = `blur(${this.config.panelBlur}px)`;
    this.topPanel.style.display = 'flex';
    this.topPanel.style.alignItems = 'center';
    this.topPanel.style.justifyContent = 'center';
    this.topPanel.style.gap = '24px';
    this.topPanel.style.padding = `${this.config.panelPadding}px`;
    this.topPanel.style.zIndex = '100';
    this.topPanel.style.borderBottom = '1px solid rgba(255,255,255,0.1)';

    const sliderContainer = this.createSlider();
    this.clearBtn = this.createButton('清空场景', this.config.buttonClearBg);
    this.resetBtn = this.createButton('重置视角', this.config.buttonResetBg);

    this.clearBtn.addEventListener('click', () => {
      this.callbacks.onClear();
    });

    this.resetBtn.addEventListener('click', () => {
      this.callbacks.onResetCamera();
    });

    this.topPanel.appendChild(sliderContainer);
    this.topPanel.appendChild(this.clearBtn);
    this.topPanel.appendChild(this.resetBtn);

    this.container.appendChild(this.topPanel);
  }

  private createSlider(): HTMLElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '12px';

    const label = document.createElement('span');
    label.textContent = '场线密度';
    label.style.color = '#ffffff';
    label.style.fontSize = '13px';
    label.style.opacity = '0.9';
    label.style.minWidth = '70px';

    const sliderWrapper = document.createElement('div');
    sliderWrapper.style.position = 'relative';
    sliderWrapper.style.width = `${this.config.sliderTrackWidth}px`;
    sliderWrapper.style.height = `${this.config.sliderDotSize}px`;
    sliderWrapper.style.display = 'flex';
    sliderWrapper.style.alignItems = 'center';

    const track = document.createElement('div');
    track.style.position = 'absolute';
    track.style.width = '100%';
    track.style.height = `${this.config.sliderTrackHeight}px`;
    track.style.backgroundColor = this.config.sliderTrackColor;
    track.style.borderRadius = '2px';

    const fill = document.createElement('div');
    fill.style.position = 'absolute';
    fill.style.height = `${this.config.sliderTrackHeight}px`;
    fill.style.backgroundColor = this.config.sliderDotColor;
    fill.style.borderRadius = '2px';
    fill.style.left = '0';

    this.densitySlider = document.createElement('input');
    this.densitySlider.type = 'range';
    this.densitySlider.min = String(this.config.sliderMin);
    this.densitySlider.max = String(this.config.sliderMax);
    this.densitySlider.value = String(this.config.sliderDefault);
    this.densitySlider.style.position = 'absolute';
    this.densitySlider.style.width = '100%';
    this.densitySlider.style.height = `${this.config.sliderDotSize}px`;
    this.densitySlider.style.opacity = '0';
    this.densitySlider.style.cursor = 'pointer';
    this.densitySlider.style.margin = '0';
    this.densitySlider.style.zIndex = '1';

    const dot = document.createElement('div');
    dot.style.position = 'absolute';
    dot.style.width = `${this.config.sliderDotSize}px`;
    dot.style.height = `${this.config.sliderDotSize}px`;
    dot.style.backgroundColor = this.config.sliderDotColor;
    dot.style.borderRadius = '50%';
    dot.style.pointerEvents = 'none';
    dot.style.transition = 'background-color 0.2s, transform 0.1s';
    dot.style.boxShadow = `0 2px 8px ${this.config.sliderDotColor}80`;

    const updateSlider = () => {
      if (!this.densitySlider) return;
      const value = Number(this.densitySlider.value);
      const percent = ((value - this.config.sliderMin) / (this.config.sliderMax - this.config.sliderMin)) * 100;
      fill.style.width = `${percent}%`;
      dot.style.left = `calc(${percent}% - ${this.config.sliderDotSize / 2}px)`;
      if (this.densityLabel) {
        this.densityLabel.textContent = String(value);
      }
    };

    this.densitySlider.addEventListener('input', updateSlider);
    this.densitySlider.addEventListener('change', () => {
      if (this.densitySlider) {
        this.callbacks.onFieldLineDensityChange(Number(this.densitySlider.value));
      }
    });

    this.densitySlider.addEventListener('mouseenter', () => {
      dot.style.backgroundColor = this.config.sliderDotHoverColor;
      dot.style.transform = 'scale(1.1)';
    });

    this.densitySlider.addEventListener('mouseleave', () => {
      dot.style.backgroundColor = this.config.sliderDotColor;
      dot.style.transform = 'scale(1)';
    });

    sliderWrapper.appendChild(track);
    sliderWrapper.appendChild(fill);
    sliderWrapper.appendChild(dot);
    sliderWrapper.appendChild(this.densitySlider);

    this.densityLabel = document.createElement('span');
    this.densityLabel.textContent = String(this.config.sliderDefault);
    this.densityLabel.style.color = '#ffffff';
    this.densityLabel.style.fontSize = '14px';
    this.densityLabel.style.fontWeight = '600';
    this.densityLabel.style.minWidth = '40px';
    this.densityLabel.style.textAlign = 'right';

    updateSlider();

    container.appendChild(label);
    container.appendChild(sliderWrapper);
    container.appendChild(this.densityLabel);

    return container;
  }

  private createButton(text: string, bgColor: string): HTMLElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.width = `${this.config.buttonWidth}px`;
    btn.style.height = `${this.config.buttonHeight}px`;
    btn.style.borderRadius = `${this.config.buttonRadius}px`;
    btn.style.backgroundColor = bgColor;
    btn.style.color = this.config.buttonTextColor;
    btn.style.fontSize = `${this.config.buttonFontSize}px`;
    btn.style.fontWeight = '600';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'transform 0.15s, box-shadow 0.15s';
    btn.style.boxShadow = `0 2px 8px ${bgColor}40`;
    btn.style.fontFamily = 'inherit';

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = `0 4px 16px ${bgColor}60`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = `0 2px 8px ${bgColor}40`;
    });

    btn.addEventListener('mousedown', () => {
      btn.style.transform = 'scale(0.98)';
    });

    btn.addEventListener('mouseup', () => {
      btn.style.transform = 'scale(1.05)';
    });

    return btn;
  }

  getDensityValue(): number {
    return this.densitySlider ? Number(this.densitySlider.value) : this.config.sliderDefault;
  }

  dispose(): void {
    if (this.toolbar) {
      this.toolbar.remove();
    }
    if (this.topPanel) {
      this.topPanel.remove();
    }
  }
}

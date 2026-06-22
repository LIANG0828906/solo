import { useStormStore } from './store';

export interface UICallbacks {
  onResetCamera: () => void;
}

export class UIManager {
  private container: HTMLElement;
  private panel: HTMLDivElement;
  private windSlider: HTMLInputElement;
  private windValueLabel: HTMLSpanElement;
  private rainfallDisplay: HTMLDivElement;
  private resetButton: HTMLButtonElement;
  private trailToggle: HTMLInputElement;
  private callbacks: UICallbacks;

  private readonly densityThreshold: number = 20;

  constructor(container: HTMLElement, callbacks: UICallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.panel = this.createPanel();
    this.windSlider = this.createWindSlider();
    this.windValueLabel = this.createWindValueLabel();
    this.rainfallDisplay = this.createRainfallDisplay();
    this.resetButton = this.createResetButton();
    this.trailToggle = this.createTrailToggle();

    this.assemblePanel();
    this.bindEvents();
  }

  private createPanel(): HTMLDivElement {
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.right = '20px';
    panel.style.bottom = '20px';
    panel.style.padding = '16px';
    panel.style.minWidth = '240px';
    panel.style.background = 'rgba(20, 20, 40, 0.7)';
    panel.style.backdropFilter = 'blur(8px)';
    (panel.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter = 'blur(8px)';
    panel.style.borderRadius = '12px';
    panel.style.border = '2px solid #4A90D9';
    panel.style.boxShadow = '0 0 20px rgba(74, 144, 217, 0.3)';
    panel.style.color = '#FFFFFF';
    panel.style.fontSize = '13px';
    panel.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    panel.style.zIndex = '100';
    return panel;
  }

  private createWindSlider(): HTMLInputElement {
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '10';
    slider.step = '1';
    slider.value = '5';
    slider.style.width = '100%';
    slider.style.height = '6px';
    slider.style.marginTop = '8px';
    slider.style.appearance = 'none';
    slider.style.webkitAppearance = 'none';
    slider.style.background = '#333';
    slider.style.borderRadius = '3px';
    slider.style.outline = 'none';
    slider.style.cursor = 'pointer';
    slider.style.transition = 'all 0.2s ease-out';
    return slider;
  }

  private createWindValueLabel(): HTMLSpanElement {
    const label = document.createElement('span');
    label.textContent = '5';
    label.style.display = 'inline-block';
    label.style.minWidth = '24px';
    label.style.textAlign = 'center';
    label.style.fontWeight = 'bold';
    label.style.color = '#4A90D9';
    return label;
  }

  private createRainfallDisplay(): HTMLDivElement {
    const div = document.createElement('div');
    div.style.marginTop = '16px';
    div.style.padding = '10px 12px';
    div.style.background = 'rgba(255, 255, 255, 0.05)';
    div.style.borderRadius = '8px';
    div.style.fontSize = '14px';
    div.style.color = 'rgba(255, 255, 255, 0.9)';
    div.style.transition = 'color 0.3s ease-out';
    return div;
  }

  private createResetButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '重置视角';
    button.style.width = '100%';
    button.style.marginTop = '16px';
    button.style.padding = '10px 16px';
    button.style.background = '#4A90D9';
    button.style.color = '#FFFFFF';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.fontSize = '13px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    button.style.transition = 'all 0.2s ease-out';
    return button;
  }

  private createTrailToggle(): HTMLInputElement {
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'trail-toggle';
    toggle.style.width = '18px';
    toggle.style.height = '18px';
    toggle.style.cursor = 'pointer';
    toggle.style.accentColor = '#4A90D9';
    return toggle;
  }

  private assemblePanel(): void {
    const title = document.createElement('div');
    title.textContent = '台风模拟器';
    title.style.fontSize = '16px';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '16px';
    title.style.color = '#4A90D9';
    this.panel.appendChild(title);

    const windLabel = document.createElement('div');
    windLabel.style.display = 'flex';
    windLabel.style.justifyContent = 'space-between';
    windLabel.style.alignItems = 'center';
    windLabel.style.marginBottom = '4px';
    const windText = document.createElement('span');
    windText.textContent = '风力强度';
    windLabel.appendChild(windText);
    windLabel.appendChild(this.windValueLabel);
    this.panel.appendChild(windLabel);

    this.panel.appendChild(this.windSlider);

    this.panel.appendChild(this.rainfallDisplay);

    const trailContainer = document.createElement('label');
    trailContainer.htmlFor = 'trail-toggle';
    trailContainer.style.display = 'flex';
    trailContainer.style.alignItems = 'center';
    trailContainer.style.gap = '10px';
    trailContainer.style.marginTop = '16px';
    trailContainer.style.cursor = 'pointer';
    trailContainer.style.fontSize = '13px';
    trailContainer.appendChild(this.trailToggle);
    const trailText = document.createElement('span');
    trailText.textContent = '显示气流粒子轨迹';
    trailContainer.appendChild(trailText);
    this.panel.appendChild(trailContainer);

    this.panel.appendChild(this.resetButton);

    this.container.appendChild(this.panel);
    this.injectSliderStyles();
  }

  private injectSliderStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        background: #4A90D9;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease-out;
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        background: #5BA3E6;
        transform: scale(1.1);
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: #4A90D9;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        transition: all 0.2s ease-out;
      }
      input[type="range"]::-moz-range-thumb:hover {
        background: #5BA3E6;
        transform: scale(1.1);
      }
      button:hover {
        background: #5BA3E6 !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
      }
      button:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  private bindEvents(): void {
    this.windSlider.addEventListener('input', () => {
      const value = parseInt(this.windSlider.value, 10);
      this.windValueLabel.textContent = String(value);
      useStormStore.getState().setWindStrength(value);
    });

    this.resetButton.addEventListener('click', () => {
      this.callbacks.onResetCamera();
    });

    this.trailToggle.addEventListener('change', () => {
      useStormStore.getState().setShowTrails(this.trailToggle.checked);
    });
  }

  public updateRainfallDisplay(activeParticles: number, viewArea: number): void {
    const density = activeParticles / viewArea;
    const densityStr = density.toFixed(2);
    this.rainfallDisplay.innerHTML = `降雨量密度<br><span style="font-size: 20px; font-weight: bold; display: block; margin-top: 4px;">${densityStr}</span>`;

    if (density > this.densityThreshold) {
      this.rainfallDisplay.style.color = '#FFFF00';
    } else {
      this.rainfallDisplay.style.color = 'rgba(255, 255, 255, 0.9)';
    }

    useStormStore.getState().setActiveParticles(activeParticles);
  }
}

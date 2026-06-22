export interface ControlPanelCallbacks {
  onWindSpeedChange: (speed: number) => void;
  onReset: () => void;
  onThemeChange: (theme: string) => void;
}

export class ControlPanel {
  private container: HTMLElement;
  private callbacks: ControlPanelCallbacks;
  private panel: HTMLDivElement;
  private windSlider: HTMLInputElement;
  private windValue: HTMLSpanElement;
  private fpsDisplay: HTMLSpanElement;
  private resetButton: HTMLButtonElement;
  private themeButtons: HTMLButtonElement[] = [];
  private currentTheme: string = 'warm';

  constructor(container: HTMLElement, callbacks: ControlPanelCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.panel = document.createElement('div');
    this.windSlider = document.createElement('input');
    this.windValue = document.createElement('span');
    this.fpsDisplay = document.createElement('span');
    this.resetButton = document.createElement('button');

    this.createPanel();
  }

  private createPanel(): void {
    this.panel.style.position = 'absolute';
    this.panel.style.top = '20px';
    this.panel.style.left = '20px';
    this.panel.style.background = 'rgba(241, 245, 249, 0.9)';
    this.panel.style.borderRadius = '8px';
    this.panel.style.padding = '12px';
    this.panel.style.minWidth = '220px';
    this.panel.style.backdropFilter = 'blur(8px)';
    this.panel.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    this.panel.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    this.panel.style.fontSize = '14px';
    this.panel.style.color = '#1e293b';
    this.panel.style.zIndex = '100';

    const title = document.createElement('div');
    title.textContent = '控制面板';
    title.style.fontWeight = '600';
    title.style.marginBottom = '12px';
    title.style.fontSize = '15px';
    this.panel.appendChild(title);

    const windSection = document.createElement('div');
    windSection.style.marginBottom = '12px';

    const windLabel = document.createElement('div');
    windLabel.textContent = '风速';
    windLabel.style.display = 'flex';
    windLabel.style.justifyContent = 'space-between';
    windLabel.style.alignItems = 'center';
    windLabel.style.marginBottom = '6px';

    this.windValue.textContent = '0';
    this.windValue.style.fontWeight = '600';
    this.windValue.style.color = '#2563eb';
    windLabel.appendChild(this.windValue);
    windSection.appendChild(windLabel);

    this.windSlider.type = 'range';
    this.windSlider.min = '0';
    this.windSlider.max = '20';
    this.windSlider.step = '0.1';
    this.windSlider.value = '0';
    this.windSlider.style.width = '100%';
    this.windSlider.style.height = '6px';
    this.windSlider.style.borderRadius = '3px';
    this.windSlider.style.background = '#cbd5e1';
    this.windSlider.style.appearance = 'none';
    this.windSlider.style.outline = 'none';
    this.windSlider.style.cursor = 'pointer';

    const sliderStyle = document.createElement('style');
    sliderStyle.textContent = `
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      }
      input[type="range"]::-webkit-slider-thumb:hover {
        background: #2563eb;
        transform: scale(1.1);
      }
      input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #3b82f6;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      }
      button {
        transition: all 0.2s ease;
      }
      button:hover {
        transform: translateY(-1px);
      }
      button:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(sliderStyle);

    this.windSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.windValue.textContent = value.toFixed(1);
      this.callbacks.onWindSpeedChange(value);
      this.windSlider.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(value / 20) * 100}%, #cbd5e1 ${(value / 20) * 100}%, #cbd5e1 100%)`;
    });

    windSection.appendChild(this.windSlider);
    this.panel.appendChild(windSection);

    const themeSection = document.createElement('div');
    themeSection.style.marginBottom = '12px';

    const themeLabel = document.createElement('div');
    themeLabel.textContent = '颜色主题';
    themeLabel.style.marginBottom = '6px';
    themeLabel.style.fontSize = '13px';
    themeSection.appendChild(themeLabel);

    const themeButtonsContainer = document.createElement('div');
    themeButtonsContainer.style.display = 'flex';
    themeButtonsContainer.style.gap = '8px';

    const themes = [
      { id: 'warm', label: '暖色调', color1: '#FF6B35', color2: '#FFD93D' },
      { id: 'cool', label: '冷色调', color1: '#4ECDC4', color2: '#A855F7' }
    ];

    themes.forEach((theme) => {
      const btn = document.createElement('button');
      btn.textContent = theme.label;
      btn.style.flex = '1';
      btn.style.padding = '6px 10px';
      btn.style.border = 'none';
      btn.style.borderRadius = '6px';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '12px';
      btn.style.fontWeight = '500';
      btn.style.background = `linear-gradient(135deg, ${theme.color1}, ${theme.color2})`;
      btn.style.color = 'white';
      btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

      if (theme.id === this.currentTheme) {
        btn.style.boxShadow = '0 0 0 2px #3b82f6, 0 2px 4px rgba(0,0,0,0.1)';
      }

      btn.addEventListener('click', () => {
        this.currentTheme = theme.id;
        this.themeButtons.forEach(b => {
          b.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
        btn.style.boxShadow = '0 0 0 2px #3b82f6, 0 2px 4px rgba(0,0,0,0.1)';
        this.callbacks.onThemeChange(theme.id);
      });

      this.themeButtons.push(btn);
      themeButtonsContainer.appendChild(btn);
    });

    themeSection.appendChild(themeButtonsContainer);
    this.panel.appendChild(themeSection);

    const fpsSection = document.createElement('div');
    fpsSection.style.marginBottom = '12px';
    fpsSection.style.display = 'flex';
    fpsSection.style.justifyContent = 'space-between';
    fpsSection.style.alignItems = 'center';

    const fpsLabel = document.createElement('span');
    fpsLabel.textContent = '帧率';
    fpsLabel.style.fontSize = '13px';
    fpsSection.appendChild(fpsLabel);

    this.fpsDisplay.textContent = '60 FPS';
    this.fpsDisplay.style.fontWeight = '600';
    this.fpsDisplay.style.color = '#10b981';
    fpsSection.appendChild(this.fpsDisplay);
    this.panel.appendChild(fpsSection);

    this.resetButton.textContent = '重置';
    this.resetButton.style.width = '100%';
    this.resetButton.style.padding = '8px 12px';
    this.resetButton.style.border = 'none';
    this.resetButton.style.borderRadius = '6px';
    this.resetButton.style.background = '#64748b';
    this.resetButton.style.color = 'white';
    this.resetButton.style.cursor = 'pointer';
    this.resetButton.style.fontSize = '13px';
    this.resetButton.style.fontWeight = '500';

    this.resetButton.addEventListener('click', () => {
      this.windSlider.value = '0';
      this.windValue.textContent = '0';
      this.windSlider.style.background = '#cbd5e1';
      this.callbacks.onReset();
    });

    this.panel.appendChild(this.resetButton);

    this.container.appendChild(this.panel);
  }

  setFPS(fps: number): void {
    this.fpsDisplay.textContent = `${Math.round(fps)} FPS`;
    if (fps >= 30) {
      this.fpsDisplay.style.color = '#10b981';
    } else if (fps >= 25) {
      this.fpsDisplay.style.color = '#f59e0b';
    } else {
      this.fpsDisplay.style.color = '#ef4444';
    }
  }

  setWindSpeed(speed: number): void {
    this.windSlider.value = speed.toString();
    this.windValue.textContent = speed.toFixed(1);
  }

  dispose(): void {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}

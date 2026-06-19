import type { UICallbacks, ColorMode, SliderConfig, TooltipData } from './types';
import { PRESETS } from './types';

export class UIControls {
  private callbacks: UICallbacks;
  private sliderContainer: HTMLElement;
  private presetButtons: HTMLElement;
  private tooltipContainer: HTMLElement;
  private controlPanel: HTMLElement;
  private hamburgerBtn: HTMLElement;
  private overlay: HTMLElement;
  private tooltips: TooltipData[] = [];
  private maxTooltips: number = 5;
  private tooltipIdCounter: number = 0;
  private isDrawerOpen: boolean = false;
  private currentPreset: string = 'nebula';
  private currentColorMode: ColorMode = 'warm';

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.sliderContainer = document.getElementById('sliderContainer')!;
    this.presetButtons = document.getElementById('presetButtons')!;
    this.tooltipContainer = document.getElementById('tooltipContainer')!;
    this.controlPanel = document.getElementById('controlPanel')!;
    this.hamburgerBtn = document.getElementById('hamburgerBtn')!;
    this.overlay = document.getElementById('overlay')!;

    this.initSliders();
    this.initColorModeSelector();
    this.initPresetButtons();
    this.initHamburgerMenu();
    this.checkResponsive();
    window.addEventListener('resize', () => this.checkResponsive());
  }

  private initSliders(): void {
    const sliders: SliderConfig[] = [
      {
        id: 'particleCount',
        label: '粒子数量',
        min: 1000,
        max: 5000,
        step: 100,
        value: 2000,
        format: (v) => v.toString()
      },
      {
        id: 'vortexSpeed',
        label: '涡旋速度',
        min: 0.01,
        max: 0.1,
        step: 0.005,
        value: 0.01,
        format: (v) => v.toFixed(3)
      },
      {
        id: 'springStrength',
        label: '回弹强度',
        min: 0.1,
        max: 0.9,
        step: 0.05,
        value: 0.5,
        format: (v) => v.toFixed(2)
      }
    ];

    sliders.forEach((config) => {
      this.createSlider(config);
    });
  }

  private createSlider(config: SliderConfig): void {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const labelRow = document.createElement('div');
    labelRow.className = 'slider-label';

    const labelText = document.createElement('span');
    labelText.textContent = config.label;

    const valueText = document.createElement('span');
    valueText.className = 'slider-value';
    valueText.textContent = config.format(config.value);
    valueText.id = `${config.id}-value`;

    labelRow.appendChild(labelText);
    labelRow.appendChild(valueText);

    const slider = document.createElement('div');
    slider.className = 'custom-slider';
    slider.id = config.id;

    const track = document.createElement('div');
    track.className = 'slider-track';

    const fill = document.createElement('div');
    fill.className = 'slider-fill';
    fill.style.width = `${((config.value - config.min) / (config.max - config.min)) * 100}%`;

    const thumb = document.createElement('div');
    thumb.className = 'slider-thumb';
    thumb.style.left = `${((config.value - config.min) / (config.max - config.min)) * 100}%`;

    track.appendChild(fill);
    slider.appendChild(track);
    slider.appendChild(thumb);

    group.appendChild(labelRow);
    group.appendChild(slider);
    this.sliderContainer.appendChild(group);

    let isDragging = false;

    const updateSlider = (clientX: number) => {
      const rect = slider.getBoundingClientRect();
      let percentage = (clientX - rect.left) / rect.width;
      percentage = Math.max(0, Math.min(1, percentage));

      const newValue = config.min + percentage * (config.max - config.min);
      const steppedValue = Math.round(newValue / config.step) * config.step;
      const finalValue = Math.max(config.min, Math.min(config.max, steppedValue));

      const finalPercentage = (finalValue - config.min) / (config.max - config.min);
      fill.style.width = `${finalPercentage * 100}%`;
      thumb.style.left = `${finalPercentage * 100}%`;
      valueText.textContent = config.format(finalValue);

      switch (config.id) {
        case 'particleCount':
          this.callbacks.onParticleCountChange(Math.round(finalValue));
          break;
        case 'vortexSpeed':
          this.callbacks.onVortexSpeedChange(finalValue);
          break;
        case 'springStrength':
          this.callbacks.onSpringStrengthChange(finalValue);
          break;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      updateSlider(e.clientX);
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSlider(e.clientX);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      updateSlider(e.touches[0].clientX);
      e.preventDefault();
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        updateSlider(e.touches[0].clientX);
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    slider.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    slider.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }

  private initColorModeSelector(): void {
    const group = document.createElement('div');
    group.className = 'slider-group';

    const labelRow = document.createElement('div');
    labelRow.className = 'slider-label';

    const labelText = document.createElement('span');
    labelText.textContent = '颜色模式';

    labelRow.appendChild(labelText);
    group.appendChild(labelRow);

    const selector = document.createElement('div');
    selector.className = 'color-mode-selector';

    const modes: { id: ColorMode; label: string }[] = [
      { id: 'warm', label: '暖色' },
      { id: 'cool', label: '冷色' },
      { id: 'rainbow', label: '彩虹' }
    ];

    modes.forEach((mode) => {
      const option = document.createElement('div');
      option.className = 'color-option';
      option.textContent = mode.label;
      option.dataset.mode = mode.id;

      if (mode.id === this.currentColorMode) {
        option.classList.add('active');
      }

      option.addEventListener('click', () => {
        selector.querySelectorAll('.color-option').forEach((el) => {
          el.classList.remove('active');
        });
        option.classList.add('active');
        this.currentColorMode = mode.id;
        this.callbacks.onColorModeChange(mode.id);
      });

      selector.appendChild(option);
    });

    group.appendChild(selector);
    this.sliderContainer.appendChild(group);
  }

  private initPresetButtons(): void {
    Object.values(PRESETS).forEach((preset) => {
      const btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = preset.label;
      btn.dataset.preset = preset.name;

      if (preset.name === this.currentPreset) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        this.presetButtons.querySelectorAll('.preset-btn').forEach((el) => {
          el.classList.remove('active');
        });
        btn.classList.add('active');
        this.currentPreset = preset.name;
        this.callbacks.onPresetChange(preset.name);
      });

      this.presetButtons.appendChild(btn);
    });
  }

  private initHamburgerMenu(): void {
    this.hamburgerBtn.addEventListener('click', () => {
      this.toggleDrawer();
    });

    this.overlay.addEventListener('click', () => {
      this.closeDrawer();
    });
  }

  private checkResponsive(): void {
    if (window.innerWidth < 768) {
      if (!this.isDrawerOpen) {
        this.controlPanel.classList.remove('active');
        this.overlay.classList.remove('active');
        this.hamburgerBtn.classList.remove('active');
      }
    } else {
      this.controlPanel.classList.remove('active');
      this.overlay.classList.remove('active');
      this.hamburgerBtn.classList.remove('active');
      this.isDrawerOpen = false;
    }
  }

  public toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
    if (this.isDrawerOpen) {
      this.controlPanel.classList.add('active');
      this.overlay.classList.add('active');
      this.hamburgerBtn.classList.add('active');
    } else {
      this.closeDrawer();
    }
  }

  private closeDrawer(): void {
    this.isDrawerOpen = false;
    this.controlPanel.classList.remove('active');
    this.overlay.classList.remove('active');
    this.hamburgerBtn.classList.remove('active');
  }

  public showTooltip(particleIndex: number, screenX: number, screenY: number, position: { x: number; y: number; z: number }, velocity: { x: number; y: number; z: number }): void {
    if (this.tooltips.length >= this.maxTooltips) {
      const oldest = this.tooltips.shift();
      if (oldest) {
        this.removeTooltip(oldest);
      }
    }

    const existing = this.tooltips.find((t) => t.particleIndex === particleIndex);
    if (existing) {
      this.removeTooltip(existing);
    }

    const tooltipId = ++this.tooltipIdCounter;

    const element = document.createElement('div');
    element.className = 'particle-tooltip';
    element.dataset.tooltipId = tooltipId.toString();
    element.style.left = `${screenX + 10}px`;
    element.style.top = `${screenY + 10}px`;

    element.innerHTML = `
      <div class="tooltip-title">粒子 #${particleIndex}</div>
      <div class="tooltip-row">
        <span>位置 X:</span>
        <span class="tooltip-value">${position.x.toFixed(2)}</span>
      </div>
      <div class="tooltip-row">
        <span>位置 Y:</span>
        <span class="tooltip-value">${position.y.toFixed(2)}</span>
      </div>
      <div class="tooltip-row">
        <span>位置 Z:</span>
        <span class="tooltip-value">${position.z.toFixed(2)}</span>
      </div>
      <div class="tooltip-row">
        <span>速度 X:</span>
        <span class="tooltip-value">${velocity.x.toFixed(2)}</span>
      </div>
      <div class="tooltip-row">
        <span>速度 Y:</span>
        <span class="tooltip-value">${velocity.y.toFixed(2)}</span>
      </div>
      <div class="tooltip-row">
        <span>速度 Z:</span>
        <span class="tooltip-value">${velocity.z.toFixed(2)}</span>
      </div>
    `;

    element.addEventListener('click', (e) => {
      e.stopPropagation();
      const tooltip = this.tooltips.find((t) => t.id === tooltipId);
      if (tooltip) {
        this.removeTooltip(tooltip);
      }
    });

    this.tooltipContainer.appendChild(element);

    this.tooltips.push({
      id: tooltipId,
      particleIndex,
      element,
      createdAt: Date.now()
    });
  }

  public updateTooltipPosition(particleIndex: number, screenX: number, screenY: number): void {
    const tooltip = this.tooltips.find((t) => t.particleIndex === particleIndex);
    if (tooltip) {
      tooltip.element.style.left = `${screenX + 10}px`;
      tooltip.element.style.top = `${screenY + 10}px`;
    }
  }

  private removeTooltip(tooltip: TooltipData): void {
    tooltip.element.classList.add('closing');
    setTimeout(() => {
      if (tooltip.element.parentNode) {
        tooltip.element.parentNode.removeChild(tooltip.element);
      }
    }, 200);
    this.tooltips = this.tooltips.filter((t) => t.id !== tooltip.id);
  }

  public getActiveTooltipParticles(): number[] {
    return this.tooltips.map((t) => t.particleIndex);
  }

  public clearAllTooltips(): void {
    this.tooltips.forEach((t) => {
      t.element.classList.add('closing');
      setTimeout(() => {
        if (t.element.parentNode) {
          t.element.parentNode.removeChild(t.element);
        }
      }, 200);
    });
    this.tooltips = [];
  }
}

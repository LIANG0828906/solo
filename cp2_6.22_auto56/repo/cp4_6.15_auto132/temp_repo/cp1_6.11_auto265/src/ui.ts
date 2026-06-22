import type { PatternType } from './weaving';

type PatternChangeCallback = (pattern: PatternType) => void;
type CountChangeCallback = (count: number) => void;
type DensityChangeCallback = (density: number) => void;
type ClickCallback = () => void;
type ToggleCallback = (enabled: boolean) => void;

interface Callbacks {
  onPatternChange: PatternChangeCallback | null;
  onWarpCountChange: CountChangeCallback | null;
  onWeftDensityChange: DensityChangeCallback | null;
  onPreviewClick: ClickCallback | null;
  onJumpPatternToggle: ToggleCallback | null;
  onEdgeFinishClick: ClickCallback | null;
  onResetClick: ClickCallback | null;
}

interface Elements {
  toolbarBtns: NodeListOf<HTMLElement>;
  warpCountSlider: HTMLInputElement | null;
  warpCountValue: HTMLElement | null;
  weftDensitySlider: HTMLInputElement | null;
  weftDensityValue: HTMLElement | null;
  jumpPatternToggle: HTMLElement | null;
  previewBtn: HTMLElement | null;
  edgeFinishBtn: HTMLElement | null;
  resetBtn: HTMLElement | null;
  tooltip: HTMLElement | null;
  overlapLabel: HTMLElement | null;
  loading: HTMLElement | null;
  mobileMenuBtn: HTMLElement | null;
  mobileSettingsBtn: HTMLElement | null;
  leftToolbar: HTMLElement | null;
  rightPanel: HTMLElement | null;
}

export class UIManager {
  private container: HTMLElement;
  private callbacks: Callbacks;
  private elements: Elements;
  private isLeftToolbarOpen: boolean = false;
  private isRightPanelOpen: boolean = false;
  private isJumpPatternEnabled: boolean = false;
  private warpSliderTimeout: number | null = null;
  private weftSliderTimeout: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.callbacks = {
      onPatternChange: null,
      onWarpCountChange: null,
      onWeftDensityChange: null,
      onPreviewClick: null,
      onJumpPatternToggle: null,
      onEdgeFinishClick: null,
      onResetClick: null,
    };

    this.elements = {
      toolbarBtns: container.querySelectorAll('.toolbar-btn[data-pattern]'),
      warpCountSlider: container.querySelector('#warp-count'),
      warpCountValue: container.querySelector('#warp-count-value'),
      weftDensitySlider: container.querySelector('#weft-density'),
      weftDensityValue: container.querySelector('#weft-density-value'),
      jumpPatternToggle: container.querySelector('#jump-pattern-toggle'),
      previewBtn: container.querySelector('#preview-btn'),
      edgeFinishBtn: container.querySelector('#edge-finish-btn'),
      resetBtn: container.querySelector('#reset-btn'),
      tooltip: container.querySelector('#tooltip'),
      overlapLabel: container.querySelector('#overlap-label'),
      loading: container.querySelector('#loading'),
      mobileMenuBtn: container.querySelector('#mobile-menu-btn'),
      mobileSettingsBtn: container.querySelector('#mobile-settings-btn'),
      leftToolbar: container.querySelector('#left-toolbar'),
      rightPanel: container.querySelector('#right-panel'),
    };

    this.bindEvents();
    this.setupResponsive();
    this.setupTooltipElements();
  }

  public onPatternChange(callback: PatternChangeCallback): void {
    this.callbacks.onPatternChange = callback;
  }

  public onWarpCountChange(callback: CountChangeCallback): void {
    this.callbacks.onWarpCountChange = callback;
  }

  public onWeftDensityChange(callback: DensityChangeCallback): void {
    this.callbacks.onWeftDensityChange = callback;
  }

  public onPreviewClick(callback: ClickCallback): void {
    this.callbacks.onPreviewClick = callback;
  }

  public onJumpPatternToggle(callback: ToggleCallback): void {
    this.callbacks.onJumpPatternToggle = callback;
  }

  public onEdgeFinishClick(callback: ClickCallback): void {
    this.callbacks.onEdgeFinishClick = callback;
  }

  public onResetClick(callback: ClickCallback): void {
    this.callbacks.onResetClick = callback;
  }

  public showTooltip(text: string, x: number, y: number): void {
    if (!this.elements.tooltip) return;
    this.elements.tooltip.textContent = text;
    this.elements.tooltip.style.left = `${x + 15}px`;
    this.elements.tooltip.style.top = `${y + 15}px`;
    this.elements.tooltip.classList.add('visible');
  }

  public hideTooltip(): void {
    if (!this.elements.tooltip) return;
    this.elements.tooltip.classList.remove('visible');
  }

  public setActivePattern(pattern: PatternType): void {
    this.elements.toolbarBtns.forEach((btn) => {
      const btnPattern = btn.dataset.pattern;
      if (btnPattern === pattern) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  public setWarpCountValue(value: number): void {
    if (this.elements.warpCountValue) {
      this.elements.warpCountValue.textContent = value.toString();
    }
    if (this.elements.warpCountSlider) {
      this.elements.warpCountSlider.value = value.toString();
    }
  }

  public setWeftDensityValue(value: number): void {
    if (this.elements.weftDensityValue) {
      this.elements.weftDensityValue.textContent = value.toFixed(1);
    }
    if (this.elements.weftDensitySlider) {
      this.elements.weftDensitySlider.value = value.toString();
    }
  }

  public setJumpPatternEnabled(enabled: boolean): void {
    this.isJumpPatternEnabled = enabled;
    if (this.elements.jumpPatternToggle) {
      if (enabled) {
        this.elements.jumpPatternToggle.classList.add('active');
      } else {
        this.elements.jumpPatternToggle.classList.remove('active');
      }
    }
  }

  public setHighlight(element: HTMLElement, duration: number = 1200): void {
    element.classList.add('highlight-animation');
    setTimeout(() => {
      element.classList.remove('highlight-animation');
    }, duration);
  }

  public showOverlapLabel(text: string, x: number, y: number): void {
    if (!this.elements.overlapLabel) return;
    this.elements.overlapLabel.textContent = text;
    this.elements.overlapLabel.style.left = `${x}px`;
    this.elements.overlapLabel.style.top = `${y}px`;
    this.elements.overlapLabel.style.display = 'block';
  }

  public hideOverlapLabel(): void {
    if (!this.elements.overlapLabel) return;
    this.elements.overlapLabel.style.display = 'none';
  }

  public hideLoading(): void {
    if (!this.elements.loading) return;
    this.elements.loading.style.display = 'none';
  }

  private bindEvents(): void {
    this.elements.toolbarBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const pattern = btn.dataset.pattern as PatternType;
        if (pattern && this.callbacks.onPatternChange) {
          this.setActivePattern(pattern);
          this.setHighlight(btn);
          this.callbacks.onPatternChange(pattern);
        }
      });
    });

    if (this.elements.warpCountSlider) {
      this.elements.warpCountSlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value, 10);
        this.setWarpCountValue(value);

        if (this.warpSliderTimeout !== null) {
          clearTimeout(this.warpSliderTimeout);
        }
        this.warpSliderTimeout = window.setTimeout(() => {
          if (this.callbacks.onWarpCountChange) {
            this.callbacks.onWarpCountChange(value);
          }
        }, 50);
      });
    }

    if (this.elements.weftDensitySlider) {
      this.elements.weftDensitySlider.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const value = parseFloat(target.value);
        this.setWeftDensityValue(value);

        if (this.weftSliderTimeout !== null) {
          clearTimeout(this.weftSliderTimeout);
        }
        this.weftSliderTimeout = window.setTimeout(() => {
          if (this.callbacks.onWeftDensityChange) {
            this.callbacks.onWeftDensityChange(value);
          }
        }, 50);
      });
    }

    if (this.elements.jumpPatternToggle) {
      this.elements.jumpPatternToggle.addEventListener('click', () => {
        const newState = !this.isJumpPatternEnabled;
        this.setJumpPatternEnabled(newState);
        if (this.callbacks.onJumpPatternToggle) {
          this.callbacks.onJumpPatternToggle(newState);
        }
      });
    }

    if (this.elements.previewBtn) {
      this.elements.previewBtn.addEventListener('click', () => {
        if (this.callbacks.onPreviewClick) {
          this.callbacks.onPreviewClick();
        }
      });
    }

    if (this.elements.edgeFinishBtn) {
      this.elements.edgeFinishBtn.addEventListener('click', () => {
        if (this.callbacks.onEdgeFinishClick) {
          this.callbacks.onEdgeFinishClick();
        }
      });
    }

    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => {
        if (this.callbacks.onResetClick) {
          this.callbacks.onResetClick();
        }
      });
    }

    if (this.elements.mobileMenuBtn) {
      this.elements.mobileMenuBtn.addEventListener('click', () => {
        this.toggleLeftToolbar();
      });
    }

    if (this.elements.mobileSettingsBtn) {
      this.elements.mobileSettingsBtn.addEventListener('click', () => {
        this.toggleRightPanel();
      });
    }
  }

  private setupTooltipElements(): void {
    const tooltipElements = this.container.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach((el) => {
      const element = el as HTMLElement;
      const tooltipText = element.dataset.tooltip;

      element.addEventListener('mouseenter', (e) => {
        const mouseEvent = e as MouseEvent;
        if (tooltipText) {
          this.showTooltip(tooltipText, mouseEvent.clientX, mouseEvent.clientY);
        }
      });

      element.addEventListener('mousemove', (e) => {
        const mouseEvent = e as MouseEvent;
        if (tooltipText) {
          this.showTooltip(tooltipText, mouseEvent.clientX, mouseEvent.clientY);
        }
      });

      element.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  private setupResponsive(): void {
    const mediaQuery1440 = window.matchMedia('(max-width: 1440px)');
    const mediaQuery1024 = window.matchMedia('(max-width: 1024px)');
    const mediaQuery768 = window.matchMedia('(max-width: 768px)');

    const handleResize = () => {
      const width = window.innerWidth;

      if (width <= 1440 && width > 1024) {
        this.applyCollapsedSidebar();
      } else if (width <= 1024 && width > 768) {
        this.applyCollapsedSidebar();
      } else if (width <= 768) {
        this.applyFloatingControls();
      } else {
        this.applyFullLayout();
      }
    };

    mediaQuery1440.addEventListener('change', handleResize);
    mediaQuery1024.addEventListener('change', handleResize);
    mediaQuery768.addEventListener('change', handleResize);

    handleResize();
  }

  private applyFullLayout(): void {
    if (this.elements.leftToolbar) {
      this.elements.leftToolbar.style.display = 'flex';
      this.elements.leftToolbar.style.position = 'fixed';
      this.elements.leftToolbar.style.left = '20px';
      this.elements.leftToolbar.style.top = '50%';
      this.elements.leftToolbar.style.transform = 'translateY(-50%)';
      this.elements.leftToolbar.style.width = '120px';
    }
    if (this.elements.rightPanel) {
      this.elements.rightPanel.style.display = 'flex';
      this.elements.rightPanel.style.position = 'fixed';
      this.elements.rightPanel.style.right = '20px';
      this.elements.rightPanel.style.top = '50%';
      this.elements.rightPanel.style.transform = 'translateY(-50%)';
      this.elements.rightPanel.style.width = '220px';
      this.elements.rightPanel.style.background = 'rgba(34, 34, 34, 0.5)';
    }
    if (this.elements.mobileMenuBtn) {
      this.elements.mobileMenuBtn.style.display = 'none';
    }
    if (this.elements.mobileSettingsBtn) {
      this.elements.mobileSettingsBtn.style.display = 'none';
    }
  }

  private applyCollapsedSidebar(): void {
    if (this.elements.leftToolbar) {
      this.elements.leftToolbar.style.display = 'none';
    }
    if (this.elements.rightPanel) {
      this.elements.rightPanel.style.display = 'none';
    }
    if (this.elements.mobileMenuBtn) {
      this.elements.mobileMenuBtn.style.display = 'flex';
    }
    if (this.elements.mobileSettingsBtn) {
      this.elements.mobileSettingsBtn.style.display = 'flex';
    }
  }

  private applyFloatingControls(): void {
    if (this.elements.leftToolbar) {
      this.elements.leftToolbar.style.display = 'none';
    }
    if (this.elements.rightPanel) {
      this.elements.rightPanel.style.display = 'none';
      this.elements.rightPanel.style.position = 'fixed';
      this.elements.rightPanel.style.right = '15px';
      this.elements.rightPanel.style.top = '110px';
      this.elements.rightPanel.style.transform = 'none';
      this.elements.rightPanel.style.width = '200px';
      this.elements.rightPanel.style.background = 'rgba(46, 46, 46, 0.9)';
    }
    if (this.elements.mobileMenuBtn) {
      this.elements.mobileMenuBtn.style.display = 'flex';
    }
    if (this.elements.mobileSettingsBtn) {
      this.elements.mobileSettingsBtn.style.display = 'flex';
    }
  }

  private toggleLeftToolbar(): void {
    if (!this.elements.leftToolbar) return;

    this.isLeftToolbarOpen = !this.isLeftToolbarOpen;
    if (this.isLeftToolbarOpen) {
      this.elements.leftToolbar.style.display = 'flex';
      this.elements.leftToolbar.style.position = 'fixed';
      this.elements.leftToolbar.style.left = '15px';
      this.elements.leftToolbar.style.top = '110px';
      this.elements.leftToolbar.style.transform = 'none';
      this.elements.leftToolbar.style.width = '100px';
      this.elements.leftToolbar.style.zIndex = '101';
    } else {
      this.elements.leftToolbar.style.display = 'none';
    }
  }

  private toggleRightPanel(): void {
    if (!this.elements.rightPanel) return;

    this.isRightPanelOpen = !this.isRightPanelOpen;
    if (this.isRightPanelOpen) {
      this.elements.rightPanel.style.display = 'flex';
      this.elements.rightPanel.style.zIndex = '101';
    } else {
      this.elements.rightPanel.style.display = 'none';
    }
  }
}

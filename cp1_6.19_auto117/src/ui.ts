import type { LayoutMode } from './buildings';

export interface UICallbacks {
  onBuildingCountChange: (count: number) => void;
  onMaxHeightChange: (height: number) => void;
  onAzimuthChange: (azimuth: number) => void;
  onAltitudeChange: (altitude: number) => void;
  onLayoutChange: (layout: LayoutMode) => void;
  onExportSnapshot: () => void;
  onResetView: () => void;
}

export class UIManager {
  private callbacks: UICallbacks;
  private densitySlider: HTMLInputElement;
  private heightSlider: HTMLInputElement;
  private azimuthSlider: HTMLInputElement;
  private altitudeSlider: HTMLInputElement;
  private densityValue: HTMLElement;
  private heightValue: HTMLElement;
  private azimuthValue: HTMLElement;
  private altitudeValue: HTMLElement;
  private layoutButtons: NodeListOf<HTMLElement>;
  private snapshotBtn: HTMLElement;
  private resetViewBtn: HTMLElement;
  private controlPanel: HTMLElement;
  private isCollapsed: boolean = true;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.densitySlider = document.getElementById('densitySlider') as HTMLInputElement;
    this.heightSlider = document.getElementById('heightSlider') as HTMLInputElement;
    this.azimuthSlider = document.getElementById('azimuthSlider') as HTMLInputElement;
    this.altitudeSlider = document.getElementById('altitudeSlider') as HTMLInputElement;
    this.densityValue = document.getElementById('densityValue') as HTMLElement;
    this.heightValue = document.getElementById('heightValue') as HTMLElement;
    this.azimuthValue = document.getElementById('azimuthValue') as HTMLElement;
    this.altitudeValue = document.getElementById('altitudeValue') as HTMLElement;
    this.layoutButtons = document.querySelectorAll('.layout-btn');
    this.snapshotBtn = document.getElementById('snapshotBtn') as HTMLElement;
    this.resetViewBtn = document.getElementById('resetViewBtn') as HTMLElement;
    this.controlPanel = document.getElementById('controlPanel') as HTMLElement;

    this.bindEvents();
    this.setupPanelCollapse();
  }

  private bindEvents(): void {
    this.densitySlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateValueDisplay(this.densityValue, value);
      this.callbacks.onBuildingCountChange(value);
    });

    this.heightSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateValueDisplay(this.heightValue, value);
      this.callbacks.onMaxHeightChange(value);
    });

    this.azimuthSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateValueDisplay(this.azimuthValue, value);
      this.callbacks.onAzimuthChange(value);
    });

    this.altitudeSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value, 10);
      this.updateValueDisplay(this.altitudeValue, value);
      this.callbacks.onAltitudeChange(value);
    });

    this.layoutButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const layout = btn.getAttribute('data-layout') as LayoutMode;
        if (layout) {
          this.setLayoutActive(layout);
          this.callbacks.onLayoutChange(layout);
        }
      });
    });

    this.snapshotBtn.addEventListener('click', () => {
      this.callbacks.onExportSnapshot();
    });

    this.resetViewBtn.addEventListener('click', () => {
      this.callbacks.onResetView();
    });
  }

  private setupPanelCollapse(): void {
    let hoverTimeout: number | null = null;

    this.controlPanel.addEventListener('mouseenter', () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      this.expandPanel();
    });

    this.controlPanel.addEventListener('mouseleave', () => {
      hoverTimeout = window.setTimeout(() => {
        this.collapsePanel();
      }, 500);
    });

    this.controlPanel.addEventListener('click', (_e) => {
      if (this.isCollapsed) {
        this.expandPanel();
      }
    });
  }

  private expandPanel(): void {
    this.isCollapsed = false;
    this.controlPanel.classList.remove('collapsed');
  }

  private collapsePanel(): void {
    this.isCollapsed = true;
    this.controlPanel.classList.add('collapsed');
  }

  private updateValueDisplay(element: HTMLElement, value: number): void {
    element.textContent = value.toString();
    element.classList.add('pulse');
    setTimeout(() => {
      element.classList.remove('pulse');
    }, 200);
  }

  private setLayoutActive(layout: LayoutMode): void {
    this.layoutButtons.forEach((btn) => {
      if (btn.getAttribute('data-layout') === layout) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  updateBuildingCount(value: number): void {
    this.densitySlider.value = value.toString();
    this.densityValue.textContent = value.toString();
  }

  updateMaxHeight(value: number): void {
    this.heightSlider.value = value.toString();
    this.heightValue.textContent = value.toString();
  }

  updateAzimuth(value: number): void {
    this.azimuthSlider.value = value.toString();
    this.azimuthValue.textContent = value.toString();
  }

  updateAltitude(value: number): void {
    this.altitudeSlider.value = value.toString();
    this.altitudeValue.textContent = value.toString();
  }

  updateLayout(layout: LayoutMode): void {
    this.setLayoutActive(layout);
  }
}

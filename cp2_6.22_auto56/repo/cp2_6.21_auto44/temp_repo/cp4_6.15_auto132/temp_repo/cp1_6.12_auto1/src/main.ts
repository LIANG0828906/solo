import { Earth } from './core/earth';
import { DataLoader, TimeRange, AttackGeoJSON } from './core/data-loader';
import { Heatmap, TooltipData } from './visualization/heatmap';
import { UIPanel, StatsData } from './visualization/ui-panel';

class App {
  private container: HTMLElement;
  private earth: Earth | null = null;
  private dataLoader: DataLoader | null = null;
  private heatmap: Heatmap | null = null;
  private uiPanel: UIPanel | null = null;
  private tooltipEl: HTMLElement | null = null;
  private loadingEl: HTMLElement | null = null;

  private currentTimeRange: TimeRange = '24h';
  private fpsCounter: HTMLElement | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private fpsAccumulator: number = 0;

  constructor() {
    this.container = document.getElementById('canvas-container') as HTMLElement;
    if (!this.container) {
      throw new Error('Canvas container not found');
    }

    this.tooltipEl = document.getElementById('tooltip');
    this.loadingEl = document.getElementById('loading');

    this.init();
  }

  private async init(): Promise<void> {
    this.createFPSCounter();

    this.earth = new Earth({
      container: this.container,
      earthRadius: 2,
      autoRotateSpeed: 0.0008
    });

    this.dataLoader = new DataLoader();

    this.heatmap = new Heatmap({
      earth: this.earth,
      onTooltipShow: (data: TooltipData | null) => this.handleTooltip(data)
    });

    this.uiPanel = new UIPanel({
      container: document.body,
      onTimeRangeChange: (range: TimeRange) => this.handleTimeRangeChange(range),
      onAutoRotateToggle: (enabled: boolean) => this.earth?.setAutoRotate(enabled)
    });

    this.setupRenderLoopHook();

    await this.loadInitialData();

    this.hideLoading();
  }

  private createFPSCounter(): void {
    this.fpsCounter = document.createElement('div');
    this.fpsCounter.className = 'fps-counter';
    this.fpsCounter.textContent = 'FPS: --';
    document.body.appendChild(this.fpsCounter);
  }

  private setupRenderLoopHook(): void {
    if (!this.earth) return;

    this.earth.onRender((delta: number) => {
      this.updateFPS(delta);
    });
  }

  private updateFPS(delta: number): void {
    if (!this.fpsCounter) return;

    this.frameCount++;
    this.fpsAccumulator += delta;

    if (this.fpsAccumulator >= 0.5) {
      const fps = Math.round(this.frameCount / this.fpsAccumulator);
      this.fpsCounter.textContent = `FPS: ${fps}`;

      if (fps >= 58) {
        this.fpsCounter.style.color = '#00ff88';
      } else if (fps >= 50) {
        this.fpsCounter.style.color = '#ffcc00';
      } else {
        this.fpsCounter.style.color = '#ff4466';
      }

      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }
  }

  private async loadInitialData(): Promise<void> {
    if (!this.dataLoader || !this.heatmap || !this.uiPanel) return;

    const geoJSON = this.dataLoader.getGeoJSON(this.currentTimeRange);
    this.heatmap.updateData(geoJSON, false);
    this.updateStatsPanel(geoJSON);

    await new Promise(resolve => setTimeout(resolve, 800));
  }

  private hideLoading(): void {
    if (this.loadingEl) {
      this.loadingEl.classList.add('hidden');
      setTimeout(() => {
        this.loadingEl?.remove();
      }, 1000);
    }
  }

  private handleTimeRangeChange(range: TimeRange): void {
    if (range === this.currentTimeRange) return;

    this.currentTimeRange = range;

    if (this.dataLoader && this.heatmap && this.uiPanel) {
      const geoJSON = this.dataLoader.getGeoJSON(range);
      this.heatmap.updateData(geoJSON, true);
      this.updateStatsPanel(geoJSON);
    }
  }

  private updateStatsPanel(geoJSON: AttackGeoJSON): void {
    if (!this.uiPanel || !this.dataLoader) return;

    const topCountries = this.dataLoader.getTopCountries(this.currentTimeRange, 5);

    const stats: StatsData = {
      totalAttacks: geoJSON.metadata.totalAttacks,
      topCountries,
      minFrequency: geoJSON.metadata.minFrequency,
      maxFrequency: geoJSON.metadata.maxFrequency,
      currentTimeRange: this.currentTimeRange
    };

    this.uiPanel.updateStats(stats);
  }

  private handleTooltip(data: TooltipData | null): void {
    if (!this.tooltipEl) return;

    if (data === null) {
      this.tooltipEl.classList.remove('visible');
      return;
    }

    const attackTypesStr = data.attackTypes.join(', ');
    const barWidth = Math.round(data.normalizedValue * 100);

    this.tooltipEl.innerHTML = `
      <div class="tt-title">${data.country}</div>
      <div class="tt-row">
        <span class="tt-label">Country Code</span>
        <span class="tt-value" style="font-family: Consolas, monospace;">${data.countryCode}</span>
      </div>
      <div class="tt-row">
        <span class="tt-label">Attack Count</span>
        <span class="tt-value">${data.frequency.toLocaleString()}</span>
      </div>
      <div class="tt-row">
        <span class="tt-label">Threat Level</span>
        <span class="tt-value" style="color: ${this.getThreatColor(data.normalizedValue)}">
          ${this.getThreatLabel(data.normalizedValue)}
        </span>
      </div>
      <div class="tt-row" style="display: block;">
        <span class="tt-label">Attack Types</span>
        <div style="margin-top: 4px; font-size: 11px; color: #a8d4e5; line-height: 1.5;">
          ${attackTypesStr}
        </div>
      </div>
      <div class="tt-bar">
        <div class="tt-bar-fill" style="width: ${barWidth}%"></div>
      </div>
    `;

    let x = data.screenX;
    let y = data.screenY;

    const padding = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const tipRect = this.tooltipEl.getBoundingClientRect();
    const tipWidth = tipRect.width || 200;
    const tipHeight = tipRect.height || 140;

    if (x - tipWidth / 2 < padding) {
      x = padding + tipWidth / 2;
    } else if (x + tipWidth / 2 > vw - padding) {
      x = vw - padding - tipWidth / 2;
    }

    if (y - tipHeight - 20 < padding) {
      y = data.screenY + 40;
    }

    this.tooltipEl.style.left = `${x}px`;
    this.tooltipEl.style.top = `${y}px`;
    this.tooltipEl.classList.add('visible');
  }

  private getThreatColor(value: number): string {
    if (value >= 0.75) return '#ff3355';
    if (value >= 0.5) return '#ffcc00';
    if (value >= 0.25) return '#00ffcc';
    return '#00ccff';
  }

  private getThreatLabel(value: number): string {
    if (value >= 0.9) return 'CRITICAL';
    if (value >= 0.75) return 'HIGH';
    if (value >= 0.5) return 'ELEVATED';
    if (value >= 0.25) return 'MODERATE';
    return 'LOW';
  }

  public dispose(): void {
    this.earth?.dispose();
    this.uiPanel?.destroy();
    this.fpsCounter?.remove();
  }
}

let app: App | null = null;

function bootstrap(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      app = new App();
    });
  } else {
    app = new App();
  }
}

bootstrap();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app?.dispose();
  });
}

import { sceneRenderer } from '../RenderModule/sceneRenderer';
import { generatePointCloud, filterByIntensity, exportAsXYZ, type PointCloudData } from '../DataModule/pointCloudLoader';
import { measurementTool, type MeasurementResult } from '../DataModule/measurementTool';

interface ControlPanelOptions {
  container: HTMLElement;
  data: PointCloudData;
}

const CSS = `
.panel {
  width: 100%;
  height: 100%;
  background: rgba(26, 26, 46, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.panel.collapsed {
  height: 56px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 56px;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.panel-toggle {
  display: none;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
}

.panel-body {
  padding: 16px 18px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.slider-group {
  position: relative;
  height: 44px;
  display: flex;
  align-items: center;
}

.slider-track {
  position: absolute;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.slider-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #3f8cff, #8a5cff);
  border-radius: 999px;
}

.slider-input {
  position: absolute;
  width: 100%;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  pointer-events: none;
  height: 6px;
  margin: 0;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #3f8cff;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  transition: transform 0.15s ease;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #3f8cff;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.slider-input.upper::-webkit-slider-thumb {
  border-color: #8a5cff;
}

.slider-input.upper::-moz-range-thumb {
  border-color: #8a5cff;
}

.range-values {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.btn {
  width: 100%;
  padding: 11px 14px;
  background: #2d3561;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  font-family: inherit;
}

.btn:hover {
  transform: scale(1.05);
  background: #3f4a8c;
  box-shadow: 0 4px 14px rgba(63, 74, 140, 0.4);
}

.btn:active {
  transform: translateY(1px) scale(1.02);
}

.btn.active {
  background: #8a5cff;
}

.btn.active:hover {
  background: #a077ff;
}

.result-card {
  background: rgba(63, 74, 140, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.result-value {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.result-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.stats-row {
  display: flex;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  gap: 10px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #3f8cff;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .panel {
    border-left: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .panel-toggle {
    display: inline-flex;
  }
  .panel.collapsed .panel-body {
    display: none;
  }
  .panel:not(.collapsed) {
    height: 100vh;
    position: fixed;
    inset: 0;
    z-index: 100;
    border-radius: 0;
  }
}
`;

class ControlPanel {
  private container!: HTMLElement;
  private data!: PointCloudData;

  private panelEl!: HTMLDivElement;
  private minSlider!: HTMLInputElement;
  private maxSlider!: HTMLInputElement;
  private fillEl!: HTMLDivElement;
  private minLabel!: HTMLSpanElement;
  private maxLabel!: HTMLSpanElement;
  private measureBtn!: HTMLButtonElement;
  private exportBtn!: HTMLButtonElement;
  private resultValue!: HTMLDivElement;
  private resultHint!: HTMLDivElement;
  private fpsEl!: HTMLDivElement;
  private visibleEl!: HTMLDivElement;

  private measureActive = false;

  init(options: ControlPanelOptions): void {
    this.container = options.container;
    this.data = options.data;
    this.build();
    this.bindEvents();
  }

  private build(): void {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.panelEl = document.createElement('div');
    this.panelEl.className = 'panel collapsed';

    this.panelEl.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">点云控制面板</div>
        <button class="panel-toggle" aria-label="切换面板">☰</button>
      </div>
      <div class="panel-body">
        <div>
          <div class="section-label">强度滤镜</div>
          <div class="slider-group">
            <div class="slider-track">
              <div class="slider-fill"></div>
            </div>
            <input class="slider-input lower" type="range" min="0" max="255" value="0" step="1" />
            <input class="slider-input upper" type="range" min="0" max="255" value="255" step="1" />
          </div>
          <div class="range-values">
            <span class="min-label">0</span>
            <span class="max-label">255</span>
          </div>
        </div>
        <div>
          <div class="section-label">测量工具</div>
          <button class="btn measure-btn">开始测量</button>
        </div>
        <div>
          <div class="section-label">数据导出</div>
          <button class="btn export-btn">导出选中</button>
        </div>
        <div>
          <div class="section-label">距离结果</div>
          <div class="result-card">
            <div class="result-title">两点距离</div>
            <div class="result-value">—</div>
            <div class="result-hint">点击"开始测量"后，依次在场景中选取两个点</div>
          </div>
        </div>
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value fps-value">0</div>
            <div class="stat-label">FPS</div>
          </div>
          <div class="stat-item">
            <div class="stat-value visible-value">0</div>
            <div class="stat-label">可见点</div>
          </div>
        </div>
      </div>
    `;

    this.container.appendChild(this.panelEl);

    this.minSlider = this.panelEl.querySelector('.slider-input.lower') as HTMLInputElement;
    this.maxSlider = this.panelEl.querySelector('.slider-input.upper') as HTMLInputElement;
    this.fillEl = this.panelEl.querySelector('.slider-fill') as HTMLDivElement;
    this.minLabel = this.panelEl.querySelector('.min-label') as HTMLSpanElement;
    this.maxLabel = this.panelEl.querySelector('.max-label') as HTMLSpanElement;
    this.measureBtn = this.panelEl.querySelector('.measure-btn') as HTMLButtonElement;
    this.exportBtn = this.panelEl.querySelector('.export-btn') as HTMLButtonElement;
    this.resultValue = this.panelEl.querySelector('.result-value') as HTMLDivElement;
    this.resultHint = this.panelEl.querySelector('.result-hint') as HTMLDivElement;
    this.fpsEl = this.panelEl.querySelector('.fps-value') as HTMLDivElement;
    this.visibleEl = this.panelEl.querySelector('.visible-value') as HTMLDivElement;

    if (window.innerWidth > 768) {
      this.panelEl.classList.remove('collapsed');
    }

    this.updateSliderFill();
  }

  private bindEvents(): void {
    const toggle = this.panelEl.querySelector('.panel-toggle') as HTMLButtonElement;
    toggle.addEventListener('click', () => {
      this.panelEl.classList.toggle('collapsed');
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.panelEl.classList.remove('collapsed');
      } else {
        this.panelEl.classList.add('collapsed');
      }
    });

    const onSliderChange = (): void => {
      let min = parseInt(this.minSlider.value, 10);
      let max = parseInt(this.maxSlider.value, 10);
      if (min > max) {
        [min, max] = [max, min];
      }
      sceneRenderer.applyIntensityFilter(min, max);
      this.minLabel.textContent = String(min);
      this.maxLabel.textContent = String(max);
      this.updateSliderFill();
    };

    this.minSlider.addEventListener('input', onSliderChange);
    this.maxSlider.addEventListener('input', onSliderChange);

    this.measureBtn.addEventListener('click', () => this.toggleMeasureMode());

    this.exportBtn.addEventListener('click', () => {
      const min = parseInt(this.minSlider.value, 10);
      const max = parseInt(this.maxSlider.value, 10);
      const visible = filterByIntensity(this.data, Math.min(min, max), Math.max(min, max));
      exportAsXYZ(this.data, visible);
    });

    measurementTool.onChange((result) => this.updateMeasurement(result));

    sceneRenderer.setFpsCallback((fps, visible) => {
      this.fpsEl.textContent = String(fps);
      this.visibleEl.textContent = String(visible);
    });
  }

  private updateSliderFill(): void {
    const min = parseInt(this.minSlider.value, 10);
    const max = parseInt(this.maxSlider.value, 10);
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    const leftPct = (lo / 255) * 100;
    const rightPct = (hi / 255) * 100;
    this.fillEl.style.left = `${leftPct}%`;
    this.fillEl.style.width = `${rightPct - leftPct}%`;
  }

  private toggleMeasureMode(): void {
    this.measureActive = !this.measureActive;
    if (this.measureActive) {
      measurementTool.startMeasure();
      this.measureBtn.textContent = '取消测量';
      this.measureBtn.classList.add('active');
      this.resultValue.textContent = '—';
      this.resultHint.textContent = '请在场景中点击选取第一个测量点';
    } else {
      this.measureBtn.textContent = '开始测量';
      this.measureBtn.classList.remove('active');
      this.resultHint.textContent = '点击"开始测量"后，依次在场景中选取两个点';
    }
    sceneRenderer.setMeasureMode(this.measureActive);
    sceneRenderer.setControlsEnabled(!this.measureActive);
    window.dispatchEvent(new CustomEvent('measure-mode-changed', { detail: { active: this.measureActive } }));
  }

  private updateMeasurement(result: MeasurementResult): void {
    sceneRenderer.updateMeasureVisuals(result);
    if (result.distance !== null) {
      this.resultValue.textContent = `${result.distance.toFixed(2)} 单位`;
      this.resultHint.textContent = '测量完成，继续点击可重新测量';
    } else if (result.points.length === 1) {
      this.resultValue.textContent = '—';
      this.resultHint.textContent = '已选取第1个点，请点击选取第2个点';
    } else if (this.measureActive) {
      this.resultValue.textContent = '—';
      this.resultHint.textContent = '请在场景中点击选取第一个测量点';
    }
  }

  isMeasureActive(): boolean {
    return this.measureActive;
  }
}

export const controlPanel = new ControlPanel();

import { TerrainStats } from './TerrainRenderer';
import { CameraState } from './InteractionController';

export type UploadCallback = (data: number[][], stats: TerrainStats) => void;

export class UIOverlay {
  private container: HTMLElement;
  private uploadZone: HTMLDivElement | null = null;
  private infoPanel: HTMLDivElement | null = null;
  private statePanel: HTMLDivElement | null = null;
  private statsPanel: HTMLDivElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private onUploadCallback: UploadCallback | null = null;
  private statsAnimatedValues = { min: 0, max: 0, avg: 0 };

  constructor(container: HTMLElement) {
    this.container = container;
    this.createInfoPanel();
    this.createUploadZone();
    this.createStatePanel();
    this.createStatsPanel();
    this.setupWindowResize();
  }

  setOnUpload(callback: UploadCallback): void {
    this.onUploadCallback = callback;
  }

  private createInfoPanel(): void {
    this.infoPanel = document.createElement('div');
    this.infoPanel.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      padding: 16px 20px;
      background: rgba(22, 33, 62, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 255, 255, 0.15);
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.1), 0 4px 15px rgba(0, 0, 0, 0.4);
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100;
      max-width: 260px;
    `;

    const fontSize = Math.max(12, Math.min(14, window.innerWidth / 140));

    this.infoPanel.innerHTML = `
      <div style="font-size: ${fontSize + 2}px; font-weight: 600; margin-bottom: 12px; color: #00ffff; letter-spacing: 0.5px;">操作指南</div>
      <div style="font-size: ${fontSize}px; line-height: 1.8; color: #ddd;">
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <span style="display: inline-block; width: 20px; height: 20px; background: rgba(0, 255, 255, 0.2); border-radius: 4px; margin-right: 10px; text-align: center; line-height: 20px; font-size: 10px; color: #00ffff;">↻</span>
          <span>左键拖拽 &nbsp;旋转视角</span>
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <span style="display: inline-block; width: 20px; height: 20px; background: rgba(0, 255, 255, 0.2); border-radius: 4px; margin-right: 10px; text-align: center; line-height: 20px; font-size: 10px; color: #00ffff;">⇔</span>
          <span>右键拖拽 &nbsp;平移视图</span>
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <span style="display: inline-block; width: 20px; height: 20px; background: rgba(0, 255, 255, 0.2); border-radius: 4px; margin-right: 10px; text-align: center; line-height: 20px; font-size: 10px; color: #00ffff;">⊙</span>
          <span>滚轮 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;缩放视角</span>
        </div>
        <div style="display: flex; align-items: center; margin: 4px 0;">
          <span style="display: inline-block; width: 20px; height: 20px; background: rgba(0, 255, 255, 0.2); border-radius: 4px; margin-right: 10px; text-align: center; line-height: 20px; font-size: 10px; color: #00ffff;">✦</span>
          <span>点击地形 &nbsp;查看数据</span>
        </div>
      </div>
    `;

    this.container.appendChild(this.infoPanel);
    requestAnimationFrame(() => {
      if (this.infoPanel) this.infoPanel.style.opacity = '1';
    });
  }

  private createUploadZone(): void {
    this.uploadZone = document.createElement('div');
    this.uploadZone.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 240px;
      padding: 20px;
      background: rgba(22, 33, 62, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 2px dashed rgba(255, 255, 255, 0.25);
      border-radius: 12px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      cursor: pointer;
      text-align: center;
      opacity: 0;
      transition: opacity 0.3s ease, border-color 0.2s ease, background 0.2s ease;
      z-index: 100;
    `;

    this.uploadZone.innerHTML = `
      <div style="font-size: 32px; margin-bottom: 8px; color: rgba(255, 255, 255, 0.5);">+</div>
      <div style="font-size: 13px; margin-bottom: 4px; color: #ddd;">拖入 CSV 文件</div>
      <div style="font-size: 11px; color: rgba(255, 255, 255, 0.4);">或点击选择文件</div>
    `;

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.csv';
    this.fileInput.style.display = 'none';

    this.uploadZone.appendChild(this.fileInput);
    this.container.appendChild(this.uploadZone);

    requestAnimationFrame(() => {
      if (this.uploadZone) this.uploadZone.style.opacity = '1';
    });

    this.setupUploadEvents();
  }

  private createStatePanel(): void {
    this.statePanel = document.createElement('div');
    this.statePanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      padding: 14px 18px;
      background: rgba(22, 33, 62, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 255, 255, 0.15);
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.08), 0 4px 15px rgba(0, 0, 0, 0.4);
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100;
      min-width: 160px;
    `;

    this.statePanel.innerHTML = `
      <div style="font-size: 11px; color: #00ffff; margin-bottom: 8px; letter-spacing: 1px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">视角状态</div>
      <div style="display: flex; justify-content: space-between; margin: 4px 0;">
        <span style="color: #888;">俯仰角:</span>
        <span id="cam-pitch" style="color: #fff;">45.0°</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 4px 0;">
        <span style="color: #888;">方位角:</span>
        <span id="cam-azimuth" style="color: #fff;">45.0°</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 4px 0;">
        <span style="color: #888;">缩放:</span>
        <span id="cam-zoom" style="color: #fff;">1.00x</span>
      </div>
    `;

    this.container.appendChild(this.statePanel);
    requestAnimationFrame(() => {
      if (this.statePanel) this.statePanel.style.opacity = '1';
    });
  }

  private createStatsPanel(): void {
    this.statsPanel = document.createElement('div');
    this.statsPanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: rgba(22, 33, 62, 0.6);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 255, 255, 0.15);
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.08), 0 4px 15px rgba(0, 0, 0, 0.4);
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100;
      display: none;
    `;

    this.statsPanel.innerHTML = `
      <div style="display: flex; gap: 28px; align-items: center;">
        <div>
          <div style="font-size: 10px; color: #888; margin-bottom: 2px;">网格</div>
          <div id="stat-grid" style="color: #fff;">-</div>
        </div>
        <div style="width: 1px; height: 28px; background: rgba(255,255,255,0.1);"></div>
        <div>
          <div style="font-size: 10px; color: #888; margin-bottom: 2px;">最小值</div>
          <div id="stat-min" style="color: #4ade80;">-</div>
        </div>
        <div style="width: 1px; height: 28px; background: rgba(255,255,255,0.1);"></div>
        <div>
          <div style="font-size: 10px; color: #888; margin-bottom: 2px;">最大值</div>
          <div id="stat-max" style="color: #f87171;">-</div>
        </div>
        <div style="width: 1px; height: 28px; background: rgba(255,255,255,0.1);"></div>
        <div>
          <div style="font-size: 10px; color: #888; margin-bottom: 2px;">平均值</div>
          <div id="stat-avg" style="color: #fbbf24;">-</div>
        </div>
      </div>
    `;

    this.container.appendChild(this.statsPanel);
  }

  private setupUploadEvents(): void {
    if (!this.uploadZone || !this.fileInput) return;

    this.uploadZone.addEventListener('click', () => this.fileInput?.click());
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.handleFile(target.files[0]);
      }
    });

    this.uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.uploadZone) {
        this.uploadZone.style.borderColor = '#00ffff';
        this.uploadZone.style.borderStyle = 'solid';
        this.uploadZone.style.background = 'rgba(0, 255, 255, 0.1)';
      }
    });

    this.uploadZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.uploadZone) {
        this.uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        this.uploadZone.style.borderStyle = 'dashed';
        this.uploadZone.style.background = 'rgba(22, 33, 62, 0.6)';
      }
    });

    this.uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.uploadZone) {
        this.uploadZone.style.borderColor = 'rgba(255, 255, 255, 0.25)';
        this.uploadZone.style.borderStyle = 'dashed';
        this.uploadZone.style.background = 'rgba(22, 33, 62, 0.6)';
      }
      if (e.dataTransfer.files.length > 0) {
        this.handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  private setupWindowResize(): void {
    window.addEventListener('resize', () => {
      if (this.infoPanel) {
        const fontSize = Math.max(12, Math.min(14, window.innerWidth / 140));
        const title = this.infoPanel.children[0] as HTMLElement;
        if (title) title.style.fontSize = (fontSize + 2) + 'px';
        const body = this.infoPanel.children[1] as HTMLElement;
        if (body) body.style.fontSize = fontSize + 'px';
      }
    });
  }

  private async handleFile(file: File): Promise<void> {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('请上传 CSV 格式的文件');
      return;
    }

    if (this.uploadZone) {
      this.uploadZone.innerHTML = `
        <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
        <div style="font-size: 13px; color: #ddd;">正在解析文件...</div>
      `;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      this.updateStatsDisplay(result);
      if (this.onUploadCallback) {
        this.onUploadCallback(result.data, {
          rows: result.rows,
          cols: result.cols,
          min: result.min,
          max: result.max,
          avg: result.avg
        });
      }

      if (this.uploadZone) {
        this.uploadZone.innerHTML = `
          <div style="font-size: 28px; margin-bottom: 4px; color: #4ade80;">✓</div>
          <div style="font-size: 13px; color: #4ade80; margin-bottom: 4px;">上传成功</div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.4);">点击或拖入新文件重新上传</div>
        `;
        setTimeout(() => {
          if (this.uploadZone) {
            this.uploadZone.innerHTML = `
              <div style="font-size: 32px; margin-bottom: 8px; color: rgba(255, 255, 255, 0.5);">+</div>
              <div style="font-size: 13px; margin-bottom: 4px; color: #ddd;">拖入 CSV 文件</div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.4);">或点击选择文件</div>
            `;
            if (this.fileInput) this.uploadZone.appendChild(this.fileInput);
          }
        }, 2000);
      }
    } catch (err) {
      if (this.uploadZone) {
        this.uploadZone.innerHTML = `
          <div style="font-size: 28px; margin-bottom: 4px; color: #f87171;">✕</div>
          <div style="font-size: 13px; color: #f87171; margin-bottom: 4px;">上传失败</div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.4);">请重试</div>
        `;
        setTimeout(() => {
          if (this.uploadZone) {
            this.uploadZone.innerHTML = `
              <div style="font-size: 32px; margin-bottom: 8px; color: rgba(255, 255, 255, 0.5);">+</div>
              <div style="font-size: 13px; margin-bottom: 4px; color: #ddd;">拖入 CSV 文件</div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.4);">或点击选择文件</div>
            `;
            if (this.fileInput) this.uploadZone.appendChild(this.fileInput);
          }
        }, 2000);
      }
    }
  }

  private updateStatsDisplay(stats: TerrainStats): void {
    if (!this.statsPanel) return;

    this.statsPanel.style.display = 'block';
    requestAnimationFrame(() => {
      if (this.statsPanel) this.statsPanel.style.opacity = '1';
    });

    const gridEl = document.getElementById('stat-grid');
    if (gridEl) gridEl.textContent = `${stats.cols} × ${stats.rows}`;

    this.animateNumber('stat-min', this.statsAnimatedValues.min, stats.min, 4);
    this.animateNumber('stat-max', this.statsAnimatedValues.max, stats.max, 4);
    this.animateNumber('stat-avg', this.statsAnimatedValues.avg, stats.avg, 4);
    this.statsAnimatedValues.min = stats.min;
    this.statsAnimatedValues.max = stats.max;
    this.statsAnimatedValues.avg = stats.avg;
  }

  private animateNumber(elementId: string, from: number, to: number, decimals: number): void {
    const el = document.getElementById(elementId);
    if (!el) return;

    const duration = 1000;
    const startTime = performance.now();

    const animate = (time: number) => {
      const t = Math.min(1, (time - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      el.textContent = value.toFixed(decimals);
      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  updateCameraState(state: CameraState): void {
    const pitchEl = document.getElementById('cam-pitch');
    const azimuthEl = document.getElementById('cam-azimuth');
    const zoomEl = document.getElementById('cam-zoom');

    if (pitchEl) pitchEl.textContent = state.pitch.toFixed(1) + '°';
    if (azimuthEl) azimuthEl.textContent = state.azimuth.toFixed(1) + '°';
    if (zoomEl) zoomEl.textContent = state.zoom.toFixed(2) + 'x';
  }

  async loadSampleData(): Promise<void> {
    try {
      const response = await fetch('/api/sample');
      const result = await response.json();
      this.updateStatsDisplay(result);
      if (this.onUploadCallback) {
        this.onUploadCallback(result.data, {
          rows: result.rows,
          cols: result.cols,
          min: result.min,
          max: result.max,
          avg: result.avg
        });
      }
    } catch (err) {
      console.error('Failed to load sample data:', err);
    }
  }
}

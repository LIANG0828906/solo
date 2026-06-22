import { renderScene, renderToThumbnail, renderWithWatermark, exportToPNG, WALL_COLOR_NAMES } from './renderer';
import type { RenderParams, Scheme, ViewMode } from './renderer';
import { UIPanel, createSchemeControls, injectStyles, type UIState } from './ui';

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private uiPanel: UIPanel;
  private currentState: UIState;
  private schemes: Scheme[] = [];
  private animFrameId: number = 0;
  private renderParams: RenderParams | null = null;
  private lastRenderTime = 0;
  private needsRender = true;
  private prevTimeState: { hour: number; minute: number } | null = null;
  private timeTransitionStart = 0;
  private timeTransitionDuration = 500;
  private timeTransitioning = false;

  constructor() {
    const app = document.getElementById('app')!;
    app.innerHTML = '';
    app.style.display = 'flex';
    app.style.width = '100%';
    app.style.height = '100vh';

    injectStyles();

    this.uiPanel = new UIPanel(app, (state) => this.onStateChange(state));
    this.currentState = this.uiPanel.getState();

    const renderArea = document.createElement('div');
    renderArea.className = 'render-area';
    renderArea.style.cssText = 'flex:1;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;';

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'display:block;';
    renderArea.appendChild(this.canvas);

    app.appendChild(renderArea);

    const ctx = this.canvas.getContext('2d')!;
    this.ctx = ctx;

    createSchemeControls(
      renderArea,
      this.currentState,
      (state) => this.saveScheme(state),
      () => this.showCompare(),
      () => this.doExport(),
    );

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.startRenderLoop();
  }

  private resizeCanvas(): void {
    const parent = this.canvas.parentElement!;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.needsRender = true;
  }

  private onStateChange(state: UIState): void {
    const prev = this.currentState;
    this.currentState = state;

    if (prev.light.timeHour !== state.light.timeHour ||
        prev.light.timeMinute !== state.light.timeMinute) {
      this.prevTimeState = { hour: prev.light.timeHour, minute: prev.light.timeMinute };
      this.timeTransitionStart = performance.now();
      this.timeTransitioning = true;
    }

    this.needsRender = true;
  }

  private startRenderLoop(): void {
    const loop = (timestamp: number) => {
      this.animFrameId = requestAnimationFrame(loop);

      if (this.timeTransitioning && this.prevTimeState) {
        const elapsed = timestamp - this.timeTransitionStart;
        const t = Math.min(1, elapsed / this.timeTransitionDuration);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const prevTotal = this.prevTimeState.hour * 60 + this.prevTimeState.minute;
        const currTotal = this.currentState.light.timeHour * 60 + this.currentState.light.timeMinute;
        const interpTotal = prevTotal + (currTotal - prevTotal) * eased;
        const interpHour = Math.floor(interpTotal / 60);
        const interpMinute = Math.round((interpTotal % 60) / 15) * 15;

        this.renderParams = {
          room: this.currentState.room,
          light: {
            timeHour: interpHour,
            timeMinute: interpMinute % 60,
            windows: this.currentState.light.windows,
          },
          viewMode: this.currentState.viewMode,
          canvasWidth: parseInt(this.canvas.style.width),
          canvasHeight: parseInt(this.canvas.style.height),
        };

        this.doRender();

        if (t >= 1) {
          this.timeTransitioning = false;
          this.prevTimeState = null;
        }
        this.needsRender = false;
        return;
      }

      if (!this.needsRender) return;
      if (timestamp - this.lastRenderTime < 16) return;

      this.needsRender = false;
      this.lastRenderTime = timestamp;

      const cw = parseInt(this.canvas.style.width);
      const ch = parseInt(this.canvas.style.height);

      this.renderParams = {
        room: this.currentState.room,
        light: this.currentState.light,
        viewMode: this.currentState.viewMode,
        canvasWidth: cw,
        canvasHeight: ch,
      };

      this.doRender();
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private doRender(): void {
    if (!this.renderParams) return;
    renderScene(this.ctx, this.renderParams);
  }

  private saveScheme(state: UIState): void {
    if (this.schemes.length >= 4) {
      this.schemes.shift();
    }

    const thumbW = 320;
    const thumbH = 200;
    const params: RenderParams = {
      room: state.room,
      light: state.light,
      viewMode: state.viewMode,
      canvasWidth: thumbW,
      canvasHeight: thumbH,
    };
    const thumbnail = renderToThumbnail(params, thumbW, thumbH);

    const scheme: Scheme = {
      id: 's' + Date.now(),
      label: `方案 ${this.schemes.length + 1}`,
      room: { ...state.room },
      light: { ...state.light, windows: state.light.windows.map(w => ({ ...w })) },
      thumbnail,
    };

    this.schemes.push(scheme);
    this.showSaveToast(scheme.label);
  }

  private showSaveToast(label: string): void {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#4A90D9;color:white;padding:10px 20px;border-radius:8px;font-size:13px;z-index:300;animation:fadeIn 0.3s ease;';
    toast.textContent = `${label}已保存`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 1500);
  }

  private showCompare(): void {
    if (this.schemes.length === 0) {
      this.showSaveToast('请先保存方案');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'compare-overlay';

    const header = document.createElement('div');
    header.className = 'compare-header';

    const title = document.createElement('h2');
    title.textContent = '方案对比';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 300);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    overlay.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'compare-grid';

    for (let i = 0; i < 4; i++) {
      const scheme = this.schemes[i];
      const cell = document.createElement('div');
      cell.className = 'compare-cell';

      if (!scheme) {
        cell.style.background = '#222';
        cell.style.display = 'flex';
        cell.style.alignItems = 'center';
        cell.style.justifyContent = 'center';
        cell.innerHTML = '<span style="color:#555;font-size:14px;">空</span>';
        grid.appendChild(cell);
        continue;
      }

      const cellHeader = document.createElement('div');
      cellHeader.className = 'compare-cell-header';

      const label = document.createElement('div');
      label.className = 'compare-cell-label';
      label.textContent = scheme.label;

      const summary = document.createElement('div');
      summary.className = 'compare-cell-summary';
      summary.textContent = `${scheme.room.length}m×${scheme.room.width}m | ${WALL_COLOR_NAMES[scheme.room.wallColorIndex]} | ${scheme.light.timeHour}:${String(scheme.light.timeMinute).padStart(2, '0')}`;

      cellHeader.appendChild(label);
      cellHeader.appendChild(summary);

      const canvasArea = document.createElement('div');
      canvasArea.className = 'compare-cell-canvas';

      const img = document.createElement('img');
      img.src = scheme.thumbnail;
      img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
      canvasArea.appendChild(img);

      cell.appendChild(cellHeader);
      cell.appendChild(canvasArea);

      cell.addEventListener('click', () => {
        this.showFullscreen(scheme);
      });

      grid.appendChild(cell);
    }

    overlay.appendChild(grid);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 300);
      }
    });
  }

  private showFullscreen(scheme: Scheme): void {
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';

    const cw = Math.min(window.innerWidth * 0.9, 1200);
    const ch = Math.min(window.innerHeight * 0.9, 800);

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';

    const ctx = canvas.getContext('2d')!;
    const params: RenderParams = {
      room: scheme.room,
      light: scheme.light,
      viewMode: 'perspective',
      canvasWidth: cw,
      canvasHeight: ch,
    };
    renderWithWatermark(ctx, params);

    overlay.appendChild(canvas);

    overlay.addEventListener('click', () => {
      overlay.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => overlay.remove(), 300);
    });

    document.body.appendChild(overlay);
  }

  private doExport(): void {
    const cw = parseInt(this.canvas.style.width) * 2;
    const ch = parseInt(this.canvas.style.height) * 2;

    const params: RenderParams = {
      room: this.currentState.room,
      light: this.currentState.light,
      viewMode: this.currentState.viewMode,
      canvasWidth: cw,
      canvasHeight: ch,
    };

    exportToPNG(params, cw, ch);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});

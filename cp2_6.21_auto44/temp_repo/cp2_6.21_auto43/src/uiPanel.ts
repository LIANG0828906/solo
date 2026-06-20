import {
  CognitiveStatus,
  STATUS_COLORS,
  useStatusStore,
} from './statusStore';

interface StatusButtonDef {
  key: CognitiveStatus;
  label: string;
  sub: string;
}

const BUTTONS: StatusButtonDef[] = [
  { key: 'focus',   label: '专注', sub: 'Focus'   },
  { key: 'relax',   label: '放松', sub: 'Relax'   },
  { key: 'sleep',   label: '睡眠', sub: 'Sleep'   },
  { key: 'excited', label: '兴奋', sub: 'Excited' },
];

export interface ScreenshotHandler {
  (): Promise<string>;
}

export class UIPanel {
  private root: HTMLElement;
  private container: HTMLElement;
  private titleEl: HTMLElement;
  private screenshotBtn: HTMLButtonElement;
  private timelineWrap: HTMLElement;
  private timelineSlider: HTMLInputElement;
  private timelineLabel: HTMLElement;
  private buttonGroup: HTMLElement;
  private buttons: Map<CognitiveStatus, HTMLButtonElement>;
  private flashLayer: HTMLElement;
  private styleEl: HTMLStyleElement;
  private screenshotHandler: ScreenshotHandler | null;
  private unsubscribers: Array<() => void>;

  constructor(appRoot: HTMLElement) {
    this.root = appRoot;
    this.buttons = new Map();
    this.screenshotHandler = null;
    this.unsubscribers = [];

    this.styleEl = this.injectStyles();
    this.container = document.createElement('div');
    this.container.className = 'nw-ui-layer';
    this.container.style.cssText = `
      position: fixed; inset: 0; pointer-events: none; z-index: 10;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    `;

    this.titleEl = this.createTitle();
    this.screenshotBtn = this.createScreenshotButton();
    this.timelineWrap = this.createTimeline();
    this.timelineSlider = this.timelineWrap.querySelector('.nw-slider') as HTMLInputElement;
    this.timelineLabel = this.timelineWrap.querySelector('.nw-timeline-label') as HTMLElement;
    this.buttonGroup = this.createButtonGroup();
    this.flashLayer = this.createFlashLayer();

    this.container.appendChild(this.titleEl);
    this.container.appendChild(this.screenshotBtn);
    this.container.appendChild(this.timelineWrap);
    this.container.appendChild(this.buttonGroup);
    this.container.appendChild(this.flashLayer);

    this.root.parentElement?.appendChild(this.container);

    this.bindStoreSubscriptions();
  }

  private injectStyles(): HTMLStyleElement {
    const css = `
      .nw-ui-layer button, .nw-ui-layer input { pointer-events: auto; }

      .nw-title {
        position: absolute; top: 28px; left: 32px;
        font-size: 30px; font-weight: 200; letter-spacing: 4px;
        color: transparent;
        -webkit-text-stroke: 1px #ffffff;
        text-shadow:
          0 0 8px rgba(0, 187, 255, 0.9),
          0 0 16px rgba(0, 187, 255, 0.55),
          0 0 32px rgba(0, 187, 255, 0.3);
        user-select: none;
        font-style: italic;
      }
      .nw-title::after {
        content: "3D EEG VISUALIZER";
        display: block;
        font-size: 10px;
        letter-spacing: 5px;
        font-weight: 300;
        margin-top: 6px;
        -webkit-text-stroke: 0;
        color: rgba(0, 187, 255, 0.7);
        text-shadow: 0 0 4px rgba(0, 187, 255, 0.5);
        font-style: normal;
      }

      .nw-screenshot-btn {
        position: absolute; top: 24px; right: 28px;
        width: 40px; height: 40px; border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.25);
        background: rgba(255,255,255,0.06);
        backdrop-filter: blur(6px);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.25s ease;
        overflow: hidden;
        box-shadow: 0 0 0 rgba(0,187,255,0);
      }
      .nw-screenshot-btn:hover {
        background: rgba(0,187,255,0.18);
        border-color: #00bbff;
        box-shadow: 0 0 18px rgba(0,187,255,0.5);
        transform: scale(1.08);
      }
      .nw-screenshot-btn svg { width: 20px; height: 20px; stroke: #fff; fill: none; stroke-width: 1.6; }
      .nw-screenshot-btn:hover svg { stroke: #80e0ff; filter: drop-shadow(0 0 3px #00bbff); }

      .nw-screenshot-btn.is-shooting { animation: nw-shoot 0.35s ease; }
      @keyframes nw-shoot {
        0%   { transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }
        40%  { transform: scale(1.22); box-shadow: 0 0 32px rgba(255,255,255,0.9); background: rgba(255,255,255,0.5); }
        100% { transform: scale(1); box-shadow: 0 0 0 rgba(255,255,255,0); }
      }

      .nw-flash {
        position: absolute; inset: 0;
        background: #ffffff;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease-out;
      }
      .nw-flash.active { opacity: 0.85; transition: opacity 0.08s ease-in; }

      .nw-timeline {
        position: absolute;
        left: 50%; bottom: 130px; transform: translateX(-50%);
        width: 400px;
        display: flex; flex-direction: column; align-items: center; gap: 8px;
      }
      .nw-timeline-label {
        color: rgba(200, 220, 255, 0.7);
        font-size: 11px; letter-spacing: 2px; font-weight: 300;
        display: flex; justify-content: space-between; width: 100%;
        padding: 0 4px; box-sizing: border-box;
      }
      .nw-timeline-label .nw-cur {
        color: #00e0ff;
        text-shadow: 0 0 6px rgba(0,200,255,0.8);
        font-variant-numeric: tabular-nums;
      }

      .nw-slider {
        -webkit-appearance: none; appearance: none;
        width: 100%; height: 6px; border-radius: 3px; outline: none;
        background: linear-gradient(90deg, #0099ff 0%, #aa00ff 100%);
        box-shadow: 0 0 12px rgba(0,150,255,0.55), inset 0 0 4px rgba(255,255,255,0.2);
        cursor: pointer;
      }
      .nw-slider::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none;
        width: 20px; height: 20px; border-radius: 50%;
        background: radial-gradient(circle, #ffffff 30%, #cfefff 70%, transparent 100%);
        border: 2px solid #ffffff;
        cursor: pointer;
        box-shadow: 0 0 0 rgba(0,200,255,0);
        transition: box-shadow 0.2s ease, transform 0.2s ease;
      }
      .nw-slider:hover::-webkit-slider-thumb,
      .nw-slider:active::-webkit-slider-thumb {
        box-shadow: 0 0 18px rgba(120, 220, 255, 1), 0 0 36px rgba(120, 220, 255, 0.5);
        transform: scale(1.18);
      }
      .nw-slider::-moz-range-thumb {
        width: 20px; height: 20px; border-radius: 50%;
        background: #fff; border: 2px solid #fff; cursor: pointer;
        box-shadow: 0 0 18px rgba(120, 220, 255, 1);
      }

      .nw-buttons {
        position: absolute;
        left: 50%; bottom: 42px; transform: translateX(-50%);
        display: flex;
        gap: 30px;
      }
      .nw-status-btn {
        width: 80px; height: 36px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.18);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.65);
        cursor: pointer;
        font-size: 13px; letter-spacing: 1px;
        font-weight: 300;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        line-height: 1.1;
        backdrop-filter: blur(4px);
        transition: all 0.35s ease;
        position: relative; overflow: hidden;
        user-select: none;
      }
      .nw-status-btn .nw-sub {
        font-size: 9px; letter-spacing: 1.5px; opacity: 0.6;
        font-weight: 200; margin-top: 2px;
      }
      .nw-status-btn:hover {
        background: rgba(255,255,255,0.14);
        color: #fff;
        border-color: rgba(255,255,255,0.45);
        transform: translateY(-2px);
      }
      .nw-status-btn::before {
        content: ""; position: absolute; inset: 0;
        border-radius: inherit;
        background: var(--nw-color, #fff);
        opacity: 0;
        transition: opacity 0.35s ease;
      }
      .nw-status-btn span { position: relative; z-index: 1; }
      .nw-status-btn.is-active {
        color: #fff;
        border-color: var(--nw-color, #fff);
        box-shadow:
          0 0 16px color-mix(in srgb, var(--nw-color, #fff) 70%, transparent),
          inset 0 0 10px color-mix(in srgb, var(--nw-color, #fff) 30%, transparent);
        animation: nw-pulse 1.8s ease-in-out infinite;
      }
      .nw-status-btn.is-active::before { opacity: 0.9; }
      .nw-status-btn.is-active .nw-sub { opacity: 0.85; }

      @keyframes nw-pulse {
        0%, 100% { transform: scale(1); }
        50%      { transform: scale(1.15); }
      }

      @media (max-width: 1200px) and (min-width: 769px) {
        .nw-buttons { gap: 15px; bottom: 36px; }
        .nw-timeline { width: 350px; bottom: 118px; }
      }
      @media (max-width: 768px) {
        .nw-buttons {
          gap: 12px;
          bottom: 28px;
          display: grid;
          grid-template-columns: repeat(2, 80px);
          justify-content: center;
        }
        .nw-timeline { width: 280px; bottom: 180px; }
        .nw-title { font-size: 22px; top: 18px; left: 20px; letter-spacing: 2px; }
        .nw-screenshot-btn { top: 16px; right: 18px; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    return style;
  }

  private createTitle(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'nw-title';
    el.textContent = 'NeuroWave';
    return el;
  }

  private createScreenshotButton(): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'nw-screenshot-btn';
    btn.title = '截取当前画面 (1000×1000 PNG)';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"/>
        <circle cx="12" cy="13" r="4"/>
        <circle cx="7.5" cy="7" r="0.8" fill="#fff"/>
      </svg>
    `;
    btn.addEventListener('click', () => this.handleScreenshotClick());
    return btn;
  }

  private createTimeline(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'nw-timeline';
    wrap.innerHTML = `
      <div class="nw-timeline-label">
        <span>TIMELINE</span>
        <span class="nw-cur">0.0 s / 60.0 s</span>
      </div>
      <input type="range" class="nw-slider" min="0" max="120" step="1" value="0" />
    `;
    const slider = wrap.querySelector('.nw-slider') as HTMLInputElement;
    let isDragging = false;

    slider.addEventListener('pointerdown', () => { isDragging = true; });
    slider.addEventListener('pointerup', () => { isDragging = false; });
    slider.addEventListener('pointerleave', () => { isDragging = false; });
    slider.addEventListener('input', () => {
      const frame = parseInt(slider.value, 10);
      useStatusStore.getState().seekFrame(frame);
      this.updateTimelineLabel(useStatusStore.getState().timelineProgress);
    });

    Object.defineProperty(this, '_timelineDragging', {
      get: () => isDragging,
      set: (v: boolean) => { isDragging = v; },
      configurable: true,
    });

    return wrap;
  }

  private createButtonGroup(): HTMLElement {
    const group = document.createElement('div');
    group.className = 'nw-buttons';

    BUTTONS.forEach((def) => {
      const color = STATUS_COLORS[def.key];
      const btn = document.createElement('button');
      btn.className = 'nw-status-btn';
      btn.style.setProperty('--nw-color', color);
      btn.innerHTML = `
        <span>${def.label}</span>
        <span class="nw-sub">${def.sub}</span>
      `;
      btn.addEventListener('click', () => {
        useStatusStore.getState().setStatus(def.key);
      });
      this.buttons.set(def.key, btn);
      group.appendChild(btn);
    });

    return group;
  }

  private createFlashLayer(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'nw-flash';
    return el;
  }

  public setScreenshotHandler(handler: ScreenshotHandler): void {
    this.screenshotHandler = handler;
  }

  private async handleScreenshotClick(): Promise<void> {
    this.screenshotBtn.classList.add('is-shooting');
    this.flashLayer.classList.add('active');

    await new Promise((r) => setTimeout(r, 90));
    this.flashLayer.classList.remove('active');

    try {
      if (this.screenshotHandler) {
        const dataUrl = await this.screenshotHandler();
        useStatusStore.getState().pushScreenshot(dataUrl);
        this.triggerDownload(dataUrl);
      }
    } finally {
      setTimeout(() => this.screenshotBtn.classList.remove('is-shooting'), 380);
    }
  }

  private triggerDownload(dataUrl: string): void {
    const a = document.createElement('a');
    const stamp = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const name = `neurrowave-${stamp.getFullYear()}${pad(stamp.getMonth() + 1)}${pad(stamp.getDate())}-${pad(stamp.getHours())}${pad(stamp.getMinutes())}${pad(stamp.getSeconds())}.png`;
    a.href = dataUrl;
    a.download = name;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 0);
  }

  private updateTimelineLabel(seconds: number): void {
    const safeSeconds = typeof seconds === 'number' ? seconds : Number(seconds) || 0;
    const cur = safeSeconds.toFixed(1);
    this.timelineLabel.innerHTML = `<span>TIMELINE</span><span class="nw-cur">${cur} s / 60.0 s</span>`;
  }

  private syncSliderFromProgress(seconds: number): void {
    const safeSeconds = typeof seconds === 'number' ? seconds : Number(seconds) || 0;
    const dragging = (this as unknown as { _timelineDragging: boolean })._timelineDragging;
    if (dragging) return;
    const frame = Math.round((safeSeconds / 60) * 120);
    const history = useStatusStore.getState().history.length;
    const max = history > 0 ? Math.min(119, history - 1) : 119;
    const clamped = Math.max(0, Math.min(max, frame));
    if (parseInt(this.timelineSlider.value, 10) !== clamped) {
      this.timelineSlider.value = String(clamped);
    }
  }

  private bindStoreSubscriptions(): void {
    const initialState = useStatusStore.getState();
    let lastStatus = initialState.currentStatus;
    let lastProgress = initialState.timelineProgress;
    this.buttons.forEach((btn, key) => {
      btn.classList.toggle('is-active', key === lastStatus);
    });
    this.updateTimelineLabel(lastProgress);
    this.syncSliderFromProgress(lastProgress);

    this.unsubscribers.push(
      useStatusStore.subscribe((state) => {
        if (state.currentStatus !== lastStatus) {
          lastStatus = state.currentStatus;
          this.buttons.forEach((btn, key) => {
            btn.classList.toggle('is-active', key === lastStatus);
          });
        }
        if (state.timelineProgress !== lastProgress) {
          lastProgress = state.timelineProgress;
          this.updateTimelineLabel(lastProgress);
          this.syncSliderFromProgress(lastProgress);
        }
      }),
    );
  }

  public dispose(): void {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.container.remove();
    this.styleEl.remove();
  }
}

type ArtStyle = 'oil' | 'watercolor' | 'sketch';

interface OilParams {
  brushSize: number;
  colorCount: number;
}

interface WatercolorParams {
  wetness: number;
  spreadRadius: number;
}

interface SketchParams {
  lineDensity: number;
  backgroundBrightness: number;
}

interface StyleParams {
  oil: OilParams;
  watercolor: WatercolorParams;
  sketch: SketchParams;
}

class ArtStyleApp {
  private container: HTMLElement;
  private uploadedImage: HTMLImageElement | null = null;
  private currentStyle: ArtStyle = 'oil';
  private compareMode: boolean = false;
  private splitPosition: number = 50;
  private isDragging: boolean = false;
  private params: StyleParams = {
    oil: { brushSize: 8, colorCount: 16 },
    watercolor: { wetness: 5, spreadRadius: 8 },
    sketch: { lineDensity: 0.5, backgroundBrightness: 240 }
  };
  private canvasWidth: number = 360;
  private canvasHeight: number = 480;
  private originalCanvas: HTMLCanvasElement;
  private originalCtx: CanvasRenderingContext2D;
  private filteredCanvas: HTMLCanvasElement;
  private filteredCtx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private transitionProgress: number = 1;
  private transitionRaf: number | null = null;
  private renderThrottle: number | null = null;
  private sliderContainers: Record<string, HTMLElement> = {};
  private compareOverlayEl: HTMLElement | null = null;
  private leftBoxEl: HTMLElement | null = null;
  private splitterEl: HTMLElement | null = null;
  private rightLabelEl: HTMLElement | null = null;
  private paramsAreaEl: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.originalCanvas = document.createElement('canvas');
    this.originalCtx = this.originalCanvas.getContext('2d')!;
    this.filteredCanvas = document.createElement('canvas');
    this.filteredCtx = this.filteredCanvas.getContext('2d')!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    this.buildUI();
    this.setupGlobalStyles();
  }

  private setupGlobalStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        width: 100%;
        min-height: 100vh;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%);
        color: #e0e0e0;
        overflow-x: hidden;
      }
      #app {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px 16px;
      }
      .ast-card {
        width: 100%;
        max-width: 960px;
        background: rgba(255, 255, 255, 0.06);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 32px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      }
      .ast-title {
        font-size: 24px;
        font-weight: 600;
        text-align: center;
        margin-bottom: 4px;
        background: linear-gradient(135deg, #6ab7ff 0%, #4a90d9 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .ast-subtitle {
        text-align: center;
        font-size: 13px;
        color: #808080;
        margin-bottom: 28px;
      }
      .ast-upload {
        border: 2px dashed #4a4a4a;
        border-radius: 12px;
        padding: 40px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      }
      .ast-upload:hover {
        border-color: #5a5a5a;
        background: rgba(255, 255, 255, 0.02);
      }
      .ast-upload.dragging {
        border-color: #4a90d9;
        background: rgba(74, 144, 217, 0.08);
        animation: ast-pulse 1.5s ease-in-out infinite;
      }
      @keyframes ast-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(74, 144, 217, 0.4); }
        50% { box-shadow: 0 0 0 12px rgba(74, 144, 217, 0); }
      }
      .ast-upload-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 16px;
        color: #a0a0a0;
      }
      .ast-upload-text {
        font-size: 14px;
        color: #a0a0a0;
        margin-bottom: 6px;
        font-weight: 500;
      }
      .ast-upload-hint {
        font-size: 12px;
        color: #606060;
      }
      .ast-canvas-wrapper {
        position: relative;
        margin-bottom: 20px;
      }
      .ast-canvas-container {
        display: flex;
        gap: 16px;
        position: relative;
        justify-content: center;
      }
      .ast-canvas-box {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        background: #1a1a1a;
      }
      .ast-canvas-box canvas {
        display: block;
        max-width: 100%;
      }
      .ast-canvas-label {
        position: absolute;
        top: 8px;
        left: 8px;
        background: rgba(0, 0, 0, 0.6);
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        color: #fff;
        pointer-events: none;
        z-index: 2;
      }
      .ast-compare-hint {
        position: absolute;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.75);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        color: #fff;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        white-space: nowrap;
      }
      .ast-canvas-wrapper:hover .ast-compare-hint {
        opacity: 1;
      }
      .ast-splitter {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 3px;
        background: #fff;
        cursor: ew-resize;
        z-index: 5;
        display: none;
      }
      .ast-splitter.active {
        display: block;
      }
      .ast-splitter::before {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: -1px;
        right: -1px;
        background: repeating-linear-gradient(
          180deg,
          transparent,
          transparent 6px,
          rgba(255, 255, 255, 0.6) 6px,
          rgba(255, 255, 255, 0.6) 12px
        );
        pointer-events: none;
      }
      .ast-splitter-handle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 28px;
        height: 28px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .ast-splitter-handle:hover {
        background: #3a7bc8;
        transform: translate(-50%, -50%) scale(1.1);
      }
      .ast-splitter-handle.dragging {
        background: #ff8c42;
        box-shadow: 0 4px 16px rgba(255, 140, 66, 0.5);
      }
      .ast-splitter-handle svg {
        width: 14px;
        height: 14px;
        color: #666;
      }
      .ast-splitter-handle:hover svg,
      .ast-splitter-handle.dragging svg {
        color: #fff;
      }
      .ast-compare-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 3;
        border-radius: 8px;
        overflow: hidden;
      }
      .ast-compare-overlay canvas {
        position: absolute;
        top: 0;
        left: 0;
      }
      .ast-style-switcher {
        display: flex;
        justify-content: center;
        gap: 0;
        margin-bottom: 24px;
      }
      .ast-style-btn {
        padding: 10px 28px;
        border: 1.5px solid #555;
        background: transparent;
        color: #a0a0a0;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
      }
      .ast-style-btn:first-child {
        border-radius: 24px 0 0 24px;
        border-right: none;
      }
      .ast-style-btn:last-child {
        border-radius: 0 24px 24px 0;
        border-left: none;
      }
      .ast-style-btn:hover {
        border-color: #6a6a6a;
        color: #c0c0c0;
      }
      .ast-style-btn.active {
        background: #4a90d9;
        border-color: #4a90d9;
        color: #fff;
      }
      .ast-params {
        margin-bottom: 24px;
        padding: 20px;
        background: rgba(0, 0, 0, 0.2);
        border-radius: 10px;
      }
      .ast-param-row {
        margin-bottom: 20px;
      }
      .ast-param-row:last-child {
        margin-bottom: 0;
      }
      .ast-param-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-size: 13px;
        color: #c0c0c0;
        font-weight: 500;
      }
      .ast-param-value {
        background: rgba(74, 144, 217, 0.2);
        color: #6ab7ff;
        padding: 2px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
      }
      .ast-slider {
        position: relative;
        height: 28px;
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      .ast-slider-track {
        position: relative;
        width: 100%;
        height: 4px;
        background: #3a3a3a;
        border-radius: 2px;
        overflow: hidden;
      }
      .ast-slider-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: linear-gradient(90deg, #666 0%, #4a90d9 100%);
        border-radius: 2px;
      }
      .ast-slider-thumb {
        position: absolute;
        width: 18px;
        height: 18px;
        background: #fff;
        border-radius: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        cursor: grab;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        z-index: 2;
      }
      .ast-slider-thumb:hover {
        box-shadow: 0 3px 10px rgba(74, 144, 217, 0.5);
      }
      .ast-slider-thumb:active {
        cursor: grabbing;
        transform: translate(-50%, -50%) scale(1.1);
      }
      .ast-slider-tooltip {
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translate(-50%, -100%);
        background: #4a90d9;
        color: #fff;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .ast-slider-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #4a90d9;
      }
      .ast-slider:hover .ast-slider-tooltip {
        opacity: 1;
      }
      .ast-actions-row {
        display: flex;
        gap: 16px;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
      }
      .ast-toggle-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
      }
      .ast-toggle-label {
        font-size: 13px;
        color: #b0b0b0;
      }
      .ast-toggle {
        position: relative;
        width: 42px;
        height: 22px;
        background: #3a3a3a;
        border-radius: 11px;
        transition: background 0.3s ease;
      }
      .ast-toggle.on {
        background: #4a90d9;
      }
      .ast-toggle-knob {
        position: absolute;
        width: 16px;
        height: 16px;
        background: #fff;
        border-radius: 50%;
        top: 3px;
        left: 3px;
        transition: left 0.3s ease;
      }
      .ast-toggle.on .ast-toggle-knob {
        left: 23px;
      }
      .ast-btn {
        padding: 10px 22px;
        border: none;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: #e0e0e0;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .ast-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        background: rgba(255, 255, 255, 0.12);
      }
      .ast-btn:active {
        transform: scale(0.96);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
      .ast-btn svg {
        width: 16px;
        height: 16px;
      }
      .ast-btn-primary {
        background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
        color: #fff;
      }
      .ast-btn-primary:hover {
        background: linear-gradient(135deg, #5a9fe9 0%, #4589cd 100%);
      }
      .ast-toast {
        position: fixed;
        top: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        pointer-events: none;
      }
      .ast-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .ast-toast-success {
        background: rgba(46, 160, 67, 0.95);
        color: #fff;
      }
      .ast-toast-error {
        background: rgba(215, 58, 73, 0.95);
        color: #fff;
      }
      .ast-toast svg {
        width: 16px;
        height: 16px;
      }
      .ast-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 480px;
        background: #1a1a1a;
        border-radius: 8px;
        color: #555;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      }
      @media (max-width: 480px) {
        .ast-card {
          padding: 20px 16px;
        }
        .ast-title {
          font-size: 20px;
        }
        .ast-upload {
          padding: 28px 16px;
        }
        .ast-canvas-container {
          flex-direction: column;
          align-items: center;
        }
        .ast-canvas-box {
          width: 100%;
        }
        .ast-canvas-box canvas {
          width: 100%;
          height: auto;
        }
        .ast-actions-row {
          flex-direction: column;
          align-items: stretch;
        }
        .ast-btn {
          justify-content: center;
        }
        .ast-toggle-wrap {
          justify-content: center;
        }
        .ast-style-btn {
          padding: 8px 18px;
          font-size: 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private buildUI(): void {
    const card = document.createElement('div');
    card.className = 'ast-card';

    const title = document.createElement('h1');
    title.className = 'ast-title';
    title.textContent = '艺术风格转换器';
    card.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.className = 'ast-subtitle';
    subtitle.textContent = '将您的照片瞬间转化为油画、水彩或素描风格';
    card.appendChild(subtitle);

    const upload = this.buildUpload();
    card.appendChild(upload);

    const canvasWrapper = this.buildCanvasArea();
    card.appendChild(canvasWrapper);

    const styleSwitcher = this.buildStyleSwitcher();
    card.appendChild(styleSwitcher);

    const paramsArea = document.createElement('div');
    paramsArea.className = 'ast-params';
    paramsArea.id = 'ast-params';
    this.paramsAreaEl = paramsArea;
    card.appendChild(paramsArea);
    this.renderParams();

    const actions = this.buildActions();
    card.appendChild(actions);

    this.container.appendChild(card);
  }

  private buildUpload(): HTMLElement {
    const upload = document.createElement('div');
    upload.className = 'ast-upload';
    upload.id = 'ast-upload';

    upload.innerHTML = `
      <svg class="ast-upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 5.65 12.5 4 4 0 0 0 6.5 20h11z"/>
        <polyline points="8 14 12 10 16 14"/>
        <line x1="12" y1="10" x2="12" y2="19"/>
      </svg>
      <div class="ast-upload-text">拖拽图片到此处或点击上传</div>
      <div class="ast-upload-hint">支持 JPG / PNG / WebP，最大 10MB</div>
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.style.display = 'none';
    fileInput.id = 'ast-file-input';
    upload.appendChild(fileInput);

    upload.addEventListener('click', (e) => {
      if (e.target === fileInput) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        this.handleFile(target.files[0]);
      }
    });

    ['dragenter', 'dragover'].forEach(evt => {
      upload.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        upload.classList.add('dragging');
      });
    });

    ['dragleave', 'drop'].forEach(evt => {
      upload.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (evt === 'dragleave' && (e as DragEvent).relatedTarget) return;
        upload.classList.remove('dragging');
      });
    });

    upload.addEventListener('drop', (e) => {
      const dragEvent = e as DragEvent;
      if (dragEvent.dataTransfer && dragEvent.dataTransfer.files && dragEvent.dataTransfer.files[0]) {
        this.handleFile(dragEvent.dataTransfer.files[0]);
      }
    });

    return upload;
  }

  private buildCanvasArea(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'ast-canvas-wrapper';

    const container = document.createElement('div');
    container.className = 'ast-canvas-container';
    container.id = 'ast-canvas-container';

    const leftBox = document.createElement('div');
    leftBox.className = 'ast-canvas-box';
    leftBox.id = 'ast-left-box';
    leftBox.style.width = this.canvasWidth + 'px';
    leftBox.style.height = this.canvasHeight + 'px';
    this.leftBoxEl = leftBox;

    const leftLabel = document.createElement('div');
    leftLabel.className = 'ast-canvas-label';
    leftLabel.textContent = '原图';
    leftBox.appendChild(leftLabel);

    this.originalCanvas.width = this.canvasWidth;
    this.originalCanvas.height = this.canvasHeight;
    this.originalCanvas.id = 'ast-original-canvas';
    leftBox.appendChild(this.originalCanvas);

    this.drawEmpty(this.originalCtx);

    const rightBox = document.createElement('div');
    rightBox.className = 'ast-canvas-box';
    rightBox.id = 'ast-right-box';
    rightBox.style.width = this.canvasWidth + 'px';
    rightBox.style.height = this.canvasHeight + 'px';
    rightBox.style.position = 'relative';

    const rightLabel = document.createElement('div');
    rightLabel.className = 'ast-canvas-label';
    rightLabel.id = 'ast-right-label';
    rightLabel.textContent = '油画效果';
    rightBox.appendChild(rightLabel);
    this.rightLabelEl = rightLabel;

    this.filteredCanvas.width = this.canvasWidth;
    this.filteredCanvas.height = this.canvasHeight;
    this.filteredCanvas.id = 'ast-filtered-canvas';
    rightBox.appendChild(this.filteredCanvas);

    this.drawEmpty(this.filteredCtx);

    const compareOverlay = document.createElement('div');
    compareOverlay.className = 'ast-compare-overlay';
    compareOverlay.id = 'ast-compare-overlay';
    compareOverlay.style.display = 'none';
    rightBox.appendChild(compareOverlay);
    this.compareOverlayEl = compareOverlay;

    const splitter = document.createElement('div');
    splitter.className = 'ast-splitter';
    splitter.id = 'ast-splitter';
    splitter.style.left = this.splitPosition + '%';
    const handle = document.createElement('div');
    handle.className = 'ast-splitter-handle';
    handle.id = 'ast-splitter-handle';
    handle.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="8 6 2 12 8 18"/>
        <polyline points="16 6 22 12 16 18"/>
      </svg>
    `;
    splitter.appendChild(handle);
    rightBox.appendChild(splitter);
    this.splitterEl = splitter;

    container.appendChild(leftBox);
    container.appendChild(rightBox);

    wrapper.appendChild(container);

    const hint = document.createElement('div');
    hint.className = 'ast-compare-hint';
    hint.id = 'ast-canvas-hint';
    hint.textContent = '开启对照模式后拖拽分割条可对比';
    wrapper.appendChild(hint);

    this.setupSplitter(splitter, handle, rightBox);
    return wrapper;
  }

  private setupSplitter(splitter: HTMLElement, handle: HTMLElement, rightBox: HTMLElement): void {
    const startDrag = (e: MouseEvent | TouchEvent) => {
      if (!this.compareMode) return;
      e.preventDefault();
      this.isDragging = true;
      handle.classList.add('dragging');
      document.body.style.cursor = 'ew-resize';
    };

    const onDrag = (e: MouseEvent | TouchEvent) => {
      if (!this.isDragging || !this.compareMode) return;
      const rect = rightBox.getBoundingClientRect();
      let clientX: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      let pos = ((clientX - rect.left) / rect.width) * 100;
      pos = Math.max(0, Math.min(100, pos));
      this.splitPosition = pos;
      splitter.style.left = pos + '%';
      this.updateCompareOverlay();
    };

    const endDrag = () => {
      this.isDragging = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
    };

    splitter.addEventListener('mousedown', startDrag);
    splitter.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag as EventListener, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
  }

  private updateCompareOverlay(): void {
    const overlay = this.compareOverlayEl;
    if (!overlay) return;
    if (!this.compareMode || !this.uploadedImage) {
      overlay.style.display = 'none';
      return;
    }
    overlay.style.display = 'block';
    overlay.innerHTML = '';
    const cloneCanvas = document.createElement('canvas');
    cloneCanvas.width = this.canvasWidth;
    cloneCanvas.height = this.canvasHeight;
    const cloneCtx = cloneCanvas.getContext('2d')!;
    cloneCtx.drawImage(this.originalCanvas, 0, 0);
    cloneCanvas.style.clipPath = `inset(0 ${100 - this.splitPosition}% 0 0)`;
    overlay.appendChild(cloneCanvas);
  }

  private drawEmpty(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.fillStyle = '#333';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('上传图片以开始', this.canvasWidth / 2, this.canvasHeight / 2);
  }

  private buildStyleSwitcher(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'ast-style-switcher';

    const styles: { key: ArtStyle; label: string }[] = [
      { key: 'oil', label: '油画' },
      { key: 'watercolor', label: '水彩' },
      { key: 'sketch', label: '素描' }
    ];

    styles.forEach(s => {
      const btn = document.createElement('button');
      btn.className = 'ast-style-btn' + (this.currentStyle === s.key ? ' active' : '');
      btn.textContent = s.label;
      btn.dataset.style = s.key;
      btn.addEventListener('click', () => this.switchStyle(s.key));
      wrapper.appendChild(btn);
    });

    return wrapper;
  }

  private switchStyle(style: ArtStyle): void {
    if (style === this.currentStyle) return;
    this.currentStyle = style;
    document.querySelectorAll('.ast-style-btn').forEach(btn => {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.style === style);
    });

    const labels: Record<ArtStyle, string> = {
      oil: '油画效果',
      watercolor: '水彩效果',
      sketch: '素描效果'
    };
    if (this.rightLabelEl) {
      this.rightLabelEl.textContent = labels[style];
    }

    this.renderParams();
    this.startTransition();
  }

  private startTransition(): void {
    if (!this.uploadedImage) return;
    if (this.transitionRaf) {
      cancelAnimationFrame(this.transitionRaf);
    }
    this.transitionProgress = 0;
    const start = performance.now();
    const duration = 2000;

    const renderTarget = this.offscreenCanvas;
    const tCtx = this.offscreenCtx;
    renderTarget.width = this.canvasWidth;
    renderTarget.height = this.canvasHeight;
    this.applyFilterToCanvas(this.uploadedImage!, renderTarget, tCtx);

    const animate = (now: number) => {
      const elapsed = now - start;
      this.transitionProgress = Math.min(1, elapsed / duration);
      const eased = this.easeInOutCubic(this.transitionProgress);

      this.filteredCtx.globalAlpha = 1;
      this.filteredCtx.drawImage(this.originalCanvas, 0, 0);
      this.filteredCtx.globalAlpha = eased;
      this.filteredCtx.drawImage(renderTarget, 0, 0);
      this.filteredCtx.globalAlpha = 1;

      if (this.transitionProgress < 1) {
        this.transitionRaf = requestAnimationFrame(animate);
      } else {
        this.transitionRaf = null;
      }
    };
    this.transitionRaf = requestAnimationFrame(animate);
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  private renderParams(): void {
    const paramsArea = this.paramsAreaEl;
    if (!paramsArea) return;
    paramsArea.innerHTML = '';

    const paramDefs = this.getParamDefs();
    paramDefs.forEach(def => {
      paramsArea.appendChild(this.buildSlider(def));
    });
  }

  private getParamDefs(): Array<{ key: string; label: string; min: number; max: number; step: number; value: number }> {
    switch (this.currentStyle) {
      case 'oil':
        return [
          { key: 'brushSize', label: '笔触大小', min: 2, max: 20, step: 1, value: this.params.oil.brushSize },
          { key: 'colorCount', label: '颜色数量', min: 4, max: 32, step: 1, value: this.params.oil.colorCount }
        ];
      case 'watercolor':
        return [
          { key: 'wetness', label: '湿润度', min: 1, max: 10, step: 1, value: this.params.watercolor.wetness },
          { key: 'spreadRadius', label: '扩散半径', min: 1, max: 15, step: 1, value: this.params.watercolor.spreadRadius }
        ];
      case 'sketch':
        return [
          { key: 'lineDensity', label: '线条密度', min: 0.1, max: 1.0, step: 0.05, value: this.params.sketch.lineDensity },
          { key: 'backgroundBrightness', label: '背景亮度', min: 0, max: 255, step: 1, value: this.params.sketch.backgroundBrightness }
        ];
    }
  }

  private buildSlider(def: { key: string; label: string; min: number; max: number; step: number; value: number }): HTMLElement {
    const row = document.createElement('div');
    row.className = 'ast-param-row';

    const labelRow = document.createElement('div');
    labelRow.className = 'ast-param-label';
    const labelText = document.createElement('span');
    labelText.textContent = def.label;
    const valueTag = document.createElement('span');
    valueTag.className = 'ast-param-value';
    valueTag.textContent = this.formatValue(def.value, def.step);
    labelRow.appendChild(labelText);
    labelRow.appendChild(valueTag);
    row.appendChild(labelRow);

    const slider = document.createElement('div');
    slider.className = 'ast-slider';

    const track = document.createElement('div');
    track.className = 'ast-slider-track';
    slider.appendChild(track);

    const fill = document.createElement('div');
    fill.className = 'ast-slider-fill';
    track.appendChild(fill);

    const thumb = document.createElement('div');
    thumb.className = 'ast-slider-thumb';
    slider.appendChild(thumb);

    const tooltip = document.createElement('div');
    tooltip.className = 'ast-slider-tooltip';
    tooltip.textContent = this.formatValue(def.value, def.step);
    thumb.appendChild(tooltip);

    const updatePosition = (val: number) => {
      const pct = ((val - def.min) / (def.max - def.min)) * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
      tooltip.textContent = this.formatValue(val, def.step);
      valueTag.textContent = this.formatValue(val, def.step);
    };
    updatePosition(def.value);

    let dragging = false;

    const getValue = (e: MouseEvent | TouchEvent): number => {
      const rect = slider.getBoundingClientRect();
      let clientX: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }
      let ratio = (clientX - rect.left) / rect.width;
      ratio = Math.max(0, Math.min(1, ratio));
      let val = def.min + ratio * (def.max - def.min);
      val = Math.round(val / def.step) * def.step;
      val = Math.max(def.min, Math.min(def.max, Number(val.toFixed(4))));
      return val;
    };

    const startDrag = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      dragging = true;
      updatePosition(getValue(e));
    };

    const onDrag = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const val = getValue(e);
      updatePosition(val);
      this.updateParam(def.key, val);
    };

    const endDrag = () => {
      dragging = false;
    };

    slider.addEventListener('mousedown', startDrag);
    slider.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag as EventListener, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);

    row.appendChild(slider);
    this.sliderContainers[def.key] = row;
    return row;
  }

  private formatValue(val: number, step: number): string {
    if (step < 1) {
      return val.toFixed(2);
    }
    return String(Math.round(val));
  }

  private updateParam(key: string, value: number): void {
    if (this.currentStyle === 'oil') {
      (this.params.oil as unknown as Record<string, number>)[key] = value;
    } else if (this.currentStyle === 'watercolor') {
      (this.params.watercolor as unknown as Record<string, number>)[key] = value;
    } else if (this.currentStyle === 'sketch') {
      (this.params.sketch as unknown as Record<string, number>)[key] = value;
    }

    if (this.renderThrottle) {
      cancelAnimationFrame(this.renderThrottle);
    }
    this.renderThrottle = requestAnimationFrame(() => {
      this.renderFiltered();
    });
  }

  private buildActions(): HTMLElement {
    const row = document.createElement('div');
    row.className = 'ast-actions-row';

    const toggleWrap = document.createElement('div');
    toggleWrap.className = 'ast-toggle-wrap';

    const toggleLabel = document.createElement('span');
    toggleLabel.className = 'ast-toggle-label';
    toggleLabel.textContent = '对照模式';
    toggleWrap.appendChild(toggleLabel);

    const toggle = document.createElement('div');
    toggle.className = 'ast-toggle' + (this.compareMode ? ' on' : '');
    toggle.id = 'ast-compare-toggle';
    const knob = document.createElement('div');
    knob.className = 'ast-toggle-knob';
    toggle.appendChild(knob);
    toggleWrap.appendChild(toggle);

    toggleWrap.addEventListener('click', () => {
      this.compareMode = !this.compareMode;
      toggle.classList.toggle('on', this.compareMode);
      if (this.splitterEl) {
        this.splitterEl.classList.toggle('active', this.compareMode);
      }
      if (this.leftBoxEl) {
        if (this.compareMode) {
          this.leftBoxEl.style.display = 'none';
        } else {
          this.leftBoxEl.style.display = '';
        }
      }
      this.updateCompareOverlay();
    });
    row.appendChild(toggleWrap);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'ast-btn ast-btn-primary';
    saveBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      保存为PNG
    `;
    saveBtn.addEventListener('click', () => this.savePNG());
    row.appendChild(saveBtn);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'ast-btn';
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      复制到剪贴板
    `;
    copyBtn.addEventListener('click', () => this.copyToClipboard());
    row.appendChild(copyBtn);

    return row;
  }

  private handleFile(file: File): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.showToast('不支持的图片格式，请上传 JPG、PNG 或 WebP', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      this.showToast('图片大小不能超过 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.uploadedImage = img;
        this.drawOriginal();
        this.renderFiltered();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private drawOriginal(): void {
    if (!this.uploadedImage) return;
    const { w, h, x, y } = this.fitImage(this.uploadedImage, this.canvasWidth, this.canvasHeight);
    this.originalCtx.fillStyle = '#1a1a1a';
    this.originalCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.originalCtx.drawImage(this.uploadedImage, x, y, w, h);
  }

  private fitImage(img: HTMLImageElement, cw: number, ch: number): { w: number; h: number; x: number; y: number } {
    const ratio = Math.min(cw / img.width, ch / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    return { w, h, x, y };
  }

  private renderFiltered(): void {
    if (!this.uploadedImage) return;
    if (this.transitionRaf) {
      cancelAnimationFrame(this.transitionRaf);
      this.transitionRaf = null;
    }
    this.applyFilterToCanvas(this.uploadedImage, this.filteredCanvas, this.filteredCtx);
    if (this.compareMode) {
      this.updateCompareOverlay();
    }
  }

  private applyFilterToCanvas(img: HTMLImageElement, _canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    const { w, h, x, y } = this.fitImage(img, this.canvasWidth, this.canvasHeight);

    const workCanvas = document.createElement('canvas');
    workCanvas.width = this.canvasWidth;
    workCanvas.height = this.canvasHeight;
    const workCtx = workCanvas.getContext('2d')!;
    workCtx.fillStyle = '#1a1a1a';
    workCtx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    workCtx.drawImage(img, x, y, w, h);

    let resultImageData: ImageData;
    switch (this.currentStyle) {
      case 'oil':
        resultImageData = this.applyOilEffect(workCtx);
        break;
      case 'watercolor':
        resultImageData = this.applyWatercolorEffect(workCtx);
        break;
      case 'sketch':
        resultImageData = this.applySketchEffect(workCtx);
        break;
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.putImageData(resultImageData, 0, 0);
  }

  private applyOilEffect(ctx: CanvasRenderingContext2D): ImageData {
    const { brushSize, colorCount } = this.params.oil;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const src = ctx.getImageData(0, 0, w, h);
    const srcData = src.data;

    const levels = Math.max(2, colorCount);
    const step = 256 / levels;

    const out = ctx.createImageData(w, h);
    const outData = out.data;

    for (let y = 0; y < h; y += brushSize) {
      for (let x = 0; x < w; x += brushSize) {
        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        const bs = Math.min(brushSize, w - x);
        const bh = Math.min(brushSize, h - y);
        for (let dy = 0; dy < bh; dy++) {
          for (let dx = 0; dx < bs; dx++) {
            const i = ((y + dy) * w + (x + dx)) * 4;
            rSum += srcData[i];
            gSum += srcData[i + 1];
            bSum += srcData[i + 2];
            count++;
          }
        }
        let rAvg = Math.floor(rSum / count / step) * step + step / 2;
        let gAvg = Math.floor(gSum / count / step) * step + step / 2;
        let bAvg = Math.floor(bSum / count / step) * step + step / 2;
        rAvg = Math.min(255, rAvg);
        gAvg = Math.min(255, gAvg);
        bAvg = Math.min(255, bAvg);

        for (let dy = 0; dy < bh; dy++) {
          for (let dx = 0; dx < bs; dx++) {
            const jitterR = (Math.random() - 0.5) * 30;
            const jitterG = (Math.random() - 0.5) * 30;
            const jitterB = (Math.random() - 0.5) * 30;
            const i = ((y + dy) * w + (x + dx)) * 4;
            outData[i] = Math.max(0, Math.min(255, rAvg + jitterR));
            outData[i + 1] = Math.max(0, Math.min(255, gAvg + jitterG));
            outData[i + 2] = Math.max(0, Math.min(255, bAvg + jitterB));
            outData[i + 3] = srcData[i + 3];
          }
        }
      }
    }
    return out;
  }

  private applyWatercolorEffect(ctx: CanvasRenderingContext2D): ImageData {
    const { wetness, spreadRadius } = this.params.watercolor;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const src = ctx.getImageData(0, 0, w, h);
    const srcData = src.data;

    const blurRadius = Math.ceil(spreadRadius * 0.8);
    const temp = ctx.createImageData(w, h);
    const tempData = temp.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, count = 0;
        for (let dy = -blurRadius; dy <= blurRadius; dy++) {
          for (let dx = -blurRadius; dx <= blurRadius; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > blurRadius) continue;
            const weight = 1 - (dist / blurRadius);
            const i = (ny * w + nx) * 4;
            r += srcData[i] * weight;
            g += srcData[i + 1] * weight;
            b += srcData[i + 2] * weight;
            count += weight;
          }
        }
        const i = (y * w + x) * 4;
        tempData[i] = r / count;
        tempData[i + 1] = g / count;
        tempData[i + 2] = b / count;
        tempData[i + 3] = srcData[i + 3];
      }
    }

    const out = ctx.createImageData(w, h);
    const outData = out.data;
    const satBoost = 1 + wetness * 0.06;

    for (let i = 0; i < tempData.length; i += 4) {
      let r = tempData[i];
      let g = tempData[i + 1];
      let b = tempData[i + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satBoost;
      g = gray + (g - gray) * satBoost;
      b = gray + (b - gray) * satBoost;

      const lightBoost = wetness * 0.02;
      r = Math.min(255, r + (255 - r) * lightBoost);
      g = Math.min(255, g + (255 - g) * lightBoost);
      b = Math.min(255, b + (255 - b) * lightBoost);

      const noise = (Math.random() - 0.5) * (wetness * 2);
      outData[i] = Math.max(0, Math.min(255, r + noise));
      outData[i + 1] = Math.max(0, Math.min(255, g + noise));
      outData[i + 2] = Math.max(0, Math.min(255, b + noise));
      outData[i + 3] = tempData[i + 3];
    }
    return out;
  }

  private applySketchEffect(ctx: CanvasRenderingContext2D): ImageData {
    const { lineDensity, backgroundBrightness } = this.params.sketch;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const src = ctx.getImageData(0, 0, w, h);
    const srcData = src.data;

    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < srcData.length; i += 4, j++) {
      gray[j] = 0.299 * srcData[i] + 0.587 * srcData[i + 1] + 0.114 * srcData[i + 2];
    }

    const edge = new Float32Array(w * h);
    let maxEdge = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx = -gray[idx - w - 1] + gray[idx - w + 1]
          - 2 * gray[idx - 1] + 2 * gray[idx + 1]
          - gray[idx + w - 1] + gray[idx + w + 1];
        const gy = -gray[idx - w - 1] - 2 * gray[idx - w] - gray[idx - w + 1]
          + gray[idx + w - 1] + 2 * gray[idx + w] + gray[idx + w + 1];
        const mag = Math.sqrt(gx * gx + gy * gy);
        edge[idx] = mag;
        if (mag > maxEdge) maxEdge = mag;
      }
    }

    const out = ctx.createImageData(w, h);
    const outData = out.data;
    const threshold = (1 - lineDensity) * maxEdge * 0.5;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const j = y * w + x;
        let v: number;
        if (edge[j] > threshold) {
          const intensity = Math.min(1, (edge[j] - threshold) / (maxEdge - threshold));
          v = backgroundBrightness * (1 - intensity);
        } else {
          v = backgroundBrightness;
        }
        const paperNoise = (Math.random() - 0.5) * 8;
        const val = Math.max(0, Math.min(255, v + paperNoise));
        outData[i] = val;
        outData[i + 1] = val;
        outData[i + 2] = val;
        outData[i + 3] = 255;
      }
    }
    return out;
  }

  private buildExportCanvas(): HTMLCanvasElement {
    const padding = 15;
    const shadowWidth = 5;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvasWidth + padding * 2 + shadowWidth * 2;
    exportCanvas.height = this.canvasHeight + padding * 2 + shadowWidth * 2;
    const ectx = exportCanvas.getContext('2d')!;

    ectx.fillStyle = '#ffffff';
    ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    ectx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ectx.shadowBlur = shadowWidth * 3;
    ectx.shadowOffsetX = 0;
    ectx.shadowOffsetY = 0;

    ectx.fillStyle = '#fff';
    ectx.fillRect(
      padding + shadowWidth,
      padding + shadowWidth,
      this.canvasWidth,
      this.canvasHeight
    );

    ectx.shadowColor = 'transparent';
    ectx.shadowBlur = 0;
    ectx.shadowOffsetX = 0;
    ectx.shadowOffsetY = 0;

    ectx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ectx.lineWidth = 1;
    ectx.strokeRect(
      padding + shadowWidth + 0.5,
      padding + shadowWidth + 0.5,
      this.canvasWidth - 1,
      this.canvasHeight - 1
    );

    ectx.drawImage(
      this.filteredCanvas,
      padding + shadowWidth,
      padding + shadowWidth
    );

    return exportCanvas;
  }

  private savePNG(): void {
    if (!this.uploadedImage) {
      this.showToast('请先上传一张图片', 'error');
      return;
    }
    const exportCanvas = this.buildExportCanvas();
    const link = document.createElement('a');
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    link.download = `artwork_${ts}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.showToast('图片已保存', 'success');
  }

  private async copyToClipboard(): Promise<void> {
    if (!this.uploadedImage) {
      this.showToast('请先上传一张图片', 'error');
      return;
    }
    try {
      const exportCanvas = this.buildExportCanvas();
      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(b => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      if (navigator.clipboard && (navigator.clipboard as any).write) {
        await (navigator.clipboard as any).write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        this.showToast('已复制到剪贴板', 'success');
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch {
      this.showToast('复制失败，请尝试右键保存图片', 'error');
    }
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const existing = document.querySelector('.ast-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `ast-toast ast-toast-${type}`;

    const iconSvg = type === 'success'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

    toast.innerHTML = iconSvg + `<span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

export function createApp(container: HTMLElement): ArtStyleApp {
  return new ArtStyleApp(container);
}

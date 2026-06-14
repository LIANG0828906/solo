type ArtStyle = 'oil' | 'watercolor' | 'sketch';

interface OilParams {
  brushSize: number;
  colorCount: number;
  strokeDensity: number;
}

interface WatercolorParams {
  wetness: number;
  spreadRadius: number;
  colorBleed: number;
}

interface SketchParams {
  lineDensity: number;
  backgroundBrightness: number;
  pencilTexture: number;
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
    oil: { brushSize: 6, colorCount: 20, strokeDensity: 0.6 },
    watercolor: { wetness: 6, spreadRadius: 10, colorBleed: 0.5 },
    sketch: { lineDensity: 0.55, backgroundBrightness: 245, pencilTexture: 0.5 }
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
  private splitterHandleEl: HTMLElement | null = null;
  private rightBoxEl: HTMLElement | null = null;
  private rightLabelEl: HTMLElement | null = null;
  private paramsAreaEl: HTMLElement | null = null;
  private paperTexturePattern: CanvasPattern | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.originalCanvas = document.createElement('canvas');
    this.originalCtx = this.originalCanvas.getContext('2d', { willReadFrequently: true })!;
    this.filteredCanvas = document.createElement('canvas');
    this.filteredCtx = this.filteredCanvas.getContext('2d', { willReadFrequently: true })!;
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true })!;
    this.generatePaperTexture();
    this.setupGlobalStyles();
    this.buildUI();
  }

  private generatePaperTexture(): void {
    const tex = document.createElement('canvas');
    tex.width = 256;
    tex.height = 256;
    const tctx = tex.getContext('2d')!;
    const imgData = tctx.createImageData(256, 256);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = 240 + (Math.random() - 0.5) * 25;
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v - 2;
      imgData.data[i + 3] = 255;
    }
    tctx.putImageData(imgData, 0, 0);
    for (let i = 0; i < 500; i++) {
      tctx.fillStyle = `rgba(180,170,150,${Math.random() * 0.04})`;
      tctx.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    this.paperTexturePattern = this.offscreenCtx.createPattern(tex, 'repeat');
  }

  private setupGlobalStyles(): void {
    const existing = document.getElementById('ast-styles');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = 'ast-styles';
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
        -webkit-font-smoothing: antialiased;
      }
      #app {
        min-height: 100vh;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 32px 16px;
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
        font-size: 26px;
        font-weight: 700;
        text-align: center;
        margin-bottom: 4px;
        letter-spacing: -0.5px;
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
        font-weight: 400;
      }
      .ast-upload {
        border: 2px dashed #4a4a4a;
        border-radius: 12px;
        padding: 28px 24px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 20px;
        position: relative;
        overflow: hidden;
      }
      .ast-upload:hover {
        border-color: #6a6a6a;
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
        width: 44px;
        height: 44px;
        margin: 0 auto 10px;
        color: #a0a0a0;
      }
      .ast-upload-text {
        font-size: 13px;
        color: #a0a0a0;
        margin-bottom: 3px;
        font-weight: 500;
      }
      .ast-upload-hint {
        font-size: 11px;
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
        flex-wrap: nowrap;
      }
      .ast-canvas-box {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        background: #1a1a1a;
        flex-shrink: 0;
      }
      .ast-canvas-box canvas {
        display: block;
      }
      .ast-canvas-label {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.7);
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        color: #fff;
        pointer-events: none;
        z-index: 4;
        backdrop-filter: blur(4px);
      }
      .ast-compare-hint {
        position: absolute;
        bottom: 14px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 12px;
        color: #fff;
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
        white-space: nowrap;
        backdrop-filter: blur(6px);
        z-index: 4;
      }
      .ast-canvas-wrapper:hover .ast-compare-hint {
        opacity: 1;
      }
      .ast-splitter {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 20px;
        margin-left: -10px;
        background: transparent;
        cursor: ew-resize;
        z-index: 10;
        display: none;
      }
      .ast-splitter.active {
        display: block;
      }
      .ast-splitter-guide {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        background: repeating-linear-gradient(
          180deg,
          rgba(255,255,255,0.85),
          rgba(255,255,255,0.85) 6px,
          transparent 6px,
          transparent 12px
        );
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .ast-splitter:hover .ast-splitter-guide,
      .ast-splitter.active .ast-splitter-guide {
        opacity: 1;
      }
      .ast-splitter-handle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(1);
        width: 32px;
        height: 32px;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: ew-resize;
      }
      .ast-splitter-handle:hover {
        background: #3a7bc8 !important;
        transform: translate(-50%, -50%) scale(1.1) !important;
        box-shadow: 0 4px 16px rgba(58, 123, 200, 0.5) !important;
      }
      .ast-splitter-handle.dragging {
        background: #ff8c42 !important;
        transform: translate(-50%, -50%) scale(1.1) !important;
        box-shadow: 0 4px 20px rgba(255, 140, 66, 0.7) !important;
      }
      .ast-splitter-handle svg {
        width: 14px;
        height: 14px;
        color: #666;
        transition: color 0.2s ease;
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
        padding: 11px 32px;
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
        color: #d0d0d0;
        background: rgba(255, 255, 255, 0.03);
      }
      .ast-style-btn.active {
        background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
        border-color: #4a90d9;
        color: #fff;
        box-shadow: 0 2px 12px rgba(74, 144, 217, 0.3);
      }
      .ast-params {
        margin-bottom: 24px;
        padding: 20px 24px;
        background: rgba(0, 0, 0, 0.25);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.04);
      }
      .ast-param-row {
        margin-bottom: 22px;
      }
      .ast-param-row:last-child {
        margin-bottom: 0;
      }
      .ast-param-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
        font-size: 14px;
        color: #d0d0d0;
        font-weight: 500;
      }
      .ast-param-value {
        background: rgba(74, 144, 217, 0.25);
        color: #7abfff;
        padding: 4px 14px;
        border-radius: 14px;
        font-size: 13px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        min-width: 48px;
        text-align: center;
      }
      .ast-slider {
        position: relative;
        height: 40px;
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      .ast-slider-track {
        position: relative;
        width: 100%;
        height: 8px;
        background: #333;
        border-radius: 4px;
        overflow: visible;
      }
      .ast-slider-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        background: linear-gradient(90deg, #666 0%, #4a90d9 100%);
        border-radius: 4px;
        box-shadow: 0 0 10px rgba(74, 144, 217, 0.25);
      }
      .ast-slider-thumb {
        position: absolute;
        width: 24px;
        height: 24px;
        background: #fff;
        border-radius: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(74, 144, 217, 0.4);
        cursor: grab;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        z-index: 2;
      }
      .ast-slider-thumb:hover {
        box-shadow: 0 4px 14px rgba(74, 144, 217, 0.5), 0 0 0 3px rgba(74, 144, 217, 0.3);
      }
      .ast-slider-thumb:active {
        cursor: grabbing;
        transform: translate(-50%, -50%) scale(1.2);
      }
      .ast-slider-tooltip {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translate(-50%, -100%);
        background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
        color: #fff;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.15s ease, transform 0.15s ease;
        font-variant-numeric: tabular-nums;
        box-shadow: 0 4px 12px rgba(74, 144, 217, 0.4);
        z-index: 5;
      }
      .ast-slider-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: #357abd;
      }
      .ast-slider:hover .ast-slider-tooltip {
        opacity: 1;
        transform: translate(-50%, calc(-100% - 2px));
      }
      .ast-actions-row {
        display: flex;
        gap: 14px;
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
        padding: 6px 12px;
        border-radius: 8px;
        transition: background 0.2s ease;
      }
      .ast-toggle-wrap:hover {
        background: rgba(255, 255, 255, 0.04);
      }
      .ast-toggle-label {
        font-size: 13px;
        color: #b0b0b0;
        font-weight: 500;
      }
      .ast-toggle {
        position: relative;
        width: 44px;
        height: 24px;
        background: #3a3a3a;
        border-radius: 12px;
        transition: background 0.3s ease;
      }
      .ast-toggle.on {
        background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
      }
      .ast-toggle-knob {
        position: absolute;
        width: 18px;
        height: 18px;
        background: #fff;
        border-radius: 50%;
        top: 3px;
        left: 3px;
        transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      }
      .ast-toggle.on .ast-toggle-knob {
        left: 23px;
      }
      .ast-btn {
        padding: 11px 24px;
        border: none;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.08);
        color: #e0e0e0;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: inherit;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .ast-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        background: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.1);
      }
      .ast-btn:active {
        transform: scale(0.96) translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }
      .ast-btn svg {
        width: 16px;
        height: 16px;
      }
      .ast-btn-primary {
        background: linear-gradient(135deg, #4a90d9 0%, #357abd 100%);
        color: #fff;
        border-color: transparent;
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
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        max-width: 90vw;
      }
      .ast-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      .ast-toast-success {
        background: rgba(46, 160, 67, 0.96);
        color: #fff;
      }
      .ast-toast-error {
        background: rgba(215, 58, 73, 0.96);
        color: #fff;
      }
      .ast-toast svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
      .ast-toast-detail {
        font-size: 11px;
        opacity: 0.85;
        margin-top: 2px;
      }
      @media (max-width: 480px) {
        #app {
          padding: 12px 10px;
          align-items: flex-start;
        }
        .ast-card {
          padding: 16px 12px;
          border-radius: 12px;
        }
        .ast-title {
          font-size: 18px;
        }
        .ast-subtitle {
          font-size: 11px;
          margin-bottom: 16px;
        }
        .ast-upload {
          padding: 18px 12px;
          margin-bottom: 14px;
        }
        .ast-upload-icon {
          width: 36px;
          height: 36px;
          margin-bottom: 8px;
        }
        .ast-upload-text {
          font-size: 12px;
        }
        .ast-upload-hint {
          font-size: 10px;
        }
        .ast-canvas-container {
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .ast-canvas-box {
          width: 100%;
          max-width: 320px;
        }
        .ast-canvas-box canvas {
          width: 100%;
          height: auto;
        }
        .ast-canvas-wrapper {
          margin-bottom: 14px;
        }
        .ast-style-switcher {
          margin-bottom: 16px;
        }
        .ast-style-btn {
          padding: 8px 14px;
          font-size: 12px;
          flex: 1;
        }
        .ast-params {
          padding: 14px;
          margin-bottom: 16px;
        }
        .ast-param-row {
          margin-bottom: 16px;
        }
        .ast-param-label {
          font-size: 12px;
          margin-bottom: 10px;
        }
        .ast-param-value {
          font-size: 11px;
          padding: 3px 10px;
        }
        .ast-slider {
          height: 32px;
        }
        .ast-slider-track {
          height: 6px;
        }
        .ast-slider-thumb {
          width: 20px;
          height: 20px;
        }
        .ast-actions-row {
          flex-direction: column;
          align-items: stretch;
          gap: 8px;
        }
        .ast-btn {
          justify-content: center;
          width: 100%;
          padding: 10px 16px;
          font-size: 12px;
        }
        .ast-toggle-wrap {
          justify-content: center;
          padding: 8px;
          order: 3;
        }
        .ast-compare-hint {
          font-size: 10px;
          padding: 4px 10px;
          bottom: 8px;
        }
        .ast-canvas-label {
          font-size: 10px;
          padding: 3px 8px;
          top: 6px;
          left: 6px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private buildUI(): void {
    this.container.innerHTML = '';

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
        if (evt === 'dragleave') {
          const related = (e as DragEvent).relatedTarget as Node;
          if (related && upload.contains(related)) return;
        }
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
    this.rightBoxEl = rightBox;

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

    const guide = document.createElement('div');
    guide.className = 'ast-splitter-guide';
    splitter.appendChild(guide);

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
    this.splitterHandleEl = handle;

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
        if (!e.touches[0]) return;
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
    handle.addEventListener('mousedown', startDrag);
    splitter.addEventListener('touchstart', startDrag, { passive: false });
    handle.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag as EventListener, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);
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

    const origLabel = document.createElement('div');
    origLabel.className = 'ast-canvas-label';
    origLabel.textContent = '原图';
    origLabel.style.top = '10px';
    origLabel.style.left = '10px';
    origLabel.style.position = 'absolute';
    origLabel.style.background = 'rgba(0,0,0,0.7)';
    origLabel.style.padding = '4px 10px';
    origLabel.style.borderRadius = '4px';
    origLabel.style.fontSize = '11px';
    origLabel.style.color = '#fff';
    origLabel.style.fontWeight = '600';
    origLabel.style.zIndex = '5';
    origLabel.style.pointerEvents = 'none';
    origLabel.style.clipPath = `inset(0 ${100 - this.splitPosition}% 0 0)`;
    overlay.appendChild(origLabel);
  }

  private drawEmpty(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    ctx.fillStyle = '#444';
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
        if (this.compareMode) this.updateCompareOverlay();
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

  private getParamDefs(): Array<{ key: string; label: string; min: number; max: number; step: number; value: number; unit?: string }> {
    switch (this.currentStyle) {
      case 'oil':
        return [
          { key: 'brushSize', label: '笔触大小', min: 2, max: 16, step: 1, value: this.params.oil.brushSize, unit: 'px' },
          { key: 'colorCount', label: '颜色数量', min: 8, max: 32, step: 1, value: this.params.oil.colorCount, unit: '色' },
          { key: 'strokeDensity', label: '笔触密度', min: 0.2, max: 1.0, step: 0.05, value: this.params.oil.strokeDensity }
        ];
      case 'watercolor':
        return [
          { key: 'wetness', label: '湿润度', min: 1, max: 10, step: 1, value: this.params.watercolor.wetness },
          { key: 'spreadRadius', label: '扩散半径', min: 2, max: 15, step: 1, value: this.params.watercolor.spreadRadius, unit: 'px' },
          { key: 'colorBleed', label: '色彩晕染', min: 0, max: 1, step: 0.05, value: this.params.watercolor.colorBleed }
        ];
      case 'sketch':
        return [
          { key: 'lineDensity', label: '线条密度', min: 0.1, max: 1.0, step: 0.05, value: this.params.sketch.lineDensity },
          { key: 'backgroundBrightness', label: '纸张亮度', min: 200, max: 255, step: 1, value: this.params.sketch.backgroundBrightness },
          { key: 'pencilTexture', label: '铅笔纹理', min: 0, max: 1, step: 0.05, value: this.params.sketch.pencilTexture }
        ];
    }
  }

  private buildSlider(def: { key: string; label: string; min: number; max: number; step: number; value: number; unit?: string }): HTMLElement {
    const row = document.createElement('div');
    row.className = 'ast-param-row';

    const labelRow = document.createElement('div');
    labelRow.className = 'ast-param-label';
    const labelText = document.createElement('span');
    labelText.textContent = def.label;
    const valueTag = document.createElement('span');
    valueTag.className = 'ast-param-value';
    valueTag.textContent = this.formatValue(def.value, def.step) + (def.unit || '');
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
    tooltip.textContent = this.formatValue(def.value, def.step) + (def.unit || '');
    thumb.appendChild(tooltip);

    const updatePosition = (val: number) => {
      const pct = ((val - def.min) / (def.max - def.min)) * 100;
      fill.style.width = pct + '%';
      thumb.style.left = pct + '%';
      tooltip.textContent = this.formatValue(val, def.step) + (def.unit || '');
      valueTag.textContent = this.formatValue(val, def.step) + (def.unit || '');
    };
    updatePosition(def.value);

    let dragging = false;

    const getValue = (e: MouseEvent | TouchEvent): number => {
      const rect = slider.getBoundingClientRect();
      let clientX: number;
      if ('touches' in e) {
        if (!e.touches[0]) return def.min;
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
    thumb.addEventListener('mousedown', startDrag);
    slider.addEventListener('touchstart', startDrag, { passive: false });
    thumb.addEventListener('touchstart', startDrag, { passive: false });
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('touchmove', onDrag as EventListener, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
    window.addEventListener('touchcancel', endDrag);

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
      img.onerror = () => {
        this.showToast('图片加载失败，请重试', 'error');
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      this.showToast('图片读取失败', 'error');
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
    const workCtx = workCanvas.getContext('2d', { willReadFrequently: true })!;
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
    const { brushSize, colorCount, strokeDensity } = this.params.oil;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const src = ctx.getImageData(0, 0, w, h);
    const srcData = src.data;

    const levels = Math.max(4, colorCount);
    const step = 256 / levels;

    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < srcData.length; i += 4, j++) {
      gray[j] = 0.299 * srcData[i] + 0.587 * srcData[i + 1] + 0.114 * srcData[i + 2];
    }

    const smoothR = Math.max(1, Math.floor(brushSize * 0.6));
    const gx = new Float32Array(w * h);
    const gy = new Float32Array(w * h);
    const edgeStrength = new Float32Array(w * h);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const ix1 = gray[idx - 1], ix2 = gray[idx + 1];
        const iy1 = gray[idx - w], iy2 = gray[idx + w];
        const ixy1 = gray[idx - w - 1], ixy2 = gray[idx - w + 1];
        const ixy3 = gray[idx + w - 1], ixy4 = gray[idx + w + 1];

        const dx = -ixy1 + ixy2 - 2 * ix1 + 2 * ix2 - ixy3 + ixy4;
        const dy = -ixy1 - 2 * iy1 - ixy2 + ixy3 + 2 * iy2 + ixy4;
        gx[idx] = dx;
        gy[idx] = dy;
        edgeStrength[idx] = Math.sqrt(dx * dx + dy * dy);
      }
    }

    const Jxx = new Float32Array(w * h);
    const Jyy = new Float32Array(w * h);
    const Jxy = new Float32Array(w * h);

    for (let y = smoothR; y < h - smoothR; y++) {
      for (let x = smoothR; x < w - smoothR; x++) {
        let xx = 0, yy = 0, xy = 0, wt = 0;
        for (let dy = -smoothR; dy <= smoothR; dy++) {
          for (let dx = -smoothR; dx <= smoothR; dx++) {
            const nx = x + dx, ny = y + dy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > smoothR) continue;
            const wv = 1 - dist / smoothR;
            const nidx = ny * w + nx;
            xx += gx[nidx] * gx[nidx] * wv;
            yy += gy[nidx] * gy[nidx] * wv;
            xy += gx[nidx] * gy[nidx] * wv;
            wt += wv;
          }
        }
        const idx = y * w + x;
        Jxx[idx] = xx / wt;
        Jyy[idx] = yy / wt;
        Jxy[idx] = xy / wt;
      }
    }

    const angleField = new Float32Array(w * h);
    const coherency = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const jxx = Jxx[idx], jyy = Jyy[idx], jxy = Jxy[idx];
        const trace = jxx + jyy;
        const det = jxx * jyy - jxy * jxy;
        const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
        const lambda1 = trace / 2 + disc;
        const lambda2 = trace / 2 - disc;
        coherency[idx] = trace > 0.1 ? (lambda1 - lambda2) / (lambda1 + lambda2 + 0.001) : 0;

        if (Math.abs(jxy) < 0.001 && Math.abs(jxx - jyy) < 0.001) {
          angleField[idx] = Math.random() * Math.PI;
        } else {
          const theta = 0.5 * Math.atan2(2 * jxy, jxx - jyy);
          angleField[idx] = theta + Math.PI / 2;
        }
      }
    }

    const base = new Float32Array(srcData.length);
    const bs = Math.max(1, brushSize * 0.7);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0, wt = 0;
        const angle = angleField[idx];
        const coh = coherency[idx];
        const elong = 1.5 + coh * 2.5;
        const br = bs;
        const bl = bs * elong;
        const cosA = Math.cos(angle), sinA = Math.sin(angle);

        for (let dy = -Math.ceil(bl); dy <= Math.ceil(bl); dy++) {
          for (let dx = -Math.ceil(br); dx <= Math.ceil(br); dx++) {
            const rx = dx * cosA + dy * sinA;
            const ry = -dx * sinA + dy * cosA;
            const dist = (rx * rx) / (br * br) + (ry * ry) / (bl * bl);
            if (dist > 1) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const falloff = (1 - dist) * (1 - dist);
            const nidx = (ny * w + nx) * 4;
            rSum += srcData[nidx] * falloff;
            gSum += srcData[nidx + 1] * falloff;
            bSum += srcData[nidx + 2] * falloff;
            aSum += srcData[nidx + 3] * falloff;
            wt += falloff;
          }
        }
        if (wt > 0) {
          const oi = idx * 4;
          base[oi] = rSum / wt;
          base[oi + 1] = gSum / wt;
          base[oi + 2] = bSum / wt;
          base[oi + 3] = aSum / wt;
        } else {
          const oi = idx * 4;
          base[oi] = srcData[oi];
          base[oi + 1] = srcData[oi + 1];
          base[oi + 2] = srcData[oi + 2];
          base[oi + 3] = srcData[oi + 3];
        }
      }
    }

    const quantized = new Uint8ClampedArray(srcData.length);
    for (let i = 0; i < base.length; i += 4) {
      quantized[i] = Math.min(255, Math.floor(base[i] / step) * step + step / 2);
      quantized[i + 1] = Math.min(255, Math.floor(base[i + 1] / step) * step + step / 2);
      quantized[i + 2] = Math.min(255, Math.floor(base[i + 2] / step) * step + step / 2);
      quantized[i + 3] = base[i + 3];
    }

    const out = ctx.createImageData(w, h);
    const outData = out.data;
    for (let i = 0; i < quantized.length; i++) {
      outData[i] = quantized[i];
    }

    const strokeLayers = 3;
    const totalStrokes = Math.floor(w * h * strokeDensity * 0.015);

    for (let layer = 0; layer < strokeLayers; layer++) {
      const layerAlpha = 0.55 - layer * 0.12;
      const sizeMul = 0.7 + layer * 0.25;
      const count = Math.floor(totalStrokes / strokeLayers * (1 + layer * 0.3));

      for (let s = 0; s < count; s++) {
        const sx = Math.floor(Math.random() * w);
        const sy = Math.floor(Math.random() * h);
        const idx = sy * w + sx;
        const si = idx * 4;
        if (quantized[si + 3] < 10) continue;

        const baseAngle = angleField[idx];
        const coh = coherency[idx];
        const angleJitter = (1 - coh) * 0.8 + 0.15;
        const angle = baseAngle + (Math.random() - 0.5) * angleJitter * Math.PI;

        const br = brushSize * sizeMul * (0.6 + Math.random() * 0.8);
        const bl = br * (2 + Math.random() * 2 + coh * 2);

        const sr = Math.max(1, Math.floor(br));
        const sl = Math.max(1, Math.floor(bl));

        const baseR = quantized[si];
        const baseG = quantized[si + 1];
        const baseB = quantized[si + 2];

        const highlight = 0.08 + Math.random() * 0.1;
        const r = Math.min(255, baseR * (1 + highlight));
        const g = Math.min(255, baseG * (1 + highlight * 0.8));
        const b = Math.min(255, baseB * (1 + highlight * 0.5));

        const alpha = layerAlpha * (0.4 + Math.random() * 0.5);

        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        for (let dy = -sl; dy <= sl; dy++) {
          for (let dx = -sr; dx <= sr; dx++) {
            const rx = dx * cosA + dy * sinA;
            const ry = -dx * sinA + dy * cosA;
            const normX = rx / br;
            const normY = ry / bl;
            const dist = normX * normX + normY * normY;
            if (dist > 1) continue;
            const nx = sx + dx, ny = sy + dy;
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

            const falloff = 1 - dist;
            const edgeFade = Math.pow(falloff, 1.5);

            const oi = (ny * w + nx) * 4;
            const a = alpha * edgeFade * edgeFade;
            if (a <= 0) continue;

            const inv = 1 - a;
            outData[oi] = outData[oi] * inv + r * a;
            outData[oi + 1] = outData[oi + 1] * inv + g * a;
            outData[oi + 2] = outData[oi + 2] * inv + b * a;
          }
        }
      }
    }

    const detail = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nidx = (y + dy) * w + (x + dx);
            sum += gray[nidx];
          }
        }
        detail[idx] = Math.abs(gray[idx] - sum / 9);
      }
    }

    for (let i = 0; i < outData.length; i += 4) {
      const idx = i / 4;
      const detAmt = detail[idx] / 40 * strokeDensity;

      const noise1 = (Math.random() - 0.5) * 6;
      const noise2 = (Math.sin(idx * 0.003 + idx * 0.002) * 0.5 + Math.random() * 0.5 - 0.25) * 4;
      const impasto = (noise1 + noise2) * (1 + detAmt * 0.5);

      outData[i] = Math.max(0, Math.min(255, outData[i] + impasto));
      outData[i + 1] = Math.max(0, Math.min(255, outData[i + 1] + impasto * 0.95));
      outData[i + 2] = Math.max(0, Math.min(255, outData[i + 2] + impasto * 0.9));
    }

    return out;
  }

  private applyWatercolorEffect(ctx: CanvasRenderingContext2D): ImageData {
    const { wetness, spreadRadius, colorBleed } = this.params.watercolor;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const src = ctx.getImageData(0, 0, w, h);
    const srcData = src.data;

    const blurR = Math.max(1, Math.ceil(spreadRadius * 0.6));
    const temp = new Float32Array(srcData.length);
    for (let i = 0; i < srcData.length; i++) {
      temp[i] = srcData[i];
    }

    const hblur = new Float32Array(srcData.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0, wt = 0;
        for (let dx = -blurR; dx <= blurR; dx++) {
          const nx = Math.max(0, Math.min(w - 1, x + dx));
          const dist = Math.abs(dx);
          const gw = Math.exp(-(dist * dist) / (2 * blurR * blurR * 0.3));
          const i = (y * w + nx) * 4;
          r += temp[i] * gw;
          g += temp[i + 1] * gw;
          b += temp[i + 2] * gw;
          a += temp[i + 3] * gw;
          wt += gw;
        }
        const oi = (y * w + x) * 4;
        hblur[oi] = r / wt;
        hblur[oi + 1] = g / wt;
        hblur[oi + 2] = b / wt;
        hblur[oi + 3] = a / wt;
      }
    }

    const blurred = new Float32Array(srcData.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0, wt = 0;
        for (let dy = -blurR; dy <= blurR; dy++) {
          const ny = Math.max(0, Math.min(h - 1, y + dy));
          const dist = Math.abs(dy);
          const gw = Math.exp(-(dist * dist) / (2 * blurR * blurR * 0.3));
          const i = (ny * w + x) * 4;
          r += hblur[i] * gw;
          g += hblur[i + 1] * gw;
          b += hblur[i + 2] * gw;
          a += hblur[i + 3] * gw;
          wt += gw;
        }
        const oi = (y * w + x) * 4;
        blurred[oi] = r / wt;
        blurred[oi + 1] = g / wt;
        blurred[oi + 2] = b / wt;
        blurred[oi + 3] = a / wt;
      }
    }

    const edge = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const g = 0.299 * blurred[idx] + 0.587 * blurred[idx + 1] + 0.114 * blurred[idx + 2];
        const gl = 0.299 * blurred[idx - 4] + 0.587 * blurred[idx - 3] + 0.114 * blurred[idx - 2];
        const gr = 0.299 * blurred[idx + 4] + 0.587 * blurred[idx + 5] + 0.114 * blurred[idx + 6];
        const gu = 0.299 * blurred[idx - w * 4] + 0.587 * blurred[idx - w * 4 + 1] + 0.114 * blurred[idx - w * 4 + 2];
        const gd = 0.299 * blurred[idx + w * 4] + 0.587 * blurred[idx + w * 4 + 1] + 0.114 * blurred[idx + w * 4 + 2];
        edge[y * w + x] = Math.abs(gr - gl) + Math.abs(gd - gu);
      }
    }

    const out = ctx.createImageData(w, h);
    const outData = out.data;
    const bleed = colorBleed * 0.4;
    const satBoost = 1 + wetness * 0.05;

    for (let i = 0; i < outData.length; i += 4) {
      let r = blurred[i];
      let g = blurred[i + 1];
      let b = blurred[i + 2];

      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * satBoost;
      g = gray + (g - gray) * satBoost;
      b = gray + (b - gray) * satBoost;

      const eIdx = Math.floor(i / 4);
      const e = edge[eIdx] || 0;
      if (e > 15) {
        const damp = Math.max(0, 1 - (e - 15) * 0.015 * bleed);
        r *= damp;
        g *= damp;
        b *= damp;
      }

      const lightBoost = wetness * 0.025;
      r = Math.min(255, r + (255 - r) * lightBoost);
      g = Math.min(255, g + (255 - g) * lightBoost);
      b = Math.min(255, b + (255 - b) * lightBoost);

      const noise = (Math.random() - 0.5) * (wetness * 1.8 + 4);
      outData[i] = Math.max(0, Math.min(255, r + noise));
      outData[i + 1] = Math.max(0, Math.min(255, g + noise));
      outData[i + 2] = Math.max(0, Math.min(255, b + noise));
      outData[i + 3] = blurred[i + 3];
    }

    return out;
  }

  private applySketchEffect(ctx: CanvasRenderingContext2D): ImageData {
    const { lineDensity, backgroundBrightness, pencilTexture } = this.params.sketch;
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    const src = ctx.getImageData(0, 0, w, h);
    const srcData = src.data;

    const gray = new Float32Array(w * h);
    for (let i = 0, j = 0; i < srcData.length; i += 4, j++) {
      gray[j] = 0.299 * srcData[i] + 0.587 * srcData[i + 1] + 0.114 * srcData[i + 2];
    }

    const smoothR = 2;
    const smooth = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let s = 0, c = 0;
        for (let dy = -smoothR; dy <= smoothR; dy++) {
          for (let dx = -smoothR; dx <= smoothR; dx++) {
            const nx = Math.max(0, Math.min(w - 1, x + dx));
            const ny = Math.max(0, Math.min(h - 1, y + dy));
            s += gray[ny * w + nx];
            c++;
          }
        }
        smooth[y * w + x] = s / c;
      }
    }

    const gx = new Float32Array(w * h);
    const gy = new Float32Array(w * h);
    const edgeMag = new Float32Array(w * h);
    let maxMag = 0;

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const tl = smooth[idx - w - 1], tr = smooth[idx - w + 1];
        const ml = smooth[idx - 1], mr = smooth[idx + 1];
        const bl = smooth[idx + w - 1], br = smooth[idx + w + 1];
        const tm = smooth[idx - w], bm = smooth[idx + w];

        gx[idx] = -tl + tr - 2 * ml + 2 * mr - bl + br;
        gy[idx] = -tl - 2 * tm - tr + bl + 2 * bm + br;
        const mag = Math.sqrt(gx[idx] * gx[idx] + gy[idx] * gy[idx]);
        edgeMag[idx] = mag;
        if (mag > maxMag) maxMag = mag;
      }
    }

    const out = ctx.createImageData(w, h);
    const outData = out.data;
    const threshold = (1 - lineDensity) * maxMag * 0.25;
    const bv = backgroundBrightness;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const j = y * w + x;
        const mag = edgeMag[j];

        let baseVal: number;
        if (mag > threshold) {
          const intensity = Math.min(1, (mag - threshold) / (maxMag - threshold));
          const lineStrength = Math.pow(intensity, 0.7);
          baseVal = bv - lineStrength * (bv * 0.95);

          if (pencilTexture > 0.01) {
            const angle = Math.atan2(gy[j], gx[j]);
            const perpX = Math.sin(angle);
            const perpY = -Math.cos(angle);
            let hatch = 0;
            const layers = 3;
            for (let l = 0; l < layers; l++) {
              const spacing = 6 + l * 4;
              const offset = (x * perpX + y * perpY + l * 2.5) % spacing;
              const distFromLine = Math.min(offset, spacing - offset);
              const layerAmount = Math.exp(-distFromLine * distFromLine / 2) * pencilTexture * 0.25 * (1 - l * 0.2);
              hatch += layerAmount;
            }
            baseVal -= hatch * bv * lineStrength;
          }
        } else {
          baseVal = bv;
          const smoothGray = smooth[j];
          const tone = (1 - smoothGray / 255) * 0.35 * lineDensity;
          baseVal = bv - tone * bv;

          if (pencilTexture > 0.01) {
            let hatch = 0;
            const layers = 2;
            for (let l = 0; l < layers; l++) {
              const spacing = 10 + l * 6;
              const ang = 0.5 + l * 0.6;
              const px = Math.sin(ang), py = Math.cos(ang);
              const offset = (x * px + y * py + l * 3) % spacing;
              const d = Math.min(offset, spacing - offset);
              const amount = Math.exp(-d * d / 3) * pencilTexture * 0.12 * tone * 3;
              hatch += amount;
            }
            baseVal -= hatch * bv;
          }
        }

        const paperNoise = (Math.random() - 0.5) * 10;
        const fiberNoise = (Math.sin(x * 0.35 + y * 0.25) * 0.5 + Math.random() * 0.5 - 0.25) * 5;
        const val = Math.max(150, Math.min(255, baseVal + paperNoise + fiberNoise));

        outData[i] = val;
        outData[i + 1] = val * 0.99;
        outData[i + 2] = val * 0.97;
        outData[i + 3] = 255;
      }
    }

    return out;
  }

  private buildExportCanvas(): HTMLCanvasElement {
    const shadowSize = 5;
    const padding = 6;
    const totalPad = shadowSize + padding;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvasWidth + totalPad * 2;
    exportCanvas.height = this.canvasHeight + totalPad * 2;
    const ectx = exportCanvas.getContext('2d')!;

    ectx.fillStyle = '#ffffff';
    ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    const shadowLayers = 4;
    for (let l = shadowLayers; l >= 1; l--) {
      const alpha = 0.04 * l;
      const blur = shadowSize * (l / shadowLayers);
      ectx.shadowColor = `rgba(0, 0, 0, ${alpha})`;
      ectx.shadowBlur = blur * 2.5;
      ectx.shadowOffsetX = 0;
      ectx.shadowOffsetY = blur * 0.4;
      ectx.fillStyle = '#ffffff';
      ectx.fillRect(
        totalPad,
        totalPad,
        this.canvasWidth,
        this.canvasHeight
      );
    }

    ectx.shadowColor = 'transparent';
    ectx.shadowBlur = 0;
    ectx.shadowOffsetX = 0;
    ectx.shadowOffsetY = 0;

    ectx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    ectx.lineWidth = 1;
    ectx.strokeRect(
      totalPad + 0.5,
      totalPad + 0.5,
      this.canvasWidth - 1,
      this.canvasHeight - 1
    );

    ectx.drawImage(
      this.filteredCanvas,
      totalPad,
      totalPad
    );

    return exportCanvas;
  }

  private savePNG(): void {
    if (!this.uploadedImage) {
      this.showToast('请先上传一张图片', 'error');
      return;
    }
    try {
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
    } catch {
      this.showToast('保存失败，请重试', 'error');
    }
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
          else reject(new Error('创建图片数据失败'));
        }, 'image/png');
      });

      const w = window as any;
      if (navigator.clipboard && w.ClipboardItem && typeof (navigator.clipboard as any).write === 'function') {
        await (navigator.clipboard as any).write([
          new w.ClipboardItem({ 'image/png': blob })
        ]);
        this.showToast('已复制到剪贴板', 'success');
      } else {
        throw new Error('当前浏览器不支持复制图片到剪贴板');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      this.showToast(
        '复制失败，请右键图片选择"保存图片"手动保存',
        'error',
        msg && msg !== '复制失败' ? msg : undefined
      );
    }
  }

  private showToast(message: string, type: 'success' | 'error', detail?: string): void {
    const existing = document.querySelector('.ast-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `ast-toast ast-toast-${type}`;

    const iconSvg = type === 'success'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

    const textWrap = document.createElement('div');
    textWrap.style.display = 'flex';
    textWrap.style.flexDirection = 'column';

    const mainText = document.createElement('span');
    mainText.textContent = message;
    textWrap.appendChild(mainText);

    if (detail) {
      const detailText = document.createElement('div');
      detailText.className = 'ast-toast-detail';
      detailText.textContent = detail;
      textWrap.appendChild(detailText);
    }

    toast.innerHTML = iconSvg;
    toast.appendChild(textWrap);
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }
}

export function createApp(container: HTMLElement): ArtStyleApp {
  return new ArtStyleApp(container);
}

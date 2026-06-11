import { BrushModel, BrushType, StrokeState } from './brush.js';
import { InkRenderer, animateInkPool } from './ink.js';
import {
  SealType,
  SealPlacement,
  SEAL_INFOS,
  drawSeal,
  drawSignature,
  renderSealPreview,
} from './seal.js';
import { composeForExport, downloadPNG } from './export.js';

const CANVAS_W = 800;
const CANVAS_H = 600;

class CalligraphyApp {
  private mainCanvas: HTMLCanvasElement;
  private mainCtx: CanvasRenderingContext2D;
  private inkPoolCanvas: HTMLCanvasElement;
  private sealModal: HTMLElement;
  private sealCursor: HTMLElement;
  private sealCursorCanvas: HTMLCanvasElement;

  private brush: BrushModel;
  private inkRenderer: InkRenderer;

  private isDrawing = false;
  private strokeState: StrokeState | null = null;
  private lastWidth = 0;
  private pressStartY = 0;

  private seals: SealPlacement[] = [];
  private pendingSealType: SealType | null = null;
  private placingSeal = false;

  private stopInkPoolAnim: (() => void) | null = null;

  constructor() {
    this.mainCanvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    this.mainCtx = this.mainCanvas.getContext('2d')!;
    this.inkPoolCanvas = document.getElementById('inkPoolCanvas') as HTMLCanvasElement;
    this.sealModal = document.getElementById('sealModal')!;
    this.sealCursor = document.getElementById('sealCursor')!;
    this.sealCursorCanvas = this.sealCursor.querySelector('canvas') as HTMLCanvasElement;

    this.brush = new BrushModel('wolf');
    this.inkRenderer = new InkRenderer(this.mainCtx, CANVAS_W, CANVAS_H);

    this.init();
  }

  private init(): void {
    this.stopInkPoolAnim = animateInkPool(this.inkPoolCanvas);
    this.setupBrushButtons();
    this.setupActionButtons();
    this.setupDrawingEvents();
    this.setupSealModal();
    this.setupButtonInkEffects();
    this.renderSealPreviews();
  }

  private setupBrushButtons(): void {
    document.querySelectorAll('.brush-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.brush-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const type = (btn as HTMLElement).dataset.brush as BrushType;
        this.brush.setType(type);
      });
    });
  }

  private setupActionButtons(): void {
    document.getElementById('clearBtn')!.addEventListener('click', () => {
      this.inkRenderer.clear();
      this.seals = [];
    });

    document.getElementById('sealBtn')!.addEventListener('click', () => {
      this.sealModal.classList.add('show');
    });

    document.getElementById('saveBtn')!.addEventListener('click', () => {
      this.handleSave();
    });

    document.getElementById('closeSealModal')!.addEventListener('click', () => {
      this.sealModal.classList.remove('show');
    });

    this.sealModal.addEventListener('click', (e) => {
      if (e.target === this.sealModal) {
        this.sealModal.classList.remove('show');
      }
    });
  }

  private setupDrawingEvents(): void {
    const getPos = (e: MouseEvent | Touch): { x: number; y: number } => {
      const rect = this.mainCanvas.getBoundingClientRect();
      const scaleX = this.mainCanvas.width / rect.width;
      const scaleY = this.mainCanvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const onDown = (x: number, y: number, clientY: number) => {
      if (this.placingSeal) {
        this.placeSeal(x, y);
        return;
      }

      this.isDrawing = true;
      this.pressStartY = clientY;
      this.strokeState = this.brush.createStrokeState(x, y);
      const w = this.brush.calculateStrokeWidth(this.strokeState.pressure);
      this.lastWidth = w;
      const porosity = this.brush.calculatePorosity(0);
      this.inkRenderer.addInkPoint(x, y, w, this.strokeState.pressure, porosity, this.brush);
    };

    const onMove = (x: number, y: number, clientY: number) => {
      if (this.placingSeal) {
        return;
      }

      if (!this.isDrawing || !this.strokeState) return;

      const pressureDelta = (this.pressStartY - clientY) * 0.003;
      const result = this.brush.updateStrokeState(this.strokeState, x, y, pressureDelta);
      const newWidth = result.width;

      this.inkRenderer.drawStrokeSegment(
        this.strokeState.lastX - result.dx,
        this.strokeState.lastY - result.dy,
        x, y,
        this.lastWidth, newWidth,
        this.strokeState.pressure,
        result.porosity,
        this.brush
      );

      this.inkRenderer.addInkPoint(x, y, newWidth, this.strokeState.pressure, result.porosity, this.brush);
      this.lastWidth = newWidth;
    };

    const onUp = () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      if (this.strokeState) {
        this.inkRenderer.finalizeStroke(this.brush);
        this.strokeState = null;
      }
    };

    this.mainCanvas.addEventListener('mousedown', (e) => {
      const pos = getPos(e);
      onDown(pos.x, pos.y, e.clientY);
    });

    this.mainCanvas.addEventListener('mousemove', (e) => {
      const pos = getPos(e);
      onMove(pos.x, pos.y, e.clientY);
    });

    window.addEventListener('mouseup', onUp);

    this.mainCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const pos = getPos(t);
        onDown(pos.x, pos.y, t.clientY);
      }
    }, { passive: false });

    this.mainCanvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const pos = getPos(t);
        onMove(pos.x, pos.y, t.clientY);
      }
    }, { passive: false });

    this.mainCanvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      onUp();
    });

    window.addEventListener('mousemove', (e) => {
      if (this.placingSeal) {
        this.sealCursor.style.left = e.clientX + 'px';
        this.sealCursor.style.top = e.clientY + 'px';
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.placingSeal) {
        this.cancelSealPlacement();
      }
    });
  }

  private setupSealModal(): void {
    document.querySelectorAll('.seal-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const type = (opt as HTMLElement).dataset.seal as SealType;
        this.startSealPlacement(type);
        this.sealModal.classList.remove('show');
      });
    });
  }

  private renderSealPreviews(): void {
    document.querySelectorAll('.seal-option').forEach((opt) => {
      const type = (opt as HTMLElement).dataset.seal as SealType;
      const canvas = opt.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) renderSealPreview(type, canvas);
    });
  }

  private startSealPlacement(type: SealType): void {
    this.pendingSealType = type;
    this.placingSeal = true;
    this.sealCursor.classList.add('show');

    const ctx = this.sealCursorCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.sealCursorCanvas.width, this.sealCursorCanvas.height);
    drawSeal(
      ctx,
      type,
      this.sealCursorCanvas.width / 2,
      this.sealCursorCanvas.height / 2,
      SEAL_INFOS[type].size,
      0.7
    );

    this.mainCanvas.style.cursor = 'none';
  }

  private placeSeal(x: number, y: number): void {
    if (!this.pendingSealType) return;

    const info = SEAL_INFOS[this.pendingSealType];
    this.seals.push({
      type: this.pendingSealType,
      x,
      y,
      size: info.size,
    });

    drawSeal(this.mainCtx, this.pendingSealType, x, y, info.size);
    this.cancelSealPlacement();
  }

  private cancelSealPlacement(): void {
    this.placingSeal = false;
    this.pendingSealType = null;
    this.sealCursor.classList.remove('show');
    this.mainCanvas.style.cursor = 'crosshair';
  }

  private handleSave(): void {
    const composite = this.inkRenderer.getCompositeCanvas();
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_W;
    exportCanvas.height = CANVAS_H;
    const ctx = exportCanvas.getContext('2d')!;
    ctx.drawImage(composite, 0, 0);

    for (const seal of this.seals) {
      drawSeal(ctx, seal.type, seal.x, seal.y, seal.size);
    }

    if (this.seals.length > 0) {
      const last = this.seals[this.seals.length - 1];
      drawSignature(ctx, last.x - 35, last.y + last.size / 2 + 8);
    }

    downloadPNG(exportCanvas);
  }

  private setupButtonInkEffects(): void {
    const applyInkEffect = (btn: HTMLElement) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--x', `${x}%`);
        btn.style.setProperty('--y', `${y}%`);
      });
    };

    document.querySelectorAll('.brush-btn, .action-btn').forEach((btn) => {
      applyInkEffect(btn as HTMLElement);
    });
  }

  destroy(): void {
    this.inkRenderer.destroy();
    if (this.stopInkPoolAnim) this.stopInkPoolAnim();
  }
}

let app: CalligraphyApp | null = null;

document.addEventListener('DOMContentLoaded', () => {
  app = new CalligraphyApp();
});

window.addEventListener('beforeunload', () => {
  if (app) app.destroy();
});

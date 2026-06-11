import { SealDesigner, CHAR_LIBRARY } from './sealDesigner';
import { SealEngraver } from './sealEngraver';
import { SealPreview, CarveMode } from './sealPreview';

const CANVAS_SIZE = 400;

class SealApp {
  private designer: SealDesigner;
  private engraver: SealEngraver;
  private preview: SealPreview;
  private carveMode: CarveMode = 'yang';
  private interactionMode: 'design' | 'carve' = 'carve';
  private animationId: number = 0;
  private lastFrameTime: number = 0;

  constructor() {
    const sealCanvas = document.getElementById('sealCanvas') as HTMLCanvasElement;
    const carveCanvas = document.getElementById('carveCanvas') as HTMLCanvasElement;
    const previewCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;

    this.designer = new SealDesigner(sealCanvas);
    this.engraver = new SealEngraver(carveCanvas);
    this.preview = new SealPreview(previewCanvas);

    this.initCharLibrary();
    this.initToolbar();
    this.initCanvasEvents();
    this.startRenderLoop();
  }

  private initCharLibrary(): void {
    const charList = document.getElementById('charList')!;
    for (const char of CHAR_LIBRARY) {
      const el = document.createElement('div');
      el.className = 'char-item';
      el.textContent = char;
      el.addEventListener('click', () => {
        document.querySelectorAll('.char-item').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        this.designer.addCharacter(char);
      });
      charList.appendChild(el);
    }
  }

  private initToolbar(): void {
    const sizeSlider = document.getElementById('sizeSlider') as HTMLInputElement;
    const sizeValue = document.getElementById('sizeValue')!;
    sizeSlider.addEventListener('input', () => {
      const size = parseInt(sizeSlider.value, 10);
      sizeValue.textContent = `${size}mm`;
      this.designer.setSealSize(size);
    });

    const roundKnife = document.getElementById('roundKnife')!;
    const squareKnife = document.getElementById('squareKnife')!;
    roundKnife.addEventListener('click', () => {
      this.engraver.setBrushType('round');
      roundKnife.classList.add('active');
      squareKnife.classList.remove('active');
    });
    squareKnife.addEventListener('click', () => {
      this.engraver.setBrushType('square');
      squareKnife.classList.add('active');
      roundKnife.classList.remove('active');
    });

    const modeToggle = document.getElementById('modeToggle')!;
    const yangLabel = modeToggle.querySelector('[data-mode="yang"]')!;
    const yinLabel = modeToggle.querySelector('[data-mode="yin"]')!;
    modeToggle.addEventListener('click', () => {
      if (this.carveMode === 'yang') {
        this.carveMode = 'yin';
        modeToggle.classList.add('yin');
        yangLabel.classList.remove('active');
        yinLabel.classList.add('active');
      } else {
        this.carveMode = 'yang';
        modeToggle.classList.remove('yin');
        yangLabel.classList.add('active');
        yinLabel.classList.remove('active');
      }
      this.preview.setMode(this.carveMode);
    });

    const stampBtn = document.getElementById('stampBtn')!;
    stampBtn.addEventListener('click', () => {
      this.performStamp();
    });

    const saveBtn = document.getElementById('saveBtn')!;
    saveBtn.addEventListener('click', () => {
      this.preview.saveAsPNG(this.designer.getSealSize());
    });

    const clearBtn = document.getElementById('clearBtn')!;
    clearBtn.addEventListener('click', () => {
      this.engraver.clearCarvings();
    });
  }

  private initCanvasEvents(): void {
    const carveCanvas = document.getElementById('carveCanvas') as HTMLCanvasElement;

    carveCanvas.addEventListener('mousedown', (e: MouseEvent) => {
      const rect = carveCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
      const my = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);

      if (this.designer.handleMouseDown(mx, my)) {
        this.interactionMode = 'design';
      } else {
        this.interactionMode = 'carve';
        this.engraver.startCarving(mx, my);
      }
    });

    carveCanvas.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = carveCanvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (CANVAS_SIZE / rect.width);
      const my = (e.clientY - rect.top) * (CANVAS_SIZE / rect.height);

      if (this.interactionMode === 'design') {
        this.designer.handleMouseMove(mx, my);
      } else {
        this.engraver.carve(mx, my);
      }
    });

    carveCanvas.addEventListener('mouseup', () => {
      if (this.interactionMode === 'design') {
        this.designer.handleMouseUp();
      } else {
        this.engraver.stopCarving();
      }
      this.interactionMode = 'carve';
    });

    carveCanvas.addEventListener('mouseleave', () => {
      if (this.interactionMode === 'design') {
        this.designer.handleMouseUp();
      } else {
        this.engraver.stopCarving();
      }
      this.interactionMode = 'carve';
    });

    carveCanvas.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = carveCanvas.getBoundingClientRect();
      const mx = (touch.clientX - rect.left) * (CANVAS_SIZE / rect.width);
      const my = (touch.clientY - rect.top) * (CANVAS_SIZE / rect.height);

      if (this.designer.handleMouseDown(mx, my)) {
        this.interactionMode = 'design';
      } else {
        this.interactionMode = 'carve';
        this.engraver.startCarving(mx, my);
      }
    }, { passive: false });

    carveCanvas.addEventListener('touchmove', (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = carveCanvas.getBoundingClientRect();
      const mx = (touch.clientX - rect.left) * (CANVAS_SIZE / rect.width);
      const my = (touch.clientY - rect.top) * (CANVAS_SIZE / rect.height);

      if (this.interactionMode === 'design') {
        this.designer.handleMouseMove(mx, my);
      } else {
        this.engraver.carve(mx, my);
      }
    }, { passive: false });

    carveCanvas.addEventListener('touchend', () => {
      if (this.interactionMode === 'design') {
        this.designer.handleMouseUp();
      } else {
        this.engraver.stopCarving();
      }
      this.interactionMode = 'carve';
    });
  }

  private performStamp(): void {
    const textItems = this.designer.getTextItems();
    const carvingPaths = this.engraver.getPaths();
    const sealSize = this.designer.getSealSize();
    const pxPerMm = this.designer.pixelsPerMm;
    this.preview.stamp(textItems, carvingPaths, sealSize, pxPerMm);
  }

  private startRenderLoop(): void {
    this.lastFrameTime = performance.now();
    const loop = (now: number) => {
      const dt = now - this.lastFrameTime;
      this.lastFrameTime = now;

      this.designer.render();
      this.engraver.updateParticles(dt);
      this.engraver.render();

      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new SealApp();
});

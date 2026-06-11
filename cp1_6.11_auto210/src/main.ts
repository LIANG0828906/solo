import { PixelDisplay, PixelColor } from './display';
import { Scanner, ScanMode } from './scanner';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 300;
const INITIAL_PIXEL_SIZE = 10;
const ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT;

const BLACK: PixelColor = { r: 0, g: 0, b: 0 };
const WHITE: PixelColor = { r: 255, g: 255, b: 255 };
const CYAN: PixelColor = { r: 0, g: 191, b: 255 };

const MODE_NAMES: Record<ScanMode, string> = {
  progressive: '逐行扫描',
  interlaced: '隔行扫描',
  fan: '扇形扫描'
};

class App {
  private canvas: HTMLCanvasElement;
  private display: PixelDisplay;
  private scanner: Scanner;
  private animationId: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;
  private frameCount: number = 0;
  private fpsTime: number = 0;
  private currentMode: ScanMode = 'progressive';
  private speed: number = 10;
  private pixelSize: number = INITIAL_PIXEL_SIZE;

  private modeButtons: NodeListOf<HTMLButtonElement>;
  private speedSlider: HTMLInputElement;
  private speedValue: HTMLElement;
  private speedUnit: HTMLElement;
  private pixelSlider: HTMLInputElement;
  private pixelValue: HTMLElement;
  private scanModeEl: HTMLElement;
  private scanProgressEl: HTMLElement;
  private fpsCounterEl: HTMLElement;
  private pixelChangesEl: HTMLElement;
  private canvasWrapper: HTMLElement;

  constructor() {
    this.canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
    if (!this.canvas) throw new Error('Canvas element not found');
    
    this.canvasWrapper = document.querySelector('.canvas-wrapper') as HTMLElement;

    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.display = new PixelDisplay(this.canvas, INITIAL_PIXEL_SIZE);
    this.scanner = new Scanner(
      this.display.getCols(),
      this.display.getRows(),
      INITIAL_PIXEL_SIZE,
      'progressive'
    );

    this.modeButtons = document.querySelectorAll('.mode-btn');
    this.speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    this.speedValue = document.getElementById('speedValue') as HTMLElement;
    this.speedUnit = document.getElementById('speedUnit') as HTMLElement;
    this.pixelSlider = document.getElementById('pixelSlider') as HTMLInputElement;
    this.pixelValue = document.getElementById('pixelValue') as HTMLElement;
    this.scanModeEl = document.getElementById('scanMode') as HTMLElement;
    this.scanProgressEl = document.getElementById('scanProgress') as HTMLElement;
    this.fpsCounterEl = document.getElementById('fpsCounter') as HTMLElement;
    this.pixelChangesEl = document.getElementById('pixelChanges') as HTMLElement;

    this.setupEventListeners();
    this.handleResize();
    this.updateUI();
    this.start();
  }

  private setupEventListeners(): void {
    this.modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode as ScanMode;
        this.setMode(mode);
      });
    });

    this.speedSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.speed = parseInt(target.value, 10);
      this.scanner.setSpeed(this.speed);
      this.speedValue.textContent = target.value;
    });

    this.pixelSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.pixelSize = parseInt(target.value, 10);
      this.pixelValue.textContent = target.value;
      this.resizePixels();
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  private setMode(mode: ScanMode): void {
    this.currentMode = mode;
    this.scanner.setMode(mode);
    this.display.reset();

    this.modeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'progressive') {
      this.speedSlider.min = '1';
      this.speedSlider.max = '20';
      this.speedSlider.value = '10';
      this.speed = 10;
      this.speedUnit.textContent = '行/帧';
    } else if (mode === 'interlaced') {
      this.speedSlider.min = '1';
      this.speedSlider.max = '10';
      this.speedSlider.value = '5';
      this.speed = 5;
      this.speedUnit.textContent = '行/帧';
    } else if (mode === 'fan') {
      this.speedSlider.min = '1';
      this.speedSlider.max = '5';
      this.speedSlider.value = '1';
      this.speed = 1;
      this.speedUnit.textContent = '圈/帧';
      this.display.setRippleColor(CYAN);
    }

    this.scanner.setSpeed(this.speed);
    this.speedValue.textContent = this.speed.toString();
    this.updateUI();
  }

  private resizePixels(): void {
    this.display.setPixelSize(this.pixelSize);
    this.scanner.setDimensions(this.display.getCols(), this.display.getRows());
    this.scanner.setPixelSize(this.pixelSize);
  }

  private handleResize(): void {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    const maxWidth = windowWidth * 0.6;
    const maxHeight = windowHeight * 0.6;
    
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / ASPECT_RATIO;
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * ASPECT_RATIO;
    }
    
    this.canvas.style.width = displayWidth + 'px';
    this.canvas.style.height = displayHeight + 'px';
  }

  private updateUI(): void {
    this.scanModeEl.textContent = MODE_NAMES[this.currentMode];
    this.scanProgressEl.textContent = this.scanner.getProgress().toFixed(2) + '%';
    this.fpsCounterEl.textContent = Math.round(this.fps) + ' FPS';
    this.pixelChangesEl.textContent = this.display.getPixelChangeCount().toLocaleString();
  }

  private start(): void {
    this.lastTime = performance.now();
    this.fpsTime = this.lastTime;
    this.loop();
  }

  private loop = (): void => {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.frameCount++;
    if (currentTime - this.fpsTime >= 500) {
      this.fps = this.frameCount * 1000 / (currentTime - this.fpsTime);
      this.frameCount = 0;
      this.fpsTime = currentTime;
    }

    const scanState = this.scanner.step();

    if (scanState.affectedPixels.length > 0) {
      const color = this.getScanColor();
      const fadeDuration = this.getFadeDuration();

      if (this.currentMode === 'fan') {
        this.display.addRippleRing(scanState.affectedPixels, 1.0);
      } else {
        for (const idx of scanState.affectedPixels) {
          this.display.setPixelOverlay(idx, color, fadeDuration);
        }
      }
    }

    if (scanState.isComplete) {
      this.scanner.reset();
    }

    this.display.update(deltaTime);
    this.display.render();

    this.updateUI();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private getScanColor(): PixelColor {
    switch (this.currentMode) {
      case 'progressive':
        return BLACK;
      case 'interlaced':
        return WHITE;
      case 'fan':
        return CYAN;
      default:
        return BLACK;
    }
  }

  private getFadeDuration(): number {
    return 200;
  }

  public stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App();
});

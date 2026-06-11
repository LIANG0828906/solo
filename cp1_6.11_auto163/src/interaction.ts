import { FoldEngine } from './foldEngine';

export class InteractionManager {
  private engine: FoldEngine;
  private canvas: HTMLCanvasElement;
  private startBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private progressSlider: HTMLInputElement;
  private stepLabel: HTMLElement;
  private stepCounter: HTMLElement;
  
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private rotationSensitivity: number = 0.005;

  private onFoldStartCallback: (() => void) | null = null;
  private onFoldCompleteCallback: (() => void) | null = null;
  private onResetCallback: (() => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    engine: FoldEngine,
    startBtn: HTMLButtonElement,
    resetBtn: HTMLButtonElement,
    progressSlider: HTMLInputElement,
    stepLabel: HTMLElement,
    stepCounter: HTMLElement
  ) {
    this.canvas = canvas;
    this.engine = engine;
    this.startBtn = startBtn;
    this.resetBtn = resetBtn;
    this.progressSlider = progressSlider;
    this.stepLabel = stepLabel;
    this.stepCounter = stepCounter;

    this.bindEvents();
    this.updateUI();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    this.startBtn.addEventListener('click', this.onStartClick.bind(this));
    this.resetBtn.addEventListener('click', this.onResetClick.bind(this));

    this.progressSlider.addEventListener('input', this.onSliderInput.bind(this));
    this.progressSlider.addEventListener('change', this.onSliderChange.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.canvas.style.cursor = 'grabbing';
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastMouseX;
    this.lastMouseX = e.clientX;

    const currentRotation = this.engine.getRotationY();
    const newRotation = currentRotation + deltaX * this.rotationSensitivity;
    this.engine.setRotationY(newRotation);
  }

  private onMouseUp(): void {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }

  private onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
    }
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this.lastMouseX;
    this.lastMouseX = e.touches[0].clientX;

    const currentRotation = this.engine.getRotationY();
    const newRotation = currentRotation + deltaX * this.rotationSensitivity;
    this.engine.setRotationY(newRotation);
  }

  private onTouchEnd(): void {
    this.isDragging = false;
  }

  private onStartClick(): void {
    if (!this.engine.canFold()) return;
    if (this.engine.getCurrentStep() === 0) {
      this.engine.startFolding();
      this.onFoldStartCallback?.();
    } else {
      this.engine.startFolding();
    }
  }

  private onResetClick(): void {
    this.engine.reset();
    this.updateUI();
    this.onResetCallback?.();
  }

  private onSliderInput(e: Event): void {
    const value = parseFloat((e.target as HTMLInputElement).value);
    this.engine.setProgress(value);
    this.updateUI();
  }

  private onSliderChange(): void {
  }

  public updateUI(): void {
    const progress = this.engine.getProgress();
    const currentStep = this.engine.getCurrentStep();
    const totalSteps = this.engine.getTotalSteps();
    const stepName = this.engine.getCurrentStepName();

    this.progressSlider.value = progress.toString();
    this.stepLabel.textContent = stepName;
    this.stepCounter.textContent = currentStep.toString();

    if (this.engine.isFolding() || !this.engine.canFold()) {
      this.startBtn.classList.add('folding');
    } else {
      this.startBtn.classList.remove('folding');
    }

    if (currentStep >= totalSteps) {
      this.startBtn.textContent = '折叠完成';
    } else if (currentStep > 0) {
      this.startBtn.textContent = '继续折叠';
    } else {
      this.startBtn.textContent = '开始折叠';
    }
  }

  public setOnFoldStart(callback: () => void): void {
    this.onFoldStartCallback = callback;
  }

  public setOnFoldComplete(callback: () => void): void {
    this.onFoldCompleteCallback = callback;
  }

  public setOnReset(callback: () => void): void {
    this.onResetCallback = callback;
  }
}

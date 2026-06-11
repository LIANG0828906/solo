import * as THREE from 'three';

interface DrawStroke {
  points: THREE.Vector3[];
  color: THREE.Color;
  timestamp: number;
}

type DrawCallback = (point: THREE.Vector3) => void;
type StrokeEndCallback = (stroke: DrawStroke) => void;

class DrawingTool {
  private camera: THREE.Camera;
  private domElement: HTMLElement;
  private onDraw: DrawCallback;
  private onStrokeEnd?: StrokeEndCallback;
  private enabled: boolean = true;
  private isDrawing: boolean = false;

  private raycaster: THREE.Raycaster;
  private drawPlane: THREE.Plane;
  private currentStrokePoints: THREE.Vector3[] = [];
  private currentColor: THREE.Color = new THREE.Color('#FFD700');
  private strokes: DrawStroke[] = [];
  private maxUndoSteps: number = 10;

  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;

  private lastDrawTime: number = 0;
  private minDrawInterval: number = 16;

  constructor(
    camera: THREE.Camera,
    domElement: HTMLElement,
    onDraw: DrawCallback,
    onStrokeEnd?: StrokeEndCallback
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.onDraw = onDraw;
    this.onStrokeEnd = onStrokeEnd;

    this.raycaster = new THREE.Raycaster();
    this.drawPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);

    domElement.addEventListener('mousedown', this.boundMouseDown);
    domElement.addEventListener('mousemove', this.boundMouseMove);
    domElement.addEventListener('mouseup', this.boundMouseUp);
    domElement.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    domElement.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    domElement.addEventListener('touchend', this.boundTouchEnd);
  }

  private screenTo3D(clientX: number, clientY: number): THREE.Vector3 | null {
    const rect = this.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, this.camera);

    const target = new THREE.Vector3();
    const hit = this.raycaster.ray.intersectPlane(this.drawPlane, target);
    return hit;
  }

  private handleMouseDown(e: MouseEvent): void {
    if (!this.enabled || e.button !== 0) return;
    this.startDrawing(e.clientX, e.clientY);
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDrawing || !this.enabled) return;
    this.continueDrawing(e.clientX, e.clientY);
  }

  private handleMouseUp(e: MouseEvent): void {
    if (!this.isDrawing) return;
    this.stopDrawing();
  }

  private handleTouchStart(e: TouchEvent): void {
    if (!this.enabled) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.startDrawing(touch.clientX, touch.clientY);
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDrawing || !this.enabled) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.continueDrawing(touch.clientX, touch.clientY);
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.isDrawing) return;
    this.stopDrawing();
  }

  private startDrawing(clientX: number, clientY: number): void {
    const point = this.screenTo3D(clientX, clientY);
    if (!point) return;

    this.isDrawing = true;
    this.currentStrokePoints = [point];
    this.onDraw(point);
    this.lastDrawTime = performance.now();
  }

  private continueDrawing(clientX: number, clientY: number): void {
    const now = performance.now();
    if (now - this.lastDrawTime < this.minDrawInterval) return;

    const point = this.screenTo3D(clientX, clientY);
    if (!point) return;

    this.currentStrokePoints.push(point);
    this.onDraw(point);
    this.lastDrawTime = now;
  }

  private stopDrawing(): void {
    this.isDrawing = false;

    if (this.currentStrokePoints.length > 0) {
      const stroke: DrawStroke = {
        points: [...this.currentStrokePoints],
        color: this.currentColor.clone(),
        timestamp: performance.now() / 1000,
      };

      this.strokes.push(stroke);
      if (this.strokes.length > this.maxUndoSteps) {
        this.strokes.shift();
      }

      if (this.onStrokeEnd) {
        this.onStrokeEnd(stroke);
      }
    }

    this.currentStrokePoints = [];
  }

  setColor(color: THREE.Color): void {
    this.currentColor = color;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled && this.isDrawing) {
      this.stopDrawing();
    }
  }

  getIsDrawing(): boolean {
    return this.isDrawing;
  }

  undo(): DrawStroke | null {
    if (this.strokes.length === 0) return null;
    return this.strokes.pop()!;
  }

  getLastStroke(): DrawStroke | null {
    return this.strokes.length > 0 ? this.strokes[this.strokes.length - 1] : null;
  }

  getStrokes(): DrawStroke[] {
    return [...this.strokes];
  }

  clearStrokes(): void {
    this.strokes = [];
    this.currentStrokePoints = [];
  }

  setDrawPlane(normal: THREE.Vector3, constant: number): void {
    this.drawPlane.set(normal, constant);
  }

  dispose(): void {
    this.domElement.removeEventListener('mousedown', this.boundMouseDown);
    this.domElement.removeEventListener('mousemove', this.boundMouseMove);
    this.domElement.removeEventListener('mouseup', this.boundMouseUp);
    this.domElement.removeEventListener('touchstart', this.boundTouchStart);
    this.domElement.removeEventListener('touchmove', this.boundTouchMove);
    this.domElement.removeEventListener('touchend', this.boundTouchEnd);
  }
}

export { DrawingTool, DrawStroke };

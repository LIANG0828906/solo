import { Particle, FluidType } from '../physics/Particle';
import { SPHParams } from '../physics/SPHSolver';
import { Vec2 } from '../physics/Particle';

export interface UIEmitState {
  emit: boolean;
  type: FluidType | null;
  position: Vec2;
  velocity: Vec2;
  emitRate: number;
  particleRadius: number;
}

export class UIHandler {
  public params: SPHParams & { emitRate: number };
  public emitState: UIEmitState;

  private canvas: HTMLCanvasElement;
  private mouse: { x: number; y: number; prevX: number; prevY: number };
  private leftDown: boolean = false;
  private rightDown: boolean = false;
  private draggingPolygonIndex: number = -1;
  private polygonDragOffset: Vec2 = { x: 0, y: 0 };

  public onPolygonDragStart: ((index: number) => void) | null = null;
  public onPolygonDragMove: ((index: number, pos: Vec2) => void) | null = null;
  public onPolygonDragEnd: ((index: number) => void) | null = null;
  public onHitTest: ((x: number, y: number) => number) | null = null;
  public onGetPolygonCenter: ((index: number) => Vec2) | null = null;

  private hudCountEl: HTMLElement;
  private hudFpsEl: HTMLElement;
  private toolbarEl: HTMLElement;
  private toolbarToggleEl: HTMLElement;

  constructor(canvas: HTMLCanvasElement, initialParams: SPHParams & { emitRate: number }) {
    this.canvas = canvas;
    this.params = { ...initialParams };
    this.mouse = { x: 0, y: 0, prevX: 0, prevY: 0 };
    this.emitState = {
      emit: false,
      type: null,
      position: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      emitRate: this.params.emitRate,
      particleRadius: this.params.particleRadius,
    };

    this.hudCountEl = document.getElementById('particle-count')!;
    this.hudFpsEl = document.getElementById('fps')!;
    this.toolbarEl = document.getElementById('toolbar')!;
    this.toolbarToggleEl = document.getElementById('toolbar-toggle')!;

    this.bindSlider('gravity', 'gravity-value', 'gravity');
    this.bindSlider('viscosity', 'viscosity-value', 'viscosity');
    this.bindSlider('size', 'size-value', 'particleRadius');
    this.bindSlider('emit', 'emit-value', 'emitRate');

    this.bindMouse();
    this.bindToolbar();
    this.handleResponsive();
    window.addEventListener('resize', () => this.handleResponsive());
  }

  public updateHUD(count: number, fps: number): void {
    this.hudCountEl.textContent = String(count);
    const rounded = Math.round(fps);
    this.hudFpsEl.textContent = String(rounded);
    if (fps < 30) {
      this.hudFpsEl.classList.add('low');
    } else {
      this.hudFpsEl.classList.remove('low');
    }
  }

  public tick(): Particle[] {
    this.emitState.emitRate = this.params.emitRate;
    this.emitState.particleRadius = this.params.particleRadius;

    const newParticles: Particle[] = [];
    if (this.emitState.emit && this.emitState.type) {
      for (let i = 0; i < this.emitState.emitRate; i++) {
        const jitterX = (Math.random() - 0.5) * 10;
        const jitterY = (Math.random() - 0.5) * 10;
        const speedJitter = 0.7 + Math.random() * 0.6;
        newParticles.push(
          new Particle(
            this.emitState.position.x + jitterX,
            this.emitState.position.y + jitterY,
            this.emitState.velocity.x * speedJitter,
            this.emitState.velocity.y * speedJitter,
            this.emitState.type,
            this.emitState.particleRadius
          )
        );
      }
    }
    return newParticles;
  }

  private bindSlider(sliderId: string, valueId: string, paramKey: keyof (SPHParams & { emitRate: number })): void {
    const slider = document.getElementById(sliderId) as HTMLInputElement;
    const valueEl = document.getElementById(valueId)!;

    const update = () => {
      const val = parseFloat(slider.value);
      this.params[paramKey] = val;
      this.emitState.emitRate = this.params.emitRate;
      this.emitState.particleRadius = this.params.particleRadius;
      valueEl.textContent = slider.value;
    };

    slider.addEventListener('input', update);
    update();
  }

  private bindMouse(): void {
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      this.mouse.x = x;
      this.mouse.y = y;
      this.mouse.prevX = x;
      this.mouse.prevY = y;

      if (e.button === 2 || e.button === 0) {
        const hitIndex = this.onHitTest ? this.onHitTest(x, y) : -1;
        if (hitIndex >= 0 && e.button === 0) {
          this.draggingPolygonIndex = hitIndex;
          const center = this.onGetPolygonCenter ? this.onGetPolygonCenter(hitIndex) : { x, y };
          this.polygonDragOffset.x = center.x - x;
          this.polygonDragOffset.y = center.y - y;
          if (this.onPolygonDragStart) this.onPolygonDragStart(hitIndex);
          return;
        }
      }

      if (e.button === 0) {
        this.leftDown = true;
        this.emitState.emit = true;
        this.emitState.type = 'water';
      } else if (e.button === 2) {
        this.rightDown = true;
        this.emitState.emit = true;
        this.emitState.type = 'smoke';
      }

      this.emitState.position.x = x;
      this.emitState.position.y = y;
      this.emitState.velocity.x = 0;
      this.emitState.velocity.y = 0;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);

      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;
      this.mouse.x = x;
      this.mouse.y = y;

      if (this.draggingPolygonIndex >= 0) {
        if (this.onPolygonDragMove) {
          this.onPolygonDragMove(this.draggingPolygonIndex, {
            x: x + this.polygonDragOffset.x,
            y: y + this.polygonDragOffset.y,
          });
        }
        return;
      }

      this.emitState.position.x = x;
      this.emitState.position.y = y;

      const vx = (this.mouse.x - this.mouse.prevX) * 4;
      const vy = (this.mouse.y - this.mouse.prevY) * 4;

      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 20) {
        this.emitState.velocity.x = vx;
        this.emitState.velocity.y = vy;
      } else if (speed > 1) {
        const norm = 25 / speed;
        this.emitState.velocity.x = vx * norm;
        this.emitState.velocity.y = vy * norm;
      } else {
        this.emitState.velocity.x = 0;
        this.emitState.velocity.y = this.emitState.type === 'smoke' ? -30 : 60;
      }
    });

    const endDrag = (e: MouseEvent) => {
      if (e.button === 0) {
        this.leftDown = false;
        if (this.draggingPolygonIndex >= 0) {
          if (this.onPolygonDragEnd) this.onPolygonDragEnd(this.draggingPolygonIndex);
          this.draggingPolygonIndex = -1;
        }
      } else if (e.button === 2) {
        this.rightDown = false;
      }

      if (!this.leftDown && !this.rightDown) {
        this.emitState.emit = false;
        this.emitState.type = null;
      } else if (e.button === 0 && this.rightDown) {
        this.emitState.type = 'smoke';
      } else if (e.button === 2 && this.leftDown) {
        this.emitState.type = 'water';
      }
    };

    this.canvas.addEventListener('mouseup', endDrag);
    this.canvas.addEventListener('mouseleave', (e) => {
      endDrag(e as unknown as MouseEvent);
      this.draggingPolygonIndex = -1;
    });
  }

  private bindToolbar(): void {
    this.toolbarToggleEl.addEventListener('click', () => {
      const isExpanded = this.toolbarEl.classList.contains('expanded');
      if (isExpanded) {
        this.toolbarEl.classList.remove('expanded');
      } else {
        this.toolbarEl.classList.add('expanded');
      }
    });
  }

  private handleResponsive(): void {
    const width = window.innerWidth;
    if (width <= 768) {
      this.toolbarToggleEl.classList.add('visible');
      this.toolbarEl.classList.remove('expanded');
    } else {
      this.toolbarToggleEl.classList.remove('visible');
      this.toolbarEl.classList.remove('collapsed');
      this.toolbarEl.classList.remove('expanded');
    }
  }

  public isDraggingPolygon(): boolean {
    return this.draggingPolygonIndex >= 0;
  }
}

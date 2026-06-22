import * as THREE from 'three';
import { Raft } from './raft';

export interface InteractionState {
  isPoling: boolean;
  poleAngle: number;
  poleForce: number;
  mouseX: number;
  mouseY: number;
  isDragging: boolean;
  shiftHeld: boolean;
  spaceHeld: boolean;
}

export class Interaction {
  public state: InteractionState;
  private keyStates: Map<string, boolean> = new Map();
  private onPoleCallback: ((angle: number, force: number) => void) | null = null;
  private onResetCallback: (() => void) | null = null;
  private onVortexEscapeCallback: ((reverse: boolean) => void) | null = null;
  private forceBuildup: number = 0;
  private forceDirection: number = 0;
  private poleAngleDisplay: number = 0;

  constructor(private raft: Raft) {
    this.state = {
      isPoling: false,
      poleAngle: 0,
      poleForce: 0,
      mouseX: 0,
      mouseY: 0,
      isDragging: false,
      shiftHeld: false,
      spaceHeld: false
    };

    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
    this.setupAngleMarks();
  }

  private setupKeyboard(): void {
    window.addEventListener('keydown', (e) => {
      this.keyStates.set(e.code, true);

      if (e.code === 'Space') {
        e.preventDefault();
        this.state.spaceHeld = true;
        this.forceBuildup = Math.min(this.forceBuildup + 0.05, 1.0);
      }

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.state.shiftHeld = true;
      }

      if (e.code === 'KeyR') {
        if (this.onResetCallback) this.onResetCallback();
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        if (this.raft.state.inVortex) {
          if (this.onVortexEscapeCallback) this.onVortexEscapeCallback(true);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyStates.set(e.code, false);

      if (e.code === 'Space') {
        e.preventDefault();
        this.state.spaceHeld = false;
        if (this.forceBuildup > 0.1 && this.onPoleCallback) {
          const angle = this.state.poleAngle;
          const force = this.forceBuildup;
          this.onPoleCallback(angle, force);
          this.raft.pole(angle, force);
        }
        this.forceBuildup = 0;
      }

      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.state.shiftHeld = false;
      }
    });
  }

  private setupMouse(): void {
    const canvas = document.getElementById('canvas-container');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      this.state.isDragging = true;
      this.state.mouseX = e.clientX;
      this.state.mouseY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.state.isDragging) {
        const dx = e.clientX - this.state.mouseX;
        this.state.poleAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, dx * 0.005));

        if (this.state.shiftHeld) {
          this.state.poleAngle = Math.sign(dx) * Math.PI / 4;
        }

        this.state.mouseX = e.clientX;
        this.state.mouseY = e.clientY;
      }
    });

    canvas.addEventListener('mouseup', () => {
      this.state.isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
    }, { passive: false });
  }

  private setupTouch(): void {
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const angleFill = document.getElementById('angle-fill');

    if (btnLeft) {
      let interval: number | null = null;
      btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.state.poleAngle = -Math.PI / 6;
        this.forceBuildup = 0.5;
        if (this.onPoleCallback) this.onPoleCallback(-Math.PI / 6, 0.5);
        this.raft.pole(-Math.PI / 6, 0.5);
        interval = window.setInterval(() => {
          this.state.poleAngle = -Math.PI / 6;
          this.forceBuildup = 0.3;
          if (this.onPoleCallback) this.onPoleCallback(-Math.PI / 6, 0.3);
          this.raft.pole(-Math.PI / 6, 0.3);
        }, 500);
      });
      btnLeft.addEventListener('touchend', () => {
        if (interval) { clearInterval(interval); interval = null; }
      });
    }

    if (btnRight) {
      let interval: number | null = null;
      btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.state.poleAngle = Math.PI / 6;
        this.forceBuildup = 0.5;
        if (this.onPoleCallback) this.onPoleCallback(Math.PI / 6, 0.5);
        this.raft.pole(Math.PI / 6, 0.5);
        interval = window.setInterval(() => {
          this.state.poleAngle = Math.PI / 6;
          this.forceBuildup = 0.3;
          if (this.onPoleCallback) this.onPoleCallback(Math.PI / 6, 0.3);
          this.raft.pole(Math.PI / 6, 0.3);
        }, 500);
      });
      btnRight.addEventListener('touchend', () => {
        if (interval) { clearInterval(interval); interval = null; }
      });
    }
  }

  private setupAngleMarks(): void {
    const svg = document.querySelector('#pole-ring .angle-marks') as SVGElement;
    if (!svg) return;
    svg.innerHTML = '';
    const cx = 80, cy = 80, r = 70;
    for (let deg = 0; deg <= 90; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const x1 = cx + Math.cos(rad - Math.PI / 2) * r;
      const y1 = cy + Math.sin(rad - Math.PI / 2) * r;
      const x2 = cx + Math.cos(rad - Math.PI / 2) * (r - 8);
      const y2 = cy + Math.sin(rad - Math.PI / 2) * (r - 8);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', '#8B4513');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);

      if (deg % 30 === 0) {
        const tx = cx + Math.cos(rad - Math.PI / 2) * (r - 16);
        const ty = cy + Math.sin(rad - Math.PI / 2) * (r - 16);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', String(tx));
        text.setAttribute('y', String(ty));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('fill', '#2E4A2E');
        text.setAttribute('font-size', '10');
        text.textContent = String(deg);
        svg.appendChild(text);
      }
    }

    for (let deg = -90; deg < 0; deg += 10) {
      const rad = (deg * Math.PI) / 180;
      const x1 = cx + Math.cos(rad - Math.PI / 2) * r;
      const y1 = cy + Math.sin(rad - Math.PI / 2) * r;
      const x2 = cx + Math.cos(rad - Math.PI / 2) * (r - 8);
      const y2 = cy + Math.sin(rad - Math.PI / 2) * (r - 8);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(x1));
      line.setAttribute('y1', String(y1));
      line.setAttribute('x2', String(x2));
      line.setAttribute('y2', String(y2));
      line.setAttribute('stroke', '#8B4513');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
    }
  }

  onPole(callback: (angle: number, force: number) => void): void {
    this.onPoleCallback = callback;
  }

  onReset(callback: () => void): void {
    this.onResetCallback = callback;
  }

  onVortexEscape(callback: (reverse: boolean) => void): void {
    this.onVortexEscapeCallback = callback;
  }

  update(delta: number): void {
    if (this.state.spaceHeld) {
      this.forceBuildup = Math.min(this.forceBuildup + delta * 0.8, 1.0);
    }

    this.poleAngleDisplay = this.state.poleAngle * 180 / Math.PI;

    const forceText = document.getElementById('force-text');
    if (forceText) {
      forceText.textContent = Math.round(this.forceBuildup * 100) + '%';
    }

    const angleFill = document.getElementById('angle-fill');
    if (angleFill) {
      const normalizedAngle = (this.poleAngleDisplay + 90) / 180 * 100;
      angleFill.style.width = normalizedAngle + '%';
    }

    const statSpeed = document.getElementById('stat-speed');
    if (statSpeed) {
      statSpeed.textContent = this.raft.state.speed.toFixed(1) + ' 单位/秒';
    }

    const statDirection = document.getElementById('stat-direction');
    if (statDirection) {
      statDirection.textContent = Math.round(this.raft.state.rotation * 180 / Math.PI) + '°';
    }

    const statObstacle = document.getElementById('stat-obstacle');
    if (statObstacle) {
      const dist = this.raft['river'].getClosestObstacleDistance(this.raft.state.position);
      statObstacle.textContent = dist < 20 ? dist.toFixed(1) + ' 单位' : '--';
    }

    const statCollisions = document.getElementById('stat-collisions');
    if (statCollisions) {
      statCollisions.textContent = String(this.raft.state.collisionCount);
    }

    const statPoles = document.getElementById('stat-poles');
    if (statPoles) {
      statPoles.textContent = String(this.raft.state.poleCount);
    }

    const statDistance = document.getElementById('stat-distance');
    if (statDistance) {
      statDistance.textContent = this.raft.getDistance() + '里';
    }

    const blurOverlay = document.getElementById('blur-overlay');
    if (blurOverlay) {
      const blurAmount = this.raft.state.isPoling ? Math.min(4, this.raft.state.poleForce * 4) : 0;
      (blurOverlay as HTMLElement).style.boxShadow = `inset 0 0 ${blurAmount}px ${blurAmount / 2}px rgba(212, 230, 241, ${blurAmount * 0.1})`;
    }
  }
}

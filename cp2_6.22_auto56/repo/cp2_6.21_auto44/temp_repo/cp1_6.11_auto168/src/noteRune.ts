export interface SymbolPath {
  type: 'line' | 'arc' | 'circle';
  x1: number; y1: number;
  x2?: number; y2?: number;
  r?: number;
  startAngle?: number;
  endAngle?: number;
}

export interface ParticleKeyframe {
  t: number;
  spread: number;
  speed: number;
  alpha: number;
}

export interface Rune {
  id: 'do' | 're' | 'mi' | 'fa' | 'sol' | 'la' | 'ti';
  pitch: number;
  color: string;
  symbol: SymbolPath[];
  particleTemplate: ParticleKeyframe[];
}

export interface RunePosition {
  rune: Rune;
  cx: number;
  cy: number;
  radius: number;
  angleDeg: number;
}

export const RUNES: Rune[] = [
  {
    id: 'do',
    pitch: 60,
    color: '#FF4466',
    symbol: [
      { type: 'circle', x1: 0, y1: -6, r: 4 },
      { type: 'line', x1: 0, y1: -2, x2: 0, y2: 10 },
      { type: 'arc', x1: 0, y1: 10, r: 6, startAngle: 0, endAngle: Math.PI }
    ],
    particleTemplate: [
      { t: 0, spread: 0.2, speed: 1.0, alpha: 1.0 },
      { t: 0.5, spread: 0.7, speed: 0.6, alpha: 0.7 },
      { t: 1, spread: 1.0, speed: 0.0, alpha: 0.0 }
    ]
  },
  {
    id: 're',
    pitch: 62,
    color: '#FF8844',
    symbol: [
      { type: 'line', x1: -8, y1: -8, x2: 8, y2: -8 },
      { type: 'line', x1: -8, y1: -8, x2: -8, y2: 8 },
      { type: 'line', x1: -8, y1: 0, x2: 6, y2: 0 },
      { type: 'arc', x1: 6, y1: 4, r: 4, startAngle: -Math.PI / 2, endAngle: Math.PI }
    ],
    particleTemplate: [
      { t: 0, spread: 0.2, speed: 1.1, alpha: 1.0 },
      { t: 0.5, spread: 0.75, speed: 0.55, alpha: 0.72 },
      { t: 1, spread: 1.0, speed: 0.0, alpha: 0.0 }
    ]
  },
  {
    id: 'mi',
    pitch: 64,
    color: '#FFCC44',
    symbol: [
      { type: 'line', x1: -6, y1: -10, x2: 6, y2: -10 },
      { type: 'line', x1: -6, y1: 0, x2: 6, y2: 0 },
      { type: 'line', x1: -6, y1: 10, x2: 6, y2: 10 },
      { type: 'line', x1: 0, y1: -10, x2: 0, y2: 10 }
    ],
    particleTemplate: [
      { t: 0, spread: 0.2, speed: 1.2, alpha: 1.0 },
      { t: 0.5, spread: 0.8, speed: 0.5, alpha: 0.75 },
      { t: 1, spread: 1.0, speed: 0.0, alpha: 0.0 }
    ]
  },
  {
    id: 'fa',
    pitch: 65,
    color: '#44CC88',
    symbol: [
      { type: 'line', x1: -2, y1: -12, x2: -2, y2: 10 },
      { type: 'line', x1: -8, y1: -6, x2: 6, y2: -6 },
      { type: 'arc', x1: 2, y1: 4, r: 6, startAngle: Math.PI, endAngle: 2 * Math.PI }
    ],
    particleTemplate: [
      { t: 0, spread: 0.2, speed: 1.25, alpha: 1.0 },
      { t: 0.5, spread: 0.82, speed: 0.48, alpha: 0.77 },
      { t: 1, spread: 1.0, speed: 0.0, alpha: 0.0 }
    ]
  },
  {
    id: 'sol',
    pitch: 67,
    color: '#44AAFF',
    symbol: [
      { type: 'circle', x1: 0, y1: 4, r: 6 },
      { type: 'line', x1: 6, y1: 4, x2: 6, y2: -10 },
      { type: 'arc', x1: 0, y1: -10, r: 6, startAngle: 0, endAngle: Math.PI }
    ],
    particleTemplate: [
      { t: 0, spread: 0.2, speed: 1.3, alpha: 1.0 },
      { t: 0.5, spread: 0.85, speed: 0.45, alpha: 0.8 },
      { t: 1, spread: 1.0, speed: 0.0, alpha: 0.0 }
    ]
  },
  {
    id: 'la',
    pitch: 69,
    color: '#8844FF',
    symbol: [
      { type: 'line', x1: 0, y1: -12, x2: -8, y2: 8 },
      { type: 'line', x1: 0, y1: -12, x2: 8, y2: 8 },
      { type: 'line', x1: -5, y1: 0, x2: 5, y2: 0 },
      { type: 'line', x1: -10, y1: 8, x2: 10, y2: 8 }
    ],
    particleTemplate: [
      { t: 0, spread: 0.2, speed: 1.35, alpha: 1.0 },
      { t: 0.5, spread: 0.88, speed: 0.42, alpha: 0.83 },
      { t: 1, spread: 1.0, speed: 0.0, alpha: 0.0 }
    ]
  },
  {
    id: 'ti',
    pitch: 71,
    color: '#FF44AA',
    symbol: [
      { type: 'line', x1: -8, y1: -8, x2: 8, y2: -8 },
      { type: 'line', x1: 0, y1: -8, x2: 0, y2: 10 },
      { type: 'line', x1: -6, y1: 2, x2: 6, y2: 2 },
      { type: 'arc', x1: 0, y1: 10, r: 5, startAngle: 0, endAngle: Math.PI }
    ],
    particleTemplate: [
      { t: 0, spread: 0.2, speed: 1.4, alpha: 1.0 },
      { t: 0.5, spread: 0.9, speed: 0.4, alpha: 0.85 },
      { t: 1, spread: 1.0, speed: 0.0, alpha: 0.0 }
    ]
  }
];

export class RuneDisc {
  private positions: RunePosition[] = [];
  private centerX: number = 0;
  private centerY: number = 0;
  private discRadius: number = 200;
  private buttonRadius: number = 30;
  private layoutRadius: number = 0;
  private hoverIndex: number = -1;
  private clickAnim: Map<number, number> = new Map();

  constructor(canvasWidth: number, canvasHeight: number) {
    this.resize(canvasWidth, canvasHeight);
  }

  resize(canvasWidth: number, canvasHeight: number) {
    const isMobile = canvasWidth < 600;
    this.discRadius = isMobile ? 140 : 200;
    this.buttonRadius = isMobile ? 20 : 30;
    this.layoutRadius = this.discRadius - this.buttonRadius - 10;
    this.centerX = canvasWidth / 2;
    this.centerY = canvasHeight / 2 + 20;
    this.computePositions();
  }

  private computePositions() {
    this.positions = RUNES.map((rune, i) => {
      const angleDeg = -90 + (i * (360 / 7));
      const angleRad = (angleDeg * Math.PI) / 180;
      return {
        rune,
        cx: this.centerX + Math.cos(angleRad) * this.layoutRadius,
        cy: this.centerY + Math.sin(angleRad) * this.layoutRadius,
        radius: this.buttonRadius,
        angleDeg
      };
    });
  }

  getCenter(): { x: number; y: number } {
    return { x: this.centerX, y: this.centerY };
  }

  getDiscRadius(): number {
    return this.discRadius;
  }

  getPositions(): RunePosition[] {
    return this.positions;
  }

  getHoverIndex(): number {
    return this.hoverIndex;
  }

  setHoverIndex(index: number) {
    this.hoverIndex = index;
  }

  setClickAnim(index: number) {
    this.clickAnim.set(index, performance.now());
  }

  getClickScale(index: number): number {
    const start = this.clickAnim.get(index);
    if (!start) return 1;
    const dt = (performance.now() - start) / 1000;
    if (dt >= 0.3) {
      this.clickAnim.delete(index);
      return 1;
    }
    const t = dt / 0.3;
    return 1 + 0.2 * Math.exp(-t * 6);
  }

  hitTest(x: number, y: number): RunePosition | null {
    for (let i = this.positions.length - 1; i >= 0; i--) {
      const p = this.positions[i];
      const dx = x - p.cx;
      const dy = y - p.cy;
      const r = p.radius + 6;
      if (dx * dx + dy * dy <= r * r) {
        return p;
      }
    }
    return null;
  }

  getPositionByRuneId(id: string): RunePosition | undefined {
    return this.positions.find(p => p.rune.id === id);
  }

  getRuneByIndex(index: number): RunePosition | undefined {
    return this.positions[index];
  }

  findIndexByRuneId(id: string): number {
    return this.positions.findIndex(p => p.rune.id === id);
  }
}

export function drawRuneDisc(
  ctx: CanvasRenderingContext2D,
  disc: RuneDisc,
  now: number
): void {
  const { x: cx, y: cy } = disc.getCenter();
  const discRadius = disc.getDiscRadius();

  const bgGrad = ctx.createRadialGradient(cx, cy, discRadius * 0.1, cx, cy, discRadius);
  bgGrad.addColorStop(0, 'rgba(40, 30, 75, 0.85)');
  bgGrad.addColorStop(0.6, 'rgba(26, 21, 48, 0.7)');
  bgGrad.addColorStop(1, 'rgba(13, 10, 22, 0.9)');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, discRadius, 0, Math.PI * 2);
  ctx.fillStyle = bgGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((now / 30000) * Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  for (let i = 0; i < 50; i++) {
    const a = (i / 50) * Math.PI * 2;
    const rr = discRadius + 16;
    const sx = Math.cos(a) * rr;
    const sy = Math.sin(a) * rr;
    ctx.beginPath();
    ctx.arc(sx, sy, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const positions = disc.getPositions();
  const hover = disc.getHoverIndex();

  positions.forEach((pos, idx) => {
    const scale = disc.getClickScale(idx);
    const floatY = hover === idx ? -4 : 0;
    const pulseAlpha = 0.3 + 0.3 * (0.5 + 0.5 * Math.sin(now / 1000));

    const pcx = pos.cx;
    const pcy = pos.cy + floatY;
    const r = pos.radius * scale;

    ctx.save();
    const haloR = r + 10;
    const halo = ctx.createRadialGradient(pcx, pcy, r * 0.3, pcx, pcy, haloR);
    halo.addColorStop(0, pos.rune.color + Math.round(pulseAlpha * 120).toString(16).padStart(2, '0'));
    halo.addColorStop(1, pos.rune.color + '00');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(pcx, pcy, haloR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(pcx, pcy, r, 0, Math.PI * 2);
    const btnGrad = ctx.createRadialGradient(pcx - r * 0.3, pcy - r * 0.3, 1, pcx, pcy, r);
    btnGrad.addColorStop(0, pos.rune.color + 'EE');
    btnGrad.addColorStop(1, pos.rune.color + 'AA');
    ctx.fillStyle = btnGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.shadowColor = pos.rune.color;
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(pcx, pcy);
    const symScale = pos.radius / 30;
    ctx.scale(symScale * scale, symScale * scale);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const seg of pos.rune.symbol) {
      ctx.beginPath();
      if (seg.type === 'line') {
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2 ?? 0, seg.y2 ?? 0);
      } else if (seg.type === 'arc') {
        ctx.arc(seg.x1, seg.y1, seg.r ?? 4, seg.startAngle ?? 0, seg.endAngle ?? Math.PI * 2);
      } else if (seg.type === 'circle') {
        ctx.arc(seg.x1, seg.y1, seg.r ?? 4, 0, Math.PI * 2);
      }
      ctx.stroke();
    }
    ctx.restore();
  });

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(168, 85, 247, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const p = positions[i];
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(p.cx - cx, p.cy - cy);
    ctx.stroke();
  }
  const innerGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, discRadius * 0.25);
  innerGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
  innerGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, discRadius * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

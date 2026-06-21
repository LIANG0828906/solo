import { Point, SpellType, SPELL_COLORS } from './drawing';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Enemy {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  breathPhase: number;
  flashTimer: number;
}

export interface SpellResult {
  matched: boolean;
  templateName: string;
  matchScore: number;
  spellType: SpellType;
  damage: number;
}

export interface BattleResult {
  duration: number;
  spellCount: number;
  grade: string;
  comboMax: number;
  efficiency: number;
}

interface RuneTemplate {
  name: string;
  points: Point[];
  spellType: SpellType;
}

const RESAMPLE_COUNT = 64;

function generateTriangle(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200, r = 80;
  const vertices: Point[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i * 2 * Math.PI / 3) - Math.PI / 2;
    vertices.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  for (let i = 0; i < 3; i++) {
    const next = (i + 1) % 3;
    const steps = 30;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      pts.push({
        x: vertices[i].x + (vertices[next].x - vertices[i].x) * t,
        y: vertices[i].y + (vertices[next].y - vertices[i].y) * t
      });
    }
  }
  return pts;
}

function generateStar(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200, outerR = 80, innerR = 35;
  const vertices: Point[] = [];
  for (let i = 0; i < 5; i++) {
    const outerA = (i * 2 * Math.PI / 5) - Math.PI / 2;
    vertices.push({ x: cx + outerR * Math.cos(outerA), y: cy + outerR * Math.sin(outerA) });
    const innerA = ((i + 0.5) * 2 * Math.PI / 5) - Math.PI / 2;
    vertices.push({ x: cx + innerR * Math.cos(innerA), y: cy + innerR * Math.sin(innerA) });
  }
  for (let i = 0; i < 10; i++) {
    const next = (i + 1) % 10;
    const steps = 10;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      pts.push({
        x: vertices[i].x + (vertices[next].x - vertices[i].x) * t,
        y: vertices[i].y + (vertices[next].y - vertices[i].y) * t
      });
    }
  }
  return pts;
}

function generateSpiral(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200;
  for (let i = 0; i < 120; i++) {
    const t = i / 120;
    const angle = t * 4 * Math.PI;
    const r = 10 + t * 70;
    pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return pts;
}

function generateCircle(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200, r = 70;
  for (let i = 0; i < 80; i++) {
    const a = (i / 80) * 2 * Math.PI;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

function generateSquare(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200, s = 60;
  const corners = [
    { x: cx - s, y: cy - s }, { x: cx + s, y: cy - s },
    { x: cx + s, y: cy + s }, { x: cx - s, y: cy + s }
  ];
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    const steps = 25;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      pts.push({
        x: corners[i].x + (corners[next].x - corners[i].x) * t,
        y: corners[i].y + (corners[next].y - corners[i].y) * t
      });
    }
  }
  return pts;
}

function generateDiamond(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200, w = 70, h = 90;
  const corners = [
    { x: cx, y: cy - h }, { x: cx + w, y: cy },
    { x: cx, y: cy + h }, { x: cx - w, y: cy }
  ];
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    const steps = 25;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      pts.push({
        x: corners[i].x + (corners[next].x - corners[i].x) * t,
        y: corners[i].y + (corners[next].y - corners[i].y) * t
      });
    }
  }
  return pts;
}

function generateCross(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200, len = 70, w = 25;
  const path = [
    { x: cx - w, y: cy - len }, { x: cx + w, y: cy - len },
    { x: cx + w, y: cy - w }, { x: cx + len, y: cy - w },
    { x: cx + len, y: cy + w }, { x: cx + w, y: cy + w },
    { x: cx + w, y: cy + len }, { x: cx - w, y: cy + len },
    { x: cx - w, y: cy + w }, { x: cx - len, y: cy + w },
    { x: cx - len, y: cy - w }, { x: cx - w, y: cy - w },
  ];
  for (let i = 0; i < path.length; i++) {
    const next = (i + 1) % path.length;
    const steps = 8;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      pts.push({
        x: path[i].x + (path[next].x - path[i].x) * t,
        y: path[i].y + (path[next].y - path[i].y) * t
      });
    }
  }
  return pts;
}

function generateArrow(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200;
  const path = [
    { x: cx, y: cy - 80 },
    { x: cx + 50, y: cy - 20 },
    { x: cx + 20, y: cy - 20 },
    { x: cx + 20, y: cy + 80 },
    { x: cx - 20, y: cy + 80 },
    { x: cx - 20, y: cy - 20 },
    { x: cx - 50, y: cy - 20 },
    { x: cx, y: cy - 80 }
  ];
  for (let i = 0; i < path.length - 1; i++) {
    const steps = 15;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      pts.push({
        x: path[i].x + (path[i + 1].x - path[i].x) * t,
        y: path[i].y + (path[i + 1].y - path[i].y) * t
      });
    }
  }
  return pts;
}

function generateHeart(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200;
  for (let i = 0; i < 80; i++) {
    const t = (i / 80) * 2 * Math.PI;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push({ x: cx + x * 4.5, y: cy + y * 4.5 });
  }
  return pts;
}

function generateLightning(): Point[] {
  const pts: Point[] = [];
  const cx = 200, cy = 200;
  const path = [
    { x: cx - 10, y: cy - 80 },
    { x: cx - 40, y: cy - 10 },
    { x: cx - 5, y: cy - 10 },
    { x: cx - 30, y: cy + 80 },
    { x: cx + 30, y: cy + 5 },
    { x: cx + 5, y: cy + 5 },
    { x: cx + 10, y: cy - 80 },
    { x: cx - 10, y: cy - 80 }
  ];
  for (let i = 0; i < path.length - 1; i++) {
    const steps = 15;
    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      pts.push({
        x: path[i].x + (path[i + 1].x - path[i].x) * t,
        y: path[i].y + (path[i + 1].y - path[i].y) * t
      });
    }
  }
  return pts;
}

const RUNE_TEMPLATES: RuneTemplate[] = [
  { name: '三角', points: generateTriangle(), spellType: 'fire' },
  { name: '星形', points: generateStar(), spellType: 'lightning' },
  { name: '螺旋', points: generateSpiral(), spellType: 'ice' },
  { name: '圆形', points: generateCircle(), spellType: 'ice' },
  { name: '方形', points: generateSquare(), spellType: 'fire' },
  { name: '菱形', points: generateDiamond(), spellType: 'lightning' },
  { name: '十字', points: generateCross(), spellType: 'lightning' },
  { name: '箭头', points: generateArrow(), spellType: 'fire' },
  { name: '心形', points: generateHeart(), spellType: 'ice' },
  { name: '闪电', points: generateLightning(), spellType: 'lightning' }
];

function resamplePoints(points: Point[], n: number): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) return Array(n).fill({ ...points[0] });

  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    totalLen += distance(points[i - 1], points[i]);
  }
  const interval = totalLen / (n - 1);
  const result: Point[] = [{ ...points[0] }];
  let D = 0;

  const src = points.map(p => ({ ...p }));

  for (let i = 1; i < src.length; i++) {
    const d = distance(src[i - 1], src[i]);
    if (D + d >= interval && interval > 0) {
      const t = (interval - D) / d;
      const nx = src[i - 1].x + t * (src[i].x - src[i - 1].x);
      const ny = src[i - 1].y + t * (src[i].y - src[i - 1].y);
      const newPt = { x: nx, y: ny };
      result.push(newPt);
      src.splice(i, 0, newPt);
      D = 0;
    } else {
      D += d;
    }
    if (result.length >= n) break;
  }

  while (result.length < n) {
    result.push({ ...src[src.length - 1] });
  }
  return result;
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function centroid(points: Point[]): Point {
  let sx = 0, sy = 0;
  for (const p of points) { sx += p.x; sy += p.y; }
  return { x: sx / points.length, y: sy / points.length };
}

function rotateBy(points: Point[], angle: number): Point[] {
  const c = centroid(points);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map(p => ({
    x: (p.x - c.x) * cos - (p.y - c.y) * sin + c.x,
    y: (p.x - c.x) * sin + (p.y - c.y) * cos + c.y
  }));
}

function indicativeAngle(points: Point[]): number {
  const c = centroid(points);
  return Math.atan2(c.y - points[0].y, c.x - points[0].x);
}

function rotateToZero(points: Point[]): Point[] {
  return rotateBy(points, -indicativeAngle(points));
}

function scaleToUnitSquare(points: Point[]): Point[] {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  return points.map(p => ({
    x: (p.x - minX) / w,
    y: (p.y - minY) / h
  }));
}

function translateToOrigin(points: Point[]): Point[] {
  const c = centroid(points);
  return points.map(p => ({ x: p.x - c.x, y: p.y - c.y }));
}

function normalizePoints(points: Point[]): Point[] {
  const resampled = resamplePoints(points, RESAMPLE_COUNT);
  const rotated = rotateToZero(resampled);
  const scaled = scaleToUnitSquare(rotated);
  return translateToOrigin(scaled);
}

function pathDistance(a: Point[], b: Point[]): number {
  if (a.length !== b.length) return Infinity;
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    d += distance(a[i], b[i]);
  }
  return d / a.length;
}

function matchScore(userPoints: Point[], templatePoints: Point[]): number {
  const d = pathDistance(userPoints, templatePoints);
  const halfDiag = Math.SQRT2 / 2;
  return Math.max(0, 1 - d / halfDiag);
}

export function matchRune(points: Point[]): { name: string; score: number; spellType: SpellType } {
  if (points.length < 10) return { name: '', score: 0, spellType: 'fire' };

  const normalized = normalizePoints(points);
  let bestMatch = { name: '', score: 0, spellType: 'fire' as SpellType };

  for (const template of RUNE_TEMPLATES) {
    const tplNorm = normalizePoints(template.points);
    const score = matchScore(normalized, tplNorm);
    if (score > bestMatch.score) {
      bestMatch = { name: template.name, score, spellType: template.spellType };
    }
  }

  return bestMatch;
}

export { RUNE_TEMPLATES };

export class CombatManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private enemy: Enemy;
  private playerHealth: number = 100;
  private playerMaxHealth: number = 100;
  private cooldownTimer: number = 0;
  private cooldownMax: number = 3;
  private battleStartTime: number = 0;
  private spellCount: number = 0;
  private comboCount: number = 0;
  private comboMax: number = 0;
  private lastHitTime: number = 0;
  private isActive: boolean = false;
  private floatingTexts: { x: number; y: number; text: string; life: number; color: string }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.enemy = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      health: 100,
      maxHealth: 100,
      breathPhase: 0,
      flashTimer: 0
    };
  }

  startBattle(): void {
    this.enemy.health = this.enemy.maxHealth;
    this.playerHealth = this.playerMaxHealth;
    this.spellCount = 0;
    this.comboCount = 0;
    this.comboMax = 0;
    this.cooldownTimer = 0;
    this.battleStartTime = Date.now();
    this.particles = [];
    this.floatingTexts = [];
    this.isActive = true;
  }

  isBattleActive(): boolean {
    return this.isActive;
  }

  isBattleOver(): boolean {
    return this.enemy.health <= 0 || this.playerHealth <= 0;
  }

  activateRune(points: Point[], origin: Point, spellType: SpellType): SpellResult {
    if (this.cooldownTimer > 0 || this.isBattleOver()) {
      return { matched: false, templateName: '', matchScore: 0, spellType, damage: 0 };
    }

    const match = matchRune(points);

    if (match.score > 0.7) {
      const baseDamage = 15 + match.score * 20;
      const comboBonus = this.comboCount * 2;
      const damage = Math.round(baseDamage + comboBonus);

      this.createParticleBeam(origin, { x: this.enemy.x, y: this.enemy.y }, spellType);

      this.enemy.health = Math.max(0, this.enemy.health - damage);
      this.enemy.flashTimer = 0.3;
      this.spellCount++;

      const now = Date.now();
      if (now - this.lastHitTime < 3000) {
        this.comboCount++;
      } else {
        this.comboCount = 1;
      }
      if (this.comboCount > this.comboMax) this.comboMax = this.comboCount;
      this.lastHitTime = now;

      this.cooldownTimer = this.cooldownMax;

      this.floatingTexts.push({
        x: this.enemy.x + (Math.random() - 0.5) * 40,
        y: this.enemy.y - 40,
        text: `-${damage}`,
        life: 1.0,
        color: SPELL_COLORS[spellType]
      });

      if (this.comboCount > 1) {
        this.floatingTexts.push({
          x: this.enemy.x + (Math.random() - 0.5) * 40,
          y: this.enemy.y - 60,
          text: `${this.comboCount}连击!`,
          life: 1.2,
          color: '#FFD700'
        });
      }

      return {
        matched: true,
        templateName: match.name,
        matchScore: match.score,
        spellType,
        damage
      };
    }

    this.playerHealth = Math.max(0, this.playerHealth - 5);
    this.cooldownTimer = 1;

    this.floatingTexts.push({
      x: this.canvas.width / 2,
      y: 80,
      text: '符文匹配失败!',
      life: 1.0,
      color: '#EF4444'
    });

    return { matched: false, templateName: match.name, matchScore: match.score, spellType, damage: 0 };
  }

  private createParticleBeam(from: Point, to: Point, spellType: SpellType): void {
    const color = SPELL_COLORS[spellType];
    for (let i = 0; i < 20; i++) {
      const t = Math.random();
      this.particles.push({
        x: from.x,
        y: from.y,
        vx: (to.x - from.x) / 0.8 + (Math.random() - 0.5) * 60,
        vy: (to.y - from.y) / 0.8 + (Math.random() - 0.5) * 60,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 3
      });
    }
  }

  update(dt: number): void {
    if (!this.isActive) return;

    this.enemy.breathPhase += dt * Math.PI;
    if (this.enemy.flashTimer > 0) {
      this.enemy.flashTimer -= dt;
    }

    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 40 * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  getPlayerHealth(): number { return this.playerHealth; }
  getPlayerMaxHealth(): number { return this.playerMaxHealth; }
  getEnemyHealth(): number { return this.enemy.health; }
  getEnemyMaxHealth(): number { return this.enemy.maxHealth; }
  getCooldownTimer(): number { return this.cooldownTimer; }
  getCooldownMax(): number { return this.cooldownMax; }

  getBattleResult(): BattleResult {
    const duration = Math.round((Date.now() - this.battleStartTime) / 1000);
    const efficiency = this.spellCount > 0 ? this.enemy.maxHealth / (this.spellCount * 35) : 0;
    let grade = 'C';
    if (this.enemy.health <= 0) {
      if (duration < 30 && this.comboMax >= 3) grade = 'S';
      else if (duration < 60 && this.comboMax >= 2) grade = 'A';
      else if (duration < 90) grade = 'B';
    }
    return { duration, spellCount: this.spellCount, grade, comboMax: this.comboMax, efficiency };
  }

  render(): void {
    const ctx = this.ctx;
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderGrid(ctx);
    this.renderEnemy(ctx);
    this.renderParticles(ctx);
    this.renderFloatingTexts(ctx);
  }

  private renderGrid(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderEnemy(ctx: CanvasRenderingContext2D): void {
    const breathScale = 1 + 0.05 * Math.sin(this.enemy.breathPhase);
    const flash = this.enemy.flashTimer > 0;

    ctx.save();
    ctx.translate(this.enemy.x, this.enemy.y);
    ctx.scale(breathScale, breathScale);

    ctx.globalAlpha = 0.6;

    if (flash) {
      ctx.fillStyle = '#EF4444';
      ctx.globalAlpha = 0.8;
    } else {
      ctx.fillStyle = '#8B5CF6';
    }

    ctx.beginPath();
    ctx.ellipse(0, -10, 35, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-35, 10);
    for (let i = 0; i <= 6; i++) {
      const x = -35 + i * (70 / 6);
      const y = 40 + Math.sin(i * Math.PI + this.enemy.breathPhase * 2) * 8;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = flash ? '#FCA5A5' : '#C4B5FD';
    ctx.beginPath();
    ctx.ellipse(-12, -18, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -18, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = flash ? '#7F1D1D' : '#1E1B4B';
    ctx.beginPath();
    ctx.ellipse(-12, -16, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(12, -16, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#8B5CF6';
    ctx.beginPath();
    ctx.ellipse(0, -10, 50, 65, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D): void {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, ft.life * 2);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

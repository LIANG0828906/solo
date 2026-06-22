import { MapGrid, Cell, Unit, HexCoord } from './MapGrid';
import { PathNode } from './PathFinder';

export interface RenderState {
  selectedUnit: Unit | null;
  reachableRange: Map<string, PathNode>;
  attackRange: HexCoord[];
  pathPreview: HexCoord[];
  animatingUnits: Map<string, AnimatingUnitState>;
  damageNumbers: DamageNumber[];
  time: number;
}

export interface AnimatingUnitState {
  unit: Unit;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  isAttacking?: boolean;
  attackShake?: number;
}

export interface DamageNumber {
  x: number;
  y: number;
  value: number;
  life: number;
  maxLife: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private grid: MapGrid;
  private hexSize: number = 36;
  private hexHeight: number;
  private hexWidth: number;
  private offsetX: number = 60;
  private offsetY: number = 60;

  private readonly color1 = '#2a3a5a';
  private readonly color2 = '#3a4a6a';
  private readonly obstacleColor = '#1a1a2a';
  private readonly moveHighlight = 'rgba(76, 175, 80, 0.4)';
  private readonly attackHighlight = 'rgba(244, 67, 54, 0.3)';
  private readonly playerColor = '#4a90e2';
  private readonly enemyColor = '#e24a4a';

  constructor(canvas: HTMLCanvasElement, grid: MapGrid) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.grid = grid;

    this.hexHeight = this.hexSize * 2;
    this.hexWidth = Math.sqrt(3) * this.hexSize;
  }

  public hexToPixel(q: number, r: number): { x: number; y: number } {
    const x = this.offsetX + q * this.hexWidth + (r % 2) * (this.hexWidth / 2);
    const y = this.offsetY + r * this.hexHeight * 0.75;
    return { x, y };
  }

  public pixelToHex(x: number, y: number): HexCoord | null {
    const adjustedX = x - this.offsetX;
    const adjustedY = y - this.offsetY;

    const r = Math.round(adjustedY / (this.hexHeight * 0.75));
    const q = Math.round((adjustedX - (r % 2) * (this.hexWidth / 2)) / this.hexWidth);

    if (this.grid.isInBounds(q, r)) {
      return { q, r };
    }

    const candidates: { q: number; r: number; dist: number }[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dq = -1; dq <= 1; dq++) {
        const testQ = q + dq;
        const testR = r + dr;
        if (this.grid.isInBounds(testQ, testR)) {
          const pixel = this.hexToPixel(testQ, testR);
          const dist = Math.sqrt((pixel.x - x) ** 2 + (pixel.y - y) ** 2);
          candidates.push({ q: testQ, r: testR, dist });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.dist - b.dist);
      return { q: candidates[0]!.q, r: candidates[0]!.r };
    }

    return null;
  }

  public render(state: RenderState): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.drawBackground();
    this.drawGrid(state);
    this.drawUnits(state);
    this.drawPathPreview(state);
    this.drawDamageNumbers(state);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createRadialGradient(
      this.ctx.canvas.width / 2,
      this.ctx.canvas.height / 2,
      0,
      this.ctx.canvas.width / 2,
      this.ctx.canvas.height / 2,
      this.ctx.canvas.width
    );
    gradient.addColorStop(0, '#1a2a4a');
    gradient.addColorStop(1, '#0a1628');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  private drawGrid(state: RenderState): void {
    const cells = this.grid.getAllCells();
    
    for (const cell of cells) {
      const key = `${cell.q},${cell.r}`;
      const { x, y } = this.hexToPixel(cell.q, cell.r);
      
      let fillColor = (cell.q + cell.r) % 2 === 0 ? this.color1 : this.color2;
      let borderColor = '#4a5a7a';
      let glow = false;

      if (cell.type === 'obstacle') {
        fillColor = this.obstacleColor;
        borderColor = '#2a2a3a';
      } else if (state.reachableRange.has(key)) {
        fillColor = this.moveHighlight;
        glow = true;
      }

      this.drawHexagon(x, y, fillColor, borderColor, glow);

      if (state.attackRange.some(p => p.q === cell.q && p.r === cell.r)) {
        this.drawAttackRange(x, y);
      }

      if (cell.type === 'obstacle') {
        this.drawObstacle(x, y);
      }
    }
  }

  private drawHexagon(x: number, y: number, fillColor: string, borderColor: string, glow: boolean): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = x + this.hexSize * Math.cos(angle);
      const hy = y + this.hexSize * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();

    if (glow) {
      this.ctx.shadowColor = '#4caf50';
      this.ctx.shadowBlur = 10;
    }

    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    this.ctx.shadowBlur = 0;

    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawAttackRange(x: number, y: number): void {
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = x + (this.hexSize - 2) * Math.cos(angle);
      const hy = y + (this.hexSize - 2) * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = this.attackHighlight;
    this.ctx.fill();
  }

  private drawObstacle(x: number, y: number): void {
    this.ctx.fillStyle = '#3a3a4a';
    this.ctx.beginPath();
    this.ctx.arc(x - 6, y - 4, 10, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(x + 8, y + 2, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#4a4a5a';
    this.ctx.beginPath();
    this.ctx.arc(x - 2, y + 6, 7, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawUnits(state: RenderState): void {
    const units = this.grid.getAllUnits();
    
    for (const unit of units) {
      const animState = state.animatingUnits.get(unit.id);
      let { x, y } = this.hexToPixel(unit.q, unit.r);

      if (animState) {
        x = animState.fromX + (animState.toX - animState.fromX) * animState.progress;
        y = animState.fromY + (animState.toY - animState.fromY) * animState.progress;
        
        if (animState.attackShake !== undefined) {
          const shake = Math.sin(animState.attackShake * 50) * 3;
          x += shake;
        }
      }

      const isSelected = state.selectedUnit?.id === unit.id;
      this.drawUnit(unit, x, y, isSelected, state.time);
    }
  }

  private drawUnit(unit: Unit, x: number, y: number, isSelected: boolean, time: number): void {
    const radius = 22;

    if (isSelected) {
      const pulse = 0.5 + Math.sin(time / 300) * 0.5;
      const glowRadius = radius + 8 + pulse * 6;
      
      const gradient = this.ctx.createRadialGradient(x, y, radius, x, y, glowRadius);
      gradient.addColorStop(0, `rgba(255, 215, 0, ${0.8 * pulse + 0.2})`);
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 2 + pulse * 2;
      this.ctx.stroke();
    }

    const unitColor = unit.team === 'player' ? this.playerColor : this.enemyColor;
    const darkColor = unit.team === 'player' ? '#2a5a9a' : '#9a2a2a';

    const gradient = this.ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
    gradient.addColorStop(0, unitColor);
    gradient.addColorStop(1, darkColor);

    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    const hpBarWidth = 32;
    const hpBarHeight = 5;
    const hpBarX = x - hpBarWidth / 2;
    const hpBarY = y + radius + 6;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    const hpRatio = unit.hp / unit.maxHp;
    const hpColor = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
    this.ctx.fillStyle = hpColor;
    this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpRatio, hpBarHeight);

    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);

    if (unit.hasActed && unit.hasMoved) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawPathPreview(state: RenderState): void {
    if (state.pathPreview.length < 2) return;

    this.ctx.setLineDash([8, 8]);
    this.ctx.lineDashOffset = -state.time / 50;
    this.ctx.strokeStyle = '#4caf50';
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';

    this.ctx.beginPath();
    for (let i = 0; i < state.pathPreview.length; i++) {
      const coord = state.pathPreview[i]!;
      const { x, y } = this.hexToPixel(coord.q, coord.r);
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.lineDashOffset = 0;

    for (let i = 1; i < state.pathPreview.length; i++) {
      const coord = state.pathPreview[i]!;
      const { x, y } = this.hexToPixel(coord.q, coord.r);
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 5, 0, Math.PI * 2);
      this.ctx.fillStyle = '#4caf50';
      this.ctx.fill();
    }
  }

  private drawDamageNumbers(state: RenderState): void {
    for (const dmg of state.damageNumbers) {
      const alpha = dmg.life / dmg.maxLife;
      const yOffset = (1 - alpha) * 40;
      
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
      this.ctx.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
      this.ctx.lineWidth = 3;
      
      const text = `-${dmg.value}`;
      this.ctx.strokeText(text, dmg.x, dmg.y - yOffset);
      this.ctx.fillText(text, dmg.x, dmg.y - yOffset);
    }
  }
}

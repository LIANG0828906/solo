import { MazeData, PlayerState, Valve, Position } from './engine';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface RenderState {
  maze: MazeData;
  player: PlayerState;
  particles: Particle[];
  tileSize: number;
  animationTime: number;
}

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tileSize: number = 32;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  setTileSize(size: number): void {
    this.tileSize = size;
  }

  render(state: RenderState): void {
    const ctx = this.ctx;
    const { maze, player, particles, animationTime } = state;
    const ts = this.tileSize;

    ctx.fillStyle = '#3D2B1F';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawTiles(ctx, maze);
    this.drawPipes(ctx, maze, animationTime);
    this.drawValves(ctx, maze.valves, animationTime);
    this.drawDoor(ctx, maze.doorPos, maze.doorOpen, animationTime);
    this.drawPlayer(ctx, player, ts);
    this.drawParticles(ctx, particles);
  }

  private drawTiles(ctx: CanvasRenderingContext2D, maze: MazeData): void {
    const ts = this.tileSize;
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.cells[y][x];
        const px = x * ts;
        const py = y * ts;

        if (cell.type === 'wall') {
          ctx.fillStyle = '#5C4033';
          ctx.fillRect(px, py, ts, ts);
          ctx.fillStyle = '#4A3728';
          ctx.fillRect(px + 2, py + 2, ts - 4, ts - 4);
          const rivetSize = 3;
          ctx.fillStyle = '#8B7355';
          ctx.beginPath();
          ctx.arc(px + 4, py + 4, rivetSize, 0, Math.PI * 2);
          ctx.arc(px + ts - 4, py + 4, rivetSize, 0, Math.PI * 2);
          ctx.arc(px + 4, py + ts - 4, rivetSize, 0, Math.PI * 2);
          ctx.arc(px + ts - 4, py + ts - 4, rivetSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell.type === 'floor' || cell.type === 'pipe') {
          ctx.fillStyle = '#6B5344';
          ctx.fillRect(px, py, ts, ts);
          ctx.strokeStyle = '#4A3728';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, ts - 1, ts - 1);
        } else if (cell.type === 'door') {
          ctx.fillStyle = '#6B5344';
          ctx.fillRect(px, py, ts, ts);
        }
      }
    }
  }

  private drawPipes(ctx: CanvasRenderingContext2D, maze: MazeData, time: number): void {
    const ts = this.tileSize;
    maze.pipes.forEach((pipe) => {
      const px = pipe.pos.x * ts;
      const py = pipe.pos.y * ts;
      const cx = px + ts / 2;
      const cy = py + ts / 2;

      ctx.fillStyle = pipe.lit ? '#00FF66' : '#8B7355';
      ctx.fillRect(px + 4, py + ts / 2 - 4, ts - 8, 8);
      ctx.fillRect(px + ts / 2 - 4, py + 4, 8, ts - 8);

      if (pipe.lit) {
        const glow = 0.5 + 0.3 * Math.sin(time / 200);
        ctx.shadowColor = '#00FF66';
        ctx.shadowBlur = 15 * glow;
        ctx.fillStyle = `rgba(0, 255, 102, ${0.6 * glow})`;
        ctx.fillRect(px + 4, py + ts / 2 - 4, ts - 8, 8);
        ctx.fillRect(px + ts / 2 - 4, py + 4, 8, ts - 8);
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#3D2B1F';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private drawValves(ctx: CanvasRenderingContext2D, valves: Valve[], time: number): void {
    const ts = this.tileSize;
    valves.forEach((valve) => {
      const px = valve.pos.x * ts;
      const py = valve.pos.y * ts;
      const cx = px + ts / 2;
      const cy = py + ts / 2;

      ctx.fillStyle = valve.isOpen ? '#B8860B' : '#8B7355';
      ctx.beginPath();
      ctx.arc(cx, cy, ts / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = valve.isOpen ? '#FFD700' : '#5C4033';
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + (valve.currentAngle * Math.PI) / 180;
        const r1 = ts / 2 - 8;
        const r2 = ts / 2 - 3;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
        ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((valve.currentAngle * Math.PI) / 180);
      ctx.fillStyle = valve.isOpen ? '#00FF66' : '#E74C3C';
      ctx.fillRect(-2, -ts / 2 + 8, 4, ts / 2 - 10);
      ctx.fillRect(-ts / 2 + 8, -2, ts / 2 - 10, 4);
      ctx.restore();

      if (valve.isOpen) {
        const pulse = 0.5 + 0.3 * Math.sin(time / 150);
        ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, ts / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  private drawDoor(ctx: CanvasRenderingContext2D, doorPos: Position, isOpen: boolean, time: number): void {
    const ts = this.tileSize;
    const px = doorPos.x * ts;
    const py = doorPos.y * ts;

    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(px, py, ts, ts);

    const gearAngle = isOpen ? (time / 100) % (Math.PI * 2) : 0;
    const cx = px + ts / 2;
    const cy = py + ts / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(gearAngle);
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const r = i % 2 === 0 ? ts / 2 - 4 : ts / 2 - 8;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (isOpen) {
      const glow = 0.6 + 0.4 * Math.sin(time / 200);
      ctx.strokeStyle = `rgba(0, 255, 102, ${glow})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(px + 1, py + 1, ts - 2, ts - 2);
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, ts: number): void {
    const px = player.pos.x * ts;
    const py = player.pos.y * ts;
    const cx = px + ts / 2;
    const cy = py + ts / 2;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.arc(0, 0, ts / 2 - 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate((player.gearRotation * Math.PI) / 180);
    ctx.fillStyle = '#B8860B';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const r = i % 2 === 0 ? ts / 2 - 10 : ts / 2 - 14;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const dirAngle = (player.direction / 8) * Math.PI * 2 - Math.PI / 2;
    const ex = cx + Math.cos(dirAngle) * (ts / 2 - 4);
    const ey = cy + Math.sin(dirAngle) * (ts / 2 - 4);
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
    particles.forEach((p) => {
      const alpha = 1 - p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  static spawnSteamParticles(pos: Position, tileSize: number): Particle[] {
    const particles: Particle[] = [];
    const count = 8 + Math.floor(Math.random() * 6);
    const cx = pos.x * tileSize + tileSize / 2;
    const cy = pos.y * tileSize + tileSize / 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const colors = ['#FF8C00', '#FF6347', '#FF4500', '#FFD700'];
      particles.push({
        x: cx + (Math.random() - 0.5) * 10,
        y: cy + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 0,
        maxLife: 800,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return particles;
  }
}

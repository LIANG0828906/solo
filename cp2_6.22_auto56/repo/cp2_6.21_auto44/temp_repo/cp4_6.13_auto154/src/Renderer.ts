import { GemType, Particle, Position, SwapAnimation } from './types';
import { Board } from './Board';

const CELL_SIZE = 60;
const GEM_SIZE = 40;
const GEM_PADDING = (CELL_SIZE - GEM_SIZE) / 2;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private board: Board;
  private particles: Particle[] = [];
  private swapAnimation: SwapAnimation | null = null;
  private isAnimating = false;

  constructor(ctx: CanvasRenderingContext2D, board: Board) {
    this.ctx = ctx;
    this.board = board;
  }

  draw(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    this.drawGrid();
    this.drawBoard();
    this.drawParticles();
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = '#3a3a5e';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i <= this.board.getBoardSize(); i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * CELL_SIZE, 0);
      this.ctx.lineTo(i * CELL_SIZE, this.board.getBoardSize() * CELL_SIZE);
      this.ctx.stroke();
      
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * CELL_SIZE);
      this.ctx.lineTo(this.board.getBoardSize() * CELL_SIZE, i * CELL_SIZE);
      this.ctx.stroke();
    }
  }

  private drawBoard(): void {
    const grid = this.board.getGrid();
    const selected = this.board.getSelectedGem();

    for (let row = 0; row < this.board.getBoardSize(); row++) {
      for (let col = 0; col < this.board.getBoardSize(); col++) {
        const gem = grid[row][col];
        if (!gem) continue;

        let x = col * CELL_SIZE + GEM_PADDING;
        let y = row * CELL_SIZE + GEM_PADDING;

        if (this.swapAnimation) {
          const { pos1, pos2, progress } = this.swapAnimation;
          if (pos1.row === row && pos1.col === col) {
            const targetX = pos2.col * CELL_SIZE + GEM_PADDING;
            const targetY = pos2.row * CELL_SIZE + GEM_PADDING;
            x = x + (targetX - x) * progress;
            y = y + (targetY - y) * progress;
          } else if (pos2.row === row && pos2.col === col) {
            const targetX = pos1.col * CELL_SIZE + GEM_PADDING;
            const targetY = pos1.row * CELL_SIZE + GEM_PADDING;
            x = x + (targetX - x) * progress;
            y = y + (targetY - y) * progress;
          }
        }

        this.drawGem(gem, x, y);

        if (selected && selected.row === row && selected.col === col) {
          this.drawSelection(x, y);
        }
      }
    }
  }

  private drawGem(type: GemType, x: number, y: number): void {
    const gradient = this.getGemGradient(type, x, y);
    
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, GEM_SIZE, GEM_SIZE, 8);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    this.drawGemHighlight(x, y);
  }

  private getGemGradient(type: GemType, x: number, y: number): CanvasGradient {
    const gradient = this.ctx.createRadialGradient(
      x + GEM_SIZE * 0.3, y + GEM_SIZE * 0.3, 0,
      x + GEM_SIZE * 0.5, y + GEM_SIZE * 0.5, GEM_SIZE * 0.5
    );

    switch (type) {
      case 'fire':
        gradient.addColorStop(0, '#ff6b35');
        gradient.addColorStop(0.5, '#f7931e');
        gradient.addColorStop(1, '#e63946');
        break;
      case 'ice':
        gradient.addColorStop(0, '#e0f7fa');
        gradient.addColorStop(0.5, '#81d4fa');
        gradient.addColorStop(1, '#1e88e5');
        break;
      case 'lightning':
        gradient.addColorStop(0, '#fffde7');
        gradient.addColorStop(0.5, '#fff176');
        gradient.addColorStop(1, '#ffc107');
        break;
      default:
        gradient.addColorStop(0, '#666');
        gradient.addColorStop(1, '#333');
    }

    return gradient;
  }

  private drawGemHighlight(x: number, y: number): void {
    const gradient = this.ctx.createRadialGradient(
      x + GEM_SIZE * 0.2, y + GEM_SIZE * 0.2, 0,
      x + GEM_SIZE * 0.3, y + GEM_SIZE * 0.3, GEM_SIZE * 0.4
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, GEM_SIZE, GEM_SIZE, 8);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
  }

  private drawSelection(x: number, y: number): void {
    this.ctx.beginPath();
    this.ctx.roundRect(x - 2, y - 2, GEM_SIZE + 4, GEM_SIZE + 4, 10);
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private drawParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = particle.life / particle.maxLife;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= 16.67;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  createExplosion(row: number, col: number, gemType: GemType): void {
    const x = col * CELL_SIZE + GEM_SIZE / 2 + GEM_PADDING;
    const y = row * CELL_SIZE + GEM_SIZE / 2 + GEM_PADDING;
    
    const colors: Record<GemType, string> = {
      fire: '#ff6b35',
      ice: '#81d4fa',
      lightning: '#fff176',
      null: '#666'
    };

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 500,
        maxLife: 500,
        color: colors[gemType] || '#666',
        size: 4 + Math.random() * 3
      });
    }
  }

  setSwapAnimation(pos1: Position, pos2: Position, isReverting: boolean = false): void {
    this.swapAnimation = { pos1, pos2, progress: 0, isReverting };
    this.isAnimating = true;
  }

  updateSwapAnimation(deltaTime: number): boolean {
    if (!this.swapAnimation) return false;
    
    const duration = this.swapAnimation.isReverting ? 300 : 150;
    this.swapAnimation.progress += deltaTime / duration;
    
    if (this.swapAnimation.progress >= 1) {
      this.swapAnimation = null;
      this.isAnimating = false;
      return true;
    }
    
    return false;
  }

  isAnimatingSwap(): boolean {
    return this.isAnimating;
  }

  clearSwapAnimation(): void {
    this.swapAnimation = null;
    this.isAnimating = false;
  }
}

import { Hero, HERO_DEFS, SYNERGY_DEFS, ROLE_NAMES, RACE_NAMES, getActiveSynergies, HeroDef } from './hero';
import { BOARD_SIZE, Board } from './board';
import { CombatSystem, FloatingText, Particle, AttackEffect, SkillEffect } from './combatSystem';

const CELL_SIZE = 64;
const BOARD_OFFSET_X = 0;
const BOARD_OFFSET_Y = 0;

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  boardPixelX: number = 0;
  boardPixelY: number = 0;
  cellSize: number = CELL_SIZE;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d')!;
    this.ctx = ctx;
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  getBoardOrigin(): { x: number; y: number } {
    const boardWidth = BOARD_SIZE * this.cellSize;
    const boardHeight = BOARD_SIZE * this.cellSize;
    const x = (this.canvas.width - boardWidth) / 2;
    const y = (this.canvas.height - boardHeight) / 2 + 30;
    return { x, y };
  }

  cellToPixel(cx: number, cy: number): { x: number; y: number } {
    const origin = this.getBoardOrigin();
    return {
      x: origin.x + cx * this.cellSize + this.cellSize / 2,
      y: origin.y + cy * this.cellSize + this.cellSize / 2,
    };
  }

  pixelToCell(px: number, py: number): { cx: number; cy: number } | null {
    const origin = this.getBoardOrigin();
    const cx = Math.floor((px - origin.x) / this.cellSize);
    const cy = Math.floor((py - origin.y) / this.cellSize);
    if (cx < 0 || cx >= BOARD_SIZE || cy < 0 || cy >= BOARD_SIZE) return null;
    return { cx, cy };
  }

  drawBoard(board: Board, hoverCell: { cx: number; cy: number } | null, selectedHeroDef: HeroDef | null, placementPreview: boolean) {
    const origin = this.getBoardOrigin();
    const ctx = this.ctx;

    ctx.save();

    if (board) {
      // pass
    }

    for (let y = 0; y < BOARD_SIZE; y++) {
      for (let x = 0; x < BOARD_SIZE; x++) {
        const px = origin.x + x * this.cellSize;
        const py = origin.y + y * this.cellSize;

        const isBlue = y <= 3;
        const isRed = y >= 4;

        if (isBlue) {
          ctx.fillStyle = '#1a2a4a';
        } else {
          ctx.fillStyle = '#2a1a1a';
        }

        ctx.fillRect(px, py, this.cellSize, this.cellSize);

        ctx.strokeStyle = '#2a3a5c';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, this.cellSize, this.cellSize);

        const hero = board.grid[y][x];
        if (hero) {
          ctx.strokeStyle = hero.team === 'blue' ? 'rgba(0,212,255,0.4)' : 'rgba(255,68,68,0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, this.cellSize - 4, this.cellSize - 4);
        }

        if (hoverCell && hoverCell.cx === x && hoverCell.cy === y) {
          if (placementPreview && selectedHeroDef && !hero) {
            ctx.fillStyle = 'rgba(0,212,255,0.15)';
            ctx.fillRect(px, py, this.cellSize, this.cellSize);
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, this.cellSize - 2, this.cellSize - 2);
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.06)';
            ctx.fillRect(px, py, this.cellSize, this.cellSize);
          }
        }
      }
    }

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(origin.x, origin.y + 3.5 * this.cellSize, BOARD_SIZE * this.cellSize, this.cellSize * 0);

    const midY = origin.y + 4 * this.cellSize;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(origin.x, midY);
    ctx.lineTo(origin.x + BOARD_SIZE * this.cellSize, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  drawHeroes(heroes: Hero[], now: number) {
    const ctx = this.ctx;
    const origin = this.getBoardOrigin();

    for (const hero of heroes) {
      if (!hero.isAlive) continue;

      const targetPos = this.cellToPixel(hero.x, hero.y);

      if (hero.pixelX === 0 && hero.pixelY === 0) {
        hero.pixelX = targetPos.x;
        hero.pixelY = targetPos.y;
      }

      const lerpSpeed = 0.15;
      hero.pixelX += (targetPos.x - hero.pixelX) * lerpSpeed;
      hero.pixelY += (targetPos.y - hero.pixelY) * lerpSpeed;

      const px = hero.pixelX;
      const py = hero.pixelY;
      const radius = this.cellSize * 0.35;

      let scale = 1;
      if (hero.placeAnimTime > 0) {
        const t = hero.placeAnimTime / 400;
        scale = 1 + Math.sin(t * Math.PI * 3) * 0.15 * t;
      }
      if (hero.skillAnimTime > 0) {
        scale = 1 + 0.2 * Math.sin((hero.skillAnimTime / 500) * Math.PI * 4);
      }

      ctx.save();
      ctx.translate(px, py);
      ctx.scale(scale, scale);

      const gradient = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
      if (hero.team === 'blue') {
        gradient.addColorStop(0, '#1a4a8a');
        gradient.addColorStop(1, '#0a1a3a');
      } else {
        gradient.addColorStop(0, '#8a1a1a');
        gradient.addColorStop(1, '#3a0a0a');
      }
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = hero.team === 'blue' ? '#00d4ff' : '#ff4444';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (hero.hitFlashTime > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hero.hitFlashTime / 200 * 0.6})`;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.font = `${Math.floor(radius * 1.1)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(hero.emoji, 0, 0);

      ctx.restore();

      this.drawHealthBar(px, py - radius - 10, this.cellSize * 0.7, 5, hero.hp / hero.maxHp);

      const rageRatio = hero.rage / 100;
      this.drawRageBar(px, py - radius - 4, this.cellSize * 0.7, 3, rageRatio);

      if (hero.shield > 0) {
        ctx.save();
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.arc(px, py, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }

  drawHealthBar(x: number, y: number, width: number, height: number, ratio: number) {
    const ctx = this.ctx;
    ratio = Math.max(0, Math.min(1, ratio));

    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(x - width / 2, y, width, height);

    let color: string;
    if (ratio > 0.6) color = '#00ff88';
    else if (ratio > 0.3) color = '#ffcc00';
    else color = '#ff3344';

    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y, width * ratio, height);

    ctx.strokeStyle = '#334';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - width / 2, y, width, height);
  }

  drawRageBar(x: number, y: number, width: number, height: number, ratio: number) {
    const ctx = this.ctx;

    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(x - width / 2, y, width, height);

    const color = ratio >= 1.0 ? '#ffd700' : '#4488ff';
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y, width * ratio, height);
  }

  drawFloatingTexts(texts: FloatingText[]) {
    const ctx = this.ctx;
    for (const ft of texts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${ft.fontSize}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  drawParticles(particles: Particle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'fire') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'ice') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 0.01);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'lightning') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * 0.5, p.size);
      } else if (p.type === 'heal') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8 * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shield') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawAttackEffects(effects: AttackEffect[]) {
    const ctx = this.ctx;
    for (const ae of effects) {
      const alpha = Math.max(0, ae.life / ae.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ae.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ae.fromX, ae.fromY);
      ctx.lineTo(ae.toX, ae.toY);
      ctx.stroke();

      ctx.fillStyle = ae.color;
      ctx.beginPath();
      ctx.arc(ae.toX, ae.toY, 6 * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawSkillEffects(effects: SkillEffect[]) {
    const ctx = this.ctx;
    for (const se of effects) {
      const alpha = Math.max(0, se.life / se.maxLife) * 0.3;
      const pixelRange = se.range * this.cellSize;

      ctx.save();
      ctx.globalAlpha = alpha;

      const colors: Record<string, string> = {
        fire: '#ff4400',
        ice: '#88ccff',
        lightning: '#ffff00',
        heal: '#00ff88',
        shield: '#4488ff',
      };

      const gradient = ctx.createRadialGradient(se.x, se.y, 0, se.x, se.y, pixelRange);
      gradient.addColorStop(0, colors[se.type] || '#ff4400');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(se.x, se.y, pixelRange, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawShake(shakeIntensity: number): { dx: number; dy: number } {
    const dx = (Math.random() - 0.5) * shakeIntensity * 2;
    const dy = (Math.random() - 0.5) * shakeIntensity * 2;
    return { dx, dy };
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawDragGhost(heroDef: HeroDef | null, mouseX: number, mouseY: number) {
    if (!heroDef) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.6;
    const radius = this.cellSize * 0.35;
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1a4a8a';
    ctx.fill();
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${Math.floor(radius * 1.1)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(heroDef.emoji, mouseX, mouseY);
    ctx.restore();
  }

  drawBattleStats(
    combat: CombatSystem,
    blueHeroes: Hero[],
    redHeroes: Hero[],
    animProgress: number
  ) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.fillStyle = `rgba(0,0,0,${0.7 * Math.min(1, animProgress / 300)})`;
    ctx.fillRect(0, 0, w, h);

    const panelW = Math.min(500, w - 40);
    const panelH = Math.min(500, h - 80);
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    const panelAlpha = Math.min(1, animProgress / 500);
    ctx.globalAlpha = panelAlpha;

    ctx.fillStyle = '#0d1b2e';
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    this.roundRect(panelX, panelY, panelW, panelH, 12);

    ctx.font = 'bold 22px Rajdhani, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = combat.winner === 'blue' ? '#00d4ff' : '#ff4444';
    ctx.fillText(
      combat.winner === 'blue' ? '⬥ 蓝方胜利 ⬥' : '⬥ 红方胜利 ⬥',
      w / 2, panelY + 35
    );

    const allHeroes = [...blueHeroes, ...redHeroes].sort((a, b) => b.damageDealt - a.damageDealt);
    const maxDmg = Math.max(1, ...allHeroes.map(h => h.damageDealt));

    let yy = panelY + 60;
    const colX = panelX + 20;
    const barWidth = panelW - 160;

    ctx.font = '13px Rajdhani, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8899aa';
    ctx.fillText('英雄', colX, yy);
    ctx.fillText('伤害', colX + 80, yy);
    ctx.fillText('承伤', colX + 130, yy);
    ctx.fillText('治疗', colX + 180, yy);
    ctx.fillText('击杀', colX + 230, yy);
    yy += 5;

    const heroListAlpha = Math.min(1, Math.max(0, (animProgress - 200) / 500));

    for (let i = 0; i < allHeroes.length; i++) {
      const hero = allHeroes[i];
      if (!hero.damageDealt && !hero.damageTaken && !hero.healingDone && hero.kills === 0) continue;

      const itemAlpha = Math.min(1, Math.max(0, (animProgress - 200 - i * 50) / 300));
      if (itemAlpha <= 0) continue;

      ctx.globalAlpha = panelAlpha * itemAlpha;
      yy += 20;

      const barFill = Math.min(1, (animProgress - 200 - i * 50) / 600);

      ctx.font = '13px Rajdhani, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = hero.team === 'blue' ? '#00d4ff' : '#ff6666';
      ctx.fillText(`${hero.emoji} ${hero.name}`, colX, yy);

      const dmgRatio = (hero.damageDealt / maxDmg) * barFill;
      ctx.fillStyle = '#1a2a3a';
      ctx.fillRect(colX + 80, yy - 8, barWidth * 0.3, 10);
      ctx.fillStyle = hero.team === 'blue' ? '#00aaff' : '#ff4444';
      ctx.fillRect(colX + 80, yy - 8, barWidth * 0.3 * dmgRatio, 10);

      ctx.fillStyle = '#ccc';
      ctx.fillText(`${hero.damageTaken}`, colX + 130, yy);
      ctx.fillText(`${hero.healingDone}`, colX + 180, yy);
      ctx.fillText(`${hero.kills}`, colX + 230, yy);
    }

    ctx.globalAlpha = panelAlpha;
    yy += 30;

    const blueAlive = blueHeroes.filter(h => h.isAlive).length;
    const redAlive = redHeroes.filter(h => h.isAlive).length;

    ctx.font = '14px Rajdhani, sans-serif';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText(`蓝方存活: ${blueAlive}  总伤害: ${combat.totalDamageBlue}`, colX, yy);
    yy += 20;
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`红方存活: ${redAlive}  总伤害: ${combat.totalDamageRed}`, colX, yy);

    ctx.restore();
  }

  roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

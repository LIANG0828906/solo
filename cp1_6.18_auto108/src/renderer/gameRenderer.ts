import type { Room, Player, CombatState, Particle, Star, FloatingText, LootAnimation, VictoryState, GameStats } from '../game/types';
import { GRID_SIZE } from '../game/dungeonGenerator';

const WALL_COLOR = '#2D2D44';
const FLOOR_COLOR = '#4A4A6A';
const CORRIDOR_COLOR = '#3D3D5C';
const CHEST_GLOW = '#FFD700';
const PLAYER_COLOR = '#4ECDC4';
const BG_INNER = '#0B0C10';
const BG_OUTER = '#1F2833';

const QUALITY_COLORS: Record<string, string> = {
  white: '#FFFFFF',
  blue: '#3498DB',
  purple: '#9B59B6',
  orange: '#FF6B35',
};

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public width = 0;
  public height = 0;
  private cellSize = 0;
  private offsetX = 0;
  private offsetY = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2d context');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const maxGridWidth = width * 0.85;
    const maxGridHeight = height * 0.85;
    this.cellSize = Math.floor(Math.min(maxGridWidth / GRID_SIZE, maxGridHeight / GRID_SIZE));
    this.offsetX = (width - this.cellSize * GRID_SIZE) / 2;
    this.offsetY = (height - this.cellSize * GRID_SIZE) / 2;
  }

  clear() {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    gradient.addColorStop(0, BG_OUTER);
    gradient.addColorStop(1, BG_INNER);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars(stars: Star[], time: number) {
    for (const star of stars) {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time / 1000 * star.speed + star.phase));
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fill();
    }
  }

  drawDungeon(dungeon: Room[][], _player: Player, time: number) {
    const cs = this.cellSize;
    const ox = this.offsetX;
    const oy = this.offsetY;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const room = dungeon[y][x];
        const rx = ox + x * cs;
        const ry = oy + y * cs;

        this.ctx.fillStyle = WALL_COLOR;
        this.ctx.fillRect(rx, ry, cs, cs);

        const pad = 3;
        this.ctx.fillStyle = room.visited ? FLOOR_COLOR : '#3A3A5A';
        this.ctx.fillRect(rx + pad, ry + pad, cs - pad * 2, cs - pad * 2);

        for (const connId of room.connections) {
          const parts = connId.split('_');
          const cx = parseInt(parts[1]);
          const cy = parseInt(parts[2]);
          const dx = cx - x;
          const dy = cy - y;

          if (dx === 1) {
            this.ctx.fillStyle = CORRIDOR_COLOR;
            this.ctx.fillRect(rx + cs - pad, ry + cs * 0.3, pad * 2, cs * 0.4);
          } else if (dy === 1) {
            this.ctx.fillStyle = CORRIDOR_COLOR;
            this.ctx.fillRect(rx + cs * 0.3, ry + cs - pad, cs * 0.4, pad * 2);
          }
        }

        if (room.visited) {
          if (room.type === 'chest' && !room.cleared) {
            const glowAlpha = 0.5 + 0.5 * Math.sin(time / 250 * Math.PI);
            this.ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha * 0.3})`;
            this.ctx.fillRect(rx + pad, ry + pad, cs - pad * 2, cs - pad * 2);
            this.ctx.font = `${Math.floor(cs * 0.4)}px sans-serif`;
            this.ctx.fillStyle = CHEST_GLOW;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('📦', rx + cs / 2, ry + cs / 2);
          }

          if ((room.type === 'monster' || room.type === 'boss') && !room.cleared) {
            const pulseAlpha = 0.3 + 0.4 * Math.sin(time / 500 * Math.PI);
            this.ctx.beginPath();
            this.ctx.arc(rx + cs / 2, ry + cs / 2, cs * 0.35, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 71, 87, ${pulseAlpha})`;
            this.ctx.fill();
            this.ctx.font = `${Math.floor(cs * 0.35)}px sans-serif`;
            this.ctx.fillStyle = '#FF4757';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(room.type === 'boss' ? '💀' : '👾', rx + cs / 2, ry + cs / 2);
          }

          if (room.type === 'exit') {
            this.ctx.font = `${Math.floor(cs * 0.4)}px sans-serif`;
            this.ctx.fillStyle = '#66FCF1';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🚪', rx + cs / 2, ry + cs / 2);
          }

          if (room.type === 'start') {
            this.ctx.font = `${Math.floor(cs * 0.3)}px sans-serif`;
            this.ctx.fillStyle = '#45A29E';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⬇', rx + cs / 2, ry + cs / 2);
          }

          if (room.cleared && (room.type === 'monster' || room.type === 'boss')) {
            this.ctx.font = `${Math.floor(cs * 0.25)}px sans-serif`;
            this.ctx.fillStyle = '#666';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('✓', rx + cs / 2, ry + cs / 2);
          }
        } else {
          this.ctx.fillStyle = '#1A1A2E';
          this.ctx.fillRect(rx + pad, ry + pad, cs - pad * 2, cs - pad * 2);
          this.ctx.font = `${Math.floor(cs * 0.3)}px sans-serif`;
          this.ctx.fillStyle = '#333';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('?', rx + cs / 2, ry + cs / 2);
        }
      }
    }
  }

  drawPlayer(player: Player, time: number) {
    const cs = this.cellSize;
    const rx = this.offsetX + player.x * cs;
    const ry = this.offsetY + player.y * cs;

    const glow = 0.3 + 0.2 * Math.sin(time / 300);
    this.ctx.beginPath();
    this.ctx.arc(rx + cs / 2, ry + cs / 2, cs * 0.3, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(78, 205, 196, ${glow})`;
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.arc(rx + cs / 2, ry + cs / 2, cs * 0.2, 0, Math.PI * 2);
    this.ctx.fillStyle = PLAYER_COLOR;
    this.ctx.fill();

    this.ctx.font = `${Math.floor(cs * 0.25)}px sans-serif`;
    this.ctx.fillStyle = '#FFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('⚔', rx + cs / 2, ry + cs / 2);
  }

  drawTrail(trailPoints: { x: number; y: number; time: number }[], now: number) {
    const cs = this.cellSize;
    for (const tp of trailPoints) {
      const age = (now - tp.time) / 1000;
      if (age > 1.5) continue;
      const alpha = Math.max(0, 0.4 - age * 0.3);
      const rx = this.offsetX + tp.x * cs + cs / 2;
      const ry = this.offsetY + tp.y * cs + cs / 2;
      this.ctx.beginPath();
      this.ctx.arc(rx, ry, cs * 0.1 * (1 - age * 0.5), 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(78, 205, 196, ${alpha})`;
      this.ctx.fill();
    }
  }

  drawCombatOverlay(combat: CombatState, player: Player, time: number) {
    if (!combat.inCombat || !combat.currentMonster) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.67)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const monster = combat.currentMonster;
    const centerX = this.width / 2;
    const centerY = this.height * 0.35;

    this.ctx.font = 'bold 28px sans-serif';
    this.ctx.fillStyle = monster.isBoss ? '#FF6B35' : '#FF4757';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(monster.name, centerX, centerY - 60);

    const barWidth = 250;
    const barHeight = 20;
    const hpPercent = monster.hp / monster.maxHp;

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(centerX - barWidth / 2, centerY - 30, barWidth, barHeight);
    const hpColor = hpPercent > 0.5 ? '#2ECC71' : hpPercent > 0.25 ? '#F39C12' : '#E74C3C';
    this.ctx.fillStyle = hpColor;
    this.ctx.fillRect(centerX - barWidth / 2, centerY - 30, barWidth * hpPercent, barHeight);
    this.ctx.strokeStyle = '#666';
    this.ctx.strokeRect(centerX - barWidth / 2, centerY - 30, barWidth, barHeight);

    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = '#FFF';
    this.ctx.fillText(`${monster.hp} / ${monster.maxHp}`, centerX, centerY - 20);

    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = '#CCC';
    this.ctx.fillText(`攻击力: ${monster.attack}`, centerX, centerY);

    if (monster.isBoss && combat.bossWarningActive) {
      const warnAge = (time - combat.bossWarningStartTime) / 1000;
      if (warnAge < 0.8) {
        const warnAlpha = 0.5 + 0.5 * Math.sin(warnAge * Math.PI * 5);
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY - 40, 50, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(255, 71, 87, ${warnAlpha})`;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
      }
    }

    const btnY = centerY + 60;
    const btnW = 160;
    const btnH = 44;
    const btnGap = 20;

    const normalBtnX = centerX - btnW - btnGap / 2;
    const skillBtnX = centerX + btnGap / 2;

    const normalReady = combat.normalAttackCooldown <= 0 && combat.playerTurn;
    const skillReady = combat.skillAttackCooldown <= 0 && combat.playerTurn && player.mp >= player.maxMp * 0.25;

    this.ctx.fillStyle = normalReady ? '#45A29E' : '#333';
    this.ctx.beginPath();
    this.roundRect(normalBtnX, btnY, btnW, btnH, 8);
    this.ctx.fill();
    this.ctx.font = '16px sans-serif';
    this.ctx.fillStyle = normalReady ? '#FFF' : '#888';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(
      combat.normalAttackCooldown > 0
        ? `攻击 (${Math.ceil(combat.normalAttackCooldown)}s)`
        : '攻击',
      normalBtnX + btnW / 2,
      btnY + btnH / 2
    );

    this.ctx.fillStyle = skillReady ? '#9B59B6' : '#333';
    this.ctx.beginPath();
    this.roundRect(skillBtnX, btnY, btnW, btnH, 8);
    this.ctx.fill();
    this.ctx.font = '16px sans-serif';
    this.ctx.fillStyle = skillReady ? '#FFF' : '#888';
    this.ctx.fillText(
      combat.skillAttackCooldown > 0
        ? `技能 (${Math.ceil(combat.skillAttackCooldown)}s)`
        : `技能 (${Math.ceil(player.maxMp * 0.25)}MP)`,
      skillBtnX + btnW / 2,
      btnY + btnH / 2
    );

    this.ctx.font = '13px sans-serif';
    this.ctx.fillStyle = '#AAA';
    this.ctx.textAlign = 'center';
    const logStartY = btnY + btnH + 30;
    for (let i = 0; i < combat.combatLog.length; i++) {
      this.ctx.fillText(combat.combatLog[i], centerX, logStartY + i * 20);
    }

    this.drawCombatPlayerInfo(player, centerX, btnY);
  }

  drawCombatPlayerInfo(player: Player, centerX: number, btnY: number) {
    const infoY = btnY + 120;
    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.textAlign = 'center';

    const hpPercent = player.hp / player.maxHp;
    const mpPercent = player.mp / player.maxMp;

    this.ctx.fillStyle = '#AAA';
    this.ctx.fillText(`HP: ${player.hp}/${player.maxHp}`, centerX - 80, infoY);
    this.ctx.fillText(`MP: ${player.mp}/${player.maxMp}`, centerX + 80, infoY);

    const barW = 100;
    const barH = 8;
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(centerX - 130, infoY + 8, barW, barH);
    this.ctx.fillStyle = '#2ECC71';
    this.ctx.fillRect(centerX - 130, infoY + 8, barW * hpPercent, barH);

    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(centerX + 30, infoY + 8, barW, barH);
    this.ctx.fillStyle = '#3498DB';
    this.ctx.fillRect(centerX + 30, infoY + 8, barW * mpPercent, barH);
  }

  drawParticles(particles: Particle[]) {
    for (const p of particles) {
      const alpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.ctx.fill();
    }
  }

  drawFloatingTexts(texts: FloatingText[], now: number) {
    const cs = this.cellSize;
    for (const ft of texts) {
      const age = (now - ft.startTime) / ft.duration;
      if (age > 1) continue;
      const alpha = 1 - age;
      const yOff = -age * 30;

      const rx = this.offsetX + ft.x * cs + cs / 2;
      const ry = this.offsetY + ft.y * cs + cs / 2 + yOff;

      this.ctx.font = 'bold 18px sans-serif';
      this.ctx.fillStyle = ft.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(ft.text, rx, ry);
    }
  }

  drawLootAnimations(animations: LootAnimation[], now: number) {
    const cs = this.cellSize;
    for (const la of animations) {
      const progress = Math.min(1, (now - la.startTime) / la.duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      const sx = this.offsetX + la.startX * cs + cs / 2;
      const sy = this.offsetY + la.startY * cs + cs / 2;
      const ex = this.width - 120;
      const ey = this.height / 2;

      const x = sx + (ex - sx) * eased;
      const y = sy + (ey - sy) * eased - Math.sin(progress * Math.PI) * 80;

      const quality = la.equipment.quality;
      this.ctx.beginPath();
      this.ctx.arc(x, y, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = QUALITY_COLORS[quality];
      this.ctx.fill();
    }
  }

  drawVictory(victory: VictoryState, stats: GameStats, time: number) {
    if (!victory.show) return;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const age = (time - victory.startTime) / 1000;
    const textAlpha = Math.min(1, age * 2);
    const textScale = 0.5 + Math.min(0.5, age * 1.5);

    this.ctx.save();
    this.ctx.translate(this.width / 2, this.height * 0.3);
    this.ctx.scale(textScale, textScale);
    this.ctx.font = 'bold 48px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const grad = this.ctx.createLinearGradient(-120, 0, 120, 0);
    grad.addColorStop(0, `rgba(255, 215, 0, ${textAlpha})`);
    grad.addColorStop(1, `rgba(255, 107, 53, ${textAlpha})`);
    this.ctx.fillStyle = grad;
    this.ctx.fillText('胜利！', 0, 0);
    this.ctx.restore();

    if (age > 0.5) {
      const statsAlpha = Math.min(1, (age - 0.5) * 2);
      this.ctx.font = '18px sans-serif';
      this.ctx.fillStyle = `rgba(204, 204, 204, ${statsAlpha})`;
      this.ctx.textAlign = 'center';

      const statsX = this.width / 2;
      const statsY = this.height * 0.5;
      const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);

      this.ctx.fillText(`击杀数: ${stats.kills}`, statsX, statsY);
      this.ctx.fillText(`收集装备: ${stats.equipmentCollected}`, statsX, statsY + 30);
      this.ctx.fillText(`总时间: ${elapsed}秒`, statsX, statsY + 60);
      this.ctx.fillText(`最高伤害: ${stats.maxDamage}`, statsX, statsY + 90);

      this.ctx.font = '16px sans-serif';
      this.ctx.fillStyle = `rgba(102, 252, 241, ${statsAlpha})`;
      this.ctx.fillText('点击任意处继续', statsX, statsY + 140);
    }
  }

  drawGameOver(_player: Player) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.font = 'bold 42px sans-serif';
    this.ctx.fillStyle = '#E74C3C';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('游戏结束', this.width / 2, this.height * 0.4);

    this.ctx.font = '18px sans-serif';
    this.ctx.fillStyle = '#AAA';
    this.ctx.fillText('点击任意处重新开始', this.width / 2, this.height * 0.55);
  }

  drawFloorIndicator(floor: number) {
    this.ctx.font = '14px sans-serif';
    this.ctx.fillStyle = '#66FCF1';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`第 ${floor + 1} 层`, 16, 28);
  }

  getCombatButtonBounds(): { normal: DOMRect; skill: DOMRect } | null {
    const centerX = this.width / 2;
    const centerY = this.height * 0.35;
    const btnY = centerY + 60;
    const btnW = 160;
    const btnH = 44;
    const btnGap = 20;

    const canvasRect = this.canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / this.width;
    const scaleY = canvasRect.height / this.height;

    return {
      normal: new DOMRect(
        canvasRect.left + (centerX - btnW - btnGap / 2) * scaleX,
        canvasRect.top + btnY * scaleY,
        btnW * scaleX,
        btnH * scaleY
      ),
      skill: new DOMRect(
        canvasRect.left + (centerX + btnGap / 2) * scaleX,
        canvasRect.top + btnY * scaleY,
        btnW * scaleX,
        btnH * scaleY
      ),
    };
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.arcTo(x + w, y, x + w, y + r, r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.arcTo(x, y + h, x, y + h - r, r);
    this.ctx.lineTo(x, y + r);
    this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.closePath();
  }

  getCanvasClickTarget(canvasX: number, canvasY: number): 'normal' | 'skill' | null {
    const centerX = this.width / 2;
    const centerY = this.height * 0.35;
    const btnY = centerY + 60;
    const btnW = 160;
    const btnH = 44;
    const btnGap = 20;

    const normalBtnX = centerX - btnW - btnGap / 2;
    const skillBtnX = centerX + btnGap / 2;

    if (canvasX >= normalBtnX && canvasX <= normalBtnX + btnW && canvasY >= btnY && canvasY <= btnY + btnH) {
      return 'normal';
    }
    if (canvasX >= skillBtnX && canvasX <= skillBtnX + btnW && canvasY >= btnY && canvasY <= btnY + btnH) {
      return 'skill';
    }
    return null;
  }
}

import { Player } from './player';
import {
  World, SceneryType,
  SEGMENT_LENGTH, TOTAL_DISTANCE, SEGMENT_NAMES
} from './world';
import { CombatManager } from './combat';
import { UI } from './ui';

enum GameState {
  IDLE,
  TRAVELING,
  EVENT,
  COMBAT,
  REST,
  GAME_OVER,
  VICTORY
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private player: Player;
  private world: World;
  private combat: CombatManager;
  private ui: UI;
  private state: GameState;
  private frameCount: number = 0;
  private cartScreenX: number = 0;
  private dustParticles: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  private clouds: { x: number; y: number; w: number; speed: number }[] = [];
  private banditFleeing: boolean = false;
  private banditFleeTimer: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.player = new Player();
    this.world = new World();
    this.combat = new CombatManager();
    this.ui = new UI();
    this.state = GameState.IDLE;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * 2000,
        y: 30 + Math.random() * 80,
        w: 60 + Math.random() * 80,
        speed: 0.1 + Math.random() * 0.2
      });
    }

    this.gameLoop();
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.cartScreenX = this.canvas.width * 0.3;
  }

  private gameLoop(): void {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  private update(): void {
    this.frameCount++;
    this.player.update();
    this.ui.update();

    switch (this.state) {
      case GameState.IDLE:
        break;

      case GameState.TRAVELING:
        this.world.update(this.canvas.height);
        if (this.frameCount % 180 === 0 && this.world.isMoving) {
          this.player.takeDamage(1);
        }

        if (this.player.hp <= 0) {
          this.state = GameState.GAME_OVER;
          this.ui.playDefeatSound();
          return;
        }

        if (this.world.hasReachedEnd()) {
          this.state = GameState.VICTORY;
          this.player.addXp(200);
          this.player.addSilver(100);
          this.ui.playVictorySound();
          return;
        }

        {
          const evt = this.world.checkEvents();
          if (evt) {
            if (evt.type === 'bandit') {
              this.world.isMoving = false;
              this.state = GameState.EVENT;
              this.ui.showDialog(
                '前方官道两旁草丛一阵窸窣，三五个手持砍刀的山贼跳了出来拦住去路！"留下银两，饶你不死！"',
                [
                  { text: '亮镖旗', action: 'show_flag' },
                  { text: '拔刀迎战', action: 'fight' }
                ],
                (action) => this.handleBanditChoice(action)
              );
            } else if (evt.type === 'milestone') {
              this.world.isMoving = false;
              this.state = GameState.REST;
              const segName = SEGMENT_NAMES[evt.segmentIndex] || '驿站';
              this.ui.showDialog(
                `已抵达${segName}驿站，可歇脚补给。干粮20两/份，武器升级${30 * this.player.weaponLevel}两。`,
                [
                  { text: '买干粮', action: 'buy_food' },
                  { text: '升级武器', action: 'upgrade_weapon' },
                  { text: '休息恢复', action: 'rest_heal' },
                  { text: '继续出发', action: 'continue' }
                ],
                (action) => this.handleRestChoice(action, segName)
              );
            }
          }
        }
        break;

      case GameState.COMBAT:
        this.combat.update(this.canvas.width, this.canvas.height);
        if (this.combat.isDefeated()) {
          this.combat.stop();
          this.state = GameState.GAME_OVER;
          this.ui.playDefeatSound();
        } else if (this.combat.isCleared()) {
          this.combat.stop();
          this.player.addXp(50);
          this.player.addSilver(30);
          const leveled = this.player.addXp(0);
          if (leveled) {
            // already handled in addXp
          }
          this.world.isMoving = true;
          this.state = GameState.TRAVELING;
          this.ui.showDialog(
            '山贼已被击退！获得经验值50，银两30。',
            [{ text: '继续赶路', action: 'ok' }],
            () => { this.state = GameState.TRAVELING; this.world.isMoving = true; }
          );
          this.state = GameState.EVENT;
          this.ui.playVictorySound();
        }
        break;

      case GameState.EVENT:
      case GameState.REST:
        break;

      case GameState.GAME_OVER:
      case GameState.VICTORY:
        break;
    }

    if (this.banditFleeing) {
      this.banditFleeTimer--;
      if (this.banditFleeTimer <= 0) {
        this.banditFleeing = false;
        this.world.isMoving = true;
        this.state = GameState.TRAVELING;
      }
    }

    if (this.world.isMoving) {
      this.spawnDust();
    }
    this.updateDust();
    this.updateClouds();
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = '#EDE4D4';
    ctx.fillRect(0, 0, w, h);

    this.drawSky(ctx, w, h);
    this.drawClouds(ctx, w);
    this.drawMountains(ctx, w, h);
    this.drawGround(ctx, w, h);
    this.drawRoad(ctx, w, h);
    this.drawChangAnCity(ctx, w, h);
    this.drawScenery(ctx, w, h);
    this.drawLuoyangGate(ctx, w, h);
    this.drawCartAndPlayer(ctx, w, h);
    this.drawDust(ctx);

    if (this.state === GameState.COMBAT) {
      for (const bandit of this.combat.bandits) {
        this.combat.drawBandit(ctx, bandit);
      }
      this.combat.drawSwordFlashes(ctx);
      this.combat.drawSmokes(ctx);
      this.combat.drawCursor(ctx);

      ctx.save();
      ctx.font = 'bold 16px "KaiTi", "STKaiti", "楷体", serif';
      ctx.fillStyle = '#FF4500';
      ctx.textAlign = 'center';
      ctx.fillText(`山贼逼近：${this.combat.escapedBandits}/${this.combat.maxEscaped}`, w / 2, h - 50);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    if (this.banditFleeing) {
      this.drawFleeingBandits(ctx, w, h);
    }

    this.ui.drawBorder(ctx, w, h);
    this.ui.drawHUD(ctx, this.player, this.world, w, h);

    if (this.state === GameState.IDLE) {
      this.ui.drawStartButton(ctx, w, h);
    }

    if (this.state === GameState.EVENT || this.state === GameState.REST) {
      this.ui.drawDialog(ctx, w, h);
    }

    if (this.state === GameState.GAME_OVER) {
      this.ui.drawGameOver(ctx, w, h, false);
    } else if (this.state === GameState.VICTORY) {
      this.ui.drawGameOver(ctx, w, h, true);
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const skyH = h * 0.45;
    const grad = ctx.createLinearGradient(0, 0, 0, skyH);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(0.5, '#B0C4DE');
    grad.addColorStop(1, '#F5DEB3');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, skyH);
  }

  private drawClouds(ctx: CanvasRenderingContext2D, w: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (const cloud of this.clouds) {
      const cx = ((cloud.x - this.world.cameraX * 0.05) % (w + 200)) ;
      ctx.beginPath();
      ctx.ellipse(cx, cloud.y, cloud.w / 2, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - cloud.w * 0.2, cloud.y - 8, cloud.w * 0.3, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + cloud.w * 0.2, cloud.y - 5, cloud.w * 0.25, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMountains(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const mtnY = h * 0.35;
    const offset = -this.world.cameraX * 0.15;

    ctx.fillStyle = '#8B9DC3';
    ctx.beginPath();
    ctx.moveTo(0, mtnY + 60);
    for (let x = -100; x <= w + 100; x += 5) {
      const wx = x - offset;
      const y = mtnY + Math.sin(wx * 0.003) * 30 + Math.sin(wx * 0.008) * 20 + Math.cos(wx * 0.002) * 25;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 100, mtnY + 60);
    ctx.closePath();
    ctx.fill();

    const offset2 = -this.world.cameraX * 0.25;
    ctx.fillStyle = '#7A8B6E';
    ctx.beginPath();
    ctx.moveTo(0, mtnY + 80);
    for (let x = -100; x <= w + 100; x += 5) {
      const wx = x - offset2;
      const y = mtnY + 40 + Math.sin(wx * 0.005) * 25 + Math.cos(wx * 0.003) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 100, mtnY + 80);
    ctx.closePath();
    ctx.fill();
  }

  private drawGround(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const groundY = h * 0.55;
    const grad = ctx.createLinearGradient(0, groundY, 0, h);
    grad.addColorStop(0, '#C2B280');
    grad.addColorStop(0.3, '#B8A878');
    grad.addColorStop(1, '#A09060');
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY, w, h - groundY);
  }

  private drawRoad(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const roadY = h * 0.72;
    const roadH = 40;

    ctx.fillStyle = '#E8E0D8';
    ctx.fillRect(0, roadY - roadH / 2, w, roadH);

    ctx.strokeStyle = '#C8C0B0';
    ctx.lineWidth = 1;
    ctx.setLineDash([20, 15]);
    const dashOffset = -(this.world.cameraX % 35);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    ctx.moveTo(0, roadY);
    ctx.lineTo(w, roadY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#B0A890';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, roadY - roadH / 2);
    ctx.lineTo(w, roadY - roadH / 2);
    ctx.moveTo(0, roadY + roadH / 2);
    ctx.lineTo(w, roadY + roadH / 2);
    ctx.stroke();
  }

  private worldToScreen(worldX: number): number {
    return worldX - this.world.cameraX + this.cartScreenX;
  }

  private drawChangAnCity(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const roadY = h * 0.72;
    const buildings = [
      { wx: -80, bw: 100, bh: 70 },
      { wx: 40, bw: 80, bh: 55 },
      { wx: 150, bw: 90, bh: 65 },
      { wx: 260, bw: 110, bh: 60 },
    ];

    for (const b of buildings) {
      const sx = this.worldToScreen(b.wx);
      if (sx + b.bw < 20 || sx > w - 20) continue;

      const by = roadY - 30 - b.bh;

      ctx.fillStyle = '#C2B280';
      ctx.fillRect(sx, by, b.bw, b.bh);

      ctx.fillStyle = '#8B6914';
      ctx.beginPath();
      ctx.moveTo(sx - 5, by);
      ctx.lineTo(sx + b.bw / 2, by - 25);
      ctx.lineTo(sx + b.bw + 5, by);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4A2F1A';
      ctx.fillRect(sx + b.bw * 0.3, by + b.bh * 0.5, b.bw * 0.15, b.bh * 0.5);
      ctx.fillRect(sx + b.bw * 0.6, by + b.bh * 0.3, b.bw * 0.2, b.bh * 0.2);

      ctx.fillStyle = '#FFD700';
      ctx.fillRect(sx + b.bw * 0.55, by - 2, 2, 15);
      ctx.fillRect(sx + b.bw * 0.45, by + 2, b.bw * 0.2, 8);
    }

    if (this.world.distance < 100) {
      ctx.save();
      ctx.font = 'bold 14px "KaiTi", "STKaiti", "楷体", serif';
      ctx.fillStyle = '#3C2415';
      ctx.textAlign = 'center';
      const labelX = this.worldToScreen(80);
      if (labelX > 20 && labelX < w - 20) {
        ctx.fillText('长安西市', labelX, roadY - 100);
      }
      ctx.textAlign = 'left';
      ctx.restore();
    }
  }

  private drawScenery(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const roadY = h * 0.72;

    for (const obj of this.world.scenery) {
      const sx = this.worldToScreen(obj.x);
      if (sx + obj.width < 20 || sx > w - 20) continue;

      switch (obj.type) {
        case SceneryType.FOREST:
          this.drawForest(ctx, sx, roadY, obj.width, obj.height, obj.treeCount || 3);
          break;
        case SceneryType.VILLAGE:
          this.drawVillage(ctx, sx, roadY, obj.width, obj.height);
          break;
        case SceneryType.TEA_SHED:
          this.drawTeaShed(ctx, sx, roadY, obj.width, obj.height);
          break;
        case SceneryType.RELAY:
          this.drawRelayStation(ctx, sx, roadY, obj.width, obj.height);
          break;
      }
    }
  }

  private drawForest(
    ctx: CanvasRenderingContext2D, sx: number, roadY: number,
    w: number, h: number, count: number
  ): void {
    for (let i = 0; i < count; i++) {
      const tx = sx + (w / count) * i + (w / count) * 0.5;
      const ty = roadY - 25;

      ctx.fillStyle = '#5C3317';
      ctx.fillRect(tx - 4, ty - h * 0.4, 8, h * 0.4);

      ctx.fillStyle = '#2E8B57';
      ctx.beginPath();
      ctx.arc(tx, ty - h * 0.5, h * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3CB371';
      ctx.beginPath();
      ctx.arc(tx + 5, ty - h * 0.55, h * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawVillage(
    ctx: CanvasRenderingContext2D, sx: number, roadY: number,
    w: number, h: number
  ): void {
    const by = roadY - 25 - h;

    ctx.fillStyle = '#C2B280';
    ctx.fillRect(sx, by, w * 0.45, h);
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.moveTo(sx - 3, by);
    ctx.lineTo(sx + w * 0.225, by - 20);
    ctx.lineTo(sx + w * 0.45 + 3, by);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4A2F1A';
    ctx.fillRect(sx + w * 0.15, by + h * 0.5, w * 0.12, h * 0.5);

    ctx.fillStyle = '#C2B280';
    ctx.fillRect(sx + w * 0.55, by + 10, w * 0.4, h - 10);
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.moveTo(sx + w * 0.55 - 3, by + 10);
    ctx.lineTo(sx + w * 0.75, by - 10);
    ctx.lineTo(sx + w * 0.95 + 3, by + 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#5C3317';
    ctx.fillRect(sx + w * 0.65, by + h * 0.4, w * 0.1, h * 0.6);
  }

  private drawTeaShed(
    ctx: CanvasRenderingContext2D, sx: number, roadY: number,
    w: number, h: number
  ): void {
    const by = roadY - 25 - h * 0.5;

    ctx.fillStyle = '#5C3317';
    ctx.fillRect(sx + 3, by, 4, h * 0.5);
    ctx.fillRect(sx + w - 7, by, 4, h * 0.5);

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(sx, by - 3, w, 6);

    ctx.fillStyle = '#C2B280';
    ctx.beginPath();
    ctx.moveTo(sx - 8, by - 3);
    ctx.lineTo(sx + w / 2, by - 18);
    ctx.lineTo(sx + w + 8, by - 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8B6914';
    ctx.fillRect(sx + w / 2 - 1, by - 25, 2, 12);

    ctx.font = '10px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#3C2415';
    ctx.textAlign = 'center';
    ctx.fillText('茶', sx + w / 2, by - 12);
    ctx.textAlign = 'left';
  }

  private drawRelayStation(
    ctx: CanvasRenderingContext2D, sx: number, roadY: number,
    w: number, h: number
  ): void {
    const by = roadY - 30 - h;

    ctx.fillStyle = '#A08050';
    ctx.fillRect(sx, by, w, h);

    ctx.fillStyle = '#6B4226';
    ctx.fillRect(sx, by, w, 5);

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(sx - 5, by);
    ctx.lineTo(sx + w / 2, by - 28);
    ctx.lineTo(sx + w + 5, by);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4A2F1A';
    ctx.fillRect(sx + w * 0.3, by + h * 0.4, w * 0.15, h * 0.6);
    ctx.fillRect(sx + w * 0.6, by + h * 0.4, w * 0.12, h * 0.5);

    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(sx + w / 2 - 25, by + h * 0.2, 50, 18);
    ctx.font = 'bold 12px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#3C2415';
    ctx.textAlign = 'center';
    ctx.fillText('驿站', sx + w / 2, by + h * 0.2 + 14);
    ctx.textAlign = 'left';
  }

  private drawLuoyangGate(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const gateWorldX = TOTAL_DISTANCE - 50;
    const sx = this.worldToScreen(gateWorldX);
    if (sx < -200 || sx > w + 200) return;

    const roadY = h * 0.72;
    const gateH = 120;
    const gateW = 100;
    const gateTop = roadY - 30 - gateH;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(sx, gateTop, 20, gateH);
    ctx.fillRect(sx + gateW - 20, gateTop, 20, gateH);

    ctx.fillStyle = '#6B4226';
    ctx.fillRect(sx, gateTop - 15, gateW, 20);

    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.moveTo(sx - 5, gateTop - 15);
    ctx.lineTo(sx + gateW / 2, gateTop - 45);
    ctx.lineTo(sx + gateW + 5, gateTop - 15);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#4A2F1A';
    ctx.fillRect(sx + 30, roadY - 55, 40, 55);

    ctx.font = 'bold 16px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText('洛阳', sx + gateW / 2, gateTop - 25);
    ctx.textAlign = 'left';
  }

  private drawCartAndPlayer(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const roadY = h * 0.72;
    const cx = this.cartScreenX;
    const cy = roadY;

    const mule1X = cx - 75;
    const mule2X = cx - 55;
    const muleY = cy - 18;

    this.drawMule(ctx, mule1X, muleY);
    this.drawMule(ctx, mule2X, muleY);

    ctx.strokeStyle = '#5C3317';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mule1X + 15, muleY);
    ctx.lineTo(cx - 45, cy - 10);
    ctx.moveTo(mule2X + 15, muleY);
    ctx.lineTo(cx - 45, cy - 10);
    ctx.stroke();

    const cartX = cx - 45;
    const cartY = cy - 40;
    const cartW = 90;
    const cartH = 35;

    ctx.fillStyle = '#6B4226';
    ctx.fillRect(cartX, cartY, cartW, cartH);

    ctx.strokeStyle = '#4A2F1A';
    ctx.lineWidth = 1;
    ctx.strokeRect(cartX + 3, cartY + 3, cartW - 6, cartH - 6);

    ctx.fillStyle = '#A08050';
    ctx.fillRect(cartX, cartY - 8, cartW, 8);

    const wheelR = 12;
    const wheelAngle = (this.world.distance * 0.05);
    this.drawWheel(ctx, cartX + 15, cartY + cartH + 2, wheelR, wheelAngle);
    this.drawWheel(ctx, cartX + cartW - 15, cartY + cartH + 2, wheelR, wheelAngle);

    const flagOffset = Math.sin(this.frameCount * 0.1) * 3;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(cartX + 8, cartY - 8);
    ctx.lineTo(cartX + 8 + 22 + flagOffset, cartY - 8 - 8);
    ctx.lineTo(cartX + 8 + 20 + flagOffset, cartY - 8 + 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cartX + cartW - 8, cartY - 8);
    ctx.lineTo(cartX + cartW - 8 + 22 + flagOffset, cartY - 8 - 8);
    ctx.lineTo(cartX + cartW - 8 + 20 + flagOffset, cartY - 8 + 12);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.font = 'bold 8px "KaiTi", "STKaiti", "楷体", serif';
    ctx.fillStyle = '#1A1A1A';
    ctx.textAlign = 'center';
    ctx.fillText('威武', cartX + 8 + 10 + flagOffset * 0.5, cartY - 5);
    ctx.fillText('镖局', cartX + cartW - 8 + 10 + flagOffset * 0.5, cartY - 5);
    ctx.textAlign = 'left';
    ctx.restore();

    this.drawPlayerCharacter(ctx, cx + 25, roadY);
  }

  private drawMule(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.ellipse(x, y - 5, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#6B5B45';
    ctx.beginPath();
    ctx.ellipse(x + 12, y - 8, 5, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3C2415';
    ctx.beginPath();
    ctx.arc(x + 14, y - 9, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6B5B45';
    ctx.lineWidth = 2;
    const legAnim = Math.sin(this.frameCount * 0.15) * 3;
    if (this.world.isMoving) {
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 2);
      ctx.lineTo(x - 8 + legAnim, y + 12);
      ctx.moveTo(x + 8, y + 2);
      ctx.lineTo(x + 8 - legAnim, y + 12);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 2);
      ctx.lineTo(x - 8, y + 12);
      ctx.moveTo(x + 8, y + 2);
      ctx.lineTo(x + 8, y + 12);
      ctx.stroke();
    }

    ctx.fillStyle = '#3C2415';
    ctx.beginPath();
    ctx.ellipse(x + 16, y - 4, 5, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWheel(
    ctx: CanvasRenderingContext2D, x: number, y: number,
    r: number, angle: number
  ): void {
    ctx.strokeStyle = '#4A2F1A';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.arc(x, y, r - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#4A2F1A';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = angle + (Math.PI * 2 / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2));
      ctx.stroke();
    }

    ctx.fillStyle = '#4A2F1A';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlayerCharacter(ctx: CanvasRenderingContext2D, x: number, roadY: number): void {
    const py = roadY - 5;

    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x - 7, py - 32, 14, 22);

    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x - 9, py - 10, 18, 12);

    ctx.strokeStyle = '#4A4A4A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, py + 2);
    ctx.lineTo(x - 4, py + 14);
    ctx.moveTo(x, py + 2);
    ctx.lineTo(x + 4, py + 14);
    ctx.stroke();

    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.arc(x, py - 38, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(x - 5, py - 44, 10, 3);

    ctx.fillStyle = '#C2A670';
    ctx.beginPath();
    ctx.ellipse(x, py - 46, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B8956A';
    ctx.beginPath();
    ctx.ellipse(x, py - 48, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x + 10, py - 22, 4, 18);
    ctx.fillStyle = '#3C3C3C';
    ctx.fillRect(x + 11, py - 22, 2, 8);

    if (this.player.isSwinging || (this.state === GameState.COMBAT && this.combat.isActive)) {
      const swingAngle = this.player.isSwinging ? this.player.swingAngle : 0;
      ctx.save();
      ctx.translate(x + 8, py - 26);
      ctx.rotate(-0.5 + swingAngle);

      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(0, -1.5, 22, 3);
      ctx.fillStyle = '#D4AF37';
      ctx.fillRect(20, -4, 4, 8);

      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(x + 10, py - 22);
      ctx.rotate(0.1);
      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(-1, -2, 3, 16);
      ctx.restore();
    }

    if (this.player.isUpgrading) {
      const glow = Math.sin(this.player.upgradeTimer * 0.15) * 0.3 + 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(255, 215, 0, ${glow})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, py - 30, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  private drawFleeingBandits(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const roadY = h * 0.72;
    const fleeProgress = 1 - this.banditFleeTimer / 90;

    for (let i = 0; i < 3; i++) {
      const bx = this.cartScreenX - 80 - fleeProgress * 200 - i * 30;
      const by = roadY - 25;

      if (bx < -50 || bx > w + 50) continue;

      ctx.save();
      ctx.globalAlpha = 1 - fleeProgress;
      ctx.fillStyle = '#5C4033';
      ctx.fillRect(bx - 6, by - 24, 12, 18);
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(bx - 8, by - 6, 16, 14);
      ctx.fillStyle = '#D2B48C';
      ctx.beginPath();
      ctx.arc(bx, by - 30, 6, 0, Math.PI * 2);
      ctx.fill();

      if (fleeProgress < 0.5) {
        ctx.font = '10px "KaiTi", "STKaiti", "楷体", serif';
        ctx.fillStyle = '#8B0000';
        ctx.textAlign = 'center';
        ctx.fillText('是威远镖局的！撤！', bx, by - 40);
        ctx.textAlign = 'left';
      }

      ctx.restore();
    }
  }

  private spawnDust(): void {
    if (this.frameCount % 3 !== 0) return;
    const roadY = this.canvas.height * 0.72;
    this.dustParticles.push({
      x: this.cartScreenX - 50 + Math.random() * 10,
      y: roadY + 5 + Math.random() * 8,
      vx: -0.5 - Math.random() * 1,
      vy: -0.3 - Math.random() * 0.5,
      life: 30
    });
  }

  private updateDust(): void {
    for (const p of this.dustParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
    this.dustParticles = this.dustParticles.filter(p => p.life > 0);
  }

  private drawDust(ctx: CanvasRenderingContext2D): void {
    for (const p of this.dustParticles) {
      ctx.save();
      ctx.globalAlpha = p.life / 30 * 0.4;
      ctx.fillStyle = '#C2B280';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private updateClouds(): void {
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed;
    }
  }

  private handleClick(e: MouseEvent): void {
    this.ui.initAudio();

    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (this.state === GameState.IDLE) {
      if (this.ui.isStartButtonClick(mx, my)) {
        this.ui.playClickSound();
        this.startTraveling();
      }
      return;
    }

    if (this.state === GameState.EVENT || this.state === GameState.REST) {
      const action = this.ui.handleDialogClick(mx, my);
      if (action) {
        // handled by callback
      }
      return;
    }

    if (this.state === GameState.COMBAT) {
      const hit = this.combat.handleClick(mx, my);
      if (hit) {
        this.player.startSwing();
        this.ui.playSwordSound();
      }
      return;
    }

    if (this.state === GameState.GAME_OVER || this.state === GameState.VICTORY) {
      this.reset();
      return;
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    this.ui.handleMouseMove(mx, my);

    if (this.state === GameState.COMBAT) {
      this.combat.mouseX = mx;
      this.combat.mouseY = my;
    }
  }

  private startTraveling(): void {
    this.state = GameState.TRAVELING;
    this.world.isMoving = true;
  }

  private handleBanditChoice(action: string): void {
    if (action === 'show_flag') {
      const success = Math.random() < 0.6;
      if (success) {
        this.banditFleeing = true;
        this.banditFleeTimer = 90;
        this.state = GameState.TRAVELING;
        this.world.isMoving = false;
        this.player.addXp(20);
        this.ui.showDialog(
          '山贼见杏黄镖旗，大惊失色："是威远镖局的！撤！"山贼抱头鼠窜。',
          [{ text: '甚好', action: 'ok' }],
          () => {
            this.banditFleeing = false;
            this.world.isMoving = true;
            this.state = GameState.TRAVELING;
          }
        );
        this.state = GameState.EVENT;
      } else {
        this.ui.showDialog(
          '山贼头目冷笑："威武镖局？没听过！弟兄们，上！"',
          [{ text: '迎战', action: 'fight' }],
          () => this.startCombat()
        );
        this.state = GameState.EVENT;
      }
    } else if (action === 'fight') {
      this.startCombat();
    }
  }

  private handleRestChoice(action: string, segName: string): void {
    switch (action) {
      case 'buy_food':
        if (this.player.buyFood()) {
          this.ui.playClickSound();
        } else {
          // not enough silver
        }
        this.ui.showDialog(
          `已抵达${segName}驿站。干粮×${this.player.food}，银两${this.player.silver}。`,
          [
            { text: '买干粮', action: 'buy_food' },
            { text: '升级武器', action: 'upgrade_weapon' },
            { text: '休息恢复', action: 'rest_heal' },
            { text: '继续出发', action: 'continue' }
          ],
          (a) => this.handleRestChoice(a, segName)
        );
        this.state = GameState.REST;
        break;

      case 'upgrade_weapon':
        if (this.player.upgradeWeapon()) {
          this.ui.playClickSound();
        }
        this.ui.showDialog(
          `武器等级Lv${this.player.weaponLevel}，银两${this.player.silver}。`,
          [
            { text: '买干粮', action: 'buy_food' },
            { text: '升级武器', action: 'upgrade_weapon' },
            { text: '休息恢复', action: 'rest_heal' },
            { text: '继续出发', action: 'continue' }
          ],
          (a) => this.handleRestChoice(a, segName)
        );
        this.state = GameState.REST;
        break;

      case 'rest_heal':
        this.player.heal(20);
        this.ui.showDialog(
          `休息片刻，体力恢复20。当前体力${this.player.hp}/${this.player.maxHp}。`,
          [
            { text: '买干粮', action: 'buy_food' },
            { text: '升级武器', action: 'upgrade_weapon' },
            { text: '休息恢复', action: 'rest_heal' },
            { text: '继续出发', action: 'continue' }
          ],
          (a) => this.handleRestChoice(a, segName)
        );
        this.state = GameState.REST;
        break;

      case 'continue':
        this.ui.playClickSound();
        this.player.addXp(30);
        this.player.addSilver(20);
        this.world.isMoving = true;
        this.state = GameState.TRAVELING;
        break;
    }
  }

  private startCombat(): void {
    this.state = GameState.COMBAT;
    const roadY = this.canvas.height * 0.72;
    this.combat.start(
      this.cartScreenX,
      roadY,
      this.player.getAttackRange()
    );
  }

  private reset(): void {
    this.player = new Player();
    this.world = new World();
    this.combat = new CombatManager();
    this.state = GameState.IDLE;
    this.banditFleeing = false;
    this.banditFleeTimer = 0;
    this.dustParticles = [];
    this.frameCount = 0;
  }
}

new Game();

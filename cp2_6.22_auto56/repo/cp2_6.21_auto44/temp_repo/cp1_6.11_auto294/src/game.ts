export interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
}

export interface Arrow {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  landed: boolean;
  potted: boolean;
  trail: TrailPoint[];
}

export interface Player {
  name: '甲方' | '乙方';
  totalScore: number;
  roundHits: number;
  roundMisses: number;
}

export interface Pot {
  x: number;
  groundY: number;
  height: number;
  mouthDiameter: number;
  bodyDiameter: number;
}

type HintMessage = { text: string; life: number; maxLife: number };

const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

export class GameEngine {
  static readonly GRAVITY = 0.3;
  static readonly DRAG = 0.01;
  static readonly ARROW_LENGTH = 80;
  static readonly ARROW_THICKNESS = 4;
  static readonly POT_THRESHOLD_Y = 2;
  static readonly ARROWS_PER_ROUND = 5;
  static readonly TOTAL_ROUNDS = 10;
  static readonly HIT_SCORE = 10;

  currentRound: number;
  currentPlayerIndex: number;
  players: [Player, Player];
  arrowsInRound: number;
  arrows: Arrow[];
  activeArrow: Arrow | null;
  charging: boolean;
  chargeValue: number;
  ripples: Ripple[];
  pot: Pot;
  groundY: number;
  waitingArrowSettle: boolean;
  hintMessage: HintMessage | null;
  roundEndPending: boolean;
  gameEnded: boolean;
  roundStatsVisible: boolean;
  roundStatsTimer: number;
  potSuccessCallback: (() => void) | null;

  canvasWidth: number;
  canvasHeight: number;
  scale: number;

  private arrowIdCounter: number;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.scale = this.calculateScale(width);
    this.arrowIdCounter = 0;

    this.groundY = height * 0.82;

    const playerStandX = width * 0.18;
    const potX = playerStandX + 200 * this.scale;

    this.pot = {
      x: potX,
      groundY: this.groundY,
      height: 120 * this.scale,
      mouthDiameter: 80 * this.scale,
      bodyDiameter: 60 * this.scale,
    };

    this.currentRound = 1;
    this.currentPlayerIndex = 0;
    this.players = [
      { name: '甲方', totalScore: 0, roundHits: 0, roundMisses: 0 },
      { name: '乙方', totalScore: 0, roundHits: 0, roundMisses: 0 },
    ];
    this.arrowsInRound = 0;
    this.arrows = [];
    this.activeArrow = null;
    this.charging = false;
    this.chargeValue = 0;
    this.ripples = [];
    this.waitingArrowSettle = false;
    this.hintMessage = null;
    this.roundEndPending = false;
    this.gameEnded = false;
    this.roundStatsVisible = false;
    this.roundStatsTimer = 0;
    this.potSuccessCallback = null;

    this.showHint(`请${this.getCurrentPlayer().name}投箭`);
  }

  private calculateScale(width: number): number {
    return width < 768 ? 0.7 : 1.0;
  }

  resize(width: number, height: number): void {
    const oldScale = this.scale;
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.scale = this.calculateScale(width);

    const scaleRatio = this.scale / oldScale;

    this.groundY = height * 0.82;

    const playerStandX = width * 0.18;
    const potX = playerStandX + 200 * this.scale;

    this.pot.x = potX;
    this.pot.groundY = this.groundY;
    this.pot.height = 120 * this.scale;
    this.pot.mouthDiameter = 80 * this.scale;
    this.pot.bodyDiameter = 60 * this.scale;

    this.arrows.forEach(a => {
      a.x *= scaleRatio;
      a.y = a.y * scaleRatio + (this.groundY - this.groundY / scaleRatio);
      a.vx *= scaleRatio;
      a.vy *= scaleRatio;
    });
  }

  getPlayerStandX(): number {
    return this.canvasWidth * 0.18;
  }

  getPlayerHandY(): number {
    return this.groundY - 110 * this.scale;
  }

  startCharging(): void {
    if (this.gameEnded || this.waitingArrowSettle || this.arrowsInRound >= GameEngine.ARROWS_PER_ROUND) {
      return;
    }
    if (this.roundStatsVisible) return;
    this.charging = true;
    this.chargeValue = 0;
  }

  updateCharging(dt: number): void {
    if (!this.charging) return;
    const speed = 55;
    this.chargeValue = Math.min(100, this.chargeValue + speed * dt);
  }

  releaseArrow(): Arrow | null {
    if (!this.charging) return null;
    this.charging = false;

    if (this.chargeValue < 5) {
      this.chargeValue = 0;
      return null;
    }

    const arrow = this.createArrow();
    this.activeArrow = arrow;
    this.arrows.push(arrow);
    this.arrowsInRound++;
    this.waitingArrowSettle = true;
    this.chargeValue = 0;

    return arrow;
  }

  private createArrow(): Arrow {
    const charge = this.chargeValue;
    const s = this.scale;
    const angle = Math.PI / 4 - (charge / 100) * (Math.PI / 6);
    const speed = (3 + (charge / 100) * 12) * s;
    const startX = this.getPlayerStandX() + 10 * s;
    const startY = this.getPlayerHandY();

    return {
      id: this.arrowIdCounter++,
      x: startX,
      y: startY,
      vx: speed * Math.cos(angle),
      vy: -speed * Math.sin(angle),
      angle: -angle,
      landed: false,
      potted: false,
      trail: [],
    };
  }

  update(dt: number): void {
    if (this.gameEnded) {
      this.updateEffects(dt);
      return;
    }

    if (this.charging) {
      this.updateCharging(dt);
    }

    if (this.hintMessage) {
      this.hintMessage.life -= dt;
      if (this.hintMessage.life <= 0) {
        this.hintMessage = null;
      }
    }

    if (this.roundStatsVisible) {
      this.roundStatsTimer -= dt;
      if (this.roundStatsTimer <= 0) {
        this.roundStatsVisible = false;
        this.proceedAfterRoundStats();
      }
    }

    this.updateArrows(dt);
    this.updateEffects(dt);

    if (this.waitingArrowSettle && this.activeArrow) {
      if (this.activeArrow.landed || this.activeArrow.potted) {
        this.onArrowSettled();
      }
    }
  }

  private updateArrows(dt: number): void {
    for (const arrow of this.arrows) {
      if (arrow.landed || arrow.potted) continue;
      this.updateArrowPhysics(arrow, dt);
      this.updateArrowTrail(arrow);
      this.checkCollision(arrow);
    }
  }

  private updateArrowPhysics(arrow: Arrow, dt: number): void {
    const s = this.scale;
    const drag = GameEngine.DRAG;
    const gravity = GameEngine.GRAVITY * s;

    arrow.vx = arrow.vx * (1 - drag);
    arrow.vy = arrow.vy * (1 - drag) + gravity;

    arrow.x += arrow.vx;
    arrow.y += arrow.vy;

    if (Math.abs(arrow.vx) > 0.01 || Math.abs(arrow.vy) > 0.01) {
      arrow.angle = Math.atan2(arrow.vy, arrow.vx);
    }
  }

  private updateArrowTrail(arrow: Arrow): void {
    const tailX = arrow.x - Math.cos(arrow.angle) * GameEngine.ARROW_LENGTH * this.scale * 0.5;
    const tailY = arrow.y - Math.sin(arrow.angle) * GameEngine.ARROW_LENGTH * this.scale * 0.5;

    arrow.trail.push({ x: tailX, y: tailY, life: 1.0 });

    if (arrow.trail.length > 20) {
      arrow.trail.shift();
    }

    for (const t of arrow.trail) {
      t.life -= 1 / 18;
    }
    arrow.trail = arrow.trail.filter(t => t.life > 0);
  }

  private checkCollision(arrow: Arrow): void {
    const s = this.scale;
    const pot = this.pot;
    const potMouthY = pot.groundY - pot.height;
    const potMouthRadius = pot.mouthDiameter / 2;
    const potBodyRadius = pot.bodyDiameter / 2;
    const potTopY = potMouthY;
    const potBottomY = pot.groundY;

    if (this.checkPotSuccess(arrow)) {
      arrow.potted = true;
      arrow.vx = 0;
      arrow.vy = 0;
      arrow.y = potMouthY + 10 * s;

      const curr = this.getCurrentPlayer();
      curr.roundHits++;
      curr.totalScore += GameEngine.HIT_SCORE;

      this.ripples.push({
        x: pot.x,
        y: potMouthY,
        radius: 5 * s,
        maxRadius: 60 * s,
        life: 0.5,
        maxLife: 0.5,
      });

      if (this.potSuccessCallback) {
        this.potSuccessCallback();
      }
      return;
    }

    const mouthEdgeDistX = Math.abs(arrow.x - pot.x);
    const nearMouthY = Math.abs(arrow.y - potMouthY) < 10 * s;

    if (nearMouthY && mouthEdgeDistX > potMouthRadius - 5 * s && mouthEdgeDistX < potMouthRadius + 10 * s) {
      if (arrow.vy > 0) {
        arrow.vx = -Math.abs(arrow.vx) * 0.4 * (arrow.x < pot.x ? -1 : 1);
        arrow.vy = -Math.abs(arrow.vy) * 0.5;
        return;
      }
    }

    const inPotHeight = arrow.y > potTopY + 10 * s && arrow.y < potBottomY;
    const bodyLeft = pot.x - potBodyRadius;
    const bodyRight = pot.x + potBodyRadius;

    if (inPotHeight) {
      if (arrow.x > bodyLeft && arrow.x < bodyRight && arrow.y < potTopY + pot.height * 0.8) {
        if (!arrow.potted) {
          const fromLeft = Math.abs(arrow.x - bodyLeft);
          const fromRight = Math.abs(arrow.x - bodyRight);
          if (fromLeft < fromRight) {
            arrow.x = bodyLeft;
            arrow.vx = -Math.abs(arrow.vx) * 0.3;
          } else {
            arrow.x = bodyRight;
            arrow.vx = Math.abs(arrow.vx) * 0.3;
          }
          arrow.vy *= 0.5;
        }
        return;
      }
    }

    const potMouthLeftX = pot.x - potMouthRadius;
    const potMouthRightX = pot.x + potMouthRadius;
    const withinMouthX = arrow.x >= potMouthLeftX && arrow.x <= potMouthRightX;

    if (!withinMouthX && inPotHeight) {
      const distLeft = Math.abs(arrow.x - potMouthLeftX);
      const distRight = Math.abs(arrow.x - potMouthRightX);
      const minDist = Math.min(distLeft, distRight);

      if (minDist < 8 * s) {
        if (distLeft < distRight) {
          arrow.x = potMouthLeftX - 1;
          arrow.vx = -Math.abs(arrow.vx) * 0.3;
        } else {
          arrow.x = potMouthRightX + 1;
          arrow.vx = Math.abs(arrow.vx) * 0.3;
        }
        arrow.vy *= 0.5;
      }
    }

    if (arrow.y >= this.groundY) {
      this.handleLanding(arrow);
    }

    if (arrow.x < -200 * s || arrow.x > this.canvasWidth + 200 * s) {
      arrow.landed = true;
      arrow.vx = 0;
      arrow.vy = 0;
    }
  }

  private checkPotSuccess(arrow: Arrow): boolean {
    if (arrow.potted) return false;

    const s = this.scale;
    const pot = this.pot;
    const potMouthY = pot.groundY - pot.height;
    const potMouthRadius = pot.mouthDiameter / 2;

    const dx = Math.abs(arrow.x - pot.x);
    const dy = arrow.y - potMouthY;

    const inHorizontalRange = dx <= (potMouthRadius + 20 * s);
    const inVerticalRange = dy >= -15 * s && dy <= 25 * s;
    const lowVelocity = arrow.vy > 0 && arrow.vy < GameEngine.POT_THRESHOLD_Y * s;

    return inHorizontalRange && inVerticalRange && lowVelocity;
  }

  private handleLanding(arrow: Arrow): void {
    arrow.y = this.groundY;
    if (Math.abs(arrow.vy) < 0.5 * this.scale) {
      arrow.landed = true;
      arrow.vy = 0;
      arrow.vx = 0;
    } else {
      arrow.vy = -Math.abs(arrow.vy) * 0.2;
      arrow.vx *= 0.7;
    }
  }

  private onArrowSettled(): void {
    this.waitingArrowSettle = false;

    if (!this.activeArrow?.potted) {
      this.getCurrentPlayer().roundMisses++;
    }

    this.activeArrow = null;

    if (this.arrowsInRound >= GameEngine.ARROWS_PER_ROUND) {
      this.endRound();
    }
  }

  private updateEffects(dt: number): void {
    for (const r of this.ripples) {
      r.life -= dt;
      const progress = 1 - r.life / r.maxLife;
      r.radius = 5 * this.scale + progress * (r.maxRadius - 5 * this.scale);
    }
    this.ripples = this.ripples.filter(r => r.life > 0);
  }

  endRound(): void {
    this.roundStatsVisible = true;
    this.roundStatsTimer = 3.0;
    this.arrows = [];
  }

  private proceedAfterRoundStats(): void {
    const wasPlayerA = this.currentPlayerIndex === 0;

    this.getCurrentPlayer().roundHits = 0;
    this.getCurrentPlayer().roundMisses = 0;
    this.arrowsInRound = 0;

    if (wasPlayerA) {
      this.currentPlayerIndex = 1;
    } else {
      this.currentPlayerIndex = 0;
      this.currentRound++;
    }

    if (this.currentRound > GameEngine.TOTAL_ROUNDS) {
      this.gameEnded = true;
      return;
    }

    this.showHint(`请${this.getCurrentPlayer().name}投箭`);
  }

  showHint(text: string): void {
    this.hintMessage = { text, life: 1.5, maxLife: 1.5 };
  }

  getCurrentPlayer(): Player {
    return this.players[this.currentPlayerIndex];
  }

  getRoundStats(): { hits: number; misses: number; score: number } {
    const p = this.getCurrentPlayer();
    return { hits: p.roundHits, misses: p.roundMisses, score: p.totalScore };
  }

  getWinner(): Player | null {
    if (!this.gameEnded) return null;
    const [a, b] = this.players;
    if (a.totalScore > b.totalScore) return a;
    if (b.totalScore > a.totalScore) return b;
    return null;
  }

  getRoundChinese(): string {
    if (this.currentRound <= 10) {
      return `第${CHINESE_NUMBERS[this.currentRound - 1]}回合`;
    }
    return `第${this.currentRound}回合`;
  }

  reset(): void {
    const w = this.canvasWidth;
    const h = this.canvasHeight;
    this.scale = this.calculateScale(w);
    this.groundY = h * 0.82;

    const playerStandX = w * 0.18;
    const potX = playerStandX + 200 * this.scale;

    this.pot.x = potX;
    this.pot.groundY = this.groundY;
    this.pot.height = 120 * this.scale;
    this.pot.mouthDiameter = 80 * this.scale;
    this.pot.bodyDiameter = 60 * this.scale;

    this.currentRound = 1;
    this.currentPlayerIndex = 0;
    this.players = [
      { name: '甲方', totalScore: 0, roundHits: 0, roundMisses: 0 },
      { name: '乙方', totalScore: 0, roundHits: 0, roundMisses: 0 },
    ];
    this.arrowsInRound = 0;
    this.arrows = [];
    this.activeArrow = null;
    this.charging = false;
    this.chargeValue = 0;
    this.ripples = [];
    this.waitingArrowSettle = false;
    this.hintMessage = null;
    this.roundEndPending = false;
    this.gameEnded = false;
    this.roundStatsVisible = false;
    this.roundStatsTimer = 0;
    this.arrowIdCounter = 0;

    this.showHint(`请${this.getCurrentPlayer().name}投箭`);
  }
}

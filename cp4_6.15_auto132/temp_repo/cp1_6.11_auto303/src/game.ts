import {
  Team, Player, Vec2, vec2, vec2Dist, vec2Sub, vec2Normalize, vec2Scale,
  FIELD_W, FIELD_H, CENTER_R, GOAL_W, GOAL_H, PLAYER_R, BALL_R,
  BALL_FRICTION, PASS_SPEED, SHOT_SPEED, ATTACK_TIME, HALF_TIME, REST_TIME,
  TACKLE_DIST, SAVE_RANGE
} from './team';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface Audience {
  x: number;
  y: number;
  radius: number;
  color: string;
  jumpTimer: number;
  baseY: number;
}

export type GameState = 'title' | 'kickoff' | 'playing' | 'goal' | 'outOfBounds' | 'halftime' | 'gameover';

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scale: number = 1;

  teamA: Team;
  teamB: Team;
  ballPos: Vec2 = vec2(FIELD_W / 2, FIELD_H / 2);
  ballVel: Vec2 = vec2(0, 0);
  ballOwner: Player | null = null;
  ballOwnerTeamId: number = -1;

  state: GameState = 'title';
  matchTimer: number = HALF_TIME;
  attackTimer: number = ATTACK_TIME;
  halfNum: number = 1;
  restTimer: number = 0;
  stateTimer: number = 0;
  goalFadeIn: number = 0;

  particles: Particle[] = [];
  audience: Audience[] = [];

  keys: Set<string> = new Set();
  controlledPlayer: Player | null = null;

  totalPossTimeA: number = 0;
  totalPossTimeB: number = 0;
  outOfBoundsTeamId: number = -1;
  throwInPos: Vec2 = vec2(0, 0);
  throwInTimer: number = 0;

  lastTimestamp: number = 0;
  goalScorerTeamId: number = -1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.teamA = new Team(0, 1, '赤焰队');
    this.teamB = new Team(1, -1, '苍澜队');
    this.initAudience();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      if (e.key === 'Enter' && this.state === 'title') {
        this.startMatch();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
  }

  resize() {
    const w = window.innerWidth;
    if (w < 600) {
      this.scale = 0.5;
      this.canvas.width = 400;
      this.canvas.height = 250;
    } else {
      this.scale = 1;
      this.canvas.width = 800;
      this.canvas.height = 500;
    }
  }

  initAudience() {
    this.audience = [];
    const colors = ['#E57373', '#64B5F6', '#FFD54F', '#81C784', '#FFB74D', '#BA68C8', '#4FC3F7', '#F06292', '#AED581', '#FF8A65'];
    for (let i = 0; i < 10; i++) {
      const side = i < 5 ? 0 : 1;
      const x = side === 0
        ? -30 - Math.random() * 40
        : FIELD_W + 30 + Math.random() * 40;
      const y = 50 + (i % 5) * 90 + Math.random() * 30;
      this.audience.push({
        x,
        y,
        radius: 10,
        color: colors[i],
        jumpTimer: 0,
        baseY: y
      });
    }
  }

  startMatch() {
    this.teamA.score = 0;
    this.teamB.score = 0;
    this.teamA.shots = 0;
    this.teamB.shots = 0;
    this.teamA.direction = 1;
    this.teamB.direction = -1;
    this.totalPossTimeA = 0;
    this.totalPossTimeB = 0;
    this.halfNum = 1;
    this.teamA.resetPositions();
    this.teamB.resetPositions();
    this.resetBall();
    this.state = 'kickoff';
    this.stateTimer = 1.5;
    this.matchTimer = HALF_TIME;
    this.attackTimer = ATTACK_TIME;
  }

  resetBall() {
    this.ballPos = vec2(FIELD_W / 2, FIELD_H / 2);
    this.ballVel = vec2(0, 0);
    this.ballOwner = null;
    this.ballOwnerTeamId = -1;
    this.controlledPlayer = null;
  }

  kickoff() {
    this.resetBall();
    this.teamA.resetPositions();
    this.teamB.resetPositions();
    this.attackTimer = ATTACK_TIME;
    const kicker = this.teamA.players[5];
    kicker.hasBall = true;
    this.ballOwner = kicker;
    this.ballOwnerTeamId = 0;
    this.controlledPlayer = kicker;
    this.state = 'playing';
  }

  update(dt: number) {
    this.updateAudience(dt);

    switch (this.state) {
      case 'title':
        break;
      case 'kickoff':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.kickoff();
        }
        break;
      case 'playing':
        this.updatePlaying(dt);
        break;
      case 'goal':
        this.stateTimer -= dt;
        this.goalFadeIn = Math.min(1, this.goalFadeIn + dt * 2);
        if (this.stateTimer <= 0) {
          this.goalFadeIn = 0;
          if (this.matchTimer <= 0) {
            this.endHalf();
          } else {
            this.state = 'kickoff';
            this.stateTimer = 1.5;
            this.resetBall();
            this.teamA.resetPositions();
            this.teamB.resetPositions();
          }
        }
        break;
      case 'outOfBounds':
        this.throwInTimer -= dt;
        if (this.throwInTimer <= 0.3 && this.throwInTimer + dt > 0.3) {
          this.ballVel = vec2(0, 0);
        }
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.performThrowIn();
          this.state = 'playing';
        }
        break;
      case 'halftime':
        this.restTimer -= dt;
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.teamA.switchDirection();
          this.teamB.switchDirection();
          this.halfNum = 2;
          this.matchTimer = HALF_TIME;
          this.state = 'kickoff';
          this.stateTimer = 1.5;
          this.resetBall();
        }
        break;
      case 'gameover':
        break;
    }

    this.updateParticles(dt);
    for (const p of this.teamA.players) p.update();
    for (const p of this.teamB.players) p.update();
  }

  updatePlaying(dt: number) {
    this.matchTimer -= dt;
    this.attackTimer -= dt;

    if (this.ballOwnerTeamId === 0) {
      this.totalPossTimeA += dt;
      this.teamA.possessionTime += dt;
    } else if (this.ballOwnerTeamId === 1) {
      this.totalPossTimeB += dt;
      this.teamB.possessionTime += dt;
    }

    if (this.matchTimer <= 0) {
      this.endHalf();
      return;
    }

    if (this.attackTimer <= 0) {
      this.turnover();
      return;
    }

    this.handleUserInput();
    this.handleAI();

    this.updateBallPhysics();

    this.checkGoal();
    this.checkOutOfBounds();
    this.checkTackles();
  }

  handleUserInput() {
    const team = this.teamA;
    if (!this.controlledPlayer || this.controlledPlayer.teamId !== 0) {
      const carrier = team.getBallCarrier();
      if (carrier) {
        this.controlledPlayer = carrier;
      } else {
        let nearest: Player | null = null;
        let minDist = Infinity;
        for (const p of team.players) {
          if (p.isGK) continue;
          const d = vec2Dist(p.pos, this.ballPos);
          if (d < minDist) {
            minDist = d;
            nearest = p;
          }
        }
        if (nearest) this.controlledPlayer = nearest;
      }
    }

    const cp = this.controlledPlayer;
    if (!cp) return;

    let dx = 0, dy = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('w') || this.keys.has('W')) dy = -1;
    if (this.keys.has('ArrowDown') || this.keys.has('s') || this.keys.has('S')) dy = 1;
    if (this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A')) dx = -1;
    if (this.keys.has('ArrowRight') || this.keys.has('d') && !this.keys.has('D')) dx = 1;

    if (dx !== 0 || dy !== 0) {
      const dir = vec2Normalize(vec2(dx, dy));
      cp.vel = vec2Scale(dir, cp.speed);
      cp.facingAngle = Math.atan2(dir.y, dir.x);
    } else {
      cp.vel = vec2Scale(cp.vel, 0.8);
    }

    if (cp.hasBall) {
      this.ballPos = vec2(
        cp.pos.x + Math.cos(cp.facingAngle) * (cp.radius + BALL_R + 2),
        cp.pos.y + Math.sin(cp.facingAngle) * (cp.radius + BALL_R + 2)
      );
    }

    if (this.keys.has(' ') && cp.hasBall) {
      this.keys.delete(' ');
      this.performPass(cp, team);
    }

    if (this.keys.has('D') && cp.hasBall) {
      this.keys.delete('D');
      this.performShot(cp, team);
    }

    if (this.keys.has('j') || this.keys.has('J')) {
      const gk = team.getGK();
      if (!gk.isDiving && vec2Dist(gk.pos, this.ballPos) < SAVE_RANGE + 40) {
        gk.diveToward(this.ballPos);
      }
      this.keys.delete('j');
      this.keys.delete('J');
    }

    for (const p of team.players) {
      if (p === cp) continue;
      if (p.isGK) {
        const gkTargetY = Math.max(200, Math.min(300, this.ballPos.y));
        const gkTargetX = team.direction === 1 ? FIELD_W - 35 : 35;
        p.moveTo(vec2(gkTargetX, gkTargetY), 0.6);
      } else {
        if (this.ballOwnerTeamId === 0) {
          const goalX = team.direction === 1 ? FIELD_W : 0;
          const offX = (goalX - p.homePos.x) * 0.25;
          const targetX = p.homePos.x + offX + (Math.random() - 0.5) * 10;
          const targetY = p.homePos.y + (Math.random() - 0.5) * 10;
          p.moveTo(vec2(targetX, targetY), 0.5);
        } else {
          const distBall = vec2Dist(p.pos, this.ballPos);
          if (distBall < 150) {
            p.moveTo(this.ballPos, 0.8);
          } else {
            p.moveTo(p.homePos, 0.4);
          }
        }
      }
    }
  }

  handleAI() {
    const action = this.teamB.aiUpdate(this.ballPos, this.ballOwnerTeamId, this.teamA, 1 / 60);

    if (this.ballOwnerTeamId === 1) {
      const carrier = this.teamB.getBallCarrier();
      if (carrier && carrier.hasBall) {
        this.ballPos = vec2(
          carrier.pos.x + Math.cos(carrier.facingAngle) * (carrier.radius + BALL_R + 2),
          carrier.pos.y + Math.sin(carrier.facingAngle) * (carrier.radius + BALL_R + 2)
        );

        if (action === 'shoot') {
          this.performShot(carrier, this.teamB);
        } else if (action === 'pass') {
          this.performPass(carrier, this.teamB);
        }
      }

      const gk = this.teamB.getGK();
      if (!gk.isDiving && vec2Dist(gk.pos, this.ballPos) < SAVE_RANGE && this.ballVel.x !== 0) {
        gk.diveToward(this.ballPos);
      }
    }
  }

  performPass(from: Player, team: Team) {
    const target = team.getNearestTeammate(from);
    if (!target) return;

    const dir = vec2Normalize(vec2Sub(target.pos, from.pos));
    const accuracy = from.passAccuracy;
    const angle = (Math.random() - 0.5) * (1 - accuracy) * Math.PI * 0.5;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const adjDir = vec2(dir.x * cos - dir.y * sin, dir.x * sin + dir.y * cos);

    this.ballVel = vec2Scale(adjDir, PASS_SPEED);
    from.hasBall = false;
    this.ballOwner = null;
    this.ballOwnerTeamId = -1;
  }

  performShot(from: Player, team: Team) {
    const goalX = team.direction === 1 ? FIELD_W : 0;
    const goalY = FIELD_H / 2 + (Math.random() - 0.5) * GOAL_H * 0.6;
    const dir = vec2Normalize(vec2Sub(vec2(goalX, goalY), from.pos));

    this.ballVel = vec2Scale(dir, SHOT_SPEED);
    from.hasBall = false;
    this.ballOwner = null;
    this.ballOwnerTeamId = -1;
    team.shots++;
  }

  updateBallPhysics() {
    if (this.ballOwner) return;

    this.ballPos.x += this.ballVel.x;
    this.ballPos.y += this.ballVel.y;
    this.ballVel.x *= BALL_FRICTION;
    this.ballVel.y *= BALL_FRICTION;

    if (Math.abs(this.ballVel.x) < 0.05 && Math.abs(this.ballVel.y) < 0.05) {
      this.ballVel = vec2(0, 0);
    }

    const goalTop = (FIELD_H - GOAL_H) / 2;
    const goalBot = (FIELD_H + GOAL_H) / 2;
    const inGoalY = this.ballPos.y > goalTop && this.ballPos.y < goalBot;

    if (this.ballPos.x < BALL_R) {
      if (!inGoalY) {
        this.ballPos.x = BALL_R;
        this.ballVel.x *= -0.5;
      }
    }
    if (this.ballPos.x > FIELD_W - BALL_R) {
      if (!inGoalY) {
        this.ballPos.x = FIELD_W - BALL_R;
        this.ballVel.x *= -0.5;
      }
    }
    if (this.ballPos.y < BALL_R) {
      this.ballPos.y = BALL_R;
      this.ballVel.y *= -0.5;
    }
    if (this.ballPos.y > FIELD_H - BALL_R) {
      this.ballPos.y = FIELD_H - BALL_R;
      this.ballVel.y *= -0.5;
    }

    if (this.ballVel.x === 0 && this.ballVel.y === 0) {
      this.pickupBall();
    }
  }

  pickupBall() {
    const allPlayers = [...this.teamA.players, ...this.teamB.players];
    for (const p of allPlayers) {
      const d = vec2Dist(p.pos, this.ballPos);
      if (d < p.radius + BALL_R + 5 && !p.hasBall) {
        p.hasBall = true;
        this.ballOwner = p;
        this.ballOwnerTeamId = p.teamId;
        if (p.teamId === 0) {
          this.controlledPlayer = p;
        }
        this.attackTimer = ATTACK_TIME;
        break;
      }
    }
  }

  checkGoal() {
    const goalTop = (FIELD_H - GOAL_H) / 2;
    const goalBot = (FIELD_H + GOAL_H) / 2;

    if (this.ballPos.x < 0 && this.ballPos.y > goalTop && this.ballPos.y < goalBot) {
      if (this.teamA.direction === 1) {
        this.scoreGoal(1);
      } else {
        this.scoreGoal(0);
      }
    }
    if (this.ballPos.x > FIELD_W && this.ballPos.y > goalTop && this.ballPos.y < goalBot) {
      if (this.teamA.direction === 1) {
        this.scoreGoal(0);
      } else {
        this.scoreGoal(1);
      }
    }
  }

  scoreGoal(teamId: number) {
    if (teamId === 0) {
      this.teamA.score++;
    } else {
      this.teamB.score++;
    }
    this.goalScorerTeamId = teamId;
    this.spawnFireworks(FIELD_W / 2, FIELD_H / 2);
    this.triggerAudienceJump();
    this.state = 'goal';
    this.stateTimer = 2;
    this.goalFadeIn = 0;
    this.ballVel = vec2(0, 0);
    this.ballOwner = null;
    this.ballOwnerTeamId = -1;
    for (const p of this.teamA.players) p.hasBall = false;
    for (const p of this.teamB.players) p.hasBall = false;
  }

  endHalf() {
    if (this.halfNum === 1) {
      this.state = 'halftime';
      this.stateTimer = REST_TIME;
      this.restTimer = REST_TIME;
    } else {
      this.state = 'gameover';
    }
  }

  turnover() {
    this.attackTimer = ATTACK_TIME;
    const prevTeam = this.ballOwnerTeamId;
    if (this.ballOwner) {
      this.ballOwner.hasBall = false;
    }
    this.ballOwner = null;
    this.ballOwnerTeamId = -1;
    this.ballVel = vec2(0, 0);

    const newTeam = prevTeam === 0 ? this.teamB : this.teamA;
    let nearest: Player | null = null;
    let minDist = Infinity;
    for (const p of newTeam.players) {
      if (p.isGK) continue;
      const d = vec2Dist(p.pos, this.ballPos);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }
    if (nearest) {
      nearest.hasBall = true;
      this.ballOwner = nearest;
      this.ballOwnerTeamId = newTeam.teamId;
      if (newTeam.teamId === 0) {
        this.controlledPlayer = nearest;
      }
    }
  }

  checkOutOfBounds() {
    if (this.ballOwner) return;
    const goalTop = (FIELD_H - GOAL_H) / 2;
    const goalBot = (FIELD_H + GOAL_H) / 2;

    if (this.ballPos.y <= BALL_R || this.ballPos.y >= FIELD_H - BALL_R) {
      this.triggerOutOfBounds();
      return;
    }
    if (this.ballPos.x <= BALL_R) {
      if (!(this.ballPos.y > goalTop && this.ballPos.y < goalBot)) {
        this.triggerOutOfBounds();
      }
    }
    if (this.ballPos.x >= FIELD_W - BALL_R) {
      if (!(this.ballPos.y > goalTop && this.ballPos.y < goalBot)) {
        this.triggerOutOfBounds();
      }
    }
  }

  triggerOutOfBounds() {
    if (this.ballOwner) {
      this.ballOwner.hasBall = false;
      this.ballOwner = null;
      this.ballOwnerTeamId = -1;
    }
    this.outOfBoundsTeamId = this.ballOwnerTeamId === 0 ? 1 : 0;
    this.throwInPos = vec2(
      Math.max(BALL_R + 5, Math.min(FIELD_W - BALL_R - 5, this.ballPos.x)),
      Math.max(BALL_R + 5, Math.min(FIELD_H - BALL_R - 5, this.ballPos.y))
    );
    this.ballPos = vec2(this.throwInPos.x, this.throwInPos.y);
    this.ballVel = vec2(0, -4);
    this.state = 'outOfBounds';
    this.stateTimer = 0.8;
    this.throwInTimer = 0.8;
  }

  performThrowIn() {
    this.ballPos = vec2(this.throwInPos.x, this.throwInPos.y);
    this.ballVel = vec2(0, 0);
    const newTeam = this.outOfBoundsTeamId === 0 ? this.teamA : this.teamB;
    let nearest: Player | null = null;
    let minDist = Infinity;
    for (const p of newTeam.players) {
      if (p.isGK) continue;
      const d = vec2Dist(p.pos, this.ballPos);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }
    if (nearest) {
      nearest.hasBall = true;
      this.ballOwner = nearest;
      this.ballOwnerTeamId = newTeam.teamId;
      if (newTeam.teamId === 0) {
        this.controlledPlayer = nearest;
      }
    }
    this.attackTimer = ATTACK_TIME;
  }

  checkTackles() {
    if (!this.ballOwner) return;
    const opponentTeam = this.ballOwnerTeamId === 0 ? this.teamB : this.teamA;
    for (const p of opponentTeam.players) {
      const d = vec2Dist(p.pos, this.ballOwner.pos);
      if (d < TACKLE_DIST && Math.random() < 0.05) {
        this.ballOwner.hasBall = false;
        p.hasBall = true;
        this.ballOwner = p;
        this.ballOwnerTeamId = p.teamId;
        if (p.teamId === 0) {
          this.controlledPlayer = p;
        }
        this.attackTimer = ATTACK_TIME;
        break;
      }
    }
  }

  spawnFireworks(cx: number, cy: number) {
    const colors = ['#FF4444', '#FFD700', '#00FF88', '#4488FF', '#FF44FF', '#FF8800', '#44FFFF'];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.5 + Math.random() * 0.5,
        maxLife: 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2 + Math.random() * 3
      });
    }
  }

  updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  triggerAudienceJump() {
    for (const a of this.audience) {
      a.jumpTimer = 0.5;
    }
  }

  updateAudience(dt: number) {
    for (const a of this.audience) {
      if (a.jumpTimer > 0) {
        a.jumpTimer -= dt;
        a.y = a.baseY - Math.sin((0.5 - a.jumpTimer) / 0.5 * Math.PI) * 15;
      } else {
        a.y = a.baseY;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const s = this.scale;
    ctx.save();
    ctx.scale(s, s);

    this.drawField();
    this.drawGoals();
    this.drawAudience();

    if (this.state === 'title') {
      this.drawTitle();
    } else {
      this.drawPlayers();
      this.drawBall();
      this.drawHUD();

      if (this.state === 'goal') {
        this.drawGoalOverlay();
      }
      if (this.state === 'halftime') {
        this.drawHalftime();
      }
      if (this.state === 'gameover') {
        this.drawGameOver();
      }
      if (this.state === 'outOfBounds') {
        this.drawThrowIn();
      }
    }

    this.drawParticles();

    ctx.restore();
  }

  drawField() {
    const ctx = this.ctx;
    const stripeW = 50;
    for (let x = 0; x < FIELD_W; x += stripeW) {
      ctx.fillStyle = (Math.floor(x / stripeW) % 2 === 0) ? '#8FBC8F' : '#7DAF7D';
      ctx.fillRect(x, 0, stripeW, FIELD_H);
    }

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, FIELD_W - 2, FIELD_H - 2);
    ctx.beginPath();
    ctx.moveTo(FIELD_W / 2, 0);
    ctx.lineTo(FIELD_W / 2, FIELD_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(FIELD_W / 2, FIELD_H / 2, CENTER_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(FIELD_W / 2, FIELD_H / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.rect(0, (FIELD_H - GOAL_H) / 2, 60, GOAL_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(FIELD_W - 60, (FIELD_H - GOAL_H) / 2, 60, GOAL_H);
    ctx.stroke();
  }

  drawGoals() {
    const ctx = this.ctx;
    const goalTop = (FIELD_H - GOAL_H) / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(-GOAL_W, goalTop, GOAL_W, GOAL_H);
    ctx.fillRect(FIELD_W, goalTop, GOAL_W, GOAL_H);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, goalTop);
    ctx.lineTo(-GOAL_W, goalTop);
    ctx.lineTo(-GOAL_W, goalTop + GOAL_H);
    ctx.lineTo(0, goalTop + GOAL_H);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(FIELD_W, goalTop);
    ctx.lineTo(FIELD_W + GOAL_W, goalTop);
    ctx.lineTo(FIELD_W + GOAL_W, goalTop + GOAL_H);
    ctx.lineTo(FIELD_W, goalTop + GOAL_H);
    ctx.stroke();

    for (let y = goalTop; y < goalTop + GOAL_H; y += 15) {
      ctx.beginPath();
      ctx.moveTo(-GOAL_W, y);
      ctx.lineTo(0, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(FIELD_W, y);
      ctx.lineTo(FIELD_W + GOAL_W, y);
      ctx.stroke();
    }
  }

  drawPlayers() {
    const ctx = this.ctx;
    const allPlayers = [...this.teamA.players, ...this.teamB.players];

    for (const p of allPlayers) {
      ctx.globalAlpha = p.fadeIn;
      const color = p.teamId === 0 ? '#D32F2F' : '#1976D2';
      const isSelected = p === this.controlledPlayer;

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${p.radius * 0.9}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(p.id + 1), p.pos.x, p.pos.y + 1);

      if (p.hasBall) {
        ctx.beginPath();
        ctx.arc(
          p.pos.x + Math.cos(p.facingAngle) * (p.radius + BALL_R + 2),
          p.pos.y + Math.sin(p.facingAngle) * (p.radius + BALL_R + 2),
          3, 0, Math.PI * 2
        );
        ctx.fillStyle = '#FFD700';
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    const refX = FIELD_W / 2;
    const refY = FIELD_H / 2 - 30;
    ctx.beginPath();
    ctx.arc(refX, refY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('裁', refX, refY + 1);
  }

  drawBall() {
    const ctx = this.ctx;

    ctx.beginPath();
    ctx.arc(this.ballPos.x, this.ballPos.y, BALL_R, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      this.ballPos.x - 2, this.ballPos.y - 2, 1,
      this.ballPos.x, this.ballPos.y, BALL_R
    );
    grad.addColorStop(0, '#C68642');
    grad.addColorStop(0.5, '#8B4513');
    grad.addColorStop(1, '#5D3A1A');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#3E2723';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(62,39,35,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(this.ballPos.x - BALL_R * 0.6, this.ballPos.y - BALL_R * 0.6);
    ctx.lineTo(this.ballPos.x + BALL_R * 0.6, this.ballPos.y + BALL_R * 0.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(this.ballPos.x + BALL_R * 0.6, this.ballPos.y - BALL_R * 0.6);
    ctx.lineTo(this.ballPos.x - BALL_R * 0.6, this.ballPos.y + BALL_R * 0.6);
    ctx.stroke();
  }

  drawHUD() {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(93,58,26,0.85)';
    const hudH = 38;
    ctx.fillRect(0, 0, FIELD_W, hudH);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px "Noto Serif SC", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const scoreText = `${this.teamA.name}  ${this.teamA.score} : ${this.teamB.score}  ${this.teamB.name}`;
    ctx.fillText(scoreText, FIELD_W / 2, hudH / 2);

    ctx.font = '12px "Noto Serif SC", "KaiTi", serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    const timeStr = this.formatTime(Math.max(0, this.matchTimer));
    ctx.fillText(`⏱ ${timeStr}`, 10, hudH / 2);
    ctx.fillText(`进攻: ${Math.ceil(Math.max(0, this.attackTimer))}s`, 10, hudH / 2 + 14);

    ctx.textAlign = 'right';
    const totalPoss = this.totalPossTimeA + this.totalPossTimeB;
    const possA = totalPoss > 0 ? Math.round((this.totalPossTimeA / totalPoss) * 100) : 50;
    const possB = 100 - possA;
    ctx.fillText(`控球 ${possA}%:${possB}%`, FIELD_W - 10, hudH / 2 - 5);
    ctx.fillText(`射门 ${this.teamA.shots}:${this.teamB.shots}`, FIELD_W - 10, hudH / 2 + 9);

    const halfText = this.halfNum === 1 ? '上半场' : '下半场';
    ctx.textAlign = 'center';
    ctx.font = '11px "Noto Serif SC", "KaiTi", serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(halfText, FIELD_W / 2, hudH / 2 + 12);
  }

  drawGoalOverlay() {
    const ctx = this.ctx;
    ctx.globalAlpha = this.goalFadeIn * 0.6;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    ctx.globalAlpha = this.goalFadeIn;

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px "Noto Serif SC", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const teamName = this.goalScorerTeamId === 0 ? this.teamA.name : this.teamB.name;
    ctx.fillText(`${teamName} 进球!`, FIELD_W / 2, FIELD_H / 2);

    ctx.globalAlpha = 1;
  }

  drawHalftime() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px "Noto Serif SC", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('中场休息', FIELD_W / 2, FIELD_H / 2 - 20);

    ctx.font = '20px "Noto Serif SC", "KaiTi", serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${Math.ceil(this.restTimer)}秒后换边`, FIELD_W / 2, FIELD_H / 2 + 20);
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 40px "Noto Serif SC", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('比赛结束', FIELD_W / 2, FIELD_H / 2 - 30);

    ctx.font = 'bold 28px "Noto Serif SC", "KaiTi", serif';
    ctx.fillText(`${this.teamA.score} : ${this.teamB.score}`, FIELD_W / 2, FIELD_H / 2 + 10);

    let winner = '';
    if (this.teamA.score > this.teamB.score) winner = `${this.teamA.name} 获胜!`;
    else if (this.teamB.score > this.teamA.score) winner = `${this.teamB.name} 获胜!`;
    else winner = '平局!';
    ctx.font = '22px "Noto Serif SC", "KaiTi", serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(winner, FIELD_W / 2, FIELD_H / 2 + 45);

    ctx.font = '14px "Noto Serif SC", "KaiTi", serif';
    ctx.fillText('按 Enter 重新开始', FIELD_W / 2, FIELD_H / 2 + 75);
  }

  drawTitle() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 52px "Noto Serif SC", "KaiTi", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('蹴鞠争霸', FIELD_W / 2, FIELD_H / 2 - 40);

    ctx.font = '20px "Noto Serif SC", "KaiTi", serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('按 Enter 开始比赛', FIELD_W / 2, FIELD_H / 2 + 20);

    ctx.font = '14px "Noto Serif SC", "KaiTi", serif';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('方向键移动 | 空格传球 | D射门 | J扑救', FIELD_W / 2, FIELD_H / 2 + 55);
  }

  drawThrowIn() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(this.throwInPos.x, this.throwInPos.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('发球', this.throwInPos.x, this.throwInPos.y - 20);
  }

  drawAudience() {
    const ctx = this.ctx;
    const grad = ctx.createLinearGradient(-80, 0, -20, 0);
    grad.addColorStop(0, '#B0B0B0');
    grad.addColorStop(1, 'rgba(176,176,176,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(-80, 0, 60, FIELD_H);

    const grad2 = ctx.createLinearGradient(FIELD_W + 20, 0, FIELD_W + 80, 0);
    grad2.addColorStop(0, 'rgba(176,176,176,0)');
    grad2.addColorStop(1, '#B0B0B0');
    ctx.fillStyle = grad2;
    ctx.fillRect(FIELD_W + 20, 0, 60, FIELD_H);

    for (const a of this.audience) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = a.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

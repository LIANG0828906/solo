export interface Vec2 {
  x: number;
  y: number;
}

export function vec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function vec2Add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function vec2Scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function vec2Len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vec2Normalize(v: Vec2): Vec2 {
  const len = vec2Len(v);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function vec2Dist(a: Vec2, b: Vec2): number {
  return vec2Len(vec2Sub(a, b));
}

export const FIELD_W = 800;
export const FIELD_H = 500;
export const CENTER_R = 60;
export const GOAL_W = 80;
export const GOAL_H = 120;
export const PLAYER_R = 16;
export const BALL_R = 8;
export const PLAYER_SPEED = 3.0;
export const GK_SPEED = 2.8;
export const BALL_FRICTION = 0.985;
export const PASS_SPEED = 7;
export const SHOT_SPEED = 10;
export const ATTACK_TIME = 15;
export const HALF_TIME = 90;
export const REST_TIME = 10;
export const AI_SHOOT_DIST = 80;
export const TACKLE_DIST = 22;
export const SAVE_RANGE = 50;

export class Player {
  id: number;
  teamId: number;
  pos: Vec2;
  vel: Vec2 = vec2(0, 0);
  radius: number = PLAYER_R;
  speed: number = PLAYER_SPEED;
  passAccuracy: number = 0.85;
  hasBall: boolean = false;
  isGK: boolean = false;
  homePos: Vec2;
  facingAngle: number = 0;
  isDiving: boolean = false;
  diveDir: Vec2 = vec2(0, 0);
  diveTimer: number = 0;
  fadeIn: number = 0;

  constructor(id: number, teamId: number, x: number, y: number, isGK: boolean = false) {
    this.id = id;
    this.teamId = teamId;
    this.pos = vec2(x, y);
    this.homePos = vec2(x, y);
    this.isGK = isGK;
    if (isGK) this.speed = GK_SPEED;
  }

  update() {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
    if (this.isDiving) {
      this.diveTimer -= 1 / 60;
      if (this.diveTimer <= 0) {
        this.isDiving = false;
        this.diveDir = vec2(0, 0);
      }
      this.pos.x += this.diveDir.x * 2;
      this.pos.y += this.diveDir.y * 2;
    }
    this.pos.x = Math.max(this.radius, Math.min(FIELD_W - this.radius, this.pos.x));
    this.pos.y = Math.max(this.radius, Math.min(FIELD_H - this.radius, this.pos.y));
    if (this.fadeIn < 1) {
      this.fadeIn = Math.min(1, this.fadeIn + 0.034);
    }
  }

  moveTo(target: Vec2, speedMult: number = 1) {
    const dir = vec2Normalize(vec2Sub(target, this.pos));
    const spd = this.speed * speedMult;
    this.vel = vec2Scale(dir, spd);
    if (dir.x !== 0 || dir.y !== 0) {
      this.facingAngle = Math.atan2(dir.y, dir.x);
    }
  }

  stopMove() {
    this.vel = vec2(0, 0);
  }

  diveToward(target: Vec2) {
    if (this.isGK && !this.isDiving) {
      this.isDiving = true;
      this.diveDir = vec2Normalize(vec2Sub(target, this.pos));
      this.diveTimer = 0.4;
    }
  }
}

export class Team {
  players: Player[] = [];
  teamId: number;
  score: number = 0;
  shots: number = 0;
  possessionTime: number = 0;
  direction: number;
  name: string;

  constructor(teamId: number, direction: number, name: string) {
    this.teamId = teamId;
    this.direction = direction;
    this.name = name;
    this.initPlayers();
  }

  initPlayers() {
    this.players = [];
    const positions = this.getFormationPositions();
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const player = new Player(i, this.teamId, p[0], p[1], i === 0);
      player.fadeIn = 0;
      this.players.push(player);
    }
  }

  getFormationPositions(): number[][] {
    const d = this.direction;
    const base: number[][] = [
      [0, 0, 1],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    if (d === 1) {
      base[0] = [50, 250, 1];
      base[1] = [180, 140, 0];
      base[2] = [180, 360, 0];
      base[3] = [340, 180, 0];
      base[4] = [340, 320, 0];
      base[5] = [460, 250, 0];
    } else {
      base[0] = [750, 250, 1];
      base[1] = [620, 140, 0];
      base[2] = [620, 360, 0];
      base[3] = [460, 180, 0];
      base[4] = [460, 320, 0];
      base[5] = [340, 250, 0];
    }
    if (this.teamId === 1) {
      if (d === 1) {
        base[0] = [750, 250, 1];
        base[1] = [620, 140, 0];
        base[2] = [620, 360, 0];
        base[3] = [460, 180, 0];
        base[4] = [460, 320, 0];
        base[5] = [340, 250, 0];
      } else {
        base[0] = [50, 250, 1];
        base[1] = [180, 140, 0];
        base[2] = [180, 360, 0];
        base[3] = [340, 180, 0];
        base[4] = [340, 320, 0];
        base[5] = [460, 250, 0];
      }
    }
    return base;
  }

  resetPositions() {
    const positions = this.getFormationPositions();
    for (let i = 0; i < this.players.length; i++) {
      this.players[i].pos = vec2(positions[i][0], positions[i][1]);
      this.players[i].homePos = vec2(positions[i][0], positions[i][1]);
      this.players[i].vel = vec2(0, 0);
      this.players[i].hasBall = false;
      this.players[i].isDiving = false;
      this.players[i].diveTimer = 0;
      this.players[i].fadeIn = 0;
    }
  }

  switchDirection() {
    this.direction *= -1;
    this.resetPositions();
  }

  getGK(): Player {
    return this.players[0];
  }

  getBallCarrier(): Player | null {
    return this.players.find(p => p.hasBall) || null;
  }

  getNearestTeammate(from: Player): Player | null {
    let nearest: Player | null = null;
    let minDist = Infinity;
    for (const p of this.players) {
      if (p.id === from.id) continue;
      const d = vec2Dist(from.pos, p.pos);
      if (d < minDist) {
        minDist = d;
        nearest = p;
      }
    }
    return nearest;
  }

  getBestPassTarget(from: Player, enemyTeam: Team): Player | null {
    let bestTarget: Player | null = null;
    let bestScore = -Infinity;
    for (const p of this.players) {
      if (p.id === from.id) continue;
      const dist = vec2Dist(from.pos, p.pos);
      if (dist < 40) continue;
      const goalX = this.direction === 1 ? FIELD_W : 0;
      const goalY = FIELD_H / 2;
      const advDist = this.direction === 1
        ? (p.pos.x - from.pos.x)
        : (from.pos.x - p.pos.x);
      let safety = 1000;
      for (const e of enemyTeam.players) {
        const ed = vec2Dist(e.pos, p.pos);
        if (ed < safety) safety = ed;
      }
      const score = advDist * 2 + safety * 0.5 - dist * 0.3;
      if (score > bestScore) {
        bestScore = score;
        bestTarget = p;
      }
    }
    return bestTarget;
  }

  aiUpdate(ballPos: Vec2, ballOwnerTeamId: number, enemyTeam: Team, dt: number) {
    const goalX = this.direction === 1 ? FIELD_W : 0;
    const goalY = FIELD_H / 2;
    const hasBall = ballOwnerTeamId === this.teamId;

    for (const p of this.players) {
      if (p.isGK) {
        const gkTargetY = Math.max(200, Math.min(300, ballPos.y));
        const gkTargetX = this.direction === 1 ? FIELD_W - 35 : 35;
        const distToGK = vec2Dist(p.pos, vec2(gkTargetX, gkTargetY));
        if (distToGK > 3) {
          p.moveTo(vec2(gkTargetX, gkTargetY), 0.8);
        } else {
          p.stopMove();
        }
        continue;
      }

      if (p.hasBall) {
        const distToGoal = Math.abs(goalX - p.pos.x);
        if (distToGoal < AI_SHOOT_DIST) {
          return 'shoot';
        }
        const bestTarget = this.getBestPassTarget(p, enemyTeam);
        if (bestTarget && Math.random() < 0.02) {
          return 'pass';
        }
        const moveTarget = vec2(
          p.pos.x + (goalX - p.pos.x) * 0.05 + (Math.random() - 0.5) * 20,
          p.pos.y + (ballPos.y > FIELD_H / 2 ? -1 : 1) * 10 + (Math.random() - 0.5) * 30
        );
        p.moveTo(moveTarget, 0.9);
      } else if (hasBall) {
        const offsetX = (goalX - p.homePos.x) * 0.3;
        const targetX = p.homePos.x + offsetX + (Math.random() - 0.5) * 20;
        const targetY = p.homePos.y + (Math.random() - 0.5) * 20;
        p.moveTo(vec2(targetX, targetY), 0.7);
      } else {
        const distToBall = vec2Dist(p.pos, ballPos);
        if (distToBall < 200) {
          p.moveTo(ballPos, 1.0);
        } else {
          const homeOffsetX = (ballPos.x - p.homePos.x) * 0.2;
          p.moveTo(vec2(p.homePos.x + homeOffsetX, p.homePos.y), 0.5);
        }
      }
    }
    return null;
  }
}

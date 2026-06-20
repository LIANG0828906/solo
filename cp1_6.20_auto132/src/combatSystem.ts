import { Hero, computeSynergies } from './hero';
import { Board } from './board';

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  fontSize: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'fire' | 'ice' | 'lightning' | 'heal' | 'shield' | 'spark';
}

export interface AttackEffect {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface SkillEffect {
  x: number;
  y: number;
  range: number;
  life: number;
  maxLife: number;
  type: 'fire' | 'ice' | 'lightning' | 'heal' | 'shield';
  team: 'blue' | 'red';
}

export interface ShakeEffect {
  intensity: number;
  duration: number;
  elapsed: number;
}

export class CombatSystem {
  board: Board;
  floatingTexts: FloatingText[] = [];
  particles: Particle[] = [];
  attackEffects: AttackEffect[] = [];
  skillEffects: SkillEffect[] = [];
  shakeEffect: ShakeEffect | null = null;
  battleEnded: boolean = false;
  winner: 'blue' | 'red' | 'none' = 'none';
  totalDamageBlue: number = 0;
  totalDamageRed: number = 0;
  totalHealBlue: number = 0;
  totalHealRed: number = 0;

  constructor(board: Board) {
    this.board = board;
  }

  initBattle() {
    this.floatingTexts = [];
    this.particles = [];
    this.attackEffects = [];
    this.skillEffects = [];
    this.shakeEffect = null;
    this.battleEnded = false;
    this.winner = 'none';
    this.totalDamageBlue = 0;
    this.totalDamageRed = 0;
    this.totalHealBlue = 0;
    this.totalHealRed = 0;

    const blueHeroes = this.board.getAliveHeroes('blue');
    const redHeroes = this.board.getAliveHeroes('red');

    const blueBonuses = computeSynergies(blueHeroes);
    const redBonuses = computeSynergies(redHeroes);

    for (const h of blueHeroes) h.applySynergyBonuses(blueBonuses);
    for (const h of redHeroes) h.applySynergyBonuses(redBonuses);
  }

  update(now: number, dt: number) {
    if (this.battleEnded) return;

    const allHeroes = [...this.board.blueHeroes, ...this.board.redHeroes]
      .filter(h => h.isAlive)
      .sort((a, b) => a.attackSpeed - b.attackSpeed);

    for (const hero of allHeroes) {
      if (!hero.isAlive) continue;
      this.processHero(hero, now);
    }

    this.updateEffects(dt);
    this.checkBattleEnd();
  }

  processHero(hero: Hero, now: number) {
    const enemy = this.board.findNearestEnemy(hero);
    if (!enemy) return;

    const inRange = this.board.isInAttackRange(hero, enemy);

    if (inRange) {
      if (hero.rage >= 100) {
        this.activateSkill(hero);
      } else if (now - hero.lastAttackTime >= hero.attackSpeed) {
        this.performAttack(hero, enemy);
        hero.lastAttackTime = now;
      }
    } else {
      if (now - hero.lastMoveTime >= hero.moveSpeed) {
        this.moveTowardEnemy(hero, enemy);
        hero.lastMoveTime = now;
      }
    }
  }

  moveTowardEnemy(hero: Hero, target: Hero) {
    const { dx, dy } = this.board.getDirectionToward(hero, target);
    const newX = hero.x + dx;
    const newY = hero.y + dy;

    if (this.board.moveHero(hero, newX, newY)) {
      return;
    }

    if (dx !== 0 && this.board.moveHero(hero, hero.x + dx, hero.y)) {
      return;
    }
    if (dy !== 0 && this.board.moveHero(hero, hero.x, hero.y + dy)) {
      return;
    }
  }

  performAttack(attacker: Hero, target: Hero) {
    if (Math.random() < target.dodgeChance) {
      this.addFloatingText(target.pixelX, target.pixelY - 30, '闪避', '#ffffff', 14);
      return;
    }

    let dmg = this.calculateDamage(attacker, target);
    const isCrit = Math.random() < attacker.critChance;
    if (isCrit) dmg = Math.floor(dmg * 1.5);

    const actualDmg = target.takeDamage(dmg);
    attacker.damageDealt += actualDmg;
    attacker.addRage(15);

    if (!target.isAlive) {
      attacker.kills++;
    } else {
      target.addRage(10);
    }

    if (attacker.team === 'blue') this.totalDamageBlue += actualDmg;
    else this.totalDamageRed += actualDmg;

    this.attackEffects.push({
      fromX: attacker.pixelX,
      fromY: attacker.pixelY,
      toX: target.pixelX,
      toY: target.pixelY,
      life: 200,
      maxLife: 200,
      color: attacker.team === 'blue' ? '#00d4ff' : '#ff4444',
    });

    const txt = isCrit ? `${actualDmg}!` : `${actualDmg}`;
    const color = isCrit ? '#ffd700' : '#ff3344';
    this.addFloatingText(target.pixelX, target.pixelY - 20, txt, color, isCrit ? 18 : 14);

    this.spawnHitSparks(target.pixelX, target.pixelY, attacker.team === 'blue' ? '#00d4ff' : '#ff4444');
  }

  activateSkill(hero: Hero) {
    hero.rage = 0;
    hero.skillAnimTime = 500;

    this.shakeEffect = { intensity: 6, duration: 300, elapsed: 0 };

    const skill = hero.skill;

    if (skill.type === 'aoe') {
      const enemies = this.board.getAliveHeroes(hero.team === 'blue' ? 'red' : 'blue');
      const targets = enemies.filter(e => this.board.getDistance(hero, e) <= skill.range);
      for (const t of targets) {
        const dmg = Math.floor(skill.damage * hero.spellPower);
        const actualDmg = t.takeDamage(dmg);
        hero.damageDealt += actualDmg;
        if (!t.isAlive) hero.kills++;
        this.addFloatingText(t.pixelX, t.pixelY - 20, `${actualDmg}`, '#ff8800', 16);
      }
    } else if (skill.type === 'single') {
      const enemy = this.board.findNearestEnemy(hero);
      if (enemy) {
        const dmg = Math.floor(skill.damage * hero.spellPower);
        const actualDmg = enemy.takeDamage(dmg);
        hero.damageDealt += actualDmg;
        if (!enemy.isAlive) hero.kills++;
        this.addFloatingText(enemy.pixelX, enemy.pixelY - 20, `${actualDmg}`, '#ff8800', 18);
      }
    } else if (skill.type === 'heal') {
      const allies = this.board.getAliveHeroes(hero.team);
      const targets = allies.filter(a => this.board.getDistance(hero, a) <= skill.range && a.hp < a.maxHp);
      const sorted = targets.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
      const healTargets = sorted.slice(0, 2);
      for (const t of healTargets) {
        const amount = Math.floor(skill.healAmount * hero.spellPower);
        const actual = t.heal(amount);
        hero.healingDone += actual;
        this.addFloatingText(t.pixelX, t.pixelY - 20, `+${actual}`, '#00ff88', 16);
      }
    } else if (skill.type === 'shield') {
      const allies = this.board.getAliveHeroes(hero.team);
      const targets = allies.filter(a => this.board.getDistance(hero, a) <= skill.range);
      for (const t of targets) {
        const amount = Math.floor(skill.shieldAmount * hero.spellPower);
        t.addShield(amount);
        this.addFloatingText(t.pixelX, t.pixelY - 20, `🛡${amount}`, '#3498db', 14);
      }
    } else if (skill.type === 'lifesteal') {
      const enemy = this.board.findNearestEnemy(hero);
      if (enemy) {
        const dmg = Math.floor(skill.damage * hero.spellPower);
        const actualDmg = enemy.takeDamage(dmg);
        hero.damageDealt += actualDmg;
        if (!enemy.isAlive) hero.kills++;
        const healAmt = Math.floor(skill.healAmount * hero.spellPower);
        const actualHeal = hero.heal(healAmt);
        this.addFloatingText(enemy.pixelX, enemy.pixelY - 20, `${actualDmg}`, '#ff8800', 18);
        this.addFloatingText(hero.pixelX, hero.pixelY - 20, `+${actualHeal}`, '#00ff88', 16);
      }
    }

    this.skillEffects.push({
      x: hero.pixelX,
      y: hero.pixelY,
      range: skill.range,
      life: 500,
      maxLife: 500,
      type: skill.particleType,
      team: hero.team,
    });

    this.spawnSkillParticles(hero.pixelX, hero.pixelY, skill.particleType);

    if (hero.team === 'blue') this.totalDamageBlue += hero.damageDealt;
    else this.totalDamageRed += hero.damageDealt;
  }

  calculateDamage(attacker: Hero, _defender: Hero): number {
    return attacker.attack;
  }

  checkBattleEnd() {
    const blueAlive = this.board.getAliveHeroes('blue');
    const redAlive = this.board.getAliveHeroes('red');

    if (blueAlive.length === 0) {
      this.battleEnded = true;
      this.winner = 'red';
    } else if (redAlive.length === 0) {
      this.battleEnded = true;
      this.winner = 'blue';
    }
  }

  addFloatingText(x: number, y: number, text: string, color: string, fontSize: number = 14) {
    this.floatingTexts.push({
      x: x + (Math.random() - 0.5) * 20,
      y,
      text,
      color,
      life: 1000,
      maxLife: 1000,
      fontSize,
    });
  }

  spawnHitSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 80;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 400,
        maxLife: 400,
        color,
        size: 2 + Math.random() * 3,
        type: 'spark',
      });
    }
  }

  spawnSkillParticles(x: number, y: number, type: 'fire' | 'ice' | 'lightning' | 'heal' | 'shield') {
    const colors: Record<string, string[]> = {
      fire: ['#ff4400', '#ff8800', '#ffcc00'],
      ice: ['#88ccff', '#aaeeff', '#ffffff'],
      lightning: ['#ffff00', '#ffdd00', '#ffffff'],
      heal: ['#00ff88', '#88ffbb', '#ffffff'],
      shield: ['#4488ff', '#66aaff', '#aaddff'],
    };
    const palette = colors[type] || colors.fire;

    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 150;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 600 + Math.random() * 400,
        maxLife: 1000,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 3 + Math.random() * 5,
        type,
      });
    }
  }

  updateEffects(dt: number) {
    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.y -= dt * 0.04;
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += 50 * dt / 1000;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    for (const ae of this.attackEffects) {
      ae.life -= dt;
    }
    this.attackEffects = this.attackEffects.filter(ae => ae.life > 0);

    for (const se of this.skillEffects) {
      se.life -= dt;
    }
    this.skillEffects = this.skillEffects.filter(se => se.life > 0);

    if (this.shakeEffect) {
      this.shakeEffect.elapsed += dt;
      if (this.shakeEffect.elapsed >= this.shakeEffect.duration) {
        this.shakeEffect = null;
      }
    }
  }
}

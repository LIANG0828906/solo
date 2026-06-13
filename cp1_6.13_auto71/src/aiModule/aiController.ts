import Phaser from 'phaser';
import { SpellElement, SpellSystem, getCounterElement, SPELL_CONFIGS, FUSION_MAP, FusionEffect } from '../playerModule/spellSystem';

export interface AIState {
  health: number;
  maxHealth: number;
  shieldActive: boolean;
  shieldCooldown: number;
  lastSpellTime: number;
  lastFusionTime: number;
  lastShieldTime: number;
  currentBehavior: AIBehavior;
  targetPlayerElement: SpellElement | null;
}

export type AIBehavior = 'idle' | 'counter' | 'aggressive' | 'defensive' | 'fusion' | 'random';

export interface AIActionEvent {
  type: 'castSpell' | 'castFusion' | 'shield';
  element?: SpellElement;
  element1?: SpellElement;
  element2?: SpellElement;
  targetX: number;
  targetY: number;
}

export class AIController {
  private scene: Phaser.Scene;
  private spellSystem: SpellSystem;
  private state: AIState;
  private eventEmitter: Phaser.Events.EventEmitter;
  private aiX: number;
  private aiY: number;
  private playerX: number;
  private playerY: number;
  private decisionTimer: Phaser.Time.TimerEvent | null = null;
  private shieldTimer: Phaser.Time.TimerEvent | null = null;
  private playerRecentSpells: SpellElement[] = [];
  private maxRecentSpells: number = 5;
  private aiSpells: SpellElement[] = ['fire', 'water', 'wind', 'earth'];
  private behaviorStartTime: number = 0;
  private aiSpellSlots: SpellElement[] = ['fire', 'water'];
  private pendingFusionProjectile: any = null;

  constructor(scene: Phaser.Scene, spellSystem: SpellSystem, aiX: number, aiY: number, playerX: number, playerY: number) {
    this.scene = scene;
    this.spellSystem = spellSystem;
    this.aiX = aiX;
    this.aiY = aiY;
    this.playerX = playerX;
    this.playerY = playerY;

    this.state = {
      health: 100,
      maxHealth: 100,
      shieldActive: false,
      shieldCooldown: 0,
      lastSpellTime: 0,
      lastFusionTime: 0,
      lastShieldTime: -20000,
      currentBehavior: 'idle',
      targetPlayerElement: null,
    };

    this.eventEmitter = new Phaser.Events.EventEmitter();
    this.startDecisionLoop();
  }

  public updatePlayerSpellCast(element: SpellElement): void {
    this.playerRecentSpells.push(element);
    if (this.playerRecentSpells.length > this.maxRecentSpells) {
      this.playerRecentSpells.shift();
    }
    this.state.targetPlayerElement = element;
  }

  private startDecisionLoop(): void {
    this.decisionTimer = this.scene.time.addEvent({
      delay: 500,
      loop: true,
      callback: this.makeDecision,
      callbackScope: this,
    });

    this.scene.time.addEvent({
      delay: 5000,
      loop: true,
      callback: this.randomSpellCast,
      callbackScope: this,
    });
  }

  private makeDecision(): void {
    if (this.state.health <= 0) return;

    const healthPercent = this.state.health / this.state.maxHealth;
    const now = this.scene.time.now;

    if (healthPercent < 0.3 && !this.state.shieldActive && now - this.state.lastShieldTime > 20000) {
      this.activateShield();
      return;
    }

    if (this.state.shieldActive) {
      this.state.currentBehavior = 'defensive';
      return;
    }

    if (this.state.targetPlayerElement && healthPercent > 0.4) {
      const counterEl = getCounterElement(this.state.targetPlayerElement);
      this.aiSpellSlots = [counterEl];
      const otherElements = this.aiSpells.filter((e) => e !== counterEl);
      this.aiSpellSlots.push(otherElements[Math.floor(Math.random() * otherElements.length)]);
      this.state.currentBehavior = 'counter';
      this.tryCastCounterSpell();
      return;
    }

    if (healthPercent < 0.5) {
      this.state.currentBehavior = 'fusion';
      this.tryCastFusion();
      return;
    }

    this.state.currentBehavior = 'aggressive';
    this.tryCastRandomSpell();
  }

  private tryCastCounterSpell(): void {
    const now = this.scene.time.now;
    if (now - this.state.lastSpellTime < 1200) return;

    if (this.aiSpellSlots.length > 0) {
      const primaryElement = this.aiSpellSlots[0];
      if (this.spellSystem.isSpellReady(primaryElement)) {
        this.castSpellAtPlayer(primaryElement);
      } else if (this.aiSpellSlots.length > 1 && this.spellSystem.isSpellReady(this.aiSpellSlots[1])) {
        this.castSpellAtPlayer(this.aiSpellSlots[1]);
      }
    }
  }

  private tryCastRandomSpell(): void {
    const now = this.scene.time.now;
    if (now - this.state.lastSpellTime < 1000) return;

    const readySpells = this.aiSpells.filter((e) => this.spellSystem.isSpellReady(e));
    if (readySpells.length > 0) {
      const element = readySpells[Math.floor(Math.random() * readySpells.length)];
      this.castSpellAtPlayer(element);
    }
  }

  private tryCastFusion(): void {
    const now = this.scene.time.now;
    if (now - this.state.lastFusionTime < 8000) {
      this.tryCastRandomSpell();
      return;
    }

    const pairs: [SpellElement, SpellElement][] = [
      ['fire', 'water'],
      ['fire', 'wind'],
      ['water', 'earth'],
      ['wind', 'earth'],
    ];

    for (const [e1, e2] of pairs) {
      if (this.spellSystem.isSpellReady(e1) && this.spellSystem.isSpellReady(e2)) {
        this.castFusionSpell(e1, e2);
        return;
      }
    }

    this.tryCastRandomSpell();
  }

  private randomSpellCast(): void {
    if (this.state.health <= 0 || this.state.shieldActive) return;

    const useFusion = Math.random() < 0.35;
    if (useFusion) {
      const pairs: [SpellElement, SpellElement][] = [
        ['fire', 'water'],
        ['fire', 'wind'],
        ['water', 'earth'],
        ['wind', 'earth'],
      ];
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      if (this.spellSystem.isSpellReady(pair[0]) && this.spellSystem.isSpellReady(pair[1])) {
        this.castFusionSpell(pair[0], pair[1]);
        return;
      }
    }

    this.tryCastRandomSpell();
  }

  private castSpellAtPlayer(element: SpellElement): void {
    const jitter = 40;
    const targetX = this.playerX + (Math.random() - 0.5) * jitter;
    const targetY = this.playerY + (Math.random() - 0.5) * jitter;

    const projectile = this.spellSystem.castSpellByElement(
      element,
      this.aiX,
      this.aiY,
      targetX,
      targetY,
      'ai'
    );

    if (projectile) {
      this.state.lastSpellTime = this.scene.time.now;
      this.eventEmitter.emit('action', {
        type: 'castSpell',
        element,
        targetX,
        targetY,
      } as AIActionEvent);
    }
  }

  private castFusionSpell(element1: SpellElement, element2: SpellElement): void {
    const jitter = 30;
    const targetX = this.playerX + (Math.random() - 0.5) * jitter;
    const targetY = this.playerY + (Math.random() - 0.5) * jitter;

    const first = this.spellSystem.castSpellByElement(
      element1,
      this.aiX - 10,
      this.aiY - 5,
      targetX - 5,
      targetY,
      'ai'
    );

    if (!first) return;

    this.scene.time.delayedCall(120, () => {
      const second = this.spellSystem.castSpellByElement(
        element2,
        this.aiX + 10,
        this.aiY + 5,
        targetX + 5,
        targetY,
        'ai'
      );

      if (second) {
        this.state.lastFusionTime = this.scene.time.now;
        this.state.lastSpellTime = this.scene.time.now;
        this.eventEmitter.emit('action', {
          type: 'castFusion',
          element1,
          element2,
          targetX,
          targetY,
        } as AIActionEvent);

        this.scene.time.delayedCall(500, () => {
          this.tryFuseProjectiles(first, second);
        });
      }
    });
  }

  private tryFuseProjectiles(p1: any, p2: any): void {
    if (!p1 || !p2 || !p1.active || !p2.active) return;

    const key = `${p1.element}+${p2.element}`;
    const fusion = FUSION_MAP[key];
    if (fusion) {
      p1.applyFusion(fusion);
      this.spellSystem.removeProjectile(p2);

      this.eventEmitter.emit('fusionCreated', {
        type: fusion.type,
        position: p1.getPosition(),
        ai: true,
      });
    }
  }

  private activateShield(): void {
    this.state.shieldActive = true;
    this.state.lastShieldTime = this.scene.time.now;

    this.eventEmitter.emit('shieldActivated');

    if (this.shieldTimer) {
      this.shieldTimer.remove();
    }
    this.shieldTimer = this.scene.time.delayedCall(2000, () => {
      this.state.shieldActive = false;
      this.eventEmitter.emit('shieldDeactivated');
    });
  }

  public takeDamage(damage: number): number {
    if (this.state.shieldActive) {
      this.eventEmitter.emit('shieldBlocked');
      return 0;
    }

    this.state.health = Math.max(0, this.state.health - damage);

    if (this.state.health <= 0) {
      this.eventEmitter.emit('defeated');
    } else if (this.state.health <= this.state.maxHealth * 0.3) {
      this.eventEmitter.emit('criticalHealth');
    }

    return damage;
  }

  public heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  public getState(): Readonly<AIState> {
    return { ...this.state };
  }

  public isShieldActive(): boolean {
    return this.state.shieldActive;
  }

  public getHealth(): number {
    return this.state.health;
  }

  public getHealthPercent(): number {
    return this.state.health / this.state.maxHealth;
  }

  public setPlayerPosition(x: number, y: number): void {
    this.playerX = x;
    this.playerY = y;
  }

  public setAIPosition(x: number, y: number): void {
    this.aiX = x;
    this.aiY = y;
  }

  public update(time: number, delta: number): void {
    const now = this.scene.time.now;
    this.state.shieldCooldown = Math.max(0, 20000 - (now - this.state.lastShieldTime));
  }

  public getEventEmitter(): Phaser.Events.EventEmitter {
    return this.eventEmitter;
  }

  public reset(): void {
    this.state = {
      health: 100,
      maxHealth: 100,
      shieldActive: false,
      shieldCooldown: 0,
      lastSpellTime: 0,
      lastFusionTime: 0,
      lastShieldTime: -20000,
      currentBehavior: 'idle',
      targetPlayerElement: null,
    };
    this.playerRecentSpells = [];

    if (this.shieldTimer) {
      this.shieldTimer.remove();
      this.shieldTimer = null;
    }
  }

  public destroy(): void {
    if (this.decisionTimer) {
      this.decisionTimer.remove();
    }
    if (this.shieldTimer) {
      this.shieldTimer.remove();
    }
    this.eventEmitter.removeAllListeners();
  }
}

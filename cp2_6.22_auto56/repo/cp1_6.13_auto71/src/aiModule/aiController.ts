import Phaser from 'phaser';
import {
  SpellElement,
  SpellSystem,
  getCounterElement,
  SPELL_CONFIGS,
  FUSION_MAP,
  FusionEffect,
} from '../playerModule/spellSystem';

export type NodeStatus = 'success' | 'failure' | 'running';

export interface BehaviorTreeNode {
  tick(delta: number): NodeStatus;
  reset(): void;
  name: string;
}

export abstract class CompositeNode implements BehaviorTreeNode {
  protected children: BehaviorTreeNode[] = [];
  public name: string;
  protected currentIndex: number = 0;

  constructor(name: string, children: BehaviorTreeNode[] = []) {
    this.name = name;
    this.children = children;
  }

  public addChild(child: BehaviorTreeNode): void {
    this.children.push(child);
  }

  public reset(): void {
    this.currentIndex = 0;
    for (const child of this.children) {
      child.reset();
    }
  }

  abstract tick(delta: number): NodeStatus;
}

export class Selector extends CompositeNode {
  constructor(name: string, children: BehaviorTreeNode[] = []) {
    super(name, children);
  }

  public tick(delta: number): NodeStatus {
    for (let i = this.currentIndex; i < this.children.length; i++) {
      const status = this.children[i].tick(delta);
      if (status === 'running') {
        this.currentIndex = i;
        return 'running';
      }
      if (status === 'success') {
        this.reset();
        return 'success';
      }
    }
    this.reset();
    return 'failure';
  }
}

export class Sequence extends CompositeNode {
  constructor(name: string, children: BehaviorTreeNode[] = []) {
    super(name, children);
  }

  public tick(delta: number): NodeStatus {
    for (let i = this.currentIndex; i < this.children.length; i++) {
      const status = this.children[i].tick(delta);
      if (status === 'running') {
        this.currentIndex = i;
        return 'running';
      }
      if (status === 'failure') {
        this.reset();
        return 'failure';
      }
    }
    this.reset();
    return 'success';
  }
}

export abstract class ConditionNode implements BehaviorTreeNode {
  public name: string;

  constructor(name: string) {
    this.name = name;
  }

  public reset(): void {}

  abstract tick(delta: number): NodeStatus;
}

export abstract class ActionNode implements BehaviorTreeNode {
  public name: string;
  protected isRunning: boolean = false;
  protected startTime: number = 0;

  constructor(name: string) {
    this.name = name;
  }

  public reset(): void {
    this.isRunning = false;
    this.startTime = 0;
  }

  abstract tick(delta: number): NodeStatus;
}

export class Inverter implements BehaviorTreeNode {
  public name: string;
  private child: BehaviorTreeNode;

  constructor(name: string, child: BehaviorTreeNode) {
    this.name = name;
    this.child = child;
  }

  public tick(delta: number): NodeStatus {
    const status = this.child.tick(delta);
    if (status === 'running') return 'running';
    return status === 'success' ? 'failure' : 'success';
  }

  public reset(): void {
    this.child.reset();
  }
}

export class Repeater implements BehaviorTreeNode {
  public name: string;
  private child: BehaviorTreeNode;
  private count: number;
  private currentCount: number = 0;

  constructor(name: string, child: BehaviorTreeNode, count: number = -1) {
    this.name = name;
    this.child = child;
    this.count = count;
  }

  public tick(delta: number): NodeStatus {
    if (this.count > 0 && this.currentCount >= this.count) {
      return 'success';
    }

    const status = this.child.tick(delta);
    if (status === 'running') return 'running';

    if (status === 'success') {
      this.currentCount++;
      if (this.count < 0 || this.currentCount < this.count) {
        this.child.reset();
        return 'running';
      }
      return 'success';
    }

    return 'failure';
  }

  public reset(): void {
    this.currentCount = 0;
    this.child.reset();
  }
}

export interface AIState {
  health: number;
  maxHealth: number;
  shieldActive: boolean;
  shieldCooldown: number;
  lastSpellTime: number;
  lastFusionTime: number;
  lastShieldTime: number;
  currentBehavior: string;
  targetPlayerElement: SpellElement | null;
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
  private behaviorTree: BehaviorTreeNode | null = null;
  private playerRecentSpells: SpellElement[] = [];
  private maxRecentSpells: number = 5;
  private aiElements: SpellElement[] = ['fire', 'water', 'wind', 'earth'];
  private isDestroyed: boolean = false;
  private decisionInterval: number = 100;
  private lastDecisionTime: number = 0;
  private periodicSpellTimer: Phaser.Time.TimerEvent | null = null;
  private shieldTimer: Phaser.Time.TimerEvent | null = null;

  constructor(
    scene: Phaser.Scene,
    spellSystem: SpellSystem,
    aiX: number,
    aiY: number,
    playerX: number,
    playerY: number
  ) {
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
    this.buildBehaviorTree();
    this.startPeriodicSpellCast();
  }

  private buildBehaviorTree(): void {
    const root = new Selector('Root', [
      new Sequence('DefensiveSequence', [
        new LowHealthCondition('LowHealth?', this, 0.3),
        new ShieldReadyCondition('ShieldReady?', this),
        new ActivateShieldAction('ActivateShield', this),
      ]),
      new Sequence('CounterSequence', [
        new HasPlayerSpellDataCondition('HasPlayerSpell?', this),
        new Inverter('IsShieldActive?', new ShieldActiveCondition('ShieldActive', this)),
        new CounterSpellAction('CastCounterSpell', this),
      ]),
      new Sequence('LowHealthFusionSequence', [
        new LowHealthCondition('LowHealthFusion?', this, 0.5),
        new FusionReadyCondition('FusionReady?', this),
        new CastFusionAction('CastFusion', this),
      ]),
      new Sequence('AggressiveSequence', [
        new Inverter('NotShieldActive', new ShieldActiveCondition('ShieldActive', this)),
        new SpellReadyCondition('AnySpellReady?', this),
        new CastRandomSpellAction('CastRandomSpell', this),
      ]),
    ]);

    this.behaviorTree = root;
  }

  private startPeriodicSpellCast(): void {
    this.periodicSpellTimer = this.scene.time.addEvent({
      delay: 5000,
      loop: true,
      callback: this.onPeriodicSpell,
      callbackScope: this,
    });
  }

  private onPeriodicSpell(): void {
    if (this.isDestroyed || this.state.health <= 0) return;
    if (this.state.shieldActive) return;

    const useFusion = Math.random() < 0.35;

    if (useFusion) {
      const pairs: [SpellElement, SpellElement][] = [
        ['fire', 'water'],
        ['fire', 'wind'],
        ['water', 'earth'],
        ['wind', 'earth'],
      ];
      const pair = pairs[Math.floor(Math.random() * pairs.length)];
      if (
        this.spellSystem.isSpellReady(pair[0]) &&
        this.spellSystem.isSpellReady(pair[1])
      ) {
        this.castFusionSpell(pair[0], pair[1]);
        return;
      }
    }

    const readyElements = this.aiElements.filter((e) =>
      this.spellSystem.isSpellReady(e)
    );
    if (readyElements.length > 0) {
      const element = readyElements[Math.floor(Math.random() * readyElements.length)];
      this.castSpellAtPlayer(element);
    }
  }

  public updatePlayerSpellCast(element: SpellElement): void {
    this.playerRecentSpells.push(element);
    if (this.playerRecentSpells.length > this.maxRecentSpells) {
      this.playerRecentSpells.shift();
    }
    this.state.targetPlayerElement = element;
  }

  public getMostRecentPlayerSpell(): SpellElement | null {
    if (this.playerRecentSpells.length === 0) return null;
    return this.playerRecentSpells[this.playerRecentSpells.length - 1];
  }

  public update(time: number, delta: number): void {
    if (this.isDestroyed || this.state.health <= 0) return;

    const now = this.scene.time.now;
    if (now - this.lastDecisionTime >= this.decisionInterval) {
      this.lastDecisionTime = now;
      if (this.behaviorTree) {
        this.behaviorTree.tick(delta);
      }
    }

    const nowMs = this.scene.time.now;
    this.state.shieldCooldown = Math.max(
      0,
      20000 - (nowMs - this.state.lastShieldTime)
    );
  }

  public castSpellAtPlayer(element: SpellElement): boolean {
    if (!this.spellSystem.isSpellReady(element)) return false;

    const jitter = 45;
    const targetX = this.playerX + (Math.random() - 0.5) * jitter;
    const targetY = this.playerY + (Math.random() - 0.5) * jitter;

    const projectile = this.spellSystem.castSpell(
      element,
      this.aiX,
      this.aiY,
      targetX,
      targetY,
      'ai'
    );

    if (projectile) {
      this.state.lastSpellTime = this.scene.time.now;
      this.eventEmitter.emit('spellCast', { element, targetX, targetY });
      return true;
    }
    return false;
  }

  public castFusionSpell(element1: SpellElement, element2: SpellElement): boolean {
    if (
      !this.spellSystem.isSpellReady(element1) ||
      !this.spellSystem.isSpellReady(element2)
    ) {
      return false;
    }

    const jitter = 25;
    const targetX = this.playerX + (Math.random() - 0.5) * jitter;
    const targetY = this.playerY + (Math.random() - 0.5) * jitter;

    const p1 = this.spellSystem.castSpell(
      element1,
      this.aiX - 12,
      this.aiY - 6,
      targetX - 8,
      targetY,
      'ai'
    );

    if (!p1) return false;

    this.scene.time.delayedCall(100, () => {
      if (this.isDestroyed) return;

      const p2 = this.spellSystem.castSpell(
        element2,
        this.aiX + 12,
        this.aiY + 6,
        targetX + 8,
        targetY,
        'ai'
      );

      if (p2) {
        this.state.lastFusionTime = this.scene.time.now;
        this.state.lastSpellTime = this.scene.time.now;

        this.scene.time.delayedCall(450, () => {
          if (this.isDestroyed) return;
          if (p1.active && p2.active) {
            const fusion = this.spellSystem.createFusion(p1, p2);
            if (fusion) {
              this.eventEmitter.emit('fusionCreated', {
                type: fusion.fusionEffect?.type,
                position: fusion.getPosition(),
              });
            }
          }
        });
      }
    });

    return true;
  }

  public activateShield(): boolean {
    if (this.state.shieldActive) return false;
    if (this.scene.time.now - this.state.lastShieldTime < 20000) return false;

    this.state.shieldActive = true;
    this.state.lastShieldTime = this.scene.time.now;
    this.state.currentBehavior = 'defensive';

    this.eventEmitter.emit('shieldActivated');

    if (this.shieldTimer) {
      this.shieldTimer.remove();
    }

    this.shieldTimer = this.scene.time.delayedCall(2000, () => {
      this.state.shieldActive = false;
      this.eventEmitter.emit('shieldDeactivated');
    });

    return true;
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

    this.eventEmitter.emit('healthChanged', {
      current: this.state.health,
      max: this.state.maxHealth,
      percent: this.state.health / this.state.maxHealth,
    });

    return damage;
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

  public canCastAnySpell(): boolean {
    return this.aiElements.some((e) => this.spellSystem.isSpellReady(e));
  }

  public getReadySpells(): SpellElement[] {
    return this.aiElements.filter((e) => this.spellSystem.isSpellReady(e));
  }

  public getRandomReadySpell(): SpellElement | null {
    const ready = this.getReadySpells();
    if (ready.length === 0) return null;
    return ready[Math.floor(Math.random() * ready.length)];
  }

  public findFusionPair(): [SpellElement, SpellElement] | null {
    const pairs: [SpellElement, SpellElement][] = [
      ['fire', 'water'],
      ['fire', 'wind'],
      ['water', 'earth'],
      ['wind', 'earth'],
    ];

    for (const [e1, e2] of pairs) {
      if (
        this.spellSystem.isSpellReady(e1) &&
        this.spellSystem.isSpellReady(e2)
      ) {
        return [e1, e2];
      }
    }
    return null;
  }

  public setPlayerPosition(x: number, y: number): void {
    this.playerX = x;
    this.playerY = y;
  }

  public setAIPosition(x: number, y: number): void {
    this.aiX = x;
    this.aiY = y;
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

    if (this.behaviorTree) {
      this.behaviorTree.reset();
    }

    if (this.shieldTimer) {
      this.shieldTimer.remove();
      this.shieldTimer = null;
    }
  }

  public destroy(): void {
    this.isDestroyed = true;

    if (this.periodicSpellTimer) {
      this.periodicSpellTimer.remove();
      this.periodicSpellTimer = null;
    }
    if (this.shieldTimer) {
      this.shieldTimer.remove();
      this.shieldTimer = null;
    }

    this.eventEmitter.removeAllListeners();
    this.behaviorTree = null;
    this.playerRecentSpells = [];
  }
}

class LowHealthCondition extends ConditionNode {
  private ai: AIController;
  private threshold: number;

  constructor(name: string, ai: AIController, threshold: number = 0.3) {
    super(name);
    this.ai = ai;
    this.threshold = threshold;
  }

  public tick(): NodeStatus {
    return this.ai.getHealthPercent() < this.threshold ? 'success' : 'failure';
  }
}

class ShieldReadyCondition extends ConditionNode {
  private ai: AIController;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    const state = this.ai.getState();
    return !state.shieldActive && state.shieldCooldown <= 0
      ? 'success'
      : 'failure';
  }
}

class ShieldActiveCondition extends ConditionNode {
  private ai: AIController;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    return this.ai.isShieldActive() ? 'success' : 'failure';
  }
}

class HasPlayerSpellDataCondition extends ConditionNode {
  private ai: AIController;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    return this.ai.getMostRecentPlayerSpell() !== null ? 'success' : 'failure';
  }
}

class FusionReadyCondition extends ConditionNode {
  private ai: AIController;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    const state = this.ai.getState();
    const canFuse = this.ai.findFusionPair() !== null;
    const cooldownOk = state.lastFusionTime === 0 ||
      (Date.now() - state.lastFusionTime) > 6000;
    return canFuse && cooldownOk ? 'success' : 'failure';
  }
}

class SpellReadyCondition extends ConditionNode {
  private ai: AIController;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    return this.ai.canCastAnySpell() ? 'success' : 'failure';
  }
}

class ActivateShieldAction extends ActionNode {
  private ai: AIController;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    const success = this.ai.activateShield();
    return success ? 'success' : 'failure';
  }
}

class CounterSpellAction extends ActionNode {
  private ai: AIController;
  private castCooldown: number = 1200;
  private lastCastTime: number = 0;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(delta: number): NodeStatus {
    const now = Date.now();
    if (now - this.lastCastTime < this.castCooldown) {
      return 'failure';
    }

    const playerSpell = this.ai.getMostRecentPlayerSpell();
    if (!playerSpell) return 'failure';

    const counterElement = getCounterElement(playerSpell);

    if (this.ai.getState().health < 0.4 && Math.random() < 0.4) {
      const pair = this.ai.findFusionPair();
      if (pair && pair.includes(counterElement)) {
        const success = this.ai.castFusionSpell(pair[0], pair[1]);
        if (success) {
          this.lastCastTime = now;
          return 'success';
        }
      }
    }

    if (this.ai.castSpellAtPlayer(counterElement)) {
      this.lastCastTime = now;
      return 'success';
    }

    const backup = this.ai.getRandomReadySpell();
    if (backup) {
      this.ai.castSpellAtPlayer(backup);
      this.lastCastTime = now;
      return 'success';
    }

    return 'failure';
  }
}

class CastFusionAction extends ActionNode {
  private ai: AIController;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    const pair = this.ai.findFusionPair();
    if (!pair) return 'failure';

    const success = this.ai.castFusionSpell(pair[0], pair[1]);
    return success ? 'success' : 'failure';
  }
}

class CastRandomSpellAction extends ActionNode {
  private ai: AIController;
  private minInterval: number = 900;
  private lastAttemptTime: number = 0;

  constructor(name: string, ai: AIController) {
    super(name);
    this.ai = ai;
  }

  public tick(): NodeStatus {
    const now = Date.now();
    if (now - this.lastAttemptTime < this.minInterval) {
      return 'failure';
    }
    this.lastAttemptTime = now;

    const element = this.ai.getRandomReadySpell();
    if (!element) return 'failure';

    const success = this.ai.castSpellAtPlayer(element);
    return success ? 'success' : 'failure';
  }
}

export {
  Selector as BehaviorSelector,
  Sequence as BehaviorSequence,
  ConditionNode as BehaviorCondition,
  ActionNode as BehaviorAction,
  Inverter as BehaviorInverter,
  Repeater as BehaviorRepeater,
};

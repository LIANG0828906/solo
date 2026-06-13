import Phaser from 'phaser';

export type SpellElement = 'fire' | 'water' | 'wind' | 'earth';
export type FusionType = 'steam' | 'firestorm' | 'mudslide' | 'sandstorm' | null;

export interface SpellConfig {
  element: SpellElement;
  name: string;
  cooldown: number;
  damage: number;
  speed: number;
  color: number;
  glowColor: number;
  icon: string;
}

export const SPELL_CONFIGS: Record<SpellElement, SpellConfig> = {
  fire: {
    element: 'fire',
    name: '火球术',
    cooldown: 2000,
    damage: 10,
    speed: 320,
    color: 0xff6a00,
    glowColor: 0xffab40,
    icon: '🔥',
  },
  water: {
    element: 'water',
    name: '水弹术',
    cooldown: 3000,
    damage: 10,
    speed: 280,
    color: 0x2196f3,
    glowColor: 0x64b5f6,
    icon: '💧',
  },
  wind: {
    element: 'wind',
    name: '风刃术',
    cooldown: 1500,
    damage: 10,
    speed: 400,
    color: 0xeceff1,
    glowColor: 0xffffff,
    icon: '🌪️',
  },
  earth: {
    element: 'earth',
    name: '落石术',
    cooldown: 4000,
    damage: 10,
    speed: 220,
    color: 0x8d6e63,
    glowColor: 0xbcaaa4,
    icon: '🪨',
  },
};

export interface FusionEffect {
  type: FusionType;
  name: string;
  damage: number;
  duration: number;
  radiusMultiplier: number;
  effects: string[];
  color: number;
  glowColor: number;
}

export const FUSION_MAP: Record<string, FusionEffect> = {
  'fire+water': {
    type: 'steam',
    name: '蒸汽爆炸',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.5,
    effects: ['灼烧', '减速'],
    color: 0xb0bec5,
    glowColor: 0xeceff1,
  },
  'water+fire': {
    type: 'steam',
    name: '蒸汽爆炸',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.5,
    effects: ['灼烧', '减速'],
    color: 0xb0bec5,
    glowColor: 0xeceff1,
  },
  'fire+wind': {
    type: 'firestorm',
    name: '火焰旋风',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.2,
    effects: ['击退', '伤害提升'],
    color: 0xff5722,
    glowColor: 0xff8a65,
  },
  'wind+fire': {
    type: 'firestorm',
    name: '火焰旋风',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.2,
    effects: ['击退', '伤害提升'],
    color: 0xff5722,
    glowColor: 0xff8a65,
  },
  'water+earth': {
    type: 'mudslide',
    name: '泥石流',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.3,
    effects: ['减速', '持续伤害'],
    color: 0x795548,
    glowColor: 0xa1887f,
  },
  'earth+water': {
    type: 'mudslide',
    name: '泥石流',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.3,
    effects: ['减速', '持续伤害'],
    color: 0x795548,
    glowColor: 0xa1887f,
  },
  'wind+earth': {
    type: 'sandstorm',
    name: '沙暴',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.4,
    effects: ['致盲', '降低命中率'],
    color: 0xffe082,
    glowColor: 0xffecb3,
  },
  'earth+wind': {
    type: 'sandstorm',
    name: '沙暴',
    damage: 20,
    duration: 3000,
    radiusMultiplier: 1.4,
    effects: ['致盲', '降低命中率'],
    color: 0xffe082,
    glowColor: 0xffecb3,
  },
};

export interface SpellCastEvent {
  element: SpellElement;
  owner: 'player' | 'ai';
  slotIndex?: number;
  projectileId: number;
}

export interface CooldownUpdateEvent {
  element: SpellElement;
  slotIndex?: number;
  cooldownRemaining: number;
  cooldownPercent: number;
  onCooldown: boolean;
}

export interface FusionCreatedEvent {
  type: FusionType;
  position: { x: number; y: number };
  projectileId: number;
}

export interface SpellSlotState {
  element: SpellElement;
  cooldownRemaining: number;
  cooldownPercent: number;
  onCooldown: boolean;
}

export class SpellProjectile {
  public readonly id: number;
  public element: SpellElement;
  public sprite: Phaser.GameObjects.Graphics;
  public trail: Phaser.GameObjects.Graphics;
  public body: Phaser.Physics.Arcade.Body;
  public owner: 'player' | 'ai';
  public damage: number;
  public isFused: boolean = false;
  public fusionEffect: FusionEffect | null = null;
  public active: boolean = true;
  public radius: number;
  private scene: Phaser.Scene;
  private trailPoints: { x: number; y: number }[] = [];
  private maxTrailLength: number = 15;
  private glowTween: Phaser.Tweens.Tween | null = null;
  private pulsePhase: number = 0;
  private _x: number = 0;
  private _y: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    element: SpellElement,
    owner: 'player' | 'ai'
  ) {
    this.scene = scene;
    this.id = Phaser.Math.RND.integerInRange(100000, 999999) + Date.now() % 1000;
    this.element = element;
    this.owner = owner;
    this._x = x;
    this._y = y;
    this.damage = SPELL_CONFIGS[element].damage;
    this.radius = 14;

    const config = SPELL_CONFIGS[element];

    this.trail = scene.add.graphics();
    this.sprite = scene.add.graphics();

    this.drawSpell(config.color, config.glowColor);

    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCircle(this.radius);
    this.body.setCollideWorldBounds(false);
    this.body.allowGravity = false;
    this.body.immovable = false;
    this.body.setBounce(0, 0);

    this.sprite.setPosition(x, y);
    this.sprite.setData('projectile', this);

    const dx = targetX - x;
    const dy = targetY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      const velocityX = (dx / distance) * config.speed;
      const velocityY = (dy / distance) * config.speed;
      this.body.setVelocity(velocityX, velocityY);
    }

    this.glowTween = scene.tweens.add({
      targets: this,
      pulsePhase: Math.PI * 2,
      duration: 400,
      repeat: -1,
      ease: 'Linear',
    });
  }

  public get x(): number { return this._x; }
  public get y(): number { return this._y; }

  private drawSpell(color: number, glowColor: number): void {
    this.sprite.clear();

    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.15;
    const r = this.radius * pulseScale;

    this.sprite.fillStyle(glowColor, 0.35);
    this.sprite.fillCircle(0, 0, r * 1.8);

    this.sprite.fillStyle(glowColor, 0.55);
    this.sprite.fillCircle(0, 0, r * 1.3);

    this.sprite.fillStyle(color, 1);
    this.sprite.fillCircle(0, 0, r);

    this.sprite.fillStyle(0xffffff, 0.9);
    this.sprite.fillCircle(-r * 0.25, -r * 0.25, r * 0.35);
  }

  public applyFusion(fusion: FusionEffect): void {
    this.isFused = true;
    this.fusionEffect = fusion;
    this.damage = fusion.damage;
    this.radius = 14 * fusion.radiusMultiplier;

    if (this.body) {
      this.body.setCircle(this.radius);
    }

    this.drawSpell(fusion.color, fusion.glowColor);

    this.scene.cameras.main.flash(
      150,
      fusion.color >> 16,
      (fusion.color >> 8) & 0xff,
      fusion.color & 0xff
    );
  }

  public update(time: number, delta: number): void {
    if (!this.active) return;

    this._x = this.sprite.x;
    this._y = this.sprite.y;

    const color = this.isFused && this.fusionEffect ? this.fusionEffect.color : SPELL_CONFIGS[this.element].color;
    const glowColor = this.isFused && this.fusionEffect ? this.fusionEffect.glowColor : SPELL_CONFIGS[this.element].glowColor;
    this.drawSpell(color, glowColor);

    this.trailPoints.unshift({ x: this._x, y: this._y });
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.pop();
    }
    this.updateTrail();

    const margin = 150;
    if (
      this._x < -margin ||
      this._x > this.scene.scale.width + margin ||
      this._y < -margin ||
      this._y > this.scene.scale.height + margin
    ) {
      this.destroy();
    }
  }

  private updateTrail(): void {
    this.trail.clear();
    const config = this.isFused && this.fusionEffect
      ? { color: this.fusionEffect.color, glowColor: this.fusionEffect.glowColor }
      : { color: SPELL_CONFIGS[this.element].color, glowColor: SPELL_CONFIGS[this.element].glowColor };

    for (let i = 0; i < this.trailPoints.length - 1; i++) {
      const point = this.trailPoints[i];
      const nextPoint = this.trailPoints[i + 1];
      const alpha = 1 - i / this.trailPoints.length;
      const lineWidth = (this.radius * 0.8) * (1 - i / this.trailPoints.length);

      this.trail.lineStyle(lineWidth, config.glowColor, alpha * 0.5);
      this.trail.beginPath();
      this.trail.moveTo(point.x, point.y);
      this.trail.lineTo(nextPoint.x, nextPoint.y);
      this.trail.strokePath();

      this.trail.lineStyle(lineWidth * 0.6, config.color, alpha * 0.8);
      this.trail.beginPath();
      this.trail.moveTo(point.x, point.y);
      this.trail.lineTo(nextPoint.x, nextPoint.y);
      this.trail.strokePath();
    }
  }

  public getPosition(): { x: number; y: number } {
    return { x: this._x, y: this._y };
  }

  public destroy(): void {
    this.active = false;

    if (this.glowTween) {
      this.glowTween.stop();
      this.glowTween = null;
    }

    if (this.sprite) {
      if (this.sprite.body) {
        this.sprite.body.destroy();
      }
      this.sprite.destroy();
    }

    if (this.trail) {
      this.trail.destroy();
    }

    this.trailPoints = [];
  }
}

export class SpellSystem {
  private scene: Phaser.Scene;
  private spellSlots: Map<SpellElement, SpellSlotState> = new Map();
  private playerSlotIndices: SpellElement[] = ['fire', 'water'];
  private lastCastTime: Record<SpellElement, number> = {
    fire: -99999,
    water: -99999,
    wind: -99999,
    earth: -99999,
  };
  private projectiles: Map<number, SpellProjectile> = new Map();
  private eventEmitter: Phaser.Events.EventEmitter;
  private cooldownTimers: Map<SpellElement, Phaser.Time.TimerEvent> = new Map();
  private isDestroyed: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventEmitter = new Phaser.Events.EventEmitter();
    this.initializeAllSpellStates();
  }

  private initializeAllSpellStates(): void {
    const elements: SpellElement[] = ['fire', 'water', 'wind', 'earth'];
    for (const element of elements) {
      this.spellSlots.set(element, {
        element,
        cooldownRemaining: 0,
        cooldownPercent: 0,
        onCooldown: false,
      });
    }
  }

  public setPlayerSlotElements(elements: SpellElement[]): void {
    if (elements.length >= 2) {
      this.playerSlotIndices = elements.slice(0, 2);
    }
  }

  public getPlayerSlotElements(): SpellElement[] {
    return [...this.playerSlotIndices];
  }

  public getSpellState(element: SpellElement): Readonly<SpellSlotState> | undefined {
    const state = this.spellSlots.get(element);
    return state ? { ...state } : undefined;
  }

  public getAllSpellStates(): Map<SpellElement, SpellSlotState> {
    const result = new Map<SpellElement, SpellSlotState>();
    this.spellSlots.forEach((value, key) => {
      result.set(key, { ...value });
    });
    return result;
  }

  public canCast(element: SpellElement): boolean {
    if (this.isDestroyed) return false;
    const state = this.spellSlots.get(element);
    return state ? !state.onCooldown : false;
  }

  public canCastBySlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.playerSlotIndices.length) return false;
    return this.canCast(this.playerSlotIndices[slotIndex]);
  }

  public castSpellBySlot(
    slotIndex: number,
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    owner: 'player' | 'ai' = 'player'
  ): SpellProjectile | null {
    if (slotIndex < 0 || slotIndex >= this.playerSlotIndices.length) return null;
    const element = this.playerSlotIndices[slotIndex];
    return this.castSpell(element, fromX, fromY, targetX, targetY, owner, slotIndex);
  }

  public castSpell(
    element: SpellElement,
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    owner: 'player' | 'ai' = 'ai',
    slotIndex?: number
  ): SpellProjectile | null {
    if (!this.canCast(element) || this.isDestroyed) return null;

    const config = SPELL_CONFIGS[element];
    const now = this.scene.time.now;
    this.lastCastTime[element] = now;

    const state = this.spellSlots.get(element);
    if (state) {
      state.onCooldown = true;
      state.cooldownRemaining = config.cooldown;
      state.cooldownPercent = 1;
    }

    const projectile = new SpellProjectile(
      this.scene,
      fromX,
      fromY,
      targetX,
      targetY,
      element,
      owner
    );
    this.projectiles.set(projectile.id, projectile);

    this.startCooldownTimer(element, config.cooldown, slotIndex);

    this.eventEmitter.emit('spellCast', {
      element,
      owner,
      slotIndex,
      projectileId: projectile.id,
    } as SpellCastEvent);

    this.emitCooldownUpdate(element, slotIndex);

    return projectile;
  }

  private startCooldownTimer(element: SpellElement, duration: number, slotIndex?: number): void {
    const oldTimer = this.cooldownTimers.get(element);
    if (oldTimer) {
      oldTimer.remove();
    }

    const config = SPELL_CONFIGS[element];

    const updateCooldown = () => {
      if (this.isDestroyed) return;
      const now = this.scene.time.now;
      const elapsed = now - this.lastCastTime[element];
      const remaining = Math.max(0, config.cooldown - elapsed);
      const percent = remaining / config.cooldown;

      const state = this.spellSlots.get(element);
      if (state) {
        state.cooldownRemaining = remaining;
        state.cooldownPercent = percent;
        state.onCooldown = remaining > 0;
      }

      this.emitCooldownUpdate(element, slotIndex);
    };

    const timer = this.scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: updateCooldown,
    });

    this.cooldownTimers.set(element, timer);

    this.scene.time.delayedCall(duration, () => {
      const t = this.cooldownTimers.get(element);
      if (t) {
        t.remove();
        this.cooldownTimers.delete(element);
      }

      const state = this.spellSlots.get(element);
      if (state) {
        state.onCooldown = false;
        state.cooldownRemaining = 0;
        state.cooldownPercent = 0;
      }

      this.eventEmitter.emit('spellReady', {
        element,
        slotIndex,
      });

      this.emitCooldownUpdate(element, slotIndex);
    });
  }

  private emitCooldownUpdate(element: SpellElement, slotIndex?: number): void {
    const state = this.spellSlots.get(element);
    if (!state) return;

    this.eventEmitter.emit('cooldownUpdate', {
      element,
      slotIndex,
      cooldownRemaining: state.cooldownRemaining,
      cooldownPercent: state.cooldownPercent,
      onCooldown: state.onCooldown,
    } as CooldownUpdateEvent);
  }

  public getSpellCooldown(element: SpellElement): number {
    const state = this.spellSlots.get(element);
    return state ? state.cooldownRemaining : 0;
  }

  public getCooldownPercent(element: SpellElement): number {
    const state = this.spellSlots.get(element);
    return state ? state.cooldownPercent : 0;
  }

  public isSpellReady(element: SpellElement): boolean {
    const state = this.spellSlots.get(element);
    return state ? !state.onCooldown : false;
  }

  public update(time: number, delta: number): void {
    if (this.isDestroyed) return;

    this.projectiles.forEach((projectile) => {
      if (projectile.active) {
        projectile.update(time, delta);
      }
    });

    this.projectiles.forEach((projectile, id) => {
      if (!projectile.active) {
        this.projectiles.delete(id);
      }
    });
  }

  public getProjectiles(): SpellProjectile[] {
    const result: SpellProjectile[] = [];
    this.projectiles.forEach((p) => {
      if (p.active) result.push(p);
    });
    return result;
  }

  public getProjectileById(id: number): SpellProjectile | undefined {
    return this.projectiles.get(id);
  }

  public removeProjectile(projectile: SpellProjectile): void {
    if (this.projectiles.has(projectile.id)) {
      projectile.destroy();
      this.projectiles.delete(projectile.id);
    }
  }

  public clearAllProjectiles(): void {
    this.projectiles.forEach((p) => p.destroy());
    this.projectiles.clear();
  }

  public createFusion(
    projectile1: SpellProjectile,
    projectile2: SpellProjectile
  ): SpellProjectile | null {
    const key = `${projectile1.element}+${projectile2.element}`;
    const fusion = FUSION_MAP[key];
    if (!fusion) return null;

    const midX = (projectile1.x + projectile2.x) / 2;
    const midY = (projectile1.y + projectile2.y) / 2;

    const owner = projectile1.owner;
    const target = owner === 'player'
      ? this.getOpponentPosition('player')
      : this.getOpponentPosition('ai');

    this.removeProjectile(projectile1);
    this.removeProjectile(projectile2);

    const newProj = new SpellProjectile(
      this.scene,
      midX,
      midY,
      target.x,
      target.y,
      projectile1.element,
      owner
    );

    newProj.applyFusion(fusion);
    this.projectiles.set(newProj.id, newProj);

    this.eventEmitter.emit('fusionCreated', {
      type: fusion.type,
      position: { x: midX, y: midY },
      projectileId: newProj.id,
    } as FusionCreatedEvent);

    return newProj;
  }

  private getOpponentPosition(owner: 'player' | 'ai'): { x: number; y: number } {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    if (owner === 'player') {
      return { x: width - 120, y: height / 2 };
    }
    return { x: 120, y: height / 2 };
  }

  public static getFusion(element1: SpellElement, element2: SpellElement): FusionEffect | null {
    const key = `${element1}+${element2}`;
    return FUSION_MAP[key] || null;
  }

  public getEventEmitter(): Phaser.Events.EventEmitter {
    return this.eventEmitter;
  }

  public destroy(): void {
    this.isDestroyed = true;

    this.clearAllProjectiles();

    this.cooldownTimers.forEach((timer) => {
      timer.remove();
    });
    this.cooldownTimers.clear();

    this.eventEmitter.removeAllListeners();
    this.spellSlots.clear();
  }
}

export function getCounterElement(target: SpellElement): SpellElement {
  const counterMap: Record<SpellElement, SpellElement> = {
    fire: 'water',
    water: 'earth',
    wind: 'fire',
    earth: 'wind',
  };
  return counterMap[target];
}

export function getElementCounterMap(): Record<SpellElement, SpellElement> {
  return {
    fire: 'water',
    water: 'earth',
    wind: 'fire',
    earth: 'wind',
  };
}

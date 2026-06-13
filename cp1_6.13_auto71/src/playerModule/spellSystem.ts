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

export class SpellProjectile {
  public id: number;
  public element: SpellElement;
  public sprite: Phaser.GameObjects.Graphics;
  public trail: Phaser.GameObjects.Graphics;
  public body: Phaser.Physics.Arcade.Body;
  public owner: 'player' | 'ai';
  public x: number;
  public y: number;
  public targetX: number;
  public targetY: number;
  public damage: number;
  public isFused: boolean;
  public fusionEffect: FusionEffect | null;
  public active: boolean;
  public radius: number;
  private scene: Phaser.Scene;
  private trailPoints: { x: number; y: number }[] = [];
  private maxTrailLength: number = 15;
  private glowTween: Phaser.Tweens.Tween | null = null;
  private pulsePhase: number = 0;

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
    this.id = Date.now() + Math.random();
    this.element = element;
    this.owner = owner;
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.damage = SPELL_CONFIGS[element].damage;
    this.isFused = false;
    this.fusionEffect = null;
    this.active = true;
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

    this.sprite.setPosition(x, y);

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
    });
  }

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
    this.radius = this.radius * fusion.radiusMultiplier;

    if (this.body) {
      this.body.setCircle(this.radius);
    }

    this.drawSpell(fusion.color, fusion.glowColor);

    this.scene.cameras.main.flash(150, fusion.color >> 16, (fusion.color >> 8) & 0xff, fusion.color & 0xff);
  }

  public update(time: number, delta: number): void {
    if (!this.active) return;

    this.x = this.sprite.x;
    this.y = this.sprite.y;

    this.drawSpell(
      this.isFused && this.fusionEffect ? this.fusionEffect.color : SPELL_CONFIGS[this.element].color,
      this.isFused && this.fusionEffect ? this.fusionEffect.glowColor : SPELL_CONFIGS[this.element].glowColor
    );

    this.trailPoints.unshift({ x: this.x, y: this.y });
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.pop();
    }
    this.updateTrail();

    const margin = 100;
    if (
      this.x < -margin ||
      this.x > 900 ||
      this.y < -margin ||
      this.y > 700
    ) {
      this.destroy();
    }
  }

  private updateTrail(): void {
    this.trail.clear();
    const config = this.isFused && this.fusionEffect
      ? { color: this.fusionEffect!.color, glowColor: this.fusionEffect!.glowColor }
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
    return { x: this.x, y: this.y };
  }

  public destroy(): void {
    this.active = false;
    if (this.glowTween) {
      this.glowTween.stop();
    }
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.trail) {
      this.trail.destroy();
    }
  }
}

export interface SpellSlotState {
  element: SpellElement;
  cooldownRemaining: number;
  onCooldown: boolean;
}

export class SpellSystem {
  private scene: Phaser.Scene;
  private spellSlots: SpellSlotState[] = [];
  private slotElements: SpellElement[] = ['fire', 'water'];
  private lastCastTime: Record<SpellElement, number> = {
    fire: -99999,
    water: -99999,
    wind: -99999,
    earth: -99999,
  };
  private projectiles: SpellProjectile[] = [];
  private eventEmitter: Phaser.Events.EventEmitter;
  private spellCounter: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventEmitter = new Phaser.Events.EventEmitter();
    this.initializeSlots();
  }

  private initializeSlots(): void {
    this.spellSlots = this.slotElements.map((element) => ({
      element,
      cooldownRemaining: 0,
      onCooldown: false,
    }));
  }

  public setSlotElements(elements: SpellElement[]): void {
    if (elements.length === 2) {
      this.slotElements = [...elements];
      this.initializeSlots();
    }
  }

  public getSlotElements(): SpellElement[] {
    return [...this.slotElements];
  }

  public getSpellSlots(): SpellSlotState[] {
    return this.spellSlots.map((s) => ({ ...s }));
  }

  public canCast(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.spellSlots.length) return false;
    return !this.spellSlots[slotIndex].onCooldown;
  }

  public castSpell(
    slotIndex: number,
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    owner: 'player' | 'ai' = 'player'
  ): SpellProjectile | null {
    if (!this.canCast(slotIndex)) return null;

    const slot = this.spellSlots[slotIndex];
    const element = slot.element;
    const config = SPELL_CONFIGS[element];
    const now = this.scene.time.now;

    slot.onCooldown = true;
    slot.cooldownRemaining = config.cooldown;
    this.lastCastTime[element] = now;

    const projectile = new SpellProjectile(
      this.scene,
      fromX,
      fromY,
      targetX,
      targetY,
      element,
      owner
    );
    this.projectiles.push(projectile);
    this.spellCounter++;

    this.eventEmitter.emit('spellCast', { element, owner, slotIndex });

    return projectile;
  }

  public castSpellByElement(
    element: SpellElement,
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    owner: 'player' | 'ai' = 'ai'
  ): SpellProjectile | null {
    const config = SPELL_CONFIGS[element];
    const now = this.scene.time.now;
    if (now - this.lastCastTime[element] < config.cooldown) return null;

    this.lastCastTime[element] = now;

    const projectile = new SpellProjectile(
      this.scene,
      fromX,
      fromY,
      targetX,
      targetY,
      element,
      owner
    );
    this.projectiles.push(projectile);
    this.spellCounter++;

    this.eventEmitter.emit('spellCast', { element, owner });

    return projectile;
  }

  public getSpellCooldown(element: SpellElement): number {
    const config = SPELL_CONFIGS[element];
    const now = this.scene.time.now;
    const elapsed = now - this.lastCastTime[element];
    return Math.max(0, config.cooldown - elapsed);
  }

  public isSpellReady(element: SpellElement): boolean {
    return this.getSpellCooldown(element) <= 0;
  }

  public update(time: number, delta: number): void {
    const now = this.scene.time.now;

    for (const slot of this.spellSlots) {
      const config = SPELL_CONFIGS[slot.element];
      const elapsed = now - (this.lastCastTime[slot.element] ?? -99999);
      slot.cooldownRemaining = Math.max(0, config.cooldown - elapsed);
      slot.onCooldown = slot.cooldownRemaining > 0;
    }

    this.projectiles = this.projectiles.filter((p) => p.active);
    for (const projectile of this.projectiles) {
      projectile.update(time, delta);
    }
  }

  public getProjectiles(): SpellProjectile[] {
    return this.projectiles.filter((p) => p.active);
  }

  public removeProjectile(projectile: SpellProjectile): void {
    projectile.destroy();
    this.projectiles = this.projectiles.filter((p) => p.id !== projectile.id);
  }

  public clearAllProjectiles(): void {
    for (const p of this.projectiles) {
      p.destroy();
    }
    this.projectiles = [];
  }

  public tryFuseSpellWithElement(
    projectile: SpellProjectile,
    secondElement: SpellElement,
    fromX: number,
    fromY: number
  ): SpellProjectile | null {
    const key = `${projectile.element}+${secondElement}`;
    const fusion = FUSION_MAP[key];
    if (!fusion) return null;

    projectile.applyFusion(fusion);

    this.eventEmitter.emit('fusionCreated', {
      type: fusion.type,
      position: projectile.getPosition(),
    });

    return projectile;
  }

  public static getFusion(element1: SpellElement, element2: SpellElement): FusionEffect | null {
    const key = `${element1}+${element2}`;
    return FUSION_MAP[key] || null;
  }

  public getEventEmitter(): Phaser.Events.EventEmitter {
    return this.eventEmitter;
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

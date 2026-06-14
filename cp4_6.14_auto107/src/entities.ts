export type MaterialType = 'fire' | 'nature' | 'water' | 'earth';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PotionRecipe {
  id: string;
  name: string;
  ingredients: MaterialType[];
  reward: [number, number];
}

export const MATERIAL_COLORS: Record<MaterialType, string> = {
  fire: '#ef4444',
  nature: '#22c55e',
  water: '#3b82f6',
  earth: '#f59e0b',
};

export const POTION_RECIPES: PotionRecipe[] = [
  { id: 'healing', name: '治疗药剂', ingredients: ['nature', 'water', 'earth'], reward: [20, 35] },
  { id: 'fire', name: '火焰药剂', ingredients: ['fire', 'fire', 'earth'], reward: [25, 40] },
  { id: 'mana', name: '魔力药剂', ingredients: ['water', 'nature', 'nature'], reward: [30, 45] },
  { id: 'strength', name: '力量药剂', ingredients: ['fire', 'earth', 'water'], reward: [35, 50] },
];

export const CUSTOMER_COLORS = ['#60a5fa', '#fbbf24', '#a78bfa'];

export class Particle {
  position: Position;
  velocity: Position;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  gravity: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, life: number, size: number = 4, gravity: number = 0) {
    this.position = { x, y };
    this.velocity = { x: vx, y: vy };
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.gravity = gravity;
  }

  update(deltaTime: number): boolean {
    this.velocity.y += this.gravity * deltaTime;
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.life -= deltaTime;
    return this.life > 0;
  }

  getAlpha(): number {
    return Math.max(0, this.life / this.maxLife);
  }
}

export class PourEffect {
  from: Position;
  to: Position;
  color: string;
  progress: number;
  duration: number;
  liquidTrail: { x: number; y: number; r: number }[];
  splashParticles: Particle[];
  splashTriggered: boolean;

  constructor(fromX: number, fromY: number, toX: number, toY: number, color: string) {
    this.from = { x: fromX, y: fromY };
    this.to = { x: toX, y: toY };
    this.color = color;
    this.progress = 0;
    this.duration = 0.4;
    this.liquidTrail = [];
    this.splashParticles = [];
    this.splashTriggered = false;
  }

  update(deltaTime: number): boolean {
    this.progress += deltaTime / this.duration;

    const t = Math.min(1, this.progress);
    const currentX = this.from.x + (this.to.x - this.from.x) * t;
    const currentY = this.from.y + (this.to.y - this.from.y) * t + (1 - Math.pow(1 - t, 2)) * -50;

    this.liquidTrail.push({ x: currentX, y: currentY, r: Math.max(2, 6 * (1 - t * 0.5)) });
    if (this.liquidTrail.length > 20) {
      this.liquidTrail.shift();
    }

    if (!this.splashTriggered && this.progress >= 0.9) {
      this.triggerSplash();
      this.splashTriggered = true;
    }

    this.splashParticles = this.splashParticles.filter(p => p.update(deltaTime));

    return this.progress < 1 || this.splashParticles.length > 0;
  }

  private triggerSplash(): void {
    const splashLife = 0.3;
    const splashX = this.to.x;
    const splashY = this.to.y;

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * i) / 7 + Math.PI;
      const speed = 40 + Math.random() * 40;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 20;
      this.splashParticles.push(new Particle(
        splashX + (Math.random() - 0.5) * 10,
        splashY,
        vx,
        vy,
        this.color,
        splashLife,
        3 + Math.random() * 3,
        120
      ));
    }
  }
}

export class Customer {
  id: string;
  position: Position;
  color: string;
  order: PotionRecipe;
  waitTime: number;
  maxWaitTime: number;
  state: 'waiting' | 'angry' | 'leaving' | 'served';
  angerEmojiTimer: number;
  targetPosition: Position;

  constructor(x: number, y: number, order: PotionRecipe) {
    this.id = `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.position = { x, y };
    this.targetPosition = { x, y };
    this.color = CUSTOMER_COLORS[Math.floor(Math.random() * CUSTOMER_COLORS.length)];
    this.order = order;
    this.waitTime = 0;
    this.maxWaitTime = 10;
    this.state = 'waiting';
    this.angerEmojiTimer = 0;
  }

  update(deltaTime: number): boolean {
    const dx = this.targetPosition.x - this.position.x;
    const dy = this.targetPosition.y - this.position.y;
    this.position.x += dx * deltaTime * 5;
    this.position.y += dy * deltaTime * 5;

    if (this.state === 'waiting') {
      this.waitTime += deltaTime;
      if (this.waitTime >= this.maxWaitTime) {
        this.state = 'angry';
        this.angerEmojiTimer = 0.5;
        this.color = '#ef4444';
      }
    }

    if (this.state === 'angry') {
      this.angerEmojiTimer -= deltaTime;
      if (this.angerEmojiTimer <= 0) {
        this.state = 'leaving';
      }
    }

    if (this.state === 'leaving') {
      this.position.x -= deltaTime * 100;
      return this.position.x > -50;
    }

    if (this.state === 'served') {
      this.position.x += deltaTime * 150;
      return this.position.x < 2000;
    }

    return true;
  }

  getDisplayColor(): string {
    if (this.state === 'angry' || this.state === 'leaving') {
      return '#ef4444';
    }
    return this.color;
  }

  getWaitProgress(): number {
    return Math.min(1, this.waitTime / this.maxWaitTime);
  }
}

export class MaterialBottle {
  id: string;
  position: Position;
  color: string;
  type: MaterialType;
  isSelected: boolean;
  glowRadius: number;
  gridIndex: { row: number; col: number };
  isDragging: boolean;
  originalPosition: Position;

  constructor(type: MaterialType, x: number, y: number, row: number, col: number) {
    this.id = `bottle-${type}-${row}-${col}`;
    this.position = { x, y };
    this.originalPosition = { x, y };
    this.color = MATERIAL_COLORS[type];
    this.type = type;
    this.isSelected = false;
    this.glowRadius = 0;
    this.isDragging = false;
    this.gridIndex = { row, col };
  }

  update(deltaTime: number): void {
    const targetGlow = this.isSelected ? 12 : 0;
    this.glowRadius += (targetGlow - this.glowRadius) * deltaTime * 15;
  }

  resetPosition(): void {
    this.position.x = this.originalPosition.x;
    this.position.y = this.originalPosition.y;
    this.isDragging = false;
  }

  containsPoint(px: number, py: number): boolean {
    const bottleWidth = 30;
    const bottleHeight = 50;
    return (
      px >= this.position.x - bottleWidth / 2 &&
      px <= this.position.x + bottleWidth / 2 &&
      py >= this.position.y - bottleHeight / 2 &&
      py <= this.position.y + bottleHeight / 2
    );
  }
}

export class Cauldron {
  position: Position;
  size: Size;
  ingredients: MaterialType[];
  isSmoking: boolean;
  smokeTimer: number;
  smokeParticles: Particle[];
  pourEffects: PourEffect[];

  constructor(x: number, y: number, width: number, height: number) {
    this.position = { x, y };
    this.size = { width, height };
    this.ingredients = [];
    this.isSmoking = false;
    this.smokeTimer = 0;
    this.smokeParticles = [];
    this.pourEffects = [];
  }

  update(deltaTime: number): void {
    if (this.isSmoking) {
      this.smokeTimer -= deltaTime;
      if (this.smokeTimer <= 0) {
        this.isSmoking = false;
      }
    }

    this.smokeParticles = this.smokeParticles.filter(p => p.update(deltaTime));
    this.pourEffects = this.pourEffects.filter(p => p.update(deltaTime));
  }

  addIngredient(type: MaterialType, fromX: number, fromY: number): void {
    this.ingredients.push(type);
    
    const toX = this.position.x;
    const toY = this.position.y - this.size.height / 4;
    this.pourEffects.push(new PourEffect(fromX, fromY, toX, toY, MATERIAL_COLORS[type]));
  }

  wrongIngredient(): void {
    this.isSmoking = true;
    this.smokeTimer = 0.5;
    this.ingredients = [];

    const smokeLife = 0.5;
    for (let i = 0; i < 12; i++) {
      const startX = this.position.x + (Math.random() - 0.5) * 50;
      const startY = this.position.y - this.size.height / 4;
      const vx = (Math.random() - 0.5) * 30;
      const vy = -40 - Math.random() * 50;
      this.smokeParticles.push(new Particle(
        startX,
        startY,
        vx,
        vy,
        '#1e293b',
        smokeLife,
        7 + Math.random() * 8,
        -15
      ));
    }
  }

  clear(): void {
    this.ingredients = [];
  }

  containsPoint(px: number, py: number): boolean {
    const dx = (px - this.position.x) / (this.size.width / 2);
    const dy = (py - this.position.y) / (this.size.height / 2);
    return dx * dx + dy * dy <= 1 && py >= this.position.y - this.size.height / 2;
  }
}

export class Potion {
  id: string;
  position: Position;
  color: string;
  recipe: PotionRecipe;
  isFlying: boolean;
  targetCustomer: Customer | null;
  flyProgress: number;

  constructor(x: number, y: number, recipe: PotionRecipe) {
    this.id = `potion-${Date.now()}`;
    this.position = { x, y };
    this.recipe = recipe;
    this.isFlying = false;
    this.targetCustomer = null;
    this.flyProgress = 0;
    this.color = this.mixColors(recipe.ingredients);
  }

  private mixColors(ingredients: MaterialType[]): string {
    let r = 0, g = 0, b = 0;
    for (const ing of ingredients) {
      const hex = MATERIAL_COLORS[ing];
      r += parseInt(hex.slice(1, 3), 16);
      g += parseInt(hex.slice(3, 5), 16);
      b += parseInt(hex.slice(5, 7), 16);
    }
    r = Math.round(r / ingredients.length);
    g = Math.round(g / ingredients.length);
    b = Math.round(b / ingredients.length);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  update(deltaTime: number): boolean {
    if (this.isFlying && this.targetCustomer) {
      this.flyProgress += deltaTime * 2.5;
      const t = Math.min(1, this.flyProgress);
      const eased = 1 - Math.pow(1 - t, 3);
      
      const startX = this.position.x;
      const startY = this.position.y;
      const endX = this.targetCustomer.position.x;
      const endY = this.targetCustomer.position.y;
      
      this.position.x = startX + (endX - startX) * eased;
      this.position.y = startY + (endY - startY) * eased;
      
      if (t >= 1) {
        return false;
      }
    }
    return true;
  }

  flyTo(customer: Customer): void {
    this.isFlying = true;
    this.targetCustomer = customer;
    this.flyProgress = 0;
  }

  containsPoint(px: number, py: number): boolean {
    const bottleWidth = 20;
    const bottleHeight = 40;
    return (
      px >= this.position.x - bottleWidth / 2 &&
      px <= this.position.x + bottleWidth / 2 &&
      py >= this.position.y - bottleHeight / 2 &&
      py <= this.position.y + bottleHeight / 2
    );
  }
}

export class GoldFlyEffect {
  from: Position;
  to: Position;
  amount: number;
  progress: number;
  duration: number;

  constructor(fromX: number, fromY: number, toX: number, toY: number, amount: number) {
    this.from = { x: fromX, y: fromY };
    this.to = { x: toX, y: toY };
    this.amount = amount;
    this.progress = 0;
    this.duration = 0.4;
  }

  update(deltaTime: number): boolean {
    this.progress += deltaTime / this.duration;
    return this.progress < 1;
  }

  getPosition(): Position {
    const t = Math.min(1, this.progress);
    const elastic = this.easeOutElastic(t);
    const arcHeight = 80 * Math.sin(t * Math.PI);
    return {
      x: this.from.x + (this.to.x - this.from.x) * elastic,
      y: this.from.y + (this.to.y - this.from.y) * elastic - arcHeight
    };
  }

  private easeOutElastic(t: number): number {
    if (t === 0) return 0;
    if (t === 1) return 1;
    const c4 = (2 * Math.PI) / 2.5;
    return Math.pow(2, -8 * t) * Math.sin((t * 8 - 0.8) * c4) + 1;
  }

  getScale(): number {
    const t = this.progress;
    return 1 + Math.sin(t * Math.PI) * 0.5;
  }
}

import { v4 as uuidv4 } from 'uuid';
import { GameState, Hero, Position, Tile, Item, Particle } from '@/types';
import { MapGenerator } from './MapGenerator';
import { CombatResolver } from './CombatResolver';

const MOVE_DURATION = 200;

export class GameEngine {
  state: GameState;
  private lastMoveTime: number = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const { map, monsters, chests, heroStart, stairs } = MapGenerator.generate(1);
    const hero = this.createHero(heroStart);
    MapGenerator.updateVisibility(map, hero.position);

    return {
      scene: 'exploration',
      hero,
      map,
      monsters,
      chests,
      stairs,
      floor: 1,
      combat: {
        monster: null,
        turn: 'hero',
        logs: [],
        logIndex: 0,
        charIndex: 0,
        isAnimating: false,
        drops: [],
        showLoot: false,
      },
      nearbyInteractable: null,
      particles: this.createInitialParticles(),
      selectedItem: null,
      draggedItem: null,
    };
  }

  private createHero(startPos: Position): Hero {
    return {
      id: uuidv4(),
      name: '勇者',
      position: { ...startPos },
      targetPosition: null,
      moveProgress: 0,
      hp: 100,
      maxHp: 100,
      attack: 15,
      defense: 5,
      equipment: {
        weapon: null,
        shield: null,
        potion: null,
      },
      inventory: [],
      isAttacking: false,
      attackFrame: 0,
    };
  }

  private createInitialParticles(): Particle[] {
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 2000,
        y: Math.random() * 1500,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 + 0.1,
        life: Math.random() * 300 + 200,
        maxLife: 500,
        size: Math.random() * 2 + 1,
        color: '#d4af37',
        alpha: Math.random() * 0.5 + 0.2,
      });
    }
    return particles;
  }

  startMove(dx: number, dy: number): boolean {
    if (this.state.hero.targetPosition !== null) return false;
    if (this.state.scene !== 'exploration') return false;

    const newX = this.state.hero.position.x + dx;
    const newY = this.state.hero.position.y + dy;

    if (!this.isWalkable(newX, newY)) return false;

    this.state.hero.targetPosition = { x: newX, y: newY };
    this.state.hero.moveProgress = 0;
    this.lastMoveTime = performance.now();

    return true;
  }

  private isWalkable(x: number, y: number): boolean {
    if (x < 0 || x >= this.state.map.width || y < 0 || y >= this.state.map.height) {
      return false;
    }
    const tile = this.state.map.tiles[y][x];
    return tile.type === 'floor' || tile.type === 'stairs';
  }

  update(deltaTime: number): void {
    this.updateHeroMovement(deltaTime);
    this.updateParticles(deltaTime);
    this.checkInteractables();
    this.updateCombatAnimation(deltaTime);
  }

  private updateHeroMovement(deltaTime: number): void {
    const hero = this.state.hero;
    if (hero.targetPosition === null) return;

    hero.moveProgress += deltaTime / MOVE_DURATION;

    if (hero.moveProgress >= 1) {
      hero.position = { ...hero.targetPosition };
      hero.targetPosition = null;
      hero.moveProgress = 0;

      MapGenerator.updateVisibility(this.state.map, hero.position);
      this.checkMonsterEncounter();
      this.checkStairs();
    }
  }

  private checkMonsterEncounter(): void {
    const hero = this.state.hero;
    const monster = this.state.monsters.find(
      m => m.position.x === hero.position.x && m.position.y === hero.position.y && m.hp > 0
    );

    if (monster) {
      this.startCombat(monster);
    }
  }

  private checkStairs(): void {
    const hero = this.state.hero;
    if (this.state.stairs &&
        hero.position.x === this.state.stairs.x &&
        hero.position.y === this.state.stairs.y) {
      this.nextFloor();
    }
  }

  private checkInteractables(): void {
    const hero = this.state.hero;
    let nearest: { type: 'chest' | 'stairs' | 'monster'; id?: string; dist: number } | null = null;

    for (const chest of this.state.chests) {
      if (chest.opened) continue;
      const dist = this.manhattanDistance(hero.position, chest.position);
      if (dist <= 1 && (!nearest || dist < nearest.dist)) {
        nearest = { type: 'chest', id: chest.id, dist };
      }
    }

    if (this.state.stairs) {
      const dist = this.manhattanDistance(hero.position, this.state.stairs);
      if (dist <= 1 && (!nearest || dist < nearest.dist)) {
        nearest = { type: 'stairs', dist };
      }
    }

    this.state.nearbyInteractable = nearest
      ? { type: nearest.type, id: nearest.id }
      : null;
  }

  private manhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  interact(): void {
    if (!this.state.nearbyInteractable) return;

    const { type, id } = this.state.nearbyInteractable;

    if (type === 'chest' && id) {
      this.openChest(id);
    } else if (type === 'stairs') {
      this.nextFloor();
    }
  }

  private openChest(chestId: string): void {
    const chest = this.state.chests.find(c => c.id === chestId);
    if (!chest || chest.opened) return;

    chest.opened = true;
    for (const item of chest.items) {
      this.addItemToInventory(item);
    }
  }

  private addItemToInventory(item: Item): void {
    if (this.state.hero.inventory.length < 8) {
      this.state.hero.inventory.push(item);
    }
  }

  nextFloor(): void {
    this.state.floor++;
    const { map, monsters, chests, heroStart, stairs } = MapGenerator.generate(this.state.floor);

    this.state.map = map;
    this.state.monsters = monsters;
    this.state.chests = chests;
    this.state.stairs = stairs;
    this.state.hero.position = { ...heroStart };
    this.state.hero.targetPosition = null;

    MapGenerator.updateVisibility(map, this.state.hero.position);
  }

  startCombat(monster: { id: string }): void {
    const m = this.state.monsters.find(mon => mon.id === monster.id);
    if (!m) return;

    this.state.scene = 'combat';
    this.state.combat = {
      monster: { ...m },
      turn: 'hero',
      logs: [
        {
          text: `🏰 遭遇 ${m.name}！战斗开始！`,
          type: 'info',
        },
      ],
      logIndex: 0,
      charIndex: 0,
      isAnimating: true,
      drops: [],
      showLoot: false,
    };
  }

  heroAttack(): void {
    if (this.state.combat.turn !== 'hero') return;
    if (this.state.combat.isAnimating) return;
    if (!this.state.combat.monster) return;

    const result = CombatResolver.heroAttack(this.state.hero, this.state.combat.monster);
    this.state.combat.logs.push(result.log);

    this.state.combat.monster.hp -= result.damage;
    this.state.combat.monster.isHit = true;
    this.state.combat.monster.hitFrame = 0;

    this.state.hero.isAttacking = true;
    this.state.hero.attackFrame = 0;

    this.state.combat.isAnimating = true;
    this.state.combat.logIndex = this.state.combat.logs.length - 1;
    this.state.combat.charIndex = 0;

    if (this.state.combat.monster.hp <= 0) {
      this.state.combat.monster.hp = 0;
      this.combatVictory();
    } else {
      setTimeout(() => {
        if (this.state.combat.monster && this.state.combat.monster.hp > 0) {
          this.state.combat.turn = 'monster';
          this.monsterAttack();
        }
      }, 800);
    }
  }

  private monsterAttack(): void {
    if (!this.state.combat.monster) return;

    const result = CombatResolver.monsterAttack(this.state.combat.monster, this.state.hero);
    this.state.combat.logs.push(result.log);

    this.state.hero.hp -= result.damage;
    this.state.hero.isAttacking = false;

    this.state.combat.isAnimating = true;
    this.state.combat.logIndex = this.state.combat.logs.length - 1;
    this.state.combat.charIndex = 0;

    if (this.state.hero.hp <= 0) {
      this.state.hero.hp = 0;
      this.state.scene = 'gameOver';
    } else {
      setTimeout(() => {
        this.state.combat.turn = 'hero';
        this.state.combat.isAnimating = false;
      }, 800);
    }
  }

  private combatVictory(): void {
    if (!this.state.combat.monster) return;

    const drops = CombatResolver.generateDrops(this.state.combat.monster, this.state.floor);
    this.state.combat.drops = drops;
    this.state.combat.showLoot = true;

    const deadMonsterId = this.state.combat.monster.id;
    this.state.monsters = this.state.monsters.filter(m => m.id !== deadMonsterId);

    this.state.combat.logs.push({
      text: `🎉 ${this.state.combat.monster.name} 被击败了！`,
      type: 'victory',
    });

    this.state.combat.logIndex = this.state.combat.logs.length - 1;
    this.state.combat.charIndex = 0;
  }

  collectLoot(): void {
    for (const item of this.state.combat.drops) {
      this.addItemToInventory(item);
    }
    this.state.combat.drops = [];
    this.state.combat.showLoot = false;
  }

  fleeCombat(): void {
    if (Math.random() > 0.5) {
      this.state.scene = 'exploration';
      this.state.combat = {
        monster: null,
        turn: 'hero',
        logs: [],
        logIndex: 0,
        charIndex: 0,
        isAnimating: false,
        drops: [],
        showLoot: false,
      };
    } else {
      this.state.combat.logs.push({
        text: '逃跑失败！',
        type: 'info',
      });
      this.state.combat.logIndex = this.state.combat.logs.length - 1;
      this.state.combat.charIndex = 0;
      this.state.combat.turn = 'monster';
      setTimeout(() => this.monsterAttack(), 500);
    }
  }

  usePotion(itemId: string): void {
    const itemIndex = this.state.hero.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.hero.inventory[itemIndex];
    if (item.type !== 'potion') return;

    this.state.hero.hp = Math.min(this.state.hero.maxHp, this.state.hero.hp + item.healAmount);
    this.state.hero.inventory.splice(itemIndex, 1);
  }

  equipItem(itemId: string): void {
    const itemIndex = this.state.hero.inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.hero.inventory[itemIndex];

    if (item.type === 'potion') {
      this.usePotion(itemId);
      return;
    }

    const slot = item.type as 'weapon' | 'shield';
    const currentEquipped = this.state.hero.equipment[slot];

    this.state.hero.equipment[slot] = item;
    this.state.hero.inventory.splice(itemIndex, 1);

    if (currentEquipped) {
      this.state.hero.inventory.push(currentEquipped);
    }
  }

  private updateCombatAnimation(deltaTime: number): void {
    if (this.state.hero.isAttacking) {
      this.state.hero.attackFrame += deltaTime / 50;
      if (this.state.hero.attackFrame >= 6) {
        this.state.hero.isAttacking = false;
        this.state.hero.attackFrame = 0;
      }
    }

    if (this.state.combat.monster?.isHit) {
      this.state.combat.monster.hitFrame += deltaTime / 40;
      if (this.state.combat.monster.hitFrame >= 4) {
        this.state.combat.monster.isHit = false;
        this.state.combat.monster.hitFrame = 0;
      }
    }

    if (this.state.combat.isAnimating && this.state.combat.logs.length > 0) {
      const currentLog = this.state.combat.logs[this.state.combat.logIndex];
      if (currentLog && this.state.combat.charIndex < currentLog.text.length) {
        this.state.combat.charIndex += deltaTime / 30;
      } else {
        this.state.combat.isAnimating = false;
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (const p of this.state.particles) {
      p.x += p.vx * deltaTime * 0.06;
      p.y += p.vy * deltaTime * 0.06;
      p.life -= deltaTime * 0.05;

      if (p.life <= 0) {
        p.x = Math.random() * 2000;
        p.y = Math.random() * 1500;
        p.life = p.maxLife;
        p.alpha = Math.random() * 0.5 + 0.2;
      }

      p.alpha = (p.life / p.maxLife) * 0.5;
    }
  }

  getSaveData() {
    return {
      hero: this.state.hero,
      floor: this.state.floor,
    };
  }

  loadSaveData(data: { hero: Hero; floor: number }) {
    this.state.hero = data.hero;
    this.state.floor = data.floor;

    const { map, monsters, chests, heroStart, stairs } = MapGenerator.generate(data.floor);
    this.state.map = map;
    this.state.monsters = monsters;
    this.state.chests = chests;
    this.state.stairs = stairs;

    if (data.hero.position.x > 0 && data.hero.position.y > 0) {
      this.state.hero.position = { ...data.hero.position };
    } else {
      this.state.hero.position = { ...heroStart };
    }
    this.state.hero.targetPosition = null;

    MapGenerator.updateVisibility(map, this.state.hero.position);
  }
}

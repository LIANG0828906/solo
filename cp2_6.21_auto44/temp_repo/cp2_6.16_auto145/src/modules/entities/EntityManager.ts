import { Entity, EntityType, Direction, Drop, Equipment, Chest, DamageNumber, PlayerState, TILE_SIZE, MOVE_COOLDOWN, ATTACK_DURATION, MAP_WIDTH, MAP_HEIGHT } from '../../types/gameTypes';
import { v4 as uuidv4 } from 'uuid';
import { MapGenerator } from '../map/MapGenerator';

export class EntityManager {
  private player: PlayerState | null = null;
  private monsters: Entity[] = [];
  private drops: Drop[] = [];
  private chests: Chest[] = [];
  private damageNumbers: DamageNumber[] = [];
  private mapGenerator: MapGenerator;

  constructor(mapGenerator: MapGenerator) {
    this.mapGenerator = mapGenerator;
  }

  public createPlayer(x: number, y: number): PlayerState {
    const entity: Entity = {
      id: uuidv4(),
      type: 'PLAYER',
      x: x * TILE_SIZE,
      y: y * TILE_SIZE,
      width: TILE_SIZE - 4,
      height: TILE_SIZE - 4,
      hp: 100,
      maxHp: 100,
      speed: 1,
      attack: 10,
      defense: 0,
      direction: 'DOWN',
      lastMoveTime: 0,
      isAttacking: false,
      attackStartTime: 0,
      animPhase: 0
    };

    this.player = {
      entity,
      gold: 0,
      floor: 1,
      monstersKilled: 0,
      maxDamage: 0,
      equippedWeapon: null,
      equippedArmor: null
    };

    return this.player;
  }

  public getPlayer(): PlayerState | null {
    return this.player;
  }

  public spawnMonsters(floor: number, rooms: { x: number; y: number; width: number; height: number }[]): void {
    this.monsters = [];
    const monsterCount = 3 + floor * 2 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < monsterCount; i++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const mx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
      const my = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
      
      const distToStart = Math.abs(mx - rooms[0].x) + Math.abs(my - rooms[0].y);
      if (distToStart < 5) continue;

      const types: EntityType[] = ['SLIME', 'SKELETON', 'BAT'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const baseStats = this.getMonsterStats(type, floor);
      
      const monster: Entity = {
        id: uuidv4(),
        type,
        x: mx * TILE_SIZE,
        y: my * TILE_SIZE,
        width: TILE_SIZE - 6,
        height: TILE_SIZE - 6,
        hp: baseStats.hp,
        maxHp: baseStats.hp,
        speed: baseStats.speed,
        attack: baseStats.attack,
        defense: baseStats.defense,
        direction: 'DOWN',
        lastMoveTime: 0,
        isAttacking: false,
        attackStartTime: 0,
        animPhase: Math.random() * Math.PI * 2,
        lastAiUpdate: 0
      };

      this.monsters.push(monster);
    }
  }

  private getMonsterStats(type: EntityType, floor: number) {
    const floorMultiplier = 1 + floor * 0.15;
    switch (type) {
      case 'SLIME':
        return { hp: Math.floor(30 * floorMultiplier), speed: 0.5, attack: Math.floor(5 * floorMultiplier), defense: 0 };
      case 'SKELETON':
        return { hp: Math.floor(50 * floorMultiplier), speed: 0.7, attack: Math.floor(8 * floorMultiplier), defense: 2 };
      case 'BAT':
        return { hp: Math.floor(20 * floorMultiplier), speed: 1.2, attack: Math.floor(6 * floorMultiplier), defense: 0 };
      default:
        return { hp: 30, speed: 0.5, attack: 5, defense: 0 };
    }
  }

  public spawnChests(rooms: { x: number; y: number; width: number; height: number }[]): void {
    this.chests = [];
    const chestCount = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < chestCount; i++) {
      const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
      const cx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
      const cy = room.y + 1 + Math.floor(Math.random() * (room.height - 2));
      
      this.chests.push({
        id: uuidv4(),
        x: cx * TILE_SIZE,
        y: cy * TILE_SIZE,
        opened: false,
        equipment: this.generateEquipment()
      });
    }
  }

  private generateEquipment(): Equipment {
    const weaponTypes: { type: 'SWORD' | 'AXE' | 'BOW'; name: string; stats: { attack: number; attackSpeed: number; range: number } }[] = [
      { type: 'SWORD', name: '铁剑', stats: { attack: 15, attackSpeed: 1, range: 1 } },
      { type: 'AXE', name: '战斧', stats: { attack: 25, attackSpeed: 0.7, range: 1 } },
      { type: 'BOW', name: '长弓', stats: { attack: 12, attackSpeed: 1.2, range: 5 } }
    ];

    const armorTypes: { type: 'HELMET' | 'CHESTPLATE' | 'BOOTS'; name: string; slot: 'WEAPON' | 'ARMOR'; stats: { defense: number; moveSpeed: number } }[] = [
      { type: 'HELMET', name: '铁盔', slot: 'ARMOR', stats: { defense: 5, moveSpeed: 0 } },
      { type: 'CHESTPLATE', name: '胸甲', slot: 'ARMOR', stats: { defense: 10, moveSpeed: -0.1 } },
      { type: 'BOOTS', name: '战靴', slot: 'ARMOR', stats: { defense: 3, moveSpeed: 0.2 } }
    ];

    const isWeapon = Math.random() > 0.4;
    const rarity = this.getRandomRarity();
    const rarityMultiplier = rarity === 'LEGENDARY' ? 2 : rarity === 'RARE' ? 1.5 : 1;

    if (isWeapon) {
      const weapon = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
      return {
        id: uuidv4(),
        type: weapon.type,
        slot: 'WEAPON',
        name: weapon.name,
        rarity,
        attack: Math.floor(weapon.stats.attack * rarityMultiplier),
        attackSpeed: weapon.stats.attackSpeed,
        range: weapon.stats.range,
        defense: 0,
        moveSpeed: 0
      };
    } else {
      const armor = armorTypes[Math.floor(Math.random() * armorTypes.length)];
      return {
        id: uuidv4(),
        type: armor.type,
        slot: armor.slot,
        name: armor.name,
        rarity,
        attack: 0,
        attackSpeed: 0,
        range: 0,
        defense: Math.floor(armor.stats.defense * rarityMultiplier),
        moveSpeed: armor.stats.moveSpeed
      };
    }
  }

  private getRandomRarity(): 'COMMON' | 'RARE' | 'LEGENDARY' {
    const r = Math.random();
    if (r < 0.05) return 'LEGENDARY';
    if (r < 0.25) return 'RARE';
    return 'COMMON';
  }

  public movePlayer(direction: Direction, now: number): boolean {
    if (!this.player) return false;
    if (now - this.player.entity.lastMoveTime < MOVE_COOLDOWN) return false;

    let dx = 0, dy = 0;
    switch (direction) {
      case 'UP': dy = -1; break;
      case 'DOWN': dy = 1; break;
      case 'LEFT': dx = -1; break;
      case 'RIGHT': dx = 1; break;
    }

    const newX = this.player.entity.x + dx * TILE_SIZE;
    const newY = this.player.entity.y + dy * TILE_SIZE;
    const tileX = Math.floor(newX / TILE_SIZE);
    const tileY = Math.floor(newY / TILE_SIZE);

    if (!this.mapGenerator.isWalkable(tileX, tileY)) return false;
    if (this.checkMonsterCollision(newX, newY)) return false;

    this.player.entity.x = newX;
    this.player.entity.y = newY;
    this.player.entity.direction = direction;
    this.player.entity.lastMoveTime = now;
    this.player.entity.animPhase += 1;

    this.checkDrops();
    return true;
  }

  private checkMonsterCollision(x: number, y: number): boolean {
    return this.monsters.some(m => 
      Math.abs(m.x - x) < TILE_SIZE * 0.8 && 
      Math.abs(m.y - y) < TILE_SIZE * 0.8
    );
  }

  public playerAttack(now: number): { damage: number; hit: boolean }[] {
    if (!this.player) return [];
    if (this.player.entity.isAttacking) return [];

    this.player.entity.isAttacking = true;
    this.player.entity.attackStartTime = now;

    const baseAttack = this.player.entity.attack + (this.player.equippedWeapon?.attack || 0);
    const range = (this.player.equippedWeapon?.range || 1) * TILE_SIZE;

    const results: { damage: number; hit: boolean }[] = [];
    const px = this.player.entity.x + TILE_SIZE / 2;
    const py = this.player.entity.y + TILE_SIZE / 2;

    for (const monster of this.monsters) {
      const mx = monster.x + TILE_SIZE / 2;
      const my = monster.y + TILE_SIZE / 2;
      const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);

      if (dist <= range && this.isInAttackDirection(mx, my, px, py, this.player.entity.direction)) {
        const damage = Math.max(1, baseAttack - monster.defense);
        monster.hp -= damage;
        
        this.damageNumbers.push({
          id: uuidv4(),
          x: mx,
          y: my - TILE_SIZE / 2,
          value: damage,
          startTime: now
        });

        if (damage > this.player.maxDamage) {
          this.player.maxDamage = damage;
        }

        if (monster.hp <= 0) {
          this.killMonster(monster, now);
        }

        results.push({ damage, hit: true });
      }
    }

    return results;
  }

  private isInAttackDirection(mx: number, my: number, px: number, py: number, direction: Direction): boolean {
    const dx = mx - px;
    const dy = my - py;
    const threshold = TILE_SIZE * 0.5;

    switch (direction) {
      case 'UP': return dy < 0 && Math.abs(dx) < threshold;
      case 'DOWN': return dy > 0 && Math.abs(dx) < threshold;
      case 'LEFT': return dx < 0 && Math.abs(dy) < threshold;
      case 'RIGHT': return dx > 0 && Math.abs(dy) < threshold;
    }
  }

  private killMonster(monster: Entity, now: number): void {
    this.monsters = this.monsters.filter(m => m.id !== monster.id);
    
    if (this.player) {
      this.player.monstersKilled++;
    }

    if (Math.random() < 0.7) {
      const goldValue = 5 + Math.floor(Math.random() * 15);
      this.drops.push({
        id: uuidv4(),
        type: 'COIN',
        x: monster.x + Math.random() * 10 - 5,
        y: monster.y + Math.random() * 10 - 5,
        value: goldValue,
        animPhase: Math.random() * Math.PI * 2,
        collected: false
      });
    }

    if (monster.type === 'SLIME' && Math.random() < 0.5) {
      for (let i = 0; i < 2; i++) {
        const splitX = monster.x + (i === 0 ? -TILE_SIZE : TILE_SIZE);
        const splitY = monster.y;
        const tileX = Math.floor(splitX / TILE_SIZE);
        const tileY = Math.floor(splitY / TILE_SIZE);
        
        if (this.mapGenerator.isWalkable(tileX, tileY)) {
          const babySlime: Entity = {
            id: uuidv4(),
            type: 'SLIME',
            x: splitX,
            y: splitY,
            width: TILE_SIZE - 10,
            height: TILE_SIZE - 10,
            hp: Math.floor(monster.maxHp * 0.3),
            maxHp: Math.floor(monster.maxHp * 0.3),
            speed: monster.speed * 1.2,
            attack: Math.floor(monster.attack * 0.5),
            defense: 0,
            direction: 'DOWN',
            lastMoveTime: now,
            isAttacking: false,
            attackStartTime: 0,
            animPhase: 0,
            splitPhase: 1,
            lastAiUpdate: now
          };
          this.monsters.push(babySlime);
        }
      }
    }

    if (Math.random() < 0.15) {
      this.drops.push({
        id: uuidv4(),
        type: 'EQUIPMENT',
        x: monster.x,
        y: monster.y,
        value: 0,
        equipment: this.generateEquipment(),
        animPhase: 0,
        collected: false
      });
    }
  }

  public updateMonsters(now: number): void {
    if (!this.player) return;

    const player = this.player.entity;
    const px = player.x + TILE_SIZE / 2;
    const py = player.y + TILE_SIZE / 2;

    for (const monster of this.monsters) {
      if (monster.splitPhase !== undefined) {
        monster.splitPhase = Math.max(0, (monster.splitPhase || 1) - 0.05);
        if (monster.splitPhase <= 0) {
          monster.splitPhase = undefined;
        }
      }

      monster.animPhase += 0.1;

      if (!monster.lastAiUpdate || now - monster.lastAiUpdate > 200) {
        monster.lastAiUpdate = now;

        const mx = monster.x + TILE_SIZE / 2;
        const my = monster.y + TILE_SIZE / 2;
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);

        if (dist < TILE_SIZE * 8) {
          let dx = 0, dy = 0;
          if (Math.abs(px - mx) > TILE_SIZE * 0.3) {
            dx = px > mx ? 1 : -1;
          }
          if (Math.abs(py - my) > TILE_SIZE * 0.3) {
            dy = py > my ? 1 : -1;
          }

          if (monster.type === 'BAT') {
            if (Math.random() < 0.7) {
              dx = dx || (Math.random() > 0.5 ? 1 : -1);
              dy = dy || (Math.random() > 0.5 ? 1 : -1);
            }
          }

          if (now - monster.lastMoveTime > 500 / monster.speed) {
            const newX = monster.x + dx * TILE_SIZE * monster.speed;
            const newY = monster.y + dy * TILE_SIZE * monster.speed;
            const tileX = Math.floor(newX / TILE_SIZE);
            const tileY = Math.floor(newY / TILE_SIZE);

            if (this.mapGenerator.isWalkable(tileX, tileY) &&
                !this.monsters.some(m => m.id !== monster.id && 
                  Math.abs(m.x - newX) < TILE_SIZE * 0.8 && 
                  Math.abs(m.y - newY) < TILE_SIZE * 0.8)) {
              monster.x = newX;
              monster.y = newY;
              monster.lastMoveTime = now;
            }
          }

          if (dist < TILE_SIZE * 0.9) {
            const damage = Math.max(1, monster.attack - (this.player.equippedArmor?.defense || 0) - player.defense);
            player.hp -= damage;
            monster.lastMoveTime = now + 500;
          }
        }
      }
    }

    if (this.player.entity.hp <= 0) {
      this.player.entity.hp = 0;
    }
  }

  private checkDrops(): void {
    if (!this.player) return;

    const px = this.player.entity.x + TILE_SIZE / 2;
    const py = this.player.entity.y + TILE_SIZE / 2;

    for (const drop of this.drops) {
      if (drop.collected) continue;

      const dx = drop.x + TILE_SIZE / 2 - px;
      const dy = drop.y + TILE_SIZE / 2 - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < TILE_SIZE) {
        drop.collected = true;
        if (drop.type === 'COIN') {
          this.player.gold += drop.value;
        } else if (drop.type === 'EQUIPMENT' && drop.equipment) {
          if (drop.equipment.slot === 'WEAPON') {
            this.player.equippedWeapon = drop.equipment;
          } else {
            this.player.equippedArmor = drop.equipment;
          }
        }
      }
    }

    this.drops = this.drops.filter(d => !d.collected);
  }

  public openChest(chestId: string): Equipment | null {
    const chest = this.chests.find(c => c.id === chestId);
    if (!chest || chest.opened || !chest.equipment) return null;

    chest.opened = true;
    
    this.drops.push({
      id: uuidv4(),
      type: 'EQUIPMENT',
      x: chest.x,
      y: chest.y - TILE_SIZE / 2,
      value: 0,
      equipment: chest.equipment,
      animPhase: 0,
      collected: false
    });

    return chest.equipment;
  }

  public getNearbyChest(): Chest | null {
    if (!this.player) return null;
    
    const px = this.player.entity.x;
    const py = this.player.entity.y;

    return this.chests.find(c => 
      !c.opened &&
      Math.abs(c.x - px) < TILE_SIZE * 1.5 &&
      Math.abs(c.y - py) < TILE_SIZE * 1.5
    ) || null;
  }

  public isNearPortal(portalX: number, portalY: number): boolean {
    if (!this.player) return false;
    
    const px = this.player.entity.x / TILE_SIZE;
    const py = this.player.entity.y / TILE_SIZE;
    
    return Math.abs(px - portalX) < 1.5 && Math.abs(py - portalY) < 1.5;
  }

  public nextFloor(newX: number, newY: number): void {
    if (!this.player) return;
    
    this.player.floor++;
    this.player.entity.x = newX * TILE_SIZE;
    this.player.entity.y = newY * TILE_SIZE;
    this.player.entity.hp = Math.min(this.player.entity.maxHp, this.player.entity.hp + 20);
    this.drops = [];
    this.chests = [];
    this.damageNumbers = [];
  }

  public getMonsters(): Entity[] {
    return this.monsters;
  }

  public getDrops(): Drop[] {
    return this.drops;
  }

  public getChests(): Chest[] {
    return this.chests;
  }

  public getDamageNumbers(): DamageNumber[] {
    return this.damageNumbers;
  }

  public cleanupDamageNumbers(now: number): void {
    this.damageNumbers = this.damageNumbers.filter(d => now - d.startTime < 1000);
  }

  public updateAnimations(now: number): void {
    if (this.player?.entity.isAttacking && now - this.player.entity.attackStartTime > ATTACK_DURATION) {
      this.player.entity.isAttacking = false;
    }

    for (const drop of this.drops) {
      drop.animPhase += 0.15;
    }
  }

  public handleClick(worldX: number, worldY: number, now: number): { damage: number; hit: boolean }[] {
    if (!this.player) return [];
    
    const px = this.player.entity.x + TILE_SIZE / 2;
    const py = this.player.entity.y + TILE_SIZE / 2;
    
    let targetDir: Direction = 'DOWN';
    const dx = worldX - px;
    const dy = worldY - py;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      targetDir = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      targetDir = dy > 0 ? 'DOWN' : 'UP';
    }
    
    this.player.entity.direction = targetDir;
    return this.playerAttack(now);
  }
}

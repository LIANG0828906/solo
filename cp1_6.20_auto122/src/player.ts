import { GameState, Enemy, Item, Position } from './gameState';

export class PlayerController {
  private gameState: GameState;
  private combatInProgress: boolean;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.combatInProgress = false;
  }

  public isCombatInProgress(): boolean {
    return this.combatInProgress;
  }

  public move(dx: number, dy: number): boolean {
    if (this.gameState.data.isGameOver || this.gameState.data.showInventory || this.combatInProgress) {
      return false;
    }

    const newX = this.gameState.data.player.position.x + dx;
    const newY = this.gameState.data.player.position.y + dy;

    if (newX < 0 || newX >= this.gameState.data.mapWidth ||
        newY < 0 || newY >= this.gameState.data.mapHeight) {
      return false;
    }

    if (this.gameState.data.map[newY][newX] === 'wall') {
      return false;
    }

    const enemy = this.findEnemyAt(newX, newY);
    if (enemy) {
      this.startCombat(enemy);
      return true;
    }

    this.gameState.data.player.position.x = newX;
    this.gameState.data.player.position.y = newY;

    this.checkChestPickup();

    return true;
  }

  private findEnemyAt(x: number, y: number): Enemy | undefined {
    return this.gameState.data.enemies.find(
      enemy => enemy.position.x === x && enemy.position.y === y
    );
  }

  private checkChestPickup(): void {
    const { x, y } = this.gameState.data.player.position;
    const chestIndex = this.gameState.data.chests.findIndex(
      chest => chest.position.x === x && chest.position.y === y
    );

    if (chestIndex !== -1) {
      const chest = this.gameState.data.chests[chestIndex];
      const item = chest.item;

      if (this.addToInventory(item)) {
        this.gameState.addCombatLog(
          `你打开了宝箱，获得了 ${this.getQualityText(item.quality)} ${item.name}！`,
          'loot'
        );
        this.gameState.data.chests.splice(chestIndex, 1);
      } else {
        this.gameState.addCombatLog(
          '背包已满，无法拾取物品！',
          'system'
        );
      }
    }
  }

  private getQualityText(quality: string): string {
    const qualityNames: Record<string, string> = {
      common: '普通',
      rare: '稀有',
      legendary: '传说'
    };
    return qualityNames[quality] || quality;
  }

  public addToInventory(item: Item): boolean {
    if (this.gameState.data.player.inventory.length >= this.gameState.data.player.inventoryCapacity) {
      return false;
    }
    this.gameState.data.player.inventory.push(item);
    return true;
  }

  private startCombat(enemy: Enemy): void {
    this.combatInProgress = true;
    this.gameState.addCombatLog(
      `遭遇了 ${enemy.name}！`,
      'system'
    );

    setTimeout(() => this.executeCombatRound(enemy), 200);
  }

  private executeCombatRound(enemy: Enemy): void {
    if (this.gameState.data.isGameOver) {
      this.combatInProgress = false;
      return;
    }

    const playerAttack = this.gameState.getTotalAttack();
    const playerDefense = this.gameState.getTotalDefense();

    const playerDamage = Math.max(1, playerAttack - enemy.defense);
    enemy.health -= playerDamage;
    this.gameState.addCombatLog(
      `你攻击 ${enemy.name} 造成 ${playerDamage} 点伤害`,
      'player'
    );

    if (enemy.health <= 0) {
      this.handleEnemyDefeat(enemy);
      this.combatInProgress = false;
      return;
    }

    setTimeout(() => {
      if (this.gameState.data.isGameOver) {
        this.combatInProgress = false;
        return;
      }

      const enemyDamage = Math.max(1, enemy.attack - playerDefense);
      this.gameState.data.player.health -= enemyDamage;
      this.gameState.addCombatLog(
        `${enemy.name} 攻击你造成 ${enemyDamage} 点伤害`,
        'enemy'
      );

      if (this.gameState.data.player.health <= 0) {
        this.gameState.data.player.health = 0;
        this.handlePlayerDefeat();
        this.combatInProgress = false;
        return;
      }

      setTimeout(() => this.executeCombatRound(enemy), 300);
    }, 300);
  }

  private handleEnemyDefeat(enemy: Enemy): void {
    const enemyIndex = this.gameState.data.enemies.findIndex(e => e.id === enemy.id);
    if (enemyIndex !== -1) {
      this.gameState.data.enemies.splice(enemyIndex, 1);
    }

    const goldReward = 1 + Math.floor(Math.random() * 5);
    this.gameState.data.player.gold += goldReward;
    this.gameState.data.player.exp += enemy.expReward;
    this.gameState.data.player.kills++;

    this.gameState.addCombatLog(
      `你击败了 ${enemy.name}！获得 ${enemy.expReward} 经验值和 ${goldReward} 金币`,
      'loot'
    );

    this.checkLevelUp();
  }

  private checkLevelUp(): void {
    const player = this.gameState.data.player;

    while (player.exp >= player.expToNextLevel && player.level < 5) {
      player.exp -= player.expToNextLevel;
      player.level++;
      player.expToNextLevel = 20 + (player.level - 1) * 15;
      player.maxHealth += 5;
      player.baseAttack += 2;
      player.health = Math.min(player.health + 5, player.maxHealth);

      this.gameState.addCombatLog(
        `恭喜！你升级到了 ${player.level} 级！生命上限+5，攻击力+2`,
        'levelup'
      );
    }
  }

  private handlePlayerDefeat(): void {
    this.gameState.data.isGameOver = true;
    this.gameState.data.score = this.gameState.calculateScore();
    this.gameState.addCombatLog(
      '你被击败了...',
      'system'
    );
  }

  public toggleInventory(): void {
    if (this.gameState.data.isGameOver) return;
    this.gameState.data.showInventory = !this.gameState.data.showInventory;
  }

  public equipItem(itemIndex: number): boolean {
    const inventory = this.gameState.data.player.inventory;
    if (itemIndex < 0 || itemIndex >= inventory.length) {
      return false;
    }

    const item = inventory[itemIndex];

    if (item.type === 'potion') {
      if (item.healthBonus) {
        const healAmount = Math.min(
          item.healthBonus,
          this.gameState.data.player.maxHealth - this.gameState.data.player.health
        );
        this.gameState.data.player.health += healAmount;
        this.gameState.addCombatLog(
          `使用了 ${item.name}，恢复了 ${healAmount} 点生命值`,
          'loot'
        );
        inventory.splice(itemIndex, 1);
        return true;
      }
      return false;
    }

    let slot: 'weapon' | 'armor' | 'accessory';
    if (item.type === 'weapon') {
      slot = 'weapon';
    } else if (item.type === 'armor') {
      slot = 'armor';
    } else if (item.type === 'accessory') {
      slot = 'accessory';
    } else {
      return false;
    }

    const currentEquipped = this.gameState.data.player.equipped[slot];

    this.gameState.data.player.equipped[slot] = item;
    inventory.splice(itemIndex, 1);

    if (currentEquipped) {
      inventory.push(currentEquipped);
    }

    this.gameState.addCombatLog(
      `装备了 ${this.getQualityText(item.quality)} ${item.name}`,
      'system'
    );

    return true;
  }

  public getEquippedItem(slot: 'weapon' | 'armor' | 'accessory'): Item | null {
    return this.gameState.data.player.equipped[slot];
  }

  public getInventory(): Item[] {
    return this.gameState.data.player.inventory;
  }

  public getPlayerPosition(): Position {
    return this.gameState.data.player.position;
  }
}

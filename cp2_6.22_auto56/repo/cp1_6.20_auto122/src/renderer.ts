import { GameState, Item } from './gameState';
import { LevelGenerator } from './levelGenerator';

export class Renderer {
  private gameState: GameState;
  private levelGenerator: LevelGenerator;
  private mapElement: HTMLElement;
  private highlightedTile: HTMLElement | null = null;
  private combatTile: HTMLElement | null = null;

  constructor(gameState: GameState, levelGenerator: LevelGenerator) {
    this.gameState = gameState;
    this.levelGenerator = levelGenerator;
    this.mapElement = document.getElementById('game-map') as HTMLElement;
  }

  public render(): void {
    this.renderMap();
    this.renderStatus();
    this.renderCombatLog();
    this.renderInventory();
    this.renderGameOver();
  }

  private renderMap(): void {
    const { map, player, enemies, chests, mapWidth, mapHeight } = this.gameState.data;

    if (this.mapElement.children.length === 0) {
      this.mapElement.style.gridTemplateColumns = `repeat(${mapWidth}, 28px)`;
      this.mapElement.style.gridTemplateRows = `repeat(${mapHeight}, 28px)`;

      for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
          const tile = document.createElement('div');
          tile.className = 'tile';
          tile.dataset.x = x.toString();
          tile.dataset.y = y.toString();
          this.mapElement.appendChild(tile);
        }
      }
    }

    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const tileIndex = y * mapWidth + x;
        const tile = this.mapElement.children[tileIndex] as HTMLElement;

        if (!tile) continue;

        const tileType = map[y][x];
        tile.className = 'tile';
        tile.classList.add(tileType === 'wall' ? 'tile-wall' : 'tile-floor');
        tile.textContent = '';

        const enemy = enemies.find(e => e.position.x === x && e.position.y === y);
        if (enemy) {
          const symbol = this.levelGenerator.getEnemySymbol(enemy.type);
          tile.textContent = symbol;
          tile.classList.add(`enemy-${enemy.type}`);
          continue;
        }

        const chest = chests.find(c => c.position.x === x && c.position.y === y);
        if (chest) {
          tile.textContent = 'B';
          tile.classList.add('chest');
          continue;
        }

        if (player.position.x === x && player.position.y === y) {
          tile.textContent = '@';
          tile.classList.add('player');
        }
      }
    }
  }

  public highlightPlayerPosition(): void {
    if (this.highlightedTile) {
      this.highlightedTile.classList.remove('tile-highlight');
    }

    const { x, y } = this.gameState.data.player.position;
    const tileIndex = y * this.gameState.data.mapWidth + x;
    const tile = this.mapElement.children[tileIndex] as HTMLElement;

    if (tile) {
      tile.classList.add('tile-highlight');
      this.highlightedTile = tile;

      setTimeout(() => {
        if (this.highlightedTile === tile) {
          tile.classList.remove('tile-highlight');
          this.highlightedTile = null;
        }
      }, 200);
    }
  }

  public flashCombatTile(x: number, y: number): void {
    const tileIndex = y * this.gameState.data.mapWidth + x;
    const tile = this.mapElement.children[tileIndex] as HTMLElement;

    if (tile) {
      tile.classList.add('tile-combat');
      this.combatTile = tile;

      setTimeout(() => {
        if (this.combatTile === tile) {
          tile.classList.remove('tile-combat');
          this.combatTile = null;
        }
      }, 300);
    }
  }

  private renderStatus(): void {
    const player = this.gameState.data.player;
    const totalAttack = this.gameState.getTotalAttack();
    const totalDefense = this.gameState.getTotalDefense();

    const levelValue = document.getElementById('level-value');
    if (levelValue) levelValue.textContent = player.level.toString();

    const healthText = document.getElementById('health-text');
    if (healthText) healthText.textContent = `${player.health}/${player.maxHealth}`;

    const healthFill = document.getElementById('health-fill');
    if (healthFill) {
      const healthPercent = (player.health / player.maxHealth) * 100;
      healthFill.style.width = `${healthPercent}%`;
    }

    const expText = document.getElementById('exp-text');
    if (expText) expText.textContent = `${player.exp}/${player.expToNextLevel}`;

    const expFill = document.getElementById('exp-fill');
    if (expFill) {
      const expPercent = (player.exp / player.expToNextLevel) * 100;
      expFill.style.width = `${expPercent}%`;
    }

    const attackValue = document.getElementById('attack-value');
    if (attackValue) attackValue.textContent = totalAttack.toString();

    const defenseValue = document.getElementById('defense-value');
    if (defenseValue) defenseValue.textContent = totalDefense.toString();

    const goldValue = document.getElementById('gold-value');
    if (goldValue) goldValue.textContent = player.gold.toString();

    const killsValue = document.getElementById('kills-value');
    if (killsValue) killsValue.textContent = player.kills.toString();

    this.renderEquippedSlots();
  }

  private renderEquippedSlots(): void {
    const { weapon, armor, accessory } = this.gameState.data.player.equipped;

    const weaponSlot = document.getElementById('equipped-weapon');
    if (weaponSlot) {
      weaponSlot.textContent = weapon ? this.formatItemName(weapon) : '-';
    }

    const armorSlot = document.getElementById('equipped-armor');
    if (armorSlot) {
      armorSlot.textContent = armor ? this.formatItemName(armor) : '-';
    }

    const accessorySlot = document.getElementById('equipped-accessory');
    if (accessorySlot) {
      accessorySlot.textContent = accessory ? this.formatItemName(accessory) : '-';
    }
  }

  private formatItemName(item: Item): string {
    const qualityShort: Record<string, string> = {
      common: '普',
      rare: '稀',
      legendary: '传'
    };
    return `[${qualityShort[item.quality] || ''}]${item.name}`;
  }

  private renderCombatLog(): void {
    const logElement = document.getElementById('combat-log');
    if (!logElement) return;

    logElement.innerHTML = this.gameState.data.combatLog.join('');
    logElement.scrollTop = logElement.scrollHeight;
  }

  private renderInventory(): void {
    const overlay = document.getElementById('inventory-overlay');
    if (!overlay) return;

    if (this.gameState.data.showInventory) {
      overlay.classList.remove('hidden');
      this.renderInventoryGrid();
    } else {
      overlay.classList.add('hidden');
    }
  }

  private renderInventoryGrid(): void {
    const grid = document.getElementById('inventory-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const inventory = this.gameState.data.player.inventory;
    const capacity = this.gameState.data.player.inventoryCapacity;

    for (let i = 0; i < capacity; i++) {
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';

      if (i < inventory.length) {
        const item = inventory[i];
        slot.classList.add(`quality-${item.quality}`);

        const itemName = document.createElement('div');
        itemName.className = `item-name ${item.quality}`;
        itemName.textContent = item.name;
        slot.appendChild(itemName);

        const itemType = document.createElement('div');
        itemType.className = 'item-type';
        itemType.textContent = this.getItemTypeName(item.type);
        slot.appendChild(itemType);

        const itemStats = document.createElement('div');
        itemStats.className = 'item-stats';
        let statsText = '';
        if (item.attackBonus > 0) statsText += `攻+${item.attackBonus} `;
        if (item.defenseBonus > 0) statsText += `防+${item.defenseBonus} `;
        if (item.healthBonus) statsText += `血+${item.healthBonus}`;
        itemStats.textContent = statsText || '';
        slot.appendChild(itemStats);

        const itemAction = document.createElement('div');
        itemAction.className = 'item-action';
        itemAction.textContent = item.type === 'potion' ? '点击使用' : '点击装备';
        slot.appendChild(itemAction);

        slot.addEventListener('click', () => {
          const event = new CustomEvent('equip-item', { detail: { index: i } });
          document.dispatchEvent(event);
        });
      } else {
        slot.classList.add('empty');
        slot.textContent = '空';
      }

      grid.appendChild(slot);
    }
  }

  private getItemTypeName(type: string): string {
    const names: Record<string, string> = {
      weapon: '武器',
      armor: '防具',
      accessory: '饰品',
      potion: '药水'
    };
    return names[type] || type;
  }

  private renderGameOver(): void {
    const overlay = document.getElementById('gameover-overlay');
    if (!overlay) return;

    if (this.gameState.data.isGameOver) {
      overlay.classList.remove('hidden');

      const player = this.gameState.data.player;
      const score = this.gameState.calculateScore();

      const finalKills = document.getElementById('final-kills');
      if (finalKills) finalKills.textContent = player.kills.toString();

      const finalGold = document.getElementById('final-gold');
      if (finalGold) finalGold.textContent = player.gold.toString();

      const finalLevel = document.getElementById('final-level');
      if (finalLevel) finalLevel.textContent = player.level.toString();

      const finalScore = document.getElementById('final-score');
      if (finalScore) finalScore.textContent = score.toString();
    } else {
      overlay.classList.add('hidden');
    }
  }
}

import { Player, heal, addGold } from './player';

export type ItemType = 'potion' | 'gold' | 'chest';

export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  value: number;
  collected: boolean;
  animOffset: number;
  collectAnim: number;
  rotation: number;
}

export type ItemEventType = 'item_collected' | 'potion_used';

export interface ItemEvent {
  type: ItemEventType;
  item: Item;
}

export type ItemEventCallback = (event: ItemEvent) => void;

export interface ItemManager {
  items: Item[];
  listeners: ItemEventCallback[];
  addListener: (fn: ItemEventCallback) => void;
  removeListener: (fn: ItemEventCallback) => void;
  emitEvent: (event: ItemEvent) => void;
}

export function createItem(
  type: ItemType,
  gridX: number,
  gridY: number,
  tileSize: number,
  value: number
): Item {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    x: gridX * tileSize,
    y: gridY * tileSize,
    gridX,
    gridY,
    value,
    collected: false,
    animOffset: 0,
    collectAnim: 0,
    rotation: 0
  };
}

export function createChest(
  gridX: number,
  gridY: number,
  tileSize: number
): Item {
  return createItem('chest', gridX, gridY, tileSize, 0);
}

export function openChest(chest: Item, tileSize: number): Item[] {
  const items: Item[] = [];
  const hasPotion = Math.random() < 0.5;

  if (hasPotion) {
    items.push(createItem('potion', chest.gridX, chest.gridY, tileSize, 2));
    const goldAmount = Math.floor(Math.random() * 11) + 5;
    items.push(createItem('gold', chest.gridX, chest.gridY, tileSize, goldAmount));
  } else {
    const goldAmount = Math.floor(Math.random() * 16) + 10;
    items.push(createItem('gold', chest.gridX, chest.gridY, tileSize, goldAmount));
  }

  return items;
}

export function createMonsterDrop(
  type: 'potion' | 'gold',
  gridX: number,
  gridY: number,
  tileSize: number
): Item {
  if (type === 'potion') {
    return createItem('potion', gridX, gridY, tileSize, 2);
  } else {
    const goldAmount = Math.floor(Math.random() * 6) + 3;
    return createItem('gold', gridX, gridY, tileSize, goldAmount);
  }
}

export function updateItem(item: Item, deltaTime: number): void {
  if (!item.collected) {
    item.animOffset = Math.sin(Date.now() * 0.003) * 3;
  } else {
    item.collectAnim = Math.min(1, item.collectAnim + deltaTime * 2);
    item.rotation += deltaTime * 3;
  }
}

export function collectItem(
  item: Item,
  itemManager: ItemManager,
  player: Player
): void {
  if (item.collected) return;

  item.collected = true;

  switch (item.type) {
    case 'potion':
      heal(player, item.value);
      itemManager.emitEvent({ type: 'potion_used', item });
      break;
    case 'gold':
      addGold(player, item.value);
      break;
  }

  itemManager.emitEvent({ type: 'item_collected', item });
}

export function createItemManager(): ItemManager {
  const items: Item[] = [];
  const listeners: ItemEventCallback[] = [];

  function addListener(fn: ItemEventCallback): void {
    listeners.push(fn);
  }

  function removeListener(fn: ItemEventCallback): void {
    const index = listeners.indexOf(fn);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  function emitEvent(event: ItemEvent): void {
    for (const listener of listeners) {
      listener(event);
    }
  }

  return {
    items,
    listeners,
    addListener,
    removeListener,
    emitEvent
  };
}

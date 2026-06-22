export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface ChestConfig {
  rarity: Rarity;
  name: string;
  keyCost: number;
  color: string;
  itemCount: number;
}

export interface DropRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

export interface ItemFragment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  setName: string;
  quantity: number;
  requiredForCraft: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  setName: string;
}

export interface KeyInventory {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
}

export interface ChestOpenResult {
  items: ItemFragment[];
  seed: number;
  highestRarity: Rarity;
}

export type InventoryFilter = 'all' | 'weapon' | 'armor' | 'accessory';

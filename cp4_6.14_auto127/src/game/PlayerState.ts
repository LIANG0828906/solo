import { useGameStore, Inventory, Equipment } from '../store/gameStore';

export class PlayerState {
  getHealth(): number {
    return useGameStore.getState().health;
  }

  getMaxHealth(): number {
    return useGameStore.getState().maxHealth;
  }

  getEnergy(): number {
    return useGameStore.getState().energy;
  }

  getMaxEnergy(): number {
    return useGameStore.getState().maxEnergy;
  }

  getInventory(): Inventory {
    return useGameStore.getState().inventory;
  }

  getEquipment(): Equipment {
    return useGameStore.getState().equipment;
  }

  getPlayerPosition(): { x: number; y: number } {
    return { x: useGameStore.getState().playerX, y: useGameStore.getState().playerY };
  }

  getPlayerPixelPosition(): { x: number; y: number } {
    return { x: useGameStore.getState().playerPixelX, y: useGameStore.getState().playerPixelY };
  }

  setHealth(health: number): void {
    useGameStore.getState().setHealth(health);
  }

  takeDamage(amount: number): void {
    const state = useGameStore.getState();
    let damage = amount;
    if (state.equipment.diamondHelmet) {
      damage = damage * 0.5;
    }
    const newHealth = state.health - damage;
    useGameStore.getState().setHealth(newHealth);
    useGameStore.getState().setPlayerHurtTimer(0.2);

    if (newHealth <= 0) {
      useGameStore.getState().setGameOver(true);
    }
  }

  setEnergy(energy: number): void {
    useGameStore.getState().setEnergy(energy);
  }

  consumeEnergy(amount: number): boolean {
    const state = useGameStore.getState();
    if (state.energy >= amount) {
      useGameStore.getState().setEnergy(state.energy - amount);
      return true;
    }
    return false;
  }

  regenerateEnergy(amount: number): void {
    const state = useGameStore.getState();
    useGameStore.getState().setEnergy(Math.min(state.maxEnergy, state.energy + amount));
  }

  addResource(type: 'iron' | 'gold' | 'diamond', amount: number): void {
    useGameStore.getState().addToInventory(type, amount);
  }

  setPosition(x: number, y: number): void {
    useGameStore.getState().setPlayerPosition(x, y);
  }

  setPixelPosition(x: number, y: number): void {
    useGameStore.getState().setPlayerPixelPosition(x, y);
  }

  getDigSpeedMultiplier(): number {
    const state = useGameStore.getState();
    return state.equipment.ironPickaxe ? 1.15 : 1.0;
  }

  hasGoldPickaxe(): boolean {
    return useGameStore.getState().equipment.goldPickaxe;
  }

  upgradeEquipment(type: keyof Equipment): boolean {
    return useGameStore.getState().upgradeEquipment(type);
  }
}

export const playerState = new PlayerState();

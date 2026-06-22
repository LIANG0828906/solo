import { Crop, CropType, CropStage, Creature, CreatureType, CreatureAction, Resources, GameState, DefenseTower, CROP_CONFIG, CREATURE_CONFIG } from '../types';

export type UIUpdateCallback = () => void;

export class FarmManager {
  private state: GameState;
  private onUIUpdate: UIUpdateCallback;
  private readonly GRID_SIZE = 6;
  private readonly STAGE_DURATION_MIN = 15000;
  private readonly STAGE_DURATION_MAX = 30000;

  constructor(state: GameState, onUIUpdate: UIUpdateCallback) {
    this.state = state;
    this.onUIUpdate = onUIUpdate;
  }

  getCropAt(gridX: number, gridY: number): Crop | undefined {
    return this.state.crops.find(c => c.gridX === gridX && c.gridY === gridY);
  }

  canPlant(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= this.GRID_SIZE || gridY < 0 || gridY >= this.GRID_SIZE) return false;
    if (this.state.resources.seeds <= 0) return false;
    return !this.getCropAt(gridX, gridY);
  }

  plantCrop(gridX: number, gridY: number, type: CropType): boolean {
    if (!this.canPlant(gridX, gridY)) return false;
    const crop: Crop = {
      id: `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      stage: 'seed',
      stageEndTime: Date.now() + this.randomStageDuration(),
      gridX,
      gridY,
      growthMultiplier: 1,
    };
    this.state.crops.push(crop);
    this.state.resources.seeds--;
    this.notifyUI();
    return true;
  }

  harvestCrop(cropId: string): boolean {
    const index = this.state.crops.findIndex(c => c.id === cropId);
    if (index === -1) return false;
    const crop = this.state.crops[index];
    if (crop.stage !== 'mature') return false;
    const config = CROP_CONFIG[crop.type];
    (this.state.resources as any)[crop.type] += config.harvestAmount;
    this.state.resources.coins += config.harvestAmount * config.sellPrice;
    this.state.crops.splice(index, 1);
    this.notifyUI();
    return true;
  }

  addCreature(type: CreatureType, penIndex: number): boolean {
    if (penIndex < 0 || penIndex >= 3) return false;
    const existing = this.state.creatures.find(c => c.penIndex === penIndex);
    if (existing) return false;
    const creature: Creature = {
      id: `creature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      penIndex,
      lastProduceTime: Date.now(),
      currentAction: 'idle',
      actionEndTime: 0,
      nextActionTime: Date.now() + 10000,
      produceSpeedMultiplier: 1,
    };
    this.state.creatures.push(creature);
    this.notifyUI();
    return true;
  }

  upgradeFence(): boolean {
    const level = this.state.fenceUpgradeLevel;
    this.state.fenceUpgradeLevel++;
    this.state.creatures.forEach(c => {
      c.produceSpeedMultiplier = 1 + (this.state.fenceUpgradeLevel * 0.2);
    });
    this.notifyUI();
    return true;
  }

  addTower(x: number, y: number): boolean {
    const tower = {
      id: `tower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      x,
      y,
      lastShootTime: 0,
    };
    this.state.towers.push(tower);
    this.notifyUI();
    return true;
  }

  updateCrops(): void {
    const now = Date.now();
    const isAcidRain = now < this.state.acidRainEndTime;
    const growthMult = isAcidRain ? 0.5 : 1;
    this.state.crops.forEach(crop => {
      if (crop.stage === 'mature') return;
      if (now >= crop.stageEndTime) {
        this.advanceCropStage(crop);
      }
    });
  }

  private advanceCropStage(crop: Crop): void {
    const stages: CropStage[] = ['seed', 'sprout', 'growing', 'mature'];
    const currentIndex = stages.indexOf(crop.stage);
    if (currentIndex < stages.length - 1) {
      crop.stage = stages[currentIndex + 1];
      const now = Date.now();
      const isAcidRain = now < this.state.acidRainEndTime;
      const baseDuration = this.randomStageDuration();
      const duration = isAcidRain ? baseDuration * 2 : baseDuration;
      crop.stageEndTime = now + duration;
    }
    this.notifyUI();
  }

  updateCreatures(): void {
    const now = Date.now();
    this.state.creatures.forEach(creature => {
      const produceInterval = CREATURE_CONFIG[creature.type].produceInterval / creature.produceSpeedMultiplier;
      if (now - creature.lastProduceTime >= produceInterval) {
        const config = CREATURE_CONFIG[creature.type];
        (this.state.resources as any)[config.produce] += config.produceAmount;
        creature.lastProduceTime = now;
        this.notifyUI();
      }
      if (creature.currentAction !== 'idle') {
        if (now >= creature.actionEndTime) {
          creature.currentAction = 'idle';
          creature.nextActionTime = now + 10000;
          this.notifyUI();
        }
      } else {
        if (now >= creature.nextActionTime) {
          this.startCreatureAction(creature);
        }
      }
    });
  }

  private startCreatureAction(creature: Creature): void {
    const actions: CreatureAction[] = [];
    switch (creature.type) {
      case 'flameChicken':
        actions.push('flapJump');
        break;
      case 'frostSheep':
        actions.push('graze');
        break;
      case 'thunderBird':
        actions.push('soarCry');
        break;
    }
    if (actions.length > 0) {
      creature.currentAction = actions[Math.floor(Math.random() * actions.length)];
    }
    creature.actionEndTime = Date.now() + 2000;
    this.notifyUI();
  }

  applyHarvestWind(): void {
    this.state.crops.forEach(crop => {
      const stages: CropStage[] = ['seed', 'sprout', 'growing', 'mature'];
      const currentIndex = stages.indexOf(crop.stage);
      if (currentIndex < stages.length - 1) {
        crop.stage = stages[currentIndex + 1];
        crop.stageEndTime = Date.now() + this.randomStageDuration();
      }
    });
    this.notifyUI();
  }

  private randomStageDuration(): number {
    return this.STAGE_DURATION_MIN + Math.random() * (this.STAGE_DURATION_MAX - this.STAGE_DURATION_MIN);
  }

  getGridSize(): number {
    return this.GRID_SIZE;
  }

  getResources(): Resources {
    return this.state.resources;
  }

  getCrops(): Crop[] {
    return this.state.crops;
  }

  getCreatures(): Creature[] {
    return this.state.creatures;
  }

  getTowers(): DefenseTower[] {
    return this.state.towers;
  }

  getState(): GameState {
    return this.state;
  }

  private notifyUI(): void {
    if (this.onUIUpdate) this.onUIUpdate();
  }
}

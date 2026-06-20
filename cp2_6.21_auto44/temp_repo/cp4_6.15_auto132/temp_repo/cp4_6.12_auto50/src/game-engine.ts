import {
  eventBus,
  WasteType,
  TruckArrivedEvent,
  WasteItemEvent,
  SortResultEvent,
  ScoreUpdateEvent,
  StorageUpdateEvent,
  ResourcesUpdateEvent,
  ProcessorActiveEvent,
  UpgradeEvent,
  UpgradeAvailableEvent,
  GameWinEvent,
} from './event-bus';

const WASTE_TYPES: WasteType[] = ['plastic', 'paper', 'metal', 'electronic'];
const UPGRADE_COSTS = [100, 250, 500];
const WIN_SCORE = 500;
const TRUCK_INTERVAL = 20000;
const PROCESS_INTERVAL = 30000;
const SORT_TIMEOUT = 2000;

interface WasteItem {
  id: string;
  type: WasteType;
  beltIndex: number;
  spawnedAt: number;
  sorted: boolean;
}

interface Truck {
  id: string;
  type: WasteType;
  items: number;
  arrivedAt: number;
}

export class GameEngine {
  private score = 0;
  private totalItems = 0;
  private startTime = 0;
  private elapsedTime = 0;
  private running = false;

  private beltSpeed = 1;
  private processorEfficiency = 1;
  private storageCapacity = 50;
  private beltLevel = 0;
  private processorLevel = 0;
  private storageLevel = 0;

  private storage: Record<WasteType, number> = {
    plastic: 0,
    paper: 0,
    metal: 0,
    electronic: 0,
  };

  private resources = {
    plasticPellets: 0,
    metalIngots: 0,
    paperPulp: 0,
  };

  private pendingItems: WasteItem[] = [];
  private truckQueue: Truck[] = [];
  private beltOccupancy = [0, 0, 0, 0];

  private truckTimer: number | null = null;
  private processTimer: number | null = null;
  private gameLoopTimer: number | null = null;

  private genId() {
    return Math.random().toString(36).slice(2, 10);
  }

  private randomWasteType(): WasteType {
    return WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
  }

  private getMaxCapacity() {
    return Math.round(this.storageCapacity * (1 + 0.3 * this.storageLevel));
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.startTime = performance.now();
    this.elapsedTime = 0;
    this.score = 0;
    this.totalItems = 0;
    this.beltLevel = 0;
    this.processorLevel = 0;
    this.storageLevel = 0;
    this.beltSpeed = 1;
    this.processorEfficiency = 1;
    this.storageCapacity = 50;
    this.storage = { plastic: 0, paper: 0, metal: 0, electronic: 0 };
    this.resources = { plasticPellets: 0, metalIngots: 0, paperPulp: 0 };
    this.pendingItems = [];
    this.truckQueue = [];
    this.beltOccupancy = [0, 0, 0, 0];

    this.emitScore();
    this.emitAllStorage();
    this.emitResources();
    this.emitUpgradeAvailable();

    this.spawnTruck();
    this.truckTimer = window.setInterval(() => this.spawnTruck(), TRUCK_INTERVAL);
    this.processTimer = window.setInterval(() => this.runProcessing(), PROCESS_INTERVAL);
    this.gameLoopTimer = window.setInterval(() => this.tick(), 50);

    eventBus.on('player:sort', (data) => this.handleSort(data));
    eventBus.on('item:timeout', (data) => this.handleTimeout(data));
    eventBus.on('upgrade:request', (data) => this.handleUpgrade(data));
    eventBus.on('game:reset', () => this.reset());
  }

  stop() {
    this.running = false;
    if (this.truckTimer) clearInterval(this.truckTimer);
    if (this.processTimer) clearInterval(this.processTimer);
    if (this.gameLoopTimer) clearInterval(this.gameLoopTimer);
    eventBus.off('player:sort', () => {});
    eventBus.off('item:timeout', () => {});
    eventBus.off('upgrade:request', () => {});
    eventBus.off('game:reset', () => {});
  }

  reset() {
    this.stop();
    this.start();
  }

  private tick() {
    if (!this.running) return;
    this.elapsedTime = (performance.now() - this.startTime) / 1000;
    this.emitScore();
    this.processTruckQueue();
    this.checkWin();
  }

  private spawnTruck() {
    const type = this.randomWasteType();
    const items = 3 + Math.floor(Math.random() * 4);
    const truck: Truck = {
      id: this.genId(),
      type,
      items,
      arrivedAt: performance.now(),
    };
    this.truckQueue.push(truck);
    eventBus.emit('truck:arrived', {
      id: truck.id,
      type: truck.type,
      items: truck.items,
      timestamp: truck.arrivedAt,
    } as TruckArrivedEvent);
  }

  private processTruckQueue() {
    const now = performance.now();
    const availableBelt = this.beltOccupancy.findIndex((count) => count < 2);

    if (availableBelt === -1) return;

    this.truckQueue = this.truckQueue.filter((truck) => {
      if (now - truck.arrivedAt < 3000) return true;
      if (truck.items <= 0) return false;

      const beltIdx = this.beltOccupancy.findIndex((count) => count < 2);
      if (beltIdx === -1) return true;

      this.spawnItemOnBelt(truck.type, beltIdx);
      truck.items--;
      return truck.items > 0;
    });
  }

  private spawnItemOnBelt(type: WasteType, beltIndex: number) {
    const item: WasteItem = {
      id: this.genId(),
      type,
      beltIndex,
      spawnedAt: performance.now(),
      sorted: false,
    };
    this.pendingItems.push(item);
    this.beltOccupancy[beltIndex]++;
    this.totalItems++;
    eventBus.emit('item:spawn', {
      id: item.id,
      type: item.type,
      beltIndex: item.beltIndex,
      timestamp: item.spawnedAt,
    } as WasteItemEvent);
  }

  private handleSort(data: { itemId: string; type: WasteType; buttonX: number; buttonY: number }) {
    const item = this.pendingItems.find((i) => i.id === data.itemId && !i.sorted);
    if (!item) return;

    const elapsed = performance.now() - item.spawnedAt;
    const travelMs = (500 / (80 * this.beltSpeed)) * 1000;
    if (elapsed < travelMs) return;
    if (elapsed > travelMs + SORT_TIMEOUT) return;

    item.sorted = true;
    this.beltOccupancy[item.beltIndex]--;

    const correct = data.type === item.type;
    if (correct) {
      this.score += 10;
      if (this.storage[item.type] < this.getMaxCapacity()) {
        this.storage[item.type]++;
      }
      eventBus.emit('item:sort-result', {
        id: item.id,
        correct: true,
        type: item.type,
        score: 10,
        buttonX: data.buttonX,
        buttonY: data.buttonY,
      } as SortResultEvent);
      this.emitStorage(item.type);
    } else {
      this.score -= 5;
      eventBus.emit('item:sort-result', {
        id: item.id,
        correct: false,
        type: item.type,
        score: -5,
        buttonX: data.buttonX,
        buttonY: data.buttonY,
      } as SortResultEvent);
    }

    this.pendingItems = this.pendingItems.filter((i) => i.id !== item.id);
    this.emitScore();
    this.emitUpgradeAvailable();
  }

  private handleTimeout(data: { itemId: string }) {
    const item = this.pendingItems.find((i) => i.id === data.itemId && !i.sorted);
    if (!item) return;

    item.sorted = true;
    this.beltOccupancy[item.beltIndex]--;
    this.score -= 5;
    eventBus.emit('item:sort-result', {
      id: item.id,
      correct: false,
      type: item.type,
      score: -5,
    } as SortResultEvent);
    this.pendingItems = this.pendingItems.filter((i) => i.id !== item.id);
    this.emitScore();
    this.emitUpgradeAvailable();
  }

  private runProcessing() {
    const maxCap = this.getMaxCapacity();
    let anyActive = false;

    if (this.storage.plastic >= 3) {
      const consume = Math.min(this.storage.plastic, 6);
      const output = Math.floor((consume / 3) * this.processorEfficiency);
      this.storage.plastic -= consume;
      this.resources.plasticPellets += output;
      anyActive = true;
      eventBus.emit('processor:active', { type: 'shredder', active: true });
      setTimeout(() => eventBus.emit('processor:active', { type: 'shredder', active: false }), 3000);
      this.emitStorage('plastic');
    }

    if (this.storage.metal >= 3) {
      const consume = Math.min(this.storage.metal, 6);
      const output = Math.floor((consume / 3) * this.processorEfficiency);
      this.storage.metal -= consume;
      this.resources.metalIngots += output;
      anyActive = true;
      eventBus.emit('processor:active', { type: 'furnace', active: true });
      setTimeout(() => eventBus.emit('processor:active', { type: 'furnace', active: false }), 3000);
      this.emitStorage('metal');
    }

    if (this.storage.paper >= 3) {
      const consume = Math.min(this.storage.paper, 6);
      const output = Math.floor((consume / 3) * this.processorEfficiency);
      this.storage.paper -= consume;
      this.resources.paperPulp += output;
      anyActive = true;
      eventBus.emit('processor:active', { type: 'pulper', active: true });
      setTimeout(() => eventBus.emit('processor:active', { type: 'pulper', active: false }), 3000);
      this.emitStorage('paper');
    }

    this.emitResources();
  }

  private handleUpgrade(data: { equipment: 'belt' | 'processor' | 'storage' }) {
    let level = 0;
    if (data.equipment === 'belt') level = this.beltLevel;
    else if (data.equipment === 'processor') level = this.processorLevel;
    else level = this.storageLevel;

    if (level >= 3) return;
    const cost = UPGRADE_COSTS[level];
    if (this.score < cost) return;

    this.score -= cost;

    if (data.equipment === 'belt') {
      this.beltLevel++;
      this.beltSpeed = 1 + 0.2 * this.beltLevel;
    } else if (data.equipment === 'processor') {
      this.processorLevel++;
      this.processorEfficiency = 1 + 0.15 * this.processorLevel;
    } else {
      this.storageLevel++;
      this.emitAllStorage();
    }

    eventBus.emit('upgrade:done', {
      equipment: data.equipment,
      level,
    } as UpgradeEvent);

    this.emitScore();
    this.emitUpgradeAvailable();
  }

  private emitScore() {
    eventBus.emit('score:update', {
      score: this.score,
      totalItems: this.totalItems,
      elapsedTime: this.elapsedTime,
    } as ScoreUpdateEvent);
  }

  private emitStorage(type: WasteType) {
    const maxCap = this.getMaxCapacity();
    eventBus.emit('storage:update', {
      plastic: this.storage.plastic,
      paper: this.storage.paper,
      metal: this.storage.metal,
      electronic: this.storage.electronic,
      maxCapacity: maxCap,
      type,
      isFull: this.storage[type] >= maxCap,
    } as StorageUpdateEvent);
  }

  private emitAllStorage() {
    (['plastic', 'paper', 'metal', 'electronic'] as WasteType[]).forEach((t) => this.emitStorage(t));
  }

  private emitResources() {
    eventBus.emit('resources:update', { ...this.resources } as ResourcesUpdateEvent);
  }

  private emitUpgradeAvailable() {
    const nextBeltCost = this.beltLevel < 3 ? UPGRADE_COSTS[this.beltLevel] : Infinity;
    const nextProcCost = this.processorLevel < 3 ? UPGRADE_COSTS[this.processorLevel] : Infinity;
    const nextStorageCost = this.storageLevel < 3 ? UPGRADE_COSTS[this.storageLevel] : Infinity;

    eventBus.emit('upgrade:available', {
      belt: this.beltLevel < 3 && this.score >= nextBeltCost,
      processor: this.processorLevel < 3 && this.score >= nextProcCost,
      storage: this.storageLevel < 3 && this.score >= nextStorageCost,
      beltLevel: this.beltLevel,
      processorLevel: this.processorLevel,
      storageLevel: this.storageLevel,
      nextCost: { belt: nextBeltCost, processor: nextProcCost, storage: nextStorageCost },
      score: this.score,
    } as UpgradeAvailableEvent);
  }

  private checkWin() {
    if (this.score >= WIN_SCORE) {
      eventBus.emit('game:win', {
        elapsedTime: this.elapsedTime,
        totalItems: this.totalItems,
      } as GameWinEvent);
      this.stop();
    }
  }

  getBeltSpeed() {
    return this.beltSpeed;
  }

  getStorageCapacity() {
    return this.getMaxCapacity();
  }
}

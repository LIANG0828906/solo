import type {
  Planet,
  ShipState,
  Commodity,
  TransportMission,
  NewsEvent,
  ShipUpgrade,
  GameStateData
} from './types';

const PLANET_NAMES = [
  '新伊甸', '泰坦星', '阿尔法站', '贝塔矿场', '伽马港',
  '德尔塔殖民地', '艾普西隆站', '泽塔工业', '伊塔绿洲', '西塔前线'
];

const COMMODITIES_DATA = [
  { id: 'ore', name: '矿石', basePrice: 50, icon: '⛏️' },
  { id: 'fuel', name: '燃料', basePrice: 80, icon: '⛽' },
  { id: 'food', name: '食物', basePrice: 30, icon: '🍎' },
  { id: 'tech', name: '科技组件', basePrice: 200, icon: '🔧' },
  { id: 'medicine', name: '医疗品', basePrice: 150, icon: '💊' }
];

const UPGRADES_DATA: Omit<ShipUpgrade, 'purchased'>[] = [
  { id: 'cargo1', name: '扩展货仓I', description: '货仓容量+50%', type: 'cargo', multiplier: 1.5, cost: 1000, icon: '📦' },
  { id: 'engine1', name: '离子引擎I', description: '引擎加速20%', type: 'engine', multiplier: 1.2, cost: 1500, icon: '🚀' },
  { id: 'shield1', name: '能量护盾I', description: '护盾防御+30%', type: 'shield', multiplier: 1.3, cost: 2000, icon: '🛡️' },
  { id: 'cargo2', name: '扩展货仓II', description: '货仓容量再+50%', type: 'cargo', multiplier: 1.5, cost: 2500, icon: '📦' },
  { id: 'engine2', name: '曲速引擎I', description: '引擎再加速20%', type: 'engine', multiplier: 1.2, cost: 3500, icon: '🚀' }
];

const NEWS_TEMPLATES = [
  { title: '海盗袭击', description: '海盗袭击导致{commodity}短缺', priceModifier: 1.5 },
  { title: '丰收季节', description: '{commodity}迎来大丰收', priceModifier: 0.7 },
  { title: '技术突破', description: '新技术降低{commodity}生产成本', priceModifier: 0.6 },
  { title: '战争需求', description: '军方大量采购{commodity}', priceModifier: 1.8 },
  { title: '贸易封锁', description: '贸易封锁影响{commodity}供应', priceModifier: 1.6 }
];

class GameState {
  private data: GameStateData;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.initializeState();
  }

  private initializeState(): GameStateData {
    const planets = this.generatePlanets();
    const firstPlanetId = planets.keys().next().value!;
    const firstPlanet = planets.get(firstPlanetId)!;

    return {
      credits: 1000,
      ship: {
        position: { ...firstPlanet.position },
        currentPlanetId: firstPlanetId,
        targetPlanetId: null,
        isFlying: false,
        fuel: 100,
        maxFuel: 100,
        cargoCapacity: 100,
        baseCargoCapacity: 100,
        engineSpeed: 1,
        baseEngineSpeed: 1,
        shieldLevel: 1,
        baseShieldLevel: 1,
        cargo: []
      },
      planets,
      missions: [],
      newsEvents: [],
      upgrades: UPGRADES_DATA.map(u => ({ ...u, purchased: false })),
      eventQueue: [],
      selectedPlanetId: null,
      gameTime: 0
    };
  }

  private generatePlanets(): Map<string, Planet> {
    const planets = new Map<string, Planet>();
    const planetCount = 8 + Math.floor(Math.random() * 3);

    for (let i = 0; i < planetCount; i++) {
      const id = `planet_${i}`;
      const angle = (i / planetCount) * Math.PI * 2;
      const radius = 15 + Math.random() * 10;
      const height = (Math.random() - 0.5) * 10;

      const isStation = i === 0 || Math.random() < 0.2;

      const commodities = new Map<string, Commodity>();
      const numCommodities = 3 + Math.floor(Math.random() * 3);
      const shuffledCommodities = [...COMMODITIES_DATA].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < numCommodities; j++) {
        const commData = shuffledCommodities[j];
        const priceVariation = 0.7 + Math.random() * 0.6;
        const basePrice = Math.round(commData.basePrice * priceVariation);
        
        commodities.set(commData.id, {
          id: commData.id,
          name: commData.name,
          basePrice,
          currentPrice: basePrice,
          targetPrice: basePrice,
          priceVelocity: 0,
          supply: 50 + Math.floor(Math.random() * 100),
          icon: commData.icon
        });
      }

      planets.set(id, {
        id,
        name: PLANET_NAMES[i % PLANET_NAMES.length],
        position: {
          x: Math.cos(angle) * radius + (Math.random() - 0.5) * 5,
          y: height,
          z: Math.sin(angle) * radius + (Math.random() - 0.5) * 5
        },
        color: this.generatePlanetColor(i),
        size: isStation ? 1.5 + Math.random() * 0.5 : 2 + Math.random() * 2,
        isStation,
        commodities,
        connectedPlanets: [],
        glowIntensity: 0.5 + Math.random() * 0.5
      });
    }

    const planetIds = Array.from(planets.keys());
    planetIds.forEach((id, i) => {
      const connections = new Set<string>();
      connections.add(planetIds[(i + 1) % planetIds.length]);
      connections.add(planetIds[(i - 1 + planetIds.length) % planetIds.length]);
      
      const numExtraConnections = Math.floor(Math.random() * 2);
      for (let j = 0; j < numExtraConnections; j++) {
        const randomIndex = Math.floor(Math.random() * planetIds.length);
        if (planetIds[randomIndex] !== id) {
          connections.add(planetIds[randomIndex]);
        }
      }
      
      planets.get(id)!.connectedPlanets = Array.from(connections);
    });

    return planets;
  }

  private generatePlanetColor(index: number): number {
    const colors = [
      0x4a9eff, 0xff6b6b, 0x51cf66, 0xffd43b, 0xcc5de8,
      0x20c997, 0xff922b, 0x339af0, 0xf06595, 0x748ffc
    ];
    return colors[index % colors.length];
  }

  public getState(): Readonly<GameStateData> {
    return this.data;
  }

  public getCredits(): number {
    return this.data.credits;
  }

  public getShip(): Readonly<ShipState> {
    return this.data.ship;
  }

  public getPlanets(): ReadonlyMap<string, Planet> {
    return this.data.planets;
  }

  public getPlanet(id: string): Planet | undefined {
    return this.data.planets.get(id);
  }

  public getMissions(): Readonly<TransportMission[]> {
    return this.data.missions;
  }

  public getNewsEvents(): Readonly<NewsEvent[]> {
    return this.data.newsEvents;
  }

  public getUpgrades(): Readonly<ShipUpgrade[]> {
    return this.data.upgrades;
  }

  public getSelectedPlanetId(): string | null {
    return this.data.selectedPlanetId;
  }

  public getCurrentCargoWeight(): number {
    return this.data.ship.cargo.reduce((sum, item) => sum + item.quantity, 0);
  }

  public getAvailableCargoSpace(): number {
    return this.data.ship.cargoCapacity - this.getCurrentCargoWeight();
  }

  public setSelectedPlanetId(id: string | null): void {
    this.data.selectedPlanetId = id;
    this.notifyListeners();
  }

  public setCredits(amount: number): void {
    this.data.credits = Math.max(0, amount);
    this.notifyListeners();
  }

  public addCredits(amount: number): void {
    this.setCredits(this.data.credits + amount);
  }

  public subtractCredits(amount: number): boolean {
    if (this.data.credits >= amount) {
      this.setCredits(this.data.credits - amount);
      return true;
    }
    return false;
  }

  public setShipPosition(x: number, y: number, z: number): void {
    this.data.ship.position = { x, y, z };
    this.notifyListeners();
  }

  public setCurrentPlanet(id: string | null): void {
    this.data.ship.currentPlanetId = id;
    if (id) {
      const planet = this.data.planets.get(id);
      if (planet) {
        this.data.ship.position = { ...planet.position };
      }
    }
    this.notifyListeners();
  }

  public setTargetPlanet(id: string | null): void {
    this.data.ship.targetPlanetId = id;
    this.notifyListeners();
  }

  public setIsFlying(flying: boolean): void {
    this.data.ship.isFlying = flying;
    this.notifyListeners();
  }

  public setFuel(amount: number): void {
    this.data.ship.fuel = Math.max(0, Math.min(this.data.ship.maxFuel, amount));
    this.notifyListeners();
  }

  public addCargo(commodityId: string, quantity: number, purchasePrice: number): boolean {
    if (this.getAvailableCargoSpace() < quantity) {
      return false;
    }

    const existingItem = this.data.ship.cargo.find(c => c.commodityId === commodityId);
    if (existingItem) {
      const totalCost = existingItem.purchasePrice * existingItem.quantity + purchasePrice * quantity;
      const totalQuantity = existingItem.quantity + quantity;
      existingItem.purchasePrice = totalCost / totalQuantity;
      existingItem.quantity = totalQuantity;
    } else {
      this.data.ship.cargo.push({ commodityId, quantity, purchasePrice });
    }
    
    this.notifyListeners();
    return true;
  }

  public removeCargo(commodityId: string, quantity: number): boolean {
    const itemIndex = this.data.ship.cargo.findIndex(c => c.commodityId === commodityId);
    if (itemIndex === -1) return false;

    const item = this.data.ship.cargo[itemIndex];
    if (item.quantity < quantity) return false;

    if (item.quantity === quantity) {
      this.data.ship.cargo.splice(itemIndex, 1);
    } else {
      item.quantity -= quantity;
    }
    
    this.notifyListeners();
    return true;
  }

  public getCargoQuantity(commodityId: string): number {
    const item = this.data.ship.cargo.find(c => c.commodityId === commodityId);
    return item ? item.quantity : 0;
  }

  public updateCommodityPrice(planetId: string, commodityId: string, targetPrice: number): void {
    const planet = this.data.planets.get(planetId);
    if (!planet) return;

    const commodity = planet.commodities.get(commodityId);
    if (!commodity) return;

    commodity.targetPrice = Math.max(commodity.basePrice * 0.3, Math.min(commodity.basePrice * 3, targetPrice));
  }

  public updatePrices(deltaTime: number): void {
    const smoothing = 0.02 * deltaTime * 60;
    
    this.data.planets.forEach(planet => {
      planet.commodities.forEach(commodity => {
        const diff = commodity.targetPrice - commodity.currentPrice;
        commodity.priceVelocity = diff * smoothing;
        commodity.currentPrice += commodity.priceVelocity;
        commodity.currentPrice = Math.round(commodity.currentPrice * 100) / 100;
      });
    });
  }

  public updateSupply(planetId: string, commodityId: string, delta: number): void {
    const planet = this.data.planets.get(planetId);
    if (!planet) return;

    const commodity = planet.commodities.get(commodityId);
    if (!commodity) return;

    commodity.supply = Math.max(0, commodity.supply + delta);
    
    const supplyRatio = commodity.supply / 100;
    const priceModifier = 0.5 + supplyRatio * 1.5;
    this.updateCommodityPrice(planetId, commodityId, commodity.basePrice * priceModifier);
  }

  public addMission(mission: TransportMission): void {
    this.data.missions.push(mission);
    this.notifyListeners();
  }

  public completeMission(missionId: string): void {
    const mission = this.data.missions.find(m => m.id === missionId);
    if (mission) {
      mission.completed = true;
      this.notifyListeners();
    }
  }

  public acceptMission(missionId: string): void {
    const mission = this.data.missions.find(m => m.id === missionId);
    if (mission) {
      mission.accepted = true;
      mission.startTime = this.data.gameTime;
      this.notifyListeners();
    }
  }

  public removeMission(missionId: string): void {
    const index = this.data.missions.findIndex(m => m.id === missionId);
    if (index !== -1) {
      this.data.missions.splice(index, 1);
      this.notifyListeners();
    }
  }

  public addNewsEvent(event: NewsEvent): void {
    this.data.newsEvents.push(event);
    this.notifyListeners();
  }

  public removeNewsEvent(eventId: string): void {
    const index = this.data.newsEvents.findIndex(e => e.id === eventId);
    if (index !== -1) {
      this.data.newsEvents.splice(index, 1);
      this.notifyListeners();
    }
  }

  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.data.upgrades.find(u => u.id === upgradeId);
    if (!upgrade || upgrade.purchased) return false;
    if (this.data.credits < upgrade.cost) return false;

    this.subtractCredits(upgrade.cost);
    upgrade.purchased = true;

    switch (upgrade.type) {
      case 'cargo':
        this.data.ship.cargoCapacity = Math.round(this.data.ship.cargoCapacity * upgrade.multiplier);
        break;
      case 'engine':
        this.data.ship.engineSpeed *= upgrade.multiplier;
        break;
      case 'shield':
        this.data.ship.shieldLevel *= upgrade.multiplier;
        break;
    }

    this.notifyListeners();
    return true;
  }

  public queueEvent(event: () => void): void {
    this.data.eventQueue.push(event);
  }

  public processEventQueue(): void {
    while (this.data.eventQueue.length > 0) {
      const event = this.data.eventQueue.shift();
      if (event) event();
    }
  }

  public updateGameTime(deltaTime: number): void {
    this.data.gameTime += deltaTime;
  }

  public generateRandomNews(): NewsEvent | null {
    if (Math.random() > 0.001) return null;

    const planetIds = Array.from(this.data.planets.keys());
    const randomPlanetId = planetIds[Math.floor(Math.random() * planetIds.length)];
    const planet = this.data.planets.get(randomPlanetId);
    if (!planet) return null;

    const commodityIds = Array.from(planet.commodities.keys());
    if (commodityIds.length === 0) return null;

    const randomCommodityId = commodityIds[Math.floor(Math.random() * commodityIds.length)];
    const commodity = planet.commodities.get(randomCommodityId);
    if (!commodity) return null;

    const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
    
    const event: NewsEvent = {
      id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: template.title,
      description: template.description.replace('{commodity}', commodity.name),
      affectedCommodity: randomCommodityId,
      affectedPlanetId: randomPlanetId,
      priceModifier: template.priceModifier,
      duration: 30 + Math.random() * 60,
      startTime: this.data.gameTime
    };

    this.updateCommodityPrice(
      randomPlanetId,
      randomCommodityId,
      commodity.currentPrice * event.priceModifier
    );

    return event;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const gameState = new GameState();

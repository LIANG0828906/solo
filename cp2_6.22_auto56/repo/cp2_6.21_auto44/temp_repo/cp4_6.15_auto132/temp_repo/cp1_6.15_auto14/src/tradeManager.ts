import { gameState } from './gameState';
import type {
  TradeResult,
  MissionResult,
  TransportMission,
  Commodity,
  ShipUpgrade
} from './types';

const MISSION_GENERATION_CHANCE = 0.3;
const MIN_MISSION_REWARD_MULTIPLIER = 1.5;
const MAX_MISSION_REWARD_MULTIPLIER = 2.5;

class TradeManager {
  private lastMissionPlanetId: string | null = null;

  public buyCommodity(planetId: string, commodityId: string, quantity: number): TradeResult {
    const state = gameState.getState();
    const planet = gameState.getPlanet(planetId);
    
    if (!planet) {
      return { success: false, message: '星球不存在' };
    }

    if (state.ship.currentPlanetId !== planetId || state.ship.isFlying) {
      return { success: false, message: '请先降落到该星球' };
    }

    const commodity = planet.commodities.get(commodityId);
    if (!commodity) {
      return { success: false, message: '该星球不销售此商品' };
    }

    if (commodity.supply < quantity) {
      return { success: false, message: '商品库存不足' };
    }

    const totalCost = Math.round(commodity.currentPrice * quantity);
    
    if (state.credits < totalCost) {
      return { success: false, message: '资金不足' };
    }

    const cargoAdded = gameState.addCargo(commodityId, quantity, commodity.currentPrice);
    if (!cargoAdded) {
      return { success: false, message: '货仓容量不足' };
    }

    gameState.subtractCredits(totalCost);
    gameState.updateSupply(planetId, commodityId, -quantity);

    const priceImpact = quantity * 0.01;
    gameState.updateCommodityPrice(
      planetId,
      commodityId,
      commodity.targetPrice * (1 + priceImpact)
    );

    return {
      success: true,
      message: `成功购买 ${quantity} 单位 ${commodity.name}`,
      newCredits: gameState.getCredits(),
      newCargo: gameState.getShip().cargo
    };
  }

  public sellCommodity(planetId: string, commodityId: string, quantity: number): TradeResult {
    const state = gameState.getState();
    const planet = gameState.getPlanet(planetId);

    if (!planet) {
      return { success: false, message: '星球不存在' };
    }

    if (state.ship.currentPlanetId !== planetId || state.ship.isFlying) {
      return { success: false, message: '请先降落到该星球' };
    }

    const commodity = planet.commodities.get(commodityId);
    if (!commodity) {
      return { success: false, message: '该星球不收购此商品' };
    }

    const cargoQuantity = gameState.getCargoQuantity(commodityId);
    if (cargoQuantity < quantity) {
      return { success: false, message: '货仓中该商品数量不足' };
    }

    const totalRevenue = Math.round(commodity.currentPrice * quantity);
    
    const cargoRemoved = gameState.removeCargo(commodityId, quantity);
    if (!cargoRemoved) {
      return { success: false, message: '出售失败' };
    }

    gameState.addCredits(totalRevenue);
    gameState.updateSupply(planetId, commodityId, quantity);

    const priceImpact = quantity * 0.01;
    gameState.updateCommodityPrice(
      planetId,
      commodityId,
      commodity.targetPrice * (1 - priceImpact)
    );

    this.checkMissionCompletion(planetId, commodityId, quantity);

    return {
      success: true,
      message: `成功出售 ${quantity} 单位 ${commodity.name}，获得 ${totalRevenue} 金币`,
      newCredits: gameState.getCredits(),
      newCargo: gameState.getShip().cargo
    };
  }

  private checkMissionCompletion(planetId: string, commodityId: string, quantity: number): void {
    const missions = gameState.getMissions();
    
    missions.forEach(mission => {
      if (
        mission.accepted &&
        !mission.completed &&
        mission.targetPlanetId === planetId &&
        mission.commodityId === commodityId &&
        quantity >= mission.quantity
      ) {
        gameState.completeMission(mission.id);
        gameState.addCredits(mission.reward);
        
        gameState.queueEvent(() => {
          this.triggerCoinFountain();
        });
      }
    });
  }

  private triggerCoinFountain(): void {
    const event = new CustomEvent('coin-fountain', {
      detail: { position: gameState.getShip().position }
    });
    window.dispatchEvent(event);
  }

  public generateMission(planetId: string): TransportMission | null {
    if (this.lastMissionPlanetId === planetId) {
      return null;
    }

    if (Math.random() > MISSION_GENERATION_CHANCE) {
      return null;
    }

    const planet = gameState.getPlanet(planetId);
    if (!planet) return null;

    const commodityIds = Array.from(planet.commodities.keys());
    if (commodityIds.length === 0) return null;

    const randomCommodityId = commodityIds[Math.floor(Math.random() * commodityIds.length)];
    const commodity = planet.commodities.get(randomCommodityId);
    if (!commodity) return null;

    const planetIds = Array.from(gameState.getPlanets().keys());
    const otherPlanetIds = planetIds.filter(id => id !== planetId);
    if (otherPlanetIds.length === 0) return null;

    const targetPlanetId = otherPlanetIds[Math.floor(Math.random() * otherPlanetIds.length)];
    const targetPlanet = gameState.getPlanet(targetPlanetId);
    if (!targetPlanet) return null;

    const quantity = 5 + Math.floor(Math.random() * 15);
    const baseReward = Math.round(commodity.currentPrice * quantity);
    const rewardMultiplier = MIN_MISSION_REWARD_MULTIPLIER + 
      Math.random() * (MAX_MISSION_REWARD_MULTIPLIER - MIN_MISSION_REWARD_MULTIPLIER);
    const reward = Math.round(baseReward * rewardMultiplier);

    const mission: TransportMission = {
      id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      commodityId: randomCommodityId,
      commodityName: commodity.name,
      quantity,
      originPlanetId: planetId,
      originPlanetName: planet.name,
      targetPlanetId,
      targetPlanetName: targetPlanet.name,
      reward,
      timeLimit: 120 + Math.random() * 180,
      startTime: 0,
      completed: false,
      accepted: false
    };

    this.lastMissionPlanetId = planetId;
    return mission;
  }

  public acceptMission(missionId: string): MissionResult {
    const mission = gameState.getMissions().find(m => m.id === missionId);
    
    if (!mission) {
      return { success: false, message: '任务不存在' };
    }

    if (mission.accepted) {
      return { success: false, message: '任务已接受' };
    }

    const state = gameState.getState();
    if (state.ship.currentPlanetId !== mission.originPlanetId) {
      return { success: false, message: '请先前往出发星球' };
    }

    const availableCargo = gameState.getAvailableCargoSpace();
    if (availableCargo < mission.quantity) {
      return { success: false, message: '货仓容量不足以装载任务货物' };
    }

    const originPlanet = gameState.getPlanet(mission.originPlanetId);
    if (!originPlanet) {
      return { success: false, message: '出发星球不存在' };
    }

    const commodity = originPlanet.commodities.get(mission.commodityId);
    if (!commodity || commodity.supply < mission.quantity) {
      return { success: false, message: '出发星球的任务货物不足' };
    }

    gameState.acceptMission(missionId);
    gameState.addCargo(mission.commodityId, mission.quantity, 0);
    gameState.updateSupply(mission.originPlanetId, mission.commodityId, -mission.quantity);

    return {
      success: true,
      message: `已接受任务：将 ${mission.quantity} 单位 ${mission.commodityName} 运往 ${mission.targetPlanetName}`,
      reward: mission.reward
    };
  }

  public getAvailableUpgrades(): ShipUpgrade[] {
    return gameState.getUpgrades().filter(u => !u.purchased);
  }

  public getPurchasedUpgrades(): ShipUpgrade[] {
    return gameState.getUpgrades().filter(u => u.purchased);
  }

  public purchaseUpgrade(upgradeId: string): MissionResult {
    const state = gameState.getState();
    const currentPlanet = state.ship.currentPlanetId 
      ? gameState.getPlanet(state.ship.currentPlanetId) 
      : null;

    if (!currentPlanet || !currentPlanet.isStation) {
      return { success: false, message: '请在空间站停靠以购买升级' };
    }

    const success = gameState.purchaseUpgrade(upgradeId);
    
    if (!success) {
      const upgrade = gameState.getUpgrades().find(u => u.id === upgradeId);
      if (!upgrade) {
        return { success: false, message: '升级不存在' };
      }
      if (upgrade.purchased) {
        return { success: false, message: '已购买此升级' };
      }
      return { success: false, message: '资金不足' };
    }

    const event = new CustomEvent('ship-upgraded');
    window.dispatchEvent(event);

    return {
      success: true,
      message: '升级购买成功！'
    };
  }

  public getCommodityPrice(planetId: string, commodityId: string): number | null {
    const planet = gameState.getPlanet(planetId);
    if (!planet) return null;
    
    const commodity = planet.commodities.get(commodityId);
    return commodity ? commodity.currentPrice : null;
  }

  public getPlanetCommodities(planetId: string): Commodity[] {
    const planet = gameState.getPlanet(planetId);
    if (!planet) return [];
    
    return Array.from(planet.commodities.values());
  }

  public getPriceTrend(planetId: string, commodityId: string): 'up' | 'down' | 'stable' {
    const planet = gameState.getPlanet(planetId);
    if (!planet) return 'stable';
    
    const commodity = planet.commodities.get(commodityId);
    if (!commodity) return 'stable';

    const diff = commodity.targetPrice - commodity.currentPrice;
    if (Math.abs(diff) < 1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  }

  public calculateProfit(commodityId: string, buyPlanetId: string, sellPlanetId: string, quantity: number): number | null {
    const buyPrice = this.getCommodityPrice(buyPlanetId, commodityId);
    const sellPrice = this.getCommodityPrice(sellPlanetId, commodityId);
    
    if (buyPrice === null || sellPrice === null) return null;
    
    return Math.round((sellPrice - buyPrice) * quantity);
  }

  public getActiveMissions(): TransportMission[] {
    return gameState.getMissions().filter(m => m.accepted && !m.completed);
  }

  public getCompletedMissions(): TransportMission[] {
    return gameState.getMissions().filter(m => m.completed);
  }

  public cleanupExpiredEvents(): void {
    const state = gameState.getState();
    const now = state.gameTime;

    state.newsEvents.forEach(event => {
      if (now - event.startTime > event.duration) {
        const commodity = gameState.getPlanet(event.affectedPlanetId)
          ?.commodities.get(event.affectedCommodity);
        
        if (commodity) {
          gameState.updateCommodityPrice(
            event.affectedPlanetId,
            event.affectedCommodity,
            commodity.basePrice
          );
        }
        
        gameState.removeNewsEvent(event.id);
      }
    });

    state.missions.forEach(mission => {
      if (mission.accepted && !mission.completed) {
        if (now - mission.startTime > mission.timeLimit) {
          gameState.removeMission(mission.id);
        }
      }
    });
  }

  public update(deltaTime: number): void {
    gameState.updatePrices(deltaTime);
    this.cleanupExpiredEvents();
    
    const newsEvent = gameState.generateRandomNews();
    if (newsEvent) {
      gameState.addNewsEvent(newsEvent);
      
      const event = new CustomEvent('news-alert', {
        detail: { event: newsEvent }
      });
      window.dispatchEvent(event);
    }

    const currentPlanetId = gameState.getShip().currentPlanetId;
    if (currentPlanetId && !gameState.getShip().isFlying) {
      const existingMissions = gameState.getMissions().filter(
        m => m.originPlanetId === currentPlanetId && !m.accepted
      );
      
      if (existingMissions.length < 2) {
        const newMission = this.generateMission(currentPlanetId);
        if (newMission) {
          gameState.addMission(newMission);
        }
      }
    }
  }
}

export const tradeManager = new TradeManager();

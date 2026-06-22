import {
  Resources,
  Civilization,
  CivilizationType,
  ResourceType,
  NegotiationStrategy,
  TradeRecord,
  EngineState,
  ThreeWayTradeRecord,
  INITIAL_RESOURCES,
  TARGET_BASE,
  CIVILIZATION_NAMES,
  CIVILIZATION_COLORS,
  RESOURCE_PRICES,
} from './types';

type EventCallback = (data: unknown) => void;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  emit(event: string, data?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }
}

interface StrategyConfig {
  buyPriceMultiplier: number;
  sellPriceMultiplier: number;
  maxTradeRatio: number;
  urgencyFactor: number;
}

const STRATEGY_CONFIGS: Record<NegotiationStrategy, StrategyConfig> = {
  aggressive: {
    buyPriceMultiplier: 1.25,
    sellPriceMultiplier: 0.85,
    maxTradeRatio: 0.4,
    urgencyFactor: 1.5,
  },
  balanced: {
    buyPriceMultiplier: 1.0,
    sellPriceMultiplier: 1.0,
    maxTradeRatio: 0.25,
    urgencyFactor: 1.0,
  },
  conservative: {
    buyPriceMultiplier: 0.8,
    sellPriceMultiplier: 1.3,
    maxTradeRatio: 0.15,
    urgencyFactor: 0.6,
  },
};

export class TradeEngine {
  private eventBus: EventBus;
  private state: EngineState;
  private animationFrameId: number | null = null;
  private lastRoundTime: number = 0;
  private roundInterval: number = 100;

  constructor() {
    this.eventBus = new EventBus();
    this.state = this.createInitialState();
  }

  private createInitialState(): EngineState {
    const civilizations: Record<CivilizationType, Civilization> = {
      elf: {
        id: 'elf',
        name: CIVILIZATION_NAMES.elf,
        color: CIVILIZATION_COLORS.elf,
        resources: { ...INITIAL_RESOURCES.elf },
        strategy: 'balanced',
        targetBase: { ...TARGET_BASE },
      },
      dwarf: {
        id: 'dwarf',
        name: CIVILIZATION_NAMES.dwarf,
        color: CIVILIZATION_COLORS.dwarf,
        resources: { ...INITIAL_RESOURCES.dwarf },
        strategy: 'balanced',
        targetBase: { ...TARGET_BASE },
      },
      human: {
        id: 'human',
        name: CIVILIZATION_NAMES.human,
        color: CIVILIZATION_COLORS.human,
        resources: { ...INITIAL_RESOURCES.human },
        strategy: 'balanced',
        targetBase: { ...TARGET_BASE },
      },
    };

    return {
      civilizations,
      tradeHistory: [],
      threeWayTradeHistory: [],
      resourceHistory: [
        {
          round: 0,
          resources: {
            elf: { ...civilizations.elf.resources },
            dwarf: { ...civilizations.dwarf.resources },
            human: { ...civilizations.human.resources },
          },
        },
      ],
      currentRound: 0,
      isRunning: false,
      totalRounds: 20,
    };
  }

  on(event: string, callback: EventCallback): void {
    this.eventBus.on(event, callback);
  }

  off(event: string, callback: EventCallback): void {
    this.eventBus.off(event, callback);
  }

  getState(): EngineState {
    return JSON.parse(JSON.stringify(this.state));
  }

  setResource(civId: CivilizationType, resource: ResourceType, value: number): void {
    const civ = this.state.civilizations[civId];
    civ.resources[resource] = Math.max(0, Math.min(100, value));
    this.eventBus.emit('stateUpdate', this.getState());
  }

  setStrategy(civId: CivilizationType, strategy: NegotiationStrategy): void {
    this.state.civilizations[civId].strategy = strategy;
    this.eventBus.emit('stateUpdate', this.getState());
  }

  reset(): void {
    this.stop();
    this.state = this.createInitialState();
    this.eventBus.emit('stateUpdate', this.getState());
  }

  randomize(): void {
    this.stop();
    const civIds: CivilizationType[] = ['elf', 'dwarf', 'human'];
    const resourceTypes: ResourceType[] = ['wood', 'ore', 'food', 'gold'];
    const totalPerCiv = 280;

    civIds.forEach((civId) => {
      const resources: Resources = { wood: 0, ore: 0, food: 0, gold: 0 };
      let remaining = totalPerCiv;

      for (let i = 0; i < resourceTypes.length - 1; i++) {
        const maxForThis = Math.min(100, remaining - (3 - i) * 0);
        const minForThis = Math.max(0, remaining - (3 - i) * 100);
        const val = Math.floor(Math.random() * (maxForThis - minForThis + 1)) + minForThis;
        resources[resourceTypes[i]] = val;
        remaining -= val;
      }
      resources[resourceTypes[3]] = Math.max(0, Math.min(100, remaining));

      let sum = resources.wood + resources.ore + resources.food + resources.gold;
      while (sum !== totalPerCiv) {
        const diff = totalPerCiv - sum;
        const idx = Math.floor(Math.random() * 4);
        const res = resourceTypes[idx];
        const newVal = resources[res] + Math.sign(diff);
        if (newVal >= 0 && newVal <= 100) {
          resources[res] = newVal;
          sum += Math.sign(diff);
        }
      }

      this.state.civilizations[civId].resources = resources;
    });

    this.state.resourceHistory = [
      {
        round: 0,
        resources: {
          elf: { ...this.state.civilizations.elf.resources },
          dwarf: { ...this.state.civilizations.dwarf.resources },
          human: { ...this.state.civilizations.human.resources },
        },
      },
    ];
    this.state.tradeHistory = [];
    this.state.threeWayTradeHistory = [];
    this.state.currentRound = 0;
    this.eventBus.emit('stateUpdate', this.getState());
  }

  start(): void {
    if (this.state.isRunning) return;
    if (this.state.currentRound >= this.state.totalRounds) {
      this.state.currentRound = 0;
      this.state.tradeHistory = [];
      this.state.threeWayTradeHistory = [];
      this.state.resourceHistory = this.state.resourceHistory.slice(0, 1);
    }
    this.state.isRunning = true;
    this.lastRoundTime = performance.now();
    this.eventBus.emit('stateUpdate', this.getState());
    this.runLoop();
  }

  stop(): void {
    this.state.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private runLoop = (): void => {
    if (!this.state.isRunning) return;

    const now = performance.now();
    const elapsed = now - this.lastRoundTime;

    if (elapsed >= this.roundInterval) {
      this.runRound();
      this.lastRoundTime = now;

      if (this.state.currentRound >= this.state.totalRounds) {
        this.state.isRunning = false;
        this.eventBus.emit('stateUpdate', this.getState());
        this.eventBus.emit('negotiationComplete', this.getState());
        return;
      }
    }

    this.eventBus.emit('tick', {
      currentRound: this.state.currentRound,
      totalRounds: this.state.totalRounds,
      progress: elapsed / this.roundInterval,
    });

    this.animationFrameId = requestAnimationFrame(this.runLoop);
  };

  private getSurplusesAndDeficits(civ: Civilization): {
    surpluses: Map<ResourceType, number>;
    deficits: Map<ResourceType, number>;
  } {
    const resourceTypes: ResourceType[] = ['wood', 'ore', 'food', 'gold'];
    const surpluses = new Map<ResourceType, number>();
    const deficits = new Map<ResourceType, number>();

    resourceTypes.forEach((res) => {
      const diff = civ.resources[res] - civ.targetBase[res];
      if (diff > 3) {
        surpluses.set(res, diff);
      } else if (diff < -3) {
        deficits.set(res, Math.abs(diff));
      }
    });

    return { surpluses, deficits };
  }

  private calculateBuyValue(
    civ: Civilization,
    resource: ResourceType,
    amount: number
  ): number {
    const config = STRATEGY_CONFIGS[civ.strategy];
    const baseValue = amount * RESOURCE_PRICES[resource];
    return baseValue * config.buyPriceMultiplier;
  }

  private calculateSellValue(
    civ: Civilization,
    resource: ResourceType,
    amount: number
  ): number {
    const config = STRATEGY_CONFIGS[civ.strategy];
    const baseValue = amount * RESOURCE_PRICES[resource];
    return baseValue * config.sellPriceMultiplier;
  }

  private calculateAmountFromValue(
    civ: Civilization,
    resource: ResourceType,
    value: number,
    isBuying: boolean
  ): number {
    const config = STRATEGY_CONFIGS[civ.strategy];
    const multiplier = isBuying ? config.buyPriceMultiplier : config.sellPriceMultiplier;
    return Math.floor(value / (RESOURCE_PRICES[resource] * multiplier));
  }

  private findTwoWayMatches(
    civIds: CivilizationType[]
  ): TradeRecord[] {
    const trades: TradeRecord[] = [];
    const usedCivs = new Set<CivilizationType>();

    const pairs: [CivilizationType, CivilizationType][] = [];
    for (let i = 0; i < civIds.length; i++) {
      for (let j = i + 1; j < civIds.length; j++) {
        pairs.push([civIds[i], civIds[j]]);
      }
    }

    const pairScores: {
      pair: [CivilizationType, CivilizationType];
      score: number;
      trade: TradeRecord | null;
    }[] = [];

    for (const pair of pairs) {
      const [civAId, civBId] = pair;
      const civA = this.state.civilizations[civAId];
      const civB = this.state.civilizations[civBId];

      const { surpluses: surplusesA, deficits: deficitsA } =
        this.getSurplusesAndDeficits(civA);
      const { surpluses: surplusesB, deficits: deficitsB } =
        this.getSurplusesAndDeficits(civB);

      let bestTrade: TradeRecord | null = null;
      let bestScore = -Infinity;

      for (const [resA, surplusA] of surplusesA) {
        for (const [resB, surplusB] of surplusesB) {
          if (resA === resB) continue;

          const deficitAForB = deficitsA.get(resB) || 0;
          const deficitBForA = deficitsB.get(resA) || 0;

          if (deficitAForB <= 0 || deficitBForA <= 0) continue;

          const configA = STRATEGY_CONFIGS[civA.strategy];
          const configB = STRATEGY_CONFIGS[civB.strategy];

          const maxGiveA = Math.min(
            Math.floor(surplusA * configA.maxTradeRatio),
            deficitBForA
          );
          const maxGiveB = Math.min(
            Math.floor(surplusB * configB.maxTradeRatio),
            deficitAForB
          );

          if (maxGiveA <= 0 || maxGiveB <= 0) continue;

          const valueA = this.calculateSellValue(civA, resA, maxGiveA);
          const valueB = this.calculateSellValue(civB, resB, maxGiveB);

          const tradeValue = Math.min(valueA, valueB);

          const amountA = this.calculateAmountFromValue(civA, resA, tradeValue, false);
          const amountB = this.calculateAmountFromValue(civB, resB, tradeValue, false);

          if (amountA <= 0 || amountB <= 0) continue;

          const urgency =
            (deficitAForB + deficitBForA) *
            ((configA.urgencyFactor + configB.urgencyFactor) / 2);
          const score = tradeValue + urgency;

          if (score > bestScore) {
            bestScore = score;
            bestTrade = {
              round: this.state.currentRound,
              civilizationA: civAId,
              civilizationB: civBId,
              resourceA: resA,
              amountA: amountA,
              resourceB: resB,
              amountB: amountB,
              resourcesAfter: {
                elf: { ...this.state.civilizations.elf.resources },
                dwarf: { ...this.state.civilizations.dwarf.resources },
                human: { ...this.state.civilizations.human.resources },
              },
            };
          }
        }
      }

      pairScores.push({ pair, score: bestScore, trade: bestTrade });
    }

    pairScores.sort((a, b) => b.score - a.score);

    for (const { pair, trade } of pairScores) {
      const [a, b] = pair;
      if (usedCivs.has(a) || usedCivs.has(b)) continue;
      if (!trade) continue;

      const civA = this.state.civilizations[a];
      const civB = this.state.civilizations[b];

      civA.resources[trade.resourceA] -= trade.amountA;
      civA.resources[trade.resourceB] += trade.amountB;
      civB.resources[trade.resourceB] -= trade.amountB;
      civB.resources[trade.resourceA] += trade.amountA;

      trade.resourcesAfter = {
        elf: { ...this.state.civilizations.elf.resources },
        dwarf: { ...this.state.civilizations.dwarf.resources },
        human: { ...this.state.civilizations.human.resources },
      };

      trades.push(trade);
      usedCivs.add(a);
      usedCivs.add(b);
    }

    return trades;
  }

  private findThreeWayMatches(
    civIds: CivilizationType[]
  ): ThreeWayTradeRecord[] {
    const trades: ThreeWayTradeRecord[] = [];
    if (civIds.length !== 3) return trades;

    const civPermutations: [CivilizationType, CivilizationType, CivilizationType][] = [
      ['elf', 'dwarf', 'human'],
      ['elf', 'human', 'dwarf'],
      ['dwarf', 'elf', 'human'],
      ['dwarf', 'human', 'elf'],
      ['human', 'elf', 'dwarf'],
      ['human', 'dwarf', 'elf'],
    ];

    const resourceTypes: ResourceType[] = ['wood', 'ore', 'food', 'gold'];

    let bestTrade: ThreeWayTradeRecord | null = null;
    let bestScore = -Infinity;

    for (const perm of civPermutations) {
      const [civ1Id, civ2Id, civ3Id] = perm;
      const civ1 = this.state.civilizations[civ1Id];
      const civ2 = this.state.civilizations[civ2Id];
      const civ3 = this.state.civilizations[civ3Id];

      const { surpluses: surpluses1, deficits: deficits1 } =
        this.getSurplusesAndDeficits(civ1);
      const { surpluses: surpluses2, deficits: deficits2 } =
        this.getSurplusesAndDeficits(civ2);
      const { surpluses: surpluses3, deficits: deficits3 } =
        this.getSurplusesAndDeficits(civ3);

      for (const res1 of resourceTypes) {
        if (!surpluses1.has(res1)) continue;

        for (const res2 of resourceTypes) {
          if (res1 === res2) continue;
          if (!surpluses2.has(res2)) continue;
          if (!deficits2.has(res1)) continue;

          for (const res3 of resourceTypes) {
            if (res3 === res1 || res3 === res2) continue;
            if (!surpluses3.has(res3)) continue;
            if (!deficits3.has(res2)) continue;
            if (!deficits1.has(res3)) continue;

            const config1 = STRATEGY_CONFIGS[civ1.strategy];
            const config2 = STRATEGY_CONFIGS[civ2.strategy];
            const config3 = STRATEGY_CONFIGS[civ3.strategy];

            const surplus1 = surpluses1.get(res1)!;
            const deficit2of1 = deficits2.get(res1)!;
            const surplus2 = surpluses2.get(res2)!;
            const deficit3of2 = deficits3.get(res2)!;
            const surplus3 = surpluses3.get(res3)!;
            const deficit1of3 = deficits1.get(res3)!;

            const max1to2 = Math.min(
              Math.floor(surplus1 * config1.maxTradeRatio),
              deficit2of1
            );
            if (max1to2 <= 0) continue;

            const value1to2 = this.calculateSellValue(civ1, res1, max1to2);

            const max2to3 = Math.min(
              this.calculateAmountFromValue(civ2, res2, value1to2, false),
              Math.floor(surplus2 * config2.maxTradeRatio),
              deficit3of2
            );
            if (max2to3 <= 0) continue;

            const value2to3 = this.calculateSellValue(civ2, res2, max2to3);

            const max3to1 = Math.min(
              this.calculateAmountFromValue(civ3, res3, value2to3, false),
              Math.floor(surplus3 * config3.maxTradeRatio),
              deficit1of3
            );
            if (max3to1 <= 0) continue;

            const value3to1 = this.calculateSellValue(civ3, res3, max3to1);

            const final1to2 = Math.min(
              max1to2,
              this.calculateAmountFromValue(civ1, res1, value3to1, true)
            );
            if (final1to2 <= 0) continue;

            const finalValue = this.calculateSellValue(civ1, res1, final1to2);

            const urgencyScore =
              (deficit2of1 + deficit3of2 + deficit1of3) *
              ((config1.urgencyFactor +
                config2.urgencyFactor +
                config3.urgencyFactor) /
                3);

            const score = finalValue * 3 + urgencyScore;

            if (score > bestScore) {
              bestScore = score;
              bestTrade = {
                round: this.state.currentRound,
                civ1: civ1Id,
                civ2: civ2Id,
                civ3: civ3Id,
                resource1to2: res1,
                amount1to2: final1to2,
                resource2to3: res2,
                amount2to3: max2to3,
                resource3to1: res3,
                amount3to1: max3to1,
                resourcesAfter: {
                  elf: { ...this.state.civilizations.elf.resources },
                  dwarf: { ...this.state.civilizations.dwarf.resources },
                  human: { ...this.state.civilizations.human.resources },
                },
              };
            }
          }
        }
      }
    }

    if (bestTrade) {
      const t = bestTrade;
      const civ1 = this.state.civilizations[t.civ1];
      const civ2 = this.state.civilizations[t.civ2];
      const civ3 = this.state.civilizations[t.civ3];

      civ1.resources[t.resource1to2] -= t.amount1to2;
      civ1.resources[t.resource3to1] += t.amount3to1;

      civ2.resources[t.resource2to3] -= t.amount2to3;
      civ2.resources[t.resource1to2] += t.amount1to2;

      civ3.resources[t.resource3to1] -= t.amount3to1;
      civ3.resources[t.resource2to3] += t.amount2to3;

      bestTrade.resourcesAfter = {
        elf: { ...this.state.civilizations.elf.resources },
        dwarf: { ...this.state.civilizations.dwarf.resources },
        human: { ...this.state.civilizations.human.resources },
      };

      trades.push(bestTrade);
    }

    return trades;
  }

  private runRound(): void {
    this.state.currentRound++;
    const civIds: CivilizationType[] = ['elf', 'dwarf', 'human'];

    const twoWayTrades = this.findTwoWayMatches(civIds);
    const threeWayTrades: ThreeWayTradeRecord[] = [];

    if (twoWayTrades.length === 0) {
      const found = this.findThreeWayMatches(civIds);
      threeWayTrades.push(...found);
    }

    this.state.tradeHistory.push(...twoWayTrades);
    this.state.threeWayTradeHistory.push(...threeWayTrades);

    this.state.resourceHistory.push({
      round: this.state.currentRound,
      resources: {
        elf: { ...this.state.civilizations.elf.resources },
        dwarf: { ...this.state.civilizations.dwarf.resources },
        human: { ...this.state.civilizations.human.resources },
      },
    });

    this.eventBus.emit('roundComplete', {
      round: this.state.currentRound,
      trades: twoWayTrades,
      threeWayTrades: threeWayTrades,
      state: this.getState(),
    });
    this.eventBus.emit('stateUpdate', this.getState());
  }

  calculateTotalAssets(resources: Resources): number {
    return (
      resources.gold * RESOURCE_PRICES.gold +
      resources.wood * RESOURCE_PRICES.wood +
      resources.ore * RESOURCE_PRICES.ore +
      resources.food * RESOURCE_PRICES.food
    );
  }
}

export const tradeEngine = new TradeEngine();

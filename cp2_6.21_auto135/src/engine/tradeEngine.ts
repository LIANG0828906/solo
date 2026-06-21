import {
  Resources,
  Civilization,
  CivilizationType,
  ResourceType,
  NegotiationStrategy,
  TradeRecord,
  EngineState,
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
    this.state.currentRound = 0;
    this.eventBus.emit('stateUpdate', this.getState());
  }

  start(): void {
    if (this.state.isRunning) return;
    if (this.state.currentRound >= this.state.totalRounds) {
      this.state.currentRound = 0;
      this.state.tradeHistory = [];
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

  private runRound(): void {
    this.state.currentRound++;
    const roundTrades: TradeRecord[] = [];
    const civIds: CivilizationType[] = ['elf', 'dwarf', 'human'];
    const resourceTypes: ResourceType[] = ['wood', 'ore', 'food', 'gold'];

    type Proposal = {
      from: CivilizationType;
      giveResource: ResourceType;
      giveAmount: number;
      wantResource: ResourceType;
      wantAmount: number;
    };

    const allProposals: Proposal[] = [];

    civIds.forEach((civId) => {
      const civ = this.state.civilizations[civId];
      const surpluses: { resource: ResourceType; amount: number }[] = [];
      const deficits: { resource: ResourceType; amount: number }[] = [];

      resourceTypes.forEach((res) => {
        const diff = civ.resources[res] - civ.targetBase[res];
        if (diff > 5) {
          surpluses.push({ resource: res, amount: diff });
        } else if (diff < -5) {
          deficits.push({ resource: res, amount: Math.abs(diff) });
        }
      });

      const strategy = civ.strategy;
      let exchangeRateMultiplier: number;
      if (strategy === 'aggressive') {
        exchangeRateMultiplier = 1.3;
      } else if (strategy === 'conservative') {
        exchangeRateMultiplier = 0.7;
      } else {
        exchangeRateMultiplier = 1.0;
      }

      surpluses.forEach((surplus) => {
        deficits.forEach((deficit) => {
          const giveAmount = Math.min(surplus.amount, 15);
          const giveValue = giveAmount * RESOURCE_PRICES[surplus.resource];
          const wantAmount = Math.floor(
            (giveValue * exchangeRateMultiplier) / RESOURCE_PRICES[deficit.resource]
          );

          if (giveAmount > 0 && wantAmount > 0 && wantAmount <= deficit.amount + 10) {
            allProposals.push({
              from: civId,
              giveResource: surplus.resource,
              giveAmount: Math.floor(giveAmount),
              wantResource: deficit.resource,
              wantAmount: Math.min(wantAmount, deficit.amount + 5),
            });
          }
        });
      });
    });

    const matchedPairs: Set<string> = new Set();
    const tradesThisRound: TradeRecord[] = [];

    allProposals.sort((a, b) => {
      const aScore = a.giveAmount * RESOURCE_PRICES[a.giveResource];
      const bScore = b.giveAmount * RESOURCE_PRICES[b.giveResource];
      return bScore - aScore;
    });

    for (const proposal of allProposals) {
      const matchingProposals = allProposals.filter(
        (p) =>
          p.from !== proposal.from &&
          p.giveResource === proposal.wantResource &&
          p.wantResource === proposal.giveResource &&
          !matchedPairs.has(`${proposal.from}-${p.from}`) &&
          !matchedPairs.has(`${p.from}-${proposal.from}`)
      );

      if (matchingProposals.length > 0) {
        const bestMatch = matchingProposals[0];
        const civA = this.state.civilizations[proposal.from];
        const civB = this.state.civilizations[bestMatch.from];

        const tradeAmountA = Math.min(
          proposal.giveAmount,
          bestMatch.wantAmount,
          civA.resources[proposal.giveResource]
        );
        const tradeAmountB = Math.min(
          bestMatch.giveAmount,
          proposal.wantAmount,
          civB.resources[bestMatch.giveResource]
        );

        const actualA = Math.floor(tradeAmountA * 0.8);
        const actualB = Math.floor(tradeAmountB * 0.8);

        if (actualA > 0 && actualB > 0) {
          civA.resources[proposal.giveResource] -= actualA;
          civA.resources[proposal.wantResource] += actualB;
          civB.resources[bestMatch.giveResource] -= actualB;
          civB.resources[bestMatch.wantResource] += actualA;

          const trade: TradeRecord = {
            round: this.state.currentRound,
            civilizationA: proposal.from,
            civilizationB: bestMatch.from,
            resourceA: proposal.giveResource,
            amountA: actualA,
            resourceB: proposal.wantResource,
            amountB: actualB,
            resourcesAfter: {
              elf: { ...this.state.civilizations.elf.resources },
              dwarf: { ...this.state.civilizations.dwarf.resources },
              human: { ...this.state.civilizations.human.resources },
            },
          };

          tradesThisRound.push(trade);
          roundTrades.push(trade);
          matchedPairs.add(`${proposal.from}-${bestMatch.from}`);
          matchedPairs.add(`${bestMatch.from}-${proposal.from}`);
        }
      }
    }

    if (tradesThisRound.length === 0) {
      civIds.forEach((civId, idx) => {
        const nextCivId = civIds[(idx + 1) % 3];
        const civA = this.state.civilizations[civId];
        const civB = this.state.civilizations[nextCivId];

        const surplusesA: { resource: ResourceType; amount: number }[] = [];
        const deficitsA: { resource: ResourceType; amount: number }[] = [];
        const surplusesB: { resource: ResourceType; amount: number }[] = [];
        const deficitsB: { resource: ResourceType; amount: number }[] = [];

        resourceTypes.forEach((res) => {
          const diffA = civA.resources[res] - civA.targetBase[res];
          const diffB = civB.resources[res] - civB.targetBase[res];
          if (diffA > 3) surplusesA.push({ resource: res, amount: diffA });
          if (diffA < -3) deficitsA.push({ resource: res, amount: Math.abs(diffA) });
          if (diffB > 3) surplusesB.push({ resource: res, amount: diffB });
          if (diffB < -3) deficitsB.push({ resource: res, amount: Math.abs(diffB) });
        });

        for (const surplusA of surplusesA) {
          for (const deficitA of deficitsA) {
            const matchingSurplus = surplusesB.find((s) => s.resource === deficitA.resource);
            const matchingDeficit = deficitsB.find((d) => d.resource === surplusA.resource);
            if (matchingSurplus && matchingDeficit) {
              const amountA = Math.min(
                Math.floor(surplusA.amount * 0.3),
                matchingDeficit.amount,
                8
              );
              const amountB = Math.min(
                Math.floor(matchingSurplus.amount * 0.3),
                deficitA.amount,
                8
              );

              if (amountA > 0 && amountB > 0) {
                civA.resources[surplusA.resource] -= amountA;
                civA.resources[deficitA.resource] += amountB;
                civB.resources[deficitA.resource] -= amountB;
                civB.resources[surplusA.resource] += amountA;

                const trade: TradeRecord = {
                  round: this.state.currentRound,
                  civilizationA: civId,
                  civilizationB: nextCivId,
                  resourceA: surplusA.resource,
                  amountA: amountA,
                  resourceB: deficitA.resource,
                  amountB: amountB,
                  resourcesAfter: {
                    elf: { ...this.state.civilizations.elf.resources },
                    dwarf: { ...this.state.civilizations.dwarf.resources },
                    human: { ...this.state.civilizations.human.resources },
                  },
                };

                roundTrades.push(trade);
              }
              break;
            }
          }
        }
      });
    }

    this.state.tradeHistory.push(...roundTrades);
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
      trades: roundTrades,
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

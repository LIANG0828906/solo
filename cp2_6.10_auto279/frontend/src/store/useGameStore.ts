import { create } from 'zustand';
import type { GameState, RuneShard, RuneCasting, Order, GameEvent, LogEntry, LogType, EvaluationReport } from '@/types';
import { getShards, getOrders, fuseShards, triggerRandomEvent, getEvaluation, saveEvaluation } from '@/utils/api';
import { playFusionSound, playSuccessSound, playFailureSound, playEventSound, playExplosionSound } from '@/utils/sound';

const PERIOD_DURATION = 120;
const EVENT_INTERVAL = 30000;

const generateId = (): string => Math.random().toString(36).substring(2, 11);

const initialState: GameState = {
  shards: [],
  orders: [],
  currentPeriod: 1,
  periodTimeRemaining: PERIOD_DURATION,
  score: 0,
  experience: 0,
  level: 1,
  currentEvent: null,
  logs: [],
  isFusing: false,
  fusionShards: [],
  isOverheated: false,
  lastCasting: null,
  showEvaluation: false,
  evaluationReport: null,
  ordersCompleted: 0,
  ordersFailed: 0,
  totalCastingAttributes: 0,
  castingCount: 0,
  eventsHandled: 0,
  eventsFailed: 0,
};

interface GameActions {
  initGame: () => Promise<void>;
  addFusionShard: (shard: RuneShard) => void;
  removeFusionShard: (shardId: string) => void;
  clearFusionShards: () => void;
  performFusion: () => Promise<void>;
  addLog: (message: string, type: LogType) => void;
  handleShardDrop: (shard: RuneShard) => void;
  refreshShards: () => Promise<void>;
  triggerEvent: () => Promise<void>;
  handleOverheat: () => void;
  handleContamination: (refresh: boolean) => void;
  handleMuseSilence: () => void;
  dismissEvent: () => void;
  startPeriodTimer: () => () => void;
  startEventTimer: () => () => void;
  startOrderTimers: () => () => void;
  completeOrder: (orderId: string, casting: RuneCasting) => Promise<void>;
  closeEvaluation: () => void;
  resetPeriodStats: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  initGame: async () => {
    const shards = await getShards();
    const orders = await getOrders();
    
    set({
      shards,
      orders,
      ...initialState,
      shards,
      orders,
    });

    get().addLog('欢迎来到符文工坊·铸炉！开始你的铸造之旅吧！', 'info');
  },

  addFusionShard: (shard: RuneShard) => {
    if (get().isOverheated) {
      get().addLog('熔炉过热！无法添加碎片！', 'failure');
      playExplosionSound();
      set((state) => ({ score: Math.max(0, state.score - 50) }));
      return;
    }
    if (shard.contaminated) {
      get().addLog('碎片已被污染，无法使用！请点击刷新清理。', 'failure');
      return;
    }
    set((state) => ({
      fusionShards: [...state.fusionShards, shard],
      shards: state.shards.filter((s) => s.id !== shard.id),
    }));
  },

  removeFusionShard: (shardId: string) => {
    set((state) => {
      const shard = state.fusionShards.find((s) => s.id === shardId);
      if (!shard) return state;
      return {
        fusionShards: state.fusionShards.filter((s) => s.id !== shardId),
        shards: [...state.shards, shard],
      };
    });
  },

  clearFusionShards: () => {
    set((state) => ({
      shards: [...state.shards, ...state.fusionShards],
      fusionShards: [],
    }));
  },

  performFusion: async () => {
    const state = get();
    if (state.fusionShards.length < 2) {
      get().addLog('至少需要2个碎片才能融合！', 'info');
      return;
    }
    if (state.isFusing || state.isOverheated) return;

    set({ isFusing: true });
    playFusionSound();

    const shardIds = state.fusionShards.map((s) => s.id);
    
    try {
      const result = await fuseShards(shardIds);
      
      setTimeout(() => {
        if (result.success) {
          playSuccessSound();
          get().addLog(result.message, 'success');
          
          const casting = result.casting;
          const attrSum = Object.values(casting.attributes).reduce((sum, val) => sum + val, 0);
          
          set((state) => ({
            lastCasting: casting,
            score: state.score + casting.score,
            experience: state.experience + Math.floor(casting.score / 2),
            fusionShards: [],
            isFusing: false,
            castingCount: state.castingCount + 1,
            totalCastingAttributes: state.totalCastingAttributes + attrSum,
          }));

          get().checkOrderCompletion(casting);
          get().refreshShards();
        } else {
          playFailureSound();
          get().addLog(result.message, 'failure');
          set({ isFusing: false });
        }
      }, 1500);
    } catch (error) {
      console.error('Fusion failed:', error);
      set({ isFusing: false });
    }
  },

  checkOrderCompletion: (casting: RuneCasting) => {
    const state = get();
    const elementCounts: Record<string, number> = {};
    casting.elements.forEach((el) => {
      elementCounts[el] = (elementCounts[el] || 0) + 1;
    });

    for (const order of state.orders) {
      if (order.completed) continue;

      const { requirements } = order;
      let meetsRequirements = true;

      if (requirements.minFire && elementCounts['fire'] < requirements.minFire) meetsRequirements = false;
      if (requirements.minWater && elementCounts['water'] < requirements.minWater) meetsRequirements = false;
      if (requirements.minEarth && elementCounts['earth'] < requirements.minEarth) meetsRequirements = false;
      if (requirements.minWind && elementCounts['wind'] < requirements.minWind) meetsRequirements = false;
      
      if (requirements.requiredElements) {
        const reqCounts: Record<string, number> = {};
        requirements.requiredElements.forEach((el) => {
          reqCounts[el] = (reqCounts[el] || 0) + 1;
        });
        for (const [el, count] of Object.entries(reqCounts)) {
          if ((elementCounts[el] || 0) < count) {
            meetsRequirements = false;
            break;
          }
        }
      }

      if (meetsRequirements) {
        get().completeOrder(order.id, casting);
        break;
      }
    }
  },

  addLog: (message: string, type: LogType) => {
    const newLog: LogEntry = {
      id: generateId(),
      message,
      type,
      timestamp: Date.now(),
    };
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 10),
    }));
  },

  handleShardDrop: (shard: RuneShard) => {
    get().addFusionShard(shard);
  },

  refreshShards: async () => {
    const newShards = await getShards();
    set({ shards: newShards });
  },

  triggerEvent: async () => {
    if (get().currentEvent) return;
    
    const event = await triggerRandomEvent();
    playEventSound();
    get().addLog(`事件触发：${event.title}`, 'event');
    set({ currentEvent: event });

    if (event.type === 'overheat') {
      get().handleOverheat();
    } else if (event.type === 'contamination') {
      set((state) => ({
        shards: state.shards.map((shard) => ({
          ...shard,
          contaminated: Math.random() < 0.3,
        })),
      }));
    }
  },

  handleOverheat: () => {
    set({ isOverheated: true });
    
    setTimeout(() => {
      set((state) => ({
        isOverheated: false,
        currentEvent: state.currentEvent?.type === 'overheat' ? null : state.currentEvent,
        eventsHandled: state.eventsHandled + 1,
      }));
      get().addLog('熔炉已冷却，可以继续操作。', 'info');
    }, 5000);
  },

  handleContamination: (refresh: boolean) => {
    if (refresh) {
      set((state) => ({
        shards: state.shards.map((shard) => ({ ...shard, contaminated: false })),
        currentEvent: state.currentEvent?.type === 'contamination' ? null : state.currentEvent,
        eventsHandled: state.eventsHandled + 1,
      }));
      get().addLog('污染已清除！', 'success');
      playSuccessSound();
    } else {
      set((state) => ({
        currentEvent: state.currentEvent?.type === 'contamination' ? null : state.currentEvent,
        eventsFailed: state.eventsFailed + 1,
      }));
    }
  },

  handleMuseSilence: () => {
    setTimeout(() => {
      set((state) => ({
        currentEvent: state.currentEvent?.type === 'muse_silence' ? null : state.currentEvent,
        eventsHandled: state.eventsHandled + 1,
      }));
      get().addLog('缪斯归来，灵感恢复！', 'success');
    }, 15000);
  },

  dismissEvent: () => {
    const event = get().currentEvent;
    if (!event) return;

    if (event.type === 'muse_silence') {
      get().handleMuseSilence();
    } else {
      set((state) => ({
        currentEvent: null,
        eventsFailed: state.eventsFailed + 1,
      }));
    }
  },

  startPeriodTimer: () => {
    const timer = setInterval(() => {
      set((state) => {
        const newTime = state.periodTimeRemaining - 1;
        if (newTime <= 0) {
          get().generateEvaluation();
          return { periodTimeRemaining: 0, showEvaluation: true };
        }
        return { periodTimeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(timer);
  },

  startEventTimer: () => {
    const timer = setInterval(() => {
      if (!get().currentEvent) {
        get().triggerEvent();
      }
    }, EVENT_INTERVAL);

    return () => clearInterval(timer);
  },

  startOrderTimers: () => {
    const timer = setInterval(() => {
      set((state) => {
        const updatedOrders = state.orders.map((order) => {
          if (order.completed || order.remainingTime <= 0) return order;
          return { ...order, remainingTime: order.remainingTime - 1 };
        });

        const failedOrders = updatedOrders.filter((o) => !o.completed && o.remainingTime <= 0);
        if (failedOrders.length > 0) {
          failedOrders.forEach((order) => {
            get().addLog(`订单超时失败：${order.title}`, 'failure');
            playFailureSound();
          });
          set((s) => ({ ordersFailed: s.ordersFailed + failedOrders.length }));
        }

        return { orders: updatedOrders };
      });
    }, 1000);

    return () => clearInterval(timer);
  },

  completeOrder: async (orderId: string, casting: RuneCasting) => {
    set((state) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return state;

      const expGain = Math.floor(order.reward / 2);
      
      get().addLog(`订单完成：${order.title} +${order.reward}分 +${expGain}经验`, 'success');
      playSuccessSound();

      return {
        orders: state.orders.map((o) =>
          o.id === orderId ? { ...o, completed: true } : o
        ),
        score: state.score + order.reward,
        experience: state.experience + expGain,
        ordersCompleted: state.ordersCompleted + 1,
      };
    });

    const state = get();
    const expThreshold = state.level * 100;
    if (state.experience >= expThreshold) {
      set((s) => ({ level: s.level + 1, experience: s.experience - expThreshold }));
      get().addLog(`恭喜升级！当前等级：${get().level}`, 'success');
    }
  },

  generateEvaluation: async () => {
    const state = get();
    const report = await getEvaluation();
    
    const totalOrders = state.ordersCompleted + state.ordersFailed;
    const completionRate = totalOrders > 0 ? state.ordersCompleted / totalOrders : 0;
    const avgAttributes = state.castingCount > 0 ? state.totalCastingAttributes / state.castingCount : 0;
    const totalEvents = state.eventsHandled + state.eventsFailed;
    const eventScore = totalEvents > 0 ? (state.eventsHandled / totalEvents) * 100 : 50;

    const modifiedReport: EvaluationReport = {
      ...report,
      period: state.currentPeriod,
      orderCompletionRate: Math.round(completionRate * 100) / 100,
      averageCastingAttributes: Math.round(avgAttributes * 10) / 10,
      eventHandlingScore: Math.round(eventScore * 10) / 10,
    };

    set({ evaluationReport: modifiedReport, showEvaluation: true });
    await saveEvaluation(modifiedReport);
  },

  closeEvaluation: () => {
    set((state) => ({
      showEvaluation: false,
      currentPeriod: state.currentPeriod + 1,
      periodTimeRemaining: PERIOD_DURATION,
    }));
    get().resetPeriodStats();
    get().initGame();
  },

  resetPeriodStats: () => {
    set({
      ordersCompleted: 0,
      ordersFailed: 0,
      totalCastingAttributes: 0,
      castingCount: 0,
      eventsHandled: 0,
      eventsFailed: 0,
      lastCasting: null,
    });
  },
}));

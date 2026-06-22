import { useState, useEffect, useCallback, useRef } from 'react';

export type FaultType = 'leak' | 'clog' | 'thermal' | 'airlock';

export interface Fault {
  id: string;
  type: FaultType;
  name: string;
  description: string;
  duration: number;
  remainingDuration: number;
  affected: string[];
}

export interface Worker {
  id: number;
  name: string;
  fatigue: number;
}

export interface SpareParts {
  valve: number;
  seal: number;
  filter: number;
}

export interface SystemStatus {
  waterLevel: number;
  oxygen: number;
  temperature: number;
  ph: number;
  energy: number;
}

export interface GameEvent {
  id: string;
  round: number;
  time: number;
  type: 'fault' | 'action' | 'round_end' | 'game_end';
  description: string;
  success: boolean;
  reason?: string;
  snapshot?: SystemStatus;
  faults?: Fault[];
  action?: string;
  fault?: string;
}

export interface GameState {
  round: number;
  totalRounds: number;
  score: number;
  running: boolean;
  gameOver: boolean;
  status: SystemStatus;
  statusTrend: { waterLevel: number; oxygen: number; temperature: number; ph: number };
  faults: Fault[];
  spares: SpareParts;
  workers: Worker[];
  events: GameEvent[];
  cooldown: number;
  emergencyProtocol: boolean;
  emergencyDuration: number;
  roundTime: number;
  totalTime: number;
  repairsCompleted: number;
}

const FAULT_CONFIG: Record<FaultType, Omit<Fault, 'id' | 'duration' | 'remainingDuration'>> = {
  leak: {
    type: 'leak',
    name: '水箱泄漏',
    description: '水位下降速度翻倍',
    affected: ['waterLevel']
  },
  clog: {
    type: 'clog',
    name: '管道堵塞',
    description: '水循环速率下降90%',
    affected: ['waterLevel', 'oxygen']
  },
  thermal: {
    type: 'thermal',
    name: '温控失效',
    description: '温度偏离最佳值15°C',
    affected: ['temperature']
  },
  airlock: {
    type: 'airlock',
    name: '气密破损',
    description: '氧气泄漏',
    affected: ['oxygen']
  }
};

const SPARE_PART_MAP: Record<FaultType, keyof SpareParts> = {
  leak: 'valve',
  clog: 'filter',
  thermal: 'valve',
  airlock: 'seal'
};

const INITIAL_STATUS: SystemStatus = {
  waterLevel: 80,
  oxygen: 20,
  temperature: 22,
  ph: 7.2,
  energy: 100
};

const TOTAL_ROUNDS = 10;
const ROUND_DURATION = 30;
const UPDATE_INTERVAL = 500;
const COOLDOWN_DURATION = 3;
const EMERGENCY_DURATION = 10;

export function useGameEngine() {
  const [state, setState] = useState<GameState>({
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    score: 0,
    running: false,
    gameOver: false,
    status: { ...INITIAL_STATUS },
    statusTrend: { waterLevel: 0, oxygen: 0, temperature: 0, ph: 0 },
    faults: [],
    spares: { valve: 3, seal: 3, filter: 3 },
    workers: [
      { id: 1, name: '工程师甲', fatigue: 0 },
      { id: 2, name: '工程师乙', fatigue: 0 }
    ],
    events: [],
    cooldown: 0,
    emergencyProtocol: false,
    emergencyDuration: 0,
    roundTime: 0,
    totalTime: 0,
    repairsCompleted: 0
  });

  const lastUpdateRef = useRef<number>(Date.now());
  const faultTimerRef = useRef<number>(0);
  const nextFaultTimeRef = useRef<number>(generateNextFaultTime());

  function generateNextFaultTime() {
    return 3 + Math.random() * 2;
  }

  function generateFault() {
    const types: FaultType[] = ['leak', 'clog', 'thermal', 'airlock'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = FAULT_CONFIG[type];
    const duration = 10 + Math.random() * 5;
    return {
      id: `fault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...config,
      duration,
      remainingDuration: duration
    };
  }

  const startGame = useCallback(() => {
    setState({
      round: 1,
      totalRounds: TOTAL_ROUNDS,
      score: 0,
      running: true,
      gameOver: false,
      status: { ...INITIAL_STATUS },
      statusTrend: { waterLevel: 0, oxygen: 0, temperature: 0, ph: 0 },
      faults: [],
      spares: { valve: 3, seal: 3, filter: 3 },
      workers: [
        { id: 1, name: '工程师甲', fatigue: 0 },
        { id: 2, name: '工程师乙', fatigue: 0 }
      ],
      events: [],
      cooldown: 0,
      emergencyProtocol: false,
      emergencyDuration: 0,
      roundTime: 0,
      totalTime: 0,
      repairsCompleted: 0
    });
    lastUpdateRef.current = Date.now();
    faultTimerRef.current = 0;
    nextFaultTimeRef.current = generateNextFaultTime();
  }, []);

  const dispatchWorker = useCallback((faultId: string) => {
    setState(prev => {
      if (prev.cooldown > 0 || prev.gameOver) return prev;
      const fault = prev.faults.find(f => f.id === faultId);
      if (!fault) return prev;
      const availableWorker = prev.workers.find(w => w.fatigue <= 80);
      if (!availableWorker) {
        return {
          ...prev,
          events: [
            ...prev.events,
            {
              id: `evt-${Date.now()}`,
              round: prev.round,
              time: prev.totalTime,
              type: 'action' as const,
              description: `无法派遣工人修复${fault.name}：所有工人疲劳度过高`,
              success: false,
              reason: '工人疲劳度过高',
              action: 'dispatch_worker_fail'
            },
            ...prev.events
          ]
        };
      }

      const newFaults = prev.faults.map(f =>
        f.id === faultId ? { ...f, remainingDuration: Math.max(0, f.remainingDuration - 5) } : f
      );

      const wasRepaired = newFaults.find(f => f.id === faultId)?.remainingDuration === 0;
      const finalFaults = wasRepaired ? newFaults.filter(f => f.id !== faultId) : newFaults;

      const newWorkers = prev.workers.map(w =>
        w.id === availableWorker.id ? { ...w, fatigue: Math.min(100, w.fatigue + 20) } : w
      );

      return {
        ...prev,
        faults: finalFaults,
        workers: newWorkers,
        cooldown: COOLDOWN_DURATION,
        repairsCompleted: wasRepaired ? prev.repairsCompleted + 1 : prev.repairsCompleted,
        events: [
          {
            id: `evt-${Date.now()}`,
            round: prev.round,
            time: prev.totalTime,
            type: 'action' as const,
            description: `派遣${availableWorker.name}修复${fault.name}${wasRepaired ? '（完成）' : '（加速修复）'}`,
            success: true,
            action: 'dispatch_worker',
            fault: fault.name
          },
          ...prev.events
        ]
      };
    });
  }, []);

  const useSparePart = useCallback((faultId: string) => {
    setState(prev => {
      if (prev.cooldown > 0 || prev.gameOver) return prev;
      const fault = prev.faults.find(f => f.id === faultId);
      if (!fault) return prev;
      const partType = SPARE_PART_MAP[fault.type];
      if (prev.spares[partType] <= 0) {
        return {
          ...prev,
          events: [
            {
              id: `evt-${Date.now()}`,
              round: prev.round,
              time: prev.totalTime,
              type: 'action' as const,
              description: `无法使用备件修复${fault.name}：备件不足`,
              success: false,
              reason: '备件不足',
              action: 'use_spare_fail'
            },
            ...prev.events
          ]
        };
      }

      const newSpares = {
        ...prev.spares,
        [partType]: prev.spares[partType] - 1
      };

      return {
        ...prev,
        faults: prev.faults.filter(f => f.id !== faultId),
        spares: newSpares,
        cooldown: COOLDOWN_DURATION,
        repairsCompleted: prev.repairsCompleted + 1,
        events: [
          {
            id: `evt-${Date.now()}`,
            round: prev.round,
            time: prev.totalTime,
            type: 'action' as const,
            description: `使用备件修复${fault.name}（立即完成）`,
            success: true,
            action: 'use_spare',
            fault: fault.name
          },
          ...prev.events
        ]
      };
    });
  }, []);

  const activateEmergency = useCallback(() => {
    setState(prev => {
      if (prev.cooldown > 0 || prev.emergencyProtocol || prev.gameOver) return prev;
      if (prev.status.energy < 10) {
        return {
          ...prev,
          events: [
            {
              id: `evt-${Date.now()}`,
              round: prev.round,
              time: prev.totalTime,
              type: 'action' as const,
              description: '无法启动紧急协议：能源不足',
              success: false,
              reason: '能源不足',
              action: 'emergency_fail'
            },
            ...prev.events
          ]
        };
      }

      return {
        ...prev,
        status: { ...prev.status, energy: prev.status.energy - 10 },
        emergencyProtocol: true,
        emergencyDuration: EMERGENCY_DURATION,
        cooldown: COOLDOWN_DURATION,
        events: [
          {
            id: `evt-${Date.now()}`,
            round: prev.round,
            time: prev.totalTime,
            type: 'action' as const,
            description: '启动紧急协议：10秒内所有故障效果减半',
            success: true,
            action: 'emergency'
          },
          ...prev.events
        ]
      };
    });
  }, []);

  useEffect(() => {
    if (!state.running || state.gameOver) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      setState(prev => {
        if (!prev.running || prev.gameOver) return prev;

        const dt = delta;
        const effectMultiplier = prev.emergencyProtocol ? 0.5 : 1;

        let { waterLevel, oxygen, temperature, ph, energy } = prev.status;
        let waterTrend = 0;
        let oxygenTrend = 0;
        let tempTrend = 0;
        let phTrend = 0;

        const baseWaterDecrease = 0.3;
        const baseOxygenDecrease = 0.05;
        const baseTempRestore = 0.1;

        let waterDec = baseWaterDecrease;
        let oxyDec = baseOxygenDecrease;

        if (prev.faults.some(f => f.type === 'leak')) {
          waterDec *= 2 * effectMultiplier;
        }
        if (prev.faults.some(f => f.type === 'clog')) {
          waterDec *= 1.5 * effectMultiplier;
          oxyDec *= 1.3 * effectMultiplier;
        }
        if (prev.faults.some(f => f.type === 'airlock')) {
          oxyDec *= 3 * effectMultiplier;
        }

        waterLevel = Math.max(0, waterLevel - waterDec * dt);
        oxygen = Math.max(0, oxygen - oxyDec * dt);
        waterTrend = -waterDec;
        oxygenTrend = -oxyDec;

        const targetTemp = 22;
        const thermalFault = prev.faults.find(f => f.type === 'thermal');
        if (thermalFault) {
          const offset = 15 * effectMultiplier;
          if (temperature < targetTemp) {
            temperature = Math.min(targetTemp + offset, temperature + baseTempRestore * dt * 2);
          } else {
            temperature = targetTemp + offset;
          }
          tempTrend = temperature > targetTemp ? 1 : -1;
        } else {
          if (temperature > targetTemp) {
            temperature = Math.max(targetTemp, temperature - baseTempRestore * dt);
            tempTrend = -baseTempRestore;
          } else if (temperature < targetTemp) {
            temperature = Math.min(targetTemp, temperature + baseTempRestore * dt);
            tempTrend = baseTempRestore;
          } else {
            tempTrend = 0;
          }
        }
        temperature = Math.max(-10, Math.min(40, temperature));

        const targetPh = 7.2;
        const phDrift = 0.01 * dt;
        if (ph > targetPh) {
          ph = Math.max(targetPh, ph - phDrift);
          phTrend = -phDrift / dt;
        } else if (ph < targetPh) {
          ph = Math.min(targetPh, ph + phDrift);
          phTrend = phDrift / dt;
        }

        energy = Math.max(0, energy - 0.05 * dt);

        const newFaults = prev.faults
          .map(f => ({
            ...f,
            remainingDuration: f.remainingDuration - dt
          }))
          .filter(f => f.remainingDuration > 0);

        const resolvedFaults = prev.faults.filter(f => f.remainingDuration > 0 && f.remainingDuration - dt <= 0);

        const newCooldown = Math.max(0, prev.cooldown - dt);

        let emergencyDuration = prev.emergencyDuration;
        let emergencyProtocol = prev.emergencyProtocol;
        if (emergencyProtocol) {
          emergencyDuration -= dt;
          if (emergencyDuration <= 0) {
            emergencyProtocol = false;
            emergencyDuration = 0;
          }
        }

        const roundTime = prev.roundTime + dt;
        const totalTime = prev.totalTime + dt;

        let newRound = prev.round;
        let newEvents = [...prev.events];

        faultTimerRef.current += dt;
        if (faultTimerRef.current >= nextFaultTimeRef.current && newFaults.length < 3) {
          faultTimerRef.current = 0;
          nextFaultTimeRef.current = generateNextFaultTime();
          const newFault = generateFault();
          newFaults.push(newFault);
          newEvents = [
            {
              id: `evt-${Date.now()}-${Math.random()}`,
              round: prev.round,
              time: totalTime,
              type: 'fault' as const,
              description: `故障发生：${newFault.name}`,
              success: false,
              fault: newFault.name
            },
            ...newEvents
          ];
        }

        resolvedFaults.forEach(fault => {
          newEvents = [
            {
              id: `evt-${Date.now()}-${Math.random()}`,
              round: prev.round,
              time: totalTime,
              type: 'fault' as const,
              description: `故障自行恢复：${fault.name}`,
              success: true,
              fault: fault.name
            },
            ...newEvents
          ];
        });

        if (roundTime >= ROUND_DURATION) {
          newRound = prev.round + 1;
          faultTimerRef.current = 0;
          nextFaultTimeRef.current = generateNextFaultTime();

          const roundScore = calculateRoundScore(prev, roundTime);

          newEvents = [
            {
              id: `evt-round-${prev.round}`,
              round: prev.round,
              time: totalTime,
              type: 'round_end' as const,
              description: `第${prev.round}轮结束 - 得分: ${roundScore}`,
              success: prev.status.waterLevel > 20 && prev.status.oxygen > 10,
              snapshot: { ...prev.status, waterLevel, oxygen, temperature, ph, energy },
              faults: [...newFaults]
            },
            ...newEvents
          ];

          if (newRound > TOTAL_ROUNDS) {
            const finalScore = calculateFinalScore({
              ...prev,
              status: { waterLevel, oxygen, temperature, ph, energy },
              totalTime,
              events: newEvents
            });

            newEvents = [
              {
                id: 'evt-game-end',
                round: prev.round,
                time: totalTime,
                type: 'game_end' as const,
                description: `游戏结束 - 总得分: ${finalScore}`,
                success: finalScore > 500,
                snapshot: { waterLevel, oxygen, temperature, ph, energy }
              },
              ...newEvents
            ];

            return {
              ...prev,
              status: { waterLevel, oxygen, temperature, ph, energy },
              statusTrend: { waterLevel: waterTrend, oxygen: oxygenTrend, temperature: tempTrend, ph: phTrend },
              faults: newFaults,
              events: newEvents,
              cooldown: newCooldown,
              emergencyProtocol,
              emergencyDuration,
              roundTime: 0,
              totalTime,
              score: prev.score + roundScore + finalScore,
              gameOver: true,
              running: false
            };
          }

          return {
            ...prev,
            round: newRound,
            status: { waterLevel, oxygen, temperature, ph, energy },
            statusTrend: { waterLevel: waterTrend, oxygen: oxygenTrend, temperature: tempTrend, ph: phTrend },
            faults: newFaults,
            events: newEvents,
            cooldown: newCooldown,
            emergencyProtocol,
            emergencyDuration,
            roundTime: 0,
            totalTime,
            score: prev.score + roundScore
          };
        }

        if (waterLevel <= 0 || oxygen <= 0) {
          newEvents = [
            {
              id: 'evt-game-over-critical',
              round: prev.round,
              time: totalTime,
              type: 'game_end' as const,
              description: `系统崩溃！${waterLevel <= 0 ? '水位归零' : '氧气耗尽'}，游戏失败`,
              success: false,
              reason: waterLevel <= 0 ? '水位归零' : '氧气耗尽',
              snapshot: { waterLevel, oxygen, temperature, ph, energy }
            },
            ...newEvents
          ];

          return {
            ...prev,
            status: { waterLevel, oxygen, temperature, ph, energy },
            statusTrend: { waterLevel: waterTrend, oxygen: oxygenTrend, temperature: tempTrend, ph: phTrend },
            faults: newFaults,
            events: newEvents,
            cooldown: newCooldown,
            emergencyProtocol,
            emergencyDuration,
            roundTime,
            totalTime,
            gameOver: true,
            running: false
          };
        }

        return {
          ...prev,
          status: { waterLevel, oxygen, temperature, ph, energy },
          statusTrend: { waterLevel: waterTrend, oxygen: oxygenTrend, temperature: tempTrend, ph: phTrend },
          faults: newFaults,
          events: newEvents,
          cooldown: newCooldown,
          emergencyProtocol,
          emergencyDuration,
          roundTime,
          totalTime
        };
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [state.running, state.gameOver]);

  useEffect(() => {
    if (state.gameOver || !state.running) return;

    const fatigueInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        workers: prev.workers.map(w => ({
          ...w,
          fatigue: Math.max(0, w.fatigue - 0.5)
        }))
      }));
    }, 1000);

    return () => clearInterval(fatigueInterval);
  }, [state.gameOver, state.running]);

  function calculateRoundScore(prev: GameState, roundTime: number): number {
    let score = 0;
    score += Math.floor(prev.status.waterLevel * 2);
    score += Math.floor(prev.status.oxygen * 5);
    score += Math.floor(prev.status.energy);
    score += prev.repairsCompleted * 10;
    score += Math.floor(roundTime * 0.5);
    return score;
  }

  function calculateFinalScore(state: GameState & { totalTime: number }): number {
    let score = 0;
    score += Math.floor(state.totalTime * 2);
    score += state.spares.valve * 20;
    score += state.spares.seal * 20;
    score += state.spares.filter * 20;
    score += state.repairsCompleted * 30;
    score += state.workers.reduce((sum, w) => sum + Math.floor((100 - w.fatigue) * 2), 0);
    return score;
  }

  return {
    state,
    startGame,
    dispatchWorker,
    useSparePart,
    activateEmergency
  };
}

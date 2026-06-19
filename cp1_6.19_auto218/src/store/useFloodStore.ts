import { create } from 'zustand';
import type { GridCell, FloodEvent, RiskLevel } from '@/types';
import { calculateWaterFlow, generateElevationGrid, GRID_SIZE } from '@/modules/flood-risk/floodCalculator';

interface FloodState {
  grid: GridCell[][];
  avgDepth: number;
  highRiskCount: number;
  rainfallRate: number;
  events: FloodEvent[];
  lastRiskLevel: RiskLevel;
  eventCounter: number;
  rainElapsedSeconds: number;
  updateGrid: (rainfallMmPerHour: number, intensity: number, delta: number) => void;
  reset: () => void;
}

function classifyRisk(avgDepth: number, highRiskCount: number): RiskLevel {
  if (highRiskCount > GRID_SIZE * GRID_SIZE * 0.1 || avgDepth > 8) return 'danger';
  if (highRiskCount > 3 || avgDepth > 3) return 'warning';
  return 'low';
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export const useFloodStore = create<FloodState>((set, get) => ({
  grid: generateElevationGrid(),
  avgDepth: 0,
  highRiskCount: 0,
  rainfallRate: 0,
  events: [],
  lastRiskLevel: 'low',
  eventCounter: 0,
  rainElapsedSeconds: 0,

  updateGrid: (rainfallMmPerHour: number, intensity: number, delta: number) => {
    const state = get();
    const newElapsed = state.rainElapsedSeconds + delta;
    const result = calculateWaterFlow(
      state.grid,
      rainfallMmPerHour,
      intensity,
      delta,
    );

    const newLevel = classifyRisk(result.avgDepth, result.highRiskCount);
    const newEvents = [...state.events];
    let newCounter = state.eventCounter;

    if (newLevel !== state.lastRiskLevel && newLevel !== 'low') {
      newCounter += 1;
      newEvents.push({
        id: newCounter,
        timestamp: Date.now(),
        level: newLevel,
        cellCount: result.highRiskCount,
        message: `${formatTime(Date.now())} 风险等级变更: ${newLevel === 'danger' ? '危险' : '预警'} · ${result.highRiskCount}个区域受影响`,
      });
      if (newEvents.length > 10) newEvents.splice(0, newEvents.length - 10);
    }

    set({
      grid: result.grid,
      avgDepth: result.avgDepth,
      highRiskCount: result.highRiskCount,
      rainfallRate: rainfallMmPerHour * intensity,
      rainElapsedSeconds: newElapsed,
      lastRiskLevel: newLevel,
      events: newEvents,
      eventCounter: newCounter,
    });
  },

  reset: () => {
    set({
      grid: generateElevationGrid(),
      avgDepth: 0,
      highRiskCount: 0,
      rainfallRate: 0,
      events: [],
      lastRiskLevel: 'low',
      eventCounter: 0,
      rainElapsedSeconds: 0,
    });
  },
}));

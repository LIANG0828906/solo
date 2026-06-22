import { v4 as uuidv4 } from 'uuid';
import type {
  CoolingSolution,
  SimParams,
  SimMetrics,
  ThermalResult,
  ParticleData,
} from './types';
import { COOLING_SOLUTIONS } from './types';
import { ThermalEngine } from './ThermalEngine';
import { FlowFieldModule } from './FlowFieldModule';

type TempListener = (result: ThermalResult, stats: { tMin: number; tMax: number }) => void;
type MetricsListener = (metrics: SimMetrics) => void;
type ParticlesListener = (data: ParticleData) => void;

const COMPUTE_INTERVAL = 100;

export class SimulationManager {
  private params: SimParams;
  private metrics: SimMetrics;
  private readonly engine: ThermalEngine;
  private readonly flowModule: FlowFieldModule;
  private lastResult: ThermalResult | null;
  private lastStats: { tMin: number; tMax: number } | null;
  private lastParticleData: ParticleData | null;
  private tempListeners: Map<string, TempListener>;
  private metricsListeners: Map<string, MetricsListener>;
  private particleListeners: Map<string, ParticlesListener>;
  private computeTimer: number | null;
  private rafId: number | null;
  private lastComputeTime: number;
  private pendingTransition: { start: number; duration: number } | null;
  private noCoolingBaseline: number | null;

  constructor() {
    this.params = {
      solution: 'copper_heat_sink',
      power: 25,
      ambientTemp: 25,
    };
    this.metrics = {
      maxTemp: 0, avgTemp: 0, thermalResistance: 0, coolingEfficiency: 0, noCoolingMaxTemp: 0,
    };
    this.engine = new ThermalEngine();
    this.flowModule = new FlowFieldModule(5000);
    this.lastResult = null;
    this.lastStats = null;
    this.lastParticleData = null;
    this.tempListeners = new Map();
    this.metricsListeners = new Map();
    this.particleListeners = new Map();
    this.computeTimer = null;
    this.rafId = null;
    this.lastComputeTime = 0;
    this.pendingTransition = null;
    this.noCoolingBaseline = null;
    this.computeBaseline();
  }

  private computeBaseline(): void {
    const baselineProps = {
      thermalConductivity: 5,
      convectionCoeff: 3,
      particleDensity: 0.3,
      label: 'baseline',
      shortLabel: 'base',
    };
    const prevSol = this.engine;
    this.engine.setSolution(baselineProps);
    const res = prevSol.compute(this.params.power, this.params.ambientTemp);
    let tMax = -Infinity;
    for (const n of res.nodePositions) {
      if (n.region !== 'chip') continue;
      const t = this.engine.sampleTemp(n.pos, res.temperatures);
      if (t > tMax) tMax = t;
    }
    this.noCoolingBaseline = isFinite(tMax) ? tMax : 150;
  }

  setParams(params: Partial<SimParams>): void {
    const p1 = params as unknown as Record<string, unknown>;
    const p2 = this.params as unknown as Record<string, unknown>;
    const changed = Object.keys(p1).some(k => p1[k] !== p2[k]);
    if (!changed) return;
    const solChanged = params.solution !== undefined && params.solution !== this.params.solution;
    this.params = { ...this.params, ...params };
    if (solChanged) {
      this.pendingTransition = { start: performance.now(), duration: 500 };
    }
    if (params.power !== undefined) {
      this.computeBaseline();
    }
    this.triggerCompute(true);
  }

  getParams(): SimParams {
    return { ...this.params };
  }

  getMetrics(): SimMetrics {
    return { ...this.metrics };
  }

  getLastResult(): { result: ThermalResult | null; stats: { tMin: number; tMax: number } | null } {
    return { result: this.lastResult, stats: this.lastStats };
  }

  subscribeTemps(fn: TempListener): () => void {
    const id = uuidv4();
    this.tempListeners.set(id, fn);
    if (this.lastResult && this.lastStats) {
      try { fn(this.lastResult, this.lastStats); } catch { /* noop */ }
    }
    return () => this.tempListeners.delete(id);
  }

  subscribeMetrics(fn: MetricsListener): () => void {
    const id = uuidv4();
    this.metricsListeners.set(id, fn);
    try { fn(this.metrics); } catch { /* noop */ }
    return () => this.metricsListeners.delete(id);
  }

  subscribeParticles(fn: ParticlesListener): () => void {
    const id = uuidv4();
    this.particleListeners.set(id, fn);
    if (this.lastParticleData) {
      try { fn(this.lastParticleData); } catch { /* noop */ }
    }
    return () => this.particleListeners.delete(id);
  }

  getFlowModule(): FlowFieldModule {
    return this.flowModule;
  }

  getThermalEngine(): ThermalEngine {
    return this.engine;
  }

  getTransitionProgress(): number {
    if (!this.pendingTransition) return 1;
    const t = (performance.now() - this.pendingTransition.start) / this.pendingTransition.duration;
    if (t >= 1) {
      this.pendingTransition = null;
      return 1;
    }
    return t;
  }

  private triggerCompute(force: boolean = false): void {
    const now = performance.now();
    if (!force && now - this.lastComputeTime < COMPUTE_INTERVAL) return;
    this.lastComputeTime = now;
    this.runCompute();
  }

  private runCompute(): void {
    const solProps = COOLING_SOLUTIONS[this.params.solution];
    this.engine.setSolution(solProps);
    const result = this.engine.compute(this.params.power, this.params.ambientTemp);

    let tMin = Infinity;
    let tMax = -Infinity;
    let sum = 0;
    let count = 0;
    let chipMax = -Infinity;
    let chipSum = 0;
    let chipCount = 0;
    for (const n of result.nodePositions) {
      const t = this.engine.sampleTemp(n.pos, result.temperatures);
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
      sum += t; count++;
      if (n.region === 'chip') {
        if (t > chipMax) chipMax = t;
        chipSum += t; chipCount++;
      }
    }
    const stats = { tMin: isFinite(tMin) ? tMin : this.params.ambientTemp, tMax: isFinite(tMax) ? tMax : this.params.ambientTemp + 50 };
    const avg = count > 0 ? sum / count : this.params.ambientTemp;
    const cMax = isFinite(chipMax) ? chipMax : stats.tMax;
    const cAvg = chipCount > 0 ? chipSum / chipCount : avg;
    const deltaT = cMax - this.params.ambientTemp;
    const rTh = this.params.power > 0 ? deltaT / this.params.power : 0;
    const noCool = this.noCoolingBaseline ?? (this.params.ambientTemp + 120);
    const denom = Math.max(0.1, noCool - this.params.ambientTemp);
    const eff = Math.max(0, Math.min(100, 100 * (noCool - cMax) / denom));
    const newMetrics: SimMetrics = {
      maxTemp: cMax,
      avgTemp: cAvg,
      thermalResistance: rTh,
      coolingEfficiency: eff,
      noCoolingMaxTemp: noCool,
    };

    this.lastResult = result;
    this.lastStats = stats;
    this.metrics = newMetrics;

    for (const fn of this.tempListeners.values()) {
      try { fn(result, stats); } catch { /* noop */ }
    }
    for (const fn of this.metricsListeners.values()) {
      try { fn(newMetrics); } catch { /* noop */ }
    }

    const particleData = this.flowModule.generate(this.engine, result, solProps.particleDensity);
    this.lastParticleData = particleData;
    for (const fn of this.particleListeners.values()) {
      try { fn(particleData); } catch { /* noop */ }
    }
  }

  animateParticles(dt: number): void {
    const data = this.flowModule.animate(dt);
    if (!data) return;
    this.lastParticleData = data;
    for (const fn of this.particleListeners.values()) {
      try { fn(data); } catch { /* noop */ }
    }
  }

  start(): void {
    this.stop();
    this.triggerCompute(true);
    this.computeTimer = window.setInterval(() => this.triggerCompute(false), COMPUTE_INTERVAL);
    let lastTime = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      this.animateParticles(dt);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.computeTimer !== null) {
      clearInterval(this.computeTimer);
      this.computeTimer = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  exportSnapshot(): object {
    const params = this.getParams();
    const metrics = this.getMetrics();
    const result = this.lastResult;
    const temperatures: Record<string, number> = {};
    const nodes: Array<{ pos: [number, number, number]; region: string; temp: number }> = [];
    if (result) {
      for (const n of result.nodePositions) {
        const t = this.engine.sampleTemp(n.pos, result.temperatures);
        const key = `${n.pos[0].toFixed(2)},${n.pos[1].toFixed(2)},${n.pos[2].toFixed(2)}`;
        temperatures[key] = Number(t.toFixed(3));
        nodes.push({
          pos: [Number(n.pos[0].toFixed(3)), Number(n.pos[1].toFixed(3)), Number(n.pos[2].toFixed(3))],
          region: n.region,
          temp: Number(t.toFixed(3)),
        });
      }
    }
    const snapshot = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      params,
      metrics,
      stats: this.lastStats,
      solution: COOLING_SOLUTIONS[params.solution],
      nodes,
      temperatureMap: temperatures,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thermal_snapshot_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return snapshot;
  }
}

import { useCanvasStore, ColorBlock } from '@/store/canvasStore';
import { rgbToAudioParams } from '@/utils/colorUtils';

interface SourceChain {
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  masterGain: GainNode;
  replayLfo?: OscillatorNode;
  replayGain?: GainNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterBus: GainNode | null = null;
  private sources: Map<string, SourceChain> = new Map();
  private unsubscribe: (() => void) | null = null;
  private initialized = false;
  private replayTimers: Map<string, number> = new Map();

  async init() {
    if (this.initialized) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.masterBus = this.ctx.createGain();
    this.masterBus.gain.value = 1.0;
    this.masterBus.connect(this.ctx.destination);
    this.initialized = true;

    this.syncAll();

    this.unsubscribe = useCanvasStore.subscribe(
      (state) => [state.colorBlocks, state.userVolumes, state.isPlaying] as const,
      ([blocks, _vols, isPlaying], prev) => {
        const prevBlocks = prev?.[0] || [];
        const prevPlaying = prev?.[2];
        this.handleBlocksChange(prevBlocks, blocks);
        this.handlePlayingChange(prevPlaying, isPlaying);
        this.updateAllVolumes();
      },
    );
  }

  private ensureContextRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createSourceChain(block: ColorBlock): SourceChain {
    if (!this.ctx || !this.masterBus) throw new Error('Context not initialized');
    const area = Math.PI * block.radius * block.radius;
    const { frequency, harmonicCount, volume } = rgbToAudioParams(block.color, area);
    const masterGain = this.ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(this.masterBus);

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    const types: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];
    for (let i = 0; i < harmonicCount; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = types[i % types.length];
      osc.frequency.value = frequency * (i + 1);
      const g = this.ctx.createGain();
      const harmonicGain = volume / (i + 1);
      g.gain.value = 0;
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      const now = this.ctx.currentTime;
      const target = harmonicGain;
      g.gain.setTargetAtTime(target, now, 0.1);
      oscillators.push(osc);
      gainNodes.push(g);
    }

    const now = this.ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.setTargetAtTime(1, now, 0.05);

    return { oscillators, gainNodes, masterGain };
  }

  private destroySourceChain(id: string, fast = false) {
    const chain = this.sources.get(id);
    if (!chain) return;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      chain.masterGain.gain.cancelScheduledValues(now);
      chain.masterGain.gain.setValueAtTime(Math.max(0.0001, chain.masterGain.gain.value), now);
      const duration = fast ? 0.05 : 0.6;
      chain.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      setTimeout(() => {
        for (const osc of chain.oscillators) {
          try { osc.stop(); } catch { /* ignore */ }
          try { osc.disconnect(); } catch { /* ignore */ }
        }
        for (const g of chain.gainNodes) {
          try { g.disconnect(); } catch { /* ignore */ }
        }
        try { chain.masterGain.disconnect(); } catch { /* ignore */ }
        if (chain.replayLfo) { try { chain.replayLfo.stop(); chain.replayLfo.disconnect(); } catch { /* ignore */ } }
        if (chain.replayGain) { try { chain.replayGain.disconnect(); } catch { /* ignore */ } }
      }, duration * 1000 + 50);
    }
    this.sources.delete(id);
  }

  private handleBlocksChange(prev: ColorBlock[], curr: ColorBlock[]) {
    if (!this.ctx) return;
    const prevIds = new Set(prev.map((b) => b.id));
    const currIds = new Set(curr.map((b) => b.id));

    for (const id of currIds) {
      if (!prevIds.has(id)) {
        const block = curr.find((b) => b.id === id);
        if (block) {
          this.ensureContextRunning();
          const chain = this.createSourceChain(block);
          this.sources.set(id, chain);
        }
      }
    }

    for (const id of prevIds) {
      if (!currIds.has(id)) {
        this.destroySourceChain(id, false);
      }
    }

    const disappearing = new Set(
      curr.filter((b) => b.animationState === 'disappearing').map((b) => b.id),
    );
    for (const id of disappearing) {
      if (this.sources.has(id)) {
        const chain = this.sources.get(id)!;
        if (this.ctx) {
          const now = this.ctx.currentTime;
          chain.masterGain.gain.cancelScheduledValues(now);
          chain.masterGain.gain.setValueAtTime(Math.max(0.0001, chain.masterGain.gain.value), now);
          chain.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
        }
      }
    }
  }

  private handlePlayingChange(prev: boolean | undefined, curr: boolean) {
    if (!this.ctx || !this.masterBus) return;
    if (prev === curr) return;
    const now = this.ctx.currentTime;
    this.masterBus.gain.cancelScheduledValues(now);
    this.masterBus.gain.setValueAtTime(Math.max(0.0001, this.masterBus.gain.value), now);
    if (curr) {
      this.ensureContextRunning();
      this.masterBus.gain.setTargetAtTime(1.0, now, 0.08);
    } else {
      this.masterBus.gain.setTargetAtTime(0.0, now, 0.08);
    }
  }

  private updateAllVolumes() {
    if (!this.ctx) return;
    const state = useCanvasStore.getState();
    for (const block of state.colorBlocks) {
      const chain = this.sources.get(block.id);
      if (!chain) continue;
      const userVolume = (state.userVolumes[block.id] ?? 80) / 100;
      const area = Math.PI * block.radius * block.radius;
      const { volume } = rgbToAudioParams(block.color, area);
      const targetMaster = state.isPlaying ? userVolume : 0;
      const now = this.ctx.currentTime;
      chain.masterGain.gain.setTargetAtTime(targetMaster, now, 0.05);
      const types: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];
      const { harmonicCount } = rgbToAudioParams(block.color, area);
      for (let i = 0; i < chain.gainNodes.length; i++) {
        const type = types[i % types.length];
        const base = volume / (i + 1);
        const scaled = type === 'square' || type === 'sawtooth' ? base * 0.4 : base;
        chain.gainNodes[i].gain.setTargetAtTime(scaled, now, 0.1);
      }
      if (chain.gainNodes.length !== harmonicCount && harmonicCount <= 8) {
        // dynamic adjustment skipped for simplicity: harmonicCount changes via saturation only via store mutation
      }
    }
  }

  triggerReplay(blockId: string) {
    if (!this.ctx) return;
    this.ensureContextRunning();
    const chain = this.sources.get(blockId);
    if (!chain) return;

    const now = this.ctx.currentTime;

    if (this.replayTimers.has(blockId)) {
      clearTimeout(this.replayTimers.get(blockId));
    }

    const state = useCanvasStore.getState();
    const block = state.colorBlocks.find((b) => b.id === blockId);
    if (!block) return;
    const area = Math.PI * block.radius * block.radius;
    const { volume, harmonicCount } = rgbToAudioParams(block.color, area);
    const types: OscillatorType[] = ['sine', 'triangle', 'square', 'sawtooth'];

    for (let i = 0; i < chain.gainNodes.length; i++) {
      const g = chain.gainNodes[i];
      const type = types[i % types.length];
      const base = volume / (i + 1);
      const scaled = type === 'square' || type === 'sawtooth' ? base * 0.4 : base;
      const burst = scaled * 1.8;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
      g.gain.linearRampToValueAtTime(burst, now + 0.04);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, scaled), now + 0.5);
    }
    void harmonicCount;

    const timer = window.setTimeout(() => {
      this.updateAllVolumes();
      this.replayTimers.delete(blockId);
    }, 520);
    this.replayTimers.set(blockId, timer);
  }

  syncAll() {
    if (!this.initialized) return;
    const state = useCanvasStore.getState();
    const ids = new Set(state.colorBlocks.map((b) => b.id));
    for (const existingId of Array.from(this.sources.keys())) {
      if (!ids.has(existingId)) {
        this.destroySourceChain(existingId, true);
      }
    }
    for (const block of state.colorBlocks) {
      if (!this.sources.has(block.id)) {
        const chain = this.createSourceChain(block);
        this.sources.set(block.id, chain);
      }
    }
    if (this.masterBus && this.ctx) {
      this.masterBus.gain.setTargetAtTime(state.isPlaying ? 1 : 0, this.ctx.currentTime, 0.02);
    }
    this.updateAllVolumes();
  }

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    for (const id of Array.from(this.sources.keys())) {
      this.destroySourceChain(id, true);
    }
    for (const t of this.replayTimers.values()) clearTimeout(t);
    this.replayTimers.clear();
    if (this.masterBus) {
      try { this.masterBus.disconnect(); } catch { /* ignore */ }
      this.masterBus = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch { /* ignore */ }
      this.ctx = null;
    }
    this.initialized = false;
  }
}

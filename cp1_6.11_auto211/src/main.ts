import {
  PERFUMES,
  getPerfumeById,
  FormulaItem,
  FormulaManager,
  SavedFormula,
  blendFormulaColors,
  getWeightedDecay
} from './perfumeData';
import {
  ParticleSystem,
  FlyingParticleSystem,
  calculateIntensity
} from './animation';
import {
  Renderer,
  RenderState,
  getLayout
} from './renderer';

class AudioManager {
  ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicInterval: number | null = null;
  private musicActive = false;
  private lastSfxTime = 0;

  ensure() {
    if (this.ctx) return;
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx: AudioContext = new AC();
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.35;
    this.masterGain.connect(ctx.destination);
  }

  resume() {
    this.ensure();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  playSift(total: number) {
    this.ensure();
    if (!this.ctx || !this.masterGain) return;
    const now = performance.now();
    if (now - this.lastSfxTime < 40) return;
    this.lastSfxTime = now;

    const sampleRate = this.ctx.sampleRate;
    const dur = 0.08;
    const buf = this.ctx.createBuffer(1, sampleRate * dur, sampleRate);
    const data = buf.getChannelData(0);
    const baseFreq = 2000 + Math.min(4000, total * 80);
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      const env = Math.exp(-t * 40);
      data[i] = (Math.random() * 2 - 1) * env * (0.5 + 0.5 * Math.sin(2 * Math.PI * baseFreq * t));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = baseFreq;
    bp.Q.value = 2;
    const g = this.ctx.createGain();
    g.gain.value = 0.25;
    src.connect(bp).connect(g).connect(this.masterGain);
    src.start();
  }

  startMusic() {
    this.ensure();
    if (!this.ctx || this.musicActive) return;
    this.musicActive = true;
    const notes = [196.00, 220.00, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00];
    const playNote = () => {
      if (!this.musicActive || !this.ctx || !this.masterGain) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 2;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.18, now + 0.05);
      g.gain.exponentialRampToValueAtTime(0.002, now + 3.5);
      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(0.05, now + 0.08);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.connect(g).connect(this.masterGain);
      osc2.connect(g2).connect(this.masterGain);
      osc.start(now); osc2.start(now);
      osc.stop(now + 3.6); osc2.stop(now + 2.6);
    };
    playNote();
    this.musicInterval = window.setInterval(playNote, 2800);
  }

  stopMusic() {
    this.musicActive = false;
    if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; }
  }
}

type AppState = 'idle' | 'mixing' | 'ready' | 'burning';

class App {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  renderer: Renderer;
  particles: ParticleSystem;
  flyingParticles: FlyingParticleSystem;
  audio: AudioManager;

  width = 0;
  height = 0;

  appState: AppState = 'idle';
  formulaItems: FormulaItem[] = PERFUMES.map(p => ({ perfumeId: p.id, grams: 0 }));
  activePerfumeId: string | null = null;
  sliderValue = 0;
  sliderOpenPulse = 0;
  hoverBambooId: string | null = null;
  mixingProgress = 0;
  pestleRotation = 0;
  pestleTilt = 0;
  burningElapsed = 0;
  curveData: number[] = [];
  savedFormulas: SavedFormula[] = [];
  activeFormulaId: string | null = null;
  hoverFormulaId: string | null = null;
  panelPulse = 0;
  buttonHover: { [k: string]: boolean } = {};
  sliderDragActive = false;
  lastSampleTime = 0;

  private lastT = 0;
  private rafId = 0;
  private blendColorCache = '';
  private blendDecayCache = 0.005;
  private emitAccumulator = 0;

  constructor() {
    this.canvas = document.getElementById('stage') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    this.renderer = new Renderer(this.ctx, this.width, this.height);
    this.particles = new ParticleSystem(this.width, this.height);
    this.flyingParticles = new FlyingParticleSystem();
    this.audio = new AudioManager();
    this.savedFormulas = FormulaManager.loadAll();
    this.bindEvents();
    this.start();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.renderer) this.renderer.resize(w, h);
    if (this.particles) this.particles.resize(w, h);
  }

  private bindEvents() {
    window.addEventListener('resize', () => this.resize());

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const ev = 'touches' in e ? (e.touches[0] || e.changedTouches[0]) : e;
      return { x: (ev as MouseEvent).clientX - rect.left, y: (ev as MouseEvent).clientY - rect.top };
    };

    this.canvas.addEventListener('mousedown', e => {
      this.audio.resume();
      const { x, y } = getPos(e);
      this.handleDown(x, y);
    });
    this.canvas.addEventListener('mousemove', e => {
      const { x, y } = getPos(e);
      this.handleMove(x, y);
    });
    this.canvas.addEventListener('mouseup', () => this.handleUp());
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverBambooId = null;
      this.hoverFormulaId = null;
      this.buttonHover = {};
      this.sliderDragActive = false;
    });

    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this.audio.resume();
      const { x, y } = getPos(e);
      this.handleDown(x, y);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const { x, y } = getPos(e);
      this.handleMove(x, y);
    }, { passive: false });
    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      this.handleUp();
    }, { passive: false });
  }

  private handleDown(mx: number, my: number) {
    const state = this.buildState();
    const hit = this.renderer.hitTest(state, mx, my);
    switch (hit.type) {
      case 'bamboo':
        if (this.appState !== 'idle') return;
        this.activePerfumeId = hit.data.id;
        const item = this.formulaItems.find(f => f.perfumeId === hit.data.id)!;
        this.sliderValue = item.grams;
        this.sliderOpenPulse = 0;
        break;
      case 'slider-track':
        if (this.appState !== 'idle') return;
        this.sliderDragActive = true;
        this.updateSliderFromMouse(mx);
        break;
      case 'blend-btn':
        this.startBlend();
        break;
      case 'panel-light':
        this.startBurning();
        break;
      case 'panel-save':
        this.saveCurrentFormula();
        break;
      case 'panel-reset':
        this.resetFormula();
        break;
      case 'formula-item':
        if (this.appState !== 'idle') return;
        this.loadFormula(hit.data.id);
        break;
      case 'formula-delete':
        this.savedFormulas = FormulaManager.delete(hit.data.id);
        break;
      case 'formula-clear':
        if (confirm('确定清空全部藏香？')) {
          FormulaManager.clearAll();
          this.savedFormulas = [];
        }
        break;
      case 'none':
        this.activePerfumeId = null;
        break;
    }
  }

  private handleMove(mx: number, my: number) {
    const state = this.buildState();
    const hit = this.renderer.hitTest(state, mx, my);
    this.hoverBambooId = hit.type === 'bamboo' ? hit.data.id : null;
    this.hoverFormulaId = hit.type === 'formula-item' || hit.type === 'formula-delete' ? hit.data.id : null;
    this.buttonHover = {};
    if (hit.type === 'blend-btn') this.buttonHover['blend'] = true;
    if (hit.type === 'panel-light') this.buttonHover['panel-light'] = true;
    if (hit.type === 'panel-save') this.buttonHover['panel-save'] = true;
    if (hit.type === 'panel-reset') this.buttonHover['panel-reset'] = true;
    if (hit.type === 'formula-clear') this.buttonHover['clear-all'] = true;

    if (this.sliderDragActive && this.appState === 'idle') {
      this.updateSliderFromMouse(mx);
    }
  }

  private handleUp() {
    if (this.sliderDragActive) {
      this.sliderDragActive = false;
      this.flushSliderToFormula();
    }
  }

  private updateSliderFromMouse(mx: number) {
    if (!this.activePerfumeId) return;
    const state = this.buildState();
    const v = this.renderer.getSliderValueFromPoint(state, mx);
    const old = this.sliderValue;
    this.sliderValue = v;
    if (Math.abs(v - old) >= 0.5) {
      this.audio.playSift(this.getTotalGrams() * 10 + v * 5);
    }
  }

  private flushSliderToFormula() {
    if (!this.activePerfumeId) return;
    const item = this.formulaItems.find(f => f.perfumeId === this.activePerfumeId)!;
    const old = item.grams;
    const nv = this.sliderValue;
    item.grams = nv;
    if (nv !== old) this.spawnFlyingParticles(this.activePerfumeId, old, nv);
  }

  private getTotalGrams(): number {
    return this.formulaItems.reduce((s, f) => s + f.grams, 0);
  }

  private spawnFlyingParticles(perfumeId: string, oldG: number, newG: number) {
    const perfume = getPerfumeById(perfumeId);
    if (!perfume) return;
    const L = getLayout(this.width, this.height);
    const idx = PERFUMES.findIndex(p => p.id === perfumeId);
    const br = L.getBamboo(idx);
    const startX = br.x + br.w / 2;
    const startY = br.y + 28;
    const bowl = L.getBowl();
    const endX = bowl.cx + (Math.random() - 0.5) * 30 * L.scale;
    const endY = bowl.cy - 2;
    const delta = Math.abs(newG - oldG);
    const count = Math.max(1, Math.min(20, Math.round(delta * 2)));
    this.flyingParticles.spawn(startX, startY, endX, endY, perfume.color, count);
    this.audio.playSift(count * 8 + this.getTotalGrams() * 2);
  }

  private startBlend() {
    const used = this.formulaItems.filter(f => f.grams > 0);
    if (used.length === 0) return;
    this.appState = 'mixing';
    this.mixingProgress = 0;
    this.pestleRotation = 0;
    this.pestleTilt = 0;
    this.activePerfumeId = null;
    this.flyingParticles.clear();
  }

  private startBurning() {
    this.appState = 'burning';
    this.burningElapsed = 0;
    this.curveData = [];
    this.lastSampleTime = 0;
    this.blendColorCache = blendFormulaColors(this.formulaItems);
    this.blendDecayCache = getWeightedDecay(this.formulaItems);
    this.particles.clear();
    this.emitAccumulator = 0;
    this.audio.startMusic();
  }

  private saveCurrentFormula() {
    const f = FormulaManager.createFromItems(this.formulaItems);
    if (!f) return;
    this.savedFormulas = FormulaManager.save(f);
    this.activeFormulaId = f.id;
  }

  private resetFormula() {
    this.formulaItems = PERFUMES.map(p => ({ perfumeId: p.id, grams: 0 }));
    this.appState = 'idle';
    this.activePerfumeId = null;
    this.mixingProgress = 0;
    this.panelPulse = 0;
    this.flyingParticles.clear();
    this.particles.clear();
    this.curveData = [];
    this.burningElapsed = 0;
    this.audio.stopMusic();
  }

  private loadFormula(id: string) {
    const f = this.savedFormulas.find(s => s.id === id);
    if (!f) return;
    this.activeFormulaId = id;
    this.formulaItems = PERFUMES.map(p => {
      const fi = f.items.find(it => it.perfumeId === p.id);
      return { perfumeId: p.id, grams: fi ? fi.grams : 0 };
    });
  }

  private buildState(): RenderState {
    const L = getLayout(this.width, this.height);
    return {
      appState: this.appState,
      width: this.width,
      height: this.height,
      scale: L.scale,
      shelfWidth: L.shelfW,
      formulaItems: this.formulaItems,
      activePerfumeId: this.activePerfumeId,
      sliderValue: this.sliderValue,
      sliderOpenPulse: this.sliderOpenPulse,
      hoverBambooId: this.hoverBambooId,
      hoverButton: null as any,
      mixingProgress: this.mixingProgress,
      pestleRotation: this.pestleRotation,
      pestleTilt: this.pestleTilt,
      particles: this.particles.particles,
      flyingParticles: this.flyingParticles.particles,
      burningElapsed: this.burningElapsed,
      curveData: this.curveData,
      savedFormulas: this.savedFormulas,
      activeFormulaId: this.activeFormulaId,
      hoverFormulaId: this.hoverFormulaId,
      panelPulse: this.panelPulse,
      buttonHover: this.buttonHover,
      deleteConfirmId: null,
      sliderDragActive: this.sliderDragActive
    };
  }

  private start() {
    this.lastT = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(50, t - this.lastT);
      this.lastT = t;
      this.update(dt);
      this.renderer.draw(this.buildState());
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    if (this.sliderOpenPulse < 1 && this.activePerfumeId) {
      this.sliderOpenPulse = Math.min(1, this.sliderOpenPulse + dt / 180);
    } else if (this.sliderOpenPulse > 0 && !this.activePerfumeId) {
      this.sliderOpenPulse = Math.max(0, this.sliderOpenPulse - dt / 180);
    }

    this.flyingParticles.update(dt);

    if (this.appState === 'mixing') {
      this.mixingProgress += dt;
      const rotPerS = (Math.PI * 2 * 5) / 800;
      this.pestleRotation += rotPerS * dt;
      this.pestleTilt += dt * 0.008;
      if (this.mixingProgress >= 5000) {
        this.appState = 'ready';
        this.panelPulse = 0;
      }
    }

    if (this.appState === 'ready') {
      this.panelPulse = Math.min(1, this.panelPulse + dt / 250);
    }

    if (this.appState === 'burning') {
      this.burningElapsed += dt;
      this.particles.updateWind(dt);
      this.particles.update(dt);

      this.emitAccumulator += dt;
      const emitInterval = 1000 / this.particles.emitRate;
      while (this.emitAccumulator >= emitInterval) {
        this.emitAccumulator -= emitInterval;
        const L = getLayout(this.width, this.height);
        const cen = L.getCenser();
        const emitX = cen.cx + (Math.random() - 0.5) * 30 * L.scale;
        const emitY = cen.cy - 60 * L.scale;
        this.particles.addParticle(emitX, emitY, this.blendColorCache, this.blendDecayCache);
      }

      this.lastSampleTime += dt;
      if (this.lastSampleTime >= 1000) {
        this.lastSampleTime -= 1000;
        const v = calculateIntensity(
          this.formulaItems,
          id => getPerfumeById(id)?.volatilizeRate ?? 0.5,
          this.burningElapsed
        );
        this.curveData.push(v);
        if (this.curveData.length > 61) this.curveData.shift();
      }

      if (this.burningElapsed > 65000 && this.particles.particles.length === 0) {
        this.audio.stopMusic();
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  (window as any).__app = new App();
});

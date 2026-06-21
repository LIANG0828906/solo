import type {
  Note,
  TrackIndex,
  Judgment,
  HitEvent,
  RippleEffect,
  ComboBurstEffect,
  MissIndicator,
  GameStateData,
  GameEngineCallbacks,
  GameMode,
  PlaybackSpeed,
} from './types';
import { JUDGMENT_WINDOWS, SCORE_VALUES, TRACK_KEYS } from './types';
import type { AudioManager } from './AudioManager';

const COMBO_MILESTONES = [10, 30, 50, 100] as const;
type ComboMilestone = typeof COMBO_MILESTONES[number];

export class GameEngine {
  private notes: Note[] = [];
  private state: GameStateData;
  private callbacks: GameEngineCallbacks;
  private audioManager: AudioManager | null = null;

  private rafId: number | null = null;
  private lastFrameTime: number = 0;
  private startTime: number = 0;
  private pausedAccumulated: number = 0;
  private pauseStartTime: number = 0;
  private virtualTime: number = 0;

  private noteTimeToScreenY: number = 0;
  private fallDuration: number = 2000;

  private pressedTracks: Set<TrackIndex> = new Set();
  private holdingNotes: Map<string, { track: TrackIndex; startTime: number; released: boolean }> = new Map();

  private rippleEffectIdCounter: number = 0;
  private comboBurstIdCounter: number = 0;

  private missPauseTimer: number | null = null;

  constructor(callbacks: GameEngineCallbacks) {
    this.callbacks = callbacks;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameStateData {
    return {
      mode: 'editor',
      isPlaying: false,
      currentTime: 0,
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectCount: 0,
      goodCount: 0,
      missCount: 0,
      playbackSpeed: 1.0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 10000,
      activeNotes: [],
      hitNotes: new Map(),
      holdProgress: new Map(),
      lastHitEvent: null,
      rippleEffects: [],
      comboBurstEffects: [],
      missIndicator: null,
      isPausedForMiss: false,
      screenFlash: null,
      wrongKeyPress: null,
    };
  }

  setAudioManager(manager: AudioManager | null): void {
    this.audioManager = manager;
  }

  loadNotes(notes: Note[]): void {
    this.notes = [...notes].sort((a, b) => a.time - b.time);
  }

  setFallDuration(ms: number): void {
    this.fallDuration = Math.max(500, ms);
  }

  getFallDuration(): number {
    return this.fallDuration;
  }

  getState(): GameStateData {
    return { ...this.state };
  }

  getCurrentTime(): number {
    return this.state.currentTime;
  }

  setPlaybackSpeed(speed: PlaybackSpeed): void {
    this.state.playbackSpeed = speed;
    if (this.audioManager) {
      this.audioManager.setPlaybackRate(speed);
    }
    this.pushUpdate();
  }

  setLoop(enabled: boolean, start?: number, end?: number): void {
    this.state.loopEnabled = enabled;
    if (start !== undefined) this.state.loopStart = start;
    if (end !== undefined) this.state.loopEnd = end;
    this.pushUpdate();
  }

  setMode(mode: GameMode): void {
    this.state.mode = mode;
    if (mode === 'editor') {
      this.stop();
    }
    this.pushUpdate();
  }

  resetStats(): void {
    this.state.score = 0;
    this.state.combo = 0;
    this.state.maxCombo = 0;
    this.state.perfectCount = 0;
    this.state.goodCount = 0;
    this.state.missCount = 0;
    this.state.hitNotes = new Map();
    this.state.holdProgress = new Map();
    this.state.lastHitEvent = null;
    this.state.rippleEffects = [];
    this.state.comboBurstEffects = [];
    this.state.missIndicator = null;
    this.state.isPausedForMiss = false;
    this.state.screenFlash = null;
    this.state.wrongKeyPress = null;
  }

  start(startTime: number = 0): void {
    if (this.rafId !== null) {
      this.stop();
    }

    this.resetStats();
    this.virtualTime = startTime;
    this.state.currentTime = startTime;
    this.startTime = performance.now();
    this.pausedAccumulated = 0;
    this.state.isPlaying = true;

    this.determineActiveNotes();
    this.pushUpdate();

    if (this.audioManager) {
      this.audioManager.seek(startTime);
      this.audioManager.play(this.state.playbackSpeed);
    }

    this.lastFrameTime = performance.now();
    this.loop();
  }

  pause(): void {
    if (!this.state.isPlaying) return;
    this.state.isPlaying = false;
    this.pauseStartTime = performance.now();
    if (this.audioManager) this.audioManager.pause();
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.pushUpdate();
  }

  resume(): void {
    if (this.state.isPlaying) return;
    if (this.state.isPausedForMiss) {
      this.state.isPausedForMiss = false;
      this.state.missIndicator = null;
    }
    this.pausedAccumulated += performance.now() - this.pauseStartTime;
    this.state.isPlaying = true;
    this.lastFrameTime = performance.now();
    if (this.audioManager) this.audioManager.play(this.state.playbackSpeed);
    this.loop();
    this.pushUpdate();
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.missPauseTimer !== null) {
      clearTimeout(this.missPauseTimer);
      this.missPauseTimer = null;
    }
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    this.virtualTime = 0;
    this.state.isPausedForMiss = false;
    this.state.missIndicator = null;
    this.state.activeNotes = [];
    this.holdingNotes.clear();
    if (this.audioManager) this.audioManager.stop();
    this.pushUpdate();
  }

  seek(ms: number): void {
    const wasPlaying = this.state.isPlaying;
    if (wasPlaying) this.pause();
    this.resetStats();
    this.virtualTime = ms;
    this.state.currentTime = ms;
    this.determineActiveNotes();
    if (this.audioManager) this.audioManager.seek(ms);
    if (wasPlaying) this.resume();
    this.pushUpdate();
  }

  private loop = (): void => {
    if (!this.state.isPlaying) return;

    const now = performance.now();
    const elapsed = (now - this.startTime - this.pausedAccumulated) * this.state.playbackSpeed;
    this.virtualTime = elapsed;
    this.state.currentTime = this.virtualTime;

    if (this.state.loopEnabled && this.state.currentTime >= this.state.loopEnd) {
      this.virtualTime = this.state.loopStart;
      this.startTime = performance.now();
      this.pausedAccumulated = 0;
      this.state.currentTime = this.state.loopStart;
      this.state.hitNotes = new Map();
      this.state.holdProgress = new Map();
      this.state.perfectCount = 0;
      this.state.goodCount = 0;
      this.state.missCount = 0;
      if (this.audioManager) this.audioManager.seek(this.state.loopStart);
      this.determineActiveNotes();
    }

    this.checkMissedNotes();
    this.updateHoldProgress();
    this.determineActiveNotes();
    this.cleanupEffects();

    this.pushUpdate();

    const duration = this.getTotalDuration();
    if (this.state.currentTime > duration && this.notes.length > 0 && !this.state.loopEnabled) {
      this.state.isPlaying = false;
      if (this.audioManager) this.audioManager.pause();
      this.pushUpdate();
      return;
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private determineActiveNotes(): void {
    const t = this.state.currentTime;
    const startVisible = t - this.fallDuration * 0.2;
    const endVisible = t + this.fallDuration * 1.2;

    this.state.activeNotes = this.notes.filter((n) => {
      if (this.state.hitNotes.has(n.id)) return false;
      const endTime = n.type === 'hold' && n.duration ? n.time + n.duration : n.time;
      return endTime >= startVisible && n.time <= endVisible;
    });
  }

  private checkMissedNotes(): void {
    const t = this.state.currentTime;
    const missWindow = JUDGMENT_WINDOWS.miss;

    for (const note of this.notes) {
      if (this.state.hitNotes.has(note.id)) continue;
      if (this.state.isPausedForMiss) break;

      const deadline = note.time + missWindow;
      if (t > deadline) {
        this.processMiss(note);
      }
    }
  }

  private updateHoldProgress(): void {
    const t = this.state.currentTime;
    const progress = new Map<string, number>();

    for (const note of this.notes) {
      if (note.type !== 'hold' || !note.duration) continue;
      if (this.state.hitNotes.has(note.id)) continue;

      if (t >= note.time && t <= note.time + note.duration) {
        const p = (t - note.time) / note.duration;
        progress.set(note.id, Math.min(1, Math.max(0, p)));
      }
    }

    this.state.holdProgress = progress;
  }

  private cleanupEffects(): void {
    const now = performance.now();
    const rippleLifetime = 600;
    const comboBurstLifetime = 800;
    const flashLifetime = 500;
    const wrongKeyLifetime = 300;

    this.state.rippleEffects = this.state.rippleEffects.filter(
      (r) => now - r.startTime < rippleLifetime
    );

    this.state.comboBurstEffects = this.state.comboBurstEffects.filter(
      (c) => now - c.startTime < comboBurstLifetime
    );

    if (this.state.screenFlash && now - this.state.screenFlash.startTime >= flashLifetime) {
      this.state.screenFlash = null;
    }

    if (this.state.wrongKeyPress && now - this.state.wrongKeyPress.time >= wrongKeyLifetime) {
      this.state.wrongKeyPress = null;
    }
  }

  handleTrackPress(track: TrackIndex): void {
    this.pressedTracks.add(track);

    if (this.state.isPausedForMiss && this.state.missIndicator) {
      if (this.state.missIndicator.track === track) {
        this.state.missIndicator = null;
        this.state.isPausedForMiss = false;
        this.state.wrongKeyPress = null;
        if (this.missPauseTimer !== null) {
          clearTimeout(this.missPauseTimer);
          this.missPauseTimer = null;
        }
        this.resume();
        return;
      } else {
        this.state.wrongKeyPress = {
          track,
          time: performance.now(),
        };
        if (this.audioManager) {
          this.audioManager.playHitSound('miss');
        }
        this.pushUpdate();
        return;
      }
    }

    if (!this.state.isPlaying) return;

    const t = this.state.currentTime;
    const candidates: Note[] = [];

    for (const note of this.notes) {
      if (this.state.hitNotes.has(note.id)) continue;
      if (note.track !== track) continue;

      const delta = Math.abs(note.time - t);
      if (delta <= JUDGMENT_WINDOWS.miss) {
        candidates.push(note);
      }
    }

    if (candidates.length === 0) return;

    candidates.sort((a, b) => Math.abs(a.time - t) - Math.abs(b.time - t));
    const target = candidates[0];

    if (target.type === 'hold') {
      this.holdingNotes.set(target.id, {
        track,
        startTime: t,
        released: false,
      });
    }

    this.judgeHit(target, t);
  }

  handleTrackRelease(track: TrackIndex): void {
    this.pressedTracks.delete(track);

    for (const [noteId, hold] of this.holdingNotes.entries()) {
      if (hold.track === track && !hold.released) {
        const note = this.notes.find((n) => n.id === noteId);
        if (note && note.type === 'hold' && note.duration) {
          const holdEnd = note.time + note.duration;
          const t = this.state.currentTime;
          const delta = Math.abs(holdEnd - t);
          if (!this.state.hitNotes.has(noteId)) {
            this.holdingNotes.delete(noteId);
          }
        }
      }
    }
  }

  private judgeHit(note: Note, hitTime: number): void {
    const deviation = hitTime - note.time;
    const absDelta = Math.abs(deviation);

    let judgment: Judgment;
    if (absDelta <= JUDGMENT_WINDOWS.perfect) {
      judgment = 'perfect';
    } else if (absDelta <= JUDGMENT_WINDOWS.good) {
      judgment = 'good';
    } else {
      judgment = 'miss';
    }

    if (note.type === 'hold' && judgment !== 'miss') {
      judgment = 'perfect';
    }

    this.state.hitNotes.set(note.id, judgment);

    if (judgment === 'miss') {
      this.state.missCount++;
      this.state.combo = 0;
      if (this.audioManager) this.audioManager.playHitSound('miss');
    } else {
      if (judgment === 'perfect') this.state.perfectCount++;
      else this.state.goodCount++;

      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }

      const base = SCORE_VALUES[judgment];
      const comboBonus = Math.min(2, 1 + Math.floor(this.state.combo / 50) * 0.1);
      this.state.score += Math.round(base * comboBonus);

      if (this.audioManager) this.audioManager.playHitSound(judgment);

      this.checkComboMilestone();
    }

    const event: HitEvent = {
      noteId: note.id,
      track: note.track,
      time: hitTime,
      judgment,
      deviation,
    };
    this.state.lastHitEvent = event;
    this.callbacks.onHit?.(event);

    this.addRippleEffect(note.track, judgment);

    if (judgment === 'miss' && this.state.mode === 'practice') {
      this.triggerMissIndicator(note);
    }

    this.determineActiveNotes();
  }

  private processMiss(note: Note): void {
    this.state.hitNotes.set(note.id, 'miss');
    this.state.missCount++;
    this.state.combo = 0;

    if (this.audioManager) this.audioManager.playHitSound('miss');

    const event: HitEvent = {
      noteId: note.id,
      track: note.track,
      time: this.state.currentTime,
      judgment: 'miss',
      deviation: this.state.currentTime - note.time,
    };
    this.state.lastHitEvent = event;
    this.callbacks.onHit?.(event);

    this.addRippleEffect(note.track, 'miss');

    if (this.state.mode === 'practice') {
      this.triggerMissIndicator(note);
    }
  }

  private triggerMissIndicator(note: Note): void {
    this.state.missIndicator = {
      track: note.track,
      noteId: note.id,
      time: this.state.currentTime,
    };
    this.state.isPausedForMiss = true;

    this.pause();

    this.missPauseTimer = window.setTimeout(() => {
      if (this.state.isPausedForMiss && this.state.missIndicator?.noteId === note.id) {
        this.state.missIndicator = null;
        this.state.isPausedForMiss = false;
        this.resume();
      }
    }, 500);
  }

  private addRippleEffect(track: TrackIndex, judgment: Judgment): void {
    this.state.rippleEffects.push({
      id: `ripple_${this.rippleEffectIdCounter++}`,
      track,
      judgment,
      startTime: performance.now(),
    });
  }

  private checkComboMilestone(): void {
    const combo = this.state.combo;
    for (const m of COMBO_MILESTONES) {
      if (combo === m) {
        this.triggerComboMilestone(m);
        break;
      }
    }
  }

  private triggerComboMilestone(level: ComboMilestone): void {
    const now = performance.now();

    const burst: ComboBurstEffect = {
      id: `burst_${this.comboBurstIdCounter++}`,
      combo: this.state.combo,
      startTime: now,
      level,
    };
    this.state.comboBurstEffects.push(burst);

    if (level >= 50) {
      this.state.screenFlash = { level, startTime: now };
    }

    if (this.audioManager) {
      const soundKey = `combo${level}` as 'combo10' | 'combo30' | 'combo50' | 'combo100';
      this.audioManager.playHitSound(soundKey);
    }

    this.callbacks.onComboMilestone?.(level);
  }

  private pushUpdate(): void {
    this.callbacks.onStateUpdate?.({ ...this.state });
  }

  private getTotalDuration(): number {
    if (this.notes.length === 0) return 60000;
    let max = 0;
    for (const n of this.notes) {
      const end = n.type === 'hold' && n.duration ? n.time + n.duration : n.time;
      if (end > max) max = end;
    }
    return max + 2000;
  }

  isTrackPressed(track: TrackIndex): boolean {
    return this.pressedTracks.has(track);
  }

  destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.missPauseTimer !== null) clearTimeout(this.missPauseTimer);
    this.rafId = null;
    this.notes = [];
    this.holdingNotes.clear();
    this.pressedTracks.clear();
  }
}

export function matchKeyToTrack(code: string, key: string): TrackIndex | null {
  for (let i = 0 as TrackIndex; i < 4; i++) {
    const t = TRACK_KEYS[i as TrackIndex];
    if (code === t.primary || key.toLowerCase() === t.secondary.toLowerCase()) {
      return i as TrackIndex;
    }
  }
  return null;
}

import Phaser from 'phaser';
import { badgeManager, BadgeTier } from './BadgeManager';

export interface HitResult {
  type: 'perfect' | 'good' | 'miss';
  score: number;
}

interface BeatNote {
  sprite: Phaser.GameObjects.Arc;
  targetTime: number;
  spawnTime: number;
  musicProgress: number;
  hit: boolean;
  missed: boolean;
  moveTween: Phaser.Tweens.Tween | null;
}

export const BPM = 120;
export const BEAT_INTERVAL = 60000 / BPM;
export const NOTE_TRAVEL_MS = 2400;
export const SONG_DURATION = 30000;
export const PERFECT_WINDOW = 50;
export const GOOD_WINDOW = 100;
export const MISS_WINDOW = 150;

export class BeatScene extends Phaser.Scene {
  private notes: BeatNote[] = [];
  private trackY = 0;
  private hitLineX = 0;
  private trackStartX = 0;
  private trackEndX = 0;
  private startTime = 0;
  private nextBeatTargetTime = 0;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private audioStartTime = 0;
  private score = 0;
  private combo = 0;
  private perfectCount = 0;
  private goodCount = 0;
  private missCount = 0;
  private songEnded = false;
  private noteRadius = 25;
  private pendingNoteCount = 0;

  constructor() {
    super('BeatScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.trackY = height * 0.38;
    this.trackEndX = width * 0.18;
    this.trackStartX = width * 0.92;
    this.hitLineX = this.trackEndX;

    const trackHeight = 80;
    this.add.graphics()
      .fillStyle(0xffffff, 0.1)
      .fillRoundedRect(0, this.trackY - trackHeight / 2, width, trackHeight, 12);

    const hitLine = this.add.graphics();
    hitLine.lineStyle(3, 0x00e5ff, 0.85);
    hitLine.beginPath();
    hitLine.moveTo(this.hitLineX, this.trackY - trackHeight / 2 + 8);
    hitLine.lineTo(this.hitLineX, this.trackY + trackHeight / 2 - 8);
    hitLine.strokePath();

    const hitCircle = this.add.circle(this.hitLineX, this.trackY, this.noteRadius + 10)
      .setStrokeStyle(3, 0x00e5ff, 0.35);

    this.tweens.add({
      targets: hitCircle,
      alpha: { from: 0.15, to: 0.55 },
      scale: { from: 0.92, to: 1.08 },
      duration: BEAT_INTERVAL,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.startTime = this.time.now;
    this.audioStartTime = this.startTime + 800;
    this.nextBeatTargetTime = this.audioStartTime;

    this.setupAudio();
    this.scheduleMusic();

    this.input.on('pointerdown', this.handleTap, this);

    badgeManager.reset();
    badgeManager.onUpdate((badges: BadgeTier[]) => {
      this.events.emit('badgeUnlock', badges);
    });

    this.events.emit('scoreUpdate', {
      score: 0,
      combo: 0,
      progress: 0
    });
  }

  private setupAudio(): void {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    this.audioCtx = new AC();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.25;
    this.masterGain.connect(this.audioCtx.destination);
  }

  private scheduleMusic(): void {
    if (!this.audioCtx || !this.masterGain) return;
    const ctx = this.audioCtx;
    const audioStartDelay = (this.audioStartTime - this.startTime) / 1000;
    const startAt = ctx.currentTime + audioStartDelay;

    const melody = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23,
                    440.0, 523.25, 440.0, 349.23, 392.0, 493.88, 587.33, 493.88];
    const beatSec = BEAT_INTERVAL / 1000;
    const totalBeats = Math.floor(SONG_DURATION / BEAT_INTERVAL);

    for (let i = 0; i < totalBeats; i++) {
      const t = startAt + i * beatSec;
      const freq = melody[i % melody.length];
      const noteDur = beatSec * 0.45;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t);
      osc.stop(t + noteDur + 0.02);

      if (i % 2 === 0) {
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'triangle';
        bass.frequency.setValueAtTime(freq / 2, t);
        bassGain.gain.setValueAtTime(0, t);
        bassGain.gain.linearRampToValueAtTime(0.12, t + 0.01);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.8);
        bass.connect(bassGain).connect(this.masterGain);
        bass.start(t);
        bass.stop(t + beatSec * 0.82);
      }

      if (i % 4 === 0) {
        const noise = ctx.createBufferSource();
        const bufSize = Math.floor(ctx.sampleRate * 0.08);
        const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < bufSize; j++) {
          data[j] = (Math.random() * 2 - 1) * (1 - j / bufSize);
        }
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        noise.connect(noiseGain).connect(this.masterGain);
        noise.start(t);
      }
    }

    this.pendingNoteCount = totalBeats;
  }

  private getNoteColor(musicProgress: number): number {
    const t = Phaser.Math.Clamp(musicProgress, 0, 1);
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.HexStringToColor('#00e5ff'),
      Phaser.Display.Color.HexStringToColor('#ff4dd2'),
      100,
      Math.floor(t * 100)
    );
    return Phaser.Display.Color.GetColor(color.r, color.g, color.b);
  }

  private getBeatProgress(targetTime: number): number {
    const total = targetTime - this.audioStartTime;
    return Math.min(1, Math.max(0, total / SONG_DURATION));
  }

  private spawnNote(targetTime: number): void {
    const musicProgress = this.getBeatProgress(targetTime);
    const intColor = this.getNoteColor(musicProgress);

    const sprite = this.add.circle(this.trackStartX, this.trackY, this.noteRadius, intColor, 1);
    sprite.setStrokeStyle(3, 0xffffff, 0.35);

    const moveTween = this.tweens.add({
      targets: sprite,
      x: this.trackEndX,
      duration: NOTE_TRAVEL_MS,
      ease: 'Linear',
      persist: true
    });

    this.notes.push({
      sprite,
      targetTime,
      spawnTime: this.time.now,
      musicProgress,
      hit: false,
      missed: false,
      moveTween
    });
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.songEnded) return;
    const now = this.time.now;

    let closest: BeatNote | null = null;
    let closestDiff = Infinity;
    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      if (!note.moveTween || !note.moveTween.isPlaying()) continue;
      const diff = Math.abs(now - note.targetTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = note;
      }
    }

    if (closest && closestDiff <= MISS_WINDOW) {
      const result = this.evaluateHit(closestDiff);
      closest.hit = true;
      if (closest.moveTween) {
        closest.moveTween.stop();
        closest.moveTween = null;
      }
      this.applyHitFeedback(closest, result);
      this.updateScore(result);
    } else {
      this.spawnFeedbackAt(pointer.x, pointer.y, 'MISS', 0x888888);
    }
  }

  private evaluateHit(diffMs: number): HitResult {
    if (diffMs <= PERFECT_WINDOW) return { type: 'perfect', score: 100 };
    if (diffMs <= GOOD_WINDOW) return { type: 'good', score: 50 };
    return { type: 'miss', score: 0 };
  }

  private applyHitFeedback(note: BeatNote, result: HitResult): void {
    const { sprite } = note;
    if (result.type === 'perfect') {
      sprite.setFillStyle(0xffd700, 1);
      const glow = this.add.circle(sprite.x, sprite.y, this.noteRadius + 18, 0xffd700, 0);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.8, to: 0 },
        scale: { from: 0.8, to: 1.8 },
        duration: 400,
        ease: 'Cubic.easeOut',
        onComplete: () => glow.destroy()
      });
      this.spawnFeedbackAt(sprite.x, sprite.y, 'PERFECT', 0xffd700);
      this.tweens.add({
        targets: sprite,
        scale: { from: 1, to: 0.3 },
        alpha: { from: 1, to: 0 },
        duration: 260,
        ease: 'Cubic.easeIn',
        onComplete: () => sprite.destroy()
      });
    } else if (result.type === 'good') {
      sprite.setFillStyle(0x00e5ff, 0.9);
      this.tweens.add({
        targets: sprite,
        scale: { from: 1, to: 0.2 },
        alpha: { from: 1, to: 0 },
        duration: 280,
        ease: 'Cubic.easeIn',
        onComplete: () => sprite.destroy()
      });
      this.spawnFeedbackAt(sprite.x, sprite.y, 'GOOD', 0x00e5ff);
    } else {
      this.missNote(note);
    }
  }

  private spawnFeedbackAt(x: number, y: number, text: string, color: number): void {
    const colorStr = Phaser.Display.Color.IntegerToColor(color).rgba;
    const fb = this.add.text(x, y - 40, text, {
      fontSize: '20px',
      fontStyle: 'bold',
      color: colorStr
    }).setOrigin(0.5).setAlpha(0);
    fb.setShadow(0, 0, colorStr, 12, true);
    this.tweens.add({
      targets: fb,
      y: y - 80,
      alpha: { from: 0, to: 1 },
      duration: 120,
      ease: 'Cubic.easeOut',
      yoyo: true,
      hold: 260,
      onComplete: () => fb.destroy()
    });
  }

  private missNote(note: BeatNote): void {
    note.missed = true;
    if (note.moveTween) {
      note.moveTween.stop();
      note.moveTween = null;
    }
    const { sprite } = note;
    sprite.setFillStyle(0x666666, 0.9);
    for (let i = 0; i < 6; i++) {
      const frag = this.add.circle(sprite.x, sprite.y, 6, 0x888888, 0.9);
      const angle = (i / 6) * Math.PI * 2;
      this.tweens.add({
        targets: frag,
        x: sprite.x + Math.cos(angle) * 40,
        y: sprite.y + Math.sin(angle) * 40,
        alpha: { from: 1, to: 0 },
        scale: { from: 1, to: 0.2 },
        duration: 360,
        ease: 'Cubic.easeOut',
        onComplete: () => frag.destroy()
      });
    }
    sprite.destroy();
    this.missCount++;
    this.combo = 0;
    this.spawnFeedbackAt(sprite.x, sprite.y, 'MISS', 0x888888);
    badgeManager.updateScore(this.score);
    this.emitStatus();
  }

  private updateScore(result: HitResult): void {
    if (result.type === 'perfect') {
      this.perfectCount++;
      this.combo++;
      this.score += result.score;
      if (this.combo > 0 && this.combo % 5 === 0) {
        this.score += 50;
        this.showComboBonus();
      }
    } else if (result.type === 'good') {
      this.goodCount++;
      this.combo = 0;
      this.score += result.score;
    } else {
      this.combo = 0;
    }
    badgeManager.updateScore(this.score);
    this.emitStatus();
  }

  private showComboBonus(): void {
    const bonus = this.add.text(
      this.scale.width / 2,
      this.trackY - 110,
      `${this.combo} COMBO  +50`,
      {
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffd700'
      }
    ).setOrigin(0.5).setAlpha(0).setShadow(0, 0, 'rgba(255,215,0,1)', 18, true);
    this.tweens.add({
      targets: bonus,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.6, to: 1.2 },
      duration: 220,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 400,
      onComplete: () => bonus.destroy()
    });
  }

  private emitStatus(): void {
    const elapsed = this.time.now - this.audioStartTime;
    this.events.emit('scoreUpdate', {
      score: this.score,
      combo: this.combo,
      progress: Math.min(1, Math.max(0, elapsed / SONG_DURATION))
    });
  }

  update(_time: number, delta: number): void {
    if (this.songEnded) return;
    const now = this.time.now;

    while (this.pendingNoteCount > 0 && now >= this.nextBeatTargetTime - NOTE_TRAVEL_MS) {
      this.spawnNote(this.nextBeatTargetTime);
      this.nextBeatTargetTime += BEAT_INTERVAL;
      this.pendingNoteCount--;
    }

    for (const note of this.notes) {
      if (note.hit || note.missed) continue;
      const remain = note.targetTime - now;
      if (remain < -MISS_WINDOW) {
        this.missNote(note);
      }
    }

    this.notes = this.notes.filter(n => !n.hit && !n.missed);

    if (now >= this.audioStartTime + SONG_DURATION + NOTE_TRAVEL_MS + 200 && !this.songEnded) {
      this.songEnded = true;
      this.endGame();
    }

    if (!this.songEnded) {
      this.emitStatus();
    }
  }

  private endGame(): void {
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }
    badgeManager.updateScore(this.score);
    this.events.emit('gameEnd', {
      score: this.score,
      perfect: this.perfectCount,
      good: this.goodCount,
      miss: this.missCount,
      badges: badgeManager.getUnlocked()
    });
  }
}

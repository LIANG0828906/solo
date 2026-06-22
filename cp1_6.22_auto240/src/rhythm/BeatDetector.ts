import { v4 as uuidv4 } from 'uuid';
import {
  ActiveWave,
  Rating,
  RatingResult,
  TrackType,
  Highlight,
  TRACK_COLORS,
} from '../types';

export interface FrameData {
  waves: ActiveWave[];
  highlights: Highlight[];
  missCount: number;
}

const PERFECT_THRESHOLD = 30;
const GOOD_THRESHOLD = 60;
const WAVE_DURATION_RATIO = 1.8;
const SECTOR_COUNT = 12;
const HIT_RADIUS_TOLERANCE = 35;
const HIT_ANGLE_TOLERANCE = (Math.PI * 2) / SECTOR_COUNT / 2 + 0.1;

export class BeatDetector {
  private stageRadius: number;
  private bpm: number = 120;
  private beatInterval: number = 500;
  private waveDuration: number = 900;

  private activeWaves: Map<string, ActiveWave> = new Map();
  private highlights: Highlight[] = [];
  private animationId: number | null = null;
  private lastFrameTime: number = 0;
  private missCount: number = 0;

  public onFrame: ((data: FrameData) => void) | null = null;
  public onRating: ((result: RatingResult) => void) | null = null;

  constructor(stageRadius: number = 300) {
    this.stageRadius = stageRadius;
    this.setBPM(120);
  }

  public setStageRadius(radius: number): void {
    this.stageRadius = radius;
  }

  public setBPM(bpm: number): void {
    this.bpm = Math.max(80, Math.min(180, bpm));
    this.beatInterval = 60000 / this.bpm;
    this.waveDuration = this.beatInterval * WAVE_DURATION_RATIO;
  }

  public getBPM(): number {
    return this.bpm;
  }

  public getWaveDuration(): number {
    return this.waveDuration;
  }

  public spawnWave(track: TrackType, sector: number, delay: number = 0): string {
    const now = performance.now() + delay;
    const id = uuidv4();
    const wave: ActiveWave = {
      id,
      track,
      color: TRACK_COLORS[track],
      startRadius: 0,
      endRadius: this.stageRadius,
      startTime: now,
      duration: this.waveDuration,
      sector,
      hit: false,
      rated: false,
    };
    this.activeWaves.set(id, wave);
    return id;
  }

  public spawnWaveAt(wave: Omit<ActiveWave, 'id' | 'startRadius' | 'startTime' | 'hit' | 'rated'>): string {
    const id = uuidv4();
    const newWave: ActiveWave = {
      ...wave,
      id,
      startRadius: 0,
      startTime: performance.now(),
      hit: false,
      rated: false,
    };
    this.activeWaves.set(id, newWave);
    return id;
  }

  public removeWave(id: string): void {
    this.activeWaves.delete(id);
  }

  public getActiveWaves(): ActiveWave[] {
    return Array.from(this.activeWaves.values());
  }

  private getCurrentRadius(wave: ActiveWave, now: number): number {
    const elapsed = now - wave.startTime;
    const progress = Math.max(0, Math.min(1, elapsed / wave.duration));
    return wave.startRadius + (wave.endRadius - wave.startRadius) * progress;
  }

  private getProgress(wave: ActiveWave, now: number): number {
    const elapsed = now - wave.startTime;
    return Math.max(0, Math.min(1.2, elapsed / wave.duration));
  }

  public handleClick(
    x: number,
    y: number,
    centerX: number,
    centerY: number
  ): RatingResult | null {
    const now = performance.now();
    const dx = x - centerX;
    const dy = y - centerY;
    const clickRadius = Math.sqrt(dx * dx + dy * dy);
    const clickAngle = Math.atan2(dy, dx);

    if (clickRadius < 40 || clickRadius > this.stageRadius + 60) {
      return null;
    }

    let bestResult: RatingResult | null = null;
    let bestWave: ActiveWave | null = null;
    let bestScore = -Infinity;

    for (const wave of this.activeWaves.values()) {
      if (wave.hit || wave.rated) continue;

      const currentRadius = this.getCurrentRadius(wave, now);
      const radiusDiff = Math.abs(clickRadius - currentRadius);

      if (radiusDiff > HIT_RADIUS_TOLERANCE) continue;

      const sectorAngle = (wave.sector / SECTOR_COUNT) * Math.PI * 2 - Math.PI / 2;
      let angleDiff = Math.abs(clickAngle - sectorAngle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;

      if (angleDiff > HIT_ANGLE_TOLERANCE) continue;

      const arrivalTime = wave.startTime + wave.duration;
      const deviation = arrivalTime - now;
      const absDeviation = Math.abs(deviation);

      let rating: Rating;
      let score: number;

      if (absDeviation <= PERFECT_THRESHOLD) {
        rating = 'perfect';
        score = 100 - absDeviation * 0.5;
      } else if (absDeviation <= GOOD_THRESHOLD) {
        rating = 'good';
        score = 50 - (absDeviation - PERFECT_THRESHOLD) * 0.5;
      } else {
        rating = 'miss';
        score = 0;
      }

      const matchScore =
        score - radiusDiff * 0.3 - angleDiff * 10;

      if (matchScore > bestScore) {
        bestScore = matchScore;
        bestWave = wave;
        bestResult = {
          rating,
          deviation,
          score: Math.max(0, Math.round(score)),
          track: wave.track,
          sector: wave.sector,
          waveId: wave.id,
        };
      }
    }

    if (bestWave && bestResult) {
      bestWave.hit = true;
      bestWave.rated = true;

      if (bestResult.rating !== 'miss') {
        this.highlights.push({
          sector: bestWave.sector,
          startTime: now,
          duration: 100,
        });
      }

      this.onRating?.(bestResult);
      return bestResult;
    }

    return null;
  }

  public getSectorFromPoint(
    x: number,
    y: number,
    centerX: number,
    centerY: number
  ): number | null {
    const dx = x - centerX;
    const dy = y - centerY;
    const radius = Math.sqrt(dx * dx + dy * dy);

    if (radius < 40 || radius > this.stageRadius + 40) {
      return null;
    }

    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    const sector = Math.floor((angle / (Math.PI * 2)) * SECTOR_COUNT) % SECTOR_COUNT;
    return sector;
  }

  private updateMissedWaves(now: number): number {
    let newMisses = 0;
    for (const wave of this.activeWaves.values()) {
      if (wave.rated) continue;
      const arrivalTime = wave.startTime + wave.duration;
      if (now - arrivalTime > GOOD_THRESHOLD) {
        wave.rated = true;
        newMisses++;
        const result: RatingResult = {
          rating: 'miss',
          deviation: -GOOD_THRESHOLD - 1,
          score: 0,
          track: wave.track,
          sector: wave.sector,
          waveId: wave.id,
        };
        this.onRating?.(result);
      }
    }
    return newMisses;
  }

  private cleanup(now: number): void {
    const toRemove: string[] = [];
    for (const [id, wave] of this.activeWaves) {
      if (now - wave.startTime > wave.duration + 500) {
        toRemove.push(id);
      }
    }
    toRemove.forEach((id) => this.activeWaves.delete(id));

    this.highlights = this.highlights.filter(
      (h) => now - h.startTime < h.duration + 50
    );
  }

  private loop = (): void => {
    const now = performance.now();
    this.lastFrameTime = now;

    const newMisses = this.updateMissedWaves(now);
    if (newMisses > 0) {
      this.missCount += newMisses;
    }
    this.cleanup(now);

    const frameData: FrameData = {
      waves: this.getActiveWaves(),
      highlights: [...this.highlights],
      missCount: this.missCount,
    };

    this.onFrame?.(frameData);
    this.animationId = requestAnimationFrame(this.loop);
  };

  public start(): void {
    if (this.animationId !== null) return;
    this.lastFrameTime = performance.now();
    this.animationId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public clear(): void {
    this.activeWaves.clear();
    this.highlights = [];
    this.missCount = 0;
  }

  public getMissCount(): number {
    return this.missCount;
  }

  public getFrameDataSnapshot(): FrameData {
    return {
      waves: this.getActiveWaves(),
      highlights: [...this.highlights],
      missCount: this.missCount,
    };
  }
}

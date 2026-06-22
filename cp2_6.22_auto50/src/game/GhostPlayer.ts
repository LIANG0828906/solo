import * as PIXI from 'pixi.js';
import type { RecordingSegment, PlayerState, FrameData, InterpolationCacheEntry, LRUCacheOptions } from '../../types';

class LRUCache<K, V> {
  private cache: Map<K, V> = new Map();
  private maxSize: number;
  private ttl?: number;
  private timestamps: Map<K, number> = new Map();
  private accessOrder: K[] = [];

  constructor(options: LRUCacheOptions) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    if (this.ttl) {
      const now = Date.now();
      const ts = this.timestamps.get(key) || 0;
      if (now - ts > this.ttl) {
        this.delete(key);
        return undefined;
      }
    }

    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }
    this.accessOrder.unshift(key);

    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      const idx = this.accessOrder.indexOf(key);
      if (idx !== -1) {
        this.accessOrder.splice(idx, 1);
      }
    }

    this.cache.set(key, value);
    this.accessOrder.unshift(key);
    if (this.ttl) {
      this.timestamps.set(key, Date.now());
    }

    while (this.cache.size > this.maxSize) {
      const oldest = this.accessOrder.pop();
      if (oldest !== undefined) {
        this.cache.delete(oldest);
        this.timestamps.delete(oldest);
      }
    }
  }

  has(key: K): boolean {
    if (!this.cache.has(key)) return false;
    if (this.ttl) {
      const now = Date.now();
      const ts = this.timestamps.get(key) || 0;
      if (now - ts > this.ttl) {
        this.delete(key);
        return false;
      }
    }
    return true;
  }

  delete(key: K): void {
    this.cache.delete(key);
    this.timestamps.delete(key);
    const idx = this.accessOrder.indexOf(key);
    if (idx !== -1) {
      this.accessOrder.splice(idx, 1);
    }
  }

  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
}

export class GhostPlayer {
  public sprite: PIXI.Container;
  public body: PIXI.Graphics;
  public segment: RecordingSegment;

  private position: { x: number; y: number };
  private trail: PIXI.Graphics[] = [];
  private readonly TRAIL_LENGTH = 12;
  private readonly TRAIL_FADE_START = 0.5;

  private interpolationCache: LRUCache<string, InterpolationCacheEntry>;
  private readonly CACHE_MAX_SIZE = 1000;
  private readonly CACHE_TOLERANCE = 0.05;

  private lastSearchStartIndex: number = 0;
  private segmentDuration: number;

  constructor(segment: RecordingSegment) {
    this.segment = segment;
    this.position = { x: 0, y: 0 };
    this.segmentDuration = Math.max(1, segment.endTime - segment.startTime);

    this.interpolationCache = new LRUCache<string, InterpolationCacheEntry>({
      maxSize: this.CACHE_MAX_SIZE,
      ttl: 30000
    });

    this.sprite = new PIXI.Container();

    this.body = new PIXI.Graphics();
    this.drawBody(segment.color, 0.6);
    this.sprite.addChild(this.body);

    this.createTrail();
  }

  private drawBody(color: number, alpha: number): void {
    this.body.clear();
    this.body.beginFill(color, alpha);
    this.body.drawRect(-12, -16, 24, 32);
    this.body.endFill();

    this.body.lineStyle(2, color, alpha * 1.5);
    this.body.drawRect(-12, -16, 24, 32);

    this.body.beginFill(0xffffff, alpha * 0.8);
    this.body.drawRect(-4, -8, 3, 3);
    this.body.drawRect(2, -8, 3, 3);
    this.body.endFill();
  }

  private createTrail(): void {
    for (let i = 0; i < this.TRAIL_LENGTH; i++) {
      const trailPart = new PIXI.Graphics();
      this.trail.push(trailPart);
      this.sprite.addChildAt(trailPart, 0);
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  private expandFrame(frame: FrameData, baseState: PlayerState | null): PlayerState {
    const result: PlayerState = baseState
      ? {
          ...baseState,
          position: { ...baseState.position },
          velocity: { ...baseState.velocity }
        }
      : {
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          isGrounded: false,
          facing: 1,
          isJumping: false,
          isDead: false,
          actionState: 0
        };

    if (frame.position) result.position = { ...frame.position };
    if (frame.velocity) result.velocity = { ...frame.velocity };
    if (frame.isGrounded !== undefined) result.isGrounded = frame.isGrounded;
    if (frame.facing !== undefined) result.facing = frame.facing;
    if (frame.isJumping !== undefined) result.isJumping = frame.isJumping;
    if (frame.isDead !== undefined) result.isDead = frame.isDead;
    if (frame.actionState !== undefined) result.actionState = frame.actionState;

    return result;
  }

  private binarySearchKeyframes(time: number): { prevIndex: number; nextIndex: number } {
    const keyframes = this.segment.keyframes;
    if (keyframes.length === 0) return { prevIndex: -1, nextIndex: -1 };
    if (keyframes.length === 1) return { prevIndex: 0, nextIndex: -1 };

    if (this.lastSearchStartIndex >= keyframes.length) {
      this.lastSearchStartIndex = 0;
    }

    if (
      this.lastSearchStartIndex > 0 &&
      this.lastSearchStartIndex < keyframes.length - 1 &&
      keyframes[this.lastSearchStartIndex].timestamp <= time &&
      keyframes[this.lastSearchStartIndex + 1].timestamp >= time
    ) {
      return { prevIndex: this.lastSearchStartIndex, nextIndex: this.lastSearchStartIndex + 1 };
    }

    if (time <= keyframes[0].timestamp) {
      this.lastSearchStartIndex = 0;
      return { prevIndex: 0, nextIndex: 1 };
    }
    if (time >= keyframes[keyframes.length - 1].timestamp) {
      this.lastSearchStartIndex = keyframes.length - 1;
      return { prevIndex: keyframes.length - 1, nextIndex: -1 };
    }

    let low = 0;
    let high = keyframes.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const midTime = keyframes[mid].timestamp;

      if (midTime === time) {
        this.lastSearchStartIndex = mid;
        return { prevIndex: mid, nextIndex: mid + 1 < keyframes.length ? mid + 1 : -1 };
      }

      if (midTime < time) {
        if (mid + 1 < keyframes.length && keyframes[mid + 1].timestamp > time) {
          this.lastSearchStartIndex = mid;
          return { prevIndex: mid, nextIndex: mid + 1 };
        }
        low = mid + 1;
      } else {
        if (mid - 1 >= 0 && keyframes[mid - 1].timestamp <= time) {
          this.lastSearchStartIndex = mid - 1;
          return { prevIndex: mid - 1, nextIndex: mid };
        }
        high = mid - 1;
      }
    }

    this.lastSearchStartIndex = 0;
    return { prevIndex: 0, nextIndex: 1 };
  }

  private getCacheKey(time: number): string {
    const rounded = Math.round(time / this.CACHE_TOLERANCE) * this.CACHE_TOLERANCE;
    return `${this.segment.id}_${rounded.toFixed(2)}`;
  }

  public getStateAtTime(time: number): PlayerState | null {
    if (this.segment.keyframes.length === 0) return null;

    const cacheKey = this.getCacheKey(time);
    const cached = this.interpolationCache.get(cacheKey);
    if (cached) {
      cached.accessCount++;
      cached.lastAccessTime = Date.now();
      return {
        ...cached.state,
        position: { ...cached.state.position },
        velocity: { ...cached.state.velocity }
      };
    }

    if (this.segmentDuration <= 0) {
      const state = this.expandFrame(this.segment.keyframes[0], null);
      this.cacheResult(cacheKey, time, state, 0, -1);
      return state;
    }

    let localTime = time - this.segment.startTime;

    if (this.segment.loop) {
      localTime = ((localTime % this.segmentDuration) + this.segmentDuration) % this.segmentDuration;
    } else {
      localTime = Math.max(0, Math.min(localTime, this.segmentDuration));
    }

    const absoluteTime = this.segment.startTime + localTime;
    const { prevIndex, nextIndex } = this.binarySearchKeyframes(absoluteTime);

    if (prevIndex === -1) {
      const state = this.expandFrame(this.segment.keyframes[0], null);
      this.cacheResult(cacheKey, time, state, 0, nextIndex);
      return state;
    }

    const prevFrame = this.segment.keyframes[prevIndex];

    if (nextIndex === -1 || prevIndex === nextIndex) {
      const state = this.expandFrame(prevFrame, null);
      this.cacheResult(cacheKey, time, state, prevIndex, -1);
      return state;
    }

    const nextFrame = this.segment.keyframes[nextIndex];
    const timeDiff = nextFrame.timestamp - prevFrame.timestamp;

    if (timeDiff === 0) {
      const state = this.expandFrame(prevFrame, null);
      this.cacheResult(cacheKey, time, state, prevIndex, nextIndex);
      return state;
    }

    const rawT = (absoluteTime - prevFrame.timestamp) / timeDiff;
    const t = Math.max(0, Math.min(1, rawT));

    const expandedPrev = this.expandFrame(prevFrame, null);
    const expandedNext = this.expandFrame(nextFrame, expandedPrev);

    const smoothT = this.smoothstep(0, 1, t);

    const state: PlayerState = {
      position: {
        x: this.lerp(expandedPrev.position.x, expandedNext.position.x, smoothT),
        y: this.lerp(expandedPrev.position.y, expandedNext.position.y, smoothT)
      },
      velocity: {
        x: this.lerp(expandedPrev.velocity.x, expandedNext.velocity.x, t),
        y: this.lerp(expandedPrev.velocity.y, expandedNext.velocity.y, t)
      },
      isGrounded: t < 0.5 ? expandedPrev.isGrounded : expandedNext.isGrounded,
      facing: this.interpolateFacing(expandedPrev.facing, expandedNext.facing, t),
      isJumping: t < 0.5 ? expandedPrev.isJumping : expandedNext.isJumping,
      isDead: t < 0.5 ? expandedPrev.isDead : expandedNext.isDead,
      actionState: t < 0.5 ? expandedPrev.actionState : expandedNext.actionState
    };

    this.cacheResult(cacheKey, time, state, prevIndex, nextIndex);
    return state;
  }

  private interpolateFacing(prev: 1 | -1, next: 1 | -1, t: number): 1 | -1 {
    if (prev === next) return prev;
    return t < 0.5 ? prev : next;
  }

  private cacheResult(
    key: string,
    time: number,
    state: PlayerState,
    prevIndex: number,
    nextIndex: number
  ): void {
    const entry: InterpolationCacheEntry = {
      time,
      state: {
        ...state,
        position: { ...state.position },
        velocity: { ...state.velocity }
      },
      prevIndex,
      nextIndex,
      accessCount: 1,
      lastAccessTime: Date.now()
    };
    this.interpolationCache.set(key, entry);
  }

  public updateForTime(time: number): void {
    const state = this.getStateAtTime(time);
    if (!state) return;

    this.updateTrail(this.position);

    this.position = { ...state.position };
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;

    this.updateTrailOpacity();
  }

  private updateTrail(newPosition: { x: number; y: number }): void {
    for (let i = this.trail.length - 1; i > 0; i--) {
      const prevGraphics = this.trail[i - 1];
      const currentGraphics = this.trail[i];

      currentGraphics.x = prevGraphics.x;
      currentGraphics.y = prevGraphics.y;
      currentGraphics.scale.x = prevGraphics.scale.x * 0.92;
      currentGraphics.scale.y = prevGraphics.scale.y * 0.92;
      currentGraphics.alpha = prevGraphics.alpha * 0.88;

      currentGraphics.clear();
      currentGraphics.beginFill(this.segment.color, 0.25 * (1 - i / this.trail.length));
      currentGraphics.drawRect(-12, -16, 24, 32);
      currentGraphics.endFill();
    }

    if (this.trail.length > 0) {
      this.trail[0].x = newPosition.x;
      this.trail[0].y = newPosition.y;
      this.trail[0].scale.x = 0.95;
      this.trail[0].scale.y = 0.95;
      this.trail[0].alpha = this.TRAIL_FADE_START;

      this.trail[0].clear();
      this.trail[0].beginFill(this.segment.color, 0.35);
      this.trail[0].drawRect(-12, -16, 24, 32);
      this.trail[0].endFill();
    }
  }

  private updateTrailOpacity(): void {
    for (let i = 0; i < this.trail.length; i++) {
      const ratio = 1 - i / this.trail.length;
      const baseAlpha = this.TRAIL_FADE_START * ratio * ratio;
      this.trail[i].alpha = Math.max(0.01, baseAlpha);
    }
  }

  public clearTrail(): void {
    for (const trailPart of this.trail) {
      trailPart.clear();
      trailPart.alpha = 0;
    }
    this.interpolationCache.clear();
  }

  public getRect(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.position.x - 12,
      y: this.position.y - 16,
      width: 24,
      height: 32
    };
  }

  public setVisible(visible: boolean): void {
    this.sprite.visible = visible;
  }

  public getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.interpolationCache.size(),
      maxSize: this.CACHE_MAX_SIZE
    };
  }

  public destroy(): void {
    this.interpolationCache.clear();
    for (const trailPart of this.trail) {
      trailPart.destroy();
    }
    this.trail = [];
    this.body.destroy();
    this.sprite.destroy();
  }
}

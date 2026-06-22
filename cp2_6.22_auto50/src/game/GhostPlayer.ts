import * as PIXI from 'pixi.js';
import type { RecordingSegment, PlayerState, FrameData } from '../../types';

interface InterpolationCache {
  time: number;
  state: PlayerState;
}

export class GhostPlayer {
  public sprite: PIXI.Container;
  public body: PIXI.Graphics;
  public segment: RecordingSegment;

  private position: { x: number; y: number };
  private trail: PIXI.Graphics[] = [];
  private readonly TRAIL_LENGTH = 12;
  private readonly TRAIL_FADE_START = 0.5;

  private interpolationCache: InterpolationCache | null = null;
  private readonly CACHE_TOLERANCE = 0.1;

  private lastFrameIndex: number = -1;
  private frameSearchStartIndex: number = 0;

  constructor(segment: RecordingSegment) {
    this.segment = segment;
    this.position = { x: 0, y: 0 };

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

  private expandFrame(frame: FrameData, baseState: PlayerState | null): PlayerState {
    const result: PlayerState = baseState
      ? { ...baseState, position: { ...baseState.position }, velocity: { ...baseState.velocity } }
      : {
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          isGrounded: false,
          facing: 1,
          isJumping: false
        };

    if (frame.position) result.position = { ...frame.position };
    if (frame.velocity) result.velocity = { ...frame.velocity };
    if (frame.isGrounded !== undefined) result.isGrounded = frame.isGrounded;
    if (frame.facing !== undefined) result.facing = frame.facing;
    if (frame.isJumping !== undefined) result.isJumping = frame.isJumping;

    return result;
  }

  private binarySearchKeyframes(time: number): { prevIndex: number; nextIndex: number } {
    const keyframes = this.segment.keyframes;
    if (keyframes.length === 0) return { prevIndex: -1, nextIndex: -1 };
    if (keyframes.length === 1) return { prevIndex: 0, nextIndex: -1 };

    if (time <= keyframes[0].timestamp) {
      return { prevIndex: 0, nextIndex: 1 };
    }
    if (time >= keyframes[keyframes.length - 1].timestamp) {
      return { prevIndex: keyframes.length - 1, nextIndex: -1 };
    }

    let low = 0;
    let high = keyframes.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const midTime = keyframes[mid].timestamp;

      if (midTime === time) {
        return { prevIndex: mid, nextIndex: mid + 1 < keyframes.length ? mid + 1 : -1 };
      }

      if (midTime < time) {
        if (mid + 1 < keyframes.length && keyframes[mid + 1].timestamp > time) {
          return { prevIndex: mid, nextIndex: mid + 1 };
        }
        low = mid + 1;
      } else {
        if (mid - 1 >= 0 && keyframes[mid - 1].timestamp <= time) {
          return { prevIndex: mid - 1, nextIndex: mid };
        }
        high = mid - 1;
      }
    }

    return { prevIndex: 0, nextIndex: 1 };
  }

  public getStateAtTime(time: number): PlayerState | null {
    if (this.segment.keyframes.length === 0) return null;

    if (
      this.interpolationCache &&
      Math.abs(this.interpolationCache.time - time) < this.CACHE_TOLERANCE
    ) {
      return {
        ...this.interpolationCache.state,
        position: { ...this.interpolationCache.state.position },
        velocity: { ...this.interpolationCache.state.velocity }
      };
    }

    const segmentDuration = this.segment.endTime - this.segment.startTime;
    if (segmentDuration <= 0) {
      const state = this.expandFrame(this.segment.keyframes[0], null);
      this.interpolationCache = { time, state };
      return state;
    }

    let localTime = time - this.segment.startTime;
    if (this.segment.loop) {
      localTime = ((localTime % segmentDuration) + segmentDuration) % segmentDuration;
    } else {
      localTime = Math.max(0, Math.min(localTime, segmentDuration));
    }

    const absoluteTime = this.segment.startTime + localTime;
    const { prevIndex, nextIndex } = this.binarySearchKeyframes(absoluteTime);

    if (prevIndex === -1) {
      const state = this.expandFrame(this.segment.keyframes[0], null);
      this.interpolationCache = { time, state };
      return state;
    }

    const prevFrame = this.segment.keyframes[prevIndex];

    if (nextIndex === -1 || prevIndex === nextIndex) {
      const state = this.expandFrame(prevFrame, null);
      this.interpolationCache = { time, state };
      return state;
    }

    const nextFrame = this.segment.keyframes[nextIndex];
    const timeDiff = nextFrame.timestamp - prevFrame.timestamp;

    if (timeDiff === 0) {
      const state = this.expandFrame(prevFrame, null);
      this.interpolationCache = { time, state };
      return state;
    }

    const t = Math.max(0, Math.min(1, (absoluteTime - prevFrame.timestamp) / timeDiff));

    const expandedPrev = this.expandFrame(prevFrame, null);
    const expandedNext = this.expandFrame(nextFrame, expandedPrev);

    const state: PlayerState = {
      position: {
        x: this.lerp(expandedPrev.position.x, expandedNext.position.x, t),
        y: this.lerp(expandedPrev.position.y, expandedNext.position.y, t)
      },
      velocity: {
        x: this.lerp(expandedPrev.velocity.x, expandedNext.velocity.x, t),
        y: this.lerp(expandedPrev.velocity.y, expandedNext.velocity.y, t)
      },
      isGrounded: t < 0.5 ? expandedPrev.isGrounded : expandedNext.isGrounded,
      facing: t < 0.5 ? expandedPrev.facing : expandedNext.facing,
      isJumping: t < 0.5 ? expandedPrev.isJumping : expandedNext.isJumping
    };

    this.interpolationCache = {
      time,
      state: {
        ...state,
        position: { ...state.position },
        velocity: { ...state.velocity }
      }
    };

    this.lastFrameIndex = prevIndex;
    return state;
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
      const prevTransform = prevGraphics.transform;

      currentGraphics.x = prevTransform.position.x;
      currentGraphics.y = prevTransform.position.y;
      currentGraphics.scale.x = prevTransform.scale.x * 0.92;
      currentGraphics.scale.y = prevTransform.scale.y * 0.92;
      currentGraphics.alpha = prevGraphics.alpha * 0.85;
    }

    if (this.trail.length > 0) {
      this.trail[0].x = newPosition.x;
      this.trail[0].y = newPosition.y;
      this.trail[0].scale.x = 0.95;
      this.trail[0].scale.y = 0.95;
      this.trail[0].alpha = this.TRAIL_FADE_START;

      this.trail[0].clear();
      this.trail[0].beginFill(this.segment.color, 0.3);
      this.trail[0].drawRect(-12, -16, 24, 32);
      this.trail[0].endFill();
    }
  }

  private updateTrailOpacity(): void {
    for (let i = 0; i < this.trail.length; i++) {
      const fadeRatio = 1 - i / this.trail.length;
      this.trail[i].alpha = this.TRAIL_FADE_START * fadeRatio * fadeRatio;
    }
  }

  public clearTrail(): void {
    for (const trailPart of this.trail) {
      trailPart.clear();
      trailPart.alpha = 0;
    }
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

  public destroy(): void {
    for (const trailPart of this.trail) {
      trailPart.destroy();
    }
    this.trail = [];
    this.body.destroy();
    this.sprite.destroy();
  }
}

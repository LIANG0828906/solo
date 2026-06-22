import type { Point, Stroke } from '@/store/useCanvasStore';

interface GestureTrack {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  prevX: number;
  prevY: number;
}

export type GestureType =
  | 'none'
  | 'three-finger-swipe-left'
  | 'pinch'
  | 'rotate';

export interface GestureOutput {
  type: GestureType;
  params: Record<string, number>;
}

const SWIPE_THRESHOLD = 80;
const SWIPE_TIME_WINDOW = 400;
const PINCH_THRESHOLD = 2;
const ROTATE_THRESHOLD = 0.05;

export class GestureEngine {
  private tracks: Map<number, GestureTrack> = new Map();
  private lastGestureTime: number = 0;

  onTouchStart(touches: TouchList): void {
    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      this.tracks.set(t.identifier, {
        id: t.identifier,
        startX: t.clientX,
        startY: t.clientY,
        currentX: t.clientX,
        currentY: t.clientY,
        startTime: Date.now(),
        prevX: t.clientX,
        prevY: t.clientY,
      });
    }
  }

  onTouchMove(touches: TouchList): GestureOutput {
    const now = Date.now();

    for (let i = 0; i < touches.length; i++) {
      const t = touches[i];
      const track = this.tracks.get(t.identifier);
      if (track) {
        track.prevX = track.currentX;
        track.prevY = track.currentY;
        track.currentX = t.clientX;
        track.currentY = t.clientY;
      }
    }

    const trackList = Array.from(this.tracks.values());

    if (trackList.length === 3) {
      return this.detectThreeFingerSwipe(trackList, now);
    }

    if (trackList.length === 2) {
      const rotateResult = this.detectRotate(trackList);
      if (rotateResult.type !== 'none') return rotateResult;

      const pinchResult = this.detectPinch(trackList);
      if (pinchResult.type !== 'none') return pinchResult;
    }

    return { type: 'none', params: {} };
  }

  onTouchEnd(touches: TouchList): void {
    const activeIds = new Set<number>();
    for (let i = 0; i < touches.length; i++) {
      activeIds.add(touches[i].identifier);
    }
    for (const [id] of this.tracks) {
      if (!activeIds.has(id)) {
        this.tracks.delete(id);
      }
    }
  }

  reset(): void {
    this.tracks.clear();
  }

  private detectThreeFingerSwipe(
    tracks: GestureTrack[],
    now: number
  ): GestureOutput {
    if (now - this.lastGestureTime < 300) {
      return { type: 'none', params: {} };
    }

    const allMovingLeft = tracks.every((t) => {
      const dx = t.currentX - t.startX;
      const dt = now - t.startTime;
      return dx < -SWIPE_THRESHOLD && dt < SWIPE_TIME_WINDOW;
    });

    if (allMovingLeft) {
      this.lastGestureTime = now;
      const avgDx =
        tracks.reduce((s, t) => s + (t.currentX - t.startX), 0) /
        tracks.length;
      return {
        type: 'three-finger-swipe-left',
        params: { distance: Math.abs(avgDx) },
      };
    }

    return { type: 'none', params: {} };
  }

  private detectPinch(tracks: GestureTrack[]): GestureOutput {
    const [a, b] = tracks;
    const prevDist = Math.hypot(a.prevX - b.prevX, a.prevY - b.prevY);
    const currDist = Math.hypot(
      a.currentX - b.currentX,
      a.currentY - b.currentY
    );
    const delta = currDist - prevDist;

    if (Math.abs(delta) > PINCH_THRESHOLD) {
      const scale = currDist / (prevDist || 1);
      return {
        type: 'pinch',
        params: { scale, delta },
      };
    }

    return { type: 'none', params: {} };
  }

  private detectRotate(tracks: GestureTrack[]): GestureOutput {
    const [a, b] = tracks;
    const prevAngle = Math.atan2(a.prevY - b.prevY, a.prevX - b.prevX);
    const currAngle = Math.atan2(
      a.currentY - b.currentY,
      a.currentX - b.currentX
    );
    let deltaAngle = currAngle - prevAngle;
    if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    if (Math.abs(deltaAngle) > ROTATE_THRESHOLD) {
      return {
        type: 'rotate',
        params: { angle: deltaAngle },
      };
    }

    return { type: 'none', params: {} };
  }
}

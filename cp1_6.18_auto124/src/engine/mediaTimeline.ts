import type { LightKeyframe, SoundKeyframe, TimelineEntry } from '@/types';

let animationFrameId: number | null = null;
let startTime: number = 0;
let isPlaying: boolean = false;

export function generateTimeline(
  lightKeyframes: LightKeyframe[],
  soundKeyframes: SoundKeyframe[]
): TimelineEntry[] {
  const timelineMap = new Map<number, TimelineEntry>();

  for (const lk of lightKeyframes) {
    const entry: TimelineEntry = timelineMap.get(lk.timestamp) ?? {
      timestamp: lk.timestamp,
      lightColor: null,
      lightIntensity: null,
      soundId: null,
    };
    entry.lightColor = lk.color;
    entry.lightIntensity = lk.intensity;
    timelineMap.set(lk.timestamp, entry);
  }

  for (const sk of soundKeyframes) {
    const entry: TimelineEntry = timelineMap.get(sk.timestamp) ?? {
      timestamp: sk.timestamp,
      lightColor: null,
      lightIntensity: null,
      soundId: null,
    };
    entry.soundId = sk.id;
    timelineMap.set(sk.timestamp, entry);
  }

  const timeline = Array.from(timelineMap.values());
  timeline.sort((a, b) => a.timestamp - b.timestamp);
  return timeline;
}

export function startPlayback(
  timeline: TimelineEntry[],
  onFrame: (currentTime: number, currentEntry: TimelineEntry | null) => void
): void {
  stopPlayback();
  isPlaying = true;
  startTime = performance.now();
  let lastTime = 0;
  const frameInterval = 1000 / 24;

  function tick(now: number): void {
    if (!isPlaying) return;

    const elapsed = now - startTime;
    const delta = elapsed - lastTime;

    if (delta >= frameInterval) {
      lastTime = elapsed;

      let currentEntry: TimelineEntry | null = null;
      for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].timestamp <= elapsed) {
          currentEntry = timeline[i];
          break;
        }
      }

      onFrame(elapsed, currentEntry);
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  animationFrameId = requestAnimationFrame(tick);
}

export function stopPlayback(): void {
  isPlaying = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const mmm = String(milliseconds).padStart(3, '0');

  return `${mm}:${ss}.${mmm}`;
}

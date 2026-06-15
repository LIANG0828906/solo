import type { ActiveTimeSegment } from '@/types';

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`;
  }
  if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  }
  return `${secs}秒`;
}

export function calculateActiveSeconds(
  segments: ActiveTimeSegment[],
  now: number = Date.now()
): number {
  let total = 0;
  for (const seg of segments) {
    const end = seg.endTime ?? now;
    if (end > seg.startTime) {
      total += Math.floor((end - seg.startTime) / 1000);
    }
  }
  return Math.max(0, total);
}

export function estimateRemainingTime(
  currentRow: number,
  totalRows: number,
  activeSeconds: number
): number {
  if (currentRow <= 0 || activeSeconds <= 0) {
    return 0;
  }
  const remainingRows = totalRows - currentRow;
  if (remainingRows <= 0) return 0;
  const avgSecondsPerRow = activeSeconds / currentRow;
  return Math.max(0, remainingRows * avgSecondsPerRow);
}

export function startActiveSegment(segments: ActiveTimeSegment[], now: number = Date.now()): ActiveTimeSegment[] {
  const last = segments[segments.length - 1];
  if (last && !last.endTime) {
    return segments;
  }
  return [...segments, { startTime: now }];
}

export function endActiveSegment(segments: ActiveTimeSegment[], now: number = Date.now()): ActiveTimeSegment[] {
  if (segments.length === 0) return segments;
  const newSegments = [...segments];
  const last = { ...newSegments[newSegments.length - 1] };
  if (!last.endTime) {
    last.endTime = now;
    newSegments[newSegments.length - 1] = last;
  }
  return newSegments;
}

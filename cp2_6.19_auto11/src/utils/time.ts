export const formatTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const formatTimeShort = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m${secs}s`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const snapToFrame = (time: number, fps: number = 30): number => {
  return Math.round(time * fps) / fps;
};

export const getTotalDuration = (clips: { startTime: number; endTime: number }[]): number => {
  if (clips.length === 0) return 0;
  return Math.max(...clips.map(c => c.endTime));
};

export function formatTime(totalSeconds: number): string {
  const absSeconds = Math.abs(Math.floor(totalSeconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;
  const sign = totalSeconds < 0 ? '-' : '';
  if (hours > 0) {
    return `${sign}${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }
  return `${sign}${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatTimeFull(totalSeconds: number): string {
  const absSeconds = Math.abs(Math.floor(totalSeconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;
  const sign = totalSeconds < 0 ? '-' : '';
  const parts = [];
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`);
  return sign + parts.join('');
}

export function calculateSpeakingRate(wordCount: number, durationSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  return Math.round((wordCount / durationSeconds) * 60);
}

export function recommendStageDurations(totalSeconds: number, stageCount: number): number[] {
  if (stageCount <= 0) return [];
  const base = Math.floor(totalSeconds / stageCount);
  const remainder = totalSeconds % stageCount;
  return Array.from({ length: stageCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function getProgressPercentage(
  elapsed: number,
  total: number
): number {
  if (total <= 0) return 0;
  return Math.min(100, (elapsed / total) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

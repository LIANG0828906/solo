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

export function estimateRemainingTime(
  currentRow: number,
  totalRows: number,
  elapsedSeconds: number
): number {
  if (currentRow <= 0 || elapsedSeconds <= 0) {
    return 0;
  }
  const remainingRows = totalRows - currentRow;
  const avgSecondsPerRow = elapsedSeconds / currentRow;
  return Math.max(0, remainingRows * avgSecondsPerRow);
}

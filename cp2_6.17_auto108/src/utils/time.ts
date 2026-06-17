export function formatRemainingTime(deadline: number): string {
  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) return '已结束';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) return `${days}天${hours}小时`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟${seconds}秒`;
  return `${seconds}秒`;
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function getDefaultDeadline(): number {
  return Date.now() + 24 * 60 * 60 * 1000;
}

export function getDeadlinePresets(): { label: string; value: number }[] {
  const now = Date.now();
  return [
    { label: '15分钟', value: now + 15 * 60 * 1000 },
    { label: '1小时', value: now + 60 * 60 * 1000 },
    { label: '6小时', value: now + 6 * 60 * 60 * 1000 },
    { label: '24小时', value: now + 24 * 60 * 60 * 1000 },
  ];
}

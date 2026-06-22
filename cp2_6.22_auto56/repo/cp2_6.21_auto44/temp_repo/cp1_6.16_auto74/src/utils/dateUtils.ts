export function formatCountdown(deadline: string): string {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const diff = deadlineTime - now;

  if (diff <= 0) {
    return '已截止';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}天${hours}小时`;
  }

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }

  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${minutes}分${seconds}秒`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLastActive(dateString: string): string {
  const now = new Date().getTime();
  const activeTime = new Date(dateString).getTime();
  const diff = now - activeTime;

  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return '刚刚在线';
  if (minutes < 60) return `${minutes}分钟前在线`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前在线`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前在线`;

  return formatDate(dateString);
}

export function isUserOnline(lastActive?: string): boolean {
  if (!lastActive) return false;
  const now = new Date().getTime();
  const activeTime = new Date(lastActive).getTime();
  const diff = now - activeTime;
  return diff < 5 * 60 * 1000;
}

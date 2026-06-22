export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (weeks < 5) return `${weeks}周前`;
  if (months < 12) return `${months}个月前`;
  return `${Math.floor(days / 365)}年前`;
};

export const getCityName = (cityId: string): string => {
  const cityMap: Record<string, string> = {
    beijing: '北京',
    shanghai: '上海',
    xian: '西安',
  };
  return cityMap[cityId] || cityId;
};

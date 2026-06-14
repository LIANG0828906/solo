export const getPlantAge = (plantDate: string): string => {
  const start = new Date(plantDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '1天';
  if (diffDays < 30) return `${diffDays}天`;
  if (diffDays < 60) return '1个月';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月`;
  if (diffDays < 730) return '1年';
  return `${Math.floor(diffDays / 365)}年`;
};

export const getPlantAgeDays = (plantDate: string): number => {
  const start = new Date(plantDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

export const formatFullDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = (): string => {
  return formatFullDate(new Date().toISOString());
};

export const isToday = (dateStr: string): boolean => {
  return formatFullDate(dateStr) === formatFullDate(new Date().toISOString());
};

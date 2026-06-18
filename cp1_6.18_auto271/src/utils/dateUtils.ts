export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getCountdown = (
  lastWateredDate: string,
  waterFrequency: number
): { days: number; hours: number; isOverdue: boolean; totalHours: number } => {
  const now = new Date();
  const lastWatered = new Date(lastWateredDate);
  const nextWatering = new Date(
    lastWatered.getTime() + waterFrequency * 24 * 60 * 60 * 1000
  );

  const diffMs = nextWatering.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    const overdueHours = Math.abs(Math.floor(diffHours));
    return {
      days: Math.floor(overdueHours / 24),
      hours: overdueHours % 24,
      isOverdue: true,
      totalHours: overdueHours,
    };
  }

  const totalHours = Math.ceil(diffHours);
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    isOverdue: false,
    totalHours,
  };
};

export const formatCountdown = (
  lastWateredDate: string,
  waterFrequency: number
): { text: string; isOverdue: boolean } => {
  const { days, hours, isOverdue } = getCountdown(
    lastWateredDate,
    waterFrequency
  );

  if (isOverdue) {
    if (days === 0 && hours === 0) {
      return { text: '现在就需要浇水！', isOverdue: true };
    }
    if (days === 0) {
      return { text: `已逾期 ${hours} 小时`, isOverdue: true };
    }
    return { text: `已逾期 ${days}天${hours}小时`, isOverdue: true };
  }

  if (days === 0 && hours === 0) {
    return { text: '下一次浇水：即将到来', isOverdue: false };
  }
  if (days === 0) {
    return { text: `下一次浇水：${hours}小时后`, isOverdue: false };
  }
  return {
    text: `下一次浇水：${days}天${hours}小时后`,
    isOverdue: false,
  };
};

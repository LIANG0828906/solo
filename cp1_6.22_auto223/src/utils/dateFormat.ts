export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatShortDate(dateString);
};

export const getActivityStatus = (dateString: string): 'upcoming' | 'ongoing' | 'ended' => {
  const now = new Date();
  const activityDate = new Date(dateString);
  const diffMs = activityDate.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;

  if (diffHours > 2) return 'upcoming';
  if (diffHours >= -2) return 'ongoing';
  return 'ended';
};

export const isRegistrationOpen = (deadlineString: string): boolean => {
  const now = new Date();
  const deadline = new Date(deadlineString);
  return now < deadline;
};

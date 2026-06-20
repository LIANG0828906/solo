export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysBetween(from: number, to: number): number {
  const MS_PER_DAY = 86400000;
  return Math.ceil((to - from) / MS_PER_DAY);
}

export function getDaysRemaining(dueDate: number): number {
  return daysBetween(Date.now(), dueDate);
}

export function isOverdue(dueDate: number): boolean {
  return Date.now() > dueDate;
}

export function isDueSoon(dueDate: number, days: number = 2): boolean {
  const remaining = getDaysRemaining(dueDate);
  return remaining >= 0 && remaining <= days;
}

export function getAuthorInitial(author: string): string {
  const trimmed = author.trim();
  if (!trimmed) return '?';
  const firstChar = trimmed[0];
  return firstChar.toUpperCase();
}

export function getRandomLightColor(seed: string): string {
  const colors = [
    '#F5E6D3',
    '#E8F5E9',
    '#E3F2FD',
    '#FFF3E0',
    '#F3E5F5',
    '#FFF8E1',
    '#E0F7FA',
    '#FBE9E7',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % colors.length);
  return colors[index];
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待确认',
    active: '进行中',
    completed: '已完成',
    rejected: '已拒绝',
    overdue: '逾期',
    lost: '已丢失',
    available: '可借阅',
    low_stock: '库存紧张',
    out_of_stock: '已借完',
  };
  return labels[status] || status;
}

export function getExchangeModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    exchange_only: '仅交换',
    borrow_only: '仅借阅',
    both: '可交换/借阅',
  };
  return labels[mode] || mode;
}

export function validateBookForm(data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = '书名不能为空';
  }
  if (!data.author || typeof data.author !== 'string' || data.author.trim().length === 0) {
    errors.author = '作者不能为空';
  }
  if (!data.category) {
    errors.category = '请选择类别';
  }
  if (!data.isbn || typeof data.isbn !== 'string' || data.isbn.trim().length < 10) {
    errors.isbn = 'ISBN 至少 10 位';
  }
  if (typeof data.totalQuantity !== 'number' || data.totalQuantity < 1) {
    errors.totalQuantity = '库存数量至少为 1';
  }
  if (!data.exchangeMode) {
    errors.exchangeMode = '请选择交换方式';
  }
  if (typeof data.borrowPeriodDays !== 'number' || data.borrowPeriodDays < 1) {
    errors.borrowPeriodDays = '借阅期限至少为 1 天';
  }
  return errors;
}

export function shakeElement(element: HTMLElement): void {
  element.classList.add('shake');
  setTimeout(() => {
    element.classList.remove('shake');
  }, 500);
}

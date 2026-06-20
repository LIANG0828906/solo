export const formatPrice = (price: number): string => {
  return `¥${price.toFixed(2)}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateOrderNo = (): string => {
  const now = new Date();
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const getSearchHistory = (): string[] => {
  try {
    const history = localStorage.getItem('searchHistory');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
};

export const addToSearchHistory = (keyword: string): void => {
  try {
    const history = getSearchHistory();
    const filtered = history.filter((item) => item !== keyword);
    filtered.unshift(keyword);
    const limited = filtered.slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(limited));
  } catch {
    // ignore
  }
};

export const clearSearchHistory = (): void => {
  localStorage.removeItem('searchHistory');
};

export const createRipple = (
  event: React.MouseEvent<HTMLElement>,
  color: string = 'rgba(255, 255, 255, 0.5)'
): void => {
  const button = event.currentTarget;
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const existingRipples = button.querySelectorAll('.ripple-effect');
  existingRipples.forEach((r) => r.remove());

  const ripple = document.createElement('span');
  ripple.className = 'ripple-effect';
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: ${color};
    border-radius: 50%;
    transform: scale(0);
    animation: ripple 0.4s ease-out forwards;
    pointer-events: none;
    z-index: 1;
  `;

  if (getComputedStyle(button).position === 'static') {
    button.style.position = 'relative';
  }
  button.style.overflow = 'hidden';

  button.appendChild(ripple);

  setTimeout(() => ripple.remove(), 450);
};

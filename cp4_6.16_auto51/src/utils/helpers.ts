interface Animal {
  emoji: string;
  name: string;
}

export function generateRandomAnimal(): Animal {
  const animals: Animal[] = [
    { emoji: '🐶', name: '小狗狗' },
    { emoji: '🐱', name: '小猫咪' },
    { emoji: '🐼', name: '大熊猫' },
    { emoji: '🐨', name: '考拉' },
    { emoji: '🦊', name: '小狐狸' },
    { emoji: '🐯', name: '小老虎' },
    { emoji: '🦁', name: '小狮子' },
    { emoji: '🐸', name: '小青蛙' },
    { emoji: '🐵', name: '小猴子' },
    { emoji: '🐰', name: '小兔子' },
    { emoji: '🐮', name: '小牛牛' },
    { emoji: '🐷', name: '小猪猪' },
    { emoji: '🐻', name: '小熊熊' },
    { emoji: '🐧', name: '小企鹅' },
    { emoji: '🦄', name: '独角兽' },
    { emoji: '🐝', name: '小蜜蜂' },
    { emoji: '🦋', name: '小蝴蝶' },
    { emoji: '🐢', name: '小乌龟' },
    { emoji: '🐙', name: '小章鱼' },
    { emoji: '🦀', name: '小螃蟹' },
  ];
  const randomIndex = Math.floor(Math.random() * animals.length);
  return animals[randomIndex];
}

export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getGradientColor(progress: number): string {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const green = { r: 74, g: 222, b: 128 };
  const red = { r: 239, g: 68, b: 68 };

  const r = Math.round(green.r + (red.r - green.r) * clampedProgress);
  const g = Math.round(green.g + (red.g - green.g) * clampedProgress);
  const b = Math.round(green.b + (red.b - green.b) * clampedProgress);

  return `rgb(${r}, ${g}, ${b})`;
}

export function createRipple(event: React.MouseEvent<HTMLElement>): void {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = 'ripple 0.6s ease-out';
  ripple.style.pointerEvents = 'none';
  ripple.style.zIndex = '1000';

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

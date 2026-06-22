import { useCallback, MouseEvent } from 'react';

export function useRipple() {
  return useCallback((e: MouseEvent<Element>) => {
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.classList.add('ripple-container');
    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
      if (button.querySelectorAll('.ripple').length === 0) {
        button.classList.remove('ripple-container');
      }
    }, 550);
  }, []);
}

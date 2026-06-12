export function fadeInElement(
  element: HTMLElement,
  duration: number = 400,
  delay: number = 0
): void {
  element.style.opacity = '0';
  element.style.transform = 'translateY(20px)';
  element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;

  requestAnimationFrame(() => {
    setTimeout(() => {
      requestAnimationFrame(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      });
    }, delay);
  });
}

export function fadeInElements(
  elements: HTMLElement[],
  duration: number = 400,
  interval: number = 80
): void {
  elements.forEach((el, index) => {
    fadeInElement(el, duration, index * interval);
  });
}

export function likeButtonAnimate(button: HTMLElement): void {
  const svg = button.querySelector('svg');
  if (!svg) return;

  svg.style.transform = 'scale(1.2)';
  svg.style.transition = 'transform 150ms ease-out';

  setTimeout(() => {
    svg.style.transform = 'scale(1.0)';
    svg.style.transition = 'transform 150ms ease-out';
  }, 150);
}

export function likeCountAnimate(element: HTMLElement, newValue: number): void {
  const startValue = parseInt(element.textContent || '0', 10);
  const diff = newValue - startValue;
  const duration = 300;
  const startTime = performance.now();

  function update(currentTime: number): void {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const easeOut = 1 - Math.pow(1 - progress, 3);
    const currentValue = Math.round(startValue + diff * easeOut);

    element.textContent = currentValue.toString();

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

export function fadeOutElement(element: HTMLElement, duration: number = 300): Promise<void> {
  return new Promise((resolve) => {
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms ease-out`;

    requestAnimationFrame(() => {
      element.style.opacity = '0';
    });

    setTimeout(resolve, duration);
  });
}

export function fadeInUpdate(
  container: HTMLElement,
  renderContent: () => void,
  duration: number = 300
): void {
  container.style.opacity = '0';
  container.style.transition = `opacity ${duration}ms ease-out`;

  setTimeout(() => {
    renderContent();
    requestAnimationFrame(() => {
      container.style.opacity = '1';
    });
  }, duration);
}

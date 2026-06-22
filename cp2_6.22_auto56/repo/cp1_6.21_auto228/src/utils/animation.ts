export function animateValue(
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void,
  onComplete?: () => void
): () => void {
  let startTime: number | null = null;
  let animationId: number | null = null;

  const animate = (timestamp: number) => {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * easeProgress;
    
    callback(current);
    
    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else if (onComplete) {
      onComplete();
    }
  };

  animationId = requestAnimationFrame(animate);

  return () => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
  };
}

export function flashElement(
  element: HTMLElement,
  color: string,
  times: number,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    let count = 0;
    const originalBoxShadow = element.style.boxShadow;
    const originalTransform = element.style.transform;

    const flash = () => {
      element.style.boxShadow = `0 0 20px ${color}, 0 0 40px ${color}`;
      element.style.transform = 'scale(1.1)';
      
      setTimeout(() => {
        element.style.boxShadow = originalBoxShadow;
        element.style.transform = originalTransform;
        
        count++;
        if (count < times) {
          setTimeout(flash, duration / 2);
        } else {
          resolve();
        }
      }, duration / 2);
    };

    flash();
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

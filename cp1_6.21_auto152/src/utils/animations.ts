export function shakeEffect(element: HTMLElement, duration: number = 200): void {
  element.style.transition = 'none';
  const keyframes = [
    { transform: 'translateX(0)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(-3px)' },
    { transform: 'translateX(3px)' },
    { transform: 'translateX(0)' },
  ];

  const animation = element.animate(keyframes, {
    duration,
    easing: 'ease-in-out',
  });

  animation.onfinish = () => {
    element.style.transform = '';
  };
}

export function flashRedEffect(element: HTMLElement, duration: number = 100): void {
  const original = element.style.backgroundColor;
  element.style.transition = 'background-color 0.05s';
  element.style.backgroundColor = 'rgba(255, 77, 77, 0.5)';

  setTimeout(() => {
    element.style.backgroundColor = original;
    setTimeout(() => {
      element.style.transition = '';
    }, 50);
  }, duration);
}

export function deathParticles(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): Promise<void> {
  return new Promise((resolve) => {
    const particles: { x: number; y: number; vx: number; vy: number; alpha: number }[] = [];
    const count = 10;
    const particleDuration = 400;
    const startTime = performance.now();

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 40;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
      });
    }

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / particleDuration, 1);

      for (const p of particles) {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.alpha = 1 - progress;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 77, 77, ${p.alpha})`;
        ctx.fill();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

export function cardHoverTransition(): string {
  return 'transform 0.3s ease';
}

export function breathAnimation(): string {
  return `
    @keyframes breath {
      0%, 100% {
        box-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
      }
      50% {
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.7);
      }
    }
  `;
}

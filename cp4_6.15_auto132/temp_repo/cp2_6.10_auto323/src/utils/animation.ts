import ParticleSystem from './particles';

const particleSystemMap = new WeakMap<HTMLCanvasElement, ParticleSystem>();

export function animateElement(
  element: HTMLElement,
  animationClass: string,
  duration: number
): Promise<void> {
  return new Promise((resolve) => {
    element.classList.add(animationClass);
    
    setTimeout(() => {
      element.classList.remove(animationClass);
      resolve();
    }, duration);
  });
}

export function createParticlesAt(
  x: number,
  y: number,
  canvas: HTMLCanvasElement,
  color: string = '#ffffff',
  count: number = 15
): void {
  let particleSystem = particleSystemMap.get(canvas);
  
  if (!particleSystem) {
    particleSystem = new ParticleSystem(canvas, 300);
    particleSystemMap.set(canvas, particleSystem);
  }
  
  particleSystem.emit(x, y, count, color);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getParticleSystem(canvas: HTMLCanvasElement): ParticleSystem | undefined {
  return particleSystemMap.get(canvas);
}

export function clearParticleSystem(canvas: HTMLCanvasElement): void {
  const particleSystem = particleSystemMap.get(canvas);
  if (particleSystem) {
    particleSystem.clear();
  }
}

export function destroyParticleSystem(canvas: HTMLCanvasElement): void {
  const particleSystem = particleSystemMap.get(canvas);
  if (particleSystem) {
    particleSystem.stop();
    particleSystem.clear();
    particleSystemMap.delete(canvas);
  }
}

export function animateSequence(
  element: HTMLElement,
  animations: { class: string; duration: number; delay?: number }[]
): Promise<void> {
  return animations.reduce(async (promise, anim) => {
    await promise;
    if (anim.delay) {
      await sleep(anim.delay);
    }
    return animateElement(element, anim.class, anim.duration);
  }, Promise.resolve());
}

export function staggerAnimation(
  elements: HTMLElement[],
  animationClass: string,
  duration: number,
  staggerDelay: number = 100
): Promise<void[]> {
  return Promise.all(
    elements.map((element, index) => 
      sleep(index * staggerDelay).then(() => 
        animateElement(element, animationClass, duration)
      )
    )
  );
}

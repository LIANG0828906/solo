export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export interface AnimationState {
  start: number;
  end: number;
  current: number;
  duration: number;
  elapsed: number;
  active: boolean;
}

export const createAnimation = (
  start: number,
  end: number,
  duration: number
): AnimationState => ({
  start,
  end,
  current: start,
  duration,
  elapsed: 0,
  active: true,
});

export const updateAnimation = (
  anim: AnimationState,
  deltaTime: number,
  easing: (t: number) => number = easeOutCubic
): AnimationState => {
  if (!anim.active) return anim;

  const newElapsed = anim.elapsed + deltaTime;
  const t = Math.min(newElapsed / anim.duration, 1);
  const easedT = easing(t);
  const current = lerp(anim.start, anim.end, easedT);
  const active = t < 1;

  return {
    ...anim,
    current,
    elapsed: newElapsed,
    active,
  };
};

export const animateValue = (
  from: number,
  to: number,
  progress: number,
  easing: (t: number) => number = easeOutCubic
): number => {
  const t = clamp(progress, 0, 1);
  return lerp(from, to, easing(t));
};

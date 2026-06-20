export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'elastic' | 'bounce';

export type KeyframeValue = number[];

export interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: number[];
  easing: EasingType;
}

export const easingFunctions: Record<EasingType, (t: number) => number> = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  elastic: (t: number) => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
  },
  bounce: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  },
};

export function interpolateValue(
  from: KeyframeValue,
  to: KeyframeValue,
  t: number,
  easing: EasingType
): KeyframeValue {
  const easedT = easingFunctions[easing](t);
  return from.map((fromVal, index) => {
    const toVal = to[index] ?? fromVal;
    return fromVal + (toVal - fromVal) * easedT;
  });
}

export function getPropertyAtTime(
  keyframes: Keyframe[],
  currentTime: number
): KeyframeValue | null {
  if (keyframes.length === 0) return null;

  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

  if (currentTime <= sortedKeyframes[0].time) {
    return [...sortedKeyframes[0].value];
  }

  if (currentTime >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    return [...sortedKeyframes[sortedKeyframes.length - 1].value];
  }

  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    const prev = sortedKeyframes[i];
    const next = sortedKeyframes[i + 1];

    if (currentTime >= prev.time && currentTime <= next.time) {
      const duration = next.time - prev.time;
      const t = duration === 0 ? 0 : (currentTime - prev.time) / duration;
      return interpolateValue(prev.value, next.value, t, prev.easing);
    }
  }

  return null;
}

export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function quadraticEase(t: number): number {
  if (t < 0.5) return 2 * t * t;
  return -1 + (4 - 2 * t) * t;
}

export function elasticEaseOut(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
}

export interface AnimationConfig {
  from: number;
  to: number;
  duration: number;
  easing: (t: number) => number;
}

export function scaleAnimation(
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number = elasticEaseOut
): AnimationConfig {
  return { from, to, duration, easing };
}

export function bounceAnimation(scale: number = 1.2): AnimationConfig {
  return { from: 1, to: scale, duration: 300, easing: elasticEaseOut };
}

export function fadeInOut(duration: number = 1000): AnimationConfig {
  return { from: 0, to: 1, duration, easing: quadraticEase };
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function animateValue(
  config: AnimationConfig,
  currentTime: number
): number {
  const t = Math.min(currentTime / config.duration, 1);
  const easedT = config.easing(t);
  return lerp(config.from, config.to, easedT);
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

export function mixColors(colors: string[]): string {
  if (colors.length === 0) return '#FFFFFF';
  const rgbs = colors.map(hexToRgb);
  const r = Math.round(rgbs.reduce((s, c) => s + c.r, 0) / rgbs.length);
  const g = Math.round(rgbs.reduce((s, c) => s + c.g, 0) / rgbs.length);
  const b = Math.round(rgbs.reduce((s, c) => s + c.b, 0) / rgbs.length);
  return `rgb(${r},${g},${b})`;
}

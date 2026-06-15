export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const smoothDamp = (
  current: number,
  target: number,
  currentVelocity: number,
  smoothTime: number,
  maxSpeed: number,
  deltaTime: number
): { value: number; velocity: number } => {
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  let change = current - target;
  const originalTo = target;
  const maxChange = maxSpeed * smoothTime;
  change = clamp(change, -maxChange, maxChange);
  target = current - change;
  const temp = (currentVelocity + omega * change) * deltaTime;
  currentVelocity = (currentVelocity - omega * temp) * exp;
  let output = target + (change + temp) * exp;
  if (originalTo - current > 0.0 === output > originalTo) {
    output = originalTo;
    currentVelocity = (output - originalTo) / deltaTime;
  }
  return { value: output, velocity: currentVelocity };
};

export const exponentialSmooth = (
  current: number,
  target: number,
  smoothness: number,
  deltaTime: number
): number => {
  const alpha = 1 - Math.exp(-deltaTime / Math.max(smoothness, 0.001));
  return current + (target - current) * alpha;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) =>
    Math.round(clamp(n, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const lerpColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(
    lerp(c1.r, c2.r, t),
    lerp(c1.g, c2.g, t),
    lerp(c1.b, c2.b, t)
  );
};

export const shiftHue = (hex: string, shift: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = (h + shift) % 1;
  if (h < 0) h += 1;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    return rgbToHex(l, l, l);
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return rgbToHex(
    hue2rgb(p, q, h + 1 / 3),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1 / 3)
  );
};

export const getAudioResponseColor = (
  baseColor: string,
  intensity: number,
  shiftIntensity: number
): string => {
  const clampedIntensity = clamp(intensity, 0, 1);
  const hueShift = clampedIntensity * shiftIntensity * 0.3;
  const brightenedColor = lerpColor(baseColor, '#FFFFFF', clampedIntensity * 0.3);
  return shiftHue(brightenedColor, hueShift);
};

export class SpringAnimator {
  private velocity = 0;
  private value: number;
  private target: number;
  private stiffness: number;
  private damping: number;

  constructor(
    initialValue: number,
    stiffness = 100,
    damping = 10
  ) {
    this.value = initialValue;
    this.target = initialValue;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  setTarget(target: number): void {
    this.target = target;
  }

  update(deltaTime: number): number {
    const springForce = -this.stiffness * (this.value - this.target);
    const dampingForce = -this.damping * this.velocity;
    const acceleration = springForce + dampingForce;
    this.velocity += acceleration * deltaTime;
    this.value += this.velocity * deltaTime;
    return this.value;
  }

  getValue(): number {
    return this.value;
  }

  reset(value: number): void {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }
}

export class Tween {
  private startTime: number | null = null;
  private fromValue: number;
  private toValue: number;
  private duration: number;
  private easeFn: (t: number) => number;
  private onUpdate: (value: number) => void;
  private onComplete: (() => void) | null;
  private isPlaying = false;

  constructor(
    from: number,
    to: number,
    duration: number,
    onUpdate: (value: number) => void,
    ease: (t: number) => number = easeInOutQuad,
    onComplete?: () => void
  ) {
    this.fromValue = from;
    this.toValue = to;
    this.duration = duration;
    this.onUpdate = onUpdate;
    this.easeFn = ease;
    this.onComplete = onComplete || null;
  }

  start(): void {
    this.startTime = performance.now();
    this.isPlaying = true;
    this.animate();
  }

  private animate(): void {
    if (!this.startTime || !this.isPlaying) return;

    const elapsed = (performance.now() - this.startTime) / 1000;
    const progress = Math.min(elapsed / this.duration, 1);
    const easedProgress = this.easeFn(progress);
    const currentValue = lerp(this.fromValue, this.toValue, easedProgress);

    this.onUpdate(currentValue);

    if (progress < 1) {
      requestAnimationFrame(() => this.animate());
    } else {
      this.isPlaying = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  stop(): void {
    this.isPlaying = false;
  }
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface OKLab {
  L: number;
  a: number;
  b: number;
}

export const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (x: number) =>
    Math.max(0, Math.min(255, Math.round(x * 255)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const rgbToHsl = (r: number, g: number, b: number): HSL => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
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

  return { h, s, l };
};

export const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  if (s === 0) {
    return [l, l, l];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    hue2rgb(p, q, h + 1 / 3),
    hue2rgb(p, q, h),
    hue2rgb(p, q, h - 1 / 3),
  ];
};

export const rgbToOklab = (r: number, g: number, b: number): OKLab => {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
};

export const oklabToRgb = (L: number, a: number, b: number): [number, number, number] => {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const heatmapStops: Array<{ position: number; color: string }> = [
  { position: 0.0, color: '#1a4de6' },
  { position: 0.2, color: '#1ab2e6' },
  { position: 0.4, color: '#33e680' },
  { position: 0.6, color: '#f2d933' },
  { position: 0.8, color: '#f24d26' },
  { position: 1.0, color: '#e60d0d' },
];

export const getHeatColorOKLab = (density: number): string => {
  const d = Math.max(0, Math.min(1, density));

  let lower = heatmapStops[0];
  let upper = heatmapStops[heatmapStops.length - 1];

  for (let i = 0; i < heatmapStops.length - 1; i++) {
    if (d >= heatmapStops[i].position && d <= heatmapStops[i + 1].position) {
      lower = heatmapStops[i];
      upper = heatmapStops[i + 1];
      break;
    }
  }

  const range = upper.position - lower.position;
  const t = range === 0 ? 0 : (d - lower.position) / range;
  const smoothT = t * t * (3 - 2 * t);

  const [r1, g1, b1] = hexToRgb(lower.color);
  const [r2, g2, b2] = hexToRgb(upper.color);

  const lab1 = rgbToOklab(r1, g1, b1);
  const lab2 = rgbToOklab(r2, g2, b2);

  const L = lab1.L + (lab2.L - lab1.L) * smoothT;
  const a = lab1.a + (lab2.a - lab1.a) * smoothT;
  const bVal = lab1.b + (lab2.b - lab1.b) * smoothT;

  const [r, g, b] = oklabToRgb(L, a, bVal);

  return rgbToHex(
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b))
  );
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeOutQuad = (t: number): number => {
  return 1 - (1 - t) * (1 - t);
};

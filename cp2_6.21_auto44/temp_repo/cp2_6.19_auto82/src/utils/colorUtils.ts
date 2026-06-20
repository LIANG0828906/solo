export type ColorFamily =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'gray'
  | 'white'
  | 'black';

export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a?: number;
  hex: string;
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'named';
  family: ColorFamily;
  luminance: number;
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_RE = /^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
const RGBA_RE = /^rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([\d.]+)\s*\)$/i;
const HSL_RE = /^hsl\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*\)$/i;
const HSLA_RE = /^hsla\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})%\s*,\s*(\d{1,3})%\s*,\s*([\d.]+)\s*\)$/i;

const NAMED_COLORS: Record<string, [number, number, number]> = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50],
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
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
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function getColorFamily(r: number, g: number, b: number): ColorFamily {
  if (r === 0 && g === 0 && b === 0) return 'black';
  if (r === 255 && g === 255 && b === 255) return 'white';

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  if (diff < 8) {
    const lum = getLuminance(r, g, b);
    if (lum < 50) return 'black';
    if (lum > 200) return 'white';
    return 'gray';
  }

  let h = 0;
  if (max === r) h = ((g - b) / diff) % 6;
  else if (max === g) h = (b - r) / diff + 2;
  else h = (r - g) / diff + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = diff / max;
  const l = (max + min) / 2;

  if (s < 0.15) {
    return 'gray';
  }

  if (l < 0.2) return 'black';
  if (l > 0.85 && s < 0.3) return 'white';

  if (h >= 345 || h < 15) return 'red';
  if (h >= 15 && h < 45) return 'orange';
  if (h >= 45 && h < 75) return 'yellow';
  if (h >= 75 && h < 150) return 'green';
  if (h >= 150 && h < 210) return 'cyan';
  if (h >= 210 && h < 270) return 'blue';
  if (h >= 270 && h < 315) return 'purple';
  if (h >= 315 && h < 345) return 'pink';

  if (r > g && r > b && g > b && h < 45) return 'brown';
  if (r > g && r > b && g < b) return 'brown';

  return 'gray';
}

export function isValidCssColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  const c = color.trim();

  if (HEX_RE.test(c)) return true;
  if (RGB_RE.test(c)) {
    const m = c.match(RGB_RE)!;
    const r = parseInt(m[1], 10);
    const g = parseInt(m[2], 10);
    const b = parseInt(m[3], 10);
    return r <= 255 && g <= 255 && b <= 255;
  }
  if (RGBA_RE.test(c)) {
    const m = c.match(RGBA_RE)!;
    const r = parseInt(m[1], 10);
    const g = parseInt(m[2], 10);
    const b = parseInt(m[3], 10);
    const a = parseFloat(m[4]);
    return r <= 255 && g <= 255 && b <= 255 && a >= 0 && a <= 1;
  }
  if (HSL_RE.test(c)) {
    const m = c.match(HSL_RE)!;
    const h = parseInt(m[1], 10);
    const s = parseInt(m[2], 10);
    const l = parseInt(m[3], 10);
    return h <= 360 && s <= 100 && l <= 100;
  }
  if (HSLA_RE.test(c)) {
    const m = c.match(HSLA_RE)!;
    const h = parseInt(m[1], 10);
    const s = parseInt(m[2], 10);
    const l = parseInt(m[3], 10);
    const a = parseFloat(m[4]);
    return h <= 360 && s <= 100 && l <= 100 && a >= 0 && a <= 1;
  }

  return NAMED_COLORS.hasOwnProperty(c.toLowerCase());
}

export function parseColor(color: string): ParsedColor | null {
  if (!isValidCssColor(color)) return null;
  const c = color.trim();
  const cl = c.toLowerCase();

  let r = 0, g = 0, b = 0, a: number | undefined;
  let format: ParsedColor['format'] = 'hex';

  if (NAMED_COLORS[cl]) {
    [r, g, b] = NAMED_COLORS[cl];
    format = 'named';
  } else if (HEX_RE.test(c)) {
    let hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map((x) => x + x).join('');
    }
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if (hex.length === 8) {
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
    format = 'hex';
  } else if (RGB_RE.test(c)) {
    const m = c.match(RGB_RE)!;
    r = parseInt(m[1], 10);
    g = parseInt(m[2], 10);
    b = parseInt(m[3], 10);
    format = 'rgb';
  } else if (RGBA_RE.test(c)) {
    const m = c.match(RGBA_RE)!;
    r = parseInt(m[1], 10);
    g = parseInt(m[2], 10);
    b = parseInt(m[3], 10);
    a = parseFloat(m[4]);
    format = 'rgba';
  } else if (HSL_RE.test(c)) {
    const m = c.match(HSL_RE)!;
    [r, g, b] = hslToRgb(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
    format = 'hsl';
  } else if (HSLA_RE.test(c)) {
    const m = c.match(HSLA_RE)!;
    [r, g, b] = hslToRgb(parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10));
    a = parseFloat(m[4]);
    format = 'hsla';
  }

  const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();

  return {
    r,
    g,
    b,
    a,
    hex,
    format,
    family: getColorFamily(r, g, b),
    luminance: getLuminance(r, g, b),
  };
}

export const COLOR_FAMILY_LABELS: Record<ColorFamily, { label: string; color: string }> = {
  red: { label: '红色系', color: '#ff6b6b' },
  orange: { label: '橙色系', color: '#ffa94d' },
  yellow: { label: '黄色系', color: '#ffd43b' },
  green: { label: '绿色系', color: '#51cf66' },
  cyan: { label: '青色系', color: '#22b8cf' },
  blue: { label: '蓝色系', color: '#339af0' },
  purple: { label: '紫色系', color: '#9775fa' },
  pink: { label: '粉色系', color: '#f783ac' },
  brown: { label: '棕色系', color: '#a0522d' },
  gray: { label: '灰色系', color: '#868e96' },
  white: { label: '白色系', color: '#f8f9fa' },
  black: { label: '黑色系', color: '#212529' },
};

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

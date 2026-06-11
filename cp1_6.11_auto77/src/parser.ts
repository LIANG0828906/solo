export interface GradientStop {
  color: string;
  position: number;
  rawColor: string;
}

export interface GradientConfig {
  type: 'linear' | 'radial' | 'conic';
  angle?: number;
  stops: GradientStop[];
  centerX?: number;
  centerY?: number;
  radiusX?: number;
  radiusY?: number;
  rawCss: string;
}

export interface ParseResult {
  success: boolean;
  gradient?: GradientConfig;
  error?: {
    line: number;
    column: number;
    message: string;
  };
}

const HEX_COLOR_REGEX = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const RGB_COLOR_REGEX = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i;
const HSL_COLOR_REGEX = /hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+))?\s*\)/i;

const ANGLE_REGEX = /([+-]?[\d.]+)(deg|rad|turn|grad)/i;
const POSITION_REGEX = /([\d.]+)(%)/;

const GRADIENT_TYPES = ['linear-gradient', 'radial-gradient', 'conic-gradient'];

export function parseGradient(css: string): ParseResult {
  const trimmedCss = css.trim();

  if (!trimmedCss) {
    return {
      success: false,
      error: { line: 1, column: 1, message: '请输入CSS渐变代码' }
    };
  }

  let gradientType: 'linear' | 'radial' | 'conic' | null = null;
  let content = '';

  for (const type of GRADIENT_TYPES) {
    const prefix = type + '(';
    if (trimmedCss.toLowerCase().startsWith(prefix)) {
      gradientType = type.replace('-gradient', '') as 'linear' | 'radial' | 'conic';
      const rest = trimmedCss.slice(prefix.length);
      const lastParen = rest.lastIndexOf(')');
      if (lastParen === -1) {
        return {
          success: false,
          error: { line: 1, column: trimmedCss.length + 1, message: '缺少右括号' }
        };
      }
      content = rest.slice(0, lastParen).trim();
      break;
    }
  }

  if (!gradientType) {
    return {
      success: false,
      error: { line: 1, column: 1, message: '未识别的渐变类型，支持 linear-gradient, radial-gradient, conic-gradient' }
    };
  }

  try {
    const parts = splitGradientArgs(content);
    let angle: number | undefined;
    let centerX = 0.5;
    let centerY = 0.5;
    let radiusX = 0.5;
    let radiusY = 0.5;
    const stops: GradientStop[] = [];

    let stopStartIndex = 0;

    if (gradientType === 'linear' || gradientType === 'conic') {
      const angleMatch = parts[0].match(ANGLE_REGEX);
      if (angleMatch) {
        angle = parseAngle(angleMatch[1], angleMatch[2]);
        stopStartIndex = 1;
      } else if (parts[0].toLowerCase().startsWith('from ')) {
        const angleMatch2 = parts[0].match(/from\s+([+-]?[\d.]+)(deg|rad|turn|grad)/i);
        if (angleMatch2) {
          angle = parseAngle(angleMatch2[1], angleMatch2[2]);
          stopStartIndex = 1;
        }
      } else if (parts[0].toLowerCase().startsWith('to ')) {
        angle = parseDirection(parts[0]);
        stopStartIndex = 1;
      }

      if (gradientType === 'conic' && angle === undefined) {
        angle = 0;
      }
    }

    if (gradientType === 'radial') {
      let shapeParsed = false;
      let idx = 0;

      const firstPart = parts[0].toLowerCase();
      if (firstPart === 'circle' || firstPart === 'ellipse') {
        shapeParsed = true;
        idx = 1;

        if (parts[idx] && parts[idx].toLowerCase().startsWith('at ')) {
          const pos = parsePosition(parts[idx].slice(3));
          centerX = pos.x;
          centerY = pos.y;
          idx++;
        }
      } else if (firstPart.startsWith('at ')) {
        const pos = parsePosition(firstPart.slice(3));
        centerX = pos.x;
        centerY = pos.y;
        shapeParsed = true;
        idx = 1;
      } else if (parts.length > 1 && parts[1].toLowerCase().startsWith('at ')) {
        const pos = parsePosition(parts[1].slice(3));
        centerX = pos.x;
        centerY = pos.y;
        shapeParsed = true;
        idx = 2;
      }

      if (!shapeParsed) {
        for (let i = 0; i < Math.min(parts.length, 3); i++) {
          if (parts[i].toLowerCase().startsWith('at ')) {
            const pos = parsePosition(parts[i].slice(3));
            centerX = pos.x;
            centerY = pos.y;
            idx = i + 1;
            shapeParsed = true;
            break;
          }
        }
      }

      stopStartIndex = idx;
    }

    for (let i = stopStartIndex; i < parts.length; i++) {
      const stop = parseColorStop(parts[i], i, parts.length);
      if (stop) {
        stops.push(stop);
      }
    }

    if (stops.length < 2) {
      return {
        success: false,
        error: { line: 1, column: 1, message: '渐变至少需要两个颜色停止点' }
      };
    }

    normalizeStopPositions(stops);

    return {
      success: true,
      gradient: {
        type: gradientType,
        angle,
        stops,
        centerX,
        centerY,
        radiusX,
        radiusY,
        rawCss: trimmedCss
      }
    };
  } catch (e) {
    const error = e as Error;
    return {
      success: false,
      error: { line: 1, column: 1, message: error.message || '解析失败' }
    };
  }
}

function splitGradientArgs(content: string): string[] {
  const parts: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && parenDepth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseAngle(value: string, unit: string): number {
  const num = parseFloat(value);
  switch (unit.toLowerCase()) {
    case 'deg':
      return num;
    case 'rad':
      return (num * 180) / Math.PI;
    case 'turn':
      return num * 360;
    case 'grad':
      return num * 0.9;
    default:
      return num;
  }
}

function parseDirection(direction: string): number {
  const dir = direction.toLowerCase();
  if (dir.includes('to right')) return 90;
  if (dir.includes('to left')) return 270;
  if (dir.includes('to bottom')) return 180;
  if (dir.includes('to top')) return 0;
  if (dir.includes('to bottom right')) return 135;
  if (dir.includes('to bottom left')) return 225;
  if (dir.includes('to top right')) return 45;
  if (dir.includes('to top left')) return 315;
  return 180;
}

function parsePosition(posStr: string): { x: number; y: number } {
  const parts = posStr.trim().split(/\s+/);
  let x = 0.5;
  let y = 0.5;

  if (parts.length >= 1) {
    const xMatch = parts[0].match(POSITION_REGEX);
    if (xMatch) {
      x = parseFloat(xMatch[1]) / 100;
    } else if (!isNaN(parseFloat(parts[0]))) {
      x = parseFloat(parts[0]) / 100;
    } else if (parts[0].toLowerCase() === 'left') x = 0;
    else if (parts[0].toLowerCase() === 'right') x = 1;
    else if (parts[0].toLowerCase() === 'center') x = 0.5;
  }

  if (parts.length >= 2) {
    const yMatch = parts[1].match(POSITION_REGEX);
    if (yMatch) {
      y = parseFloat(yMatch[1]) / 100;
    } else if (!isNaN(parseFloat(parts[1]))) {
      y = parseFloat(parts[1]) / 100;
    } else if (parts[1].toLowerCase() === 'top') y = 0;
    else if (parts[1].toLowerCase() === 'bottom') y = 1;
    else if (parts[1].toLowerCase() === 'center') y = 0.5;
  }

  return { x, y };
}

function parseColorStop(part: string, index: number, total: number): GradientStop | null {
  const trimmed = part.trim();

  const colorMatch =
    trimmed.match(HEX_COLOR_REGEX) ||
    trimmed.match(RGB_COLOR_REGEX) ||
    trimmed.match(HSL_COLOR_REGEX);

  if (!colorMatch) {
    throw new Error(`无法解析颜色: ${trimmed}`);
  }

  const rawColor = colorMatch[0];
  const afterColor = trimmed.slice(rawColor.length).trim();
  let position: number;

  const posMatch = afterColor.match(POSITION_REGEX);
  if (posMatch) {
    position = parseFloat(posMatch[1]) / 100;
  } else if (afterColor && !isNaN(parseFloat(afterColor))) {
    position = parseFloat(afterColor) / 100;
  } else {
    if (total <= 2) {
      position = index === 0 ? 0 : 1;
    } else {
      position = index / (total - 1);
    }
  }

  return {
    color: normalizeColor(rawColor),
    position,
    rawColor
  };
}

function normalizeColor(color: string): string {
  const hexMatch = color.match(HEX_COLOR_REGEX);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    return '#' + hex.slice(0, 6).toUpperCase();
  }

  const rgbMatch = color.match(RGB_COLOR_REGEX);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  const hslMatch = color.match(HSL_COLOR_REGEX);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360;
    const s = parseFloat(hslMatch[2]) / 100;
    const l = parseFloat(hslMatch[3]) / 100;
    const rgb = hslToRgb(h, s, l);
    return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  return color;
}

function hslToRgb(h: number, s: number, l: number): number[] {
  let r: number, g: number, b: number;

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

function normalizeStopPositions(stops: GradientStop[]): void {
  if (stops.length === 0) return;

  if (stops[0].position === undefined || stops[0].position < 0) {
    stops[0].position = 0;
  }

  if (stops[stops.length - 1].position === undefined || stops[stops.length - 1].position > 1) {
    stops[stops.length - 1].position = 1;
  }

  for (let i = 1; i < stops.length - 1; i++) {
    if (stops[i].position === undefined || isNaN(stops[i].position)) {
      let prevIdx = i - 1;
      let nextIdx = i + 1;

      while (prevIdx > 0 && (stops[prevIdx].position === undefined || isNaN(stops[prevIdx].position))) {
        prevIdx--;
      }
      while (nextIdx < stops.length - 1 && (stops[nextIdx].position === undefined || isNaN(stops[nextIdx].position))) {
        nextIdx++;
      }

      const prevPos = stops[prevIdx].position;
      const nextPos = stops[nextIdx].position;
      const step = (nextPos - prevPos) / (nextIdx - prevIdx);
      stops[i].position = prevPos + step * (i - prevIdx);
    }
  }

  for (let i = 1; i < stops.length; i++) {
    if (stops[i].position < stops[i - 1].position) {
      stops[i].position = stops[i - 1].position;
    }
  }
}

export function extractGradientColors(config: GradientConfig): string[] {
  return config.stops.map(stop => stop.color);
}

export function interpolateColor(colors: string[], t: number): string {
  if (colors.length === 0) return '#FFFFFF';
  if (colors.length === 1) return colors[0];

  t = Math.max(0, Math.min(1, t));

  const numSegments = colors.length - 1;
  const segment = Math.min(Math.floor(t * numSegments), numSegments - 1);
  const segmentT = (t * numSegments) - segment;

  const color1 = colors[segment];
  const color2 = colors[segment + 1];

  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * segmentT);
  const g = Math.round(g1 + (g2 - g1) * segmentT);
  const b = Math.round(b1 + (b2 - b1) * segmentT);

  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function createCanvasGradient(
  ctx: CanvasRenderingContext2D,
  config: GradientConfig,
  width: number,
  height: number
): CanvasGradient {
  let gradient: CanvasGradient;

  if (config.type === 'linear') {
    const angle = config.angle ?? 180;
    const rad = ((angle - 90) * Math.PI) / 180;
    const centerX = width / 2;
    const centerY = height / 2;
    const length = Math.sqrt(width * width + height * height) / 2;

    const x1 = centerX - Math.cos(rad) * length;
    const y1 = centerY - Math.sin(rad) * length;
    const x2 = centerX + Math.cos(rad) * length;
    const y2 = centerY + Math.sin(rad) * length;

    gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  } else if (config.type === 'radial') {
    const cx = (config.centerX ?? 0.5) * width;
    const cy = (config.centerY ?? 0.5) * height;
    const rx = (config.radiusX ?? 0.5) * width;
    const ry = (config.radiusY ?? 0.5) * height;
    const r = Math.max(rx, ry);

    gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  } else {
    const cx = width / 2;
    const cy = height / 2;
    gradient = ctx.createConicGradient((config.angle ?? 0) * Math.PI / 180, cx, cy);
  }

  config.stops.forEach(stop => {
    gradient.addColorStop(Math.max(0, Math.min(1, stop.position)), stop.rawColor);
  });

  return gradient;
}

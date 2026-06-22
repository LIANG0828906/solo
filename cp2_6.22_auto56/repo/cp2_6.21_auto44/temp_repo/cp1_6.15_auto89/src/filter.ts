export type FilterType = 'none' | 'warm' | 'cool' | 'bw' | 'cyber';

export interface FilterConfig {
  cssFilter: string;
  name: string;
}

export const FILTERS: Record<Exclude<FilterType, 'none'>, FilterConfig> = {
  warm: {
    cssFilter:
      'sepia(0.35) saturate(1.3) hue-rotate(-8deg) brightness(1.05) contrast(1.08)',
    name: '复古暖黄',
  },
  cool: {
    cssFilter:
      'saturate(0.9) hue-rotate(200deg) brightness(0.95) contrast(1.1) blur(0.3px)',
    name: '冷峻青蓝',
  },
  bw: {
    cssFilter:
      'grayscale(1) brightness(0.95) contrast(1.15) sepia(0.08)',
    name: '黑白文艺',
  },
  cyber: {
    cssFilter:
      'saturate(1.6) hue-rotate(-15deg) brightness(1.05) contrast(1.2)',
    name: '赛博朋克霓虹',
  },
};

export function applyFilter(img: HTMLImageElement, filter: FilterType): void {
  if (filter === 'none' || !FILTERS[filter as Exclude<FilterType, 'none'>]) {
    img.style.filter = 'none';
    return;
  }
  const config = FILTERS[filter as Exclude<FilterType, 'none'>];
  img.style.filter = config.cssFilter;
}

export function getFilterConfig(filter: FilterType): FilterConfig | null {
  if (filter === 'none') return null;
  return FILTERS[filter as Exclude<FilterType, 'none'>] ?? null;
}

export function parseFilterComponents(
  filter: FilterType
): { sepia?: number; saturate?: number; hueRotate?: number; brightness?: number; contrast?: number; grayscale?: number; blur?: number } {
  if (filter === 'none') return {};
  const config = getFilterConfig(filter);
  if (!config) return {};
  const css = config.cssFilter;
  const result: ReturnType<typeof parseFilterComponents> = {};

  const sepiaMatch = css.match(/sepia\(([0-9.]+)\)/);
  if (sepiaMatch) result.sepia = parseFloat(sepiaMatch[1]);

  const saturateMatch = css.match(/saturate\(([0-9.]+)\)/);
  if (saturateMatch) result.saturate = parseFloat(saturateMatch[1]);

  const hueMatch = css.match(/hue-rotate\((-?[0-9.]+)deg\)/);
  if (hueMatch) result.hueRotate = parseFloat(hueMatch[1]);

  const brightnessMatch = css.match(/brightness\(([0-9.]+)\)/);
  if (brightnessMatch) result.brightness = parseFloat(brightnessMatch[1]);

  const contrastMatch = css.match(/contrast\(([0-9.]+)\)/);
  if (contrastMatch) result.contrast = parseFloat(contrastMatch[1]);

  const grayscaleMatch = css.match(/grayscale\(([0-9.]+)\)/);
  if (grayscaleMatch) result.grayscale = parseFloat(grayscaleMatch[1]);

  const blurMatch = css.match(/blur\(([0-9.]+)px\)/);
  if (blurMatch) result.blur = parseFloat(blurMatch[1]);

  return result;
}

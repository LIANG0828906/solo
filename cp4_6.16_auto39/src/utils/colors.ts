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

export function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function lightenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const newR = Math.min(255, Math.round(r + (255 - r) * percent));
  const newG = Math.min(255, Math.round(g + (255 - g) * percent));
  const newB = Math.min(255, Math.round(b + (255 - b) * percent));
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export function darkenColor(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const newR = Math.max(0, Math.round(r * (1 - percent)));
  const newG = Math.max(0, Math.round(g * (1 - percent)));
  const newB = Math.max(0, Math.round(b * (1 - percent)));
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

let backdropFilterSupported: boolean | null = null;

export function supportsBackdropFilter(): boolean {
  if (backdropFilterSupported !== null) {
    return backdropFilterSupported;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const el = document.createElement('div');
  (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).backdropFilter = 'blur(10px)';
  (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = 'blur(10px)';
  const nativeSupport =
    (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).backdropFilter !== '' ||
    (el.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter !== '';
  const cssProps = ['backdropFilter', 'webkitBackdropFilter'];
  const styleSupported = cssProps.some(
    prop => prop in el.style
  );
  backdropFilterSupported = nativeSupport || styleSupported;
  el.remove();
  return backdropFilterSupported;
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateGlassFallbackBackground(
  coverColor: string,
  intensity: number = 0.55
): string {
  if (supportsBackdropFilter()) {
    return `rgba(255, 255, 255, ${0.15 + intensity * 0.1})`;
  }
  const lighter = lightenColor(coverColor, 0.5);
  const darker = rgba(coverColor, 0.6);
  const lighterRgba = rgba(lighter, 0.5);
  return `linear-gradient(135deg, ${lighterRgba} 0%, ${darker} 100%)`;
}

export function applyGlassStyles(
  element: HTMLElement,
  coverColor: string,
  blurAmount: number = 10
): void {
  if (supportsBackdropFilter()) {
    element.style.backdropFilter = `blur(${blurAmount}px)`;
    (element.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = `blur(${blurAmount}px)`;
    element.style.background = `rgba(255, 255, 255, 0.22)`;
  } else {
    element.style.background = generateGlassFallbackBackground(coverColor, 0.6);
  }
}


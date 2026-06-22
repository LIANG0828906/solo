import type { HSLColor, Palette } from '../types/color';
import { hslToHex, hslToString } from './colorUtils';

export const generateCSSVariables = (palette: Palette, prefix: string = 'color'): string => {
  const colorNames = ['primary', 'secondary', 'accent', 'muted', 'highlight'];
  const lines: string[] = ['/* Color Palette CSS Variables */'];

  palette.colors.forEach((color, idx) => {
    const name = colorNames[idx] || `color-${idx + 1}`;
    const hex = hslToHex(color);
    const hsl = hslToString(color);
    lines.push(`--${prefix}-${name}: ${hex};`);
    lines.push(`--${prefix}-${name}-hsl: ${hsl};`);
  });

  return lines.join('\n');
};

export const generateCSSCodeBlock = (palette: Palette, prefix: string = 'color'): string => {
  const variables = generateCSSVariables(palette, prefix);
  return `:root {\n${variables.split('\n').map(l => l ? `  ${l}` : l).join('\n')}\n}`;
};

export const generateSCSSVariables = (palette: Palette, prefix: string = 'color'): string => {
  const colorNames = ['primary', 'secondary', 'accent', 'muted', 'highlight'];
  const lines: string[] = ['// Color Palette SCSS Variables'];

  palette.colors.forEach((color, idx) => {
    const name = colorNames[idx] || `${prefix}-${idx + 1}`;
    const hex = hslToHex(color);
    lines.push(`$${prefix}-${name}: ${hex};`);
  });

  palette.colors.forEach((color, idx) => {
    const name = colorNames[idx] || `${prefix}-${idx + 1}`;
    const hsl = hslToString(color);
    lines.push(`$${prefix}-${name}-hsl: ${hsl};`);
  });

  return lines.join('\n');
};

export const generateSVGColorCard = (
  palette: Palette,
  width: number = 400,
  height: number = 120
): string => {
  const colorCount = palette.colors.length;
  const padding = 16;
  const circleRadius = (height - padding * 2) / 2;
  const spacing = (width - padding * 2 - circleRadius * 2 * colorCount) / (colorCount - 1 || 1);

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  svgContent += `<rect width="${width}" height="${height}" fill="#16213e" rx="8"/>`;
  svgContent += `<text x="${padding}" y="${padding + 16}" font-family="Arial, sans-serif" font-size="14" fill="#eaeaea" font-weight="bold">${palette.name}</text>`;

  palette.colors.forEach((color, idx) => {
    const cx = padding + circleRadius + idx * (circleRadius * 2 + spacing);
    const cy = height / 2 + 10;
    const hex = hslToHex(color);

    svgContent += `<circle cx="${cx}" cy="${cy}" r="${circleRadius}" fill="${hex}" stroke="#eaeaea" stroke-width="2"/>`;

    const textY = cy + circleRadius + 16;
    svgContent += `<text x="${cx}" y="${textY}" font-family="Arial, sans-serif" font-size="10" fill="#eaeaea" text-anchor="middle">${hex.toUpperCase()}</text>`;
  });

  svgContent += `</svg>`;
  return svgContent;
};

export const generateTailwindConfig = (palette: Palette): string => {
  const colorNames = ['primary', 'secondary', 'accent', 'muted', 'highlight'];
  const colorEntries: string[] = [];

  palette.colors.forEach((color, idx) => {
    const name = colorNames[idx] || `color${idx + 1}`;
    const hex = hslToHex(color);
    colorEntries.push(`      '${name}': '${hex}',`);
  });

  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
${colorEntries.join('\n')}
      },
    },
  },
}`;
};

export const generateJSONPalette = (palette: Palette): string => {
  return JSON.stringify({
    name: palette.name,
    type: palette.type,
    createdAt: new Date(palette.createdAt).toISOString(),
    colors: palette.colors.map(c => ({
      hsl: { h: c.h, s: c.s, l: c.l },
      hex: hslToHex(c),
      hslString: hslToString(c),
    })),
  }, null, 2);
};

export const generatePNGDownloadUrl = async (svgString: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas not supported'));
      return;
    }

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };

    img.src = url;
  });
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

export const sortColorsByLuminance = (colors: HSLColor[]): HSLColor[] => {
  return [...colors].sort((a, b) => a.l - b.l);
};

export const sortColorsByHue = (colors: HSLColor[]): HSLColor[] => {
  return [...colors].sort((a, b) => a.h - b.h);
};

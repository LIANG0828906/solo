export function hashStringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

export function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateCoverColors(title: string): string[] {
  const baseHue = hashStringToHue(title);
  const saturation = 75 + Math.abs(hashStringToHue(title + '_s')) % 15;
  const colors: string[] = [];

  for (let i = 0; i < 3; i++) {
    const hue = (baseHue + i * 40) % 360;
    const lightness = 35 + i * 15;
    colors.push(hslToHex(hue, saturation, lightness));
  }

  return colors;
}

export function generatePatternType(title: string): 'circles' | 'triangles' | 'squares' | 'waves' {
  const patterns: Array<'circles' | 'triangles' | 'squares' | 'waves'> = ['circles', 'triangles', 'squares', 'waves'];
  const index = Math.abs(hashStringToHue(title + '_p')) % 4;
  return patterns[index];
}

const HARMONIOUS_HUES = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330
];

const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

let hueIndex = 0;

export function generateHarmoniousColors(count: number): string[] {
  const colors: string[] = [];
  const saturation = 65;
  const lightness = 55;

  for (let i = 0; i < count; i++) {
    const hue = (HARMONIOUS_HUES[hueIndex % HARMONIOUS_HUES.length] + i * 37) % 360;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    hueIndex++;
  }

  return colors;
}

export function getTagColor(tagName: string): string {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 55%)`;
}

export function getNoteBackground(): string {
  const hues = [55, 30, 120, 200, 280, 15];
  const randomHue = hues[Math.floor(Math.random() * hues.length)];
  return `hsl(${randomHue}, 80%, 90%)`;
}

export function generateColorPair(): { bg: string; border: string } {
  const hue = Math.floor(Math.random() * 360);
  return {
    bg: `hsl(${hue}, 70%, 92%)`,
    border: `hsl(${hue}, 60%, 45%)`
  };
}

export function adjustColorBrightness(color: string, amount: number): string {
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) return color;

  const [, h, s, l] = hslMatch;
  const newLightness = Math.max(0, Math.min(100, parseInt(l) + amount));
  return `hsl(${h}, ${s}%, ${newLightness}%)`;
}

export function getContrastTextColor(backgroundColor: string): string {
  const hslMatch = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) return '#1A2744';

  const lightness = parseInt(hslMatch[3]);
  return lightness > 60 ? '#1A2744' : '#FFFFFF';
}

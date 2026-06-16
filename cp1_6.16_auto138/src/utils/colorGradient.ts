function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const clampedT = Math.max(0, Math.min(1, t));
  const r = c1.r + (c2.r - c1.r) * clampedT;
  const g = c1.g + (c2.g - c1.g) * clampedT;
  const b = c1.b + (c2.b - c1.b) * clampedT;
  return rgbToHex(r, g, b);
}

export function getHeatmapColor(intensity: number, alpha: number = 1): string {
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  const colors = [
    { pos: 0.0, color: '#0000FF' },
    { pos: 0.25, color: '#00FFFF' },
    { pos: 0.5, color: '#00FF00' },
    { pos: 0.75, color: '#FFFF00' },
    { pos: 1.0, color: '#FF0000' },
  ];

  let lower = colors[0];
  let upper = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (clampedIntensity >= colors[i].pos && clampedIntensity <= colors[i + 1].pos) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }

  const range = upper.pos - lower.pos;
  const localT = range === 0 ? 0 : (clampedIntensity - lower.pos) / range;
  const hexColor = lerpColor(lower.color, upper.color, localT);

  if (alpha === 1) {
    return hexColor;
  }

  const rgb = hexToRgb(hexColor);
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${clampedAlpha})`;
}

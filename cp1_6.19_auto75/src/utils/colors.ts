export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      }
    : { r: 1, g: 1, b: 1 };
};

export const hexToThreeColor = (hex: string): [number, number, number] => {
  const rgb = hexToRgb(hex);
  return [rgb.r, rgb.g, rgb.b];
};

export const getScoreGradient = (score: number): string => {
  const normalized = Math.max(0, Math.min(10, score)) / 10;
  if (normalized <= 0.3) {
    return `hsl(${120 - normalized * 40}, 70%, ${50 + normalized * 10}%)`;
  } else if (normalized <= 0.6) {
    return `hsl(${60 - (normalized - 0.3) * 60}, 70%, 50%)`;
  } else {
    return `hsl(${0 - (normalized - 0.6) * 20}, 70%, ${50 - (normalized - 0.6) * 20}%)`;
  }
};

export const getStarGradient = (score: number): string => {
  const normalized = Math.max(0, Math.min(5, score)) / 5;
  if (normalized <= 0.3) {
    return 'linear-gradient(135deg, #228B22, #FFD700)';
  } else if (normalized <= 0.6) {
    return 'linear-gradient(135deg, #9ACD32, #FFA500)';
  } else {
    return 'linear-gradient(135deg, #808080, #FF4500)';
  }
};

export const getCarbonProgressColor = (score: number): string => {
  const ratio = Math.max(0, Math.min(10, score)) / 10;
  const r = Math.round(ratio * 255);
  const g = Math.round((1 - ratio) * 200);
  return `rgb(${r}, ${g}, 50)`;
};

export const lerpColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
};

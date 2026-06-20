export const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ]
    : [1, 1, 1];
};

export const lerpColor = (
  color1: [number, number, number],
  color2: [number, number, number],
  t: number
): [number, number, number] => {
  const clampedT = Math.max(0, Math.min(1, t));
  return [
    color1[0] + (color2[0] - color1[0]) * clampedT,
    color1[1] + (color2[1] - color1[1]) * clampedT,
    color1[2] + (color2[2] - color1[2]) * clampedT
  ];
};

export const getColorByDistance = (
  normalizedDistance: number,
  innerColor: string = '#ff6b35',
  outerColor: string = '#4dabf7'
): [number, number, number] => {
  const innerRgb = hexToRgb(innerColor);
  const outerRgb = hexToRgb(outerColor);
  return lerpColor(innerRgb, outerRgb, normalizedDistance);
};

export const rgbToString = (rgb: [number, number, number]): string => {
  return `rgb(${Math.round(rgb[0] * 255)}, ${Math.round(rgb[1] * 255)}, ${Math.round(rgb[2] * 255)})`;
};

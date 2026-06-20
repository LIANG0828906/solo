export function valueToColor(value: number, max: number = 100, higherIsBetter: boolean = true): string {
  const ratio = Math.max(0, Math.min(1, value / max));
  const adjustedRatio = higherIsBetter ? ratio : 1 - ratio;
  
  const r = Math.round(255 - adjustedRatio * 105);
  const g = Math.round(200 + adjustedRatio * 55);
  const b = Math.round(200 - adjustedRatio * 20);
  
  return `rgb(${r}, ${g}, ${b})`;
}

export function costToColor(value: number, min: number, max: number): string {
  if (max === min) return 'rgb(230, 245, 230)';
  const ratio = (value - min) / (max - min);
  const adjustedRatio = 1 - ratio;
  
  const r = Math.round(255 - adjustedRatio * 105);
  const g = Math.round(200 + adjustedRatio * 55);
  const b = Math.round(200 - adjustedRatio * 20);
  
  return `rgb(${r}, ${g}, ${b})`;
}

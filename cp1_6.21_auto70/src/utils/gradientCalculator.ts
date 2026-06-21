export type GradientType = 'linear' | 'radial' | 'conic';

export interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export interface GradientConfig {
  type: GradientType;
  colors: ColorStop[];
  angle?: number;
  shape?: 'circle' | 'ellipse';
  centerX?: number;
  centerY?: number;
  startAngle?: number;
}

const sortColorStops = (stops: ColorStop[]): ColorStop[] => {
  return [...stops].sort((a, b) => a.position - b.position);
};

const buildColorStopsString = (stops: ColorStop[]): string => {
  const sorted = sortColorStops(stops);
  return sorted.map(stop => `${stop.color} ${stop.position}%`).join(', ');
};

export const calculateLinearGradient = (config: GradientConfig): string => {
  const angle = config.angle ?? 135;
  const stops = buildColorStopsString(config.colors);
  return `linear-gradient(${angle}deg, ${stops})`;
};

export const calculateRadialGradient = (config: GradientConfig): string => {
  const shape = config.shape ?? 'circle';
  const centerX = config.centerX ?? 50;
  const centerY = config.centerY ?? 50;
  const stops = buildColorStopsString(config.colors);
  return `radial-gradient(${shape} at ${centerX}% ${centerY}%, ${stops})`;
};

export const calculateConicGradient = (config: GradientConfig): string => {
  const startAngle = config.startAngle ?? 0;
  const stops = buildColorStopsString(config.colors);
  return `conic-gradient(from ${startAngle}deg, ${stops})`;
};

export const calculateGradient = (config: GradientConfig): string => {
  switch (config.type) {
    case 'linear':
      return calculateLinearGradient(config);
    case 'radial':
      return calculateRadialGradient(config);
    case 'conic':
      return calculateConicGradient(config);
    default:
      return calculateLinearGradient(config);
  }
};

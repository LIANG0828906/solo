import { create } from 'zustand';

export type GradientType = 'linear' | 'radial';
export type RadialShape = 'circle' | 'ellipse';
export type PreviewShape = 'rectangle' | 'circle';

interface GradientState {
  startColor: string;
  endColor: string;
  gradientType: GradientType;
  angle: number;
  radius: number;
  radialShape: RadialShape;
  aspectRatio: number;
  shape: PreviewShape;
  borderRadius: number;
  setStartColor: (color: string) => void;
  setEndColor: (color: string) => void;
  setGradientType: (type: GradientType) => void;
  setAngle: (angle: number) => void;
  setRadius: (radius: number) => void;
  setRadialShape: (shape: RadialShape) => void;
  setAspectRatio: (ratio: number) => void;
  setShape: (shape: PreviewShape) => void;
  setBorderRadius: (radius: number) => void;
}

export const useGradientStore = create<GradientState>((set) => ({
  startColor: '#FF6B6B',
  endColor: '#4ECDC4',
  gradientType: 'linear',
  angle: 90,
  radius: 50,
  radialShape: 'circle',
  aspectRatio: 1,
  shape: 'rectangle',
  borderRadius: 0,
  setStartColor: (color) => set({ startColor: color }),
  setEndColor: (color) => set({ endColor: color }),
  setGradientType: (type) => set({ gradientType: type }),
  setAngle: (angle) => set({ angle }),
  setRadius: (radius) => set({ radius }),
  setRadialShape: (shape) => set({ radialShape: shape }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
  setShape: (shape) => set({ shape }),
  setBorderRadius: (radius) => set({ borderRadius: radius }),
}));

export interface GradientConfig {
  startColor: string;
  endColor: string;
  gradientType: GradientType;
  angle: number;
  radius: number;
  radialShape: RadialShape;
  aspectRatio: number;
}

export function generateGradientCSS(state: GradientConfig): string {
  const { startColor, endColor, gradientType, angle, radius, radialShape, aspectRatio } = state;
  
  if (gradientType === 'linear') {
    return `linear-gradient(${angle}deg, ${startColor}, ${endColor})`;
  } else {
    const size = radialShape === 'circle' 
      ? `${radius}%` 
      : `${radius}% ${radius * aspectRatio}%`;
    return `radial-gradient(${radialShape} ${size} at center, ${startColor}, ${endColor})`;
  }
}

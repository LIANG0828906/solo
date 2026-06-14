import type { Gradient } from '../types';

export function generateGradientCss(g: Gradient): string {
  return `linear-gradient(${g.angle}deg, ${g.startColor}, ${g.endColor})`;
}

export function generateFullCss(g: Gradient): string {
  return `background: ${generateGradientCss(g)};`;
}

export function generateGradientLabel(g: Gradient): string {
  return `linear-gradient(${g.angle}deg, ${g.startColor}, ${g.endColor})`;
}

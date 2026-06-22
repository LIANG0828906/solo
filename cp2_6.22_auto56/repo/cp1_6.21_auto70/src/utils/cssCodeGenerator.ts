import { GradientConfig, calculateGradient } from './gradientCalculator';

export const generateSimpleCssCode = (config: GradientConfig): string => {
  return `background: ${calculateGradient(config)};`;
};

export const generateFullCssCode = (config: GradientConfig, presetName?: string): string => {
  const gradient = calculateGradient(config);
  const fallbackColor = config.colors[0]?.color || '#667eea';
  const comment = presetName ? `/* ${presetName} */\n` : '';

  return `${comment}.gradient-element {
  background: ${fallbackColor};
  background: -webkit-${gradient};
  background: -moz-${gradient};
  background: ${gradient};
}`;
};

export const downloadCssFile = (content: string, filename: string = 'gradient.css'): void => {
  const blob = new Blob([content], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

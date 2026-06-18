import type { GradientLayer, BlendMode } from '../store/gradientStore';

const blendModeToCss = (mode: BlendMode): string => {
  switch (mode) {
    case 'multiply':
      return 'multiply';
    case 'screen':
      return 'screen';
    default:
      return 'normal';
  }
};

const layerToGradient = (layer: GradientLayer): string => {
  const { type, colorStart, colorEnd, angle, scale } = layer;
  const scaledStart = colorStart;
  const scaledEnd = colorEnd;

  switch (type) {
    case 'linear': {
      return `linear-gradient(${angle}deg, ${scaledStart}, ${scaledEnd})`;
    }
    case 'radial': {
      const size = `${scale * 100}% ${scale * 100}%`;
      return `radial-gradient(${size} at center, ${scaledStart}, ${scaledEnd})`;
    }
    case 'conic': {
      return `conic-gradient(from ${angle}deg at center, ${scaledStart}, ${scaledEnd}, ${scaledStart})`;
    }
    default:
      return '';
  }
};

export const generateCSS = (
  layers: GradientLayer[],
  blendMode: BlendMode
): string => {
  const visibleLayers = layers.filter((l) => l.visible);
  const gradients = visibleLayers.map(layerToGradient).reverse();
  const bgValue = gradients.join(', ');
  const blendCss = blendModeToCss(blendMode);

  let css = '';
  css += `/* GradientFlow - 多层渐变叠加 */\n`;
  css += `.gradient-flow {\n`;
  if (gradients.length > 0) {
    css += `  background: ${bgValue};\n`;
  }
  if (blendCss !== 'normal') {
    css += `  /* 注意: background-blend-mode 作用于多层背景之间 */\n`;
    css += `  background-blend-mode: ${blendCss};\n`;
  }
  css += `  width: 100%;\n`;
  css += `  height: 100%;\n`;
  css += `}\n`;

  css += `\n/* 每层单独定义（用于自定义混合） */\n`;
  visibleLayers.forEach((layer, idx) => {
    css += `.gradient-layer-${idx + 1} {\n`;
    css += `  background: ${layerToGradient(layer)};\n`;
    css += `  mix-blend-mode: ${blendCss};\n`;
    css += `}\n`;
  });

  return css;
};

export const generateBackgroundValue = (
  layers: GradientLayer[],
  blendMode: BlendMode
): string => {
  const visibleLayers = layers.filter((l) => l.visible);
  const gradients = visibleLayers.map(layerToGradient).reverse();
  return gradients.join(', ');
};

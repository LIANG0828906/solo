import type { Keyframe, EasingCurve, AnimationConfig } from '../types/animation';
import { sortKeyframes, formatPercent, buildTransformString, cubicBezierToString } from './animationUtils';

export const generateCSS = (
  keyframes: Keyframe[],
  config: AnimationConfig,
  animationName: string = 'keyframeAnimation'
): string => {
  const sorted = sortKeyframes(keyframes);
  const duration = config.duration;

  let keyframesCode = `@keyframes ${animationName} {\n`;

  if (sorted.length === 0) {
    keyframesCode += `  0% {\n    transform: translate(0px, 0px) rotate(0deg) scale(1);\n    opacity: 1;\n  }\n`;
  } else {
    for (const kf of sorted) {
      const percent = formatPercent(kf.time, duration);
      const transform = buildTransformString(kf.transform);
      keyframesCode += `  ${percent} {\n`;
      keyframesCode += `    transform: ${transform};\n`;
      keyframesCode += `    opacity: ${kf.opacity};\n`;
      keyframesCode += `    background-color: ${kf.backgroundColor};\n`;
      keyframesCode += `  }\n`;
    }
  }

  keyframesCode += `}\n\n`;

  const easingStr = cubicBezierToString(config.easing);
  const iterations = config.iterations === 'infinite' ? 'infinite' : String(config.iterations);

  const animationRule = `.animated-element {\n` +
    `  width: 200px;\n` +
    `  height: 200px;\n` +
    `  background-color: #6C63FF;\n` +
    `  border-radius: 8px;\n` +
    `  animation: ${animationName} ${duration}s ${easingStr} ${iterations};\n` +
    `}\n`;

  return keyframesCode + animationRule;
};

export const generateStyleTagContent = (
  keyframes: Keyframe[],
  config: AnimationConfig
): string => {
  return generateCSS(keyframes, config, 'livePreviewAnimation');
};

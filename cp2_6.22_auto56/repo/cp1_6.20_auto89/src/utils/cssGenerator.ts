import { Keyframe, EasingType, CubicBezierParams } from '../types';
import { easingToCSS } from './easing';

export const generateKeyframesCSS = (
  keyframes: Keyframe[],
  animationName: string = 'customAnimation',
  duration: number = 2000,
  easing: EasingType = 'ease',
  bezier?: CubicBezierParams
): string => {
  if (keyframes.length === 0) {
    return '/* No keyframes defined */';
  }

  const sortedFrames = [...keyframes].sort((a, b) => a.time - b.time);
  const easingCSS = easingToCSS(easing, bezier);

  let keyframesCSS = `@keyframes ${animationName} {\n`;

  for (const frame of sortedFrames) {
    keyframesCSS += `  ${frame.time}% {\n`;
    for (const prop of frame.properties) {
      keyframesCSS += `    ${prop.name}: ${prop.value};\n`;
    }
    keyframesCSS += `  }\n`;
  }

  keyframesCSS += `}\n\n`;
  keyframesCSS += `.${animationName}-element {\n`;
  keyframesCSS += `  animation: ${animationName} ${duration / 1000}s ${easingCSS} infinite;\n`;
  keyframesCSS += `}`;

  return keyframesCSS;
};

export const generateHTMLSnippet = (
  cssCode: string,
  animationName: string = 'customAnimation'
): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Animation</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
      margin: 0;
    }
    
    .stage {
      width: 300px;
      height: 300px;
      background: #16213e;
      border-radius: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }
    
    .animated-box {
      width: 60px;
      height: 60px;
      background: #e94560;
      border-radius: 8px;
    }

${cssCode.split('\n').map(line => '    ' + line).join('\n')}
  </style>
</head>
<body>
  <div class="stage">
    <div class="animated-box ${animationName}-element"></div>
  </div>
</body>
</html>`;
};

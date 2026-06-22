import { Keyframe, InterpolatedProperties, CSSProperty } from '../types';

const parseTransform = (transform: string): { translateX: number; translateY: number; rotate: number; scale: number } => {
  let translateX = 0, translateY = 0, rotate = 0, scale = 1;
  
  const translateMatch = transform.match(/translate\(([^,]+),\s*([^)]+)\)/);
  if (translateMatch) {
    translateX = parseFloat(translateMatch[1]);
    translateY = parseFloat(translateMatch[2]);
  }
  
  const translateXMatch = transform.match(/translateX\(([^)]+)\)/);
  if (translateXMatch) translateX = parseFloat(translateXMatch[1]);
  
  const translateYMatch = transform.match(/translateY\(([^)]+)\)/);
  if (translateYMatch) translateY = parseFloat(translateYMatch[1]);
  
  const rotateMatch = transform.match(/rotate\(([^)]+)\)/);
  if (rotateMatch) rotate = parseFloat(rotateMatch[1]);
  
  const scaleMatch = transform.match(/scale\(([^)]+)\)/);
  if (scaleMatch) scale = parseFloat(scaleMatch[1]);
  
  return { translateX, translateY, rotate, scale };
};

const buildTransform = (t: { translateX: number; translateY: number; rotate: number; scale: number }): string => {
  return `translate(${t.translateX}px, ${t.translateY}px) rotate(${t.rotate}deg) scale(${t.scale})`;
};

const parseColor = (color: string): { r: number; g: number; b: number } => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6), 16);
    return { r, g, b };
  }
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3]),
    };
  }
  return { r: 233, g: 69, b: 96 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const getPropertyValue = (properties: CSSProperty[], name: string): string | undefined => {
  const prop = properties.find(p => p.name === name);
  return prop?.value;
};

export const interpolateKeyframes = (
  keyframes: Keyframe[],
  currentTime: number,
  easingFn: (t: number) => number
): InterpolatedProperties => {
  if (keyframes.length === 0) {
    return {
      transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
      opacity: 1,
      backgroundColor: '#e94560',
    };
  }

  const sortedFrames = [...keyframes].sort((a, b) => a.time - b.time);

  if (currentTime <= sortedFrames[0].time) {
    const frame = sortedFrames[0];
    return {
      transform: getPropertyValue(frame.properties, 'transform') || 'translate(0px, 0px) rotate(0deg) scale(1)',
      opacity: parseFloat(getPropertyValue(frame.properties, 'opacity') || '1'),
      backgroundColor: getPropertyValue(frame.properties, 'background-color') || '#e94560',
    };
  }

  if (currentTime >= sortedFrames[sortedFrames.length - 1].time) {
    const frame = sortedFrames[sortedFrames.length - 1];
    return {
      transform: getPropertyValue(frame.properties, 'transform') || 'translate(0px, 0px) rotate(0deg) scale(1)',
      opacity: parseFloat(getPropertyValue(frame.properties, 'opacity') || '1'),
      backgroundColor: getPropertyValue(frame.properties, 'background-color') || '#e94560',
    };
  }

  let prevFrame = sortedFrames[0];
  let nextFrame = sortedFrames[sortedFrames.length - 1];

  for (let i = 0; i < sortedFrames.length - 1; i++) {
    if (currentTime >= sortedFrames[i].time && currentTime <= sortedFrames[i + 1].time) {
      prevFrame = sortedFrames[i];
      nextFrame = sortedFrames[i + 1];
      break;
    }
  }

  const segmentDuration = nextFrame.time - prevFrame.time;
  const segmentProgress = segmentDuration === 0 ? 0 : (currentTime - prevFrame.time) / segmentDuration;
  const easedProgress = easingFn(segmentProgress);

  const prevTransform = parseTransform(getPropertyValue(prevFrame.properties, 'transform') || 'translate(0px, 0px) rotate(0deg) scale(1)');
  const nextTransform = parseTransform(getPropertyValue(nextFrame.properties, 'transform') || 'translate(0px, 0px) rotate(0deg) scale(1)');

  const interpolatedTransform = {
    translateX: lerp(prevTransform.translateX, nextTransform.translateX, easedProgress),
    translateY: lerp(prevTransform.translateY, nextTransform.translateY, easedProgress),
    rotate: lerp(prevTransform.rotate, nextTransform.rotate, easedProgress),
    scale: lerp(prevTransform.scale, nextTransform.scale, easedProgress),
  };

  const prevOpacity = parseFloat(getPropertyValue(prevFrame.properties, 'opacity') || '1');
  const nextOpacity = parseFloat(getPropertyValue(nextFrame.properties, 'opacity') || '1');
  const interpolatedOpacity = lerp(prevOpacity, nextOpacity, easedProgress);

  const prevColor = parseColor(getPropertyValue(prevFrame.properties, 'background-color') || '#e94560');
  const nextColor = parseColor(getPropertyValue(nextFrame.properties, 'background-color') || '#e94560');
  const interpolatedColor = rgbToHex(
    lerp(prevColor.r, nextColor.r, easedProgress),
    lerp(prevColor.g, nextColor.g, easedProgress),
    lerp(prevColor.b, nextColor.b, easedProgress)
  );

  return {
    transform: buildTransform(interpolatedTransform),
    opacity: interpolatedOpacity,
    backgroundColor: interpolatedColor,
  };
};

export const getCurrentKeyframe = (keyframes: Keyframe[], currentTime: number): Keyframe | null => {
  if (keyframes.length === 0) return null;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  for (const frame of sorted) {
    if (Math.abs(frame.time - currentTime) < 0.5) {
      return frame;
    }
  }
  return null;
};

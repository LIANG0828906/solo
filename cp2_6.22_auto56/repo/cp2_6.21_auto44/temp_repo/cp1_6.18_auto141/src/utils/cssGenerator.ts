import type { AnimatableElement, KeyframeNode } from '@/types';
import { easingToCssString } from './easing';

interface TransformParts {
  translateX?: string;
  translateY?: string;
  rotate?: string;
  scale?: string;
  scaleX?: string;
  scaleY?: string;
  skewX?: string;
  skewY?: string;
}

function formatValue(key: string, value: string | number): string {
  if (typeof value === 'number') {
    if (key.startsWith('transform.rotate') || key.includes('skew')) {
      return `${value}deg`;
    }
    if (
      key.startsWith('transform.translate') ||
      key.includes('width') ||
      key.includes('height') ||
      key.includes('radius') ||
      key.includes('border')
    ) {
      return `${value}px`;
    }
    return String(value);
  }
  return String(value);
}

function buildTransform(parts: TransformParts): string {
  const items: string[] = [];
  if (parts.translateX || parts.translateY) {
    items.push(
      `translate(${parts.translateX ?? '0px'}, ${parts.translateY ?? '0px'})`,
    );
  }
  if (parts.rotate) items.push(`rotate(${parts.rotate})`);
  const sx = parts.scaleX ?? parts.scale;
  const sy = parts.scaleY ?? parts.scale;
  if (sx || sy) {
    items.push(`scale(${sx ?? 1}, ${sy ?? 1})`);
  }
  if (parts.skewX || parts.skewY) {
    items.push(`skew(${parts.skewX ?? '0deg'}, ${parts.skewY ?? '0deg'})`);
  }
  return items.join(' ');
}

function cssPropertyName(key: string): string {
  if (key.startsWith('transform.')) return 'transform';
  return key;
}

function serializeProperties(
  properties: Record<string, string | number>,
  indent: string = '    ',
): string {
  const transformParts: TransformParts = {};
  const regularProps: Record<string, string> = {};

  for (const [key, raw] of Object.entries(properties)) {
    const value = formatValue(key, raw);
    if (key.startsWith('transform.')) {
      const part = key.slice('transform.'.length) as keyof TransformParts;
      transformParts[part] = value;
    } else {
      const cssKey = cssPropertyName(key);
      regularProps[cssKey] = value;
    }
  }

  const lines: string[] = [];
  if (Object.keys(transformParts).length > 0) {
    lines.push(`${indent}transform: ${buildTransform(transformParts)};`);
  }
  for (const [k, v] of Object.entries(regularProps)) {
    lines.push(`${indent}${k}: ${v};`);
  }
  return lines.join('\n');
}

interface GenerateOptions {
  includeAnimationProperty?: boolean;
  loop?: boolean;
}

export function generateKeyframes(
  element: AnimatableElement,
  keyframes: KeyframeNode[],
  duration: number,
  options: GenerateOptions = {},
): string {
  const { includeAnimationProperty = true, loop = true } = options;
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);
  if (sorted.length === 0) return '';

  const animName = `anim-${element.id.slice(0, 6)}`;
  const blocks: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const kf = sorted[i];
    const percent = duration > 0 ? (kf.time / duration) * 100 : 0;
    const props = serializeProperties(kf.properties);
    if (!props) continue;
    blocks.push(`  ${percent.toFixed(2)}% {\n${props}\n  }`);
  }

  let code = `@keyframes ${animName} {\n${blocks.join('\n')}\n}`;

  if (sorted.length >= 2 && includeAnimationProperty) {
    const animationParts: string[] = [animName, `${(duration / 1000).toFixed(2)}s`];
    const easing = sorted[0].easing;
    animationParts.push(easingToCssString(easing));
    animationParts.push(loop ? 'infinite' : 'forwards');
    code += `\n\n.${element.name.replace(/\s+/g, '-')} {\n  animation: ${animationParts.join(' ')};\n}`;
  }

  return code;
}

export function generateAllKeyframes(
  elements: AnimatableElement[],
  keyframes: KeyframeNode[],
  duration: number,
): string {
  const parts: string[] = [];
  for (const el of elements) {
    const elFrames = keyframes.filter((k) => k.elementId === el.id);
    if (elFrames.length === 0) continue;
    parts.push(generateKeyframes(el, elFrames, duration));
  }
  return parts.join('\n\n');
}

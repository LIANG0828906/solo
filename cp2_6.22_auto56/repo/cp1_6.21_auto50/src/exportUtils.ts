import { saveAs } from 'file-saver';
import type { KeyframeConfig } from './types';

const PROPERTY_MAP: Record<string, string> = {
  translateX: 'translateX',
  translateY: 'translateY',
  scale: 'scale',
  rotate: 'rotate',
  opacity: 'opacity'
};

const PROPERTY_UNIT: Record<string, string> = {
  translateX: 'px',
  translateY: 'px',
  scale: '',
  rotate: 'deg',
  opacity: ''
};

export function generateCssCode(curve: string, keyframes: KeyframeConfig): string {
  const { name, duration, keyframes: kfList } = keyframes;
  const durationSec = (duration / 1000).toFixed(2);

  let keyframesStr = `@keyframes ${name} {\n`;

  const sorted = [...kfList].sort((a, b) => a.percentage - b.percentage);

  for (const kf of sorted) {
    const props = formatProperties(kf.properties as Record<string, number | undefined>);
    if (props.length === 0) continue;

    keyframesStr += `  ${kf.percentage}% {\n`;
    for (const prop of props) {
      keyframesStr += `    ${prop};\n`;
    }
    keyframesStr += `  }\n`;
  }

  keyframesStr += `}\n\n`;

  keyframesStr += `.${name}-animation {\n`;
  keyframesStr += `  animation-name: ${name};\n`;
  keyframesStr += `  animation-duration: ${durationSec}s;\n`;
  keyframesStr += `  animation-timing-function: ${curve};\n`;
  keyframesStr += `  animation-fill-mode: both;\n`;
  keyframesStr += `}\n`;

  return keyframesStr;
}

function formatProperties(props: Record<string, number | undefined>): string[] {
  const result: string[] = [];
  const transformParts: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) continue;

    const cssProp = PROPERTY_MAP[key];
    const unit = PROPERTY_UNIT[key] || '';

    if (!cssProp) continue;

    if (key === 'translateX' || key === 'translateY') {
      transformParts.push(`${cssProp}(${value}${unit})`);
    } else if (key === 'scale') {
      transformParts.push(`${cssProp}(${value})`);
    } else if (key === 'rotate') {
      transformParts.push(`${cssProp}(${value}${unit})`);
    } else if (key === 'opacity') {
      result.push(`opacity: ${value}`);
    }
  }

  if (transformParts.length > 0) {
    result.push(`transform: ${transformParts.join(' ')}`);
  }

  return result;
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}

export function downloadCssFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/css;charset=utf-8' });
  saveAs(blob, filename.endsWith('.css') ? filename : `${filename}.css`);
}

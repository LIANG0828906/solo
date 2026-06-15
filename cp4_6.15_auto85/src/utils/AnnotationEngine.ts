import { saveAs } from 'file-saver';
import type { Annotation, BrushAnnotation, HighlightAnnotation, TextAnnotation } from '../types';

const COLOR_NAME_MAP: Record<string, string> = {
  '#e94560': '亮橙红',
  '#f39c12': '橙黄',
  '#f1c40f': '黄色',
  '#2ecc71': '绿色',
  '#3498db': '蓝色',
  '#9b59b6': '紫色',
  '#e74c3c': '红色',
  '#ffffff': '白色',
  '#000000': '黑色',
  '#0f3460': '电光蓝',
  '#1a1a2e': '深紫蓝',
  '#16213e': '深蓝',
};

function getColorName(hex: string): string {
  return COLOR_NAME_MAP[hex.toLowerCase()] || hex;
}

function formatSRTTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

function generateBrushContent(ann: BrushAnnotation): string {
  const colorName = getColorName(ann.color);
  const startPoint = ann.points[0] || { x: 0, y: 0 };
  const endPoint = ann.points[ann.points.length - 1] || startPoint;
  return `画笔 ${colorName}(${ann.color}) ${ann.size}px 起始坐标(${Math.round(startPoint.x)},${Math.round(startPoint.y)}) 结束坐标(${Math.round(endPoint.x)},${Math.round(endPoint.y)}) 点数:${ann.points.length}`;
}

function generateHighlightContent(ann: HighlightAnnotation): string {
  const colorName = getColorName(ann.color);
  return `高亮 ${colorName}(${ann.color}) 区域(${Math.round(ann.rect.x)},${Math.round(ann.rect.y)},${Math.round(ann.rect.width)}x${Math.round(ann.rect.height)}) 透明度${ann.opacity.toFixed(1)}`;
}

function generateTextContent(ann: TextAnnotation): string {
  const colorName = getColorName(ann.color);
  return `文本 ${colorName}(${ann.color}) 内容:"${ann.content}" 位置(${Math.round(ann.position.x)},${Math.round(ann.position.y)}) 字号${ann.fontSize}px`;
}

export function annotationsToSRT(annotations: Annotation[]): string {
  const sorted = [...annotations].sort((a, b) => a.timestamp - b.timestamp);
  const lines: string[] = [];

  sorted.forEach((ann, index) => {
    lines.push(String(index + 1));
    lines.push(`${formatSRTTime(ann.timestamp)} --> ${formatSRTTime(ann.endTime)}`);
    let content = '';
    switch (ann.type) {
      case 'brush':
        content = generateBrushContent(ann);
        break;
      case 'highlight':
        content = generateHighlightContent(ann);
        break;
      case 'text':
        content = generateTextContent(ann);
        break;
    }
    lines.push(content);
    lines.push('');
  });

  return lines.join('\n');
}

export function exportSRT(annotations: Annotation[], filename: string = 'annotations.srt'): void {
  const srtContent = annotationsToSRT(annotations);
  const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
}

export function exportAnnotationsJSON(annotations: Annotation[], filename: string = 'annotations.json'): void {
  const content = JSON.stringify(annotations, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  saveAs(blob, filename);
}

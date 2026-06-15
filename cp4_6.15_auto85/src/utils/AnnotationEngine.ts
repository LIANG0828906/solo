import { saveAs } from 'file-saver';
import type { Annotation, BrushAnnotation, HighlightAnnotation, TextAnnotation } from '../types';

function formatSRTTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

function generateBrushContent(ann: BrushAnnotation): string {
  const startPoint = ann.points[0] || { x: 0, y: 0 };
  const endPoint = ann.points[ann.points.length - 1] || startPoint;
  return `画笔 ${ann.color} ${ann.size}px 起始坐标(${Math.round(startPoint.x)},${Math.round(startPoint.y)}) 结束坐标(${Math.round(endPoint.x)},${Math.round(endPoint.y)})`;
}

function generateHighlightContent(ann: HighlightAnnotation): string {
  return `高亮 ${ann.color} 区域(${Math.round(ann.rect.x)},${Math.round(ann.rect.y)},${Math.round(ann.rect.width)}x${Math.round(ann.rect.height)}) 透明度${ann.opacity.toFixed(1)}`;
}

function generateTextContent(ann: TextAnnotation): string {
  return `文本 ${ann.content} 位置(${Math.round(ann.position.x)},${Math.round(ann.position.y)})`;
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

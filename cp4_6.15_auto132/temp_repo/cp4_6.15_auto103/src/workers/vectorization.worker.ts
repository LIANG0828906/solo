/// <reference lib="webworker" />

import type { Layer, LayerGroup } from '../types';

export interface VectorizationWorkerMessage {
  type: 'process-layers' | 'transform-points' | 'generate-svg-path';
  data: unknown;
}

export interface ProcessLayersData {
  strokes: any[];
  shapes: any[];
  text: any[];
}

export interface TransformPointsData {
  points: { x: number; y: number }[];
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export interface GeneratePathData {
  points: { x: number; y: number }[];
}

self.onmessage = (e: MessageEvent<VectorizationWorkerMessage>) => {
  const { type, data } = e.data;

  switch (type) {
    case 'process-layers':
      processLayers(data as ProcessLayersData);
      break;
    case 'transform-points':
      transformPoints(data as TransformPointsData);
      break;
    case 'generate-svg-path':
      generateSvgPath(data as GeneratePathData);
      break;
  }
};

function processLayers(data: ProcessLayersData) {
  const { strokes, shapes, text } = data;

  const strokeLayers: Layer[] = strokes.map((s: any) => ({
    id: s.id,
    name: s.name,
    type: 'stroke' as const,
    visible: s.visible,
    locked: false,
    opacity: s.opacity ?? 1,
    strokeColor: s.strokeColor,
    strokeWidth: s.strokeWidth,
    fillColor: 'transparent',
    fillOpacity: 0,
    points: s.points,
    confidence: s.confidence,
  }));

  const shapeLayers: Layer[] = shapes.map((s: any) => ({
    id: s.id,
    name: s.name,
    type: 'shape' as const,
    visible: s.visible,
    locked: false,
    opacity: s.opacity ?? 1,
    strokeColor: s.stroke,
    strokeWidth: s.strokeWidth,
    fillColor: s.fill,
    fillOpacity: s.fill === 'transparent' ? 0 : 1,
    shapeType: s.shapeType,
    x: s.x,
    y: s.y,
    width: s.width,
    height: s.height,
    rotation: s.rotation ?? 0,
    confidence: s.confidence,
  }));

  const textLayers: Layer[] = text.map((t: any) => ({
    id: t.id,
    name: t.name,
    type: 'text' as const,
    visible: t.visible,
    locked: false,
    opacity: t.opacity ?? 1,
    strokeColor: 'transparent',
    strokeWidth: 0,
    fillColor: t.color,
    fillOpacity: 1,
    x: t.x,
    y: t.y,
    width: t.width,
    height: t.height,
    text: t.text,
    confidence: t.confidence,
  }));

  const layerGroups: LayerGroup[] = [
    {
      id: 'group-strokes',
      name: '笔触线条',
      type: 'stroke' as const,
      layers: strokeLayers,
      expanded: true,
    },
    {
      id: 'group-shapes',
      name: '几何形状',
      type: 'shape' as const,
      layers: shapeLayers,
      expanded: true,
    },
    {
      id: 'group-text',
      name: '文字区域',
      type: 'text' as const,
      layers: textLayers,
      expanded: true,
    },
  ];

  self.postMessage({ type: 'layers-processed', data: layerGroups });
}

function transformPoints(data: TransformPointsData) {
  const { points, scaleX, scaleY, offsetX, offsetY } = data;
  const transformed = points.map(p => ({
    x: p.x * scaleX + offsetX,
    y: p.y * scaleY + offsetY,
  }));
  self.postMessage({ type: 'points-transformed', data: transformed });
}

function generateSvgPath(data: GeneratePathData) {
  const { points } = data;
  if (!points || points.length < 2) {
    self.postMessage({ type: 'path-generated', data: '' });
    return;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  self.postMessage({ type: 'path-generated', data: d });
}

export {};

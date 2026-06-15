import React, { useRef, useEffect, useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Annotation,
  BrushAnnotation,
  HighlightAnnotation,
  TextAnnotation,
  Point,
  Region,
  ToolType,
} from '../types';

interface CanvasOverlayProps {
  width: number;
  height: number;
  isRecording: boolean;
  currentTool: ToolType;
  color: string;
  brushSize: 3 | 6 | 10;
  highlightOpacity: number;
  getCurrentTime: () => number;
  onAnnotationAdd: (annotation: Annotation) => void;
  annotations: Annotation[];
  playbackTime?: number;
  isPlayback?: boolean;
}

const TEXT_FONT_SIZE = 20;

function getTextBoundingBox(
  text: string,
  position: Point,
  fontSize: number,
  ctx: CanvasRenderingContext2D
): Region {
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize * 1.2;
  return {
    x: position.x,
    y: position.y - textHeight,
    width: textWidth + 10,
    height: textHeight + 6,
  };
}

function checkCollision(rect1: Region, rect2: Region, padding: number = 15): boolean {
  return !(
    rect1.x + rect1.width + padding < rect2.x ||
    rect2.x + rect2.width + padding < rect1.x ||
    rect1.y + rect1.height + padding < rect2.y ||
    rect2.y + rect2.height + padding < rect1.y
  );
}

function getAnnotationBoundingBox(ann: Annotation): Region | null {
  switch (ann.type) {
    case 'brush': {
      if (ann.points.length < 2) return null;
      const xs = ann.points.map((p) => p.x);
      const ys = ann.points.map((p) => p.y);
      return {
        x: Math.min(...xs) - 10,
        y: Math.min(...ys) - 10,
        width: Math.max(...xs) - Math.min(...xs) + 20,
        height: Math.max(...ys) - Math.min(...ys) + 20,
      };
    }
    case 'highlight':
      return {
        x: ann.rect.x - 5,
        y: ann.rect.y - 5,
        width: ann.rect.width + 10,
        height: ann.rect.height + 10,
      };
    case 'text': {
      return {
        x: ann.position.x - 5,
        y: ann.position.y - ann.fontSize - 5,
        width: 120,
        height: ann.fontSize + 10,
      };
    }
    default:
      return null;
  }
}

function calculateOptimalTextPosition(
  text: string,
  clickPos: Point,
  fontSize: number,
  canvasWidth: number,
  canvasHeight: number,
  existingAnnotations: Annotation[],
  ctx: CanvasRenderingContext2D
): Point {
  if (!text.trim()) return clickPos;

  const candidatePositions: Point[] = [
    { x: clickPos.x, y: clickPos.y },
    { x: clickPos.x + 40, y: clickPos.y },
    { x: clickPos.x - 40, y: clickPos.y },
    { x: clickPos.x, y: clickPos.y + 40 },
    { x: clickPos.x, y: clickPos.y - 40 },
    { x: clickPos.x + 40, y: clickPos.y + 40 },
    { x: clickPos.x - 40, y: clickPos.y - 40 },
    { x: clickPos.x + 40, y: clickPos.y - 40 },
    { x: clickPos.x - 40, y: clickPos.y + 40 },
    { x: clickPos.x + 80, y: clickPos.y },
    { x: clickPos.x - 80, y: clickPos.y },
    { x: clickPos.x, y: clickPos.y + 80 },
    { x: clickPos.x, y: clickPos.y - 80 },
    { x: clickPos.x + 80, y: clickPos.y + 80 },
    { x: clickPos.x - 80, y: clickPos.y - 80 },
    { x: clickPos.x + 120, y: clickPos.y },
    { x: clickPos.x - 120, y: clickPos.y },
    { x: clickPos.x, y: clickPos.y + 120 },
    { x: clickPos.x, y: clickPos.y - 120 },
  ];

  const existingBBoxes = existingAnnotations
    .map((ann) => getAnnotationBoundingBox(ann))
    .filter((bbox): bbox is Region => bbox !== null);

  let bestPosition = clickPos;
  let minPenalty = Infinity;

  for (const pos of candidatePositions) {
    const candidateBBox = getTextBoundingBox(text, pos, fontSize, ctx);

    if (
      candidateBBox.x < 10 ||
      candidateBBox.y < 10 ||
      candidateBBox.x + candidateBBox.width > canvasWidth - 10 ||
      candidateBBox.y + candidateBBox.height > canvasHeight - 10
    ) {
      continue;
    }

    let penalty = 0;
    penalty += Math.abs(pos.x - clickPos.x) + Math.abs(pos.y - clickPos.y);

    for (const bbox of existingBBoxes) {
      if (checkCollision(candidateBBox, bbox)) {
        penalty += 10000;
      }
    }

    if (penalty < minPenalty) {
      minPenalty = penalty;
      bestPosition = pos;
    }
  }

  return bestPosition;
}

const CanvasOverlay: React.FC<CanvasOverlayProps> = ({
  width,
  height,
  isRecording,
  currentTool,
  color,
  brushSize,
  highlightOpacity,
  getCurrentTime,
  onAnnotationAdd,
  annotations,
  playbackTime = 0,
  isPlayback = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const currentStartPosRef = useRef<Point | null>(null);
  const annotationStartTimeRef = useRef<number>(0);
  const [textInput, setTextInput] = useState<{ x: number; y: number; canvasX: number; canvasY: number; value: string } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const effectiveTime = isPlayback ? playbackTime : getCurrentTime();

    annotations.forEach((ann) => {
      if (ann.timestamp > effectiveTime) return;
      if (ann.endTime > 0 && ann.endTime < effectiveTime - 3000) return;

      ctx.save();
      switch (ann.type) {
        case 'brush': {
          if (ann.points.length < 2) break;
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x, ann.points[i].y);
          }
          ctx.stroke();
          break;
        }
        case 'highlight': {
          ctx.fillStyle = ann.color;
          ctx.globalAlpha = ann.opacity;
          ctx.fillRect(ann.rect.x, ann.rect.y, ann.rect.width, ann.rect.height);
          break;
        }
        case 'text': {
          ctx.fillStyle = ann.color;
          ctx.font = `bold ${ann.fontSize}px Inter, sans-serif`;
          ctx.fillText(ann.content, ann.position.x, ann.position.y);
          break;
        }
      }
      ctx.restore();
    });

    if (!isPlayback && currentPointsRef.current.length > 1 && currentTool === 'brush') {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(currentPointsRef.current[0].x, currentPointsRef.current[0].y);
      for (let i = 1; i < currentPointsRef.current.length; i++) {
        ctx.lineTo(currentPointsRef.current[i].x, currentPointsRef.current[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (!isPlayback && currentStartPosRef.current && currentTool === 'highlight') {
      const start = currentStartPosRef.current;
      const last = currentPointsRef.current[currentPointsRef.current.length - 1] || start;
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = highlightOpacity;
      ctx.fillRect(
        Math.min(start.x, last.x),
        Math.min(start.y, last.y),
        Math.abs(last.x - start.x),
        Math.abs(last.y - start.y)
      );
      ctx.restore();
    }
  }, [annotations, color, brushSize, highlightOpacity, currentTool, isPlayback, playbackTime, getCurrentTime]);

  useEffect(() => {
    let animationId: number;
    const loop = () => {
      redraw();
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [redraw]);

  const getCanvasPoint = useCallback((e: React.PointerEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isRecording && !isPlayback) return;
      if (isPlayback) return;
      if (currentTool === 'none') return;

      const point = getCanvasPoint(e);

      if (currentTool === 'text') {
        setTextInput({ x: e.clientX, y: e.clientY, canvasX: point.x, canvasY: point.y, value: '' });
        annotationStartTimeRef.current = getCurrentTime();
        currentStartPosRef.current = point;
        return;
      }

      isDrawingRef.current = true;
      annotationStartTimeRef.current = getCurrentTime();
      currentStartPosRef.current = point;
      currentPointsRef.current = [point];
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [isRecording, isPlayback, currentTool, getCanvasPoint, getCurrentTime]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawingRef.current) return;
      const point = getCanvasPoint(e);
      currentPointsRef.current.push(point);
    },
    [getCanvasPoint]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const endTime = getCurrentTime();
    const displayEndTime = endTime + 5000;

    if (currentTool === 'brush' && currentPointsRef.current.length > 1) {
      const annotation: BrushAnnotation = {
        id: uuidv4(),
        type: 'brush',
        timestamp: annotationStartTimeRef.current,
        endTime: displayEndTime,
        color,
        size: brushSize,
        points: [...currentPointsRef.current],
      };
      onAnnotationAdd(annotation);
    } else if (currentTool === 'highlight' && currentStartPosRef.current && currentPointsRef.current.length > 0) {
      const start = currentStartPosRef.current;
      const last = currentPointsRef.current[currentPointsRef.current.length - 1];
      const rect: Region = {
        x: Math.min(start.x, last.x),
        y: Math.min(start.y, last.y),
        width: Math.abs(last.x - start.x),
        height: Math.abs(last.y - start.y),
      };
      if (rect.width > 5 && rect.height > 5) {
        const annotation: HighlightAnnotation = {
          id: uuidv4(),
          type: 'highlight',
          timestamp: annotationStartTimeRef.current,
          endTime: displayEndTime,
          color,
          rect,
          opacity: highlightOpacity,
        };
        onAnnotationAdd(annotation);
      }
    }

    currentPointsRef.current = [];
    currentStartPosRef.current = null;
  }, [currentTool, color, brushSize, highlightOpacity, getCurrentTime, onAnnotationAdd]);

  const handleTextSubmit = useCallback(() => {
    if (!textInput || !currentStartPosRef.current) return;
    const value = textInput.value.trim();
    if (value) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      let optimalPos: Point = { x: textInput.canvasX, y: textInput.canvasY };

      if (ctx) {
        optimalPos = calculateOptimalTextPosition(
          value,
          { x: textInput.canvasX, y: textInput.canvasY },
          TEXT_FONT_SIZE,
          width,
          height,
          annotations,
          ctx
        );
      }

      const endTime = getCurrentTime() + 5000;
      const annotation: TextAnnotation = {
        id: uuidv4(),
        type: 'text',
        timestamp: annotationStartTimeRef.current,
        endTime,
        color,
        content: value,
        position: optimalPos,
        fontSize: TEXT_FONT_SIZE,
      };
      onAnnotationAdd(annotation);
    }
    setTextInput(null);
    currentStartPosRef.current = null;
  }, [textInput, color, getCurrentTime, onAnnotationAdd, width, height, annotations]);

  useEffect(() => {
    if (textInput && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInput]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="annotation-canvas"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {textInput && (
        <input
          ref={textInputRef}
          type="text"
          className="text-input-overlay"
          style={{ left: textInput.x, top: textInput.y }}
          value={textInput.value}
          onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
          onBlur={handleTextSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSubmit();
            if (e.key === 'Escape') {
              setTextInput(null);
              currentStartPosRef.current = null;
            }
          }}
          placeholder="输入文本..."
          autoFocus
        />
      )}
    </>
  );
};

export default CanvasOverlay;

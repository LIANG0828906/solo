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
  const [textInput, setTextInput] = useState<{ x: number; y: number; value: string } | null>(null);
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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isRecording && !isPlayback) return;
    if (isPlayback) return;
    if (currentTool === 'none') return;

    const point = getCanvasPoint(e);

    if (currentTool === 'text') {
      setTextInput({ x: e.clientX, y: e.clientY, value: '' });
      annotationStartTimeRef.current = getCurrentTime();
      currentStartPosRef.current = point;
      return;
    }

    isDrawingRef.current = true;
    annotationStartTimeRef.current = getCurrentTime();
    currentStartPosRef.current = point;
    currentPointsRef.current = [point];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isRecording, isPlayback, currentTool, getCanvasPoint, getCurrentTime]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    const point = getCanvasPoint(e);
    currentPointsRef.current.push(point);
  }, [getCanvasPoint]);

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
      const endTime = getCurrentTime() + 5000;
      const annotation: TextAnnotation = {
        id: uuidv4(),
        type: 'text',
        timestamp: annotationStartTimeRef.current,
        endTime,
        color,
        content: value,
        position: currentStartPosRef.current,
        fontSize: 20,
      };
      onAnnotationAdd(annotation);
    }
    setTextInput(null);
    currentStartPosRef.current = null;
  }, [textInput, color, getCurrentTime, onAnnotationAdd]);

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
            if (e.key === 'Escape') setTextInput(null);
          }}
          placeholder="输入文本..."
          autoFocus
        />
      )}
    </>
  );
};

export default CanvasOverlay;

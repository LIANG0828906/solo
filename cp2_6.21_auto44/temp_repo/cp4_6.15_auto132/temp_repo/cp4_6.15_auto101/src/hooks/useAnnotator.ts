import { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  AnnotationTool,
  AnnotationColor,
  Annotation,
  PenAnnotation,
  HighlightAnnotation,
  TextAnnotation,
  Point,
  COLOR_MAP,
} from '../types';

interface UseAnnotatorReturn {
  currentTool: AnnotationTool;
  currentColor: AnnotationColor;
  annotations: Annotation[];
  isDrawing: boolean;
  setTool: (tool: AnnotationTool) => void;
  setColor: (color: AnnotationColor) => void;
  undoAnnotation: () => void;
  clearAnnotations: () => void;
  setCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  startDrawing: (x: number, y: number) => void;
  draw: (x: number, y: number) => void;
  endDrawing: (currentTime: number) => void;
  addTextAnnotation: (x: number, y: number, text: string, currentTime: number) => void;
  renderAllAnnotations: (time?: number) => void;
  renderAnnotationsAtTime: (time: number) => void;
}

export function useAnnotator(): UseAnnotatorReturn {
  const [currentTool, setCurrentTool] = useState<AnnotationTool>(AnnotationTool.NONE);
  const [currentColor, setCurrentColor] = useState<AnnotationColor>('red');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const currentPointsRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);
  const lastDrawTimeRef = useRef<number>(0);

  const setCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctxRef.current = ctx;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    } else {
      ctxRef.current = null;
    }
  }, []);

  const clearCanvas = useCallback(() => {
    if (ctxRef.current && canvasRef.current) {
      ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);

  const drawPenAnnotation = useCallback((annotation: PenAnnotation) => {
    if (!ctxRef.current || annotation.points.length < 2) return;

    const ctx = ctxRef.current;
    ctx.strokeStyle = COLOR_MAP[annotation.color];
    ctx.lineWidth = annotation.lineWidth;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(annotation.points[0].x, annotation.points[0].y);

    for (let i = 1; i < annotation.points.length; i++) {
      ctx.lineTo(annotation.points[i].x, annotation.points[i].y);
    }
    ctx.stroke();
  }, []);

  const drawHighlightAnnotation = useCallback((annotation: HighlightAnnotation) => {
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    const x = Math.min(annotation.startPoint.x, annotation.endPoint.x);
    const y = Math.min(annotation.startPoint.y, annotation.endPoint.y);
    const width = Math.abs(annotation.endPoint.x - annotation.startPoint.x);
    const height = Math.abs(annotation.endPoint.y - annotation.startPoint.y);

    ctx.fillStyle = COLOR_MAP[annotation.color];
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
  }, []);

  const drawTextAnnotation = useCallback((annotation: TextAnnotation) => {
    if (!ctxRef.current) return;

    const ctx = ctxRef.current;
    ctx.fillStyle = COLOR_MAP[annotation.color];
    ctx.globalAlpha = 1;
    ctx.font = `${annotation.fontSize}px Inter, sans-serif`;
    ctx.fillText(annotation.text, annotation.position.x, annotation.position.y);
  }, []);

  const renderAnnotation = useCallback((annotation: Annotation) => {
    switch (annotation.tool) {
      case AnnotationTool.PEN:
        drawPenAnnotation(annotation as PenAnnotation);
        break;
      case AnnotationTool.HIGHLIGHT:
        drawHighlightAnnotation(annotation as HighlightAnnotation);
        break;
      case AnnotationTool.TEXT:
        drawTextAnnotation(annotation as TextAnnotation);
        break;
    }
  }, [drawPenAnnotation, drawHighlightAnnotation, drawTextAnnotation]);

  const renderAllAnnotations = useCallback((time?: number) => {
    clearCanvas();
    const annotationsToRender = time !== undefined
      ? annotations.filter(a => a.timestamp <= time)
      : annotations;
    annotationsToRender.forEach(renderAnnotation);
  }, [annotations, clearCanvas, renderAnnotation]);

  const renderAnnotationsAtTime = useCallback((time: number) => {
    clearCanvas();
    annotations
      .filter(a => a.timestamp <= time)
      .forEach(renderAnnotation);
  }, [annotations, clearCanvas, renderAnnotation]);

  const startDrawing = useCallback((x: number, y: number) => {
    if (!ctxRef.current || currentTool === AnnotationTool.NONE || currentTool === AnnotationTool.TEXT) return;

    setIsDrawing(true);
    startPointRef.current = { x, y };
    currentPointsRef.current = [{ x, y }];
    lastDrawTimeRef.current = Date.now();
  }, [currentTool]);

  const draw = useCallback((x: number, y: number) => {
    if (!isDrawing || !ctxRef.current || !startPointRef.current) return;

    const now = Date.now();
    if (now - lastDrawTimeRef.current < 16) return;
    lastDrawTimeRef.current = now;

    currentPointsRef.current.push({ x, y });

    if (currentTool === AnnotationTool.PEN) {
      const ctx = ctxRef.current;
      ctx.strokeStyle = COLOR_MAP[currentColor];
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      const points = currentPointsRef.current;
      if (points.length >= 2) {
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
      }
    } else if (currentTool === AnnotationTool.HIGHLIGHT) {
      renderAllAnnotations();
      const ctx = ctxRef.current;
      const start = startPointRef.current;
      const rectX = Math.min(start.x, x);
      const rectY = Math.min(start.y, y);
      const width = Math.abs(x - start.x);
      const height = Math.abs(y - start.y);
      ctx.fillStyle = COLOR_MAP[currentColor];
      ctx.globalAlpha = 0.3;
      ctx.fillRect(rectX, rectY, width, height);
      ctx.globalAlpha = 1;
    }
  }, [isDrawing, currentTool, currentColor, renderAllAnnotations]);

  const endDrawing = useCallback((currentTime: number) => {
    if (!isDrawing || currentTool === AnnotationTool.NONE || currentTool === AnnotationTool.TEXT) {
      setIsDrawing(false);
      return;
    }

    if (currentTool === AnnotationTool.PEN && currentPointsRef.current.length > 1) {
      const newAnnotation: PenAnnotation = {
        id: uuidv4(),
        timestamp: currentTime,
        tool: AnnotationTool.PEN,
        color: currentColor,
        points: [...currentPointsRef.current],
        lineWidth: 3,
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    } else if (currentTool === AnnotationTool.HIGHLIGHT && startPointRef.current && currentPointsRef.current.length > 1) {
      const newAnnotation: HighlightAnnotation = {
        id: uuidv4(),
        timestamp: currentTime,
        tool: AnnotationTool.HIGHLIGHT,
        color: currentColor,
        startPoint: startPointRef.current,
        endPoint: currentPointsRef.current[currentPointsRef.current.length - 1],
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }

    setIsDrawing(false);
    currentPointsRef.current = [];
    startPointRef.current = null;
    renderAllAnnotations();
  }, [isDrawing, currentTool, currentColor, renderAllAnnotations]);

  const addTextAnnotation = useCallback((x: number, y: number, text: string, currentTime: number) => {
    if (!text.trim()) return;

    const newAnnotation: TextAnnotation = {
      id: uuidv4(),
      timestamp: currentTime,
      tool: AnnotationTool.TEXT,
      color: currentColor,
      position: { x, y },
      text,
      fontSize: 20,
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    renderAllAnnotations();
  }, [currentColor, renderAllAnnotations]);

  const setTool = useCallback((tool: AnnotationTool) => {
    setCurrentTool(tool);
  }, []);

  const setColor = useCallback((color: AnnotationColor) => {
    setCurrentColor(color);
  }, []);

  const undoAnnotation = useCallback(() => {
    setAnnotations(prev => {
      const newAnnotations = prev.slice(0, -1);
      setTimeout(() => renderAllAnnotations(), 0);
      return newAnnotations;
    });
  }, [renderAllAnnotations]);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    clearCanvas();
  }, [clearCanvas]);

  useEffect(() => {
    if (canvasRef.current && ctxRef.current) {
      renderAllAnnotations();
    }
  }, [canvasRef, renderAllAnnotations]);

  return {
    currentTool,
    currentColor,
    annotations,
    isDrawing,
    setTool,
    setColor,
    undoAnnotation,
    clearAnnotations,
    setCanvasRef,
    startDrawing,
    draw,
    endDrawing,
    addTextAnnotation,
    renderAllAnnotations,
    renderAnnotationsAtTime,
  };
}

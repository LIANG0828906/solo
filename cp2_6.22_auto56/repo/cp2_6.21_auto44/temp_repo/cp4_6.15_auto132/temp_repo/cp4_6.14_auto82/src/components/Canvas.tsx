import { useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import {
  distance,
  pointToSegmentDistance,
  getPointById,
  getSegmentById,
  getCircleById,
  exportToSVG,
  importFromSVG,
  solveConstraints,
} from '../core/geometryEngine';
import type { PointShape, SegmentShape, CircleShape, Shape, ToolType } from '../types';

const POINT_RADIUS = 4;
const POINT_HIT_RADIUS = 8;
const SEGMENT_HIT_WIDTH = 6;
const CIRCLE_HIT_WIDTH = 6;

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const panStartPos = useRef<{ x: number; y: number } | null>(null);
  const panStartPan = useRef<{ x: number; y: number } | null>(null);
  const drawingState = useRef<any>(null);
  const polygonPoints = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shapes = useCanvasStore((state) => state.shapes);
  const constraints = useCanvasStore((state) => state.constraints);
  const currentTool = useCanvasStore((state) => state.currentTool);
  const selectedShapeIds = useCanvasStore((state) => state.selectedShapeIds);
  const zoom = useCanvasStore((state) => state.zoom);
  const pan = useCanvasStore((state) => state.pan);
  const isDragging = useCanvasStore((state) => state.isDragging);
  const dragPointId = useCanvasStore((state) => state.dragPointId);
  const mousePos = useCanvasStore((state) => state.mousePos);
  const isPanning = useCanvasStore((state) => state.isPanning);
  const spacePressed = useCanvasStore((state) => state.spacePressed);
  const constraintSelectionStep = useCanvasStore((state) => state.constraintSelectionStep);
  const constraintFirstShapeId = useCanvasStore((state) => state.constraintFirstShapeId);
  const drawingPreview = useCanvasStore((state) => state.drawingPreview);

  const setZoom = useCanvasStore((state) => state.setZoom);
  const setPan = useCanvasStore((state) => state.setPan);
  const setIsPanning = useCanvasStore((state) => state.setIsPanning);
  const setIsDragging = useCanvasStore((state) => state.setIsDragging);
  const setDragPointId = useCanvasStore((state) => state.setDragPointId);
  const setMousePos = useCanvasStore((state) => state.setMousePos);
  const selectShape = useCanvasStore((state) => state.selectShape);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const addPoint = useCanvasStore((state) => state.addPoint);
  const addSegment = useCanvasStore((state) => state.addSegment);
  const addCircle = useCanvasStore((state) => state.addCircle);
  const addLine = useCanvasStore((state) => state.addLine);
  const addRay = useCanvasStore((state) => state.addRay);
  const addPolygon = useCanvasStore((state) => state.addPolygon);
  const updatePoint = useCanvasStore((state) => state.updatePoint);
  const updatePointWithConstraints = useCanvasStore((state) => state.updatePointWithConstraints);
  const addToHistory = useCanvasStore((state) => state.addToHistory);
  const addConstraint = useCanvasStore((state) => state.addConstraint);
  const setConstraintSelectionStep = useCanvasStore((state) => state.setConstraintSelectionStep);
  const setConstraintFirstShapeId = useCanvasStore((state) => state.setConstraintFirstShapeId);
  const resetConstraintSelection = useCanvasStore((state) => state.resetConstraintSelection);
  const setDrawingPreview = useCanvasStore((state) => state.setDrawingPreview);
  const setSpacePressed = useCanvasStore((state) => state.setSpacePressed);
  const importShapes = useCanvasStore((state) => state.importShapes);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left - pan.x) / zoom;
      const y = (screenY - rect.top - pan.y) / zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number) => {
      return {
        x: worldX * zoom + pan.x,
        y: worldY * zoom + pan.y,
      };
    },
    [pan, zoom]
  );

  const findPointAtPosition = useCallback(
    (worldX: number, worldY: number): PointShape | null => {
      const hitRadius = POINT_HIT_RADIUS / zoom;
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.type === 'point') {
          if (distance(shape.x, shape.y, worldX, worldY) <= hitRadius) {
            return shape;
          }
        }
      }
      return null;
    },
    [shapes, zoom]
  );

  const findSegmentAtPosition = useCallback(
    (worldX: number, worldY: number): SegmentShape | null => {
      const hitWidth = SEGMENT_HIT_WIDTH / zoom;
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.type === 'segment') {
          const start = getPointById(shapes, shape.startPointId);
          const end = getPointById(shapes, shape.endPointId);
          if (start && end) {
            const result = pointToSegmentDistance(
              worldX,
              worldY,
              start.x,
              start.y,
              end.x,
              end.y
            );
            if (result.distance <= hitWidth) {
              return shape;
            }
          }
        }
      }
      return null;
    },
    [shapes, zoom]
  );

  const findCircleAtPosition = useCallback(
    (worldX: number, worldY: number): CircleShape | null => {
      const hitWidth = CIRCLE_HIT_WIDTH / zoom;
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.type === 'circle') {
          const center = getPointById(shapes, shape.centerId);
          const radiusPt = getPointById(shapes, shape.radiusPointId);
          if (center && radiusPt) {
            const r = distance(center.x, center.y, radiusPt.x, radiusPt.y);
            const dist = distance(worldX, worldY, center.x, center.y);
            if (Math.abs(dist - r) <= hitWidth) {
              return shape;
            }
          }
        }
      }
      return null;
    },
    [shapes, zoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);

      if (e.button === 1 || (spacePressed && e.button === 0)) {
        setIsPanning(true);
        panStartPos.current = { x: e.clientX, y: e.clientY };
        panStartPan.current = { ...pan };
        return;
      }

      if (currentTool === 'select') {
        const point = findPointAtPosition(worldX, worldY);
        if (point) {
          selectShape(point.id, e.shiftKey);
          setIsDragging(true);
          setDragPointId(point.id);
          return;
        }

        const segment = findSegmentAtPosition(worldX, worldY);
        if (segment) {
          selectShape(segment.id, e.shiftKey);
          return;
        }

        const circle = findCircleAtPosition(worldX, worldY);
        if (circle) {
          selectShape(circle.id, e.shiftKey);
          return;
        }

        clearSelection();
        return;
      }

      if (
        currentTool === 'parallel' ||
        currentTool === 'perpendicular' ||
        currentTool === 'angle'
      ) {
        const segment = findSegmentAtPosition(worldX, worldY);
        if (!segment) return;

        if (constraintSelectionStep === 0) {
          setConstraintFirstShapeId(segment.id);
          setConstraintSelectionStep(1);
        } else if (constraintSelectionStep === 1 && constraintFirstShapeId !== segment.id) {
          if (currentTool === 'parallel') {
            addConstraint({
              type: 'parallel',
              segment1Id: constraintFirstShapeId!,
              segment2Id: segment.id,
            });
          } else if (currentTool === 'perpendicular') {
            addConstraint({
              type: 'perpendicular',
              segment1Id: constraintFirstShapeId!,
              segment2Id: segment.id,
            });
          } else if (currentTool === 'angle') {
            const angle = parseFloat(prompt('请输入角度（度）：', '90') || '90');
            if (!isNaN(angle)) {
              addConstraint({
                type: 'angle',
                segment1Id: constraintFirstShapeId!,
                segment2Id: segment.id,
                angle,
              });
            }
          }
          addToHistory();
          resetConstraintSelection();
        }
        return;
      }

      if (currentTool === 'midpoint') {
        const point = findPointAtPosition(worldX, worldY);
        const segment = findSegmentAtPosition(worldX, worldY);

        if (constraintSelectionStep === 0) {
          if (point) {
            setConstraintFirstShapeId(point.id);
            setConstraintSelectionStep(1);
          }
        } else if (constraintSelectionStep === 1) {
          if (segment && constraintFirstShapeId) {
            addConstraint({
              type: 'midpoint',
              pointId: constraintFirstShapeId,
              segmentId: segment.id,
            });
            addToHistory();
            resetConstraintSelection();
          }
        }
        return;
      }

      if (currentTool === 'point') {
        const pointId = addPoint(worldX, worldY);
        selectShape(pointId);
        addToHistory();
        return;
      }

      if (currentTool === 'segment') {
        const existingPoint = findPointAtPosition(worldX, worldY);
        const startPointId = existingPoint ? existingPoint.id : addPoint(worldX, worldY);

        drawingState.current = {
          startPointId,
          tempEndId: null,
        };

        const endId = addPoint(worldX, worldY);
        drawingState.current.tempEndId = endId;
        addSegment(startPointId, endId);

        setIsDragging(true);
        setDragPointId(endId);
        return;
      }

      if (currentTool === 'circle') {
        const existingPoint = findPointAtPosition(worldX, worldY);
        const centerId = existingPoint ? existingPoint.id : addPoint(worldX, worldY);

        const radiusId = addPoint(worldX + 50 / zoom, worldY);
        addCircle(centerId, radiusId);

        setIsDragging(true);
        setDragPointId(radiusId);
        drawingState.current = { centerId, radiusPointId: radiusId };
        return;
      }

      if (currentTool === 'line') {
        const existingPoint = findPointAtPosition(worldX, worldY);
        const point1Id = existingPoint ? existingPoint.id : addPoint(worldX, worldY);

        const point2Id = addPoint(worldX + 50 / zoom, worldY);
        addLine(point1Id, point2Id);

        setIsDragging(true);
        setDragPointId(point2Id);
        drawingState.current = { point1Id, point2Id };
        return;
      }

      if (currentTool === 'ray') {
        const existingPoint = findPointAtPosition(worldX, worldY);
        const startId = existingPoint ? existingPoint.id : addPoint(worldX, worldY);

        const dirId = addPoint(worldX + 50 / zoom, worldY);
        addRay(startId, dirId);

        setIsDragging(true);
        setDragPointId(dirId);
        drawingState.current = { startPointId: startId, directionPointId: dirId };
        return;
      }

      if (currentTool === 'polygon') {
        const existingPoint = findPointAtPosition(worldX, worldY);
        const pointId = existingPoint ? existingPoint.id : addPoint(worldX, worldY);

        if (polygonPoints.current.length === 0) {
          polygonPoints.current.push(pointId);
          const polyId = addPolygon([pointId, pointId], false);
          drawingState.current = { polygonId: polyId };
        } else {
          const firstPoint = getPointById(shapes, polygonPoints.current[0]);
          if (firstPoint && distance(worldX, worldY, firstPoint.x, firstPoint.y) < POINT_HIT_RADIUS / zoom) {
            if (polygonPoints.current.length >= 3) {
              const polyId = drawingState.current?.polygonId;
              if (polyId) {
                const state = useCanvasStore.getState();
                const poly = state.shapes.find((s) => s.id === polyId);
                if (poly && poly.type === 'polygon') {
                  const updatedShapes = state.shapes.map((s) =>
                    s.id === polyId ? { ...s, pointIds: polygonPoints.current, closed: true } : s
                  );
                  useCanvasStore.setState({ shapes: updatedShapes });
                  addToHistory();
                }
              }
            }
            polygonPoints.current = [];
            drawingState.current = null;
            setDrawingPreview(null);
            return;
          }

          polygonPoints.current.push(pointId);

          const state = useCanvasStore.getState();
          const poly = state.shapes.find((s) => s.id === drawingState.current?.polygonId);
          if (poly && poly.type === 'polygon') {
            const updatedShapes = state.shapes.map((s) =>
              s.id === poly.id ? { ...s, pointIds: [...polygonPoints.current, pointId] } : s
            );
            useCanvasStore.setState({ shapes: updatedShapes });
          }
        }
        return;
      }
    },
    [
      currentTool,
      pan,
      zoom,
      spacePressed,
      screenToWorld,
      findPointAtPosition,
      findSegmentAtPosition,
      findCircleAtPosition,
      selectShape,
      clearSelection,
      addPoint,
      addSegment,
      addCircle,
      addLine,
      addRay,
      addPolygon,
      setIsPanning,
      setIsDragging,
      setDragPointId,
      addToHistory,
      addConstraint,
      constraintSelectionStep,
      constraintFirstShapeId,
      setConstraintSelectionStep,
      setConstraintFirstShapeId,
      resetConstraintSelection,
      shapes,
      setDrawingPreview,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const { x: worldX, y: worldY } = screenToWorld(e.clientX, e.clientY);
      setMousePos({ x: worldX, y: worldY });

      if (isPanning && panStartPos.current && panStartPan.current) {
        const dx = e.clientX - panStartPos.current.x;
        const dy = e.clientY - panStartPos.current.y;
        setPan({
          x: panStartPan.current.x + dx,
          y: panStartPan.current.y + dy,
        });
        return;
      }

      if (isDragging && dragPointId) {
        updatePointWithConstraints(dragPointId, worldX, worldY);
        return;
      }

      if (currentTool === 'polygon' && polygonPoints.current.length > 0) {
        setDrawingPreview({
          type: 'polygon-preview',
          x: worldX,
          y: worldY,
        });
      }
    },
    [
      isPanning,
      isDragging,
      dragPointId,
      currentTool,
      screenToWorld,
      setMousePos,
      setPan,
      updatePointWithConstraints,
      setDrawingPreview,
    ]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning) {
        setIsPanning(false);
        panStartPos.current = null;
        panStartPan.current = null;
        return;
      }

      if (isDragging) {
        setIsDragging(false);
        setDragPointId(null);
        addToHistory();
        drawingState.current = null;
        return;
      }
    },
    [isPanning, isDragging, setIsPanning, setIsDragging, setDragPointId, addToHistory]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = -e.deltaY * 0.001;
      const newZoom = Math.max(0.2, Math.min(5, zoom * (1 + delta)));

      const worldX = (mouseX - pan.x) / zoom;
      const worldY = (mouseY - pan.y) / zoom;

      const newPanX = mouseX - worldX * newZoom;
      const newPanY = mouseY - worldY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [zoom, pan, setZoom, setPan]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
      }

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        useCanvasStore.getState().undo();
      }

      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        useCanvasStore.getState().redo();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const state = useCanvasStore.getState();
        if (state.selectedShapeIds.length > 0) {
          e.preventDefault();
          state.deleteSelected();
          state.addToHistory();
        }
      }

      if (e.key === 'Escape') {
        const state = useCanvasStore.getState();
        if (state.currentTool === 'polygon' && polygonPoints.current.length > 0) {
          if (polygonPoints.current.length >= 3) {
            const polyId = drawingState.current?.polygonId;
            if (polyId) {
              const updatedShapes = state.shapes.map((s) =>
                s.id === polyId ? { ...s, pointIds: polygonPoints.current, closed: true } : s
              );
              useCanvasStore.setState({ shapes: updatedShapes });
              state.addToHistory();
            }
          }
          polygonPoints.current = [];
          drawingState.current = null;
          state.setDrawingPreview(null);
        }
        state.resetConstraintSelection();
      }

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const toolMap: Record<string, ToolType> = {
          v: 'select',
          p: 'point',
          l: 'segment',
          c: 'circle',
          r: 'ray',
          g: 'polygon',
        };
        const tool = toolMap[e.key.toLowerCase()];
        if (tool) {
          useCanvasStore.getState().setCurrentTool(tool);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, setSpacePressed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      drawGrid(ctx, width, height);
      drawShapes(ctx, shapes, selectedShapeIds, zoom);
      drawConstraints(ctx, shapes, constraints);

      if (drawingPreview && currentTool === 'polygon' && polygonPoints.current.length > 0) {
        drawPolygonPreview(ctx, polygonPoints.current, drawingPreview, shapes);
      }

      if (constraintFirstShapeId && constraintSelectionStep > 0) {
        drawConstraintHighlight(ctx, constraintFirstShapeId, shapes);
      }

      ctx.restore();
      ctx.restore();

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameId);
  }, [shapes, constraints, selectedShapeIds, zoom, pan, drawingPreview, currentTool, constraintFirstShapeId, constraintSelectionStep]);

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const minorSpacing = 10;
    const majorSpacing = 40;

    const startX = Math.floor(-pan.x / zoom / minorSpacing) * minorSpacing;
    const startY = Math.floor(-pan.y / zoom / minorSpacing) * minorSpacing;
    const endX = startX + (width / zoom) + minorSpacing * 2;
    const endY = startY + (height / zoom) + minorSpacing * 2;

    ctx.lineWidth = 1 / zoom;
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();

    for (let x = startX; x <= endX; x += minorSpacing) {
      if (Math.round(x) % majorSpacing !== 0) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
    }
    for (let y = startY; y <= endY; y += minorSpacing) {
      if (Math.round(y) % majorSpacing !== 0) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
    }
    ctx.stroke();

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    for (let x = startX; x <= endX; x += majorSpacing) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += majorSpacing) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  };

  const drawShapes = (
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    selectedIds: string[],
    zoom: number
  ) => {
    const pointMap = new Map<string, PointShape>();
    for (const shape of shapes) {
      if (shape.type === 'point') {
        pointMap.set(shape.id, shape);
      }
    }

    for (const shape of shapes) {
      const isSelected = selectedIds.includes(shape.id);
      const scale = shape.creating ? getCreationScale(shape.createdAt) : 1;

      switch (shape.type) {
        case 'segment': {
          const start = pointMap.get(shape.startPointId);
          const end = pointMap.get(shape.endPointId);
          if (start && end) {
            drawSegment(ctx, start, end, isSelected, scale);
          }
          break;
        }
        case 'circle': {
          const center = pointMap.get(shape.centerId);
          const radiusPt = pointMap.get(shape.radiusPointId);
          if (center && radiusPt) {
            const r = distance(center.x, center.y, radiusPt.x, radiusPt.y);
            drawCircle(ctx, center.x, center.y, r, isSelected, scale);
          }
          break;
        }
        case 'line': {
          const p1 = pointMap.get(shape.point1Id);
          const p2 = pointMap.get(shape.point2Id);
          if (p1 && p2) {
            drawLine(ctx, p1, p2, isSelected, scale);
          }
          break;
        }
        case 'ray': {
          const start = pointMap.get(shape.startPointId);
          const dir = pointMap.get(shape.directionPointId);
          if (start && dir) {
            drawRay(ctx, start, dir, isSelected, scale);
          }
          break;
        }
        case 'polygon': {
          const points = shape.pointIds
            .map((id) => pointMap.get(id))
            .filter((p): p is PointShape => p !== undefined);
          if (points.length >= 2) {
            drawPolygon(ctx, points, shape.closed || false, isSelected, scale);
          }
          break;
        }
      }
    }

    for (const shape of shapes) {
      if (shape.type === 'point') {
        const isSelected = selectedIds.includes(shape.id);
        const scale = shape.creating ? getCreationScale(shape.createdAt) : 1;
        drawPoint(ctx, shape.x, shape.y, isSelected, scale, zoom);
      }
    }
  };

  const getCreationScale = (createdAt?: number): number => {
    if (!createdAt) return 1;
    const elapsed = Date.now() - createdAt;
    const progress = Math.min(elapsed / 200, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    return easeOut;
  };

  const drawPoint = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isSelected: boolean,
    scale: number,
    zoom: number
  ) => {
    const radius = POINT_RADIUS * scale;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 4 / zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    start: PointShape,
    end: PointShape,
    isSelected: boolean,
    scale: number
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const scaledDx = dx * scale;
    const scaledDy = dy * scale;

    ctx.beginPath();
    ctx.moveTo(midX - scaledDx / 2, midY - scaledDy / 2);
    ctx.lineTo(midX + scaledDx / 2, midY + scaledDy / 2);
    ctx.strokeStyle = isSelected ? '#f97316' : '#475569';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    r: number,
    isSelected: boolean,
    scale: number
  ) => {
    const radius = r * scale;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#8b5cf633';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isSelected ? '#f97316' : '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawLine = (
    ctx: CanvasRenderingContext2D,
    p1: PointShape,
    p2: PointShape,
    isSelected: boolean,
    scale: number
  ) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const ex = (dx / len) * 10000 * scale;
    const ey = (dy / len) * 10000 * scale;

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    ctx.beginPath();
    ctx.moveTo(midX - ex, midY - ey);
    ctx.lineTo(midX + ex, midY + ey);
    ctx.strokeStyle = isSelected ? '#f97316' : '#475569';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const drawRay = (
    ctx: CanvasRenderingContext2D,
    start: PointShape,
    dir: PointShape,
    isSelected: boolean,
    scale: number
  ) => {
    const dx = dir.x - start.x;
    const dy = dir.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const ex = (dx / len) * 10000 * scale;
    const ey = (dy / len) * 10000 * scale;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(start.x + ex, start.y + ey);
    ctx.strokeStyle = isSelected ? '#f97316' : '#475569';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const drawPolygon = (
    ctx: CanvasRenderingContext2D,
    points: PointShape[],
    closed: boolean,
    isSelected: boolean,
    scale: number
  ) => {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    if (closed) {
      ctx.closePath();
    }
    ctx.strokeStyle = isSelected ? '#f97316' : '#475569';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const drawPolygonPreview = (
    ctx: CanvasRenderingContext2D,
    pointIds: string[],
    preview: any,
    shapes: Shape[]
  ) => {
    if (pointIds.length === 0) return;

    const lastPoint = getPointById(shapes, pointIds[pointIds.length - 1]);
    if (!lastPoint) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(preview.x, preview.y);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(preview.x, preview.y, POINT_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#94a3b880';
    ctx.fill();

    if (pointIds.length >= 2) {
      const firstPoint = getPointById(shapes, pointIds[0]);
      if (firstPoint) {
        const dist = distance(preview.x, preview.y, firstPoint.x, firstPoint.y);
        if (dist < 20 / zoom) {
          ctx.beginPath();
          ctx.arc(firstPoint.x, firstPoint.y, POINT_RADIUS + 6 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
        }
      }
    }
  };

  const drawConstraints = (
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    constraints: any[]
  ) => {
    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'parallel':
          drawParallelConstraint(ctx, shapes, constraint);
          break;
        case 'perpendicular':
          drawPerpendicularConstraint(ctx, shapes, constraint);
          break;
        case 'midpoint':
          drawMidpointConstraint(ctx, shapes, constraint);
          break;
        case 'angle':
          drawAngleConstraint(ctx, shapes, constraint);
          break;
      }
    }
  };

  const drawParallelConstraint = (
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    constraint: any
  ) => {
    const seg1 = getSegmentById(shapes, constraint.segment1Id);
    const seg2 = getSegmentById(shapes, constraint.segment2Id);
    if (!seg1 || !seg2) return;

    const s1 = getPointById(shapes, seg1.startPointId);
    const e1 = getPointById(shapes, seg1.endPointId);
    const s2 = getPointById(shapes, seg2.startPointId);
    const e2 = getPointById(shapes, seg2.endPointId);

    if (!s1 || !e1 || !s2 || !e2) return;

    const drawArrow = (x: number, y: number, angle: number) => {
      const size = 6 / zoom;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-size, -size / 2);
      ctx.lineTo(0, 0);
      ctx.lineTo(-size, size / 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5 / zoom;
      ctx.stroke();
      ctx.restore();
    };

    const mid1X = (s1.x + e1.x) / 2;
    const mid1Y = (s1.y + e1.y) / 2;
    const angle1 = Math.atan2(e1.y - s1.y, e1.x - s1.x);
    drawArrow(mid1X, mid1Y, angle1);

    const mid2X = (s2.x + e2.x) / 2;
    const mid2Y = (s2.y + e2.y) / 2;
    const angle2 = Math.atan2(e2.y - s2.y, e2.x - s2.x);
    drawArrow(mid2X, mid2Y, angle2);
  };

  const drawPerpendicularConstraint = (
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    constraint: any
  ) => {
    const seg1 = getSegmentById(shapes, constraint.segment1Id);
    const seg2 = getSegmentById(shapes, constraint.segment2Id);
    if (!seg1 || !seg2) return;

    const s1 = getPointById(shapes, seg1.startPointId);
    const e1 = getPointById(shapes, seg1.endPointId);
    const s2 = getPointById(shapes, seg2.startPointId);
    const e2 = getPointById(shapes, seg2.endPointId);

    if (!s1 || !e1 || !s2 || !e2) return;

    const intersection = findIntersection(s1, e1, s2, e2);
    if (!intersection) return;

    const size = 8 / zoom;
    const dx1 = (e1.x - s1.x) / distance(s1.x, s1.y, e1.x, e1.y);
    const dy1 = (e1.y - s1.y) / distance(s1.x, s1.y, e1.x, e1.y);
    const dx2 = (e2.x - s2.x) / distance(s2.x, s2.y, e2.x, e2.y);
    const dy2 = (e2.y - s2.y) / distance(s2.x, s2.y, e2.x, e2.y);

    ctx.beginPath();
    ctx.moveTo(intersection.x + dx1 * size, intersection.y + dy1 * size);
    ctx.lineTo(intersection.x + dx1 * size + dx2 * size, intersection.y + dy1 * size + dy2 * size);
    ctx.lineTo(intersection.x + dx2 * size, intersection.y + dy2 * size);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5 / zoom;
    ctx.stroke();
  };

  const drawMidpointConstraint = (
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    constraint: any
  ) => {
    const point = getPointById(shapes, constraint.pointId);
    const segment = getSegmentById(shapes, constraint.segmentId);
    if (!point || !segment) return;

    const start = getPointById(shapes, segment.startPointId);
    const end = getPointById(shapes, segment.endPointId);
    if (!start || !end) return;

    ctx.beginPath();
    ctx.arc(point.x, point.y, 10 / zoom, 0, Math.PI * 2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5 / zoom;
    ctx.stroke();
  };

  const drawAngleConstraint = (
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    constraint: any
  ) => {
    const seg1 = getSegmentById(shapes, constraint.segment1Id);
    const seg2 = getSegmentById(shapes, constraint.segment2Id);
    if (!seg1 || !seg2) return;

    const s1 = getPointById(shapes, seg1.startPointId);
    const e1 = getPointById(shapes, seg1.endPointId);
    const s2 = getPointById(shapes, seg2.startPointId);
    const e2 = getPointById(shapes, seg2.endPointId);

    if (!s1 || !e1 || !s2 || !e2) return;

    const vertex = findSharedPoint(s1, e1, s2, e2);
    if (!vertex) return;

    const other1 = vertex.id === s1.id ? e1 : s1;
    const other2 = vertex.id === s2.id ? e2 : s2;

    const angle1 = Math.atan2(other1.y - vertex.y, other1.x - vertex.x);
    const angle2 = Math.atan2(other2.y - vertex.y, other2.x - vertex.x);

    const arcRadius = 20 / zoom;

    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, arcRadius, angle1, angle2, angle1 > angle2);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5 / zoom;
    ctx.stroke();

    const midAngle = (angle1 + angle2) / 2;
    const labelX = vertex.x + Math.cos(midAngle) * (arcRadius + 15 / zoom);
    const labelY = vertex.y + Math.sin(midAngle) * (arcRadius + 15 / zoom);

    ctx.fillStyle = '#22c55e';
    ctx.font = `${12 / zoom}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(constraint.angle)}°`, labelX, labelY);
  };

  const drawConstraintHighlight = (
    ctx: CanvasRenderingContext2D,
    shapeId: string,
    shapes: Shape[]
  ) => {
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    if (shape.type === 'point') {
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, 12 / zoom, 0, Math.PI * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();
    } else if (shape.type === 'segment') {
      const start = getPointById(shapes, shape.startPointId);
      const end = getPointById(shapes, shape.endPointId);
      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4 / zoom;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  };

  const findIntersection = (
    p1: PointShape,
    p2: PointShape,
    p3: PointShape,
    p4: PointShape
  ): { x: number; y: number } | null => {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denom) < 0.0001) return null;

    const ua =
      ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub =
      ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        y: p1.y + ua * (p2.y - p1.y),
      };
    }

    return null;
  };

  const findSharedPoint = (
    p1: PointShape,
    p2: PointShape,
    p3: PointShape,
    p4: PointShape
  ): PointShape | null => {
    if (p1.id === p3.id || p1.id === p4.id) return p1;
    if (p2.id === p3.id || p2.id === p4.id) return p2;
    return null;
  };

  const getCanvasSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 800, height: 600 };
    const dpr = window.devicePixelRatio || 1;
    return {
      width: canvas.width / dpr,
      height: canvas.height / dpr,
    };
  };

  const handleExportSVG = () => {
    const { width, height } = getCanvasSize();
    const svgContent = exportToSVG(shapes, width, height);
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geometry-drawing.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSVG = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { shapes: importedShapes, constraints: importedConstraints } = importFromSVG(content);
      importShapes(importedShapes, importedConstraints);
      addToHistory();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: spacePressed ? 'grab' : isPanning ? 'grabbing' : 'crosshair',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          fontSize: '13px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '6px',
          padding: '4px 10px',
          color: '#475569',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        {Math.round(zoom * 100)}%
      </div>

      {isDragging && mousePos && dragPointId && (
        <div
          style={{
            position: 'absolute',
            left: worldToScreen(mousePos.x, mousePos.y).x + 12,
            top: worldToScreen(mousePos.x, mousePos.y).y + 12,
            backgroundColor: '#1e293b',
            color: '#ffffff',
            fontSize: '12px',
            padding: '4px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}
        >
          x: {Math.round(mousePos.x)}, y: {Math.round(mousePos.y)}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".svg"
        style={{ display: 'none' }}
        onChange={handleImportSVG}
      />
    </div>
  );
}

export { exportToSVG };

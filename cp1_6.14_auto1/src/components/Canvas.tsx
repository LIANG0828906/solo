import React, { useEffect, useImperativeHandle, useRef, useState, forwardRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Line, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import type { Shape as ShapeType, ToolType, RectShape, CircleShape, LineShape, User } from '../types';
import { socketService } from '../utils/socket';
import './Canvas.css';

export interface CanvasHandle {
  exportToImage: () => void;
}

interface CanvasProps {
  tool: ToolType;
  currentUser: User | null;
  shapes: ShapeType[];
  onShapesChange: (shapes: ShapeType[]) => void;
  onLocalShapeAdd: (shape: ShapeType) => void;
  onLocalShapeUpdate: (shape: ShapeType) => void;
  onLocalShapeDelete: (shapeId: string) => void;
  onStickyCreate: (x: number, y: number) => void;
  selectedId: string | null;
  onSelectChange: (id: string | null) => void;
  stickyNotesContainerRef: React.RefObject<HTMLDivElement | null>;
  canvasScale: number;
  onCanvasScaleChange: (scale: number) => void;
}

type DrawingState =
  | { status: 'idle' }
  | { status: 'drawing'; type: 'rect' | 'circle' | 'line'; startX: number; startY: number; previewId: string };

const CreatorDot: React.FC<{ x: number; y: number; color: string; rotation: number }> = ({ x, y, color, rotation }) => {
  return (
    <Group x={x} y={y} rotation={rotation}>
      <Circle
        x={-8}
        y={-8}
        radius={7}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
        listening={false}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={2}
      />
    </Group>
  );
};

const getShapeBounds = (shape: ShapeType): { x: number; y: number; width: number; height: number } => {
  if (shape.type === 'rect') return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  if (shape.type === 'circle') return { x: shape.x - shape.radius, y: shape.y - shape.radius, width: shape.radius * 2, height: shape.radius * 2 };
  const xs = shape.points.filter((_, i) => i % 2 === 0);
  const ys = shape.points.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(props, ref) {
  const {
    tool,
    currentUser,
    shapes,
    onShapesChange,
    onLocalShapeAdd,
    onLocalShapeUpdate,
    onLocalShapeDelete,
    onStickyCreate,
    selectedId,
    onSelectChange,
    stickyNotesContainerRef,
    canvasScale,
    onCanvasScaleChange,
  } = props;

  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [drawing, setDrawing] = useState<DrawingState>({ status: 'idle' });
  const trAnchorsRef = useRef<Set<string>>(new Set());

  const updateTransformerNodes = useCallback(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;

    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#${CSS.escape(selectedId)}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  useEffect(() => {
    const frame = requestAnimationFrame(updateTransformerNodes);
    return () => cancelAnimationFrame(frame);
  }, [updateTransformerNodes, shapes.length]);

  useImperativeHandle(ref, () => ({
    exportToImage: () => {
      const stage = stageRef.current;
      if (!stage) return;

      const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
      const dataUrl = stage.toDataURL({ pixelRatio });

      const link = document.createElement('a');
      link.download = `whiteboard-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
  }));

  const getStagePointerPosition = (): { x: number; y: number } => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return {
      x: pos.x / canvasScale,
      y: pos.y / canvasScale,
    };
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const stage = stageRef.current;
    if (!stage) return;

    const clickedOnEmpty = target === stage || target === layerRef.current || target.getClassName() === 'Stage';

    if (tool === 'select') {
      if (clickedOnEmpty) {
        onSelectChange(null);
        return;
      }
      const node = target.findAncestors('Node')[0] || target;
      if (node && node.id()) {
        onSelectChange(node.id());
      } else {
        onSelectChange(null);
      }
      return;
    }

    if (tool === 'sticky') {
      if (clickedOnEmpty) {
        const { x, y } = getStagePointerPosition();
        onStickyCreate(x, y);
      }
      return;
    }

    if (tool === 'rect' || tool === 'circle' || tool === 'line') {
      if (!clickedOnEmpty) return;
      if (!currentUser) return;

      const { x, y } = getStagePointerPosition();
      const previewId = `preview-${uuidv4()}`;

      if (tool === 'line') {
        const previewShape: LineShape = {
          id: previewId,
          type: 'line',
          x,
          y,
          rotation: 0,
          stroke: currentUser.color,
          strokeWidth: 3,
          creatorId: currentUser.id,
          creatorColor: currentUser.color,
          points: [x, y, x, y],
        };
        onShapesChange([...shapes, previewShape]);
      } else {
        const previewShape: ShapeType =
          tool === 'rect'
            ? ({
                id: previewId,
                type: 'rect',
                x,
                y,
                rotation: 0,
                stroke: currentUser.color,
                strokeWidth: 3,
                creatorId: currentUser.id,
                creatorColor: currentUser.color,
                width: 0,
                height: 0,
              } as RectShape)
            : ({
                id: previewId,
                type: 'circle',
                x,
                y,
                rotation: 0,
                stroke: currentUser.color,
                strokeWidth: 3,
                creatorId: currentUser.id,
                creatorColor: currentUser.color,
                radius: 0,
              } as CircleShape);
        onShapesChange([...shapes, previewShape]);
      }

      setDrawing({ status: 'drawing', type: tool, startX: x, startY: y, previewId });
    }
  };

  const handleStageMouseMove = () => {
    if (drawing.status !== 'drawing') return;
    const { x, y } = getStagePointerPosition();
    const index = shapes.findIndex((s) => s.id === drawing.previewId);
    if (index === -1) return;

    const prev = shapes[index];
    const next = [...shapes];
    const { startX, startY } = drawing;

    if (drawing.type === 'rect') {
      const x1 = Math.min(startX, x);
      const y1 = Math.min(startY, y);
      const w = Math.abs(x - startX);
      const h = Math.abs(y - startY);
      next[index] = { ...(prev as RectShape), x: x1, y: y1, width: w, height: h };
    } else if (drawing.type === 'circle') {
      const cx = (startX + x) / 2;
      const cy = (startY + y) / 2;
      const dx = x - startX;
      const dy = y - startY;
      const radius = Math.sqrt(dx * dx + dy * dy) / 2;
      next[index] = { ...(prev as CircleShape), x: cx, y: cy, radius };
    } else if (drawing.type === 'line') {
      next[index] = {
        ...(prev as LineShape),
        points: [startX, startY, x, y],
      };
    }

    onShapesChange(next);
  };

  const handleStageMouseUp = () => {
    if (drawing.status !== 'drawing') return;
    const index = shapes.findIndex((s) => s.id === drawing.previewId);
    if (index === -1) {
      setDrawing({ status: 'idle' });
      return;
    }

    const previewShape = shapes[index];
    const nextShapes = shapes.filter((_, i) => i !== index);

    let valid = false;
    if (previewShape.type === 'rect') {
      valid = previewShape.width > 3 && previewShape.height > 3;
    } else if (previewShape.type === 'circle') {
      valid = previewShape.radius > 3;
    } else if (previewShape.type === 'line') {
      const [x1, y1, x2, y2] = previewShape.points;
      const dx = x2 - x1;
      const dy = y2 - y1;
      valid = Math.sqrt(dx * dx + dy * dy) > 5;
    }

    if (valid && currentUser) {
      const finalId = uuidv4();
      const finalShape: ShapeType = { ...previewShape, id: finalId };
      onShapesChange([...nextShapes, finalShape]);
      onLocalShapeAdd(finalShape);
      socketService.addShape(finalShape);
    } else {
      onShapesChange(nextShapes);
    }

    setDrawing({ status: 'idle' });
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Node;
    const shapeId = node.id();
    if (!shapeId || shapeId.startsWith('preview-')) return;

    const idx = shapes.findIndex((s) => s.id === shapeId);
    if (idx === -1) return;

    const old = shapes[idx];
    let updated: ShapeType;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    if (old.type === 'rect') {
      updated = {
        ...old,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, old.width * scaleX),
        height: Math.max(5, old.height * scaleY),
        rotation,
      };
    } else if (old.type === 'circle') {
      const avgScale = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
      updated = {
        ...old,
        x: node.x(),
        y: node.y(),
        radius: Math.max(3, old.radius * avgScale),
        rotation,
      };
    } else {
      const pts = old.points.slice();
      const newPts: number[] = [];
      for (let i = 0; i < pts.length; i += 2) {
        const px = pts[i];
        const py = pts[i + 1];
        const newX = px * scaleX;
        const newY = py * scaleY;
        newPts.push(newX, newY);
      }
      updated = {
        ...old,
        x: node.x(),
        y: node.y(),
        rotation,
        points: newPts,
      };
    }

    node.scaleX(1);
    node.scaleY(1);

    const next = [...shapes];
    next[idx] = updated;
    onShapesChange(next);
    onLocalShapeUpdate(updated);
    socketService.updateShape(updated);
    trAnchorsRef.current.clear();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Node;
    const shapeId = node.id();
    if (!shapeId || shapeId.startsWith('preview-')) return;

    const idx = shapes.findIndex((s) => s.id === shapeId);
    if (idx === -1) return;

    const old = shapes[idx];
    const updated: ShapeType = { ...old, x: node.x(), y: node.y() };
    const next = [...shapes];
    next[idx] = updated;
    onShapesChange(next);
    onLocalShapeUpdate(updated);
    socketService.updateShape(updated);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const idx = shapes.findIndex((s) => s.id === selectedId);
        if (idx !== -1) {
          const next = shapes.filter((_, i) => i !== idx);
          onShapesChange(next);
          onLocalShapeDelete(selectedId);
          socketService.deleteShape(selectedId);
          onSelectChange(null);
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, shapes, onShapesChange, onLocalShapeDelete, onSelectChange]);

  useEffect(() => {
    const container = stageRef.current?.container();
    if (!container) return;

    const stickyContainer = stickyNotesContainerRef.current;
    if (stickyContainer) {
      stickyContainer.style.transform = `scale(${canvasScale})`;
      stickyContainer.style.transformOrigin = '0 0';
    }

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newScale = Math.min(3, Math.max(0.3, canvasScale + delta));
      onCanvasScaleChange(newScale);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [canvasScale, onCanvasScaleChange, stickyNotesContainerRef]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    position: 'relative',
  };

  const cursorStyle =
    tool === 'select' ? 'default' : tool === 'sticky' ? 'copy' : 'crosshair';

  const renderShape = (shape: ShapeType) => {
    const isPreview = shape.id.startsWith('preview-');
    const bounds = getShapeBounds(shape);
    const dotX = bounds.x + bounds.width;
    const dotY = bounds.y + bounds.height;

    const commonProps = {
      id: shape.id,
      draggable: !isPreview && tool === 'select',
      onTransformEnd: handleTransformEnd,
      onDragEnd: handleDragEnd,
    };

    if (shape.type === 'rect') {
      return (
        <Group key={shape.id}>
          <Rect
            {...commonProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rotation={shape.rotation}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={isPreview ? 0.7 : 1}
            dash={isPreview ? [5, 5] : undefined}
            hitStrokeWidth={10}
          />
          <CreatorDot x={dotX} y={dotY} color={shape.creatorColor} rotation={shape.rotation} />
        </Group>
      );
    }

    if (shape.type === 'circle') {
      return (
        <Group key={shape.id}>
          <Circle
            {...commonProps}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            rotation={shape.rotation}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={isPreview ? 0.7 : 1}
            dash={isPreview ? [5, 5] : undefined}
            hitStrokeWidth={10}
          />
          <CreatorDot x={dotX} y={dotY} color={shape.creatorColor} rotation={shape.rotation} />
        </Group>
      );
    }

    const xs = shape.points.filter((_, i) => i % 2 === 0);
    const ys = shape.points.filter((_, i) => i % 2 === 1);
    const relPoints: number[] = [];
    for (let i = 0; i < xs.length; i++) {
      relPoints.push(xs[i] - shape.x, ys[i] - shape.y);
    }

    return (
      <Group key={shape.id}>
        <Line
          {...commonProps}
          x={shape.x}
          y={shape.y}
          points={relPoints}
          rotation={shape.rotation}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
          lineJoin="round"
          opacity={isPreview ? 0.7 : 1}
          dash={isPreview ? [5, 5] : undefined}
          hitStrokeWidth={10}
        />
        <CreatorDot x={dotX} y={dotY} color={shape.creatorColor} rotation={shape.rotation} />
      </Group>
    );
  };

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 56 : 800;

  return (
    <div className="canvas-container" style={containerStyle}>
      <Stage
        ref={stageRef}
        width={viewportWidth}
        height={viewportHeight}
        scaleX={canvasScale}
        scaleY={canvasScale}
        style={{ cursor: cursorStyle, display: 'block' }}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={handleStageMouseUp}
        onTouchStart={(e) => handleStageMouseDown(e as unknown as Konva.KonvaEventObject<MouseEvent>)}
        onTouchMove={(e) => handleStageMouseMove()}
        onTouchEnd={handleStageMouseUp}
      >
        <Layer ref={layerRef}>
          <Rect
            x={-5000}
            y={-5000}
            width={20000}
            height={20000}
            fill="transparent"
            listening={false}
          />
          {shapes.map(renderShape)}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            anchorStroke="#89b4fa"
            anchorFill="#ffffff"
            anchorSize={8}
            borderStroke="#89b4fa"
            borderStrokeWidth={2}
            rotationSnaps={[0, 90, 180, 270]}
            rotationSnapTolerance={10}
          />
        </Layer>
      </Stage>
    </div>
  );
});

export default Canvas;

import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  useCallback,
  useMemo,
} from 'react';
import { Stage, Layer, Rect, Circle, Line, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { v4 as uuidv4 } from 'uuid';
import type {
  Shape as ShapeType,
  ToolType,
  RectShape,
  CircleShape,
  LineShape,
  User,
} from '../types';
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

interface DrawingState {
  isDrawing: boolean;
  type: 'rect' | 'circle' | 'line' | null;
  startX: number;
  startY: number;
  previewId: string;
}

const CreatorDot: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => {
  return (
    <Circle
      x={x}
      y={y}
      radius={7}
      fill={color}
      stroke="#ffffff"
      strokeWidth={2}
      listening={false}
      shadowColor="rgba(0,0,0,0.25)"
      shadowBlur={3}
    />
  );
};

const getShapeBounds = (
  shape: ShapeType,
): { x: number; y: number; width: number; height: number } => {
  if (shape.type === 'rect')
    return { x: shape.x, y: shape.y, width: shape.width, height: shape.height };
  if (shape.type === 'circle')
    return {
      x: shape.x - shape.radius,
      y: shape.y - shape.radius,
      width: shape.radius * 2,
      height: shape.radius * 2,
    };
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
  const drawingRef = useRef<DrawingState>({
    isDrawing: false,
    type: null,
    startX: 0,
    startY: 0,
    previewId: '',
  });
  const shapesRef = useRef<ShapeType[]>(shapes);
  const toolRef = useRef(tool);
  const userRef = useRef(currentUser);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

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
    let raf = 0;
    const tick = () => {
      updateTransformerNodes();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [updateTransformerNodes]);

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

  const updatePreviewShape = (updater: (prev: ShapeType) => ShapeType) => {
    const drawing = drawingRef.current;
    if (!drawing.isDrawing || !drawing.previewId) return;

    const allShapes = shapesRef.current;
    const index = allShapes.findIndex((s) => s.id === drawing.previewId);
    if (index === -1) return;

    const next = [...allShapes];
    next[index] = updater(allShapes[index]);
    shapesRef.current = next;
    onShapesChange(next);
    forceUpdate((n) => n + 1);
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const stage = stageRef.current;
    if (!stage) return;

    const clickedOnEmpty =
      target === stage ||
      target === layerRef.current ||
      target.getClassName() === 'Stage';

    if (toolRef.current === 'select') {
      if (clickedOnEmpty) {
        onSelectChange(null);
        return;
      }
      let node = target;
      while (node && node.getParent() && !node.id()) {
        node = node.getParent();
      }
      if (node && node.id() && !node.id().startsWith('preview-')) {
        onSelectChange(node.id());
      } else {
        onSelectChange(null);
      }
      return;
    }

    if (toolRef.current === 'sticky') {
      if (clickedOnEmpty) {
        const { x, y } = getStagePointerPosition();
        onStickyCreate(x, y);
      }
      return;
    }

    const drawTool = toolRef.current;
    if (drawTool !== 'rect' && drawTool !== 'circle' && drawTool !== 'line') return;
    if (!clickedOnEmpty) return;
    const user = userRef.current;
    if (!user) return;

    const { x, y } = getStagePointerPosition();
    const previewId = `preview-${uuidv4()}`;

    let previewShape: ShapeType;
    if (drawTool === 'rect') {
      previewShape = {
        id: previewId,
        type: 'rect',
        x,
        y,
        rotation: 0,
        stroke: user.color,
        strokeWidth: 3,
        creatorId: user.id,
        creatorColor: user.color,
        width: 0,
        height: 0,
      } as RectShape;
    } else if (drawTool === 'circle') {
      previewShape = {
        id: previewId,
        type: 'circle',
        x,
        y,
        rotation: 0,
        stroke: user.color,
        strokeWidth: 3,
        creatorId: user.id,
        creatorColor: user.color,
        radius: 0,
      } as CircleShape;
    } else {
      previewShape = {
        id: previewId,
        type: 'line',
        x,
        y,
        rotation: 0,
        stroke: user.color,
        strokeWidth: 3,
        creatorId: user.id,
        creatorColor: user.color,
        points: [0, 0, 0, 0],
      } as LineShape;
    }

    const next = [...shapesRef.current, previewShape];
    shapesRef.current = next;
    onShapesChange(next);

    drawingRef.current = {
      isDrawing: true,
      type: drawTool,
      startX: x,
      startY: y,
      previewId,
    };
  };

  const handleStageMouseMove = () => {
    const drawing = drawingRef.current;
    if (!drawing.isDrawing || !drawing.type) return;

    const { x, y } = getStagePointerPosition();
    const { startX, startY, type } = drawing;

    updatePreviewShape((prev) => {
      if (type === 'rect') {
        const x1 = Math.min(startX, x);
        const y1 = Math.min(startY, y);
        const w = Math.abs(x - startX);
        const h = Math.abs(y - startY);
        return { ...(prev as RectShape), x: x1, y: y1, width: w, height: h };
      }
      if (type === 'circle') {
        const dx = x - startX;
        const dy = y - startY;
        const radius = Math.sqrt(dx * dx + dy * dy);
        return { ...(prev as CircleShape), x: startX, y: startY, radius };
      }
      const rel = { x: x - prev.x, y: y - prev.y };
      return { ...(prev as LineShape), points: [0, 0, rel.x, rel.y] };
    });
  };

  const handleStageMouseUp = () => {
    const drawing = drawingRef.current;
    if (!drawing.isDrawing || !drawing.type) return;

    const allShapes = shapesRef.current;
    const index = allShapes.findIndex((s) => s.id === drawing.previewId);
    if (index === -1) {
      drawingRef.current = { isDrawing: false, type: null, startX: 0, startY: 0, previewId: '' };
      return;
    }

    const previewShape = allShapes[index];
    const nextShapes = allShapes.filter((_, i) => i !== index);

    let valid = false;
    if (previewShape.type === 'rect') {
      valid = previewShape.width > 3 && previewShape.height > 3;
    } else if (previewShape.type === 'circle') {
      valid = previewShape.radius > 3;
    } else if (previewShape.type === 'line') {
      const pts = previewShape.points;
      const dx = pts[2] - pts[0];
      const dy = pts[3] - pts[1];
      valid = Math.sqrt(dx * dx + dy * dy) > 5;
    }

    const user = userRef.current;
    if (valid && user) {
      const finalId = uuidv4();
      let finalShape: ShapeType = { ...previewShape, id: finalId };

      if (finalShape.type === 'rect') {
        finalShape = finalShape as RectShape;
      } else if (finalShape.type === 'circle') {
        finalShape = finalShape as CircleShape;
      } else if (finalShape.type === 'line') {
        finalShape = {
          ...finalShape,
          x: previewShape.x,
          y: previewShape.y,
          points: (previewShape as LineShape).points,
        } as LineShape;
      }

      const finalList = [...nextShapes, finalShape];
      shapesRef.current = finalList;
      onShapesChange(finalList);
      onLocalShapeAdd(finalShape);
      socketService.addShape(finalShape);
    } else {
      shapesRef.current = nextShapes;
      onShapesChange(nextShapes);
    }

    drawingRef.current = { isDrawing: false, type: null, startX: 0, startY: 0, previewId: '' };
  };

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Node;
    const shapeId = node.id();
    if (!shapeId || shapeId.startsWith('preview-')) return;

    const allShapes = shapesRef.current;
    const idx = allShapes.findIndex((s) => s.id === shapeId);
    if (idx === -1) return;

    const old = allShapes[idx];
    let updated: ShapeType;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    if (old.type === 'rect') {
      updated = {
        ...old,
        x: node.x(),
        y: node.y(),
        width: Math.max(5, old.width * Math.abs(scaleX)),
        height: Math.max(5, old.height * Math.abs(scaleY)),
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
        newPts.push(pts[i] * scaleX, pts[i + 1] * scaleY);
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

    const next = [...allShapes];
    next[idx] = updated;
    shapesRef.current = next;
    onShapesChange(next);
    onLocalShapeUpdate(updated);
    socketService.updateShape(updated);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Node;
    const shapeId = node.id();
    if (!shapeId || shapeId.startsWith('preview-')) return;

    const allShapes = shapesRef.current;
    const idx = allShapes.findIndex((s) => s.id === shapeId);
    if (idx === -1) return;

    const old = allShapes[idx];
    const updated: ShapeType = { ...old, x: node.x(), y: node.y() };
    const next = [...allShapes];
    next[idx] = updated;
    shapesRef.current = next;
    onShapesChange(next);
    onLocalShapeUpdate(updated);
    socketService.updateShape(updated);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const allShapes = shapesRef.current;
        const idx = allShapes.findIndex((s) => s.id === selectedId);
        if (idx !== -1) {
          const next = allShapes.filter((_, i) => i !== idx);
          shapesRef.current = next;
          onShapesChange(next);
          onLocalShapeDelete(selectedId);
          socketService.deleteShape(selectedId);
          onSelectChange(null);
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedId, onShapesChange, onLocalShapeDelete, onSelectChange]);

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

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight - 56 : 800;

  const cursorStyle = useMemo(() => {
    const t = toolRef.current;
    if (t === 'select') return 'default';
    if (t === 'sticky') return 'copy';
    return 'crosshair';
  }, [tool]);

  const renderShape = (shape: ShapeType) => {
    const isPreview = shape.id.startsWith('preview-');
    const bounds = getShapeBounds(shape);
    const dotX = bounds.x + bounds.width;
    const dotY = bounds.y + bounds.height;

    const isLine = shape.type === 'line';
    const baseProps = {
      id: shape.id,
      draggable: !isPreview && tool === 'select',
      onTransformEnd: handleTransformEnd,
      onDragEnd: handleDragEnd,
    };

    if (shape.type === 'rect') {
      return (
        <Group key={shape.id}>
          <Rect
            {...baseProps}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            rotation={shape.rotation}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={isPreview ? 0.7 : 1}
            dash={isPreview ? [6, 4] : undefined}
            hitStrokeWidth={10}
          />
          <CreatorDot x={dotX} y={dotY} color={shape.creatorColor} />
        </Group>
      );
    }

    if (shape.type === 'circle') {
      return (
        <Group key={shape.id}>
          <Circle
            {...baseProps}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            rotation={shape.rotation}
            stroke={shape.stroke}
            strokeWidth={shape.strokeWidth}
            opacity={isPreview ? 0.7 : 1}
            dash={isPreview ? [6, 4] : undefined}
            hitStrokeWidth={10}
          />
          <CreatorDot x={dotX} y={dotY} color={shape.creatorColor} />
        </Group>
      );
    }

    const xs = shape.points.filter((_, i) => i % 2 === 0);
    const ys = shape.points.filter((_, i) => i % 2 === 1);
    const relPoints: number[] = [];
    const baseX = isLine ? shape.x : 0;
    const baseY = isLine ? shape.y : 0;
    for (let i = 0; i < xs.length; i++) {
      relPoints.push(xs[i] - baseX, ys[i] - baseY);
    }

    return (
      <Group key={shape.id}>
        <Line
          {...baseProps}
          x={shape.x}
          y={shape.y}
          points={relPoints}
          rotation={shape.rotation}
          stroke={shape.stroke}
          strokeWidth={shape.strokeWidth}
          lineCap="round"
          lineJoin="round"
          opacity={isPreview ? 0.7 : 1}
          dash={isPreview ? [6, 4] : undefined}
          hitStrokeWidth={10}
        />
        <CreatorDot x={dotX} y={dotY} color={shape.creatorColor} />
      </Group>
    );
  };

  return (
    <div className="canvas-container">
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
        onTouchStart={(e) =>
          handleStageMouseDown(e as unknown as Konva.KonvaEventObject<MouseEvent>)
        }
        onTouchMove={handleStageMouseMove}
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
            enabledAnchors={[
              'top-left',
              'top-right',
              'bottom-left',
              'bottom-right',
              'middle-left',
              'middle-right',
              'top-center',
              'bottom-center',
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
            anchorStroke="#89b4fa"
            anchorFill="#ffffff"
            anchorSize={8}
            anchorCornerRadius={2}
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

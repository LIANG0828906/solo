import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useStore,
  Shape,
  PenShape,
  RectangleShape,
  CircleShape,
  StickyNote,
  generateShapeId,
  PRESET_COLORS,
} from '../store';
import { renderShapes, drawGrid, screenToCanvas } from './canvasRenderer';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

interface ToolButtonProps {
  tool: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, isActive, onClick, children }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    style={{
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: isActive ? '#3498DB' : 'transparent',
      color: 'white',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      transition: 'background-color 0.2s ease-out',
    }}
    title={tool}
  >
    {children}
  </motion.button>
);

interface ColorSwatchProps {
  color: string;
  isSelected: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, isSelected, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    style={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      backgroundColor: color,
      border: isSelected ? '2px solid white' : '2px solid transparent',
      boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.3)' : 'none',
      cursor: 'pointer',
      padding: 0,
      transition: 'all 0.2s ease-out',
    }}
  />
);

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const shapes = useStore((state) => state.shapes);
  const selectedTool = useStore((state) => state.selectedTool);
  const selectedColor = useStore((state) => state.selectedColor);
  const strokeWidth = useStore((state) => state.strokeWidth);
  const viewTransform = useStore((state) => state.viewTransform);
  const selectedShapeId = useStore((state) => state.selectedShapeId);
  const currentUserId = useStore((state) => state.currentUserId);

  const addShape = useStore((state) => state.addShape);
  const updateShape = useStore((state) => state.updateShape);
  const deleteShape = useStore((state) => state.deleteShape);
  const setSelectedTool = useStore((state) => state.setSelectedTool);
  const setSelectedColor = useStore((state) => state.setSelectedColor);
  const setStrokeWidth = useStore((state) => state.setStrokeWidth);
  const setViewTransform = useStore((state) => state.setViewTransform);
  const setSelectedShapeId = useStore((state) => state.setSelectedShapeId);
  const undo = useStore((state) => state.undo);
  const redo = useStore((state) => state.redo);
  const canUndo = useStore((state) => state.canUndo());
  const canRedo = useStore((state) => state.canRedo());

  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const tempShapeRef = useRef<Shape | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; shape: Shape | null }>({ x: 0, y: 0, shape: null });
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number }>({
    x: 0,
    y: 0,
    offsetX: 0,
    offsetY: 0,
  });
  const animationFrameRef = useRef<number | null>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(viewTransform.offsetX, viewTransform.offsetY);
    ctx.scale(viewTransform.scale, viewTransform.scale);
    drawGrid(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, viewTransform.scale);
    ctx.restore();

    const allShapes = tempShapeRef.current
      ? [...shapes, tempShapeRef.current]
      : shapes;

    renderShapes(ctx, allShapes, selectedShapeId, viewTransform);
  }, [shapes, selectedShapeId, viewTransform]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return screenToCanvas(screenX, screenY, viewTransform);
  };

  const hitTestSticky = (x: number, y: number): StickyNote | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (shape.type === 'sticky') {
        if (
          x >= shape.x &&
          x <= shape.x + shape.width &&
          y >= shape.y &&
          y <= shape.y + shape.height
        ) {
          return shape;
        }
      }
    }
    return null;
  };

  const hitTestDeleteButton = (x: number, y: number, sticky: StickyNote): boolean => {
    const btnX = sticky.x + sticky.width - 9;
    const btnY = sticky.y - 9;
    const distance = Math.sqrt((x - btnX) ** 2 + (y - btnY) ** 2);
    return distance <= 12;
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (spacePressed || e.button === 1) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX: viewTransform.offsetX,
        offsetY: viewTransform.offsetY,
      };
      return;
    }

    if (selectedTool === 'select') {
      const sticky = hitTestSticky(x, y);
      if (sticky) {
        if (hitTestDeleteButton(x, y, sticky)) {
          deleteShape(sticky.id);
          return;
        }
        setSelectedShapeId(sticky.id);
        setIsDragging(true);
        dragStartRef.current = { x, y, shape: sticky };
      } else {
        setSelectedShapeId(null);
      }
      return;
    }

    if (selectedTool === 'sticky') {
      const newSticky: StickyNote = {
        id: generateShapeId(),
        type: 'sticky',
        x: x - 75,
        y: y - 60,
        width: 150,
        height: 120,
        color: selectedColor,
        bgColor: '#FFF9C4',
        strokeWidth: 2,
        text: '',
        createdAt: Date.now(),
        createdBy: currentUserId,
      };
      addShape(newSticky);
      return;
    }

    setIsDrawing(true);

    if (selectedTool === 'pen') {
      tempShapeRef.current = {
        id: generateShapeId(),
        type: 'pen',
        points: [{ x, y }],
        color: selectedColor,
        strokeWidth,
        createdAt: Date.now(),
        createdBy: currentUserId,
      } as PenShape;
    } else if (selectedTool === 'rectangle') {
      tempShapeRef.current = {
        id: generateShapeId(),
        type: 'rectangle',
        x,
        y,
        width: 0,
        height: 0,
        color: selectedColor,
        strokeWidth,
        createdAt: Date.now(),
        createdBy: currentUserId,
      } as RectangleShape;
    } else if (selectedTool === 'circle') {
      tempShapeRef.current = {
        id: generateShapeId(),
        type: 'circle',
        x,
        y,
        radius: 0,
        color: selectedColor,
        strokeWidth,
        createdAt: Date.now(),
        createdBy: currentUserId,
      } as CircleShape;
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setViewTransform({
        ...viewTransform,
        offsetX: panStartRef.current.offsetX + dx,
        offsetY: panStartRef.current.offsetY + dy,
      });
      return;
    }

    if (isDragging && dragStartRef.current.shape) {
      const shape = dragStartRef.current.shape;
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;

      if (shape.type === 'sticky') {
        updateShape(shape.id, {
          x: (shape as StickyNote).x + dx,
          y: (shape as StickyNote).y + dy,
        } as Partial<StickyNote>);
      }

      dragStartRef.current = { x, y, shape: { ...shape } };
      const updatedShape = shapes.find((s) => s.id === shape.id);
      if (updatedShape) {
        dragStartRef.current.shape = updatedShape;
      }
      return;
    }

    if (!isDrawing || !tempShapeRef.current) return;

    if (tempShapeRef.current.type === 'pen') {
      const penShape = tempShapeRef.current as PenShape;
      penShape.points.push({ x, y });
    } else if (tempShapeRef.current.type === 'rectangle') {
      const rectShape = tempShapeRef.current as RectangleShape;
      const startX = rectShape.x;
      const startY = rectShape.y;
      rectShape.width = x - startX;
      rectShape.height = y - startY;
    } else if (tempShapeRef.current.type === 'circle') {
      const circleShape = tempShapeRef.current as CircleShape;
      const dx = x - circleShape.x;
      const dy = y - circleShape.y;
      circleShape.radius = Math.sqrt(dx * dx + dy * dy);
    }

    renderCanvas();
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      dragStartRef.current = { x: 0, y: 0, shape: null };
      return;
    }

    if (isDrawing && tempShapeRef.current) {
      const shape = tempShapeRef.current;
      if (shape.type === 'pen' && shape.points.length < 2) {
        tempShapeRef.current = null;
        setIsDrawing(false);
        return;
      }
      if ((shape.type === 'rectangle' || shape.type === 'circle') && 
          (shape.type === 'rectangle' ? Math.abs(shape.width) < 2 : Math.abs(shape.radius) < 2)) {
        tempShapeRef.current = null;
        setIsDrawing(false);
        return;
      }
      addShape({ ...shape });
      tempShapeRef.current = null;
    }

    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(3, Math.max(0.5, viewTransform.scale + delta));

    const scaleRatio = newScale / viewTransform.scale;
    const newOffsetX = mouseX - (mouseX - viewTransform.offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - viewTransform.offsetY) * scaleRatio;

    setViewTransform({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grab';
        }
      }
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, undo, redo]);

  const handleStickyDoubleClick = (sticky: StickyNote) => {
    setEditingStickyId(sticky.id);
    setEditingText(sticky.text);
  };

  const handleStickyTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, 200);
    setEditingText(text);
  };

  const handleStickyTextBlur = () => {
    if (editingStickyId) {
      updateShape(editingStickyId, { text: editingText } as Partial<StickyNote>);
      setEditingStickyId(null);
    }
  };

  const handleStickyTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleStickyTextBlur();
    }
  };

  const tools = [
    { id: 'select', icon: '↖', label: '选择' },
    { id: 'pen', icon: '✎', label: '画笔' },
    { id: 'rectangle', icon: '▢', label: '矩形' },
    { id: 'circle', icon: '○', label: '圆形' },
    { id: 'sticky', icon: '📝', label: '便签' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#F5F6FA',
      }}
    >
      <div
        style={{
          width: 60,
          backgroundColor: '#2C3E50',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 0',
          gap: 12,
          flexShrink: 0,
        }}
      >
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            tool={tool.label}
            isActive={selectedTool === tool.id}
            onClick={() => setSelectedTool(tool.id as any)}
          >
            {tool.icon}
          </ToolButton>
        ))}

        <div
          style={{
            width: 40,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.2)',
            margin: '4px 0',
          }}
        />

        {PRESET_COLORS.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            isSelected={selectedColor === color}
            onClick={() => setSelectedColor(color)}
          />
        ))}

        <div
          style={{
            width: 40,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.2)',
            margin: '4px 0',
          }}
        />

        <div style={{ color: 'white', fontSize: 10, marginBottom: 4 }}>
          {strokeWidth}px
        </div>
        <input
          type="range"
          min="2"
          max="10"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          style={{
            width: 40,
            height: 4,
            cursor: 'pointer',
            writingMode: 'vertical-lr',
            direction: 'rtl',
          }}
        />
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'auto',
          padding: 20,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: 4,
            cursor: spacePressed ? 'grab' : isPanning ? 'grabbing' : 'crosshair',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: 'none',
          }}
        >
          {Math.round(viewTransform.scale * 100)}%
        </div>

        {shapes
          .filter((s) => s.type === 'sticky')
          .map((shape) => {
            const sticky = shape as StickyNote;
            const screenPos = {
              x: sticky.x * viewTransform.scale + viewTransform.offsetX,
              y: sticky.y * viewTransform.scale + viewTransform.offsetY,
            };
            const isSelected = selectedShapeId === sticky.id;
            const isEditing = editingStickyId === sticky.id;

            return (
              <div
                key={sticky.id}
                style={{
                  position: 'absolute',
                  left: `calc(50% - ${CANVAS_WIDTH / 2}px + ${screenPos.x}px)`,
                  top: `calc(50% - ${CANVAS_HEIGHT / 2}px + ${screenPos.y}px)`,
                  width: sticky.width * viewTransform.scale,
                  height: sticky.height * viewTransform.scale,
                  cursor: selectedTool === 'select' ? 'move' : 'default',
                  pointerEvents: selectedTool === 'select' ? 'auto' : 'none',
                }}
                onMouseDown={(e) => {
                  if (selectedTool !== 'select') return;
                  e.stopPropagation();
                  const { x, y } = getCanvasCoords(e as any);
                  setSelectedShapeId(sticky.id);
                  setIsDragging(true);
                  dragStartRef.current = { x, y, shape: sticky };
                }}
                onDoubleClick={() => handleStickyDoubleClick(sticky)}
              >
                <AnimatePresence>
                  {isSelected && !isEditing && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteShape(sticky.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: -9 * viewTransform.scale,
                        right: -9 * viewTransform.scale,
                        width: 18 * viewTransform.scale,
                        height: 18 * viewTransform.scale,
                        borderRadius: '50%',
                        backgroundColor: '#E74C3C',
                        color: 'white',
                        border: '2px solid white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10 * viewTransform.scale,
                        fontWeight: 'bold',
                        padding: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        zIndex: 10,
                      }}
                    >
                      ×
                    </motion.button>
                  )}
                </AnimatePresence>

                {isEditing && (
                  <textarea
                    value={editingText}
                    onChange={handleStickyTextChange}
                    onBlur={handleStickyTextBlur}
                    onKeyDown={handleStickyTextKeyDown}
                    autoFocus
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      outline: 'none',
                      resize: 'none',
                      fontSize: 12 * viewTransform.scale,
                      fontFamily: 'sans-serif',
                      color: '#333',
                      padding: 10 * viewTransform.scale,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Whiteboard;

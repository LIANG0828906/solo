import { useRef, useState, useEffect, useCallback } from 'react';
import { usePosterStore, CanvasElement } from '../store';
import ContextMenu from './ContextMenu';
import Toolbar from './Toolbar';

interface CanvasProps {
  onExportClick: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 1200;

function Canvas({ onExportClick }: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    elements,
    selectedId,
    addElement,
    moveElement,
    scaleElement,
    selectElement,
  } = usePosterStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    elementId: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
  });

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const materialId = e.dataTransfer.getData('materialId');
    if (!materialId) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    addElement(materialId, coords.x, coords.y);
  };

  const handleElementMouseDown = (e: React.MouseEvent, element: CanvasElement) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    selectElement(element.id);

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setIsDragging(true);
    setDraggingId(element.id);
    setDragStart(coords);
    setElementStart({ x: element.x, y: element.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !draggingId) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;
    moveElement(draggingId, elementStart.x + dx, elementStart.y + dy);
  }, [isDragging, draggingId, dragStart, elementStart, moveElement, getCanvasCoords]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && draggingId) {
      usePosterStore.getState().pushHistory();
    }
    setIsDragging(false);
    setDraggingId(null);
  }, [isDragging, draggingId]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = () => {
    selectElement(null);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!selectedId) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scaleElement(selectedId, delta);
  };

  const handleContextMenu = (e: React.MouseEvent, elementId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      elementId: elementId || selectedId,
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  return (
    <div style={styles.canvasWrapper}>
      <div
        ref={canvasRef}
        style={{
          ...styles.canvas,
          ...(dragOver ? styles.canvasDragOver : {}),
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onContextMenu={(e) => handleContextMenu(e)}
      >
        <div style={styles.bleedLine} />

        {sortedElements.map(element => (
          <div
            key={element.id}
            style={{
              ...styles.element,
              left: element.x,
              top: element.y,
              width: element.width * element.scale,
              height: element.height * element.scale,
              zIndex: element.zIndex,
              transform: element.flipped ? 'scaleX(-1)' : 'scaleX(1)',
              outline: selectedId === element.id ? '2px solid #D4AF37' : 'none',
              boxShadow: selectedId === element.id ? '0 0 12px rgba(212, 175, 55, 0.5)' : 'none',
              cursor: isDragging && draggingId === element.id ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'box-shadow 0.2s ease, outline 0.2s ease',
            }}
            onMouseDown={(e) => handleElementMouseDown(e, element)}
            onContextMenu={(e) => handleContextMenu(e, element.id)}
          >
            <img
              src={element.imageUrl}
              alt={element.name}
              style={styles.elementImage}
              draggable={false}
            />
          </div>
        ))}

        <Toolbar onExport={onExportClick} />
      </div>

      {contextMenu.visible && contextMenu.elementId && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elementId={contextMenu.elementId}
          onClose={handleContextMenuClose}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  canvasWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  canvas: {
    position: 'relative',
    width: 'auto',
    height: '90vh',
    maxHeight: '90vh',
    aspectRatio: '800 / 1200',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s ease',
    userSelect: 'none',
  },
  canvasDragOver: {
    boxShadow: '0 0 32px rgba(212, 175, 55, 0.6)',
  },
  bleedLine: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    bottom: '20px',
    border: '3px dashed #cccccc',
    pointerEvents: 'none',
    zIndex: 1000,
    opacity: 0.6,
  },
  element: {
    position: 'absolute',
    transition: 'outline 0.2s ease, box-shadow 0.2s ease',
    borderRadius: '4px',
    overflow: 'visible',
  },
  elementImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
  },
};

export default Canvas;

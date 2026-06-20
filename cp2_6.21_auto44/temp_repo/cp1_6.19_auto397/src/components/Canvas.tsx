import React, { useRef } from 'react';
import type { CanvasComponent as ICanvasComponent, CanvasText } from '../utils/componentRenderer';
import { faceComponents, renderComponentSVG } from '../utils/componentRenderer';
import './Canvas.css';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  components: ICanvasComponent[];
  text: CanvasText | null;
  selectedComponentId: string | null;
  textMode: boolean;
  onSelectComponent: (id: string | null) => void;
  onSelectText: () => void;
  onMoveComponent: (id: string, x: number, y: number) => void;
  onMoveText: (x: number, y: number) => void;
  onCanvasClick: () => void;
}

const MemeCanvas: React.FC<CanvasProps> = ({
  canvasRef,
  components,
  text,
  selectedComponentId,
  textMode,
  onSelectComponent,
  onSelectText,
  onMoveComponent,
  onMoveText,
  onCanvasClick
}) => {
  const dragRef = useRef<{
    type: 'component' | 'text';
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'component' | 'text',
    id: string
  ) => {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    if (type === 'component') {
      onSelectComponent(id);
    } else {
      onSelectText();
    }

    dragRef.current = {
      type,
      id,
      offsetX: e.clientX - rect.left - rect.width / 2,
      offsetY: e.clientY - rect.top - rect.height / 2
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragRef.current || !canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newX = moveEvent.clientX - canvasRect.left - dragRef.current.offsetX;
      const newY = moveEvent.clientY - canvasRect.top - dragRef.current.offsetY;

      const clampedX = Math.max(30, Math.min(canvasRect.width - 30, newX));
      const clampedY = Math.max(30, Math.min(canvasRect.height - 30, newY));

      if (dragRef.current.type === 'component') {
        onMoveComponent(dragRef.current.id, clampedX, clampedY);
      } else {
        onMoveText(clampedX, clampedY);
      }
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleCanvasClick = () => {
    onCanvasClick();
  };

  const getComponentById = (type: string, id: string) => {
    return faceComponents.find((c) => c.type === type && c.id === id);
  };

  return (
    <div className="canvas-wrap">
      <div className="canvas-container">
        <div className="canvas-face-bg" />
        <div
          ref={canvasRef}
          className="meme-canvas"
          onClick={handleCanvasClick}
        >
          {components.map((comp) => {
            const def = getComponentById(comp.type, comp.componentId);
            if (!def) return null;

            const isSelected = selectedComponentId === comp.id;
            return (
              <div
                key={comp.id}
                className={`canvas-component ${isSelected ? 'selected' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${comp.x}px`,
                  top: `${comp.y}px`,
                  transform: `translate(-50%, -50%) scale(${comp.scale}) rotate(${comp.rotation}deg)`,
                  color: comp.color,
                  zIndex: comp.zIndex,
                  cursor: 'grab'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'component', comp.id)}
                dangerouslySetInnerHTML={{
                  __html: renderComponentSVG(def).replace(
                    'viewBox="0 0 100 100"',
                    'viewBox="0 0 100 100" width="100" height="100"'
                  )
                }}
              />
            );
          })}

          {text && text.content && (
            <div
              className={`canvas-text ${textMode ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                left: `${text.x}px`,
                top: `${text.y}px`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${text.fontSize}px`,
                color: text.color,
                fontWeight: 'bold',
                zIndex: 999,
                whiteSpace: 'nowrap',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                cursor: 'grab'
              }}
              onMouseDown={(e) => handleMouseDown(e, 'text', 'text')}
              onClick={(e) => {
                e.stopPropagation();
                onSelectText();
              }}
            >
              {text.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemeCanvas;

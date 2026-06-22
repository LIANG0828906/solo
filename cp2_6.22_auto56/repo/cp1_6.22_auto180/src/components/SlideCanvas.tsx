import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { SlideElement, Slide, Collaborator, AnimationConfig } from '../types';
import { useEditorStore } from '../store';
import { collaborationService } from '../services/CollaborationService';
import { animationEngine, getAnimationStyles, type AnimationStyles } from '../engine/AnimationEngine';

interface SlideCanvasProps {
  slide: Slide;
  collaborators: Collaborator[];
}

type HandleType =
  | 'move'
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotate';

interface DragState {
  isDragging: boolean;
  handleType: HandleType;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
  elementStartW: number;
  elementStartH: number;
  elementStartRot: number;
}

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const SlideCanvas: React.FC<SlideCanvasProps> = ({ slide, collaborators }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeAnimations, setActiveAnimations] = useState<Map<string, AnimationStyles>>(new Map());
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectedElement = slide.elements.find((e) => e.id === selectedElementId) || null;
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const previewingAnimations = useEditorStore((s) => s.previewingAnimations);
  const setPreviewingAnimation = useEditorStore((s) => s.setPreviewingAnimation);

  const collaboratorsOnElement = useCallback(
    (elementId: string) => {
      return collaborators.filter((c) => c.selectedElementId === elementId);
    },
    [collaborators]
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedElement(null);
      collaborationService.broadcastSelectElement(null);
      setEditingTextId(null);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, element: SlideElement, handleType: HandleType) => {
    e.stopPropagation();
    if (handleType === 'move' && editingTextId === element.id) return;

    if (selectedElementId !== element.id) {
      setSelectedElement(element.id);
      collaborationService.broadcastSelectElement(element.id);
    }

    if (handleType !== 'move' || element.type !== 'text' || editingTextId !== element.id) {
      setEditingTextId(null);
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    setDragState({
      isDragging: true,
      handleType,
      startX: (e.clientX - rect.left) * scaleX,
      startY: (e.clientY - rect.top) * scaleY,
      elementStartX: element.x,
      elementStartY: element.y,
      elementStartW: element.width,
      elementStartH: element.height,
      elementStartRot: element.rotation,
    });
  };

  useEffect(() => {
    if (!dragState?.isDragging || !selectedElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !dragState || !selectedElement) return;

      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;
      const dx = currentX - dragState.startX;
      const dy = currentY - dragState.startY;

      let updates: Partial<SlideElement> = {};

      switch (dragState.handleType) {
        case 'move':
          updates = {
            x: dragState.elementStartX + dx,
            y: dragState.elementStartY + dy,
          };
          break;
        case 'n':
          updates = {
            y: dragState.elementStartY + dy,
            height: Math.max(20, dragState.elementStartH - dy),
          };
          break;
        case 's':
          updates = {
            height: Math.max(20, dragState.elementStartH + dy),
          };
          break;
        case 'w':
          updates = {
            x: dragState.elementStartX + dx,
            width: Math.max(20, dragState.elementStartW - dx),
          };
          break;
        case 'e':
          updates = {
            width: Math.max(20, dragState.elementStartW + dx),
          };
          break;
        case 'nw':
          updates = {
            x: dragState.elementStartX + dx,
            y: dragState.elementStartY + dy,
            width: Math.max(20, dragState.elementStartW - dx),
            height: Math.max(20, dragState.elementStartH - dy),
          };
          break;
        case 'ne':
          updates = {
            y: dragState.elementStartY + dy,
            width: Math.max(20, dragState.elementStartW + dx),
            height: Math.max(20, dragState.elementStartH - dy),
          };
          break;
        case 'sw':
          updates = {
            x: dragState.elementStartX + dx,
            width: Math.max(20, dragState.elementStartW - dx),
            height: Math.max(20, dragState.elementStartH + dy),
          };
          break;
        case 'se':
          updates = {
            width: Math.max(20, dragState.elementStartW + dx),
            height: Math.max(20, dragState.elementStartH + dy),
          };
          break;
        case 'rotate': {
          const centerX = dragState.elementStartX + dragState.elementStartW / 2;
          const centerY = dragState.elementStartY + dragState.elementStartH / 2;
          const angle = Math.atan2(currentY - centerY, currentX - centerX) * (180 / Math.PI);
          updates = { rotation: angle };
          break;
        }
      }

      updateElement(slide.id, selectedElement.id, updates);
      collaborationService.broadcastUpdateElement(slide.id, selectedElement.id, updates);
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, selectedElement, slide.id, updateElement]);

  useEffect(() => {
    if (selectedElementId && previewingAnimations.has(selectedElementId) && selectedElement) {
      const entranceAnim = selectedElement.animations.find((a) => a.phase === 'entrance');
      if (entranceAnim) {
        animationEngine.playAnimation(
          selectedElement.id,
          entranceAnim,
          (styles) => {
            setActiveAnimations((prev) => {
              const next = new Map(prev);
              next.set(selectedElement.id, styles);
              return next;
            });
          },
          () => {
            setActiveAnimations((prev) => {
              const next = new Map(prev);
              next.delete(selectedElement.id);
              return next;
            });
            setPreviewingAnimation(selectedElement.id, false);
          }
        );
      }
    }
  }, [previewingAnimations, selectedElementId, selectedElement, setPreviewingAnimation]);

  const handleDoubleClick = (e: React.MouseEvent, element: SlideElement) => {
    e.stopPropagation();
    if (element.type === 'text') {
      setEditingTextId(element.id);
    }
  };

  const handleTextChange = (element: SlideElement, newContent: string) => {
    const updates = { content: newContent };
    updateElement(slide.id, element.id, updates);
    collaborationService.broadcastUpdateElement(slide.id, element.id, updates);
  };

  const renderElementContent = (element: SlideElement) => {
    const isEditing = editingTextId === element.id;
    const animStyles = activeAnimations.get(element.id);
    const combinedStyle: React.CSSProperties = { ...animStyles } as React.CSSProperties;

    switch (element.type) {
      case 'text':
        if (isEditing) {
          return (
            <textarea
              autoFocus
              defaultValue={element.content || ''}
              onBlur={(e) => handleTextChange(element, e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: '2px solid #3B82F6',
                background: 'white',
                padding: 4,
                resize: 'none',
                fontSize: 18,
                color: '#1F2937',
                ...combinedStyle,
              }}
            />
          );
        }
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              fontSize: 18,
              color: '#1F2937',
              padding: 4,
              overflow: 'hidden',
              ...combinedStyle,
            }}
          >
            {element.content || ''}
          </div>
        );
      case 'image':
        return (
          <img
            src={element.content}
            alt=""
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 4,
              ...combinedStyle,
            }}
          />
        );
      case 'shape':
        return renderShape(element, combinedStyle);
      default:
        return null;
    }
  };

  const renderShape = (element: SlideElement, style: React.CSSProperties): React.ReactNode => {
    const shapeStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      ...style,
    };

    switch (element.shapeType) {
      case 'rectangle':
        return (
          <div
            style={{
              ...shapeStyle,
              backgroundColor: '#3B82F6',
              borderRadius: 6,
            }}
          />
        );
      case 'circle':
        return (
          <div
            style={{
              ...shapeStyle,
              backgroundColor: '#22C55E',
              borderRadius: '50%',
            }}
          />
        );
      case 'triangle':
        return (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon points="50,5 95,95 5,95" fill="#EAB308" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderHandles = (element: SlideElement) => {
    if (selectedElementId !== element.id) return null;

    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: 10,
      height: 10,
      backgroundColor: '#FFFFFF',
      border: '2px solid #3B82F6',
      borderRadius: 2,
      zIndex: 10,
    };

    const positions: Record<string, React.CSSProperties> = {
      nw: { top: -6, left: -6, cursor: 'nw-resize' },
      n: { top: -6, left: '50%', marginLeft: -5, cursor: 'n-resize' },
      ne: { top: -6, right: -6, cursor: 'ne-resize' },
      e: { top: '50%', right: -6, marginTop: -5, cursor: 'e-resize' },
      se: { bottom: -6, right: -6, cursor: 'se-resize' },
      s: { bottom: -6, left: '50%', marginLeft: -5, cursor: 's-resize' },
      sw: { bottom: -6, left: -6, cursor: 'sw-resize' },
      w: { top: '50%', left: -6, marginTop: -5, cursor: 'w-resize' },
    };

    return (
      <>
        {Object.entries(positions).map(([key, pos]) => (
          <div
            key={key}
            style={{ ...handleStyle, ...pos }}
            onMouseDown={(e) => handleElementMouseDown(e, element, key as HandleType)}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            top: -26,
            left: '50%',
            marginLeft: -8,
            width: 16,
            height: 16,
            backgroundColor: '#3B82F6',
            borderRadius: '50%',
            cursor: 'grab',
            zIndex: 10,
          }}
          onMouseDown={(e) => handleElementMouseDown(e, element, 'rotate')}
        />
        <div
          style={{
            position: 'absolute',
            top: -18,
            left: '50%',
            marginLeft: -0.5,
            width: 1,
            height: 12,
            backgroundColor: '#3B82F6',
            zIndex: 9,
          }}
        />
      </>
    );
  };

  const renderCollaboratorDots = (element: SlideElement) => {
    const collabs = collaboratorsOnElement(element.id);
    if (collabs.length === 0) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: -10,
          right: -10,
          display: 'flex',
          gap: 2,
          zIndex: 20,
        }}
      >
        {collabs.map((c) => (
          <div
            key={c.id}
            title={c.name}
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: c.color,
              border: '2px solid white',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      style={{
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: '#F3F4F6',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        flexShrink: 0,
      }}
    >
      {slide.elements.map((element) => {
        const isSelected = selectedElementId === element.id;
        return (
          <div
            key={element.id}
            onMouseDown={(e) => handleElementMouseDown(e, element, 'move')}
            onDoubleClick={(e) => handleDoubleClick(e, element)}
            style={{
              position: 'absolute',
              left: element.x,
              top: element.y,
              width: element.width,
              height: element.height,
              transform: `rotate(${element.rotation}deg)`,
              transformOrigin: 'center center',
              cursor: 'move',
              border: isSelected ? '2px solid #3B82F6' : '1px solid transparent',
              boxSizing: 'border-box',
              userSelect: 'none',
            }}
          >
            {renderElementContent(element)}
            {renderHandles(element)}
            {renderCollaboratorDots(element)}
          </div>
        );
      })}
    </div>
  );
};

export default SlideCanvas;

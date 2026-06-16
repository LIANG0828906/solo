import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useExhibitionStore, Artifact as ArtifactType } from '../store/useExhibitionStore';

interface ArtifactCardProps {
  artifact: ArtifactType;
  isPreview?: boolean;
  onPreviewClick?: () => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, isPreview = false, onPreviewClick }) => {
  const {
    moveEntity,
    isBindingMode,
    createBinding,
    bindingCardId,
    isConnectingMode,
    setConnectingMode,
    connectingFromId,
    connectingFromType,
    createConnection,
    setContextMenu,
    setSelectedArtifact,
    selectedArtifactId,
    isPreviewMode,
    setIsDragging,
  } = useExhibitionStore();

  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setLocalDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPulse, setShowPulse] = useState(false);

  const isSelected = selectedArtifactId === artifact.id;

  useEffect(() => {
    if (artifact.color) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [artifact.color]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || isBindingMode || isConnectingMode) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setLocalDragging(true);
    setIsDragging(true);
    setSelectedArtifact(artifact.id);
  }, [artifact.id, isPreviewMode, isBindingMode, isConnectingMode, setSelectedArtifact, setIsDragging]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('.canvas-container');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const scrollTop = (canvas as HTMLElement).scrollTop;

      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top + scrollTop - dragOffset.y;

      moveEntity(artifact.id, 'artifact', Math.max(0, newX), Math.max(0, newY));

      const canvasEl = canvas as HTMLElement;
      const canvasHeight = canvasEl.clientHeight;
      const mouseY = e.clientY - canvasRect.top;
      const scrollSpeed = 10;

      if (mouseY < 50) {
        canvasEl.scrollTop = Math.max(0, canvasEl.scrollTop - scrollSpeed);
      } else if (mouseY > canvasHeight - 50) {
        canvasEl.scrollTop += scrollSpeed;
      }
    };

    const handleMouseUp = () => {
      setLocalDragging(false);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, artifact.id, moveEntity, setIsDragging]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isBindingMode && bindingCardId) {
      createBinding(bindingCardId, artifact.id);
      return;
    }

    if (isConnectingMode && connectingFromId && connectingFromType) {
      createConnection(connectingFromId, artifact.id, connectingFromType, 'artifact');
      return;
    }

    if (isPreviewMode && onPreviewClick) {
      onPreviewClick();
    }
  }, [isBindingMode, bindingCardId, isConnectingMode, connectingFromId, connectingFromType, createBinding, artifact.id, createConnection, isPreviewMode, onPreviewClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPreviewMode) return;
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      entityId: artifact.id,
      entityType: 'artifact',
    });
  }, [artifact.id, isPreviewMode, setContextMenu]);

  const cursorStyle = isBindingMode || isConnectingMode ? 'pointer' : isDragging ? 'grabbing' : 'grab';

  return (
    <div
      ref={cardRef}
      className="artifact-card"
      style={{
        position: 'absolute',
        left: artifact.x,
        top: artifact.y,
        width: artifact.width,
        height: artifact.height,
        cursor: isPreviewMode ? 'pointer' : cursorStyle,
        transition: isDragging ? 'none' : 'all 0.3s ease',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isDragging 
          ? '0 4px 16px rgba(0,0,0,0.2)' 
          : isSelected 
            ? '0 2px 8px rgba(196, 168, 130, 0.4)'
            : '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        border: `2px solid ${isSelected ? '#C4A882' : '#C4A882'}`,
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: isDragging ? 100 : isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <img
        src={artifact.imageUrl}
        alt={artifact.name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
        draggable={false}
      />
      
      {artifact.color && (
        <div
          className={showPulse ? 'pulse-animation' : ''}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: artifact.color,
            border: '2px solid #FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      )}
    </div>
  );
};

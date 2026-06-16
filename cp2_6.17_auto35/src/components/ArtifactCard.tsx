import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useExhibitionStore, Artifact as ArtifactType } from '../store/useExhibitionStore';

interface ArtifactCardProps {
  artifact: ArtifactType;
  isPreview?: boolean;
  onPreviewClick?: () => void;
}

const SPRING = 0.3;
const DAMPING = 0.8;
const EDGE_THRESHOLD = 50;
const MAX_SCROLL_SPEED = 25;

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
  const [springOffset, setSpringOffset] = useState({ x: 0, y: 0 });
  const [springScale, setSpringScale] = useState(1);

  const springOffsetRef = useRef({ x: 0, y: 0 });
  const springScaleRef = useRef(1);
  const springOffsetVelRef = useRef({ x: 0, y: 0 });
  const springScaleVelRef = useRef(0);
  const springAnimationRef = useRef<number | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  const isSelected = selectedArtifactId === artifact.id;

  useEffect(() => {
    if (artifact.color) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [artifact.color]);

  const stopSpringAnimation = useCallback(() => {
    if (springAnimationRef.current !== null) {
      cancelAnimationFrame(springAnimationRef.current);
      springAnimationRef.current = null;
    }
  }, []);

  const startSpringAnimation = useCallback(() => {
    stopSpringAnimation();

    const animate = () => {
      let offsetX = springOffsetRef.current.x;
      let offsetY = springOffsetRef.current.y;
      let velX = springOffsetVelRef.current.x;
      let velY = springOffsetVelRef.current.y;
      let scale = springScaleRef.current;
      let scaleVel = springScaleVelRef.current;

      const ax = -SPRING * offsetX - DAMPING * velX;
      const ay = -SPRING * offsetY - DAMPING * velY;
      velX += ax;
      velY += ay;
      offsetX += velX;
      offsetY += velY;

      const scaleAccel = -SPRING * (scale - 1) - DAMPING * scaleVel;
      scaleVel += scaleAccel;
      scale += scaleVel;

      springOffsetRef.current = { x: offsetX, y: offsetY };
      springScaleRef.current = scale;
      springOffsetVelRef.current = { x: velX, y: velY };
      springScaleVelRef.current = scaleVel;

      setSpringOffset({ x: offsetX, y: offsetY });
      setSpringScale(scale);

      const offsetSettled = Math.abs(offsetX) < 0.5 && Math.abs(offsetY) < 0.5 && Math.abs(velX) < 0.5 && Math.abs(velY) < 0.5;
      const scaleSettled = Math.abs(scale - 1) < 0.005 && Math.abs(scaleVel) < 0.01;

      if (!offsetSettled || !scaleSettled) {
        springAnimationRef.current = requestAnimationFrame(animate);
      } else {
        springOffsetRef.current = { x: 0, y: 0 };
        springScaleRef.current = 1;
        springOffsetVelRef.current = { x: 0, y: 0 };
        springScaleVelRef.current = 0;
        setSpringOffset({ x: 0, y: 0 });
        setSpringScale(1);
        springAnimationRef.current = null;
      }
    };

    springAnimationRef.current = requestAnimationFrame(animate);
  }, [stopSpringAnimation]);

  const stopScrollAnimation = useCallback(() => {
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
  }, []);

  const startScrollAnimation = useCallback(() => {
    if (scrollAnimationRef.current !== null) return;

    const animate = () => {
      const canvas = document.querySelector('.canvas-container') as HTMLElement | null;
      if (!canvas) {
        scrollAnimationRef.current = null;
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const mouseX = mousePosRef.current.x - canvasRect.left;
      const mouseY = mousePosRef.current.y - canvasRect.top;
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;

      let scrollDeltaX = 0;
      let scrollDeltaY = 0;

      if (mouseY < EDGE_THRESHOLD) {
        const distance = EDGE_THRESHOLD - mouseY;
        scrollDeltaY = -(distance / EDGE_THRESHOLD) * MAX_SCROLL_SPEED;
      } else if (mouseY > canvasHeight - EDGE_THRESHOLD) {
        const distance = mouseY - (canvasHeight - EDGE_THRESHOLD);
        scrollDeltaY = (distance / EDGE_THRESHOLD) * MAX_SCROLL_SPEED;
      }

      if (mouseX < EDGE_THRESHOLD) {
        const distance = EDGE_THRESHOLD - mouseX;
        scrollDeltaX = -(distance / EDGE_THRESHOLD) * MAX_SCROLL_SPEED;
      } else if (mouseX > canvasWidth - EDGE_THRESHOLD) {
        const distance = mouseX - (canvasWidth - EDGE_THRESHOLD);
        scrollDeltaX = (distance / EDGE_THRESHOLD) * MAX_SCROLL_SPEED;
      }

      if (scrollDeltaX !== 0 || scrollDeltaY !== 0) {
        canvas.scrollLeft = Math.max(0, canvas.scrollLeft + scrollDeltaX);
        canvas.scrollTop = Math.max(0, canvas.scrollTop + scrollDeltaY);

        if (isDraggingRef.current) {
          const canvasRect2 = canvas.getBoundingClientRect();
          const scrollLeft = canvas.scrollLeft;
          const scrollTop = canvas.scrollTop;

          const newX = mousePosRef.current.x - canvasRect2.left + scrollLeft - dragOffset.x;
          const newY = mousePosRef.current.y - canvasRect2.top + scrollTop - dragOffset.y;

          const clampedX = Math.max(0, newX);
          const clampedY = Math.max(0, newY);
          const extraX = newX < 0 ? newX : 0;
          const extraY = newY < 0 ? newY : 0;

          springOffsetRef.current = { x: extraX, y: extraY };
          setSpringOffset({ x: extraX, y: extraY });
          moveEntity(artifact.id, 'artifact', clampedX, clampedY);
        }

        scrollAnimationRef.current = requestAnimationFrame(animate);
      } else {
        scrollAnimationRef.current = null;
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(animate);
  }, [artifact.id, dragOffset, moveEntity]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || isBindingMode || isConnectingMode) return;
    e.preventDefault();
    e.stopPropagation();

    stopSpringAnimation();
    springOffsetRef.current = { x: 0, y: 0 };
    springScaleRef.current = 1.05;
    springOffsetVelRef.current = { x: 0, y: 0 };
    springScaleVelRef.current = 0;
    setSpringOffset({ x: 0, y: 0 });
    setSpringScale(1.05);

    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setLocalDragging(true);
    isDraggingRef.current = true;
    setIsDragging(true);
    setSelectedArtifact(artifact.id);

    mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [artifact.id, isPreviewMode, isBindingMode, isConnectingMode, setSelectedArtifact, setIsDragging, stopSpringAnimation]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      const canvas = document.querySelector('.canvas-container');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const scrollLeft = (canvas as HTMLElement).scrollLeft;
      const scrollTop = (canvas as HTMLElement).scrollTop;

      const newX = e.clientX - canvasRect.left + scrollLeft - dragOffset.x;
      const newY = e.clientY - canvasRect.top + scrollTop - dragOffset.y;

      const clampedX = Math.max(0, newX);
      const clampedY = Math.max(0, newY);
      const extraX = newX < 0 ? newX : 0;
      const extraY = newY < 0 ? newY : 0;

      springOffsetRef.current = { x: extraX, y: extraY };
      setSpringOffset({ x: extraX, y: extraY });
      moveEntity(artifact.id, 'artifact', clampedX, clampedY);

      const canvasEl = canvas as HTMLElement;
      const canvasWidth = canvasEl.clientWidth;
      const canvasHeight = canvasEl.clientHeight;
      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;

      const nearLeftEdge = mouseX < EDGE_THRESHOLD;
      const nearRightEdge = mouseX > canvasWidth - EDGE_THRESHOLD;
      const nearTopEdge = mouseY < EDGE_THRESHOLD;
      const nearBottomEdge = mouseY > canvasHeight - EDGE_THRESHOLD;

      if (nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge) {
        startScrollAnimation();
      } else {
        stopScrollAnimation();
      }
    };

    const handleMouseUp = () => {
      setLocalDragging(false);
      isDraggingRef.current = false;
      setIsDragging(false);
      stopScrollAnimation();
      startSpringAnimation();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      stopScrollAnimation();
    };
  }, [isDragging, dragOffset, artifact.id, moveEntity, setIsDragging, startScrollAnimation, stopScrollAnimation, startSpringAnimation]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPreviewMode) {
      if (onPreviewClick) {
        onPreviewClick();
      } else {
        setSelectedArtifact(artifact.id);
      }
      return;
    }
    
    if (isBindingMode && bindingCardId) {
      createBinding(bindingCardId, artifact.id);
      return;
    }

    if (isConnectingMode && connectingFromId && connectingFromType) {
      createConnection(connectingFromId, artifact.id, connectingFromType, 'artifact');
      return;
    }
  }, [isPreviewMode, onPreviewClick, setSelectedArtifact, artifact.id, isBindingMode, bindingCardId, isConnectingMode, connectingFromId, connectingFromType, createBinding, createConnection]);

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

  useEffect(() => {
    return () => {
      if (springAnimationRef.current !== null) {
        cancelAnimationFrame(springAnimationRef.current);
      }
      if (scrollAnimationRef.current !== null) {
        cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  const cursorStyle = isBindingMode || isConnectingMode ? 'pointer' : isDragging ? 'grabbing' : 'grab';

  const transformValue = `translate(${artifact.x + springOffset.x}px, ${artifact.y + springOffset.y}px) scale(${springScale})`;

  return (
    <div
      ref={cardRef}
      className="artifact-card"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: artifact.width,
        height: artifact.height,
        cursor: isPreviewMode ? 'pointer' : cursorStyle,
        transform: transformValue,
        transformOrigin: 'center center',
        boxShadow: isDragging || springScale !== 1
          ? '0 4px 16px rgba(0,0,0,0.2)' 
          : isSelected 
            ? '0 2px 8px rgba(196, 168, 130, 0.4)'
            : '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: '4px',
        border: `2px solid ${isSelected ? '#C4A882' : '#C4A882'}`,
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: isDragging ? 100 : isSelected ? 10 : 1,
        willChange: 'transform',
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

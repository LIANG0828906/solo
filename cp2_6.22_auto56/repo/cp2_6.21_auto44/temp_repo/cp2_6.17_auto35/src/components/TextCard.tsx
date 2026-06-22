import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'lucide-react';
import { useExhibitionStore, TextCard as TextCardType } from '../store/useExhibitionStore';

interface TextCardProps {
  card: TextCardType;
  isPreview?: boolean;
}

const SPRING = 0.3;
const DAMPING = 0.8;
const EDGE_THRESHOLD = 50;
const MAX_SCROLL_SPEED = 25;

export const TextCard: React.FC<TextCardProps> = ({ card, isPreview = false }) => {
  const {
    moveEntity,
    updateCardContent,
    setBindingMode,
    isBindingMode,
    bindingCardId,
    isConnectingMode,
    connectingFromId,
    connectingFromType,
    createConnection,
    setContextMenu,
    setSelectedCard,
    selectedCardId,
    isPreviewMode,
    setIsDragging,
  } = useExhibitionStore();

  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const [isDragging, setLocalDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHighlighted, setIsHighlighted] = useState(false);
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

  const isSelected = selectedCardId === card.id;
  const isBindingThisCard = isBindingMode && bindingCardId === card.id;

  useEffect(() => {
    if (card.color) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [card.color]);

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
          moveEntity(card.id, 'card', clampedX, clampedY);
        }

        scrollAnimationRef.current = requestAnimationFrame(animate);
      } else {
        scrollAnimationRef.current = null;
      }
    };

    scrollAnimationRef.current = requestAnimationFrame(animate);
  }, [card.id, dragOffset, moveEntity]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || isBindingMode || isConnectingMode) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('.bind-button')) return;
    if (target.closest('[contenteditable="true"]')) return;
    
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
    setSelectedCard(card.id);

    mousePosRef.current = { x: e.clientX, y: e.clientY };
  }, [card.id, isPreviewMode, isBindingMode, isConnectingMode, setSelectedCard, setIsDragging, stopSpringAnimation]);

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
      moveEntity(card.id, 'card', clampedX, clampedY);

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
  }, [isDragging, dragOffset, card.id, moveEntity, setIsDragging, startScrollAnimation, stopScrollAnimation, startSpringAnimation]);

  const handleBindClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBindingThisCard) {
      setBindingMode(false);
    } else {
      setBindingMode(true, card.id);
    }
  }, [card.id, isBindingThisCard, setBindingMode]);

  const handleTitleBlur = useCallback(() => {
    if (titleRef.current) {
      const text = titleRef.current.innerText || '请输入标题';
      updateCardContent(card.id, text.slice(0, 20), undefined);
    }
  }, [card.id, updateCardContent]);

  const handleDescBlur = useCallback(() => {
    if (descRef.current) {
      const text = descRef.current.innerText || '请输入描述文字';
      updateCardContent(card.id, undefined, text.slice(0, 200));
    }
  }, [card.id, updateCardContent]);

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isConnectingMode && connectingFromId && connectingFromType) {
      createConnection(connectingFromId, card.id, connectingFromType, 'card');
      return;
    }

    if (isPreviewMode) {
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 1000);
    }
  }, [isConnectingMode, connectingFromId, connectingFromType, createConnection, card.id, isPreviewMode]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPreviewMode) return;
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      entityId: card.id,
      entityType: 'card',
    });
  }, [card.id, isPreviewMode, setContextMenu]);

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
  const borderColor = isHighlighted ? '#8E44AD' : '#D1C7B8';
  const borderWidth = isHighlighted ? '2px' : '1px';

  const transformValue = `translate(${card.x + springOffset.x}px, ${card.y + springOffset.y}px) scale(${springScale})`;

  return (
    <div
      ref={cardRef}
      className="text-card"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: card.width,
        cursor: isPreviewMode ? 'pointer' : cursorStyle,
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: `${borderWidth} solid ${borderColor}`,
        padding: '16px',
        transform: transformValue,
        transformOrigin: 'center center',
        boxShadow: isDragging || springScale !== 1
          ? '0 4px 16px rgba(0,0,0,0.2)' 
          : isSelected 
            ? '0 2px 12px rgba(196, 168, 130, 0.3)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        userSelect: 'none',
        zIndex: isDragging ? 100 : isSelected ? 10 : 1,
        willChange: 'transform',
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {card.color && (
        <div
          className={showPulse ? 'pulse-animation' : ''}
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: card.color,
            border: '2px solid #FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      )}

      {!isPreviewMode && (
        <button
          className="bind-button"
          onClick={handleBindClick}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: isBindingThisCard ? '#2C3E50' : '#C4A882',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            transition: 'background-color 0.2s ease',
          }}
          title="绑定文物"
        >
          <Link size={14} color="#FFFFFF" />
        </button>
      )}

      <div
        ref={titleRef}
        contentEditable={!isPreviewMode}
        suppressContentEditableWarning
        onBlur={handleTitleBlur}
        onKeyDown={handleTitleKeyDown}
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#2C3E50',
          marginBottom: '8px',
          paddingLeft: card.color ? '20px' : '0',
          paddingRight: '32px',
          minHeight: '24px',
          outline: 'none',
          wordBreak: 'break-all',
        }}
      >
        {card.title}
      </div>

      <div
        ref={descRef}
        contentEditable={!isPreviewMode}
        suppressContentEditableWarning
        onBlur={handleDescBlur}
        style={{
          fontSize: '13px',
          color: '#5D6D7E',
          lineHeight: 1.6,
          outline: 'none',
          wordBreak: 'break-word',
          minHeight: '40px',
        }}
      >
        {card.description}
      </div>
    </div>
  );
};

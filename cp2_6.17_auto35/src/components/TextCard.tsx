import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'lucide-react';
import { useExhibitionStore, TextCard as TextCardType } from '../store/useExhibitionStore';

interface TextCardProps {
  card: TextCardType;
  isPreview?: boolean;
}

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

  const isSelected = selectedCardId === card.id;
  const isBindingThisCard = isBindingMode && bindingCardId === card.id;

  useEffect(() => {
    if (card.color) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 500);
      return () => clearTimeout(timer);
    }
  }, [card.color]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isPreviewMode || isBindingMode || isConnectingMode) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('.bind-button')) return;
    if (target.closest('[contenteditable="true"]')) return;
    
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
    setSelectedCard(card.id);
  }, [card.id, isPreviewMode, isBindingMode, isConnectingMode, setSelectedCard, setIsDragging]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('.canvas-container');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const scrollTop = (canvas as HTMLElement).scrollTop;

      const newX = e.clientX - canvasRect.left - dragOffset.x;
      const newY = e.clientY - canvasRect.top + scrollTop - dragOffset.y;

      moveEntity(card.id, 'card', Math.max(0, newX), Math.max(0, newY));

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
  }, [isDragging, dragOffset, card.id, moveEntity, setIsDragging]);

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

  const cursorStyle = isBindingMode || isConnectingMode ? 'pointer' : isDragging ? 'grabbing' : 'grab';
  const borderColor = isHighlighted ? '#8E44AD' : '#D1C7B8';
  const borderWidth = isHighlighted ? '2px' : '1px';

  return (
    <div
      ref={cardRef}
      className="text-card"
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: card.width,
        cursor: isPreviewMode ? 'pointer' : cursorStyle,
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        border: `${borderWidth} solid ${borderColor}`,
        padding: '16px',
        boxShadow: isDragging 
          ? '0 4px 16px rgba(0,0,0,0.15)' 
          : isSelected 
            ? '0 2px 12px rgba(196, 168, 130, 0.3)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        transition: isDragging ? 'none' : 'all 0.3s ease',
        userSelect: 'none',
        zIndex: isDragging ? 100 : isSelected ? 10 : 1,
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

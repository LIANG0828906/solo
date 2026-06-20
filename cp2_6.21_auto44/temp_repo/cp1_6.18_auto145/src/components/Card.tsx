import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Card as CardType, TAG_COLORS } from '../stores/cardStore';

interface CardProps {
  card: CardType;
  isHighlighted: boolean;
  isDimmed: boolean;
  onRemove: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onAnimationEnd: (id: string) => void;
}

export default function Card({ card, isHighlighted, isDimmed, onRemove, onDragEnd, onAnimationEnd }: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: card.x, y: card.y });
  
  const tagColors = TAG_COLORS[card.tag];
  
  useEffect(() => {
    if (!isDragging) {
      setCurrentPos({ x: card.x, y: card.y });
    }
  }, [card.x, card.y, isDragging]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.card-delete-btn')) return;
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
    setIsDragging(true);
  }, []);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (clientX: number, clientY: number) => {
      const canvas = cardRef.current?.parentElement;
      if (!canvas) return;
      
      const canvasRect = canvas.getBoundingClientRect();
      const newX = clientX - canvasRect.left - dragOffset.x;
      const newY = clientY - canvasRect.top - dragOffset.y;
      
      setCurrentPos({ x: newX, y: newY });
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    
    const handleEnd = () => {
      setIsDragging(false);
      onDragEnd(card.id, currentPos.x, currentPos.y);
    };
    
    const handleMouseUp = () => {
      handleEnd();
    };
    
    const handleTouchEnd = () => {
      handleEnd();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, card.id, currentPos.x, currentPos.y, onDragEnd]);
  
  const handleAnimationEnd = () => {
    if (card.isNew) {
      onAnimationEnd(card.id);
    }
  };
  
  const cardClasses = [
    'card',
    card.isNew ? 'card-pop-in' : '',
    isHighlighted ? 'card-highlight' : '',
    isDimmed ? 'card-dimmed' : '',
    isDragging ? 'card-dragging' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <div
      ref={cardRef}
      className={cardClasses}
      style={{
        position: 'absolute',
        left: currentPos.x,
        top: currentPos.y,
        width: '220px',
        minHeight: '120px',
        backgroundColor: tagColors.bg,
        borderRadius: '6px',
        boxShadow: isHovered && !isDragging ? 'var(--card-shadow-hover)' : 'var(--card-shadow)',
        padding: '16px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease-out, transform 0.15s ease-out, opacity 0.2s ease-out',
        transform: isHovered && !isDragging ? 'translateY(-2px)' : 'translateY(0)',
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 1000 : 1,
        willChange: isDragging ? 'transform' : 'auto',
        border: isHighlighted ? '2px solid #6C63FF' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onAnimationEnd={handleAnimationEnd}
      onMouseEnter={() => {
        if (!isDragging && !isDimmed) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isDragging) {
          setIsHovered(false);
        }
      }}
    >
      <div
        className="card-tag"
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: tagColors.text,
          marginBottom: '8px',
          textTransform: 'none',
        }}
      >
        {card.tag}
      </div>
      
      <div
        className="card-content"
        style={{
          fontSize: '14px',
          lineHeight: 1.6,
          color: 'var(--color-text-secondary)',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {card.content}
      </div>
      
      <button
        className="card-delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(card.id);
        }}
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isHovered ? 'var(--color-danger)' : '#999',
          transition: 'color 0.15s ease-out, background-color 0.15s ease-out, opacity 0.2s ease-out',
          cursor: 'pointer',
          opacity: isHovered ? 1 : 0,
          background: 'transparent',
          border: 'none',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 82, 82, 0.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

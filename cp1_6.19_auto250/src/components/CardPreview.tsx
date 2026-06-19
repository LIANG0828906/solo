import React, { useCallback, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CARD_TEMPLATES } from '../types/card';
import { 
  useCardType, 
  useStyleParams, 
  useLayoutOffsets, 
  useInteractionState, 
  useCardActions 
} from '../store/useCardStore';
import type { LayoutOffsets } from '../types/card';

type CornerHandlePosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

const CardPreview: React.FC = React.memo(() => {
  const cardType = useCardType();
  const styleParams = useStyleParams();
  const layoutOffsets = useLayoutOffsets();
  const interactionState = useInteractionState();
  const { setHovered, toggleFlip, setEditMode, setLayoutOffset } = useCardActions();

  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draggingCorner, setDraggingCorner] = useState<CornerHandlePosition | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; offsets: LayoutOffsets } | null>(null);

  const template = CARD_TEMPLATES[cardType];
  const { isHovered, isFlipped, isEditMode } = interactionState;

  const shadowOffset = isHovered ? styleParams.shadowIntensity : Math.max(styleParams.shadowIntensity / 2, 2);
  const shadowOpacity = isHovered ? 0.25 : 0.15;
  const shadowBlur = styleParams.shadowIntensity * 2;
  const shadowSpread = styleParams.shadowIntensity / 2;

  const boxShadow = `${shadowOffset}px ${shadowOffset}px ${shadowBlur}px ${shadowSpread}px rgba(0,0,0,${shadowOpacity})`;
  const insetShadow = 'inset 0 0 8px rgba(0,0,0,0.03)';

  const handleMouseEnter = useCallback(() => {
    if (!isEditMode) {
      setHovered(true);
    }
  }, [isEditMode, setHovered]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, [setHovered]);

  const handleClick = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isEditMode) {
      toggleFlip();
    }
  }, [isEditMode, toggleFlip]);

  const handleMouseDown = useCallback(() => {
    if (isEditMode) return;
    
    longPressTimerRef.current = setTimeout(() => {
      setEditMode(true);
    }, 1200);
  }, [isEditMode, setEditMode]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleCornerMouseDown = useCallback((corner: CornerHandlePosition, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingCorner(corner);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsets: { ...layoutOffsets }
    };
  }, [layoutOffsets]);

  useEffect(() => {
    if (!draggingCorner) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const { offsets } = dragStartRef.current;

      let newOffsets: LayoutOffsets = { ...offsets };

      switch (draggingCorner) {
        case 'topLeft':
          newOffsets.top = Math.max(0, Math.min(20, offsets.top - deltaY));
          newOffsets.left = Math.max(0, Math.min(20, offsets.left - deltaX));
          break;
        case 'topRight':
          newOffsets.top = Math.max(0, Math.min(20, offsets.top - deltaY));
          newOffsets.right = Math.max(0, Math.min(20, offsets.right + deltaX));
          break;
        case 'bottomLeft':
          newOffsets.bottom = Math.max(0, Math.min(20, offsets.bottom + deltaY));
          newOffsets.left = Math.max(0, Math.min(20, offsets.left - deltaX));
          break;
        case 'bottomRight':
          newOffsets.bottom = Math.max(0, Math.min(20, offsets.bottom + deltaY));
          newOffsets.right = Math.max(0, Math.min(20, offsets.right + deltaX));
          break;
      }

      setLayoutOffset('top', newOffsets.top);
      setLayoutOffset('right', newOffsets.right);
      setLayoutOffset('bottom', newOffsets.bottom);
      setLayoutOffset('left', newOffsets.left);
    };

    const handleMouseUp = () => {
      setDraggingCorner(null);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingCorner, setLayoutOffset]);

  const shakeAnimation = isEditMode ? {
    x: [0, 3, -3, 3, -3, 0],
    transition: {
      duration: 0.1,
      repeat: Infinity,
      ease: "linear"
    }
  } : {};

  const cornerPositions: Record<CornerHandlePosition, React.CSSProperties> = {
    topLeft: { top: -4, left: -4 },
    topRight: { top: -4, right: -4 },
    bottomLeft: { bottom: -4, left: -4 },
    bottomRight: { bottom: -4, right: -4 },
  };

  return (
    <div className="card-preview-container">
      <div className="card-wrapper" style={{ perspective: '1000px' }}>
        <motion.div
          ref={cardRef}
          className="card-3d"
          style={{
            width: '100%',
            transformStyle: 'preserve-3d',
          }}
          animate={{
            rotateY: isFlipped ? 180 : 0,
            scale: isFlipped ? 0.85 : 1,
            ...shakeAnimation,
          }}
          transition={{
            rotateY: { duration: 0.8, ease: "easeInOut" },
            scale: { duration: 0.3 },
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseUpCapture={handleMouseUp}
          onClick={handleClick}
        >
          <motion.div
            className="card-face card-front"
            layoutId={`card-${cardType}`}
            style={{
              backgroundColor: template.bgColor,
              borderRadius: styleParams.borderRadius,
              boxShadow: `${boxShadow}, ${insetShadow}`,
              paddingTop: 16 + layoutOffsets.top,
              paddingRight: 20 + layoutOffsets.right,
              paddingBottom: 20 + layoutOffsets.bottom,
              paddingLeft: 20 + layoutOffsets.left,
              backfaceVisibility: 'hidden',
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
            animate={{
              y: isHovered && !isEditMode ? -8 : 0,
            }}
            transition={{
              y: { duration: 0.3 },
              borderRadius: { duration: 0.2 },
              boxShadow: { duration: 0.2 },
              backgroundColor: { duration: 0.6, type: "spring", stiffness: 300, damping: 30 },
            }}
          >
            <div className="card-content">
              <div className="card-image-wrapper">
                <img 
                  src={template.imageUrl} 
                  alt={template.title}
                  className="card-image"
                  loading="lazy"
                />
              </div>
              <h3 className="card-title" style={{ color: template.primaryColor }}>
                {template.title}
              </h3>
              <p className="card-description">{template.description}</p>
              <button 
                className="card-button"
                style={{ backgroundColor: template.primaryColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFlip();
                }}
              >
                {template.buttonText}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="card-face card-back"
            style={{
              backgroundColor: template.bgColor,
              borderRadius: styleParams.borderRadius,
              boxShadow: `${boxShadow}, ${insetShadow}`,
              padding: 24,
              backfaceVisibility: 'hidden',
              position: 'absolute',
              width: '100%',
              height: '100%',
              transform: 'rotateY(180deg)',
            }}
            animate={{
              y: isHovered && !isEditMode ? -8 : 0,
            }}
            transition={{
              y: { duration: 0.3 },
              borderRadius: { duration: 0.2 },
              boxShadow: { duration: 0.2 },
              backgroundColor: { duration: 0.6, type: "spring", stiffness: 300, damping: 30 },
            }}
          >
            <div className="card-back-content">
              <h4 className="card-back-title" style={{ color: template.primaryColor }}>
                详细信息
              </h4>
              <p className="card-back-description">{template.backDescription}</p>
              <button 
                className="card-button card-button-back"
                style={{ backgroundColor: template.primaryColor }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFlip();
                }}
              >
                返回
              </button>
            </div>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {isEditMode && (
            <>
              {(Object.keys(cornerPositions) as CornerHandlePosition[]).map((corner) => (
                <motion.div
                  key={corner}
                  className={`corner-handle ${draggingCorner === corner ? 'dragging' : ''}`}
                  style={cornerPositions[corner]}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onMouseDown={(e) => handleCornerMouseDown(corner, e)}
                />
              ))}
              <motion.div
                className="edit-mode-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                编辑模式 - 拖拽角点调整布局，点击空白处退出
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {isEditMode && (
        <div 
          className="edit-mode-overlay"
          onClick={() => setEditMode(false)}
        />
      )}
    </div>
  );
});

CardPreview.displayName = 'CardPreview';

export default CardPreview;

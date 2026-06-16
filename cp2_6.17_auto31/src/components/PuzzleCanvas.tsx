import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePuzzleStore, Piece, isPieceAligned } from '../store/puzzleStore';

interface DraggingState {
  pieceId: string;
  offsetX: number;
  offsetY: number;
  rotation: number;
}

const PuzzleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    pieces,
    gridSize,
    isCompleted,
    isShuffling,
    updatePiecePosition,
    bringToFront,
    lockPiece,
    highlightPiece,
    clearHighlight,
  } = usePuzzleStore();

  const [dragging, setDragging] = useState<DraggingState | null>(null);
  const [canvasSize, setCanvasSize] = useState(600);
  const [isMobile, setIsMobile] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [mergeAnim, setMergeAnim] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updateSize = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      const size = isMobile ? vmin * 0.95 : vmin * 0.8;
      setCanvasSize(size);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [isMobile]);

  useEffect(() => {
    if (isCompleted) {
      setShowComplete(true);
      setTimeout(() => setMergeAnim(true), 100);
    } else {
      setShowComplete(false);
      setMergeAnim(false);
    }
  }, [isCompleted]);

  const getPieceDataUrl = useCallback((imgData: ImageData): string => {
    const canvas = document.createElement('canvas');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, piece: Piece) => {
      if (piece.locked) return;
      e.preventDefault();

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const scaleX = canvasSize / canvasRect.width;
      const scaleY = canvasSize / canvasRect.height;

      const offsetX = (clientX - canvasRect.left) * scaleX - piece.curX;
      const offsetY = (clientY - canvasRect.top) * scaleY - piece.curY;

      const rotation = (Math.random() - 0.5) * 10;

      bringToFront(piece.id);
      setDragging({
        pieceId: piece.id,
        offsetX,
        offsetY,
        rotation,
      });
    },
    [canvasSize, bringToFront]
  );

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const scaleX = canvasSize / canvasRect.width;
      const scaleY = canvasSize / canvasRect.height;

      let newX = (clientX - canvasRect.left) * scaleX - dragging.offsetX;
      let newY = (clientY - canvasRect.top) * scaleY - dragging.offsetY;

      const piece = pieces.find((p) => p.id === dragging.pieceId);
      if (piece) {
        newX = Math.max(0, Math.min(canvasSize - piece.width, newX));
        newY = Math.max(0, Math.min(canvasSize - piece.height, newY));
      }

      updatePiecePosition(dragging.pieceId, newX, newY);
    },
    [dragging, canvasSize, pieces, updatePiecePosition]
  );

  const handleEnd = useCallback(() => {
    if (!dragging) return;

    const piece = pieces.find((p) => p.id === dragging.pieceId);
    if (piece && !piece.locked) {
      if (isPieceAligned(piece)) {
        highlightPiece(piece.id);
        setTimeout(() => {
          lockPiece(piece.id);
          clearHighlight(piece.id);
        }, 200);
      }
    }

    setDragging(null);
  }, [dragging, pieces, highlightPiece, lockPiece, clearHighlight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleMouseUp = () => handleEnd();
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e);
    };
    const handleTouchEnd = () => handleEnd();

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragging, handleMove, handleEnd]);

  const pieceWidth = pieces.length > 0 ? pieces[0].width : canvasSize / gridSize;
  const gridBgSize = pieceWidth > 0 ? pieceWidth : canvasSize / gridSize;

  const canvasStyle: React.CSSProperties = {
    position: 'relative',
    width: `${canvasSize}px`,
    height: `${canvasSize}px`,
    border: isCompleted
      ? '3px solid #FFD700'
      : '1px solid #E0E0E0',
    background: pieces.length > 0
      ? `repeating-linear-gradient(0deg, #EEE 0px, #EEE 1px, transparent 1px, transparent ${gridBgSize}px), repeating-linear-gradient(90deg, #EEE 0px, #EEE 1px, transparent 1px, transparent ${gridBgSize}px)`
      : 'transparent',
    boxShadow: isCompleted
      ? '0 0 30px #FFD700, 0 0 60px rgba(255, 215, 0, 0.5)'
      : 'none',
    transition: isCompleted ? 'box-shadow 0.8s ease-in-out, border-color 0.8s ease-in-out' : 'none',
    animation: isCompleted ? 'pulse-glow 0.8s ease-in-out infinite alternate' : 'none',
    userSelect: 'none',
    overflow: 'hidden',
  };

  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          fontSize: '12px',
          color: '#888',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          zIndex: 100,
        }}
      >
        {gridSize} × {gridSize}
      </div>

      <div ref={canvasRef} style={canvasStyle}>
        {pieces.map((piece) => {
          const isDragging = dragging?.pieceId === piece.id;
          const imgUrl = getPieceDataUrl(piece.imgData);
          const style: React.CSSProperties = {
            position: 'absolute',
            left: `${piece.curX}px`,
            top: `${piece.curY}px`,
            width: `${piece.width}px`,
            height: `${piece.height}px`,
            zIndex: isDragging ? 9999 : piece.zIndex,
            cursor: piece.locked ? 'default' : 'grab',
            border: mergeAnim && isCompleted
              ? 'none'
              : isDragging
              ? '2px solid #555'
              : '1px solid #888',
            backgroundImage: `url(${imgUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: piece.highlighted
              ? '#90EE90'
              : piece.locked
              ? '#F0F8FF'
              : 'transparent',
            boxShadow: isDragging
              ? '2px 2px 8px rgba(85, 85, 85, 0.4)'
              : 'none',
            transform: isDragging
              ? `scale(1.1) rotate(${dragging?.rotation}deg)`
              : mergeAnim && isCompleted
              ? 'scale(1)'
              : 'scale(1) rotate(0deg)',
            transformOrigin: 'center center',
            transition: isDragging
              ? 'transform 0s'
              : isShuffling
              ? 'left 0.5s ease-out, top 0.5s ease-out'
              : 'transform 0.15s ease-out, border-color 0.2s, box-shadow 0.2s, background-color 0.3s, border 0.6s ease-in-out',
            opacity: piece.highlighted ? 0.9 : 1,
          };

          return (
            <div key={piece.id}>
              {isDragging && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${piece.correctX}px`,
                    top: `${piece.correctY}px`,
                    width: `${piece.width}px`,
                    height: `${piece.height}px`,
                    border: '1px dashed #888',
                    opacity: 0.4,
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />
              )}
              <div
                style={style}
                onMouseDown={(e) => handleMouseDown(e, piece)}
                onTouchStart={(e) => handleMouseDown(e, piece)}
              />
            </div>
          );
        })}

        {pieces.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#999',
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontSize: '16px',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            请上传图片开始拼图
          </div>
        )}

        {showComplete && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '24px',
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              color: '#333',
              fontWeight: 600,
              textShadow: '0 0 10px #FFD700',
              opacity: 0,
              animation: 'fadeIn 0.8s ease-in-out forwards',
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          >
            拼图完成！
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          @keyframes pulse-glow {
            from { box-shadow: 0 0 20px #FFD700, 0 0 40px rgba(255, 215, 0, 0.3); }
            to { box-shadow: 0 0 40px #FFD700, 0 0 80px rgba(255, 215, 0, 0.6); }
          }
        `}
      </style>
    </div>
  );
};

export default PuzzleCanvas;

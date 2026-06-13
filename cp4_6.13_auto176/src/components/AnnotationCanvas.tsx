import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface TextBlock {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Annotation {
  id: string;
  textBlockId: string;
  type: 'highlight' | 'underline' | 'strikethrough' | 'comment';
  comment?: string;
  commentNumber?: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AnnotationCanvasProps {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  textBlocks: TextBlock[];
  annotations: Annotation[];
  activeTool: 'highlight' | 'underline' | 'strikethrough' | 'comment' | null;
  onAnnotationAdd: (annotation: Omit<Annotation, 'commentNumber'>) => void;
  onTextBlockSelect: (textBlockId: string) => void;
  selectedTextBlockId: string | null;
  nextCommentNumber: number;
}

const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  imageUrl,
  imageWidth,
  imageHeight,
  textBlocks,
  annotations,
  activeTool,
  onAnnotationAdd,
  onTextBlockSelect,
  selectedTextBlockId,
  nextCommentNumber,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [activeCommentBlockId, setActiveCommentBlockId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  const getScaledCoords = useCallback((block: TextBlock) => {
    return {
      x: block.x * scale,
      y: block.y * scale,
      width: block.width * scale,
      height: block.height * scale,
    };
  }, [scale]);

  const drawWavyLine = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    color: string,
    amplitude: number,
    wavelength: number
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= width; px += 1) {
      const py = y + Math.sin((px / wavelength) * Math.PI * 2) * amplitude;
      if (!started) {
        ctx.moveTo(x + px, py);
        started = true;
      } else {
        ctx.lineTo(x + px, py);
      }
    }
    ctx.stroke();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = imageWidth * scale;
    const displayHeight = imageHeight * scale;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    textBlocks.forEach((block) => {
      const { x, y, width, height } = getScaledCoords(block);
      const padding = 2 * scale;

      if (selectedTextBlockId === block.id) {
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
      } else {
        ctx.strokeStyle = '#a2d9ff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
      }

      if (hoveredBlockId === block.id) {
        ctx.fillStyle = 'rgba(252, 243, 207, 0.5)';
        ctx.fillRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
      }
    });

    annotations.forEach((ann) => {
      const block = textBlocks.find((b) => b.id === ann.textBlockId);
      if (!block) return;
      const { x, y, width, height } = getScaledCoords(block);

      switch (ann.type) {
        case 'highlight':
          ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
          ctx.fillRect(x, y, width, height);
          break;
        case 'underline':
          drawWavyLine(ctx, x, y + height - 2 * scale, width, '#2196f3', 2 * scale, 8 * scale);
          break;
        case 'strikethrough':
          ctx.strokeStyle = '#e53935';
          ctx.lineWidth = 2 * scale;
          ctx.beginPath();
          ctx.moveTo(x, y + height / 2);
          ctx.lineTo(x + width, y + height / 2);
          ctx.stroke();
          break;
        case 'comment':
          if (ann.commentNumber !== undefined) {
            const bubbleRadius = 10 * scale;
            const bubbleX = x + width + bubbleRadius * 0.3;
            const bubbleY = y - bubbleRadius * 0.3;

            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(10 * scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(ann.commentNumber), bubbleX, bubbleY + 0.5 * scale);
          }
          break;
      }
    });
  }, [textBlocks, annotations, hoveredBlockId, selectedTextBlockId, scale, getScaledCoords, drawWavyLine, imageWidth, imageHeight]);

  useEffect(() => {
    let animationId: number;
    const render = () => {
      draw();
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setContainerWidth(w);
        if (imageWidth > 0) {
          setScale(w / imageWidth);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageWidth]);

  const getBlockAtPosition = useCallback((clientX: number, clientY: number): TextBlock | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const block of textBlocks) {
      const scaled = getScaledCoords(block);
      const padding = 2 * scale;
      if (
        x >= scaled.x - padding &&
        x <= scaled.x + scaled.width + padding &&
        y >= scaled.y - padding &&
        y <= scaled.y + scaled.height + padding
      ) {
        return block;
      }
    }
    return null;
  }, [textBlocks, getScaledCoords, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const block = getBlockAtPosition(e.clientX, e.clientY);
    if (block) {
      setHoveredBlockId(block.id);
    } else {
      setHoveredBlockId(null);
    }
  }, [getBlockAtPosition]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const block = getBlockAtPosition(e.clientX, e.clientY);
    if (!block) return;

    onTextBlockSelect(block.id);

    if (!activeTool) return;

    if (activeTool === 'comment') {
      setActiveCommentBlockId(block.id);
      setCommentInput('');
      return;
    }

    const newAnnotation: Omit<Annotation, 'commentNumber'> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      textBlockId: block.id,
      type: activeTool,
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
    };
    onAnnotationAdd(newAnnotation);
  }, [activeTool, onAnnotationAdd, onTextBlockSelect, getBlockAtPosition]);

  const handleCommentSubmit = useCallback(() => {
    if (!activeCommentBlockId || !commentInput.trim()) {
      setActiveCommentBlockId(null);
      return;
    }
    const block = textBlocks.find((b) => b.id === activeCommentBlockId);
    if (!block) {
      setActiveCommentBlockId(null);
      return;
    }

    const newAnnotation: Omit<Annotation, 'commentNumber'> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      textBlockId: block.id,
      type: 'comment',
      comment: commentInput.trim(),
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height,
    };
    onAnnotationAdd(newAnnotation);
    setActiveCommentBlockId(null);
    setCommentInput('');
  }, [activeCommentBlockId, commentInput, textBlocks, onAnnotationAdd]);

  useEffect(() => {
    if (!selectedTextBlockId) return;
    const block = textBlocks.find((b) => b.id === selectedTextBlockId);
    if (!block || !containerRef.current) return;

    const scaledY = block.y * scale;
    const containerHeight = containerRef.current.clientHeight;
    const blockHeight = block.height * scale;

    if (scaledY < containerRef.current.scrollTop || scaledY + blockHeight > containerRef.current.scrollTop + containerHeight) {
      containerRef.current.scrollTo({
        top: Math.max(0, scaledY - containerHeight / 2 + blockHeight / 2),
        behavior: 'smooth',
      });
    }
  }, [selectedTextBlockId, textBlocks, scale]);

  const activeCommentBlock = textBlocks.find((b) => b.id === activeCommentBlockId);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'auto',
        background: '#f8f9fa',
        borderRadius: 12,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: containerWidth,
          height: imageHeight * scale,
          margin: '0 auto',
        }}
      >
        <img
          src={imageUrl}
          alt="上传的手写稿"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            borderRadius: 8,
          }}
          draggable={false}
        />
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredBlockId(null)}
          onClick={handleClick}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: activeTool ? 'crosshair' : 'pointer',
          }}
        />

        {activeCommentBlock && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(
                getScaledCoords(activeCommentBlock).x + getScaledCoords(activeCommentBlock).width / 2 - 120,
                containerWidth - 260
              ),
              top: getScaledCoords(activeCommentBlock).y + getScaledCoords(activeCommentBlock).height + 6,
              width: 240,
              background: '#ffffff',
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10,
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <style>{`
              @keyframes slideUp {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="输入批注内容..."
              style={{
                width: '100%',
                minHeight: 60,
                padding: 8,
                border: '1px solid #e0e0e0',
                borderRadius: 4,
                fontSize: 13,
                resize: 'vertical',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setActiveCommentBlockId(null)}
                style={{
                  padding: '6px 14px',
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCommentSubmit}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  transition: 'all 0.2s',
                }}
              >
                确认
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationCanvas;

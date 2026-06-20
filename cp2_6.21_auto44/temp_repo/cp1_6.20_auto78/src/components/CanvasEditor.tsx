import React, { useCallback, useEffect, useRef, useState } from 'react';
import { THEME } from '../types';
import type { DialogBox } from '../types';

interface CanvasEditorProps {
  imageUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  dialogBoxes: DialogBox[];
  selectedBoxId: string | null;
  onSelectBox: (id: string | null) => void;
  onUpdateBox: (id: string, updates: Partial<DialogBox>) => void;
}

interface RippleState {
  x: number;
  y: number;
  id: number;
}

export default function CanvasEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  dialogBoxes,
  selectedBoxId,
  onSelectBox,
  onUpdateBox,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragTextStart, setDragTextStart] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const animFrameRef = useRef<number>(0);
  const rippleCounter = useRef(0);

  useEffect(() => {
    if (!imageUrl) {
      setImage(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale((prev) => Math.min(Math.max(prev * delta, 0.2), 5));
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvasSize.width * window.devicePixelRatio;
    canvas.height = canvasSize.height * window.devicePixelRatio;
    canvas.style.width = canvasSize.width + 'px';
    canvas.style.height = canvasSize.height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

    ctx.save();
    ctx.translate(canvasSize.width / 2 + offset.x, canvasSize.height / 2 + offset.y);
    ctx.scale(scale, scale);
    ctx.translate(-imageWidth / 2, -imageHeight / 2);

    if (image) {
      ctx.drawImage(image, 0, 0, imageWidth, imageHeight);
    }

    dialogBoxes.forEach((box, idx) => {
      const isSelected = box.id === selectedBoxId;

      ctx.fillStyle = 'rgba(74, 144, 217, 0.15)';
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 140, 66, 0.2)';
      }
      ctx.fillRect(box.x, box.y, box.width, box.height);

      ctx.strokeStyle = isSelected ? THEME.orange : THEME.blue;
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      const badgeR = 12;
      const badgeX = box.x + badgeR + 4;
      const badgeY = box.y + badgeR + 4;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? THEME.orange : THEME.blue;
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), badgeX, badgeY);

      const displayText = box.translatedText || box.originalText;
      if (displayText) {
        ctx.save();
        ctx.font = `${box.fontSize}px ${box.fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (dragging === box.id) {
          ctx.globalAlpha = 0.5;

          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(box.textX - 20, box.textY);
          ctx.lineTo(box.textX + 20, box.textY);
          ctx.moveTo(box.textX, box.textY - 20);
          ctx.lineTo(box.textX, box.textY + 20);
          ctx.stroke();
        } else {
          ctx.globalAlpha = 1;
        }

        if (box.strokeWidth > 0) {
          ctx.strokeStyle = box.strokeColor;
          ctx.lineWidth = box.strokeWidth * 2;
          ctx.lineJoin = 'round';
          ctx.strokeText(displayText, box.textX, box.textY);
        }

        ctx.fillStyle = box.fontColor;
        ctx.fillText(displayText, box.textX, box.textY);

        ctx.restore();
      }
    });

    ctx.restore();

    animFrameRef.current = requestAnimationFrame(drawCanvas);
  }, [
    image,
    imageWidth,
    imageHeight,
    canvasSize,
    scale,
    offset,
    dialogBoxes,
    selectedBoxId,
    dragging,
  ]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawCanvas);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawCanvas]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      const cx = (sx - canvasSize.width / 2 - offset.x) / scale + imageWidth / 2;
      const cy = (sy - canvasSize.height / 2 - offset.y) / scale + imageHeight / 2;
      return { x: cx, y: cy };
    },
    [canvasSize, scale, offset, imageWidth, imageHeight]
  );

  const findBoxAt = useCallback(
    (cx: number, cy: number) => {
      for (let i = dialogBoxes.length - 1; i >= 0; i--) {
        const box = dialogBoxes[i];
        if (
          cx >= box.x &&
          cx <= box.x + box.width &&
          cy >= box.y &&
          cy <= box.y + box.height
        ) {
          return box;
        }
      }
      return null;
    },
    [dialogBoxes]
  );

  const findTextBoxAt = useCallback(
    (cx: number, cy: number) => {
      for (let i = dialogBoxes.length - 1; i >= 0; i--) {
        const box = dialogBoxes[i];
        const displayText = box.translatedText || box.originalText;
        if (!displayText) continue;
        const halfW = (box.fontSize * displayText.length) / 2;
        const halfH = box.fontSize / 2;
        if (
          cx >= box.textX - halfW &&
          cx <= box.textX + halfW &&
          cy >= box.textY - halfH &&
          cy <= box.textY + halfH
        ) {
          return box;
        }
      }
      return null;
    },
    [dialogBoxes]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);

      const textBox = findTextBoxAt(x, y);
      if (textBox) {
        setDragging(textBox.id);
        setDragStart({ x, y });
        setDragTextStart({ x: textBox.textX, y: textBox.textY });
        onSelectBox(textBox.id);
        return;
      }

      const box = findBoxAt(x, y);
      if (box) {
        onSelectBox(box.id);
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const rippleId = ++rippleCounter.current;
          setRipples((prev) => [
            ...prev,
            { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId },
          ]);
          setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== rippleId));
          }, 600);
        }
      } else {
        onSelectBox(null);
      }
    },
    [screenToCanvas, findBoxAt, findTextBoxAt, onSelectBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      onUpdateBox(dragging, {
        textX: dragTextStart.x + dx,
        textY: dragTextStart.y + dy,
      });
    },
    [dragging, dragStart, dragTextStart, screenToCanvas, onUpdateBox]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragging) return;
    const box = dialogBoxes.find((b) => b.id === dragging);
    if (box) {
      const isOutside =
        box.textX < box.x ||
        box.textX > box.x + box.width ||
        box.textY < box.y ||
        box.textY > box.y + box.height;

      if (isOutside) {
        const shouldRecenter = window.confirm(
          '文字已完全拖出对话框区域，是否重新定位到对话框中心？'
        );
        if (shouldRecenter) {
          onUpdateBox(dragging, {
            textX: box.x + box.width / 2,
            textY: box.y + box.height / 2,
          });
        }
      }
    }
    setDragging(null);
  }, [dragging, dialogBoxes, onUpdateBox]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        background: '#0d0d1a',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: THEME.radius,
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      }}
    >
      {!imageUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#555',
            fontSize: '16px',
          }}
        >
          请上传漫画图片开始编辑
        </div>
      )}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          cursor: dragging ? 'grabbing' : 'default',
        }}
      />
      {ripples.map((r) => (
        <div
          key={r.id}
          className="ripple-effect"
          style={{
            left: r.x - 25,
            top: r.y - 25,
            width: 50,
            height: 50,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          right: '12px',
          background: 'rgba(0,0,0,0.6)',
          padding: '4px 10px',
          borderRadius: THEME.radius,
          fontSize: '12px',
          color: '#aaa',
          pointerEvents: 'none',
        }}
      >
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';

interface ChalkTextProps {
  text: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  width?: number;
  isEditing?: boolean;
  onChange?: (text: string) => void;
  onBlur?: () => void;
}

export const ChalkText = ({
  text,
  color,
  fontFamily,
  fontSize,
  width = 200,
  isEditing = false,
  onChange,
  onBlur,
}: ChalkTextProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = width;
    const displayHeight = fontSize * 2.5;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    ctx.font = `${fontSize}px "${fontFamily}", cursive`;
    ctx.textBaseline = 'top';

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * 2;
      const offsetY = (Math.random() - 0.5) * 2;
      ctx.fillText(text, 4 + offsetX, 2 + offsetY);
    }

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = color;
    ctx.fillText(text, 4, 2);

    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < text.length * 3; i++) {
      const x = Math.random() * displayWidth;
      const y = Math.random() * displayHeight;
      const size = Math.random() * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }, [text, color, fontFamily, fontSize, width, isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange?.(e.target.value.slice(0, 50))}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onBlur?.();
          }
        }}
        style={{
          width: '100%',
          minHeight: fontSize * 2,
          background: 'transparent',
          border: '2px dashed #81E6D9',
          borderRadius: '4px',
          color: color,
          fontFamily: `"${fontFamily}", cursive`,
          fontSize: `${fontSize}px`,
          padding: '4px',
          outline: 'none',
          resize: 'none',
          lineHeight: 1.3,
        }}
        maxLength={50}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        pointerEvents: 'none',
      }}
    />
  );
};

import { useState } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { EXPRESSIONS, getExpressionById } from '../utils/expressions';
import { undoManager } from '../utils/undoManager';
import { socketClient } from '../utils/socketClient';

function ExpressionThumbnail({
  pattern,
  size = 80,
}: {
  pattern: (string | null)[][];
  size?: number;
}) {
  const pixelSize = size / 32;
  const canvasRef = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const color = pattern[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(x * pixelSize),
            Math.floor(y * pixelSize),
            Math.ceil(pixelSize),
            Math.ceil(pixelSize)
          );
        }
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        borderRadius: 8,
      }}
    />
  );
}

export function ExpressionPalette() {
  const [pressedId, setPressedId] = useState<string | null>(null);
  const { pixels, setPixels, setExpressionId, expressionId } = useEditorStore();

  const handleExpressionClick = (id: string) => {
    setPressedId(id);
    setTimeout(() => setPressedId(null), 200);

    const expression = getExpressionById(id);
    if (!expression) return;

    undoManager.push(pixels);

    const newPixels = pixels.map((row) => [...row]);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const color = expression.pattern[y]?.[x];
        if (color !== null && color !== undefined) {
          newPixels[y][x] = color;
        }
      }
    }

    setPixels(newPixels);
    setExpressionId(id);
    socketClient.setPixels(newPixels);
    socketClient.selectExpression(id);
  };

  return (
    <div style={{ padding: 16, borderBottom: '1px solid #333333' }}>
      <h3
        style={{
          color: '#E0E0E0',
          fontSize: 14,
          marginBottom: 12,
          fontWeight: 600,
        }}
      >
        表情模板
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {EXPRESSIONS.map((expr) => (
          <button
            key={expr.id}
            onClick={() => handleExpressionClick(expr.id)}
            title={expr.name}
            style={{
              background: expressionId === expr.id ? '#3a3a3a' : '#1A1A1A',
              border:
                expressionId === expr.id
                  ? '2px solid #00BFA5'
                  : '2px solid transparent',
              borderRadius: 10,
              padding: 6,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transform: pressedId === expr.id ? 'scale(0.95)' : 'scale(1)',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#3a3a3a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                expressionId === expr.id ? '#3a3a3a' : '#1A1A1A';
            }}
          >
            <ExpressionThumbnail pattern={expr.pattern} size={80} />
            <span
              style={{
                fontSize: 11,
                color: '#E0E0E0',
                opacity: 0.9,
              }}
            >
              {expr.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

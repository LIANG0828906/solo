import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore } from './store';
import { useVoteStore } from '../vote/store';
import { STICKER_PRESETS, StickerType } from './types';
import { ICONS, STICKER_SVG, COLOR_PALETTE } from './icons';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

const renderStickerToCanvas = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  stickerType: StickerType
) => {
  const svgStr = STICKER_SVG[stickerType]?.(size, color) || '';
  const img = new window.Image();
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  img.onload = () => {
    ctx.save();
    ctx.translate(x, y);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
    URL.revokeObjectURL(url);
  };
  img.src = url;
};

const renderTextBubble = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  color: string,
  bgColor: string
) => {
  ctx.save();
  ctx.font = `${fontSize}px Inter, sans-serif`;
  const padding = 12;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;
  const bubbleWidth = textWidth + padding * 2;
  const bubbleHeight = textHeight + padding * 2;
  const radius = 16;

  const bx = x - bubbleWidth / 2;
  const by = y - bubbleHeight / 2;

  ctx.fillStyle = bgColor;
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  ctx.beginPath();
  ctx.moveTo(bx + radius, by);
  ctx.lineTo(bx + bubbleWidth - radius, by);
  ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + radius);
  ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - radius);
  ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - radius, by + bubbleHeight);
  ctx.lineTo(bx + radius, by + bubbleHeight);
  ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - radius);
  ctx.lineTo(bx, by + radius);
  ctx.quadraticCurveTo(bx, by, bx + radius, by);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
};

const renderWatercolorStroke = (
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  color: string,
  lineWidth: number,
  opacity: number
) => {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (let layer = 0; layer < 2; layer++) {
    ctx.globalAlpha = opacity * (layer === 0 ? 0.6 : 0.35);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth * (layer === 0 ? 1 : 1.4);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const jitter = (Math.random() - 0.5) * 0.8;
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2 + jitter;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    if (points.length > 1) {
      const last = points[points.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  }

  ctx.restore();
};

interface CanvasBoardProps {
  onReady?: () => void;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({ onReady }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    actions,
    currentDrawing,
    selectedTool,
    selectedColor,
    brushSize,
    selectedSticker,
    activeColorOptions,
    collaborators,
    selectedActionId,
    startDrawing,
    continueDrawing,
    endDrawing,
    addSticker,
    addTextBubble,
    undo,
    redo,
    canUndo,
    canRedo,
    setTool,
    setColor,
    setBrushSize,
    setSelectedSticker,
    updateCollaboratorCursor,
    removeInactiveCollaborators,
    initBroadcastChannel,
    closeBroadcastChannel,
    broadcastCursor,
    setActiveColorOptions,
    loadFromDB
  } = useCanvasStore();

  const { currentVote, votedOptionId } = useVoteStore();
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textInputPos, setTextInputPos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedBubbleColor, setSelectedBubbleColor] = useState('#FFFFFF');

  const userId = localStorage.getItem('voteCanvas_userId') || '';

  useEffect(() => {
    if (currentVote) {
      const colors = currentVote.options.map((o) => o.color);
      setActiveColorOptions(colors);
      if (colors.length > 0) {
        setColor(colors[0]);
      }
    }
  }, [currentVote, setActiveColorOptions, setColor]);

  useEffect(() => {
    if (currentVote) {
      initBroadcastChannel(currentVote.inviteCode);
      loadFromDB(currentVote.inviteCode);
      const interval = setInterval(removeInactiveCollaborators, 3000);
      return () => {
        closeBroadcastChannel();
        clearInterval(interval);
      };
    }
  }, [currentVote?.inviteCode, initBroadcastChannel, closeBroadcastChannel, loadFromDB, removeInactiveCollaborators]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX || 0;
      clientY = e.touches[0]?.clientY || 0;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left - offset.x) / scale;
    const y = (clientY - rect.top - offset.y) / scale;

    return { x, y };
  }, [scale, offset]);

  const renderAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gridSize = 40;
    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    actions.forEach((action) => {
      if (action.type === 'brush') {
        renderWatercolorStroke(ctx, action.points, action.color, action.lineWidth, action.opacity);
      } else if (action.type === 'sticker') {
        const size = 48 * action.scale;
        renderStickerToCanvas(ctx, action.x, action.y, size, action.associatedOptionId
          ? (currentVote?.options.find((o) => o.id === action.associatedOptionId)?.color || '#FF6B6B')
          : '#FF6B6B',
          action.stickerType
        );
      } else if (action.type === 'text') {
        renderTextBubble(ctx, action.text, action.x, action.y, action.fontSize, action.color, action.bgColor);
      }
    });

    if (currentDrawing && currentDrawing.type === 'brush') {
      renderWatercolorStroke(ctx, currentDrawing.points, currentDrawing.color, currentDrawing.lineWidth, currentDrawing.opacity);
    }

    const overlay = overlayRef.current;
    if (overlay && ctx) {
      const oCtx = overlay.getContext('2d');
      if (oCtx) {
        oCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        collaborators.forEach((collab) => {
          if (collab.userId === userId) return;
          oCtx.save();
          oCtx.beginPath();
          oCtx.arc(collab.cursorX, collab.cursorY, 8, 0, Math.PI * 2);
          oCtx.fillStyle = collab.color;
          oCtx.globalAlpha = 0.9;
          oCtx.fill();
          oCtx.strokeStyle = '#FFFFFF';
          oCtx.lineWidth = 2;
          oCtx.stroke();
          oCtx.globalAlpha = 1;

          oCtx.font = '11px Inter, sans-serif';
          oCtx.fillStyle = collab.color;
          oCtx.textAlign = 'left';
          const labelWidth = oCtx.measureText(collab.userName).width + 10;
          oCtx.fillStyle = 'rgba(255,255,255,0.95)';
          oCtx.strokeStyle = collab.color;
          oCtx.lineWidth = 1;
          oCtx.beginPath();
          oCtx.roundRect(collab.cursorX + 10, collab.cursorY - 10, labelWidth, 20, 6);
          oCtx.fill();
          oCtx.stroke();
          oCtx.fillStyle = collab.color;
          oCtx.fillText(collab.userName, collab.cursorX + 15, collab.cursorY + 4);
          oCtx.restore();
        });
      }
    }

    if (onReady) onReady();
  }, [actions, currentDrawing, collaborators, userId, currentVote, onReady]);

  useEffect(() => {
    const id = requestAnimationFrame(renderAll);
    return () => cancelAnimationFrame(id);
  }, [renderAll]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);

    if (selectedTool === 'brush') {
      startDrawing(coords);
    } else if (selectedTool === 'sticker' && selectedSticker) {
      addSticker(coords.x, coords.y, selectedSticker, votedOptionId || undefined);
    } else if (selectedTool === 'text') {
      setTextInputPos(coords);
      setShowTextInput(true);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e);

    if (selectedTool === 'brush' && currentDrawing) {
      continueDrawing(coords);
    }

    broadcastCursor(coords.x, coords.y);
  };

  const handlePointerUp = () => {
    if (selectedTool === 'brush' && currentDrawing) {
      endDrawing();
    }
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      const optColor = votedOptionId
        ? (currentVote?.options.find((o) => o.id === votedOptionId)?.color || '#333333')
        : '#333333';
      addTextBubble(textInputPos.x, textInputPos.y, textInput.trim(), optColor, selectedBubbleColor, votedOptionId || undefined);
    }
    setShowTextInput(false);
    setTextInput('');
  };

  const collaboratorList = Array.from(collaborators.values()).filter((c) => c.userId !== userId);

  return (
    <div
      className="canvas-board-wrapper"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#f8f9fa',
        overflow: 'auto',
        padding: '16px'
      }}
    >
      <div className="canvas-toolbar" style={toolbarStyle}>
        <div style={toolGroupStyle}>
          <ToolButton
            active={selectedTool === 'brush'}
            onClick={() => setTool('brush')}
            label="画笔"
            icon="✏️"
          />
          <ToolButton
            active={selectedTool === 'sticker'}
            onClick={() => setTool('sticker')}
            label="贴纸"
            icon="⭐"
          />
          <ToolButton
            active={selectedTool === 'text'}
            onClick={() => setTool('text')}
            label="文字"
            icon="💬"
          />
        </div>

        <div style={{ ...dividerStyle }} />

        <div style={toolGroupStyle}>
          <ColorPalette colors={activeColorOptions} selected={selectedColor} onSelect={setColor} label="选项色" />
          <ColorPalette colors={COLOR_PALETTE} selected={selectedColor} onSelect={setColor} label="调色板" />
        </div>

        {selectedTool === 'brush' && (
          <>
            <div style={{ ...dividerStyle }} />
            <div style={toolGroupStyle}>
              <span style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>粗细</span>
              {[2, 4, 6, 10].map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: brushSize === size ? '#f0f0f0' : 'transparent',
                    border: brushSize === size ? `2px solid ${selectedColor}` : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms'
                  }}
                >
                  <div style={{
                    width: size + 4,
                    height: size + 4,
                    borderRadius: '50%',
                    background: selectedColor
                  }} />
                </button>
              ))}
            </div>
          </>
        )}

        {selectedTool === 'sticker' && (
          <>
            <div style={{ ...dividerStyle }} />
            <div style={toolGroupStyle}>
              {STICKER_PRESETS.map((sticker) => (
                <button
                  key={sticker}
                  onClick={() => setSelectedSticker(sticker)}
                  className={selectedSticker === sticker ? 'animate-bounce-pulse' : ''}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: selectedSticker === sticker ? '#fff5e6' : 'transparent',
                    border: selectedSticker === sticker ? '2px solid #ffa940' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms',
                    cursor: 'pointer',
                    fontSize: '20px'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: STICKER_SVG[sticker]?.(24, selectedSticker === sticker ? '#ffa940' : '#555') || ''
                  }}
                />
              ))}
            </div>
          </>
        )}

        <div style={{ ...dividerStyle }} />

        <div style={toolGroupStyle}>
          <button
            onClick={undo}
            disabled={!canUndo()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: canUndo() ? '#f8f9fa' : '#f0f0f0',
              opacity: canUndo() ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: canUndo() ? 'pointer' : 'not-allowed',
              transition: 'all 200ms'
            }}
            title="撤销 (Ctrl+Z)"
          >
            ↩️
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: canRedo() ? '#f8f9fa' : '#f0f0f0',
              opacity: canRedo() ? 1 : 0.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: canRedo() ? 'pointer' : 'not-allowed',
              transition: 'all 200ms'
            }}
            title="重做 (Ctrl+Y)"
          >
            ↪️
          </button>
        </div>

        <div style={{ ...dividerStyle }} />

        <div style={toolGroupStyle}>
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            style={iconBtnStyle}
          >
            🔍-
          </button>
          <span style={{ fontSize: '12px', color: '#555', minWidth: '40px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.1))}
            style={iconBtnStyle}
          >
            🔍+
          </button>
        </div>

        {collaboratorList.length > 0 && (
          <>
            <div style={{ ...dividerStyle }} />
            <div style={toolGroupStyle}>
              <span style={{ fontSize: '12px', color: '#666' }}>
                在线: {collaboratorList.length + 1}人
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {collaboratorList.slice(0, 4).map((c) => (
                  <div
                    key={c.userId}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: c.color,
                      border: '2px solid #fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    title={c.userName}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '80px',
          minHeight: `${CANVAS_HEIGHT + 20}px`
        }}
      >
        <div
          style={{
            position: 'relative',
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transformOrigin: 'center top',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid #e9ecef'
          }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: selectedTool === 'brush' ? 'crosshair' : selectedTool === 'text' ? 'text' : 'pointer',
              touchAction: 'none'
            }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
          <canvas
            ref={overlayRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          />
          {currentVote && currentVote.status === 'ended' && (
            <SemiCircleResultOverlay
              options={currentVote.options}
              onReady={() => {}}
            />
          )}
        </div>
      </div>

      {showTextInput && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowTextInput(false)}
        >
          <div
            className="animate-bounce-in"
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              width: '380px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              添加文字气泡
            </div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="输入文字内容..."
              autoFocus
              style={{
                width: '100%',
                height: '80px',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '10px',
                fontSize: '14px',
                resize: 'none',
                marginBottom: '12px'
              }}
            />
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>气泡背景</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['#FFFFFF', '#FFF4E6', '#E6F7FF', '#F6FFED', '#FFF0F6', '#F9F0FF'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedBubbleColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: c,
                      border: selectedBubbleColor === c ? '2px solid #1890ff' : '2px solid #e9ecef'
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTextInput(false)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  background: '#f5f5f5',
                  fontSize: '14px',
                  color: '#555'
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddText}
                disabled={!textInput.trim()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '10px',
                  background: textInput.trim() ? '#1890ff' : '#bfbfbf',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: textInput.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SemiCircleResultOverlay: React.FC<{
  options: Array<{ id: string; text: string; color: string; icon: string; votes: number }>;
  onReady: () => void;
}> = ({ options, onReady }) => {
  useEffect(() => { onReady(); }, [onReady]);

  const total = options.reduce((s, o) => s + o.votes, 0);
  const cx = 600;
  const cy = 720;
  const rOuter = 80;
  const rInner = 40;

  let currentAngle = Math.PI;
  const segments = options.map((opt) => {
    const angle = total === 0 ? (Math.PI / options.length) : (Math.PI * opt.votes / total);
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...opt, startAngle, endAngle: currentAngle, angle };
  });

  return (
    <svg
      width={CANVAS_WIDTH}
      height={160}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        pointerEvents: 'none',
        background: 'rgba(255,255,255,0.9)',
        borderTop: '1px solid rgba(0,0,0,0.05)'
      }}
    >
      <defs>
        {options.map((o) => (
          <filter key={o.id} id={`shadow-${o.id}`}>
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        ))}
      </defs>
      {segments.map((seg, idx) => {
        const x1 = cx + rInner * Math.cos(seg.startAngle);
        const y1 = cy + rInner * Math.sin(seg.startAngle);
        const x2 = cx + rOuter * Math.cos(seg.startAngle);
        const y2 = cy + rOuter * Math.sin(seg.startAngle);
        const x3 = cx + rOuter * Math.cos(seg.endAngle);
        const y3 = cy + rOuter * Math.sin(seg.endAngle);
        const x4 = cx + rInner * Math.cos(seg.endAngle);
        const y4 = cy + rInner * Math.sin(seg.endAngle);
        const largeArc = seg.angle > Math.PI ? 1 : 0;
        const midAngle = (seg.startAngle + seg.endAngle) / 2;
        const midR = (rInner + rOuter) / 2;
        const midX = cx + midR * Math.cos(midAngle);
        const midY = cy + midR * Math.sin(midAngle);

        const pathD = [
          `M ${x1} ${y1}`,
          `L ${x2} ${y2}`,
          `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x3} ${y3}`,
          `L ${x4} ${y4}`,
          `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1} ${y1}`,
          'Z'
        ].join(' ');

        const percentage = total === 0 ? Math.round(100 / options.length) : Math.round((seg.votes / total) * 100);

        return (
          <g key={seg.id} style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `sectorExpand 0.8s ease-out ${idx * 0.12}s both`
          }}>
            <path
              d={pathD}
              fill={seg.color}
              opacity={0.92}
              stroke="#fff"
              strokeWidth={2}
              filter={`url(#shadow-${seg.id})`}
            />
            {seg.angle > 0.15 && (
              <g transform={`translate(${midX}, ${midY})`}>
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#fff"
                  fontWeight={700}
                  fontSize={14}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                >
                  {percentage}%
                </text>
                <foreignObject x={-12} y={-40} width={24} height={24}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: ICONS[seg.icon as keyof typeof ICONS]?.(24, '#fff') || ''
                    }}
                    style={{ width: 24, height: 24 }}
                  />
                </foreignObject>
              </g>
            )}
          </g>
        );
      })}
      <text
        x={cx}
        y={cy + 8}
        textAnchor="middle"
        fill="#333"
        fontWeight={600}
        fontSize={16}
      >
        总票数: {total}
      </text>
    </svg>
  );
};

const toolbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: '12px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#fff',
  padding: '10px 14px',
  borderRadius: '14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  zIndex: 100,
  border: '1px solid #f0f0f0',
  maxWidth: '95%',
  flexWrap: 'wrap'
};

const toolGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

const dividerStyle: React.CSSProperties = {
  width: '1px',
  height: '24px',
  background: '#e9ecef',
  margin: '0 4px'
};

const iconBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: '#f8f9fa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 200ms'
};

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ active, onClick, label, icon }) => (
  <button
    onClick={onClick}
    style={{
      padding: '6px 12px',
      borderRadius: '10px',
      background: active ? '#e6f4ff' : 'transparent',
      border: active ? `2px solid #1890ff` : '2px solid transparent',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      color: active ? '#1890ff' : '#555',
      transition: 'all 200ms'
    }}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

interface ColorPaletteProps {
  colors: string[];
  selected: string;
  onSelect: (c: string) => void;
  label?: string;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ colors, selected, onSelect, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {label && <span style={{ fontSize: '12px', color: '#666', marginRight: '4px' }}>{label}</span>}
    {colors.map((color) => (
      <button
        key={color}
        onClick={() => onSelect(color)}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: color,
          border: selected === color ? '2px solid #333' : '2px solid #fff',
          boxShadow: selected === color ? '0 0 0 2px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'all 150ms',
          cursor: 'pointer'
        }}
      />
    ))}
  </div>
);

export default CanvasBoard;
export { CANVAS_WIDTH, CANVAS_HEIGHT };

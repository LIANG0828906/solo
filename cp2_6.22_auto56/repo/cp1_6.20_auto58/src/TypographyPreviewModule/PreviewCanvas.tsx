import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  useTypographyStore,
  TypographyParams,
  DeviceWidth,
  DEFAULT_PARAMS,
} from './TypographyContext';
import { SplitSquareVertical, Trash2 } from 'lucide-react';

const DEVICE_OPTIONS: { width: DeviceWidth; label: string }[] = [
  { width: 375, label: '手机' },
  { width: 768, label: '平板' },
  { width: 1280, label: '笔记本' },
  { width: 1920, label: '4K' },
];

const PADDING = 48;
const CANVAS_BACKGROUND = '#FDF6E3';
const TEXT_COLOR = '#2C3E50';

interface Segment {
  isHeading: boolean;
  text: string;
}

const smartSegment = (text: string): Segment[] => {
  const lines = text.split(/\n+/);
  const result: Segment[] = [];
  let firstNonEmpty = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      firstNonEmpty = true;
      continue;
    }

    if (firstNonEmpty) {
      result.push({ isHeading: true, text: line });
      firstNonEmpty = false;
      continue;
    }

    if (line.length <= 100) {
      result.push({ isHeading: false, text: line });
    } else {
      let idx = 0;
      while (idx < line.length) {
        const chunk = line.slice(idx, idx + 100);
        result.push({ isHeading: false, text: chunk });
        idx += 100;
      }
    }
  }

  return result;
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  letterSpacing: number
): string[] => {
  if (!text) return [''];

  const lines: string[] = [];
  const chars = Array.from(text);
  let currentLine = '';

  const measureStr = (str: string): number => {
    if (letterSpacing === 0) return ctx.measureText(str).width;
    let w = 0;
    for (const ch of str) {
      w += ctx.measureText(ch).width + letterSpacing;
    }
    if (w > 0 && str.length > 0) w -= letterSpacing;
    return w;
  };

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '\n') {
      lines.push(currentLine);
      currentLine = '';
      continue;
    }

    const testLine = currentLine + ch;
    if (measureStr(testLine) > maxWidth && currentLine !== '') {
      if (/[\s,，。！？、；：]/.test(ch)) {
        lines.push(currentLine);
        currentLine = /\s/.test(ch) ? '' : ch;
      } else {
        lines.push(currentLine);
        currentLine = ch;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
};

const renderContent = (
  ctx: CanvasRenderingContext2D,
  width: number,
  params: TypographyParams,
  text: string,
  scale: number = 1
): number => {
  const contentWidth = width - PADDING * 2;
  const segments = smartSegment(text);

  ctx.save();
  if (scale !== 1) ctx.scale(scale, scale);

  let cursorY = PADDING;

  for (let segIdx = 0; segIdx < segments.length; segIdx++) {
    const segment = segments[segIdx];
    const isHeading = segment.isHeading;
    const fontSize = isHeading ? params.headingSize : params.bodySize;
    const font = isHeading ? params.headingFont : params.bodyFont;
    const lineHeightPx = fontSize * params.lineHeight;

    ctx.font = `${isHeading ? 'bold ' : ''}${fontSize}px ${font}`;
    ctx.fillStyle = TEXT_COLOR;
    ctx.textBaseline = 'top';

    const wrappedLines = wrapText(ctx, segment.text, contentWidth, params.letterSpacing);

    for (let lineIdx = 0; lineIdx < wrappedLines.length; lineIdx++) {
      const lineText = wrappedLines[lineIdx];
      let lineWidth = 0;
      if (params.letterSpacing === 0) {
        lineWidth = ctx.measureText(lineText).width;
      } else {
        for (const ch of lineText) {
          lineWidth += ctx.measureText(ch).width + params.letterSpacing;
        }
        if (lineWidth > 0 && lineText.length > 0) {
          lineWidth -= params.letterSpacing;
        }
      }

      let x = PADDING;
      if (params.textAlign === 'center') {
        x = PADDING + (contentWidth - lineWidth) / 2;
      } else if (params.textAlign === 'right') {
        x = PADDING + contentWidth - lineWidth;
      }

      if (params.letterSpacing === 0) {
        ctx.fillText(lineText, x, cursorY);
      } else {
        let charX = x;
        for (const ch of lineText) {
          ctx.fillText(ch, charX, cursorY);
          charX += ctx.measureText(ch).width + params.letterSpacing;
        }
      }

      if (lineIdx < wrappedLines.length - 1) {
        cursorY += lineHeightPx;
      }
    }

    cursorY += lineHeightPx;
    if (segIdx < segments.length - 1) {
      cursorY += params.paragraphSpacing;
    }
  }

  ctx.restore();
  return cursorY + PADDING;
};

const deviceButtonBase: React.CSSProperties = {
  width: 48,
  height: 36,
  border: '1px solid #D0D0D0',
  background: '#F5F5F5',
  color: '#2C3E50',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
};

const deviceButtonSelected: React.CSSProperties = {
  ...deviceButtonBase,
  background: '#2C3E50',
  color: '#ffffff',
  borderColor: '#2C3E50',
};

const presetCardStyleBase: React.CSSProperties = {
  position: 'relative',
  flexShrink: 0,
  width: 120,
  height: 80,
  borderRadius: 10,
  background: '#ffffff',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  padding: 10,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.05)',
  boxSizing: 'border-box',
};

interface RAFState {
  params: TypographyParams;
  lastSavedParams: TypographyParams | null;
  deviceWidth: number;
  customText: string;
  compareMode: boolean;
  splitRatio: number;
}

export default function PreviewCanvas() {
  const store = useTypographyStore();
  const {
    params,
    lastSavedParams,
    compareMode,
    setCompareMode,
    deviceWidth,
    setDeviceWidth,
    customText,
    setCustomText,
    presets,
    savePreset,
    applyPreset,
    deletePreset,
  } = store;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const dirtyRef = useRef(true);
  const rafIdRef = useRef<number | null>(null);
  const latestScaleRef = useRef(1);

  const rafStateRef = useRef<RAFState>({
    params,
    lastSavedParams,
    deviceWidth,
    customText,
    compareMode,
    splitRatio: 0.5,
  });

  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [splitRatio, setSplitRatio] = useState(0.5);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [logicalWidth, setLogicalWidth] = useState(1280);
  const [displayHeight, setDisplayHeight] = useState(800);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
  }, []);

  useEffect(() => {
    rafStateRef.current = {
      params,
      lastSavedParams,
      deviceWidth,
      customText,
      compareMode,
      splitRatio,
    };
    markDirty();
  }, [params, lastSavedParams, deviceWidth, customText, compareMode, splitRatio, markDirty]);

  useEffect(() => {
    const handleFontSelected = () => {
      markDirty();
    };
    window.addEventListener('fontSelected', handleFontSelected);
    return () => window.removeEventListener('fontSelected', handleFontSelected);
  }, [markDirty]);

  useEffect(() => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    const loop = () => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        const canvas = canvasRef.current;
        const wrap = canvasWrapRef.current;
        if (!canvas || !wrap || !tempCtx) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }

        const state = rafStateRef.current;
        const dpr = window.devicePixelRatio || 1;
        const maxAvailable = Math.max(320, wrap.clientWidth - 48);
        const baseLogicalWidth = state.compareMode
          ? state.deviceWidth * 2
          : state.deviceWidth;

        let newScale = maxAvailable / baseLogicalWidth;
        if (newScale > 1) newScale = 1;

        latestScaleRef.current = newScale;
        setLogicalWidth(baseLogicalWidth);

        tempCanvas.width = Math.ceil(state.deviceWidth);
        tempCanvas.height = Math.ceil(4000);

        tempCtx.fillStyle = CANVAS_BACKGROUND;
        tempCtx.fillRect(0, 0, state.deviceWidth, 4000);
        const leftH = renderContent(tempCtx, state.deviceWidth, state.params, state.customText, 1);

        const rightParams = state.lastSavedParams || { ...DEFAULT_PARAMS };
        tempCtx.fillStyle = CANVAS_BACKGROUND;
        tempCtx.fillRect(0, 0, state.deviceWidth, 4000);
        const rightH = renderContent(tempCtx, state.deviceWidth, rightParams, state.customText, 1);

        const totalHeight = Math.max(leftH, rightH, 500);
        setDisplayHeight(totalHeight);

        const dispW = baseLogicalWidth * newScale;
        const dispH = totalHeight * newScale;

        canvas.width = Math.ceil(dispW * dpr);
        canvas.height = Math.ceil(dispH * dpr);
        canvas.style.width = `${dispW}px`;
        canvas.style.height = `${dispH}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, dispW, dispH);

        if (state.compareMode) {
          const splitX = dispW * state.splitRatio;
          const leftW = splitX;
          const rightW = dispW - splitX;
          const srcLeftW = state.deviceWidth * state.splitRatio * 2;
          const srcRightW = state.deviceWidth * 2 - srcLeftW;

          const leftFull = document.createElement('canvas');
          leftFull.width = Math.ceil(state.deviceWidth);
          leftFull.height = Math.ceil(totalHeight);
          const lCtx = leftFull.getContext('2d');
          if (lCtx) {
            lCtx.fillStyle = CANVAS_BACKGROUND;
            lCtx.fillRect(0, 0, state.deviceWidth, totalHeight);
            renderContent(lCtx, state.deviceWidth, state.params, state.customText, 1);
          }

          const rightFull = document.createElement('canvas');
          rightFull.width = Math.ceil(state.deviceWidth);
          rightFull.height = Math.ceil(totalHeight);
          const rCtx = rightFull.getContext('2d');
          if (rCtx) {
            rCtx.fillStyle = CANVAS_BACKGROUND;
            rCtx.fillRect(0, 0, state.deviceWidth, totalHeight);
            renderContent(rCtx, state.deviceWidth, rightParams, state.customText, 1);
          }

          if (lCtx) {
            ctx.drawImage(
              leftFull,
              0,
              0,
              srcLeftW,
              totalHeight,
              0,
              0,
              leftW,
              dispH
            );
          }

          if (rCtx) {
            ctx.drawImage(
              rightFull,
              state.deviceWidth - srcRightW,
              0,
              srcRightW,
              totalHeight,
              splitX,
              0,
              rightW,
              dispH
            );
          }

          ctx.strokeStyle = '#D0D0D0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(splitX, 0);
          ctx.lineTo(splitX, dispH);
          ctx.stroke();
        } else {
          const full = document.createElement('canvas');
          full.width = Math.ceil(state.deviceWidth);
          full.height = Math.ceil(totalHeight);
          const fCtx = full.getContext('2d');
          if (fCtx) {
            fCtx.fillStyle = CANVAS_BACKGROUND;
            fCtx.fillRect(0, 0, state.deviceWidth, totalHeight);
            renderContent(fCtx, state.deviceWidth, state.params, state.customText, 1);
            ctx.drawImage(full, 0, 0, state.deviceWidth, totalHeight, 0, 0, dispW, dispH);
          }
        }
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleResize = () => markDirty();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [markDirty]);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const wrap = canvasWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const clientX =
        'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const canvasLeft =
        rect.left + (rect.width - logicalWidth * latestScaleRef.current) / 2;
      const relativeX =
        (clientX - canvasLeft) / (logicalWidth * latestScaleRef.current);
      const ratio = Math.max(0.3, Math.min(0.7, relativeX));
      setSplitRatio(ratio);
    };

    const handleUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingSplit, logicalWidth]);

  const handleSavePresetClick = () => {
    const extractName = (font: string) => {
      const first = font.split(',')[0].trim().replace(/["']/g, '');
      return first || 'Unknown';
    };
    const defaultName = `${extractName(params.headingFont)} + ${extractName(params.bodyFont)}组合`;
    setPresetNameInput(defaultName);
    setShowPresetDialog(true);
  };

  const handleConfirmSavePreset = () => {
    savePreset(presetNameInput || undefined);
    setShowPresetDialog(false);
  };

  const currentScale = latestScaleRef.current;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100vh',
        padding: 24,
        paddingRight: 300,
        boxSizing: 'border-box',
        background: '#FAFAFA',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: 16,
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: 4,
            background: '#ffffff',
            borderRadius: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          {DEVICE_OPTIONS.map((opt) => {
            const selected = deviceWidth === opt.width;
            return (
              <button
                key={opt.width}
                type="button"
                onClick={() => setDeviceWidth(opt.width)}
                style={selected ? deviceButtonSelected : deviceButtonBase}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          maxLength={2000}
          placeholder="输入或粘贴您的自定义文本内容..."
          style={{
            width: '100%',
            maxWidth: 800,
            minHeight: 100,
            padding: 14,
            borderRadius: 10,
            border: '1px solid #E0E0E0',
            fontSize: 14,
            lineHeight: 1.6,
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
            background: '#ffffff',
            color: '#2C3E50',
            boxSizing: 'border-box',
          }}
          onInput={markDirty}
        />
        <div
          style={{
            alignSelf: 'center',
            fontSize: 11,
            color: '#999',
            marginTop: -6,
          }}
        >
          {customText.length}/2000
        </div>
      </div>

      <div
        ref={canvasWrapRef}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          position: 'relative',
          padding: 16,
          paddingBottom: 140,
          width: '100%',
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: `${logicalWidth * currentScale}px`,
            maxWidth: '100%',
            transition: 'width 0.4s cubic-bezier(0.65,0,0.35,1)',
            display: 'flex',
            justifyContent: 'center',
            height: `${displayHeight * currentScale}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              borderRadius: 8,
              boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
              display: 'block',
              transition: 'width 0.4s cubic-bezier(0.65,0,0.35,1)',
            }}
          />

          {compareMode && (
            <div
              onMouseDown={(e) => {
                e.preventDefault();
                setIsDraggingSplit(true);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                setIsDraggingSplit(true);
              }}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${logicalWidth * currentScale * splitRatio}px`,
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#ffffff',
                border: '2px solid #D0D0D0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'col-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 14,
                  borderRadius: 2,
                  background: '#B0B0B0',
                }}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCompareMode(!compareMode)}
          title={compareMode ? '关闭对比模式' : '开启对比模式'}
          style={{
            position: 'fixed',
            right: 296,
            bottom: 100,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: compareMode ? '#2C3E50' : '#E27D60',
            color: '#ffffff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: compareMode
              ? '0 8px 24px rgba(44,62,80,0.4)'
              : '0 8px 24px rgba(226,125,96,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 40,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <SplitSquareVertical size={22} />
        </button>
      </div>

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 280,
          bottom: 0,
          padding: '16px 24px 24px 24px',
          background:
            'linear-gradient(to top, rgba(250,250,250,0.98) 70%, rgba(250,250,250,0))',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      >
        <div style={{ pointerEvents: 'auto', maxWidth: 1400, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={handleSavePresetClick}
              style={{
                background: '#E27D60',
                color: '#ffffff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 4px 12px rgba(226,125,96,0.3)',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#C96A50';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#E27D60';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onTouchStart={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)';
              }}
              onTouchEnd={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              保存预设
            </button>
            <div
              style={{
                fontSize: 12,
                color: '#888',
              }}
            >
              已保存 {presets.length} 个预设
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 8,
              scrollbarWidth: 'thin',
            }}
          >
            {presets.length === 0 && (
              <div
                style={{
                  fontSize: 12,
                  color: '#aaa',
                  padding: '20px 0',
                }}
              >
                暂无预设，点击"保存预设"创建您的第一个排版组合
              </div>
            )}
            {presets.map((preset) => {
              const isHovered = hoveredPreset === preset.id;
              return (
                <div
                  key={preset.id}
                  style={{
                    ...presetCardStyleBase,
                    ...(isHovered
                      ? {
                          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                          transform: 'translateY(-2px)',
                        }
                      : {}),
                  }}
                  onMouseEnter={() => setHoveredPreset(preset.id)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  onClick={() => applyPreset(preset.id)}
                  title={`点击应用预设：${preset.name}`}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#2C3E50',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {preset.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      fontSize: 9,
                      color: '#888',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>H{preset.params.headingSize}</span>
                    <span>B{preset.params.bodySize}</span>
                    <span>LH{preset.params.lineHeight.toFixed(2)}</span>
                  </div>
                  {isHovered && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.95)',
                        border: '1px solid #E0E0E0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#E27D60',
                        padding: 0,
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showPresetDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowPresetDialog(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: 24,
              width: 360,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#2C3E50',
                marginBottom: 16,
              }}
            >
              保存预设
            </div>
            <input
              type="text"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              placeholder="输入预设名称"
              autoFocus
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E0E0E0',
                fontSize: 13,
                marginBottom: 16,
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmSavePreset();
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowPresetDialog(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #E0E0E0',
                  background: '#ffffff',
                  color: '#5A6C7D',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmSavePreset}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#E27D60',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

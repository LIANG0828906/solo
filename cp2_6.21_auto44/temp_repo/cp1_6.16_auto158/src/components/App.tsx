import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useCanvasStore, ColorBlock, BLOCKS_PER_PAGE, MAX_BLOCKS } from '@/store/canvasStore';
import { CanvasRenderer } from '@/modules/canvasRenderer';
import { AudioEngine } from '@/modules/audioEngine';
import { HSV, RGB, hsvToRgb, rgbToHex, clamp } from '@/utils/colorUtils';

const BUTTON_STYLE: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  backgroundColor: '#3A3A3A',
  color: '#E0E0E0',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  userSelect: 'none',
};

const BUTTON_HOVER: React.CSSProperties = {
  backgroundColor: '#4A4A4A',
};

interface ColorPaletteProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({ isCollapsed, onToggle, onDragStart }) => {
  const selectedColor = useCanvasStore((s) => s.selectedColor);
  const setSelectedColor = useCanvasStore((s) => s.setSelectedColor);
  const ringRef = useRef<HTMLCanvasElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<'hue' | 'sv' | null>(null);

  const ringDiameter = 200;
  const ringWidth = 30;
  const selectorSize = 30;
  const innerSize = ringDiameter - ringWidth * 2 - 12;

  const rgb = hsvToRgb(selectedColor);
  const hex = rgbToHex(rgb);

  useEffect(() => {
    const canvas = ringRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = ringDiameter * dpr;
    canvas.height = ringDiameter * dpr;
    canvas.style.width = ringDiameter + 'px';
    canvas.style.height = ringDiameter + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = ringDiameter / 2;
    const cy = ringDiameter / 2;
    const outerR = ringDiameter / 2;
    const innerR = outerR - ringWidth;

    for (let a = 0; a < 360; a += 1) {
      const start = ((a - 0.5) * Math.PI) / 180;
      const end = ((a + 0.5) * Math.PI) / 180;
      const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
      const c1 = hsvToRgb({ h: a, s: 1, v: 1 });
      const c2 = hsvToRgb({ h: a, s: 1, v: 0.85 });
      grad.addColorStop(0, `rgb(${c1.r},${c1.g},${c1.b})`);
      grad.addColorStop(1, `rgb(${c2.r},${c2.g},${c2.b})`);
      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(start), cy + innerR * Math.sin(start));
      ctx.arc(cx, cy, outerR, start, end);
      ctx.arc(cx, cy, innerR, end, start, true);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    const hue = selectedColor.h;
    const hueAngle = (hue * Math.PI) / 180;
    const indicatorR = (innerR + outerR) / 2;
    const ix = cx + indicatorR * Math.cos(hueAngle);
    const iy = cy + indicatorR * Math.sin(hueAngle);
    ctx.beginPath();
    ctx.arc(ix, iy, ringWidth / 2 - 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ix, iy, ringWidth / 2 - 6, 0, Math.PI * 2);
    const hueRgb = hsvToRgb({ h: hue, s: 1, v: 1 });
    ctx.strokeStyle = `rgb(${hueRgb.r},${hueRgb.g},${hueRgb.b})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [selectedColor.h]);

  const getPos = (e: MouseEvent | React.MouseEvent) => {
    const canvas = ringRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onRingMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = 'hue';
    updateHue(e);
    e.preventDefault();
  };

  const updateHue = (e: MouseEvent | React.MouseEvent) => {
    const { x, y } = getPos(e);
    const cx = ringDiameter / 2;
    const cy = ringDiameter / 2;
    let angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    setSelectedColor({ ...selectedColor, h: angle });
  };

  const onSVMouseDown = (e: React.MouseEvent) => {
    draggingRef.current = 'sv';
    updateSV(e);
    e.preventDefault();
  };

  const updateSV = (e: MouseEvent | React.MouseEvent) => {
    const inner = innerRef.current!;
    const rect = inner.getBoundingClientRect();
    const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp(1 - (e.clientY - rect.top) / rect.height, 0, 1);
    setSelectedColor({ ...selectedColor, s: px, v: py });
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (draggingRef.current === 'hue') updateHue(e);
      else if (draggingRef.current === 'sv') updateSV(e);
    };
    const onUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  });

  const svBg = `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${selectedColor.h}, 100%, 50%))`;
  const selectorLeft = selectedColor.s * innerSize - selectorSize / 2;
  const selectorTop = (1 - selectedColor.v) * innerSize - selectorSize / 2;

  return (
    <div
      style={{
        position: isCollapsed ? 'absolute' : 'relative',
        top: isCollapsed ? 12 : 0,
        left: isCollapsed ? 12 : 0,
        zIndex: 50,
        width: isCollapsed ? 'auto' : 280,
        minWidth: isCollapsed ? 120 : 280,
        maxHeight: '100%',
        flex: isCollapsed ? '0 0 auto' : '0 0 280px',
        backgroundColor: '#2D2D2D',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
        padding: 20,
        color: '#E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
        border: isCollapsed ? '1px solid #3A3A3A' : 'none',
        borderRadius: isCollapsed ? 8 : 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: isCollapsed ? 'default' : 'move',
        }}
        onMouseDown={onDragStart}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>🎨 调色板</div>
        <button
          onClick={onToggle}
          style={{
            ...BUTTON_STYLE,
            padding: '2px 8px',
            fontSize: 12,
            minWidth: 24,
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, BUTTON_HOVER)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: '#3A3A3A' })}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: ringDiameter, height: ringDiameter }}>
              <canvas
                ref={ringRef}
                onMouseDown={onRingMouseDown}
                style={{
                  display: 'block',
                  cursor: 'crosshair',
                  borderRadius: '50%',
                }}
              />
              <div
                ref={innerRef}
                onMouseDown={onSVMouseDown}
                style={{
                  position: 'absolute',
                  left: ringWidth + 6,
                  top: ringWidth + 6,
                  width: innerSize,
                  height: innerSize,
                  borderRadius: '50%',
                  background: svBg,
                  cursor: 'crosshair',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: selectorLeft,
                    top: selectorTop,
                    width: selectorSize,
                    height: selectorSize,
                    borderRadius: '50%',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 0 4px rgba(0,0,0,0.8), inset 0 0 2px rgba(0,0,0,0.5)',
                    backgroundColor: 'transparent',
                    pointerEvents: 'none',
                    transition: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              backgroundColor: '#383838',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                boxShadow: `0 0 10px rgba(${rgb.r},${rgb.g},${rgb.b},0.5)`,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontSize: 11, color: '#999' }}>HEX</div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>
                {hex}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#999' }}>H</div>
              <div style={{ fontWeight: 600 }}>{Math.round(selectedColor.h)}°</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#999' }}>S</div>
              <div style={{ fontWeight: 600 }}>{Math.round(selectedColor.s * 100)}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#999' }}>V</div>
              <div style={{ fontWeight: 600 }}>{Math.round(selectedColor.v * 100)}%</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface AudioPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const AudioPanel: React.FC<AudioPanelProps> = ({ isCollapsed, onToggle, onDragStart }) => {
  const colorBlocks = useCanvasStore((s) => s.colorBlocks.filter((b) => b.animationState !== 'disappearing'));
  const userVolumes = useCanvasStore((s) => s.userVolumes);
  const setVolume = useCanvasStore((s) => s.setVolume);
  const currentPage = useCanvasStore((s) => s.currentPage);
  const setCurrentPage = useCanvasStore((s) => s.setCurrentPage);
  const isPlaying = useCanvasStore((s) => s.isPlaying);

  const totalPages = Math.max(1, Math.ceil(colorBlocks.length / BLOCKS_PER_PAGE));
  const startIdx = (currentPage - 1) * BLOCKS_PER_PAGE;
  const pageBlocks = colorBlocks.slice(startIdx, startIdx + BLOCKS_PER_PAGE);

  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const toRgbStr = (rgb: RGB) => `rgba(${rgb.r},${rgb.g},${rgb.b},`;
  const toRgbStrSolid = (rgb: RGB) => `rgb(${rgb.r},${rgb.g},${rgb.b})`;
  const grayStr = 'rgba(170,170,170,';
  const graySolid = '#AAAAAA';

  return (
    <div
      style={{
        position: isCollapsed ? 'absolute' : 'relative',
        top: isCollapsed ? 12 : 0,
        right: isCollapsed ? 12 : 0,
        zIndex: 50,
        width: isCollapsed ? 'auto' : 320,
        minWidth: isCollapsed ? 120 : 320,
        maxHeight: '100%',
        flex: isCollapsed ? '0 0 auto' : '0 0 320px',
        backgroundColor: '#2D2D2D',
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.5)',
        padding: 20,
        color: '#E0E0E0',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto',
        border: isCollapsed ? '1px solid #3A3A3A' : 'none',
        borderRadius: isCollapsed ? 8 : 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: isCollapsed ? 'default' : 'move',
        }}
        onMouseDown={onDragStart}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>🔊 音源状态</div>
        <button
          onClick={onToggle}
          style={{
            ...BUTTON_STYLE,
            padding: '2px 8px',
            fontSize: 12,
            minWidth: 24,
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => Object.assign(e.currentTarget.style, BUTTON_HOVER)}
          onMouseLeave={(e) => Object.assign(e.currentTarget.style, { backgroundColor: '#3A3A3A' })}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <div style={{ fontSize: 12, color: '#999' }}>
            激活音源: <span style={{ color: '#E0E0E0', fontWeight: 600 }}>{colorBlocks.length}</span>
            {colorBlocks.length >= MAX_BLOCKS && (
              <span style={{ color: '#F5A623', marginLeft: 8 }}>(已达上限 {MAX_BLOCKS})</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pageBlocks.length === 0 && (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#666',
                  fontSize: 12,
                  borderRadius: 8,
                  backgroundColor: '#262626',
                }}
              >
                在画布上点击生成色块<br />将激活对应音源
              </div>
            )}
            {pageBlocks.map((block, i) => {
              const idx = startIdx + i;
              const c = isPlaying ? block.color : { r: 170, g: 170, b: 170 };
              const gradStart = isPlaying ? toRgbStr(block.color) : grayStr;
              const solid = isPlaying ? toRgbStrSolid(c) : graySolid;
              const volume = userVolumes[block.id] ?? 80;
              return (
                <div
                  key={block.id}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${gradStart}0.25) 0%, ${gradStart}0.05) 100%)`,
                    border: `1px solid ${gradStart}0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: solid,
                      boxShadow: `0 0 6px ${solid}`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#999',
                        marginBottom: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>音源 #{idx + 1}</span>
                      <span style={{ fontFamily: 'monospace' }}>{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={volume}
                      onChange={(e) => setVolume(block.id, parseInt(e.target.value))}
                      style={{
                        width: '100%',
                        height: 4,
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        borderRadius: 2,
                        background: `linear-gradient(to right, ${solid} 0%, ${solid} ${volume}%, #444 ${volume}%, #444 100%)`,
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                  ...BUTTON_STYLE,
                  padding: '4px 12px',
                  fontSize: 12,
                  opacity: currentPage <= 1 ? 0.4 : 1,
                  backgroundColor: hoveredBtn === 'prev' ? '#4A4A4A' : '#3A3A3A',
                }}
                onMouseEnter={() => setHoveredBtn('prev')}
                onMouseLeave={() => setHoveredBtn(null)}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                上一页
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 12,
                  color: '#999',
                  padding: '0 8px',
                }}
              >
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                  ...BUTTON_STYLE,
                  padding: '4px 12px',
                  fontSize: 12,
                  opacity: currentPage >= totalPages ? 0.4 : 1,
                  backgroundColor: hoveredBtn === 'next' ? '#4A4A4A' : '#3A3A3A',
                }}
                onMouseEnter={() => setHoveredBtn('next')}
                onMouseLeave={() => setHoveredBtn(null)}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ActionButton: React.FC<{
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  disabled?: boolean;
}> = ({ label, icon, onClick, variant = 'default', disabled }) => {
  const colors: Record<string, string> = {
    default: '#3A3A3A',
    primary: '#3B82F6',
    danger: '#EF4444',
    warning: '#F59E0B',
  };
  const hoverColors: Record<string, string> = {
    default: '#4A4A4A',
    primary: '#60A5FA',
    danger: '#F87171',
    warning: '#FBBF24',
  };
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      style={{
        ...BUTTON_STYLE,
        backgroundColor: hover ? hoverColors[variant] : colors[variant],
        opacity: disabled ? 0.4 : 1,
        color: variant === 'default' ? '#E0E0E0' : '#FFF',
        boxShadow: variant !== 'default' ? `0 2px 8px ${colors[variant]}55` : 'none',
        transition: 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}
    >
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingBlockRef = useRef<ColorBlock | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didMoveRef = useRef(false);
  const addBlock = useCanvasStore((s) => s.addBlock);
  const updateBlockPosition = useCanvasStore((s) => s.updateBlockPosition);
  const setDragging = useCanvasStore((s) => s.setDragging);
  const clearAllBlocks = useCanvasStore((s) => s.clearAllBlocks);
  const togglePlay = useCanvasStore((s) => s.togglePlay);
  const isPlaying = useCanvasStore((s) => s.isPlaying);
  const showClearConfirm = useCanvasStore((s) => s.showClearConfirm);
  const colorBlocks = useCanvasStore((s) => s.colorBlocks);

  const [isNarrow, setIsNarrow] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [audioCollapsed, setAudioCollapsed] = useState(false);
  const [palettePos, setPalettePos] = useState<{ x: number; y: number } | null>(null);
  const [audioPos, setAudioPos] = useState<{ x: number; y: number } | null>(null);
  const [dragPanel, setDragPanel] = useState<'palette' | 'audio' | null>(null);
  const [dragPanelOffset, setDragPanelOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !canvasWrapRef.current) return;

    const renderer = new CanvasRenderer(canvasRef.current, {
      getMousePosition: () => mousePosRef.current,
    });
    rendererRef.current = renderer;
    renderer.start();

    const engine = new AudioEngine();
    audioEngineRef.current = engine;

    const resizeObserver = new ResizeObserver(() => {
      renderer.resize();
    });
    resizeObserver.observe(canvasWrapRef.current);

    return () => {
      resizeObserver.disconnect();
      renderer.destroy();
      engine.destroy();
    };
  }, []);

  const ensureAudioInit = useCallback(async () => {
    if (audioEngineRef.current) {
      await audioEngineRef.current.init();
    }
  }, []);

  const getCanvasXY = useCallback((e: React.MouseEvent | MouseEvent) => {
    const wrap = canvasWrapRef.current!;
    const rect = wrap.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rect,
    };
  }, []);

  const onCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const { x, y } = getCanvasXY(e);
      mousePosRef.current = { x, y };

      if (draggingBlockRef.current) {
        didMoveRef.current = true;
        const block = draggingBlockRef.current;
        const newX = x - dragOffsetRef.current.x;
        const newY = y - dragOffsetRef.current.y;
        const wrap = canvasWrapRef.current!;
        const rect = wrap.getBoundingClientRect();
        const cx = clamp(newX, block.radius, rect.width - block.radius);
        const cy = clamp(newY, block.radius, rect.height - block.radius);
        updateBlockPosition(block.id, cx, cy);
      }
    },
    [getCanvasXY, updateBlockPosition],
  );

  const onCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      void ensureAudioInit();
      const { x, y } = getCanvasXY(e);
      const renderer = rendererRef.current;
      if (!renderer) return;
      const block = renderer.getBlockAt(x, y);
      if (block) {
        draggingBlockRef.current = block;
        dragOffsetRef.current = { x: x - block.x, y: y - block.y };
        didMoveRef.current = false;
        setDragging(block.id, true);
      } else {
        const wrap = canvasWrapRef.current!;
        const rect = wrap.getBoundingClientRect();
        const boundedX = clamp(x, 40, rect.width - 40);
        const boundedY = clamp(y, 40, rect.height - 40);
        addBlock(boundedX, boundedY);
      }
    },
    [addBlock, ensureAudioInit, getCanvasXY, setDragging],
  );

  useEffect(() => {
    const onUp = () => {
      if (draggingBlockRef.current) {
        const id = draggingBlockRef.current.id;
        setDragging(id, false);
        if (didMoveRef.current && audioEngineRef.current) {
          audioEngineRef.current.triggerReplay(id);
        }
        draggingBlockRef.current = null;
      }
      didMoveRef.current = false;
      setDragPanel(null);
    };
    const onMove = (e: MouseEvent) => {
      if (dragPanel === 'palette' && palettePos) {
        setPalettePos({
          x: Math.max(0, e.clientX - dragPanelOffset.x),
          y: Math.max(0, e.clientY - dragPanelOffset.y),
        });
      } else if (dragPanel === 'audio' && audioPos) {
        setAudioPos({
          x: Math.max(0, e.clientX - dragPanelOffset.x),
          y: Math.max(0, e.clientY - dragPanelOffset.y),
        });
      }
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
    };
  }, [dragPanel, dragPanelOffset, palettePos, audioPos, setDragging]);

  const onCanvasMouseLeave = useCallback(() => {
    mousePosRef.current = null;
  }, []);

  const handleExport = useCallback(() => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.exportImage();
    const a = document.createElement('a');
    a.href = dataUrl;
    const ts = new Date();
    a.download = `emotion-canvas-${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}-${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const startPanelDrag = (panel: 'palette' | 'audio', e: React.MouseEvent) => {
    if (!isNarrow) return;
    const pos = panel === 'palette' ? palettePos : audioPos;
    if (!pos) return;
    const eAny = e as unknown as { clientX: number; clientY: number };
    setDragPanelOffset({
      x: eAny.clientX - pos.x,
      y: eAny.clientY - pos.y,
    });
    setDragPanel(panel);
    e.preventDefault();
  };

  useEffect(() => {
    if (isNarrow) {
      if (!palettePos) setPalettePos({ x: 12, y: 12 });
      if (!audioPos) setAudioPos({ x: window.innerWidth - 332, y: 12 });
    } else {
      setPalettePos(null);
      setAudioPos(null);
    }
  }, [isNarrow]);

  const confirmVisible = useMemo(() => showClearConfirm && colorBlocks.length === 0, [showClearConfirm, colorBlocks]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#1E1E1E',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          ...(palettePos ? { position: 'absolute', zIndex: 100, left: palettePos.x, top: palettePos.y, transform: 'none' } : {}),
          display: 'contents',
        }}
      >
        <ColorPalette
          isCollapsed={paletteCollapsed}
          onToggle={() => setPaletteCollapsed((v) => !v)}
          onDragStart={(e) => palettePos && startPanelDrag('palette', e)}
        />
      </div>

      <div
        ref={canvasWrapRef}
        style={{
          flex: 1,
          position: 'relative',
          minWidth: 0,
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#1E1E1E',
        }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseLeave={onCanvasMouseLeave}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            cursor: draggingBlockRef.current ? 'grabbing' : 'crosshair',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            display: 'flex',
            gap: 10,
            zIndex: 10,
            pointerEvents: 'auto',
          }}
        >
          <ActionButton label="清空" icon="🗑️" variant="danger" onClick={clearAllBlocks} />
          <ActionButton label="导出" icon="💾" variant="primary" onClick={handleExport} />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
          }}
        >
          <ActionButton
            label={isPlaying ? '暂停' : '播放'}
            icon={isPlaying ? '⏸️' : '▶️'}
            variant={isPlaying ? 'default' : 'warning'}
            onClick={() => {
              void ensureAudioInit();
              togglePlay();
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            pointerEvents: 'none',
            fontSize: 11,
            color: '#555',
          }}
        >
          <span>点击画布生成色块</span>
          <span>拖拽色块调整位置</span>
          <span>上限 {MAX_BLOCKS} 个</span>
        </div>

        {confirmVisible && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#2D2D2D',
              color: '#E0E0E0',
              padding: '20px 36px',
              borderRadius: 10,
              border: '1px solid #3A3A3A',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              fontSize: 14,
              fontWeight: 500,
              zIndex: 200,
              animation: 'pop 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            ✅ 画布已清空
          </div>
        )}
      </div>

      <div
        style={{
          ...(audioPos ? { position: 'absolute', zIndex: 100, left: audioPos.x, top: audioPos.y, transform: 'none' } : {}),
          display: 'contents',
        }}
      >
        <AudioPanel
          isCollapsed={audioCollapsed}
          onToggle={() => setAudioCollapsed((v) => !v)}
          onDragStart={(e) => audioPos && startPanelDrag('audio', e)}
        />
      </div>

      <style>{`
        @keyframes pop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.6);
          transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #FFFFFF;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 4px rgba(0,0,0,0.6);
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </div>
  );
};

export default App;

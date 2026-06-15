import React, { useEffect, useRef, useState, useCallback } from 'react';
import EditorCanvas from './modules/editor/EditorCanvas';
import Timeline from './modules/animation/Timeline';
import ExportPanel from './modules/export/ExportPanel';
import {
  PixelArray,
  DEFAULT_PALETTE,
  createDefaultWalkFrames,
  deepClonePixels,
  renderPixelsToCanvas,
  CANVAS_SIZE,
} from './utils/pixelUtils';

const PREVIEW_CELL = 10;
const PREVIEW_SIZE = CANVAS_SIZE * PREVIEW_CELL;

const App: React.FC = () => {
  const [frames, setFrames] = useState<PixelArray[]>(() => createDefaultWalkFrames());
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [frameInterval, setFrameInterval] = useState(200);
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentColor, setCurrentColor] = useState('#3498db');
  const [brushSize, setBrushSize] = useState<1 | 3>(1);
  const [symmetricMode, setSymmetricMode] = useState(false);
  const [palette, setPalette] = useState<string[]>([...DEFAULT_PALETTE]);

  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [previewOpacity, setPreviewOpacity] = useState(1);
  const lastFrameRef = useRef(currentFrameIndex);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const currentPixels = frames[currentFrameIndex] || createDefaultWalkFrames()[0];

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (lastFrameRef.current !== currentFrameIndex) {
      setPreviewOpacity(0);
      timeoutId = setTimeout(() => setPreviewOpacity(1), 10);
      lastFrameRef.current = currentFrameIndex;
    }
    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [currentFrameIndex]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    renderPixelsToCanvas(ctx, currentPixels, PREVIEW_CELL);
  }, [currentPixels]);

  const handlePixelsChange = useCallback(
    (newPixels: PixelArray) => {
      setFrames((prev) => {
        const next = [...prev];
        next[currentFrameIndex] = newPixels;
        return next;
      });
    },
    [currentFrameIndex]
  );

  const handleCustomPaletteColor = (idx: number, color: string) => {
    setPalette((prev) => {
      const next = [...prev];
      next[idx] = color;
      return next;
    });
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes slideArrow {
          0% { transform: translateX(0); }
          50% { transform: translateX(3px); }
          100% { transform: translateX(0); }
        }
        @keyframes breathe {
          0%, 100% { box-shadow: 0 0 4px #00d4ff, inset 0 0 2px rgba(0,212,255,0.1); }
          50% { box-shadow: 0 0 14px rgba(0,212,255,0.8), inset 0 0 8px rgba(0,212,255,0.2); }
        }
        button:hover {
          border-color: #00d4ff !important;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.4), inset 0 0 6px rgba(0, 212, 255, 0.08) !important;
        }
        input[type="color"]:hover {
          border-color: #00d4ff !important;
          box-shadow: 0 0 8px rgba(0,212,255,0.5) !important;
        }
        .frame-selected-anim {
          animation: breathe 2s ease-in-out infinite;
        }
      `}</style>

      <div style={styles.app}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.brand}>
            <span style={styles.brandLogo}>◆</span>
            <span style={styles.brandText}>PIXEL RPG MAKER</span>
          </div>
          <div style={{ flex: 1 }} />
          <button
            style={styles.exportBtn}
            onClick={() => setShowExportModal(true)}
          >
            <span style={styles.exportIcon}>⬇</span>
            导出精灵表
          </button>
        </header>

        <div style={styles.mainContent}>
          {/* Left Panel */}
          <aside
            style={{
              ...styles.leftPanel,
              ...(leftPanelCollapsed ? styles.leftPanelCollapsed : {}),
            }}
          >
            {!leftPanelCollapsed && (
              <div style={styles.panelContent}>
                <div style={styles.panelSection}>
                  <div style={styles.sectionTitle}>画笔粗细</div>
                  <div style={styles.brushRow}>
                    <button
                      style={{
                        ...styles.brushBtn,
                        ...(brushSize === 1 ? styles.brushBtnActive : {}),
                      }}
                      onClick={() => setBrushSize(1)}
                    >
                      <div style={{ width: 4, height: 4, background: '#00d4ff', borderRadius: 1 }} />
                      <span style={styles.brushLabel}>1px</span>
                    </button>
                    <button
                      style={{
                        ...styles.brushBtn,
                        ...(brushSize === 3 ? styles.brushBtnActive : {}),
                      }}
                      onClick={() => setBrushSize(3)}
                    >
                      <div style={{ width: 10, height: 10, background: '#00d4ff', borderRadius: 2 }} />
                      <span style={styles.brushLabel}>3px</span>
                    </button>
                  </div>
                </div>

                <div style={styles.panelSection}>
                  <div style={styles.sectionTitle}>当前颜色</div>
                  <div style={styles.currentColorRow}>
                    <div
                      style={{
                        ...styles.currentColorSwatch,
                        background: currentColor,
                        boxShadow: `0 0 12px ${currentColor}aa`,
                      }}
                    />
                    <span style={styles.currentColorHex}>{currentColor.toUpperCase()}</span>
                    <label style={styles.colorPickerLabel} title="自定义颜色">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setCurrentColor(e.target.value)}
                        style={styles.hiddenColorPicker}
                      />
                      <span style={styles.colorPickerBtn}>🎨</span>
                    </label>
                  </div>
                </div>

                <div style={styles.panelSection}>
                  <div style={styles.sectionTitle}>调色板 (16色)</div>
                  <div style={styles.paletteGrid}>
                    {palette.map((color, idx) => (
                      <label key={idx} style={styles.paletteItemWrapper}>
                        <div
                          style={{
                            ...styles.paletteItem,
                            background: color,
                            ...(currentColor.toLowerCase() === color.toLowerCase()
                              ? styles.paletteItemActive
                              : {}),
                          }}
                          onClick={() => setCurrentColor(color)}
                          title={`点击选择 ${color}`}
                        />
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleCustomPaletteColor(idx, e.target.value)}
                          style={styles.paletteColorInput}
                          title="自定义此颜色"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.panelSection}>
                  <div style={styles.sectionTitle}>绘制模式</div>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      ...(symmetricMode ? styles.toggleBtnActive : {}),
                    }}
                    onClick={() => setSymmetricMode((v) => !v)}
                  >
                    <span style={styles.toggleIcon}>
                      {symmetricMode ? '⇋' : '→'}
                    </span>
                    <span>
                      对称绘制 {symmetricMode ? '开' : '关'}
                    </span>
                    <div
                      style={{
                        ...styles.toggleSwitch,
                        ...(symmetricMode ? styles.toggleSwitchOn : {}),
                      }}
                    >
                      <div
                        style={{
                          ...styles.toggleKnob,
                          ...(symmetricMode ? { left: 18 } : {}),
                        }}
                      />
                    </div>
                  </button>
                  <div style={styles.symmetricHint}>
                    {symmetricMode
                      ? '垂直镜像同步绘制左右'
                      : '标准单像素绘制模式'}
                  </div>
                </div>

                <div style={styles.panelSection}>
                  <div style={styles.sectionTitle}>快捷操作</div>
                  <div style={styles.shortcutBtns}>
                    <button
                      style={styles.shortcutBtn}
                      onClick={() =>
                        handlePixelsChange(deepClonePixels(createDefaultWalkFrames()[0]))
                      }
                    >
                      🧍 重置角色
                    </button>
                    <button
                      style={styles.shortcutBtn}
                      onClick={() => {
                        const cleared = deepClonePixels(currentPixels);
                        for (let y = 0; y < cleared.length; y++)
                          for (let x = 0; x < cleared[y].length; x++)
                            cleared[y][x] = null;
                        handlePixelsChange(cleared);
                      }}
                    >
                      🗑 清空当前帧
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Collapse toggle */}
            <button
              style={{
                ...styles.collapseBtn,
                ...(leftPanelCollapsed ? styles.collapseBtnFolded : {}),
              }}
              onClick={() => setLeftPanelCollapsed((v) => !v)}
              title={leftPanelCollapsed ? '展开工具面板' : '收起工具面板'}
            >
              <span
                style={{
                  ...styles.collapseArrow,
                  ...(leftPanelCollapsed ? styles.collapseArrowRight : {}),
                }}
              >
                {leftPanelCollapsed ? '▶' : '◀'}
              </span>
            </button>
          </aside>

          {/* Center Area */}
          <main style={styles.centerArea}>
            <div style={styles.workspace}>
              {/* Editor Section */}
              <section style={styles.editorSection}>
                <div style={styles.sectionHeader}>
                  <span style={styles.sectionTag}>EDIT</span>
                  <span style={styles.sectionName}>像素编辑器</span>
                  <span style={styles.sectionFrameBadge}>
                    帧 {currentFrameIndex + 1} / {frames.length}
                  </span>
                </div>
                <div style={styles.editorWrapper}>
                  <EditorCanvas
                    pixels={currentPixels}
                    currentColor={currentColor}
                    brushSize={brushSize}
                    symmetricMode={symmetricMode}
                    onPixelsChange={handlePixelsChange}
                    onColorPick={(c) => setCurrentColor(c)}
                  />
                </div>
              </section>

              {/* Preview Section */}
              <section style={styles.previewSection}>
                <div style={styles.sectionHeader}>
                  <span style={{ ...styles.sectionTag, background: 'rgba(255,215,64,0.15)', color: '#ffd740' }}>
                    LIVE
                  </span>
                  <span style={styles.sectionName}>动画预览</span>
                  {isPlaying && (
                    <span style={styles.playingBadge}>
                      <span style={styles.playingDot} />
                      播放中
                    </span>
                  )}
                </div>
                <div style={styles.previewWrapper}>
                  <div
                    style={{
                      ...styles.previewCanvasHolder,
                      opacity: previewOpacity,
                      transition: 'opacity 0.1s ease',
                    }}
                  >
                    <canvas
                      ref={previewCanvasRef}
                      width={PREVIEW_SIZE}
                      height={PREVIEW_SIZE}
                      style={styles.previewCanvas}
                    />
                  </div>
                  <div style={styles.previewInfo}>
                    <div style={styles.previewInfoRow}>
                      <span style={styles.previewInfoLabel}>当前帧</span>
                      <span style={styles.previewInfoValue}>
                        {currentFrameIndex + 1}
                      </span>
                    </div>
                    <div style={styles.previewInfoRow}>
                      <span style={styles.previewInfoLabel}>分辨率</span>
                      <span style={styles.previewInfoValue}>
                        {CANVAS_SIZE} × {CANVAS_SIZE}
                      </span>
                    </div>
                    <div style={styles.previewInfoRow}>
                      <span style={styles.previewInfoLabel}>FPS</span>
                      <span style={styles.previewInfoValue}>
                        {Math.round(1000 / frameInterval)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Timeline */}
            <Timeline
              frames={frames}
              currentFrameIndex={currentFrameIndex}
              frameInterval={frameInterval}
              isPlaying={isPlaying}
              onFramesChange={setFrames}
              onCurrentFrameChange={setCurrentFrameIndex}
              onFrameIntervalChange={setFrameInterval}
              onIsPlayingChange={setIsPlaying}
            />
          </main>
        </div>
      </div>

      {showExportModal && (
        <ExportPanel
          frames={frames}
          frameInterval={frameInterval}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </>
  );
};

const glassTexture = `
  linear-gradient(145deg, rgba(50, 50, 60, 0.72) 0%, rgba(32, 32, 40, 0.82) 100%)
`;

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'JetBrains Mono', monospace",
    position: 'relative',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    gap: 16,
    borderBottom: '1px solid rgba(0, 212, 255, 0.2)',
    background: 'linear-gradient(90deg, rgba(0,212,255,0.05) 0%, rgba(42,42,42,0.8) 50%)',
    zIndex: 5,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    color: '#00d4ff',
    fontSize: 22,
    textShadow: '0 0 10px rgba(0, 212, 255, 0.8)',
  },
  brandText: {
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 2.5,
    color: '#e0e0e0',
    fontFamily: "'Press Start 2P', 'JetBrains Mono', monospace",
    textShadow: '0 0 20px rgba(0, 212, 255, 0.4)',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 20px',
    border: '1px solid rgba(0, 212, 255, 0.5)',
    borderRadius: 6,
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.18), rgba(0, 212, 255, 0.04))',
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
    boxShadow: '0 0 14px rgba(0, 212, 255, 0.2)',
  },
  exportIcon: {
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
    position: 'relative',
  },
  leftPanel: {
    width: 280,
    minWidth: 280,
    position: 'relative',
    background: glassTexture,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderRight: '1px solid rgba(0, 212, 255, 0.2)',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.35)',
    transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.35s',
    overflow: 'hidden',
    flexShrink: 0,
  },
  leftPanelCollapsed: {
    width: 24,
    minWidth: 24,
  },
  panelContent: {
    padding: '18px 16px 24px',
    height: '100%',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  collapseBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    right: -14,
    width: 28,
    height: 56,
    border: '1px solid rgba(0, 212, 255, 0.4)',
    borderLeft: 'none',
    borderRadius: '0 8px 8px 0',
    background: 'linear-gradient(90deg, rgba(40,40,48,0.95), rgba(50,50,58,0.9))',
    color: '#00d4ff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    boxShadow: '2px 0 14px rgba(0,0,0,0.5)',
    transition: 'all 0.2s ease',
  },
  collapseBtnFolded: {
    right: -14,
  },
  collapseArrow: {
    fontSize: 10,
    display: 'inline-block',
    transition: 'transform 0.3s ease',
    animation: 'slideArrow 1.6s ease-in-out infinite',
  },
  collapseArrowRight: {
    animationDirection: 'reverse',
  },
  panelSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 10.5,
    letterSpacing: 2,
    color: '#00d4ff',
    textTransform: 'uppercase',
    paddingBottom: 6,
    borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
  },
  brushRow: {
    display: 'flex',
    gap: 10,
  },
  brushBtn: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    background: 'rgba(22, 22, 30, 0.6)',
    cursor: 'pointer',
    color: '#aaa',
    transition: 'all 0.2s ease',
  },
  brushBtnActive: {
    borderColor: '#00d4ff',
    boxShadow: '0 0 12px rgba(0, 212, 255, 0.35), inset 0 0 10px rgba(0, 212, 255, 0.1)',
    background: 'rgba(0, 212, 255, 0.08)',
    color: '#00d4ff',
  },
  brushLabel: {
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
  },
  currentColorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    background: 'rgba(22, 22, 30, 0.6)',
    borderRadius: 8,
    border: '1px solid rgba(0, 212, 255, 0.15)',
  },
  currentColorSwatch: {
    width: 34,
    height: 34,
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    flexShrink: 0,
  },
  currentColorHex: {
    flex: 1,
    fontSize: 13,
    color: '#c0c0c0',
    fontWeight: 600,
    letterSpacing: 1,
  },
  colorPickerLabel: {
    cursor: 'pointer',
    position: 'relative',
  },
  hiddenColorPicker: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
    pointerEvents: 'none',
  },
  colorPickerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 6,
    border: '1px solid rgba(0, 212, 255, 0.4)',
    background: 'rgba(0, 212, 255, 0.08)',
    fontSize: 14,
    transition: 'all 0.2s ease',
  },
  paletteGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: 7,
  },
  paletteItemWrapper: {
    position: 'relative',
    display: 'block',
    cursor: 'pointer',
    aspectRatio: '1 / 1',
  },
  paletteItem: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    border: '1.5px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.15s ease',
  },
  paletteItemActive: {
    borderColor: '#00d4ff',
    boxShadow: '0 0 0 2px #00d4ff44, 0 0 12px rgba(0, 212, 255, 0.6)',
    transform: 'scale(1.08)',
  },
  paletteColorInput: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer',
    borderRadius: 5,
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 8,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(22, 22, 30, 0.6)',
    color: '#aaa',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
  },
  toggleBtnActive: {
    borderColor: '#00d4ff',
    background: 'rgba(0, 212, 255, 0.08)',
    color: '#00d4ff',
    boxShadow: '0 0 12px rgba(0, 212, 255, 0.25)',
  },
  toggleIcon: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  toggleSwitch: {
    marginLeft: 'auto',
    width: 34,
    height: 18,
    borderRadius: 9,
    background: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    transition: 'background 0.2s ease',
  },
  toggleSwitchOn: {
    background: 'linear-gradient(90deg, #00d4ff, #0099cc)',
  },
  toggleKnob: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    transition: 'left 0.2s ease',
  },
  symmetricHint: {
    fontSize: 11,
    color: '#666',
    paddingLeft: 4,
    marginTop: 2,
  },
  shortcutBtns: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  shortcutBtn: {
    padding: '10px 12px',
    borderRadius: 6,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(22, 22, 30, 0.5)',
    color: '#b0b0b0',
    fontSize: 12,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
  },
  centerArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  workspace: {
    flex: 1,
    display: 'flex',
    gap: 24,
    padding: '24px 28px',
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  editorSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 2px',
  },
  sectionTag: {
    fontSize: 9,
    letterSpacing: 2,
    padding: '3px 8px',
    borderRadius: 3,
    background: 'rgba(0, 212, 255, 0.15)',
    color: '#00d4ff',
    fontWeight: 700,
  },
  sectionName: {
    fontSize: 13,
    color: '#d0d0d0',
    fontWeight: 600,
    letterSpacing: 1,
  },
  sectionFrameBadge: {
    marginLeft: 'auto',
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 10,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#888',
  },
  playingBadge: {
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    padding: '3px 10px',
    borderRadius: 10,
    background: 'rgba(255, 215, 64, 0.1)',
    border: '1px solid rgba(255, 215, 64, 0.3)',
    color: '#ffd740',
  },
  playingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#ffd740',
    animation: 'pulse 1s ease-in-out infinite',
    boxShadow: '0 0 6px #ffd740',
  },
  editorWrapper: {
    padding: 20,
    borderRadius: 12,
    background: glassTexture,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
  },
  previewWrapper: {
    padding: 20,
    borderRadius: 12,
    background: glassTexture,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
    display: 'flex',
    gap: 18,
    alignItems: 'flex-start',
  },
  previewCanvasHolder: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    border: '1px solid #00d4ff',
    borderRadius: 6,
    overflow: 'hidden',
    boxShadow:
      'inset 0 0 24px rgba(0, 212, 255, 0.12), 0 0 18px rgba(0, 212, 255, 0.2)',
    background:
      'repeating-conic-gradient(#181820 0% 25%, #1c1c24 0% 50%) 0 0 / 12px 12px',
  },
  previewCanvas: {
    display: 'block',
    // @ts-ignore - cross-browser pixel rendering
    imageRendering: 'pixelated',
  },
  previewInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingTop: 4,
  },
  previewInfoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 90,
    padding: '10px 12px',
    borderRadius: 6,
    background: 'rgba(18, 18, 26, 0.6)',
    border: '1px solid rgba(0, 212, 255, 0.12)',
  },
  previewInfoLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  previewInfoValue: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: 600,
  },
};

export default App;

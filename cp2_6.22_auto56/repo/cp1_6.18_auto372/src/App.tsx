import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import WebFont from 'webfontloader';
import type { LayoutScheme, EditorState, EditorAction, ColorTheme, DecorElement } from './types';
import { AVAILABLE_FONTS, COLOR_THEMES } from './types';
import { generateLayoutSchemes } from './layoutEngine';
import { exportToPng } from './exportImage';
import ColorPicker from './components/ColorPicker';
import PreviewCard from './components/PreviewCard';

const initialState: EditorState = {
  text: '',
  fontFamily: AVAILABLE_FONTS[0].family,
  fontSize: 64,
  textColor: '#333333',
  backgroundColor: '#FFFFFF',
  position: { x: 540, y: 540 },
  rotation: 0,
  opacity: 1,
  accentColor: '#FF8C42',
  decorElements: [],
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_FROM_SCHEME': {
      const s = action.payload;
      return {
        text: s.content,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        textColor: s.textColor,
        backgroundColor: s.backgroundColor,
        position: { ...s.textPosition },
        rotation: s.rotation,
        opacity: s.opacity,
        accentColor: s.accentColor || '#FF8C42',
        decorElements: s.decorElements || [],
      };
    }
    case 'UPDATE_POSITION':
      return { ...state, position: { ...action.payload } };
    case 'UPDATE_FONT_FAMILY':
      return { ...state, fontFamily: action.payload };
    case 'UPDATE_FONT_SIZE':
      return { ...state, fontSize: action.payload };
    case 'UPDATE_TEXT_COLOR':
      return { ...state, textColor: action.payload };
    case 'UPDATE_BACKGROUND_COLOR':
      return { ...state, backgroundColor: action.payload };
    case 'UPDATE_ROTATION':
      return { ...state, rotation: action.payload };
    case 'UPDATE_OPACITY':
      return { ...state, opacity: action.payload };
    case 'APPLY_THEME': {
      const t = action.payload;
      return {
        ...state,
        backgroundColor: t.suggestedBg,
        textColor: t.suggestedText,
        fontSize: 64,
        opacity: 1,
        rotation: 0,
        accentColor: t.primary,
      };
    }
    default:
      return state;
  }
}

function DecorRenderCanvas({ elements }: { elements: DecorElement[] }) {
  return (
    <>
      {elements.map((el, idx) => {
        const common: React.CSSProperties = {
          position: 'absolute',
          left: el.position.x,
          top: el.position.y,
          width: el.size.width,
          height: el.size.height,
          background: el.color,
          transform: `translate(-50%, -50%)${el.rotation ? ` rotate(${el.rotation}deg)` : ''}`,
          borderRadius: el.type === 'circle' ? '50%' : 0,
          opacity: 0.7,
          pointerEvents: 'none',
        };
        return <div key={idx} style={common} />;
      })}
    </>
  );
}

function ThemeCard({ theme, onClick }: { theme: ColorTheme; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="theme-card"
      style={{
        width: 60,
        height: 60,
        borderRadius: 8,
        padding: 6,
        background: '#FFF',
        border: '1px solid #E0E0E0',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: 10, color: '#555', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
        {theme.name}
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: theme.primary }} />
        <div style={{ width: 14, height: 14, borderRadius: 3, background: theme.secondary }} />
        <div style={{ width: 14, height: 14, borderRadius: 3, background: theme.accent }} />
      </div>
    </div>
  );
}

export default function App() {
  const [inputText, setInputText] = useState<string>('床前明月光，疑是地上霜。举头望明月，低头思故乡。');
  const [schemes, setSchemes] = useState<LayoutScheme[]>([]);
  const [editorState, dispatch] = useReducer(editorReducer, initialState);
  const [currentView, setCurrentView] = useState<'input' | 'editor'>('input');
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [showFontPanel, setShowFontPanel] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; dragging: boolean }>({
    startX: 0, startY: 0, origX: 0, origY: 0, dragging: false,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    WebFont.load({
      google: {
        families: ['Noto Serif SC:400,700', 'ZCOOL QingKe HuangYou', 'Ma Shan Zheng', 'Sixtyfour'],
      },
      active: () => setFontsLoaded(true),
      inactive: () => setFontsLoaded(true),
      timeout: 5000,
    });
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      let scale = 1;
      if (w < 500) {
        scale = Math.max(0.3, (w - 48) / 1080);
      } else if (w < 800) {
        const avail = Math.min(w - 48, 1080);
        scale = avail / 1080;
      } else {
        const avail = Math.min(654, 1080);
        scale = avail / 1080;
      }
      setCanvasScale(scale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    const text = inputText.slice(0, 200);
    const generated = generateLayoutSchemes(text);
    setSchemes(generated);
  };

  const handleSelectScheme = (scheme: LayoutScheme) => {
    setSelectedSchemeId(scheme.id);
    dispatch({
      type: 'SET_FROM_SCHEME',
      payload: { ...scheme, content: inputText.slice(0, 200) },
    });
    setCurrentView('editor');
    setShowFontPanel(false);
  };

  const handleBackToInput = () => {
    setCurrentView('input');
    setShowFontPanel(false);
  };

  const handleTextMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scale = rect.width / 1080;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: editorState.position.x,
      origY: editorState.position.y,
      dragging: true,
    };
    const handleMove = (ev: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = (ev.clientX - dragRef.current.startX) / scale;
      const dy = (ev.clientY - dragRef.current.startY) / scale;
      const nx = Math.max(50, Math.min(1030, dragRef.current.origX + dx));
      const ny = Math.max(50, Math.min(1030, dragRef.current.origY + dy));
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        dispatch({ type: 'UPDATE_POSITION', payload: { x: nx, y: ny } });
      });
    };
    const handleUp = () => {
      dragRef.current.dragging = false;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportToPng(canvasRef.current, { ...editorState, content: editorState.text });
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 300);
    }
  }, [editorState, isExporting]);

  const bgStyle: React.CSSProperties = editorState.backgroundColor.startsWith('linear')
    ? { background: editorState.backgroundColor }
    : { background: editorState.backgroundColor };

  const canvasWrapperHeight = 1080 * canvasScale;

  return (
    <div style={{ minHeight: '100vh', background: '#F0ECE3' }}>
      <div
        style={{
          height: 4,
          background: 'linear-gradient(90deg, #FF8C42, #E67E22, #AED6F1, #1A5276)',
        }}
      />
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '32px 24px 64px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#222',
              marginBottom: 8,
              letterSpacing: 1,
            }}
          >
            文字可视化排版
          </h1>
          <p style={{ fontSize: 14, color: '#777' }}>
            输入诗句、名言或歌词，一键生成社交媒体分享图
          </p>
        </div>

        {currentView === 'input' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 200))}
                placeholder="在此输入文字（最多200字符）..."
                style={{
                  width: '100%',
                  maxWidth: 500,
                  height: 200,
                  padding: '16px 18px',
                  borderRadius: 12,
                  background: '#F9F9F9',
                  border: '1px solid #E5E1D8',
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: '#333',
                }}
                maxLength={200}
              />
              <div
                style={{
                  alignSelf: 'flex-end',
                  marginTop: 6,
                  fontSize: 12,
                  color: '#999',
                }}
              >
                {inputText.length}/200
              </div>
              <button
                onClick={handleGenerate}
                disabled={!inputText.trim()}
                className="primary-btn"
                style={{
                  marginTop: 16,
                  padding: '12px 40px',
                  borderRadius: 8,
                  background: '#333',
                  color: '#FFF',
                  fontSize: 15,
                  fontWeight: 500,
                  opacity: inputText.trim() ? 1 : 0.5,
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                生成排版方案
              </button>
            </div>

            {schemes.length > 0 && (
              <div style={{ marginTop: 24, width: '100%' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))',
                    gap: 16,
                    justifyItems: 'center',
                    maxWidth: 572,
                    margin: '0 auto',
                  }}
                  className="preview-grid"
                >
                  {schemes.map((scheme) => (
                    <PreviewCard
                      key={scheme.id}
                      scheme={scheme}
                      text={inputText.slice(0, 200)}
                      onClick={() => handleSelectScheme(scheme)}
                      selected={selectedSchemeId === scheme.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <button
              onClick={handleBackToInput}
              className="back-btn"
              style={{
                marginBottom: 16,
                padding: '8px 16px',
                borderRadius: 6,
                background: 'transparent',
                fontSize: 13,
                color: '#666',
                border: '1px solid #D0CCC2',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
              }}
            >
              ← 返回输入
            </button>

            <div className="editor-layout">
              <div
                className="canvas-column"
                style={{
                  minWidth: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 1080 * canvasScale,
                    height: canvasWrapperHeight,
                    position: 'relative',
                  }}
                >
                  <div
                    ref={canvasRef}
                    style={{
                      width: 1080,
                      height: 1080,
                      background: '#FFFFFF',
                      border: '1px solid #EAEAEA',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      overflow: 'hidden',
                      transformOrigin: 'top left',
                      transform: `scale(${canvasScale})`,
                      ...bgStyle,
                    }}
                  >
                    <DecorRenderCanvas elements={editorState.decorElements} />
                    <div
                      onMouseDown={handleTextMouseDown}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFontPanel((v) => !v);
                      }}
                      style={{
                        position: 'absolute',
                        left: editorState.position.x,
                        top: editorState.position.y,
                        transform: `translate(-50%, -50%) translateZ(0) rotate(${editorState.rotation}deg)`,
                        fontFamily: editorState.fontFamily,
                        fontSize: editorState.fontSize,
                        color: editorState.textColor,
                        opacity: editorState.opacity,
                        maxWidth: 960,
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        textAlign: 'center',
                        cursor: 'move',
                        userSelect: 'none',
                        padding: '8px 12px',
                        willChange: 'transform',
                      }}
                    >
                      {editorState.text || '请输入文字'}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="params-column"
                style={{
                  minWidth: 280,
                  background: '#F5F5F5',
                  borderRadius: 12,
                  padding: 20,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: '#555',
                    fontWeight: 500,
                    marginBottom: 12,
                  }}
                >
                  配色主题
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                  {COLOR_THEMES.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      onClick={() => dispatch({ type: 'APPLY_THEME', payload: theme })}
                    />
                  ))}
                </div>

                <div style={{ height: 1, background: '#E0E0E0', margin: '16px 0' }} />

                {!editorState.backgroundColor.startsWith('linear') && (
                  <ColorPicker
                    label="背景颜色"
                    value={/^#/.test(editorState.backgroundColor) ? editorState.backgroundColor : '#FFFFFF'}
                    onChange={(v) => dispatch({ type: 'UPDATE_BACKGROUND_COLOR', payload: v })}
                  />
                )}

                <ColorPicker
                  label="文字颜色"
                  value={editorState.textColor}
                  onChange={(v) => dispatch({ type: 'UPDATE_TEXT_COLOR', payload: v })}
                />

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>字号</span>
                    <span style={{ fontFamily: 'monospace', color: '#888' }}>{editorState.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={32}
                    max={96}
                    step={4}
                    value={editorState.fontSize}
                    onChange={(e) => dispatch({ type: 'UPDATE_FONT_SIZE', payload: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>透明度</span>
                    <span style={{ fontFamily: 'monospace', color: '#888' }}>{editorState.opacity.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={editorState.opacity}
                    onChange={(e) => dispatch({ type: 'UPDATE_OPACITY', payload: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span>旋转角度</span>
                    <span style={{ fontFamily: 'monospace', color: '#888' }}>{editorState.rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={editorState.rotation}
                    onChange={(e) => dispatch({ type: 'UPDATE_ROTATION', payload: Number(e.target.value) })}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ height: 1, background: '#E0E0E0', margin: '16px 0' }} />

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: '#555', fontWeight: 500, marginBottom: 8 }}>
                    字体选择（点击画布文字切换）
                  </div>
                  {showFontPanel && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                      {AVAILABLE_FONTS.map((f) => (
                        <button
                          key={f.family}
                          onClick={() => {
                            dispatch({ type: 'UPDATE_FONT_FAMILY', payload: f.family });
                            setShowFontPanel(false);
                          }}
                          style={{
                            padding: '8px 6px',
                            borderRadius: 6,
                            border: editorState.fontFamily === f.family ? '1px solid #FF8C42' : '1px solid #DDD',
                            background: '#FFF',
                            fontFamily: f.family,
                            color: '#333',
                            transition: 'all 0.2s ease-in-out',
                          }}
                        >
                          <div style={{ fontSize: 8, marginBottom: 4 }}>{f.sample}</div>
                          <div style={{ fontSize: 10, color: '#888', fontFamily: 'inherit' }}>
                            {f.label.split(' ')[0]}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="download-btn"
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      borderRadius: 8,
                      background: '#333',
                      color: '#FFF',
                      fontSize: 15,
                      fontWeight: 500,
                      opacity: isExporting ? 0.6 : 1,
                      cursor: isExporting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isExporting ? '导出中...' : '下载 PNG 图片'}
                  </button>
                  {!fontsLoaded && (
                    <div style={{ fontSize: 11, color: '#999', textAlign: 'center', marginTop: 8 }}>
                      字体加载中...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .editor-layout {
          display: flex;
          gap: 20px;
          flex-wrap: nowrap;
        }
        .canvas-column {
          flex: 0 0 70%;
        }
        .params-column {
          flex: 0 0 calc(30% - 20px);
        }
        @media (max-width: 800px) {
          .editor-layout {
            flex-direction: column;
          }
          .canvas-column,
          .params-column {
            flex: 0 0 auto;
          }
        }
        @media (max-width: 560px) {
          .preview-grid {
            grid-template-columns: repeat(2, minmax(160px, 1fr)) !important;
          }
        }
        @media (max-width: 380px) {
          .preview-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .primary-btn:hover {
          background: #555 !important;
        }
        .download-btn:hover {
          background: #555 !important;
        }
        .back-btn:hover {
          background: #E8E4D9 !important;
        }
        .theme-card:hover {
          border-color: #BBB !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

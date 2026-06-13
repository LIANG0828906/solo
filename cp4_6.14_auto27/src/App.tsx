import React, { useState, useMemo, useCallback, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import ColorGrid from './ColorGrid';
import PreviewPanel from './PreviewPanel';
import { ThemeColors, generateDerivedColors, generateCssVariables, hexToRgbString } from './utils';

const DEFAULT_COLORS: ThemeColors = {
  primary: '#e94560',
  secondary: '#0f3460',
  background: '#1a1a2e',
  text: '#e0e0e0',
};

function App() {
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [showExport, setShowExport] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const derivedColors = useMemo(() => generateDerivedColors(colors), [colors]);

  const derivedMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of derivedColors) {
      map[d.name] = d.value;
    }
    return map;
  }, [derivedColors]);

  const cssCode = useMemo(() => generateCssVariables(colors, derivedColors), [colors, derivedColors]);

  const handleColorChange = useCallback((key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(cssCode).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  }, [cssCode]);

  const colorPickerItems = [
    { key: 'primary', label: '主色' },
    { key: 'secondary', label: '辅色' },
    { key: 'background', label: '背景色' },
    { key: 'text', label: '文字色' },
  ];

  const controlPanel = (
    <div style={{
      width: isMobile ? '100%' : 320,
      height: isMobile ? 'auto' : '100vh',
      backgroundColor: '#16213e',
      borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)',
      borderBottom: isMobile ? '1px solid rgba(255,255,255,0.06)' : 'none',
      padding: isMobile ? '16px' : '24px 20px',
      overflowY: 'auto',
      flexShrink: 0,
      maxHeight: isMobile ? '70vh' : '100vh',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <h1 style={{
          color: '#e0e0e0',
          fontSize: 18,
          fontWeight: 700,
          margin: 0,
        }}>
          🎨 配色方案生成器
        </h1>
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#e0e0e0',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {colorPickerItems.map(item => (
        <ColorPicker
          key={item.key}
          label={item.label}
          colorKey={item.key}
          value={colors[item.key as keyof ThemeColors]}
          onChange={handleColorChange}
        />
      ))}

      <button
        onClick={() => setShowExport(true)}
        style={{
          width: '100%',
          padding: '12px 0',
          borderRadius: 10,
          border: 'none',
          backgroundColor: `${colors.primary}cc`,
          color: colors.text,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background-color 0.3s ease, transform 0.1s ease',
          boxShadow: `0 4px 16px ${colors.primary}30`,
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        导出 CSS 代码
      </button>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      margin: 0,
      padding: 0,
    }}>
      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #1a1a2e; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      {isMobile && !drawerOpen && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: '#16213eee',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h1 style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 700, margin: 0 }}>
            🎨 配色方案生成器
          </h1>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: '#e0e0e0',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            调色板 ▾
          </button>
        </div>
      )}

      {isMobile && (
        <div style={{
          maxHeight: drawerOpen ? '70vh' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          opacity: drawerOpen ? 1 : 0,
        }}>
          {controlPanel}
        </div>
      )}

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
      }}>
        {!isMobile && controlPanel}

        <div style={{
          flex: 1,
          padding: isMobile ? 16 : 32,
          overflowY: 'auto',
          minHeight: isMobile ? 'auto' : '100vh',
        }}>
          <ColorGrid colors={colors} />

          <PreviewPanel
            colors={colors}
            derivedHover={derivedMap['primary-hover'] || colors.primary}
            derivedActive={derivedMap['primary-active'] || colors.primary}
            derivedBorder={derivedMap['border'] || colors.secondary}
            derivedShadow={derivedMap['shadow'] || '#000000'}
            derivedDisabled={derivedMap['disabled'] || colors.secondary}
            derivedSelected={derivedMap['selected'] || colors.primary}
            derivedAccent={derivedMap['accent'] || colors.secondary}
            derivedTextSecondary={derivedMap['text-secondary'] || colors.text}
            derivedBgLight={derivedMap['background-light'] || colors.background}
          />

          {/* CSS Variables Display */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{
              color: '#e0e0e0',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}>
              CSS 变量预览
            </h3>
            <div style={{
              backgroundColor: '#0d1117',
              borderRadius: 10,
              padding: 16,
              fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", monospace',
              fontSize: 12,
              lineHeight: 1.7,
              overflowX: 'auto',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ color: '#8b949e' }}>{':root {'}</div>
              <div><span style={{ color: '#79c0ff' }}>{'  --primary'}</span><span style={{ color: '#8b949e' }}>{': '}</span><span style={{ color: '#a5d6ff' }}>{colors.primary}</span><span style={{ color: '#8b949e' }}>{';'}</span></div>
              <div><span style={{ color: '#79c0ff' }}>{'  --secondary'}</span><span style={{ color: '#8b949e' }}>{': '}</span><span style={{ color: '#a5d6ff' }}>{colors.secondary}</span><span style={{ color: '#8b949e' }}>{';'}</span></div>
              <div><span style={{ color: '#79c0ff' }}>{'  --background'}</span><span style={{ color: '#8b949e' }}>{': '}</span><span style={{ color: '#a5d6ff' }}>{colors.background}</span><span style={{ color: '#8b949e' }}>{';'}</span></div>
              <div><span style={{ color: '#79c0ff' }}>{'  --text'}</span><span style={{ color: '#8b949e' }}>{': '}</span><span style={{ color: '#a5d6ff' }}>{colors.text}</span><span style={{ color: '#8b949e' }}>{';'}</span></div>
              {derivedColors.map(d => (
                <div key={d.name}>
                  <span style={{ color: '#79c0ff' }}>{`  --${d.name}`}</span>
                  <span style={{ color: '#8b949e' }}>{': '}</span>
                  <span style={{ color: '#a5d6ff' }}>{d.value}</span>
                  <span style={{ color: '#8b949e' }}>{';'}</span>
                </div>
              ))}
              <div style={{ color: '#8b949e' }}>{'}'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Panel - Slide in from right */}
      {showExport && (
        <>
          <div
            onClick={() => setShowExport(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              animation: 'overlayFadeIn 0.3s ease forwards',
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: isMobile ? '100%' : 520,
            backgroundColor: '#0d1117',
            zIndex: 1000,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
            animation: 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              @keyframes overlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `}</style>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h2 style={{ color: '#e0e0e0', fontSize: 16, fontWeight: 700, margin: 0 }}>
                导出 CSS 代码
              </h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopyCode}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: copiedCode ? '#238636' : `${colors.primary}cc`,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease, transform 0.1s ease',
                    transform: copiedCode ? 'scale(0.95)' : 'scale(1)',
                  }}
                >
                  {copiedCode ? '✓ 已复制' : '复制代码'}
                </button>
                <button
                  onClick={() => setShowExport(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'transparent',
                    color: '#a0a0a0',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: 20,
            }}>
              <pre style={{
                margin: 0,
                color: '#c9d1d9',
                fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", "Consolas", monospace',
                fontSize: 13,
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}>
                {cssCode}
              </pre>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

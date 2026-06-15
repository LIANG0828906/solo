import React, { useState, useCallback, useEffect, useRef } from 'react';
import BlockEditor, { type BlockConfig } from './components/BlockEditor';
import BlockCanvas from './components/BlockCanvas';
import { themes, type ThemePreset } from './theme/presets';
import { exportCSS } from './utils/exportCSS';

const App: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [themeIndex, setThemeIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [themeTransition, setThemeTransition] = useState(false);

  const theme = themes[themeIndex];

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleThemeChange = useCallback((index: number) => {
    if (index === themeIndex) return;
    setThemeTransition(true);
    setTimeout(() => {
      setThemeIndex(index);
      setTimeout(() => setThemeTransition(false), 400);
    }, 200);
  }, [themeIndex]);

  const handleExport = useCallback(() => {
    const css = exportCSS(blocks);
    const blob = new Blob([css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'style.css';
    a.click();
    URL.revokeObjectURL(url);
  }, [blocks]);

  const handleBlockClick = useCallback((id: string) => {
    setSelectedBlockId(id);
    if (windowWidth < 1024) {
      setRightDrawerOpen(true);
    }
  }, [windowWidth]);

  const isCompact = windowWidth < 1024;

  const editorResult = BlockEditor({
    blocks,
    onBlocksChange: setBlocks,
    selectedBlockId,
    onSelectedBlockIdChange: setSelectedBlockId,
    theme,
    leftCollapsed: isCompact ? true : leftCollapsed,
    onToggleLeftCollapse: () => setLeftCollapsed(!leftCollapsed),
  });

  const { LeftPanel, RightPanel } = editorResult as { LeftPanel: React.ReactNode; RightPanel: React.ReactNode };

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  const drawerOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 999,
    transition: 'opacity 0.4s',
  };

  const drawerBaseStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    bottom: 0,
    width: 320,
    zIndex: 1000,
    transition: 'transform 0.3s ease',
    overflow: 'auto',
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: theme.background,
      color: theme.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      transition: themeTransition ? 'opacity 0.2s' : 'opacity 0.2s',
      opacity: themeTransition ? 0.3 : 1,
    }}>
      <div style={{
        height: 48,
        minHeight: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        borderBottom: `1px solid ${theme.accent}22`,
        background: theme.background,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: theme.accent, letterSpacing: -0.5 }}>
            ParallaxBuilder
          </span>
          {isCompact && (
            <>
              <button
                onClick={() => setLeftDrawerOpen(true)}
                style={{
                  marginLeft: 8,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${theme.accent}44`,
                  background: `${theme.accent}11`,
                  color: theme.text,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >+ 区块</button>
              <button
                onClick={() => setRightDrawerOpen(true)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: `1px solid ${theme.accent}44`,
                  background: `${theme.accent}11`,
                  color: theme.text,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >⚙ 参数</button>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {themes.map((t, i) => (
            <button
              key={t.key}
              onClick={() => handleThemeChange(i)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                border: themeIndex === i ? `2px solid ${t.accent}` : '2px solid transparent',
                background: i === themeIndex ? `${t.accent}22` : `${t.accent}11`,
                color: theme.text,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: themeIndex === i ? 700 : 400,
                transition: 'all 0.2s',
              }}
            >
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: t.accent,
                marginRight: 4,
                verticalAlign: 'middle',
              }} />
              {t.name}
            </button>
          ))}

          <button
            onClick={handleExport}
            disabled={blocks.length === 0}
            style={{
              marginLeft: 8,
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: blocks.length === 0 ? `${theme.accent}44` : theme.accent,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            导出 CSS
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {!isCompact && LeftPanel}

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto',
          padding: 16,
          background: `${theme.accent}06`,
        }}>
          <BlockCanvas
            blocks={blocks}
            scrollProgress={scrollProgress}
            onScrollProgressChange={setScrollProgress}
            selectedBlockId={selectedBlockId}
            onBlockClick={handleBlockClick}
            theme={theme}
          />
        </div>

        {!isCompact && RightPanel}
      </div>

      {isCompact && leftDrawerOpen && (
        <>
          <div style={drawerOverlayStyle} onClick={() => setLeftDrawerOpen(false)} />
          <div style={{
            ...drawerBaseStyle,
            left: 0,
            transform: leftDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}>
            {LeftPanel}
          </div>
        </>
      )}

      {isCompact && rightDrawerOpen && (
        <>
          <div style={drawerOverlayStyle} onClick={() => setRightDrawerOpen(false)} />
          <div style={{
            ...drawerBaseStyle,
            right: 0,
            transform: rightDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
          }}>
            {RightPanel}
          </div>
        </>
      )}
    </div>
  );
};

export default App;

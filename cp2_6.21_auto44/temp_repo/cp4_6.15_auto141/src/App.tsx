import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FontManager, type FontMetadata } from './modules/FontManager';
import { LayoutEngine, type LayoutParams } from './modules/LayoutEngine';
import FontSidebar from './components/FontSidebar';
import TypographyEditor from './components/TypographyEditor';
import CodePreviewPanel from './components/CodePreviewPanel';
import type { HistoryEntry } from './types';

const DEFAULT_TEXT = 'The quick brown fox jumps over the lazy dog. 敏捷的棕色狐狸跳过了懒惰的狗。';

const App: React.FC = () => {
  const [fonts, setFonts] = useState<FontMetadata[]>([]);
  const [filteredFonts, setFilteredFonts] = useState<FontMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFont, setSelectedFont] = useState('Roboto');
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const [params, setParams] = useState<LayoutParams>({
    fontFamily: 'Roboto',
    fontSize: 32,
    lineHeight: 1.5,
    letterSpacing: 0,
    color: '#1e3a5f',
    text: DEFAULT_TEXT
  });

  const fontManagerRef = useRef(new FontManager());
  const layoutEngineRef = useRef(new LayoutEngine());
  const lastParamsRef = useRef<LayoutParams | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const loadFonts = async () => {
      setLoading(true);
      await fontManagerRef.current.loadFonts();
      const allFonts = fontManagerRef.current.getFonts();
      setFonts(allFonts);
      setFilteredFonts(allFonts);
      setLoading(false);
    };
    loadFonts();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const savedFavorites = localStorage.getItem('fontFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        console.error('Failed to parse favorites');
      }
    }

    const savedHistory = localStorage.getItem('layoutHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        console.error('Failed to parse history');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fontFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('layoutHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const paramsChanged = lastParamsRef.current && 
      (lastParamsRef.current.fontFamily !== params.fontFamily ||
       lastParamsRef.current.fontSize !== params.fontSize ||
       lastParamsRef.current.lineHeight !== params.lineHeight ||
       lastParamsRef.current.letterSpacing !== params.letterSpacing ||
       lastParamsRef.current.color !== params.color ||
       lastParamsRef.current.text !== params.text);

    if (paramsChanged && !isAnimating) {
      addToHistory(params);
    }
    lastParamsRef.current = params;
  }, [params, isAnimating]);

  const css = useMemo(() => {
    return layoutEngineRef.current.generateCSS(params);
  }, [params]);

  const handleSearch = useCallback(async (keyword: string) => {
    const results = await fontManagerRef.current.searchFonts(keyword);
    setFilteredFonts(results);
  }, []);

  const handleFontSelect = useCallback((font: FontMetadata) => {
    setSelectedFont(font.family);
    setParams(prev => ({ ...prev, fontFamily: font.family }));
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleParamsChange = useCallback((newParams: Partial<LayoutParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  const handleToggleFavorite = useCallback((fontFamily: string) => {
    setFavorites(prev => {
      if (prev.includes(fontFamily)) {
        return prev.filter(f => f !== fontFamily);
      } else {
        return [...prev, fontFamily];
      }
    });
  }, []);

  const addToHistory = useCallback((layoutParams: LayoutParams) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      fontFamily: layoutParams.fontFamily,
      fontSize: layoutParams.fontSize,
      lineHeight: layoutParams.lineHeight,
      letterSpacing: layoutParams.letterSpacing,
      color: layoutParams.color,
      text: layoutParams.text
    };

    setHistory(prev => {
      const filtered = prev.filter(h => {
        return !(h.fontFamily === entry.fontFamily &&
                 h.fontSize === entry.fontSize &&
                 h.lineHeight === entry.lineHeight &&
                 h.letterSpacing === entry.letterSpacing &&
                 h.color === entry.color &&
                 h.text === entry.text);
      });
      return [entry, ...filtered].slice(0, 20);
    });
  }, []);

  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setIsAnimating(true);
    
    const startParams = { ...params };
    const endParams: LayoutParams = {
      fontFamily: entry.fontFamily,
      fontSize: entry.fontSize,
      lineHeight: entry.lineHeight,
      letterSpacing: entry.letterSpacing,
      color: entry.color,
      text: entry.text
    };
    
    setSelectedFont(entry.fontFamily);

    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setParams(prev => ({
        ...prev,
        fontFamily: endParams.fontFamily,
        fontSize: startParams.fontSize + (endParams.fontSize - startParams.fontSize) * easeProgress,
        lineHeight: startParams.lineHeight + (endParams.lineHeight - startParams.lineHeight) * easeProgress,
        letterSpacing: startParams.letterSpacing + (endParams.letterSpacing - startParams.letterSpacing) * easeProgress,
        color: interpolateColor(startParams.color, endParams.color, easeProgress),
        text: endParams.text
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [params]);

  const interpolateColor = (color1: string, color2: string, progress: number): string => {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = Math.min(400, Math.max(220, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      layoutEngineRef.current.destroy();
    };
  }, []);

  const getPreviewText = useCallback((font: FontMetadata) => {
    return fontManagerRef.current.getPreviewText(font);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f7f9fc',
        overflow: 'hidden'
      }}>
        <div style={{
          height: 56,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'white',
          borderBottom: '1px solid #d1d9e6',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          zIndex: 100
        }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: 8,
              fontSize: 20,
              color: '#4a6fa5'
            }}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
          <h1 style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1e3a5f'
          }}>
            字体灵感沙盒
          </h1>
          <div style={{ width: 36 }} />
        </div>

        {mobileMenuOpen && (
          <div
            className="fade-in"
            style={{
              position: 'absolute',
              top: 56,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
              zIndex: 90,
              overflow: 'hidden'
            }}
          >
            <FontSidebar
              fonts={filteredFonts}
              loading={loading}
              selectedFont={selectedFont}
              favorites={favorites}
              history={history}
              sidebarWidth={window.innerWidth}
              onFontSelect={handleFontSelect}
              onSearch={handleSearch}
              onToggleFavorite={handleToggleFavorite}
              onHistorySelect={handleHistorySelect}
              getPreviewText={getPreviewText}
            />
          </div>
        )}

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <TypographyEditor
            params={params}
            onParamsChange={handleParamsChange}
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      backgroundColor: '#f7f9fc',
      overflow: 'hidden',
      cursor: isResizing ? 'col-resize' : 'default'
    }}>
      <FontSidebar
        fonts={filteredFonts}
        loading={loading}
        selectedFont={selectedFont}
        favorites={favorites}
        history={history}
        sidebarWidth={sidebarWidth}
        onFontSelect={handleFontSelect}
        onSearch={handleSearch}
        onToggleFavorite={handleToggleFavorite}
        onHistorySelect={handleHistorySelect}
        getPreviewText={getPreviewText}
      />

      <div
        onMouseDown={handleResizeStart}
        style={{
          width: 6,
          cursor: 'col-resize',
          backgroundColor: isResizing ? '#4a6fa5' : 'transparent',
          borderRight: '1px solid #d1d9e6',
          transition: 'background-color 0.2s',
          flexShrink: 0,
          marginLeft: -1
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = '#e8edf3';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 24px',
          backgroundColor: 'white',
          borderBottom: '1px solid #d1d9e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: '#4a6fa5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 16
            }}>
              Aa
            </div>
            <div>
              <h1 style={{
                fontSize: 18,
                fontWeight: 600,
                color: '#1e3a5f',
                margin: 0
              }}>
                Font Inspiration Sandbox
              </h1>
              <p style={{
                fontSize: 12,
                color: '#6b7c93',
                margin: 0
              }}>
                字体灵感生成与排版沙盒
              </p>
            </div>
          </div>
          <div style={{
            fontSize: 13,
            color: '#6b7c93'
          }}>
            {fonts.length} 款字体 · {favorites.length} 个收藏
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <TypographyEditor
            params={params}
            onParamsChange={handleParamsChange}
            isMobile={isMobile}
          />
          
          <CodePreviewPanel
            params={params}
            css={css}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

export default App;

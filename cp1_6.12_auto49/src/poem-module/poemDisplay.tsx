import React, { useState, useEffect, useMemo, useRef, useCallback, createRef } from 'react';
import { poemDataModule, type Poem, type PoemTheme, type PoemDynasty, type KeywordAnnotation } from './poemData';
import ParticleCanvas, { type ParticleCanvasHandle } from '../particle-module/particleCanvas';

const STORAGE_KEY = 'poetry-gallery-favorites-v1';

interface AnnotationState {
  keyword: KeywordAnnotation;
  x: number;
  y: number;
}

interface ViewportInfo {
  isMobile: boolean;
  isTablet: boolean;
  densityScale: number;
  horizontalText: boolean;
}

const getViewportInfo = (): ViewportInfo => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1440;
  if (w < 768) return { isMobile: true, isTablet: false, densityScale: 0.5, horizontalText: true };
  if (w < 1200) return { isMobile: false, isTablet: true, densityScale: 0.7, horizontalText: false };
  return { isMobile: false, isTablet: false, densityScale: 1, horizontalText: false };
};

const PoemDisplay: React.FC = () => {
  const [viewport, setViewport] = useState<ViewportInfo>(() => getViewportInfo());
  const [filterType, setFilterType] = useState<'theme' | 'dynasty' | 'all'>('all');
  const [currentFilter, setCurrentFilter] = useState<PoemTheme | PoemDynasty | 'all'>('all');
  const [currentPoem, setCurrentPoem] = useState<Poem>(() => poemDataModule.getRandomPoem());
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as string[] : [];
    } catch {
      return [];
    }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [annotation, setAnnotation] = useState<AnnotationState | null>(null);
  const [particleDensity, setParticleDensity] = useState<number>(() => Math.floor(500 * getViewportInfo().densityScale));
  const [particleSpeed, setParticleSpeed] = useState<number>(2);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const particleRef = createRef<ParticleCanvasHandle>();
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => {
      const info = getViewportInfo();
      setViewport(info);
      setParticleDensity(prev => {
        const target = Math.floor(500 * info.densityScale);
        return Math.min(target, 1000);
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // ignore storage errors
    }
  }, [favorites]);

  const currentPoemFilteredList = useMemo(() => {
    if (filterType === 'theme' && currentFilter !== 'all') {
      return poemDataModule.filterByTheme(currentFilter as PoemTheme);
    }
    if (filterType === 'dynasty' && currentFilter !== 'all') {
      return poemDataModule.filterByDynasty(currentFilter as PoemDynasty);
    }
    return poemDataModule.getAllPoems();
  }, [filterType, currentFilter]);

  const isFavorited = useMemo(() => favorites.includes(currentPoem.id), [favorites, currentPoem.id]);

  const keywordCharMap = useMemo(() => {
    const map: Record<string, KeywordAnnotation> = {};
    for (const kw of currentPoem.keywords) {
      for (const ch of kw.word) {
        map[ch] = kw;
      }
    }
    return map;
  }, [currentPoem]);

  const selectPoem = useCallback((poem: Poem) => {
    setAnnotation(null);
    setCurrentPoem(poem);
  }, []);

  const handleRandom = useCallback(() => {
    let p = poemDataModule.getRandomPoem();
    let guard = 0;
    while (p.id === currentPoem.id && guard++ < 10) {
      p = poemDataModule.getRandomPoem();
    }
    selectPoem(p);
  }, [currentPoem.id, selectPoem]);

  const handleFilterTab = useCallback((type: 'all' | 'theme' | 'dynasty', value: PoemTheme | PoemDynasty | 'all') => {
    setFilterType(type === 'all' ? 'all' : type as 'theme' | 'dynasty');
    setCurrentFilter(value);
  }, []);

  const toggleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const id = currentPoem.id;
    setFavorites(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      setShowPlusOne(true);
      window.setTimeout(() => setShowPlusOne(false), 1000);
      return [...prev, id];
    });
  }, [currentPoem.id]);

  const handleKeywordClick = useCallback((ch: string, e: React.MouseEvent) => {
    const kw = keywordCharMap[ch];
    if (!kw) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = 360;
    const cardH = 300;
    let x = rect.right + 14;
    let y = rect.top;
    if (x + cardW > vw - 16) x = rect.left - cardW - 14;
    if (x < 16) x = 16;
    if (y + cardH > vh - 16) y = vh - cardH - 16;
    if (y < 70) y = 70;
    setAnnotation({ keyword: kw, x, y });
  }, [keywordCharMap]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const removeFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.filter(x => x !== id));
  }, []);

  const exportWallpaper = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const stage = stageRef.current;
      if (!stage) throw new Error('stage not found');
      const W = 1920;
      const H = 1080;
      const outCanvas = document.createElement('canvas');
      outCanvas.width = W;
      outCanvas.height = H;
      const octx = outCanvas.getContext('2d')!;
      const bgGrad = octx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#0a0e27');
      bgGrad.addColorStop(1, '#1a1f36');
      octx.fillStyle = bgGrad;
      octx.fillRect(0, 0, W, H);

      const particleCanvas = particleRef.current?.getCanvas();
      if (particleCanvas) {
        octx.drawImage(particleCanvas, 0, 0, particleCanvas.width, particleCanvas.height, 0, 0, W, H);
      }

      octx.globalCompositeOperation = 'source-over';
      octx.textBaseline = 'middle';
      octx.textAlign = 'center';

      const title = currentPoem.title;
      const meta = `【${currentPoem.dynasty}】${currentPoem.author} · ${currentPoem.theme}`;
      octx.fillStyle = '#e8d5b7';
      octx.textBaseline = 'top';

      const titleFont = Math.floor(W * 0.032);
      octx.font = `900 ${titleFont}px 'Noto Serif SC', 'Source Han Serif CN', serif`;
      const titleTextMetrics = octx.measureText(title);
      const titleX = W / 2;
      const titleY = H * 0.1;
      const titleGrad = octx.createLinearGradient(titleX - titleTextMetrics.width / 2, 0, titleX + titleTextMetrics.width / 2, 0);
      titleGrad.addColorStop(0, '#fff5e1');
      titleGrad.addColorStop(0.5, '#e8d5b7');
      titleGrad.addColorStop(1, '#d4b896');
      octx.shadowColor = 'rgba(232, 213, 183, 0.4)';
      octx.shadowBlur = 28;
      octx.fillStyle = titleGrad;
      octx.fillText(title, titleX, titleY);

      octx.shadowBlur = 0;
      const metaFont = Math.floor(W * 0.013);
      octx.font = `500 ${metaFont}px 'Noto Serif SC', serif`;
      octx.fillStyle = 'rgba(232, 213, 183, 0.75)';
      octx.fillText(meta, W / 2, titleY + titleFont * 1.5);

      const content = currentPoem.content;
      const lineCount = content.length;
      const lineFont = Math.floor(W * 0.024);
      octx.font = `500 ${lineFont}px 'Noto Serif SC', serif`;
      const letterSpacing = lineFont * 0.5;
      const totalChars = content.reduce((max, line) => Math.max(max, line.replace(/[，。？！、；：]/g, '').length), 0);
      const blockHeight = totalChars * (lineFont + letterSpacing);
      const startY = H * 0.5 - blockHeight / 2;
      const lineGap = lineFont * 2.2;
      const blockWidth = lineCount * lineGap;
      const startX = W / 2 - blockWidth / 2 + lineGap / 2;
      octx.shadowColor = 'rgba(232, 213, 183, 0.25)';
      octx.shadowBlur = 14;
      const kwChars = new Set<string>();
      for (const kw of currentPoem.keywords) {
        for (const c of kw.word) kwChars.add(c);
      }
      content.forEach((line, li) => {
        const chars = Array.from(line);
        const cx = startX + (lineCount - 1 - li) * lineGap;
        const filtered = chars.filter(c => !/[，。？！、；：\s]/.test(c));
        const totalH = filtered.length * (lineFont + letterSpacing) - letterSpacing;
        const topY = H * 0.5 - totalH / 2;
        let fi = 0;
        chars.forEach((ch) => {
          if (/[，。？！、；：\s]/.test(ch)) return;
          const cy = topY + fi * (lineFont + letterSpacing) + lineFont / 2;
          const isKw = kwChars.has(ch);
          if (isKw) {
            octx.shadowColor = 'rgba(255, 245, 225, 0.6)';
            octx.shadowBlur = 22;
            octx.fillStyle = '#fff5e1';
          } else {
            octx.shadowColor = 'rgba(232, 213, 183, 0.2)';
            octx.shadowBlur = 12;
            octx.fillStyle = '#e8d5b7';
          }
          octx.textAlign = 'center';
          octx.textBaseline = 'middle';
          octx.fillText(ch, cx, cy);
          fi++;
        });
      });
      octx.shadowBlur = 0;

      const footerFont = Math.floor(W * 0.009);
      octx.font = `400 ${footerFont}px 'Noto Serif SC', serif`;
      octx.fillStyle = 'rgba(232, 213, 183, 0.35)';
      octx.textAlign = 'right';
      octx.textBaseline = 'bottom';
      octx.fillText('诗词意像画廊 · Poetry Particle Gallery', W - 60, H - 40);

      const blob: Blob = await new Promise((resolve) => {
        outCanvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentPoem.title}_${currentPoem.author}_诗词壁纸.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, currentPoem, particleRef]);

  const renderCharWithKeyword = (ch: string, idx: number) => {
    if (/[，。？！、；：\s]/.test(ch)) {
      return <span key={idx} className="poem-punct">{ch}</span>;
    }
    if (keywordCharMap[ch]) {
      return (
        <span
          key={idx}
          className="keyword-char"
          onClick={(e) => handleKeywordClick(ch, e)}
        >
          {ch}
        </span>
      );
    }
    return <span key={idx}>{ch}</span>;
  };

  const favoritePoems = useMemo(() =>
    favorites.map(id => poemDataModule.getPoemById(id)).filter(Boolean) as Poem[],
    [favorites]
  );

  return (
    <>
      <ParticleCanvas
        ref={particleRef}
        theme={currentPoem.theme}
        particleHint={currentPoem.particleHint}
        density={particleDensity}
        speed={particleSpeed}
      />

      <div className="app-content">
        <nav className="top-nav">
          <div className="nav-left">
            <div>
              <div className="brand-title">詩 詞 意 像</div>
              <div className="brand-subtitle">Poetry · Particle · Gallery</div>
            </div>
          </div>

          <div className="filter-group">
            <div className="filter-tabs">
              <button
                className={`tab-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterTab('all', 'all')}
              >
                全部
              </button>
              {poemDataModule.getThemes().map(th => (
                <button
                  key={th}
                  className={`tab-btn ${filterType === 'theme' && currentFilter === th ? 'active' : ''}`}
                  onClick={() => handleFilterTab('theme', th)}
                >
                  {th}
                </button>
              ))}
              {poemDataModule.getDynasties().map(dy => (
                <button
                  key={dy}
                  className={`tab-btn ${filterType === 'dynasty' && currentFilter === dy ? 'active' : ''}`}
                  onClick={() => handleFilterTab('dynasty', dy)}
                >
                  {dy}
                </button>
              ))}
            </div>
            <select
              className="poem-select"
              value={currentPoem.id}
              onChange={(e) => {
                const p = poemDataModule.getPoemById(e.target.value);
                if (p) selectPoem(p);
              }}
            >
              {currentPoemFilteredList.map(p => (
                <option key={p.id} value={p.id}>
                  【{p.theme}】{p.title} · {p.author}
                </option>
              ))}
            </select>
          </div>

          <div className="nav-right">
            <button
              className="fav-entry-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <span>❤ 收藏夹</span>
              {favorites.length > 0 && (
                <span className="fav-count-badge">{favorites.length}</span>
              )}
            </button>
          </div>
        </nav>

        <main className="main-stage" ref={stageRef}>
          <article className="poem-container" key={currentPoem.id}>
            <button
              className={`fav-heart-btn ${isFavorited ? 'active' : ''}`}
              onClick={toggleFavorite}
              title={isFavorited ? '取消收藏' : '加入收藏'}
              aria-label="收藏按钮"
            >
              <span style={{ color: isFavorited ? '#ff6b9d' : '#e8d5b7', filter: isFavorited ? 'drop-shadow(0 0 6px rgba(255,107,157,0.8))' : 'none' }}>
                {isFavorited ? '❤' : '♡'}
              </span>
              {showPlusOne && <span className="plus-one">+1</span>}
            </button>

            <div className="poem-title-area">
              <h1 className="poem-title">{currentPoem.title}</h1>
              <div className="poem-meta">
                <span className="meta-tag">{currentPoem.dynasty}代</span>
                <span>{currentPoem.author}</span>
                <span className="meta-tag">{currentPoem.theme}</span>
              </div>
            </div>

            <div className={`poem-content ${viewport.horizontalText ? 'horizontal' : ''}`}>
              {currentPoem.content.map((line, li) => (
                <div className="poem-line" key={li}>
                  {Array.from(line).map((ch, ci) => renderCharWithKeyword(ch, li * 1000 + ci))}
                </div>
              ))}
            </div>
          </article>
        </main>

        <section className={`bottom-control ${viewport.isMobile && panelCollapsed ? 'collapsed' : ''}`}>
          {viewport.isMobile && (
            <button
              className="control-toggle-btn"
              onClick={() => setPanelCollapsed(c => !c)}
              aria-label={panelCollapsed ? '展开控制面板' : '收起控制面板'}
            >
              {panelCollapsed ? '▲' : '▼'}
            </button>
          )}
          <div className="slider-group">
            <div className="slider-item">
              <span className="slider-label">粒子密度</span>
              <input
                type="range"
                className="slider-input"
                min={0}
                max={1000}
                step={10}
                value={particleDensity}
                onChange={(e) => setParticleDensity(Number(e.target.value))}
              />
              <span className="slider-value">{particleDensity}</span>
            </div>
            <div className="slider-item">
              <span className="slider-label">运动速度</span>
              <input
                type="range"
                className="slider-input"
                min={0}
                max={5}
                step={0.1}
                value={particleSpeed}
                onChange={(e) => setParticleSpeed(Number(e.target.value))}
              />
              <span className="slider-value">{particleSpeed.toFixed(1)}</span>
            </div>
          </div>
          <div className="action-buttons">
            <button className="btn-primary btn-random" onClick={handleRandom}>
              🎲 换一首
            </button>
            <button
              className="btn-primary btn-export"
              onClick={exportWallpaper}
              disabled={isExporting}
            >
              {isExporting ? '⏳ 生成中...' : '📸 导出壁纸'}
            </button>
          </div>
        </section>
      </div>

      {annotation && (
        <aside
          className="annotation-card"
          style={{ left: annotation.x, top: annotation.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="card-close"
            onClick={() => setAnnotation(null)}
            aria-label="关闭注释"
          >
            ✕
          </button>
          <div className="card-keyword">{annotation.keyword.word}</div>
          <div className="card-label">词 义 注 释</div>
          <div className="card-meaning">{annotation.keyword.meaning}</div>
          <div className="related-title">◆ 同主题关联诗词</div>
          <div className="related-list">
            {annotation.keyword.relatedPoemIds.length === 0 ? (
              <span className="no-related">暂无关联诗词</span>
            ) : (
              annotation.keyword.relatedPoemIds.map(rid => {
                const rp = poemDataModule.getPoemById(rid);
                if (!rp) return null;
                return (
                  <button
                    key={rid}
                    className="related-item"
                    onClick={() => {
                      selectPoem(rp);
                      setAnnotation(null);
                    }}
                  >
                    《{rp.title}》{rp.author}
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      {annotation && (
        <div
          className="sidebar-overlay visible"
          onClick={() => setAnnotation(null)}
          style={{ zIndex: 99 }}
        />
      )}

      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`favorite-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <span style={{ color: '#ff6b9d' }}>❤</span>
            <span>我 的 收 藏</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭收藏夹"
          >
            ✕
          </button>
        </div>
        <div className="sidebar-actions">
          <button
            className="clear-btn"
            onClick={clearFavorites}
            disabled={favorites.length === 0}
          >
            🗑 清空收藏（{favorites.length}）
          </button>
        </div>
        <div className="favorite-list">
          {favoritePoems.length === 0 ? (
            <div className="empty-fav">
              <div className="empty-icon">📜</div>
              <div>收藏夹空空如也</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>
                点击诗词右上角的爱心<br />收藏你钟爱的诗词
              </div>
            </div>
          ) : (
            favoritePoems.map(p => (
              <div
                key={p.id}
                className="fav-item"
                onClick={() => {
                  selectPoem(p);
                  setSidebarOpen(false);
                }}
              >
                <button
                  className="fav-remove"
                  onClick={(e) => removeFavorite(p.id, e)}
                  aria-label="取消收藏"
                >
                  ✕
                </button>
                <div className="fav-item-title">《{p.title}》</div>
                <div className="fav-item-meta">
                  【{p.dynasty}】{p.author} · {p.theme}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
};

export default PoemDisplay;

import { useState, useEffect, useRef, useCallback } from 'react';
import PreviewContainer from './PreviewContainer';
import { AdapterManager, type Breakpoint } from './AdapterManager';
import './App.css';

export default function App() {
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('https://example.com');
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const adapterManagerRef = useRef<AdapterManager | null>(null);

  useEffect(() => {
    const viewportHeight = window.innerHeight;
    const manager = new AdapterManager(viewportHeight);
    adapterManagerRef.current = manager;
    setBreakpoints(manager.getBreakpoints());
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (adapterManagerRef.current) {
        adapterManagerRef.current.setViewportHeight(window.innerHeight);
        setBreakpoints(adapterManagerRef.current.getBreakpoints());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLoad = useCallback(() => {
    let targetUrl = inputUrl.trim();
    if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    setUrl(targetUrl);
  }, [inputUrl]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleLoad();
      }
    },
    [handleLoad]
  );

  const handleWidthChange = useCallback((id: string, width: number) => {
    if (adapterManagerRef.current) {
      adapterManagerRef.current.updateBreakpointWidth(id, width);
      setBreakpoints(adapterManagerRef.current.getBreakpoints());
    }
  }, []);

  const toggleAspectRatio = useCallback(() => {
    if (adapterManagerRef.current) {
      const newLocked = !aspectRatioLocked;
      adapterManagerRef.current.setAspectRatioLocked(newLocked);
      setAspectRatioLocked(newLocked);
      setBreakpoints(adapterManagerRef.current.getBreakpoints());
    }
  }, [aspectRatioLocked]);

  const handleHighlight = useCallback(
    (id: string) => {
      setHighlightedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const handleAddBreakpoint = useCallback(() => {
    if (adapterManagerRef.current) {
      adapterManagerRef.current.addBreakpoint();
      setBreakpoints(adapterManagerRef.current.getBreakpoints());
    }
  }, []);

  const handleRemoveBreakpoint = useCallback(
    (id: string) => {
      if (adapterManagerRef.current) {
        adapterManagerRef.current.removeBreakpoint(id);
        setBreakpoints(adapterManagerRef.current.getBreakpoints());
        if (highlightedId === id) {
          setHighlightedId(null);
        }
      }
    },
    [highlightedId]
  );

  const minWidth = adapterManagerRef.current?.getMinWidth() ?? 240;
  const maxWidth = adapterManagerRef.current?.getMaxWidth() ?? 2000;
  const maxBreakpoints = adapterManagerRef.current?.getMaxBreakpoints() ?? 6;
  const canAdd = breakpoints.length < maxBreakpoints;

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">响应式断点预览工具</h1>

        <div className="url-input-wrapper">
          <div className="url-input-container">
            <input
              type="text"
              className="url-input"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入网页URL..."
            />
          </div>
          <button className="load-btn" onClick={handleLoad}>
            加载
          </button>
        </div>

        <div className="controls">
          <button
            className={`aspect-toggle ${aspectRatioLocked ? 'active' : ''}`}
            onClick={toggleAspectRatio}
          >
            <span className="toggle-icon">{aspectRatioLocked ? '🔒' : '🔓'}</span>
            <span>16:9 锁定</span>
          </button>

          {canAdd && (
            <button className="add-breakpoint-btn" onClick={handleAddBreakpoint}>
              + 添加断点
            </button>
          )}
        </div>
      </header>

      <main className="preview-grid">
        {breakpoints.map((bp) => (
          <div key={bp.id} className="preview-item">
            <PreviewContainer
              breakpoint={bp}
              url={url}
              isHighlighted={highlightedId === bp.id}
              onHighlight={() => handleHighlight(bp.id)}
              onWidthChange={(width) => handleWidthChange(bp.id, width)}
              minWidth={minWidth}
              maxWidth={maxWidth}
            />
            {breakpoints.length > 1 && (
              <button
                className="remove-btn"
                onClick={() => handleRemoveBreakpoint(bp.id)}
                title="移除此断点"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </main>

      {!url && (
        <div className="empty-state">
          <div className="empty-icon">📱</div>
          <p className="empty-text">输入网页URL，点击加载按钮开始预览</p>
          <p className="empty-hint">支持同时对比多个断点的响应式布局效果</p>
        </div>
      )}
    </div>
  );
}

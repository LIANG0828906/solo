import React, { useEffect } from 'react';
import LayerControl from './components/LayerControl';
import CanvasView from './components/CanvasView';
import { useLayerStore } from './store/layerStore';
import './App.css';

const App: React.FC = () => {
  const initLayers = useLayerStore(state => state.initLayers);
  const layers = useLayerStore(state => state.layers);
  const compareMode = useLayerStore(state => state.compareMode);
  const toggleCompareMode = useLayerStore(state => state.toggleCompareMode);
  const resetAll = useLayerStore(state => state.resetAll);
  const mobilePanelOpen = useLayerStore(state => state.mobilePanelOpen);
  const toggleMobilePanel = useLayerStore(state => state.toggleMobilePanel);

  useEffect(() => {
    if (layers.length === 0) {
      initLayers();
    }
  }, [initLayers, layers.length]);

  const visibleCount = layers.filter(l => l.visible).length;

  return (
    <div className="lp-app">
      <LayerControl />
      <div className="lp-main-area">
        <header className="lp-top-bar">
          <div className="lp-top-bar-left">
            <button
              type="button"
              className="lp-hamburger"
              onClick={toggleMobilePanel}
              aria-label="打开图层面板"
            >
              <span />
              <span />
              <span />
            </button>
            <div className="lp-brand">
              <div className="lp-brand-logo" aria-hidden>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#10B981" opacity="0.9" />
                  <rect x="10" y="3" width="11" height="11" rx="1.5" fill="#F59E0B" opacity="0.75" />
                  <rect x="3" y="12" width="11" height="9" rx="1.5" fill="#06B6D4" opacity="0.7" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#A855F7" opacity="0.65" />
                </svg>
              </div>
              <div className="lp-brand-text">
                <span className="lp-brand-name">LayerPeek</span>
                <span className="lp-brand-sub">图层预览 · {visibleCount}/{layers.length} 可见</span>
              </div>
            </div>
          </div>
          <div className="lp-top-bar-right">
            <button
              type="button"
              className={`lp-compare-toggle ${compareMode ? 'lp-compare-active' : ''}`}
              onClick={toggleCompareMode}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                {compareMode ? (
                  <>
                    <path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <path d="M12 5v14" stroke="currentColor" strokeWidth="1.8" />
                  </>
                ) : (
                  <>
                    <path d="M4 5h16v14H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  </>
                )}
              </svg>
              {compareMode ? '左右对比' : '单图'}
            </button>
            <button
              type="button"
              className="lp-reset-btn"
              onClick={resetAll}
              title="重置所有图层和顺序"
              aria-label="重置所有操作"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden className="lp-reset-icon">
                <path
                  d="M20 12a8 8 0 1 1-2.34-5.66"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M20 4v5h-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>
        <div className="lp-canvas-area">
          <CanvasView />
        </div>
      </div>
      {mobilePanelOpen && (
        <div
          className="lp-mobile-overlay"
          onClick={toggleMobilePanel}
          aria-hidden
        />
      )}
    </div>
  );
};

export default App;

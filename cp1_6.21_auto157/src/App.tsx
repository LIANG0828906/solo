import { useEffect, useRef, useState, useCallback } from 'react';
import { basicElements, findRecipe, getElementById, type Element } from './elements';
import { CanvasRenderer } from './renderer';

export default function App() {
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [result, setResult] = useState<Element | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [shakeBtn, setShakeBtn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const fuseBtnRef = useRef<HTMLButtonElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
      return () => {
        rendererRef.current?.destroy();
      };
    }
  }, []);

  const handleElementClick = useCallback((elemId: string) => {
    setSelectedElements(prev => {
      if (prev.includes(elemId)) {
        return prev.filter(id => id !== elemId);
      }
      if (prev.length >= 2) {
        return [prev[1], elemId];
      }
      return [...prev, elemId];
    });
  }, []);

  const handleFusion = useCallback(() => {
    if (selectedElements.length !== 2) return;

    const [elem1, elem2] = selectedElements;
    const recipe = findRecipe(elem1, elem2);

    if (rendererRef.current && canvasContainerRef.current) {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (fuseBtnRef.current) {
        const btnRect = fuseBtnRef.current.getBoundingClientRect();
        const containerRect = canvasContainerRef.current.getBoundingClientRect();
        const rippleX = btnRect.left - containerRect.left + btnRect.width / 2;
        const rippleY = btnRect.top - containerRect.top + btnRect.height / 2;
        rendererRef.current.spawnRipple(rippleX, rippleY);
      }

      if (recipe) {
        rendererRef.current.spawnParticleBurst(centerX, centerY, recipe);
        setResult(recipe);
        setDiscovered(prev => {
          const next = new Set(prev);
          next.add(recipe.id);
          return next;
        });
      } else {
        rendererRef.current.playErrorSound();
        setShakeBtn(true);
        setTimeout(() => setShakeBtn(false), 400);
      }
    }
  }, [selectedElements]);

  const selectedFirst = selectedElements[0] ? getElementById(selectedElements[0]) : null;
  const selectedSecond = selectedElements[1] ? getElementById(selectedElements[1]) : null;

  const discoveredElements = Array.from(discovered)
    .map(id => getElementById(id))
    .filter((e): e is Element => !!e);

  return (
    <div className="app">
      <header className="header">
        <h1>像素炼金术</h1>
        <p>融合基础元素，解锁神秘魔法</p>
      </header>

      <div className="main-content">
        <div className="game-area">
          <div className="canvas-container" ref={canvasContainerRef}>
            <canvas ref={canvasRef} />
            <div className="canvas-overlay">
              <div className="element-selector">
                {basicElements.map(elem => (
                  <button
                    key={elem.id}
                    className={`element-btn element-${elem.id} ${selectedElements.includes(elem.id) ? 'selected' : ''}`}
                    onClick={() => handleElementClick(elem.id)}
                    title={elem.name}
                  >
                    {elem.symbol}
                  </button>
                ))}
              </div>

              <div className="fusion-section">
                <div className="fusion-display">
                  <div className={`fusion-slot ${selectedFirst ? 'filled' : ''}`}>
                    {selectedFirst?.symbol || ''}
                  </div>
                  <span>+</span>
                  <div className={`fusion-slot ${selectedSecond ? 'filled' : ''}`}>
                    {selectedSecond?.symbol || ''}
                  </div>
                </div>

                <button
                  ref={fuseBtnRef}
                  className={`fuse-btn ${shakeBtn ? 'shake' : ''}`}
                  onClick={handleFusion}
                  disabled={selectedElements.length !== 2}
                >
                  融合
                </button>
              </div>

              <div className="result-section">
                <div className={`result-card ${result ? '' : 'empty'}`}>
                  {result ? (
                    <>
                      <div
                        className="result-icon"
                        style={{
                          background: `linear-gradient(135deg, ${result.colors[0]}, ${result.colors[1]})`
                        }}
                      >
                        {result.symbol}
                      </div>
                      <div className="result-name">{result.name}</div>
                      <div className="result-desc">{result.description}</div>
                    </>
                  ) : (
                    <div className="placeholder-text">
                      选择两个元素开始合成...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className={`sidebar ${sidebarExpanded ? 'expanded' : ''}`}>
          <div
            className="sidebar-header"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
          >
            <span className="sidebar-title">配方图鉴 ({discoveredElements.length})</span>
            <span className="sidebar-toggle">▼</span>
          </div>
          <div className="sidebar-content">
            {discoveredElements.length > 0 ? (
              <div className="recipe-grid">
                {discoveredElements.map(elem => (
                  <div
                    key={elem.id}
                    className="recipe-item"
                    data-name={elem.name}
                    title={elem.description}
                    style={{
                      background: `linear-gradient(135deg, ${elem.colors[0]}40, ${elem.colors[1]}40)`
                    }}
                  >
                    {elem.symbol}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#6B7280', fontSize: '0.85rem', textAlign: 'center', padding: '8px' }}>
                尚未发现配方
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

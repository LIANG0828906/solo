import { useEffect, useState } from 'react';
import { useAppStore, getCurrentSprite } from './store';
import { Previewer } from './Previewer';
import { AnimEditor } from './AnimEditor';

function App() {
  const loadSprites = useAppStore((state) => state.loadSprites);
  const sprites = useAppStore((state) => state.sprites);
  const currentSpriteId = useAppStore((state) => state.currentSpriteId);
  const setCurrentSprite = useAppStore((state) => state.setCurrentSprite);
  const resetAnimations = useAppStore((state) => state.resetAnimations);
  const exportGif = useAppStore((state) => state.exportGif);
  const currentSprite = useAppStore(getCurrentSprite);

  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    loadSprites();
  }, [loadSprites]);

  const handleSpriteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (newId === currentSpriteId) return;

    setIsFading(true);
    setTimeout(() => {
      setCurrentSprite(newId);
      setTimeout(() => {
        setIsFading(false);
      }, 50);
    }, 150);
  };

  const spriteOptions = Array.from(sprites.values()).map((s) => ({
    id: s.metadata.id,
    name: s.metadata.name,
  }));

  return (
    <div className="app">
      <header className="top-toolbar">
        <div className="toolbar-left">
          <div className="app-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <h1>像素精灵动画工坊</h1>
          </div>

          <div className="sprite-selector-wrapper">
            <label className="selector-label">精灵</label>
            <select
              className="sprite-select"
              value={currentSpriteId || ''}
              onChange={handleSpriteChange}
            >
              {spriteOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-right">
          <button className="btn-export" onClick={exportGif}>
            导出 GIF
          </button>
          <button className="btn-reset" onClick={resetAnimations}>
            重置动画
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className={`preview-section ${isFading ? 'fade-out' : 'fade-in'}`}>
          <Previewer />
        </div>

        <div className="divider" />

        <aside className="editor-section">
          <AnimEditor />
        </aside>
      </div>
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { useGameStore } from './store/gameStore';
import SpriteCanvas from './components/SpriteCanvas';
import ControlPanel from './components/ControlPanel';
import StatusBar from './components/StatusBar';
import { COLORS } from './utils/pixelArt';

const appSelector = (state: {
  name: string;
  level: number;
  initSprite: (name?: string) => void;
  resetSprite: () => void;
}) => ({
  name: state.name,
  level: state.level,
  initSprite: state.initSprite,
  resetSprite: state.resetSprite,
});

export default function App() {
  const { name, level, initSprite, resetSprite } = useGameStore(appSelector);
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState(name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pixel-pet-storage');
    if (!stored) {
      setShowNameInput(true);
    }
  }, []);

  const handleNameConfirm = () => {
    const spriteName = tempName.trim() || '小像素';
    initSprite(spriteName);
    setShowNameInput(false);
  };

  const handleResetConfirm = () => {
    resetSprite();
    setShowResetConfirm(false);
    setShowNameInput(true);
    setTempName('小像素');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          <span className="title-text">{name}</span>
          <span className="title-level">Lv.{level}</span>
        </h1>
        <button
          className="reset-button"
          onClick={() => setShowResetConfirm(true)}
          style={{ borderColor: COLORS.SPRITE_OUTLINE }}
          title="重置精灵"
        >
          🔄
        </button>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <ControlPanel />
        </div>
        <div className="center-panel">
          <SpriteCanvas />
          <StatusBar />
        </div>
      </main>

      <footer className="app-footer">
        <p className="footer-text">像素小精灵 © 2024 | 用❤️精心培育</p>
      </footer>

      {showNameInput && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderColor: COLORS.SPRITE_OUTLINE }}>
            <h2 className="modal-title">领养你的小精灵</h2>
            <p className="modal-desc">给你的小精灵起个名字吧~</p>
            <input
              type="text"
              className="name-input"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="输入精灵名字"
              maxLength={10}
              style={{ borderColor: COLORS.SPRITE_OUTLINE }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameConfirm();
              }}
            />
            <button
              className="modal-button"
              onClick={handleNameConfirm}
              style={{
                backgroundColor: COLORS.BAR_GREEN,
                borderColor: COLORS.SPRITE_OUTLINE,
              }}
            >
              开始养育！
            </button>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderColor: COLORS.SPRITE_OUTLINE }}>
            <h2 className="modal-title">确认重置</h2>
            <p className="modal-desc">确定要重新领养一只新的小精灵吗？当前精灵的所有数据将会丢失。</p>
            <div className="modal-buttons">
              <button
                className="modal-button cancel"
                onClick={() => setShowResetConfirm(false)}
                style={{
                  backgroundColor: COLORS.BAR_YELLOW,
                  borderColor: COLORS.SPRITE_OUTLINE,
                }}
              >
                取消
              </button>
              <button
                className="modal-button confirm"
                onClick={handleResetConfirm}
                style={{
                  backgroundColor: COLORS.BAR_RED,
                  borderColor: COLORS.SPRITE_OUTLINE,
                }}
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

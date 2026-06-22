import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { Deck, DEFAULT_CARD_LIBRARY, cloneCard } from './domain/cardData';
import CardEditor from './ui/CardEditor';
import BattleRunner from './ui/BattleRunner';

interface ThemeContextValue {
  colors: {
    bgPrimary: string;
    bgCard: string;
    textPrimary: string;
    textSecondary: string;
    accentLeft: string;
    accentRight: string;
  };
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: {
    bgPrimary: '#1E1E2E',
    bgCard: '#282840',
    textPrimary: '#E0E0E0',
    textSecondary: '#888888',
    accentLeft: '#3498DB',
    accentRight: '#E74C3C',
  },
});

export const useTheme = () => useContext(ThemeContext);

const THEME: ThemeContextValue = {
  colors: {
    bgPrimary: '#1E1E2E',
    bgCard: '#282840',
    textPrimary: '#E0E0E0',
    textSecondary: '#888888',
    accentLeft: '#3498DB',
    accentRight: '#E74C3C',
  },
};

const App: React.FC = () => {
  const [leftDeck, setLeftDeck] = useState<Deck>(() => [
    cloneCard(DEFAULT_CARD_LIBRARY[0]),
    cloneCard(DEFAULT_CARD_LIBRARY[1]),
    cloneCard(DEFAULT_CARD_LIBRARY[3]),
    cloneCard(DEFAULT_CARD_LIBRARY[4]),
    cloneCard(DEFAULT_CARD_LIBRARY[7]),
  ]);
  const [rightDeck, setRightDeck] = useState<Deck>(() => [
    cloneCard(DEFAULT_CARD_LIBRARY[2]),
    cloneCard(DEFAULT_CARD_LIBRARY[5]),
    cloneCard(DEFAULT_CARD_LIBRARY[6]),
    cloneCard(DEFAULT_CARD_LIBRARY[9]),
    cloneCard(DEFAULT_CARD_LIBRARY[10]),
  ]);
  const [splitRatio, setSplitRatio] = useState(0.3);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.max(0.2, Math.min(0.6, ratio)));
    },
    [isDraggingSplit],
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingSplit(false);
  }, []);

  useEffect(() => {
    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplit, handleMouseMove, handleMouseUp]);

  return (
    <ThemeContext.Provider value={THEME}>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100vh',
          backgroundColor: THEME.colors.bgPrimary,
          color: THEME.colors.textPrimary,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #3A3A55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            background: 'linear-gradient(90deg, #1E1E2E 0%, #2A2A45 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #3498DB, #9B59B6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 800,
                color: '#FFF',
              }}
            >
              ⚔
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>卡牌技能平衡沙盒</div>
              <div style={{ fontSize: 11, color: '#888' }}>Roguelike 卡牌数值模拟工具</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#888' }}>
            <span>左卡组 {leftDeck.length}/10</span>
            <span style={{ opacity: 0.5 }}>vs</span>
            <span>右卡组 {rightDeck.length}/10</span>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
          <div
            style={{
              width: `${splitRatio * 100}%`,
              minWidth: 280,
              backgroundColor: '#1A1A2A',
              borderRight: '1px solid #3A3A55',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <CardEditor
              leftDeck={leftDeck}
              rightDeck={rightDeck}
              onLeftDeckChange={setLeftDeck}
              onRightDeckChange={setRightDeck}
            />
          </div>

          <div
            onMouseDown={() => setIsDraggingSplit(true)}
            style={{
              width: 4,
              cursor: 'col-resize',
              backgroundColor: isDraggingSplit ? '#3498DB' : '#3A3A55',
              flexShrink: 0,
              transition: 'background-color 0.2s',
            }}
          />

          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <BattleRunner leftDeck={leftDeck} rightDeck={rightDeck} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="flex-direction: row"] > div:first-child {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #3A3A55;
          }
          div[style*="flex-direction: row"] > div:nth-child(2) {
            display: none !important;
          }
          div[style*="flex-direction: row"] {
            flex-direction: column !important;
          }
        }
      `}</style>
    </ThemeContext.Provider>
  );
};

export default App;

import { useGameStore } from '@/store/useGameStore';
import { useState } from 'react';

const SettingsModal: React.FC = () => {
  const toggleSettings = useGameStore((s) => s.toggleSettings);
  const resetGame = useGameStore((s) => s.resetGame);
  const [volume, setVolume] = useState(70);
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={toggleSettings}
    >
      <div
        className="glass"
        style={{
          width: 420,
          borderRadius: 20,
          padding: 28,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <div
            className="font-cinzel"
            style={{
              color: '#d4af37',
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            游戏设置
          </div>
          <button
            className="glass-button"
            onClick={toggleSettings}
            style={{ padding: '8px 14px' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#d4af37',
                fontSize: 14,
                marginBottom: 10,
              }}
            >
              <span>🔊</span>
              音量 {volume}%
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#d4af37',
                cursor: 'pointer',
              }}
            />
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#d4af37',
                fontSize: 14,
                marginBottom: 10,
              }}
            >
              <span>🖥</span>
              画质
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  className="glass-button"
                  onClick={() => setQuality(q)}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: quality === q ? 'rgba(212,175,55,0.25)' : undefined,
                    borderColor: quality === q ? 'rgba(212,175,55,0.7)' : undefined,
                  }}
                >
                  {q === 'low' ? '低' : q === 'medium' ? '中' : '高'}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 8,
              paddingTop: 20,
              borderTop: '1px solid rgba(212,175,55,0.15)',
            }}
          >
            <button
              className="glass-button"
              onClick={() => {
                resetGame();
                toggleSettings();
              }}
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px 20px',
              }}
            >
              <span>↻</span>
              重新开始游戏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

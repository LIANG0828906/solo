import { useGameStore } from '@/store/useGameStore';
import NavBar from './NavBar';
import ProgressBar from './ProgressBar';
import SettingsModal from './SettingsModal';
import LoadingOverlay from './LoadingOverlay';

const UILayer: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const showSettings = useGameStore((s) => s.showSettings);
  const collectedCount = useGameStore((s) => s.collectedCount);
  const totalCount = useGameStore((s) => s.totalCount);
  const levelName = useGameStore((s) => s.levelName);
  const currentRuneIndex = useGameStore((s) => s.currentRuneIndex);
  const runesLength = useGameStore((s) => s.runes.length);

  return (
    <>
      {phase === 'loading' && <LoadingOverlay />}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <NavBar
          levelName={levelName}
          onRestart={() => useGameStore.getState().resetGame()}
          onSettings={() => useGameStore.getState().toggleSettings()}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '0 24px',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <ProgressBar
          current={phase === 'matrix' ? currentRuneIndex : collectedCount}
          total={phase === 'matrix' ? runesLength : totalCount}
          label={phase === 'matrix' ? '符文封印进度' : '碎片收集进度'}
        />
      </div>

      {phase === 'matrix' && (
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: 0,
            right: 0,
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        >
          <div
            className="font-cinzel"
            style={{
              color: '#d4af37',
              fontSize: 20,
              textShadow: '0 0 15px rgba(212,175,55,0.6)',
              letterSpacing: '0.1em',
            }}
          >
            能量矩阵 · 按正确顺序点击符文
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        >
          <div
            className="font-cinzel"
            style={{
              color: '#ffd700',
              fontSize: 42,
              textShadow: '0 0 30px rgba(212,175,55,0.8), 0 0 60px rgba(255,0,255,0.4)',
              letterSpacing: '0.15em',
              fontWeight: 700,
            }}
          >
            封印完成
          </div>
          <div
            style={{
              marginTop: 16,
              color: '#d4af37',
              fontSize: 16,
              opacity: 0.85,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            虚空能量已被永久封印
          </div>
          <div style={{ marginTop: 32, pointerEvents: 'auto' }}>
            <button
              className="glass-button"
              onClick={() => useGameStore.getState().resetGame()}
              style={{ fontSize: 16, padding: '14px 32px' }}
            >
              重新开始
            </button>
          </div>
        </div>
      )}

      {showSettings && <SettingsModal />}
    </>
  );
};

export default UILayer;

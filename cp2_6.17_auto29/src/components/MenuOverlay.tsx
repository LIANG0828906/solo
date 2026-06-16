import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { formatResultMessage } from '../ui/MenuManager';

const neonStyle: React.CSSProperties = {
  fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  color: '#E0D0FF',
};

function NeonButton({
  children, onClick, disabled, style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '12px 40px',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 2,
        color: disabled ? '#555' : '#00FFFF',
        background: hover && !disabled ? 'rgba(0,255,255,0.2)' : 'transparent',
        border: '2px solid #00FFFF',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: hover && !disabled
          ? '0 0 20px rgba(0,255,255,0.5), inset 0 0 20px rgba(0,255,255,0.1)'
          : '0 0 8px rgba(0,255,255,0.25)',
        opacity: disabled ? 0.4 : 1,
        textShadow: hover && !disabled ? '0 0 10px #00FFFF' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Star({ filled, appeared }: { filled: boolean; appeared: boolean }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!appeared) { setPhase(0); return; }
    let t = 0;
    const id = setInterval(() => {
      t += 0.05;
      setPhase(Math.min(1, t));
    }, 16);
    return () => clearInterval(id);
  }, [appeared]);

  const scale = phase;
  const rotate = 720 * phase;
  const opacity = appeared ? phase : 0;
  const color = filled ? '#FFD700' : '#3A2A4A';
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      style={{
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        opacity,
        filter: filled ? 'drop-shadow(0 0 8px #FFD700)' : 'none',
        transition: 'opacity 0.1s',
      }}
    >
      <polygon
        points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
        fill={filled ? color : 'transparent'}
        stroke="#FFD700"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export default function MenuOverlay() {
  const screen = useGameStore((s) => s.currentScreen);
  const levels = useGameStore((s) => s.levels);
  const currentLevel = useGameStore((s) => s.currentLevel);
  const resultStars = useGameStore((s) => s.resultStars);
  const fragments = useGameStore((s) => s.collectedFragments);
  const totalFragments = useGameStore((s) => s.totalFragmentsInLevel);
  const startGame = useGameStore((s) => s.startGame);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const goToLevelSelect = useGameStore((s) => s.goToLevelSelect);
  const resetLevel = useGameStore((s) => s.resetLevel);

  const [starAppear, setStarAppear] = useState<boolean[]>([false, false, false]);
  useEffect(() => {
    if (screen === 'result') {
      setStarAppear([false, false, false]);
      const timers: number[] = [];
      timers.push(window.setTimeout(() => setStarAppear((a) => [true, a[1], a[2]]), 300));
      timers.push(window.setTimeout(() => setStarAppear((a) => [a[0], true, a[2]]), 600));
      timers.push(window.setTimeout(() => setStarAppear((a) => [a[0], a[1], true]), 900));
      return () => timers.forEach(clearTimeout);
    }
  }, [screen]);

  const [closeHover, setCloseHover] = useState(false);
  const [selectLevelHover, setSelectLevelHover] = useState<number | null>(null);

  if (screen === 'playing') return null;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: screen === 'result' ? 'rgba(10,5,20,0.85)' : 'rgba(15,10,26,1)',
    backdropFilter: screen === 'result' ? 'blur(2px)' : undefined,
    zIndex: 10,
    ...neonStyle,
  };

  if (screen === 'menu') {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: 60 }}>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 900,
                letterSpacing: 8,
                margin: 0,
                color: '#00FFFF',
                textShadow: '0 0 20px #00FFFF, 0 0 40px rgba(0,255,255,0.5), 0 0 80px rgba(0,200,255,0.3)',
                fontFamily: '"Segoe UI", sans-serif',
              }}
            >
              CHRONO
            </h1>
            <h1
              style={{
                fontSize: 72,
                fontWeight: 900,
                letterSpacing: 12,
                margin: 0,
                color: '#FFD700',
                textShadow: '0 0 20px #FFD700, 0 0 40px rgba(255,215,0,0.5)',
                fontFamily: '"Segoe UI", sans-serif',
              }}
            >
              BREACH
            </h1>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 300,
                height: 300,
                border: '2px solid rgba(255,215,0,0.3)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <p
              style={{
                marginTop: 20,
                fontSize: 14,
                color: '#B090E0',
                letterSpacing: 4,
              }}
            >
              时 · 间 · 裂 · 缝
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
            <NeonButton onClick={() => startGame(currentLevel)}>
              开始游戏
            </NeonButton>
            <NeonButton onClick={goToLevelSelect}>
              关卡选择
            </NeonButton>
          </div>

          <div style={{ marginTop: 80, fontSize: 12, color: '#6B5B8A', letterSpacing: 2 }}>
            <p style={{ margin: '4px 0' }}>操作说明：</p>
            <p style={{ margin: '2px 0' }}>← → 或 A/D 移动　　↑ / W / Space 跳跃</p>
            <p style={{ margin: '2px 0' }}>按住 SHIFT 开启时间力场</p>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:translate(-50%,-50%) scale(0.95);opacity:0.4} 50%{transform:translate(-50%,-50%) scale(1.05);opacity:0.8} }`}</style>
      </div>
    );
  }

  if (screen === 'levelSelect') {
    return (
      <div style={containerStyle}>
        <div style={{ width: 600, textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#00FFFF',
              letterSpacing: 6,
              marginBottom: 50,
              textShadow: '0 0 16px rgba(0,255,255,0.6)',
            }}
          >
            选 择 关 卡
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 50 }}>
            {levels.map((lv, idx) => (
              <div
                key={lv.id}
                onMouseEnter={() => setSelectLevelHover(idx)}
                onMouseLeave={() => setSelectLevelHover(null)}
                onClick={() => startGame(idx)}
                style={{
                  padding: 30,
                  borderRadius: 12,
                  border: `2px solid ${currentLevel === idx ? '#FFD700' : '#00FFFF'}`,
                  background: selectLevelHover === idx
                    ? 'rgba(0,255,255,0.15)'
                    : 'rgba(26,15,46,0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: selectLevelHover === idx
                    ? `0 0 24px rgba(0,255,255,0.4)`
                    : currentLevel === idx
                      ? '0 0 16px rgba(255,215,0,0.4)'
                      : '0 0 8px rgba(0,255,255,0.2)',
                  transform: selectLevelHover === idx ? 'translateY(-4px)' : 'none',
                }}
              >
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFD700', marginBottom: 8 }}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 14, color: '#D0C0F0', letterSpacing: 2 }}>
                  {lv.name || `关卡 ${idx + 1}`}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#8A7AB0' }}>
                  {lv.totalFragments} 个时间碎片
                </div>
              </div>
            ))}
          </div>

          <NeonButton onClick={goToMenu}>返回主菜单</NeonButton>
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div style={containerStyle}>
        <div
          style={{
            width: 400,
            padding: 40,
            borderRadius: 12,
            background: 'linear-gradient(180deg, #1A0F2E 0%, #2B0F3A 100%)',
            boxShadow: '0 0 40px rgba(0,255,255,0.2), inset 0 0 20px rgba(80,40,120,0.3)',
            border: '1px solid rgba(0,255,255,0.3)',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 6,
              color: '#FFD700',
              textShadow: '0 0 16px rgba(255,215,0,0.6)',
              margin: 0,
              marginBottom: 8,
            }}
          >
            关 卡 完 成
          </h2>
          <div style={{ fontSize: 12, color: '#8A7AB0', letterSpacing: 2, marginBottom: 30 }}>
            LEVEL CLEAR
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
            {[0, 1, 2].map((i) => (
              <Star key={i} filled={i < resultStars} appeared={starAppear[i]} />
            ))}
          </div>

          <div
            style={{
              padding: '16px 20px',
              borderRadius: 8,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(180,140,220,0.3)',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#B090E0', fontSize: 13, letterSpacing: 1 }}>收集碎片</span>
              <span style={{ color: '#FFD700', fontSize: 18, fontWeight: 700 }}>
                {fragments} / {totalFragments}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#80D0FF', marginTop: 10, letterSpacing: 1 }}>
              {formatResultMessage(fragments, totalFragments)}
            </div>
            {fragments >= 5 && (
              <div style={{ marginTop: 8, fontSize: 11, color: '#FFD700', letterSpacing: 1 }}>
                ✦ 额外评分已解锁 ✦
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <NeonButton onClick={resetLevel}>再次挑战</NeonButton>
            <NeonButton onClick={goToMenu}>返回主菜单</NeonButton>
          </div>

          <button
            onClick={goToMenu}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '2px solid #5A4A7A',
              background: 'transparent',
              color: closeHover ? '#FFD700' : '#8A7AB0',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: closeHover ? '0 0 12px rgba(255,215,0,0.5)' : 'none',
              borderColor: closeHover ? '#FFD700' : '#5A4A7A',
            }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return null;
}

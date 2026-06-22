import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../data/levels';
import type { GameStats, GradeType } from '../types';

interface MenuScreenProps {
  onStartLevel: (levelId: number) => void;
}

export function MenuScreen({ onStartLevel }: MenuScreenProps) {
  const { gameState, gameStats } = useGameStore();

  if (gameState === 'menu') {
    return <MainMenu onStartLevel={onStartLevel} />;
  }

  if (gameState === 'result' && gameStats) {
    return <ResultScreen stats={gameStats} onRestart={() => onStartLevel(useGameStore.getState().currentLevel?.id || 1)} />;
  }

  return null;
}

function MainMenu({ onStartLevel }: { onStartLevel: (levelId: number) => void }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0A0A16',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      overflow: 'auto'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none'
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 2,
            height: 20 + Math.random() * 40,
            background: i % 2 === 0 ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 71, 87, 0.3)',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `fall ${3 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 5}s`
          }} />
        ))}
      </div>

      <h1 style={{
        fontSize: 32,
        fontFamily: 'Courier New, monospace',
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        textShadow: '0 0 20px #00D4FF, 0 0 40px #00D4FF',
        textAlign: 'center',
        zIndex: 1,
        letterSpacing: 2
      }}>
        PIXEL RHYTHM
      </h1>
      <h2 style={{
        fontSize: 24,
        fontFamily: 'Courier New, monospace',
        color: '#FFD93D',
        marginBottom: 40,
        textShadow: '0 0 15px rgba(255, 217, 61, 0.5)',
        zIndex: 1,
        letterSpacing: 4
      }}>
        RUNNER
      </h2>

      <div style={{
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 12,
        fontFamily: 'Courier New, monospace',
        marginBottom: 30,
        textAlign: 'center',
        zIndex: 1,
        maxWidth: 320,
        lineHeight: 1.8
      }}>
        点击左半屏跳跃 | 点击右半屏滑铲<br/>
        跟随节拍，完美同步！
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        maxWidth: 320,
        zIndex: 1
      }}>
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onStartLevel(level.id)}
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(83, 82, 237, 0.3), rgba(255, 71, 87, 0.3))',
              border: '2px solid rgba(0, 212, 255, 0.5)',
              borderRadius: 8,
              color: '#FFFFFF',
              fontFamily: 'Courier New, monospace',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 200ms ease-out',
              boxShadow: '0 0 15px rgba(0, 212, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(83, 82, 237, 0.5), rgba(255, 71, 87, 0.5))';
              e.currentTarget.style.borderColor = '#00D4FF';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 212, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(83, 82, 237, 0.3), rgba(255, 71, 87, 0.3))';
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 212, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{level.name}</span>
              <span style={{ color: '#FFD93D', fontSize: 12 }}>{level.bpm} BPM</span>
            </div>
            <div style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.5)',
              marginTop: 4,
              fontWeight: 'normal'
            }}>
              {level.description}
            </div>
          </button>
        ))}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: '#00D4FF',
        boxShadow: '0 0 10px #00D4FF, 0 0 20px #00D4FF',
        zIndex: 1
      }} />

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-100px); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ResultScreen({ stats, onRestart }: { stats: GameStats; onRestart: () => void }) {
  const gradeColors: Record<GradeType, string> = {
    'S': '#6BCB77',
    'A': '#FFD93D',
    'B': '#FF9F43',
    'C': '#FF6B6B'
  };

  const total = stats.perfectCount + stats.goodCount + stats.missCount;
  const chartWidth = 280;
  const chartHeight = 100;
  const maxPoints = Math.max(1, stats.syncRateHistory.length);

  const getChartPath = (): string => {
    if (stats.syncRateHistory.length === 0) return '';
    const points = stats.syncRateHistory;
    const stepX = chartWidth / Math.max(1, points.length - 1);
    return points.map((rate, i) => {
      const x = i * stepX;
      const y = chartHeight - (rate / 100) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const handleShare = async () => {
    const text = `🎮 Pixel Rhythm Runner\n${useGameStore.getState().currentLevel?.name || ''}\n评分: ${stats.finalGrade}\n总分: ${stats.totalScore}\n同步率: ${stats.averageSyncRate}%\n完美: ${stats.perfectCount} | 良好: ${stats.goodCount} | 失误: ${stats.missCount}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Pixel Rhythm Runner', text });
      } catch (e) {
        navigator.clipboard.writeText(text);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('成绩已复制到剪贴板！');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #0A0A16, #16213E)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      overflow: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 340,
        background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid rgba(0, 212, 255, 0.3)',
        boxShadow: '0 0 40px rgba(0, 212, 255, 0.2)'
      }}>
        <h2 style={{
          textAlign: 'center',
          color: '#FFFFFF',
          fontFamily: 'Courier New, monospace',
          fontSize: 20,
          marginBottom: 16,
          textShadow: '0 0 10px rgba(0, 212, 255, 0.5)'
        }}>
          {useGameStore.getState().currentLevel?.name}
        </h2>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          <div style={{
            fontSize: 80,
            fontFamily: 'Courier New, monospace',
            fontWeight: 'bold',
            color: gradeColors[stats.finalGrade],
            textShadow: `0 0 20px ${gradeColors[stats.finalGrade]}, 0 0 40px ${gradeColors[stats.finalGrade]}`,
            WebkitTextStroke: '2px rgba(255,255,255,0.2)'
          }}>
            {stats.finalGrade}
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: 20
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#FFD700', fontSize: 24, fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
              {stats.totalScore}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Courier New, monospace' }}>
              总分
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#6BCB77', fontSize: 24, fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
              {stats.averageSyncRate}%
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Courier New, monospace' }}>
              同步率
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 12,
            fontFamily: 'Courier New, monospace',
            marginBottom: 10
          }}>
            同步率曲线
          </div>
          <svg width={chartWidth} height={chartHeight} style={{ display: 'block' }}>
            {[0, 25, 50, 75, 100].map((v) => (
              <line
                key={v}
                x1={0}
                y1={chartHeight - (v / 100) * chartHeight}
                x2={chartWidth}
                y2={chartHeight - (v / 100) * chartHeight}
                stroke="#4A4A5A"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            ))}
            {Array.from({ length: maxPoints + 1 }).map((_, i) => (
              <line
                key={`v${i}`}
                x1={(i * chartWidth) / maxPoints}
                y1={0}
                x2={(i * chartWidth) / maxPoints}
                y2={chartHeight}
                stroke="#4A4A5A"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            ))}
            <path
              d={getChartPath()}
              fill="none"
              stroke="#6BCB77"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 4px #6BCB77)' }}
            />
          </svg>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          marginBottom: 24
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#6BCB77', fontSize: 18, fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
              {stats.perfectCount}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Courier New, monospace' }}>
              完美
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#FFD93D', fontSize: 18, fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
              {stats.goodCount}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Courier New, monospace' }}>
              良好
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#FF6B6B', fontSize: 18, fontFamily: 'Courier New, monospace', fontWeight: 'bold' }}>
              {stats.missCount}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Courier New, monospace' }}>
              失误
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: 12
        }}>
          <button
            onClick={onRestart}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #5352ED, #FF4757)',
              border: 'none',
              borderRadius: 8,
              color: '#FFFFFF',
              fontFamily: 'Courier New, monospace',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 200ms ease-out',
              boxShadow: '0 0 15px rgba(83, 82, 237, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 25px rgba(83, 82, 237, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(83, 82, 237, 0.4)';
            }}
          >
            再来一次
          </button>
          <button
            onClick={handleShare}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: 'rgba(0, 212, 255, 0.2)',
              border: '2px solid #00D4FF',
              borderRadius: 8,
              color: '#00D4FF',
              fontFamily: 'Courier New, monospace',
              fontSize: 14,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 200ms ease-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            分享成绩
          </button>
        </div>

        <div style={{
          marginTop: 20,
          padding: 12,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            width: 60,
            height: 60,
            background: 'white',
            borderRadius: 4,
            padding: 4,
            opacity: 0.8
          }}>
            <svg viewBox="0 0 100 100" width="52" height="52">
              {Array.from({ length: 100 }).map((_, i) => {
                const x = i % 10;
                const y = Math.floor(i / 10);
                const fill = (x * 17 + y * 31 + stats.totalScore) % 3 === 0;
                return fill ? (
                  <rect key={i} x={x * 10} y={y * 10} width={10} height={10} fill="#000" />
                ) : null;
              })}
              <rect x={35} y={35} width={30} height={30} fill="white" stroke="#000" strokeWidth={2} />
              <text x={50} y={55} textAnchor="middle" fontSize={12} fill="#000" fontWeight="bold">
                {stats.finalGrade}
              </text>
            </svg>
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 10,
            fontFamily: 'Courier New, monospace',
            marginTop: 6
          }}>
            扫码查看排行榜
          </div>
        </div>
      </div>
    </div>
  );
}

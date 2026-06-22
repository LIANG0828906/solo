import { useState } from 'react';
import { useGameStore } from '@/GameStore';
import GameBoard from '@/GameBoard';

const COLOR_NAMES: Record<string, string> = {
  red: '红方',
  blue: '蓝方',
  yellow: '黄方',
  green: '绿方',
};

const COLOR_VALUES: Record<string, string> = {
  red: '#e74c3c',
  blue: '#3498db',
  yellow: '#f1c40f',
  green: '#2ecc71',
};

export default function App() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const initGame = useGameStore((s) => s.initGame);

  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState<string[]>(['玩家1', '玩家2', '', '']);

  if (gamePhase === 'playing' || gamePhase === 'finished') {
    return <GameBoard />;
  }

  const handleStart = () => {
    const validNames = names.slice(0, playerCount).map((n, i) =>
      n.trim() || `玩家${i + 1}`
    );
    initGame(validNames);
  };

  const updateName = (index: number, value: string) => {
    const newNames = [...names];
    newNames[index] = value;
    setNames(newNames);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #2c1810, #5a3d2b, #3d2b1f)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
          borderRadius: 20,
          padding: 40,
          maxWidth: 480,
          width: '100%',
          border: '1px solid rgba(212,175,55,0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h1
          style={{
            textAlign: 'center',
            color: '#d4af37',
            fontSize: 36,
            fontWeight: 'bold',
            marginBottom: 8,
            textShadow: '0 2px 8px rgba(212,175,55,0.3)',
          }}
        >
          ✈ 飞行棋大战
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            marginBottom: 32,
          }}
        >
          2-4人实时对战 · 随机事件 · 棋子碰撞
        </p>

        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              display: 'block',
              marginBottom: 8,
            }}
          >
            玩家人数
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setPlayerCount(count)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 8,
                  border:
                    playerCount === count
                      ? '2px solid #d4af37'
                      : '1px solid rgba(255,255,255,0.2)',
                  background:
                    playerCount === count
                      ? 'rgba(212,175,55,0.2)'
                      : 'rgba(255,255,255,0.05)',
                  color: playerCount === count ? '#d4af37' : 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {count}人
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <label
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              display: 'block',
              marginBottom: 8,
            }}
          >
            玩家昵称
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: playerCount }, (_, i) => {
              const colors = ['red', 'blue', 'yellow', 'green'];
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: COLOR_VALUES[colors[i]],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      color: COLOR_VALUES[colors[i]],
                      fontSize: 12,
                      width: 40,
                      flexShrink: 0,
                    }}
                  >
                    {COLOR_NAMES[colors[i]]}
                  </span>
                  <input
                    type="text"
                    value={names[i]}
                    onChange={(e) => updateName(i, e.target.value)}
                    placeholder={`玩家${i + 1}`}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'white',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#d4af37';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.2)';
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleStart}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #d4af37, #b7950b)',
            color: '#1a0f00',
            fontSize: 18,
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 16px rgba(212,175,55,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)';
            e.currentTarget.style.boxShadow =
              '0 6px 24px rgba(212,175,55,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow =
              '0 4px 16px rgba(212,175,55,0.3)';
          }}
        >
          开始游戏
        </button>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            borderLeft: '3px solid #d4af37',
          }}
        >
          <div
            style={{
              color: '#d4af37',
              fontSize: 13,
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            游戏规则
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              lineHeight: 1.8,
            }}
          >
            · 每位玩家控制4枚棋子，绕28格跑道一圈返回起点
            <br />
            · 掷骰子(1-6)前进对应格数，棋子间可碰撞踢回
            <br />
            · 同格2枚以上对手棋子时不可踢回(格位已满)
            <br />
            · 每轮可使用事件卡(冲锋号令/回旋陷阱/队友传送)
            <br />
            · 落在事件格(事)可补充事件卡
            <br />
            · 30秒未操作自动跳过回合
            <br />· 首位4枚棋子全部到达终点者获胜
          </div>
        </div>
      </div>
    </div>
  );
}

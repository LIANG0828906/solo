import { useEffect } from 'react';
import Board from './Board';
import StatusBar from './StatusBar';
import SkillBar from './SkillBar';
import LogPanel from './LogPanel';
import { useGameStore } from './gameStore';

export default function App() {
  const { initGame } = useGameStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1A252F',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <StatusBar />

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24,
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
          }}
        >
          <Board />
          <SkillBar />
        </div>

        <LogPanel />
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '12px 0',
          color: '#7F8C8D',
          fontSize: 12,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        EmojiBattle - 表情符号大乱斗 | 回合制策略对战
      </div>
    </div>
  );
}

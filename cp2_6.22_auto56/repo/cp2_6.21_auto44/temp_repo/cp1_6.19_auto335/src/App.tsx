import { useEffect } from 'react';
import { useBattleStore } from './store/battleStore';
import { startBattle } from './engine/battleEngine';
import BattleField from './components/BattleField';
import CardHand from './components/CardHand';
import StatPanel from './components/StatPanel';

export default function App() {
  const isOver = useBattleStore((s) => s.isOver);
  const winner = useBattleStore((s) => s.winner);
  const turnCount = useBattleStore((s) => s.turnCount);

  useEffect(() => {
    startBattle();
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: '#1a1a2e',
      fontFamily: "'Noto Sans SC', sans-serif",
    }}>
      <div style={{
        width: '60%',
        display: 'flex',
        flexDirection: 'column',
        background: '#16213e',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <BattleField />
        <CardHand />
      </div>

      <div style={{
        width: '40%',
        background: '#1e1e2f',
        borderLeft: '1px solid #2a2a4a',
        overflow: 'auto',
      }}>
        <StatPanel />
      </div>

      {isOver && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '48px',
            fontWeight: 900,
            color: winner === 'player' ? '#4CAF50' : '#EF5350',
            marginBottom: '16px',
            textShadow: winner === 'player'
              ? '0 0 30px rgba(76,175,80,0.6)'
              : '0 0 30px rgba(239,83,80,0.6)',
          }}>
            {winner === 'player' ? '胜 利' : '失 败'}
          </div>
          <div style={{
            fontSize: '18px',
            color: '#aaa',
            marginBottom: '32px',
          }}>
            战斗总回合数: {turnCount}
          </div>
          <button
            onClick={() => startBattle()}
            style={{
              padding: '14px 40px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#fff',
              background: 'linear-gradient(135deg, #E53935, #FF7043)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 20px rgba(229,57,53,0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}

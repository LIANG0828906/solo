import Board from './ui/Board';
import InfoPanel from './ui/InfoPanel';

export default function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0B0E14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <h1
          style={{
            color: '#FFD700',
            fontSize: '28px',
            fontWeight: 'bold',
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '2px'
          }}
        >
          RUNE TACTICS
        </h1>
        <div style={{ fontSize: '12px', color: '#888' }}>
          符文战术 · 回合制对战
        </div>
        <Board />
        <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', maxWidth: '400px' }}>
          拖拽符文移动 · 移动后自动攻击相邻敌人 · 属性克制造成双倍伤害
          <br />
          火克风 · 风克土 · 土克水 · 水克火
        </div>
      </div>
      <InfoPanel />
    </div>
  );
}

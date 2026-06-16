import { useGameStore } from './store';
import { ELEMENT_COLORS, ELEMENT_NAMES, RuneElement } from '../game/types';

export default function InfoPanel() {
  const {
    gameState,
    selectedRune,
    doEndTurn,
    doResetGame
  } = useGameStore();
  
  const currentPlayer = gameState.players[gameState.currentTurn];
  
  const handleExit = () => {
    if (confirm('确定要退出游戏吗？')) {
      doResetGame();
    }
  };
  
  const getStatusLabel = () => {
    if (gameState.status === 'player1_win') return '玩家1 获胜！';
    if (gameState.status === 'player2_win') return '玩家2 获胜！';
    return '对战中';
  };
  
  return (
    <div
      style={{
        width: '220px',
        backgroundColor: '#1A1A2E',
        border: '2px solid #B8860B',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        color: '#FFFFFF',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ textAlign: 'center', borderBottom: '1px solid #B8860B', paddingBottom: '12px' }}>
        <div style={{ fontSize: '40px', fontWeight: 'bold', lineHeight: 1 }}>
          {gameState.turnNumber}
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>回合</div>
        
        <div
          style={{
            marginTop: '12px',
            fontSize: '20px',
            color: '#FFD700',
            fontWeight: 'bold'
          }}
        >
          {currentPlayer.name}
        </div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          {getStatusLabel()}
        </div>
      </div>
      
      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#B8860B' }}>
          符文详情
        </div>
        
        {selectedRune ? (
          <div
            style={{
              backgroundColor: '#16213E',
              borderRadius: '6px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: ELEMENT_COLORS[selectedRune.element as RuneElement].primary,
                  border: `2px solid ${ELEMENT_COLORS[selectedRune.element as RuneElement].border}`
                }}
              />
              <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {ELEMENT_NAMES[selectedRune.element as RuneElement]}符文
              </span>
            </div>
            
            <div style={{ fontSize: '12px', color: '#AAA' }}>
              属性: {ELEMENT_NAMES[selectedRune.element as RuneElement]}
            </div>
            
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#FF6B6B' }}>攻击力: {selectedRune.attack}</span>
            </div>
            
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#4ECDC4' }}>生命值: {selectedRune.currentHp} / {selectedRune.maxHp}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
              {selectedRune.hasMoved && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: '#555',
                    color: '#FFF'
                  }}
                >
                  已移动
                </span>
              )}
              {selectedRune.hasAttacked && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: '#555',
                    color: '#FFF'
                  }}
                >
                  已攻击
                </span>
              )}
              {!selectedRune.hasMoved && !selectedRune.hasAttacked && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: '#4CAF50',
                    color: '#FFF'
                  }}
                >
                  可行动
                </span>
              )}
            </div>
            
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#888' }}>
              所属: {selectedRune.owner === 'player1' ? '玩家1' : '玩家2'}
            </div>
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#16213E',
              borderRadius: '6px',
              padding: '20px 12px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px'
            }}
          >
            点击选中一个符文
            <br />
            查看详细属性
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={doEndTurn}
          disabled={gameState.status !== 'playing'}
          style={{
            width: '100%',
            height: '40px',
            backgroundColor: '#4A4A6A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: gameState.status !== 'playing' ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            opacity: gameState.status !== 'playing' ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (gameState.status === 'playing') {
              e.currentTarget.style.backgroundColor = '#6A6A8A';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4A4A6A';
          }}
          onMouseDown={(e) => {
            if (gameState.status === 'playing') {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          结束回合
        </button>
        
        <button
          onClick={doResetGame}
          style={{
            width: '100%',
            height: '40px',
            backgroundColor: '#8B0000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#A52A2A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#8B0000';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          重置棋盘
        </button>
        
        <button
          onClick={handleExit}
          style={{
            width: '100%',
            height: '40px',
            backgroundColor: '#555555',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#777777';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#555555';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          退出游戏
        </button>
      </div>
    </div>
  );
}

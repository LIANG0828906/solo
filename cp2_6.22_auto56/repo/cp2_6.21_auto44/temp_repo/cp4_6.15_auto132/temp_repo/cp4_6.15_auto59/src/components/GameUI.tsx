import React from 'react';
import { GameState, EditorTool } from '../types';
import { levels } from '../levels';

interface GameUIProps {
  gameState: GameState;
  onStartGame: (levelIndex: number) => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onBackToMenu: () => void;
  onEditorMode: () => void;
  onSelectTool: (tool: EditorTool | null) => void;
  onSaveLevel: () => void;
  onLoadLevel: () => void;
  onPlayCustomLevel: () => void;
  onClearLevel: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  onStartGame,
  onRestart,
  onNextLevel,
  onBackToMenu,
  onEditorMode,
  onSelectTool,
  onSaveLevel,
  onLoadLevel,
  onPlayCustomLevel,
  onClearLevel,
}) => {
  const { score, lives, level, gameStatus, selectedTool } = gameState;

  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      const isActive = i < lives;
      hearts.push(
        <div key={i} style={{ position: 'relative', width: '24px', height: '22px', marginLeft: '4px' }}>
          <div
            style={{
              position: 'absolute',
              left: '0px',
              top: '8px',
              width: '12px',
              height: '12px',
              backgroundColor: isActive ? '#e74c3c' : '#444',
              transform: 'rotate(-45deg)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '6px',
              top: '2px',
              width: '12px',
              height: '12px',
              backgroundColor: isActive ? '#e74c3c' : '#444',
              borderRadius: '50%',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '8px',
              width: '12px',
              height: '12px',
              backgroundColor: isActive ? '#e74c3c' : '#444',
              borderRadius: '50%',
            }}
          />
        </div>
      );
    }
    return hearts;
  };

  if (gameStatus === 'menu') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          borderRadius: '8px',
          fontFamily: "'Press Start 2P', cursive",
          color: '#fff',
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            color: '#ff6b35',
            marginBottom: '40px',
            textShadow: '3px 3px 0px #000',
            fontFamily: "'Press Start 2P', cursive",
          }}
        >
          平台跳跃
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {levels.map((_, index) => (
            <button
              key={index}
              onClick={() => onStartGame(index)}
              style={{
                padding: '12px 24px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '12px',
                backgroundColor: '#2ecc71',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                boxShadow: '0 4px 0 #27ae60',
                transition: 'all 0.1s',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = '0 2px 0 #27ae60';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 #27ae60';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 0 #27ae60';
              }}
            >
              关卡 {index + 1}
            </button>
          ))}

          <button
            onClick={onEditorMode}
            style={{
              padding: '12px 24px',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '12px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #2980b9',
              marginTop: '20px',
              transition: 'all 0.1s',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = '0 2px 0 #2980b9';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 #2980b9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 0 #2980b9';
            }}
          >
            关卡编辑器
          </button>
        </div>

        <p
          style={{
            marginTop: '30px',
            fontSize: '8px',
            color: '#888',
            fontFamily: "'Press Start 2P', cursive",
          }}
        >
          A/D 移动 | 空格 跳跃
        </p>
      </div>
    );
  }

  if (gameStatus === 'editor') {
    return (
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          fontFamily: "'Press Start 2P', cursive",
          color: '#fff',
          fontSize: '10px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => onSelectTool('platform')}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: selectedTool === 'platform' ? '#e0e0e0' : '#555',
                color: selectedTool === 'platform' ? '#000' : '#fff',
                border: '2px solid #333',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              平台
            </button>
            <button
              onClick={() => onSelectTool('coin')}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: selectedTool === 'coin' ? '#ffd700' : '#555',
                color: selectedTool === 'coin' ? '#000' : '#fff',
                border: '2px solid #333',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              金币
            </button>
            <button
              onClick={() => onSelectTool('spike')}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: selectedTool === 'spike' ? '#e74c3c' : '#555',
                color: '#fff',
                border: '2px solid #333',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              尖刺
            </button>
            <button
              onClick={() => onSelectTool('goal')}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: selectedTool === 'goal' ? '#2ecc71' : '#555',
                color: '#fff',
                border: '2px solid #333',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              终点
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onSaveLevel}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: '#2ecc71',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              保存
            </button>
            <button
              onClick={onLoadLevel}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              加载
            </button>
            <button
              onClick={onPlayCustomLevel}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: '#ff6b35',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              试玩
            </button>
            <button
              onClick={onClearLevel}
              style={{
                padding: '6px 10px',
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '8px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              清空
            </button>
          </div>

          <p
            style={{
              fontSize: '7px',
              color: '#aaa',
              marginTop: '4px',
            }}
          >
            左键放置/拖动 | 右键删除元素 | 拖平台右下角可调整大小
          </p>
        </div>

        <button
          onClick={onBackToMenu}
          style={{
            padding: '6px 10px',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: '8px',
            backgroundColor: '#666',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          返回菜单
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '20px',
          fontFamily: "'Press Start 2P', cursive",
          color: '#fff',
          fontSize: '12px',
          textShadow: '2px 2px 0px #000',
          pointerEvents: 'none',
        }}
      >
        得分: {score}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {renderHearts()}
      </div>

      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: "'Press Start 2P', cursive",
          color: '#fff',
          fontSize: '10px',
          textShadow: '2px 2px 0px #000',
          pointerEvents: 'none',
        }}
      >
        关卡 {level + 1}
      </div>

      <button
        onClick={onBackToMenu}
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          padding: '6px 10px',
          fontFamily: "'Press Start 2P', cursive",
          fontSize: '8px',
          backgroundColor: 'rgba(100, 100, 100, 0.7)',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        菜单
      </button>

      {gameStatus === 'won' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            fontFamily: "'Press Start 2P', cursive",
            zIndex: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px 40px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                color: '#2ecc71',
                fontSize: '20px',
                marginBottom: '20px',
                fontFamily: "'Press Start 2P', cursive",
                animation: 'blink 0.5s infinite alternate',
              }}
            >
              胜利！
            </h2>
            <p
              style={{
                color: '#333',
                fontSize: '12px',
                marginBottom: '25px',
                fontFamily: "'Press Start 2P', cursive",
              }}
            >
              得分: {score}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {level < levels.length - 1 && (
                <button
                  onClick={onNextLevel}
                  style={{
                    padding: '10px 18px',
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '10px',
                    backgroundColor: '#2ecc71',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 0 #27ae60',
                    transition: 'all 0.1s',
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(2px)';
                    e.currentTarget.style.boxShadow = '0 1px 0 #27ae60';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 0 #27ae60';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 3px 0 #27ae60';
                  }}
                >
                  下一关
                </button>
              )}
              <button
                onClick={onRestart}
                style={{
                  padding: '10px 18px',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '10px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #2980b9',
                  transition: 'all 0.1s',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 1px 0 #2980b9';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #2980b9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #2980b9';
                }}
              >
                重玩
              </button>
              <button
                onClick={onBackToMenu}
                style={{
                  padding: '10px 18px',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '10px',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #7f8c8d',
                  transition: 'all 0.1s',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 1px 0 #7f8c8d';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #7f8c8d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #7f8c8d';
                }}
              >
                菜单
              </button>
            </div>
          </div>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            fontFamily: "'Press Start 2P', cursive",
            zIndex: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '30px 40px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                color: '#e74c3c',
                fontSize: '20px',
                marginBottom: '20px',
                fontFamily: "'Press Start 2P', cursive",
              }}
            >
              游戏结束
            </h2>
            <p
              style={{
                color: '#333',
                fontSize: '12px',
                marginBottom: '25px',
                fontFamily: "'Press Start 2P', cursive",
              }}
            >
              最终得分: {score}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={onRestart}
                style={{
                  padding: '10px 18px',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '10px',
                  backgroundColor: '#2ecc71',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #27ae60',
                  transition: 'all 0.1s',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 1px 0 #27ae60';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #27ae60';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #27ae60';
                }}
              >
                再试一次
              </button>
              <button
                onClick={onBackToMenu}
                style={{
                  padding: '10px 18px',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '10px',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 3px 0 #7f8c8d',
                  transition: 'all 0.1s',
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'translateY(2px)';
                  e.currentTarget.style.boxShadow = '0 1px 0 #7f8c8d';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #7f8c8d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 3px 0 #7f8c8d';
                }}
              >
                返回菜单
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.4; transform: scale(1.05); }
        }
      `}</style>
    </>
  );
};

export default GameUI;

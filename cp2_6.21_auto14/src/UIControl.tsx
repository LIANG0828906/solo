import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  startGame,
  stopGame,
  initEngine,
  destroyEngine,
  onStateChange,
  SHIP_CONFIGS,
  ShipType,
  GameState,
  ShipConfig,
} from './gameEngine';
import { playClick } from './audioManager';

const COLOR_PALETTE = [
  '#00f0ff',
  '#ff007a',
  '#ffd700',
  '#00ff88',
  '#ff6600',
  '#9d4edd',
  '#ff3366',
  '#00ccff',
];

const DEFAULT_COLORS = ['#00f0ff', '#ff007a'];

interface ScoreRecord {
  player1Wins: number;
  player2Wins: number;
  draws: number;
}

const STORAGE_KEY = 'cyber_shooter_scores';

function loadScores(): ScoreRecord {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load scores:', e);
  }
  return { player1Wins: 0, player2Wins: 0, draws: 0 };
}

function saveScores(scores: ScoreRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch (e) {
    console.error('Failed to save scores:', e);
  }
}

const ShipIcon: React.FC<{ type: ShipType; color: string; size?: number }> = ({ type, color, size = 40 }) => {
  const half = size / 2;
  switch (type) {
    case 'fast':
      return (
        <svg width={size} height={size} viewBox={`-${half} -${half} ${size} ${size}`}>
          <polygon
            points={`${half * 0.9},0 -${half * 0.6},-${half * 0.7} -${half * 0.3},0 -${half * 0.6},${half * 0.7}`}
            fill={color}
            stroke={color}
            strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
      );
    case 'balanced':
      const hexPoints: string[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        hexPoints.push(`${Math.cos(angle) * half * 0.8},${Math.sin(angle) * half * 0.8}`);
      }
      return (
        <svg width={size} height={size} viewBox={`-${half} -${half} ${size} ${size}`}>
          <polygon
            points={hexPoints.join(' ')}
            fill={color}
            stroke={color}
            strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
      );
    case 'heavy':
      return (
        <svg width={size} height={size} viewBox={`-${half} -${half} ${size} ${size}`}>
          <circle
            cx={0}
            cy={0}
            r={half * 0.8}
            fill={color}
            stroke={color}
            strokeWidth="1.5"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
      );
  }
};

const HealthBar: React.FC<{ health: number; maxHealth: number; color: string; label: string }> = ({
  health,
  maxHealth,
  color,
  label,
}) => {
  const percentage = Math.max(0, (health / maxHealth) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 4,
        fontSize: 12,
        color: '#aaa',
        fontFamily: '"Courier New", monospace',
      }}>
        <span>{label}</span>
        <span>{health}/{maxHealth}</span>
      </div>
      <div style={{
        width: '100%',
        height: 10,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 5,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
      }}>
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
            transition: 'width 0.1s ease-out',
          }}
        />
      </div>
    </div>
  );
};

const ShipTypeCard: React.FC<{
  type: ShipType;
  color: string;
  selected: boolean;
  onClick: () => void;
  label: string;
  description: string;
}> = ({ type, color, selected, onClick, label, description }) => {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 12,
        border: `2px solid ${selected ? color : 'rgba(255,255,255,0.15)'}`,
        backgroundColor: selected ? `${color}15` : 'rgba(255,255,255,0.03)',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        minWidth: 110,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 20px ${color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <ShipIcon type={type} color={color} size={48} />
      </div>
      <div style={{
        color: color,
        fontFamily: '"Courier New", monospace',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontFamily: '"Courier New", monospace',
      }}>
        {description}
      </div>
    </div>
  );
};

const ColorPicker: React.FC<{
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
}> = ({ colors, selectedColor, onSelect }) => {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
      {colors.map((color) => (
        <div
          key={color}
          onClick={() => onSelect(color)}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: color,
            cursor: 'pointer',
            border: selectedColor === color ? '3px solid white' : '2px solid rgba(255,255,255,0.2)',
            boxShadow: selectedColor === color ? `0 0 15px ${color}` : 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (selectedColor !== color) {
              e.currentTarget.style.transform = 'scale(1.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      ))}
    </div>
  );
};

export const UIControl: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePhase, setGamePhase] = useState<'select' | 'countdown' | 'playing' | 'victory'>('select');
  const [player1Type, setPlayer1Type] = useState<ShipType>('balanced');
  const [player2Type, setPlayer2Type] = useState<ShipType>('balanced');
  const [player1Color, setPlayer1Color] = useState(DEFAULT_COLORS[0]);
  const [player2Color, setPlayer2Color] = useState(DEFAULT_COLORS[1]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [scores, setScores] = useState<ScoreRecord>(loadScores());
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 500 });

  useEffect(() => {
    const updateSize = () => {
      const maxWidth = Math.min(window.innerWidth * 0.8, 1000);
      const maxHeight = Math.min(window.innerHeight * 0.7, 600);
      const aspectRatio = 16 / 9;
      let width = maxWidth;
      let height = width / aspectRatio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      initEngine(canvasRef.current);
    }
    return () => {
      destroyEngine();
    };
  }, []);

  const gamePhaseRef = useRef(gamePhase);
  const scoresRef = useRef(scores);

  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  useEffect(() => {
    onStateChange((state) => {
      setGameState(state);
      const currentPhase = gamePhaseRef.current;

      if (state.phase === 'countdown' && currentPhase === 'select') {
        setGamePhase('countdown');
      } else if (state.phase === 'playing' && currentPhase === 'countdown') {
        setGamePhase('playing');
      } else if (state.phase === 'victory' && currentPhase === 'playing') {
        setGamePhase('victory');

        const newScores = { ...scoresRef.current };
        if (state.winner === 1) {
          newScores.player1Wins++;
        } else if (state.winner === 2) {
          newScores.player2Wins++;
        } else {
          newScores.draws++;
        }
        setScores(newScores);
        saveScores(newScores);

        setTimeout(() => {
          setGamePhase('select');
          stopGame();
        }, 2000);
      }
    });
  }, []);

  const handleStart = useCallback(() => {
    playClick();

    const ship1Config: ShipConfig = {
      ...SHIP_CONFIGS[player1Type],
      color: player1Color,
    };
    const ship2Config: ShipConfig = {
      ...SHIP_CONFIGS[player2Type],
      color: player2Color,
    };

    startGame({
      player1: { shipConfig: ship1Config },
      player2: { shipConfig: ship2Config },
      canvasWidth: canvasSize.width,
      canvasHeight: canvasSize.height,
    });
  }, [player1Type, player2Type, player1Color, player2Color, canvasSize]);

  const renderCountdown = () => {
    if (!gameState || gamePhase !== 'countdown') return null;
    const count = Math.ceil(gameState.countdown);

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          key={count}
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: '#ff3333',
            fontFamily: '"Courier New", monospace',
            textShadow: '0 0 30px #ff3333, 0 0 60px #ff0000',
            animation: 'countdownPulse 1s ease-out',
          }}
        >
          {count || 'GO!'}
        </div>
      </div>
    );
  };

  const renderVictory = () => {
    if (!gameState || gamePhase !== 'victory') return null;

    const winnerColor = gameState.winner === 1 ? player1Color : player2Color;
    const winnerLabel = `玩家 ${gameState.winner} 胜利!`;

    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#ffd700',
            fontFamily: '"Courier New", monospace',
            textShadow: `0 0 20px #ffd700, 0 0 40px ${winnerColor}`,
            animation: 'victoryBounce 0.5s ease-out',
            marginBottom: 16,
          }}
        >
          {winnerLabel}
        </div>
        <div style={{
          fontSize: 20,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: '"Courier New", monospace',
        }}>
          {gameState.player1.score} : {gameState.player2.score}
        </div>
      </div>
    );
  };

  const renderSelectScreen = () => {
    if (gamePhase !== 'select') return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(10, 10, 46, 0.98)',
          zIndex: 100,
          padding: '20px',
          boxSizing: 'border-box',
          overflowY: 'auto',
        }}
      >
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
        >
        <h1 style={{
          fontSize: 42,
          fontFamily: '"Courier New", monospace',
          fontWeight: 'bold',
          color: '#00f0ff',
          textShadow: '3px 3px 0 #ff007a, 0 0 20px #00f0ff',
          marginBottom: 30,
          letterSpacing: 2,
        }}>
          CYBER SHOOTER
        </h1>

        <div style={{
          display: 'flex',
          gap: 60,
          marginBottom: 30,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              color: player1Color,
              fontFamily: '"Courier New", monospace',
              marginBottom: 16,
              fontSize: 18,
              textShadow: `0 0 10px ${player1Color}`,
            }}>
              玩家 1 (WASD)
            </h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {(['fast', 'balanced', 'heavy'] as ShipType[]).map((type) => (
                <ShipTypeCard
                  key={type}
                  type={type}
                  color={player1Color}
                  selected={player1Type === type}
                  onClick={() => { playClick(); setPlayer1Type(type); }}
                  label={type === 'fast' ? '快速型' : type === 'balanced' ? '均衡型' : '重装型'}
                  description={type === 'fast' ? '速度快 血量低' : type === 'balanced' ? '中等属性' : '速度慢 血量高'}
                />
              ))}
            </div>
            <ColorPicker
              colors={COLOR_PALETTE}
              selectedColor={player1Color}
              onSelect={(c) => { playClick(); setPlayer1Color(c); }}
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            color: 'rgba(255,255,255,0.3)',
            fontFamily: '"Courier New", monospace',
          }}>
            VS
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{
              color: player2Color,
              fontFamily: '"Courier New", monospace',
              marginBottom: 16,
              fontSize: 18,
              textShadow: `0 0 10px ${player2Color}`,
            }}>
              玩家 2 (方向键)
            </h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              {(['fast', 'balanced', 'heavy'] as ShipType[]).map((type) => (
                <ShipTypeCard
                  key={type}
                  type={type}
                  color={player2Color}
                  selected={player2Type === type}
                  onClick={() => { playClick(); setPlayer2Type(type); }}
                  label={type === 'fast' ? '快速型' : type === 'balanced' ? '均衡型' : '重装型'}
                  description={type === 'fast' ? '速度快 血量低' : type === 'balanced' ? '中等属性' : '速度慢 血量高'}
                />
              ))}
            </div>
            <ColorPicker
              colors={COLOR_PALETTE}
              selectedColor={player2Color}
              onSelect={(c) => { playClick(); setPlayer2Color(c); }}
            />
          </div>
        </div>

        <button
          onClick={handleStart}
          style={{
            padding: '16px 48px',
            fontSize: 20,
            fontFamily: '"Courier New", monospace',
            fontWeight: 'bold',
            color: 'white',
            background: 'linear-gradient(135deg, #00f0ff, #ff007a)',
            border: 'none',
            borderRadius: 30,
            cursor: 'pointer',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(255, 0, 122, 0.2)',
            transition: 'all 0.2s ease',
            letterSpacing: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.filter = 'brightness(1.2)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.6), 0 0 60px rgba(255, 0, 122, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.4), 0 0 40px rgba(255, 0, 122, 0.2)';
          }}
        >
          开始战斗
        </button>

        <div style={{
          marginTop: 30,
          fontSize: 13,
          color: 'rgba(255,255,255,0.5)',
          fontFamily: '"Courier New", monospace',
          textAlign: 'center',
        }}>
          玩家1: WASD 移动 / 玩家2: 方向键 移动
          <br />
          自动射击，击中对方得 10 分
        </div>
        </div>
      </div>
    );
  };

  const renderScoreboard = () => (
    <div
      style={{
        position: 'absolute',
        top: 15,
        right: 15,
        padding: '10px 16px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.15)',
        fontFamily: '"Courier New", monospace',
        fontSize: 13,
        color: 'white',
        zIndex: 5,
      }}
    >
      <div style={{ marginBottom: 4, fontWeight: 'bold', color: '#00f0ff' }}>历史比分</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <span style={{ color: player1Color }}>P1: {scores.player1Wins}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
        <span style={{ color: player2Color }}>P2: {scores.player2Wins}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
        <span style={{ color: 'rgba(255,255,255,0.6)' }}>平: {scores.draws}</span>
      </div>
    </div>
  );

  const renderTitle = () => (
    <div
      style={{
        position: 'absolute',
        top: 15,
        left: 15,
        fontFamily: '"Courier New", monospace',
        fontWeight: 'bold',
        fontSize: 20,
        color: '#00f0ff',
        textShadow: '2px 2px 0 #ff007a, 0 0 10px #00f0ff',
        zIndex: 5,
        letterSpacing: 1,
      }}
    >
      CYBER SHOOTER
    </div>
  );

  const renderSidePanels = () => {
    if (gamePhase === 'select' || !gameState) return null;

    return (
      <>
        <div style={{
          position: 'absolute',
          left: '2%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '8%',
          zIndex: 5,
        }}>
          <div style={{
            padding: 12,
            backgroundColor: 'rgba(0, 240, 255, 0.05)',
            borderRadius: 8,
            border: '1px solid rgba(0, 240, 255, 0.2)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <ShipIcon type={player1Type} color={player1Color} size={36} />
            </div>
            <HealthBar
              health={gameState.player1.health}
              maxHealth={gameState.player1.maxHealth}
              color={player1Color}
              label="HP"
            />
            <div style={{
              textAlign: 'center',
              fontFamily: '"Courier New", monospace',
              fontSize: 14,
              color: player1Color,
              fontWeight: 'bold',
            }}>
              得分: {gameState.player1.score}
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          right: '2%',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '8%',
          zIndex: 5,
        }}>
          <div style={{
            padding: 12,
            backgroundColor: 'rgba(255, 0, 122, 0.05)',
            borderRadius: 8,
            border: '1px solid rgba(255, 0, 122, 0.2)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <ShipIcon type={player2Type} color={player2Color} size={36} />
            </div>
            <HealthBar
              health={gameState.player2.health}
              maxHealth={gameState.player2.maxHealth}
              color={player2Color}
              label="HP"
            />
            <div style={{
              textAlign: 'center',
              fontFamily: '"Courier New", monospace',
              fontSize: 14,
              color: player2Color,
              fontWeight: 'bold',
            }}>
              得分: {gameState.player2.score}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'radial-gradient(ellipse at center, #1a0a2e 0%, #060612 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes countdownPulse {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes victoryBounce {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {renderTitle()}
      {renderScoreboard()}
      {renderSidePanels()}
      {renderSelectScreen()}

      <div style={{
        position: 'relative',
        width: canvasSize.width,
        height: canvasSize.height,
        border: '1px solid rgba(0, 240, 255, 0.2)',
        borderRadius: 4,
        boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)',
        overflow: 'hidden',
      }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
        {renderCountdown()}
        {renderVictory()}
      </div>
    </div>
  );
};

export default UIControl;

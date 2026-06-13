import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gameEngine, GameState, PlayerState, Ingredient } from './gameEngine';
import { INGREDIENT_CONFIGS, IngredientState, getStateLabel, PlateIngredient, RECIPES } from './recipeData';
import { playerSync } from './playerSync';

const STATE_COLORS: Record<IngredientState, string> = {
  raw: '#FF4444',
  half_cooked: '#FFA500',
  cooked: '#8B4513',
  burnt: '#2C2C2C'
};

const STATE_BG_COLORS: Record<IngredientState, string> = {
  raw: 'rgba(255, 68, 68, 0.15)',
  half_cooked: 'rgba(255, 165, 0, 0.25)',
  cooked: 'rgba(139, 69, 19, 0.3)',
  burnt: 'rgba(44, 44, 44, 0.4)'
};

interface DragState {
  ingredient: Ingredient;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export const IngredientIcon: React.FC<{
  type: string;
  state: IngredientState;
  size?: number;
  showLabel?: boolean;
}> = ({ type, state, size = 48, showLabel = false }) => {
  const config = INGREDIENT_CONFIGS[type as keyof typeof INGREDIENT_CONFIGS];
  if (!config) return null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.5s ease',
      filter: state === 'burnt' ? 'brightness(0.4)' : state === 'cooked' ? 'brightness(0.85) saturate(1.2)' : state === 'half_cooked' ? 'brightness(0.95)' : 'none'
    }}>
      <div style={{
        fontSize: size,
        lineHeight: 1,
        transition: 'filter 0.5s ease, transform 0.5s ease',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
      }}>
        {config.icon}
      </div>
      {showLabel && (
        <div style={{
          fontSize: 11,
          color: STATE_COLORS[state],
          marginTop: 2,
          fontWeight: 600,
          backgroundColor: STATE_BG_COLORS[state],
          padding: '1px 6px',
          borderRadius: 8,
          transition: 'all 0.5s ease'
        }}>
          {getStateLabel(state)}
        </div>
      )}
      {state === 'burnt' && (
        <div style={{
          position: 'absolute',
          fontSize: 18,
          animation: 'smoke 1.5s ease-in-out infinite'
        }}>
          💨
        </div>
      )}
    </div>
  );
};

export const CircularProgress: React.FC<{
  progress: number;
  size?: number;
}> = ({ progress, size = 80 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isDone = progress >= 100;

  return (
    <div style={{
      position: 'relative',
      width: size,
      height: size
    }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(139, 69, 19, 0.2)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDone ? '#FFD700' : '#F4A460'}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease',
            filter: isDone ? 'drop-shadow(0 0 8px #FFD700)' : 'none'
          }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: 14,
        fontWeight: 700,
        color: isDone ? '#FFD700' : '#8B4513'
      }}>
        {Math.round(progress)}%
      </div>
    </div>
  );
};

export const ProgressBar: React.FC<{
  progress: number;
  color?: string;
  label?: string;
}> = ({ progress, color = '#FFD700', label }) => {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ fontSize: 12, color: '#8B4513', marginBottom: 4, fontWeight: 600 }}>
          {label}
        </div>
      )}
      <div style={{
        width: '100%',
        height: 14,
        backgroundColor: 'rgba(139, 69, 19, 0.2)',
        borderRadius: 7,
        overflow: 'hidden',
        border: '2px solid rgba(139, 69, 19, 0.3)'
      }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            borderRadius: 5,
            transition: 'width 0.3s ease',
            boxShadow: progress >= 100 ? `0 0 10px ${color}` : 'none',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'shine 1.5s infinite'
          }} />
        </div>
      </div>
    </div>
  );
};

export const Kitchen: React.FC<{
  player: PlayerState;
  isOpponent?: boolean;
  onDragStart?: (ingredient: Ingredient, x: number, y: number) => void;
  onDragEnd?: (x: number, y: number, ingredientId: string) => void;
}> = ({ player, isOpponent = false, onDragStart, onDragEnd }) => {
  const stoveRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const [plateShake, setPlateShake] = useState(false);
  const prevPlateLen = useRef(player.plate.length);

  useEffect(() => {
    if (player.plate.length > prevPlateLen.current) {
      setPlateShake(true);
      setTimeout(() => setPlateShake(false), 300);
    }
    prevPlateLen.current = player.plate.length;
  }, [player.plate.length]);

  const handleSlotMouseDown = (e: React.MouseEvent, ingredient: Ingredient) => {
    if (isOpponent) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onDragStart?.(ingredient, e.clientX, e.clientY);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: 12,
      background: isOpponent
        ? 'linear-gradient(135deg, rgba(244, 164, 96, 0.1) 0%, rgba(139, 69, 19, 0.1) 100%)'
        : 'linear-gradient(135deg, rgba(244, 164, 96, 0.25) 0%, rgba(139, 69, 19, 0.15) 100%)',
      borderRadius: 12,
      border: `3px solid ${isOpponent ? 'rgba(139, 69, 19, 0.3)' : '#F4A460'}`,
      minHeight: 0,
      position: 'relative'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#8B4513',
          padding: '4px 12px',
          background: isOpponent ? 'rgba(139, 69, 19, 0.15)' : 'rgba(244, 164, 96, 0.4)',
          borderRadius: 12
        }}>
          {isOpponent ? '👤 对手' : '🧑‍🍳 我'}
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#F4A460'
        }}>
          ⭐ {player.score}
        </div>
      </div>

      <ProgressBar progress={player.progress} label="进度" />

      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 10,
        marginBottom: 10,
        justifyContent: 'center'
      }}>
        {player.slots.map(slot => (
          <div
            key={slot.slotId}
            onMouseDown={(e) => slot.ingredient && handleSlotMouseDown(e, slot.ingredient)}
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              background: slot.ingredient
                ? `linear-gradient(135deg, ${STATE_BG_COLORS[slot.ingredient.state]}, rgba(255,255,255,0.1))`
                : 'rgba(139, 69, 19, 0.1)',
              border: `2px dashed ${slot.ingredient ? STATE_COLORS[slot.ingredient.state] : 'rgba(139, 69, 19, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: slot.ingredient && !isOpponent ? 'grab' : 'default',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: slot.ingredient ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {slot.ingredient ? (
              <IngredientIcon type={slot.ingredient.type} state={slot.ingredient.state} size={36} showLabel />
            ) : (
              <span style={{ fontSize: 20, opacity: 0.3 }}>+</span>
            )}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        gap: 12,
        minHeight: 0
      }}>
        <div
          ref={stoveRef}
          style={{
            flex: 1,
            background: 'linear-gradient(180deg, rgba(80, 80, 80, 0.4) 0%, rgba(50, 50, 50, 0.6) 100%)',
            borderRadius: 16,
            border: '3px solid rgba(80, 80, 80, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: 120
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: 8,
            background: 'linear-gradient(90deg, transparent, rgba(244, 164, 96, 0.6), transparent)',
            borderRadius: 4
          }} />

          {player.stove.ingredient ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}>
              <div style={{
                position: 'relative',
                padding: 8,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(139, 69, 19, 0.5) 0%, rgba(60, 60, 60, 0.7) 100%)`,
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)',
                animation: player.stove.ingredient.state === 'burnt' ? 'shake 0.3s infinite' : 'none'
              }}>
                <IngredientIcon type={player.stove.ingredient.type} state={player.stove.ingredient.state} size={40} />
              </div>
              <CircularProgress progress={player.stove.ingredient.cookingProgress} size={60} />
            </div>
          ) : (
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139, 69, 19, 0.3) 0%, rgba(60, 60, 60, 0.5) 100%)',
              border: '3px solid rgba(80, 80, 80, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              opacity: 0.6
            }}>
              🍳
            </div>
          )}
        </div>

        <div
          ref={plateRef}
          style={{
            width: 100,
            background: 'linear-gradient(135deg, #FFFEF0 0%, #FFF8DC 100%)',
            borderRadius: 16,
            border: `3px solid ${plateShake ? '#FFD700' : 'rgba(255, 215, 0, 0.5)'}`,
            boxShadow: plateShake
              ? '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 215, 0, 0.2)'
              : 'inset 0 0 10px rgba(139, 69, 19, 0.1)',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: plateShake ? 'plateShake 0.3s ease' : 'none',
            overflow: 'hidden'
          }}
        >
          <div style={{
            fontSize: 11,
            textAlign: 'center',
            color: '#8B4513',
            fontWeight: 700,
            borderBottom: '1px dashed rgba(139, 69, 19, 0.3)',
            paddingBottom: 4
          }}>
            🍽️ 出餐 {player.plate.length}/5
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            flex: 1,
            alignContent: 'center'
          }}>
            {player.plate.map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2
              }}>
                <IngredientIcon type={item.type} state={item.state} size={24} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const RecipePanel: React.FC = () => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.85)',
      borderRadius: 12,
      padding: 10,
      border: '2px solid rgba(244, 164, 96, 0.5)'
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: '#8B4513',
        marginBottom: 8,
        textAlign: 'center'
      }}>
        📖 菜谱
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {RECIPES.map(recipe => (
          <div key={recipe.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: 4,
            background: 'rgba(244, 164, 96, 0.15)',
            borderRadius: 8
          }}>
            <span style={{ fontSize: 20 }}>{recipe.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B4513' }}>{recipe.name}</div>
              <div style={{ fontSize: 9, color: '#A0522D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {recipe.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ControlPanel: React.FC<{
  gameStarted: boolean;
  onTakeOut: () => void;
  onSubmit: () => void;
  onClearPlate: () => void;
  onReady: () => void;
  onStart: () => void;
  isReady: boolean;
  opponentReady: boolean;
  inLobby: boolean;
}> = ({ gameStarted, onTakeOut, onSubmit, onClearPlate, onReady, onStart, isReady, opponentReady, inLobby }) => {
  const btnStyle = (primary = false): React.CSSProperties => ({
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 700,
    color: primary ? '#FFF' : '#8B4513',
    background: primary ? 'linear-gradient(135deg, #F4A460, #E59400)' : 'rgba(255, 255, 255, 0.9)',
    border: primary ? 'none' : '2px solid rgba(244, 164, 96, 0.5)',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
    boxShadow: primary ? '0 4px 12px rgba(244, 164, 96, 0.4)' : '0 2px 6px rgba(0,0,0,0.08)',
    active: {
      transform: 'scale(0.95)'
    }
  });

  return (
    <div style={{
      display: 'flex',
      gap: 8,
      justifyContent: 'center',
      flexWrap: 'wrap',
      padding: 10,
      background: 'rgba(255, 255, 255, 0.7)',
      borderRadius: 12,
      border: '2px solid rgba(244, 164, 96, 0.3)'
    }}>
      {inLobby ? (
        <>
          <button
            onClick={onReady}
            style={{
              ...btnStyle(true),
              background: isReady ? 'linear-gradient(135deg, #90EE90, #32CD32)' : btnStyle(true).background as string
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isReady ? '✅ 已准备' : '准备'}
          </button>
          {isReady && opponentReady && (
            <button
              onClick={onStart}
              style={btnStyle(true)}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              🚀 开始游戏
            </button>
          )}
          <span style={{
            alignSelf: 'center',
            fontSize: 12,
            color: '#A0522D',
            fontWeight: 600
          }}>
            对手: {opponentReady ? '✅ 已准备' : '⏳ 等待'}
          </span>
        </>
      ) : gameStarted ? (
        <>
          <button
            onClick={onTakeOut}
            style={btnStyle(true)}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🍴 出锅
          </button>
          <button
            onClick={onSubmit}
            style={btnStyle(true)}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ✨ 完成
          </button>
          <button
            onClick={onClearPlate}
            style={btnStyle(false)}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🗑️ 清空
          </button>
        </>
      ) : null}
    </div>
  );
};

export const LobbyScreen: React.FC<{
  onConnect: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
  roomId: string | null;
  connected: boolean;
}> = ({ onConnect, onCreateRoom, onJoinRoom, roomId, connected }) => {
  const [joinRoomId, setJoinRoomId] = useState('');

  const btnStyle: React.CSSProperties = {
    padding: '14px 28px',
    fontSize: 15,
    fontWeight: 700,
    color: '#FFF',
    background: 'linear-gradient(135deg, #F4A460, #E59400)',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(244, 164, 96, 0.5)',
    transition: 'transform 0.1s ease'
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🍳</div>
        <h1 style={{
          fontSize: 36,
          color: '#8B4513',
          marginBottom: 8,
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          烹饪对战
        </h1>
        <p style={{ color: '#A0522D', fontSize: 14 }}>
          实时对战，谁才是真正的厨神？
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%',
        maxWidth: 340
      }}>
        {!connected ? (
          <button
            onClick={onConnect}
            style={btnStyle}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🔌 连接服务器
          </button>
        ) : (
          <>
            <button
              onClick={onCreateRoom}
              style={btnStyle}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              🎮 创建房间
            </button>

            {roomId && (
              <div style={{
                padding: 12,
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: 12,
                border: '2px solid #F4A460',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 12, color: '#8B4513', marginBottom: 4 }}>房间号</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#F4A460', letterSpacing: 4 }}>
                  {roomId}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center'
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(139, 69, 19, 0.2)' }} />
              <span style={{ fontSize: 12, color: '#A0522D' }}>或</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(139, 69, 19, 0.2)' }} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="输入房间号"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: 14,
                  fontSize: 15,
                  borderRadius: 14,
                  border: '2px solid rgba(244, 164, 96, 0.5)',
                  outline: 'none',
                  color: '#8B4513',
                  letterSpacing: 2,
                  textAlign: 'center'
                }}
              />
              <button
                onClick={() => joinRoomId && onJoinRoom(joinRoomId)}
                style={{
                  ...btnStyle,
                  padding: '14px 20px'
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                加入
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const VictoryOverlay: React.FC<{
  winner: string | null;
  playerId: string;
  onRestart: () => void;
}> = ({ winner, playerId, onRestart }) => {
  const isWin = winner === playerId;
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    const colors = ['#F4A460', '#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4'];
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 60,
      y: 50 + (Math.random() - 0.5) * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5
    }));
    setParticles(newParticles);
  }, [winner]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100
    }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: p.color,
            animation: `burst 1.5s ease-out ${p.delay}s forwards`
          }}
        />
      ))}

      <div style={{
        background: 'linear-gradient(135deg, #FFF8DC 0%, #FFFEF0 100%)',
        padding: 40,
        borderRadius: 24,
        border: '4px solid #F4A460',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>
          {isWin ? '🏆' : '😢'}
        </div>
        <h2 style={{
          fontSize: 32,
          color: isWin ? '#FFD700' : '#8B4513',
          marginBottom: 8,
          textShadow: isWin ? '2px 2px 4px rgba(255, 215, 0, 0.5)' : 'none'
        }}>
          {isWin ? '胜利！' : '失败...'}
        </h2>
        <p style={{ color: '#A0522D', marginBottom: 24 }}>
          {isWin ? '你是真正的厨神！' : '下次再接再厉！'}
        </p>
        <button
          onClick={onRestart}
          style={{
            padding: '14px 36px',
            fontSize: 16,
            fontWeight: 700,
            color: '#FFF',
            background: 'linear-gradient(135deg, #F4A460, #E59400)',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(244, 164, 96, 0.5)'
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🔄 再来一局
        </button>
      </div>
    </div>
  );
};

export const DragGhost: React.FC<{
  drag: DragState | null;
}> = ({ drag }) => {
  if (!drag) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: drag.x,
        top: drag.y,
        transform: 'translate(-50%, -50%) scale(0.8)',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: 0.85
      }}
    >
      <IngredientIcon type={drag.ingredient.type} state={drag.ingredient.state} size={56} />
    </div>
  );
};

export const GameApp: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => gameEngine.getState());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [connected, setConnected] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = gameEngine.subscribe((state) => {
      setGameState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!connected) return;

    playerSync.on('room:created', (data) => {
      setRoomId(data.roomId);
      setInRoom(true);
    });
    playerSync.on('room:joined', (data) => {
      setRoomId(data.roomId);
      setInRoom(true);
    });
    playerSync.on('player:joined', () => {
    });
    playerSync.on('game:start', () => {
    });
    playerSync.on('connected', () => {
      setConnected(true);
    });
    playerSync.on('disconnected', () => {
      setConnected(false);
      setInRoom(false);
    });

    return () => {
      playerSync.off('connected', () => setConnected(true));
      playerSync.off('disconnected', () => setConnected(false));
    };
  }, [connected]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (drag) {
        setDrag(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (drag && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const kitchens = containerRef.current.querySelectorAll('[data-kitchen="player"]');
        if (kitchens.length > 0) {
          const playerKitchen = kitchens[0] as HTMLElement;
          const kRect = playerKitchen.getBoundingClientRect();
          if (e.clientX >= kRect.left && e.clientX <= kRect.right &&
              e.clientY >= kRect.top && e.clientY <= kRect.bottom) {
            gameEngine.dropIngredientToStove(drag.ingredient.id);
            setDrag(null);
            return;
          }
        }
        const slot = gameEngine.getState().player.slots.find(s =>
          s.ingredient === null
        );
        if (slot) {
          gameEngine.refillSlot(slot.slotId);
        }
        setDrag(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag]);

  const handleDragStart = useCallback((ingredient: Ingredient, x: number, y: number) => {
    setDrag({
      ingredient,
      x,
      y,
      startX: x,
      startY: y
    });
  }, []);

  const handleConnect = async () => {
    try {
      await playerSync.connect();
      setConnected(true);
    } catch (err) {
      console.error('连接失败:', err);
    }
  };

  const handleCreateRoom = () => {
    playerSync.createRoom();
  };

  const handleJoinRoom = (id: string) => {
    playerSync.joinRoom(id);
  };

  const handleTakeOut = () => {
    gameEngine.takeFromStoveToPlate();
    const emptySlot = gameEngine.getState().player.slots.find(s => !s.ingredient);
    if (emptySlot) {
      setTimeout(() => gameEngine.refillSlot(emptySlot.slotId), 100);
    }
  };

  const handleSubmit = () => {
    gameEngine.submitPlate();
    gameEngine.getState().player.slots.forEach(slot => {
      if (!slot.ingredient) {
        gameEngine.refillSlot(slot.slotId);
      }
    });
  };

  const handleClearPlate = () => {
    gameEngine.clearPlate();
  };

  const handleReady = () => {
    playerSync.playerReady(!gameState.player.isReady);
  };

  const handleStart = () => {
    playerSync.startGame();
  };

  const handleRestart = () => {
    gameEngine.reset();
    setInRoom(false);
    setRoomId(null);
  };

  if (!connected || !inRoom) {
    return (
      <LobbyScreen
        onConnect={handleConnect}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        roomId={roomId}
        connected={connected}
      />
    );
  }

  const inLobby = !gameState.gameStarted;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        gap: 10
      }}
    >
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes smoke {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          50% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-30px) scale(1.5); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        @keyframes plateShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }
        @keyframes burst {
          0% { transform: scale(0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @media (min-width: 1024px) {
          .kitchens-container { flex-direction: row !important; }
        }
        @media (max-width: 768px) {
          .opponent-kitchen { transform: scale(0.85); }
        }
      `}</style>

      <div style={{
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 700,
        color: '#8B4513',
        padding: 4
      }}>
        🍳 烹饪对战 {roomId && <span style={{ fontSize: 12, color: '#F4A460', marginLeft: 8 }}>房间: {roomId}</span>}
      </div>

      <ControlPanel
        gameStarted={gameState.gameStarted}
        onTakeOut={handleTakeOut}
        onSubmit={handleSubmit}
        onClearPlate={handleClearPlate}
        onReady={handleReady}
        onStart={handleStart}
        isReady={gameState.player.isReady}
        opponentReady={gameState.opponent.isReady}
        inLobby={inLobby}
      />

      <div
        className="kitchens-container"
        style={{
          display: 'flex',
          flex: 1,
          gap: 10,
          minHeight: 0,
          flexDirection: window.innerWidth >= 1024 ? 'row' : 'column'
        }}
      >
        <div
          data-kitchen="player"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <Kitchen
            player={gameState.player}
            onDragStart={handleDragStart}
          />
        </div>

        <div style={{ display: window.innerWidth < 768 ? 'none' : 'block', width: 160 }}>
          <RecipePanel />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Kitchen
            player={gameState.opponent}
            isOpponent
          />
        </div>
      </div>

      <DragGhost drag={drag} />

      {gameState.gameEnded && gameState.winner && (
        <VictoryOverlay
          winner={gameState.winner}
          playerId={gameState.player.playerId}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default GameApp;

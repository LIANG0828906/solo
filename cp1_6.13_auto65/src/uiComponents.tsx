import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gameEngine, GameState, PlayerState, Ingredient, STATE_COLORS } from './gameEngine';
import { INGREDIENT_CONFIGS, IngredientState, getStateLabel, PlateIngredient, RECIPES } from './recipeData';
import { playerSync } from './playerSync';

const STATE_BG: Record<IngredientState, string> = {
  raw: 'rgba(255, 68, 68, 0.2)',
  half_cooked: 'rgba(255, 165, 0, 0.2)',
  cooked: 'rgba(139, 69, 19, 0.25)',
  burnt: 'rgba(44, 44, 44, 0.35)'
};

const STATE_BORDER: Record<IngredientState, string> = {
  raw: '#FF4444',
  half_cooked: '#FFA500',
  cooked: '#8B4513',
  burnt: '#2C2C2C'
};

const PRIMARY = '#F4A460';
const PRIMARY_DARK = '#8B4513';

interface DragState {
  ingredient: Ingredient;
  x: number;
  y: number;
  startX: number;
  startY: number;
  sourceSlotId: string | null;
}

export const IngredientIcon: React.FC<{
  type: string;
  state: IngredientState;
  size?: number;
  showLabel?: boolean;
}> = ({ type, state, size = 48, showLabel = false }) => {
  const config = INGREDIENT_CONFIGS[type as keyof typeof INGREDIENT_CONFIGS];
  if (!config) return null;

  const filterMap: Record<IngredientState, string> = {
    raw: 'none',
    half_cooked: 'brightness(0.9) saturate(0.8)',
    cooked: 'brightness(0.75) saturate(1.3)',
    burnt: 'brightness(0.35) saturate(0.2)'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      transition: 'filter 0.5s ease'
    }}>
      <div style={{
        fontSize: size,
        lineHeight: 1,
        transition: 'filter 0.5s ease',
        filter: filterMap[state],
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
      }}>
        {config.icon}
      </div>
      {showLabel && (
        <div style={{
          fontSize: 10,
          color: STATE_BORDER[state],
          marginTop: 2,
          fontWeight: 700,
          backgroundColor: STATE_BG[state],
          padding: '1px 6px',
          borderRadius: 8,
          transition: 'all 0.5s ease',
          border: `1px solid ${STATE_BORDER[state]}40`
        }}>
          {getStateLabel(state)}
        </div>
      )}
      {state === 'burnt' && (
        <div style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 16,
          animation: 'smoke 1.2s ease-in-out infinite',
          pointerEvents: 'none'
        }}>
          💨
        </div>
      )}
    </div>
  );
};

export const CircularProgress: React.FC<{
  progress: number;
  state: IngredientState;
  size?: number;
}> = ({ progress, state, size = 72 }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isBurnt = state === 'burnt';
  const isCooked = state === 'cooked';

  const strokeColor = isBurnt ? '#2C2C2C' : isCooked ? '#FFD700' : PRIMARY;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(139, 69, 19, 0.15)"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.1s linear, stroke 0.5s ease',
            filter: isCooked ? 'drop-shadow(0 0 6px #FFD700)' : isBurnt ? 'drop-shadow(0 0 4px #2C2C2C)' : 'none'
          }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize: 13,
          fontWeight: 700,
          color: isBurnt ? '#2C2C2C' : isCooked ? '#FFD700' : PRIMARY_DARK,
          transition: 'color 0.5s ease'
        }}>
          {Math.round(progress)}%
        </span>
        <span style={{
          fontSize: 8,
          color: STATE_BORDER[state],
          fontWeight: 600,
          transition: 'color 0.5s ease'
        }}>
          {getStateLabel(state)}
        </span>
      </div>
    </div>
  );
};

export const ProgressBar: React.FC<{
  progress: number;
  color?: string;
  label?: string;
}> = ({ progress, color = '#FFD700', label }) => {
  const isFull = progress >= 100;
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ fontSize: 11, color: PRIMARY_DARK, marginBottom: 3, fontWeight: 700 }}>
          {label}
        </div>
      )}
      <div style={{
        width: '100%',
        height: 14,
        backgroundColor: 'rgba(139, 69, 19, 0.15)',
        borderRadius: 7,
        overflow: 'hidden',
        border: '2px solid rgba(139, 69, 19, 0.25)',
        position: 'relative'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${PRIMARY}, ${color})`,
          borderRadius: 5,
          transition: 'width 0.3s ease',
          boxShadow: isFull ? `0 0 12px ${color}, 0 0 4px ${color}` : 'none',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '60%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
            animation: 'shine 2s infinite'
          }} />
        </div>
      </div>
    </div>
  );
};

export const Kitchen: React.FC<{
  player: PlayerState;
  isOpponent?: boolean;
  onDragStart?: (ingredient: Ingredient, x: number, y: number, slotId: string) => void;
}> = ({ player, isOpponent = false, onDragStart }) => {
  const [plateShake, setPlateShake] = useState(false);
  const prevPlateLen = useRef(player.plate.length);

  useEffect(() => {
    if (player.plate.length > prevPlateLen.current) {
      setPlateShake(true);
      setTimeout(() => setPlateShake(false), 300);
    }
    prevPlateLen.current = player.plate.length;
  }, [player.plate.length]);

  const handleSlotMouseDown = (e: React.MouseEvent, ingredient: Ingredient, slotId: string) => {
    if (isOpponent) return;
    e.preventDefault();
    onDragStart?.(ingredient, e.clientX, e.clientY, slotId);
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: 10,
      background: isOpponent
        ? `linear-gradient(135deg, rgba(244, 164, 96, 0.08) 0%, rgba(139, 69, 19, 0.08) 100%)`
        : `linear-gradient(135deg, rgba(244, 164, 96, 0.2) 0%, rgba(139, 69, 19, 0.12) 100%)`,
      borderRadius: 14,
      border: `3px solid ${isOpponent ? 'rgba(139, 69, 19, 0.2)' : PRIMARY}`,
      minHeight: 0,
      position: 'relative',
      boxShadow: isOpponent ? 'none' : `0 0 16px rgba(244, 164, 96, 0.25)`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: PRIMARY_DARK,
          padding: '3px 10px',
          background: isOpponent ? 'rgba(139, 69, 19, 0.1)' : `rgba(244, 164, 96, 0.3)`,
          borderRadius: 10,
          border: `1px solid ${isOpponent ? 'rgba(139,69,19,0.15)' : 'rgba(244,164,96,0.4)'}`
        }}>
          {isOpponent ? '👤 对手' : '🧑‍🍳 我'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: PRIMARY }}>
          ⭐ {player.score}
        </div>
      </div>

      <ProgressBar progress={player.progress} label="进度" />

      <div style={{
        display: 'flex',
        gap: 6,
        marginTop: 8,
        marginBottom: 8,
        justifyContent: 'center'
      }}>
        {player.slots.map(slot => (
          <div
            key={slot.slotId}
            onMouseDown={(e) => slot.ingredient && handleSlotMouseDown(e, slot.ingredient, slot.slotId)}
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: slot.ingredient
                ? `linear-gradient(135deg, ${STATE_BG[slot.ingredient.state]}, rgba(255,248,220,0.3))`
                : 'rgba(139, 69, 19, 0.06)',
              border: `2px dashed ${slot.ingredient ? STATE_BORDER[slot.ingredient.state] + '80' : 'rgba(139, 69, 19, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: slot.ingredient && !isOpponent ? 'grab' : 'default',
              transition: 'all 0.3s ease',
              position: 'relative',
              boxShadow: slot.ingredient ? `0 3px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.3)` : 'none'
            }}
          >
            {slot.ingredient ? (
              <IngredientIcon type={slot.ingredient.type} state={slot.ingredient.state} size={32} showLabel />
            ) : (
              <span style={{ fontSize: 18, opacity: 0.2, color: PRIMARY_DARK }}>+</span>
            )}
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        flex: 1,
        gap: 10,
        minHeight: 0
      }}>
        <div
          data-stove={isOpponent ? 'opponent' : 'player'}
          style={{
            flex: 1,
            background: 'linear-gradient(180deg, rgba(90, 70, 60, 0.35) 0%, rgba(60, 45, 35, 0.5) 100%)',
            borderRadius: 14,
            border: '3px solid rgba(100, 75, 55, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: 110,
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '75%',
            height: 6,
            background: 'linear-gradient(90deg, transparent, rgba(244, 164, 96, 0.5), transparent)',
            borderRadius: 3
          }} />

          {player.stove.ingredient ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}>
              <div style={{
                position: 'relative',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 40% 35%, rgba(160, 100, 50, 0.5) 0%, rgba(70, 50, 40, 0.7) 60%, rgba(50, 35, 25, 0.85) 100%)',
                boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
                border: '2px solid rgba(120, 80, 50, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: player.stove.ingredient.state === 'burnt' ? 'shake 0.3s infinite' : 'none'
              }}>
                <IngredientIcon type={player.stove.ingredient.type} state={player.stove.ingredient.state} size={34} />
              </div>
              <CircularProgress progress={player.stove.ingredient.cookingProgress} state={player.stove.ingredient.state} size={52} />
            </div>
          ) : (
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 35%, rgba(139, 69, 19, 0.25) 0%, rgba(70, 50, 40, 0.4) 60%, rgba(50, 35, 25, 0.55) 100%)',
              border: '3px solid rgba(100, 75, 55, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              opacity: 0.5
            }}>
              🍳
            </div>
          )}
        </div>

        <div style={{
          width: 90,
          background: 'linear-gradient(135deg, #FFFEF5 0%, #FFF8DC 100%)',
          borderRadius: 14,
          border: `3px solid ${plateShake ? '#FFD700' : 'rgba(255, 215, 0, 0.4)'}`,
          boxShadow: plateShake
            ? '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 12px rgba(255, 215, 0, 0.15)'
            : 'inset 0 0 8px rgba(139, 69, 19, 0.08)',
          padding: 6,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          animation: plateShake ? 'plateShake 0.3s ease' : 'none',
          overflow: 'hidden',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease'
        }}>
          <div style={{
            fontSize: 10,
            textAlign: 'center',
            color: PRIMARY_DARK,
            fontWeight: 700,
            borderBottom: '1px dashed rgba(139, 69, 19, 0.2)',
            paddingBottom: 3,
            marginBottom: 2
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
                padding: 1
              }}>
                <IngredientIcon type={item.type} state={item.state} size={22} />
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
      background: 'linear-gradient(135deg, rgba(255,248,220,0.9) 0%, rgba(255,252,240,0.9) 100%)',
      borderRadius: 12,
      padding: 8,
      border: `2px solid rgba(244, 164, 96, 0.4)`,
      boxShadow: '0 2px 8px rgba(139, 69, 19, 0.1)'
    }}>
      <div style={{
        fontSize: 12,
        fontWeight: 700,
        color: PRIMARY_DARK,
        marginBottom: 6,
        textAlign: 'center',
        borderBottom: `1px solid rgba(244, 164, 96, 0.3)`,
        paddingBottom: 4
      }}>
        📖 菜谱
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {RECIPES.map(recipe => (
          <div key={recipe.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: 4,
            background: 'rgba(244, 164, 96, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(244, 164, 96, 0.15)'
          }}>
            <span style={{ fontSize: 18 }}>{recipe.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: PRIMARY_DARK }}>{recipe.name}</div>
              <div style={{ fontSize: 8, color: '#A0522D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
  const mkBtn = (primary: boolean, extra?: React.CSSProperties): React.CSSProperties => ({
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    color: primary ? '#FFF' : PRIMARY_DARK,
    background: primary ? `linear-gradient(135deg, ${PRIMARY}, #E59400)` : 'rgba(255, 248, 220, 0.9)',
    border: primary ? 'none' : `2px solid rgba(244, 164, 96, 0.4)`,
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
    boxShadow: primary ? '0 3px 10px rgba(244, 164, 96, 0.4)' : '0 1px 4px rgba(0,0,0,0.06)',
    ...extra
  });

  const withClick = (style: React.CSSProperties) => ({
    style,
    onMouseDown: (e: React.MouseEvent) => { e.currentTarget.style.transform = 'scale(0.95)'; },
    onMouseUp: (e: React.MouseEvent) => { e.currentTarget.style.transform = 'scale(1)'; },
    onMouseLeave: (e: React.MouseEvent) => { e.currentTarget.style.transform = 'scale(1)'; }
  });

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      flexWrap: 'wrap',
      padding: 8,
      background: 'linear-gradient(135deg, rgba(255,248,220,0.8) 0%, rgba(255,252,240,0.8) 100%)',
      borderRadius: 12,
      border: `2px solid rgba(244, 164, 96, 0.3)`
    }}>
      {inLobby ? (
        <>
          <button onClick={onReady} {...withClick(mkBtn(true, isReady ? { background: 'linear-gradient(135deg, #90EE90, #32CD32)' } : {}))}>
            {isReady ? '✅ 已准备' : '准备'}
          </button>
          {isReady && opponentReady && (
            <button onClick={onStart} {...withClick(mkBtn(true))}>
              🚀 开始游戏
            </button>
          )}
          <span style={{ alignSelf: 'center', fontSize: 11, color: '#A0522D', fontWeight: 600 }}>
            对手: {opponentReady ? '✅ 已准备' : '⏳ 等待'}
          </span>
        </>
      ) : gameStarted ? (
        <>
          <button onClick={onTakeOut} {...withClick(mkBtn(true))}>🍴 出锅</button>
          <button onClick={onSubmit} {...withClick(mkBtn(true))}>✨ 完成</button>
          <button onClick={onClearPlate} {...withClick(mkBtn(false))}>🗑️ 清空</button>
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
    padding: '12px 24px',
    fontSize: 14,
    fontWeight: 700,
    color: '#FFF',
    background: `linear-gradient(135deg, ${PRIMARY}, #E59400)`,
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(244, 164, 96, 0.45)',
    transition: 'transform 0.1s ease'
  };

  const withClick = (style: React.CSSProperties) => ({
    style,
    onMouseDown: (e: React.MouseEvent) => { e.currentTarget.style.transform = 'scale(0.95)'; },
    onMouseUp: (e: React.MouseEvent) => { e.currentTarget.style.transform = 'scale(1)'; },
    onMouseLeave: (e: React.MouseEvent) => { e.currentTarget.style.transform = 'scale(1)'; }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: `radial-gradient(ellipse at center, rgba(255,248,220,0.6) 0%, rgba(244,164,96,0.1) 70%)`
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>🍳</div>
        <h1 style={{
          fontSize: 34,
          color: PRIMARY_DARK,
          marginBottom: 6,
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          烹饪对战
        </h1>
        <p style={{ color: '#A0522D', fontSize: 13 }}>
          实时对战，谁才是真正的厨神？
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        width: '100%',
        maxWidth: 320
      }}>
        {!connected ? (
          <button onClick={onConnect} {...withClick(btnStyle)}>
            🔌 连接服务器
          </button>
        ) : (
          <>
            <button onClick={onCreateRoom} {...withClick(btnStyle)}>
              🎮 创建房间
            </button>

            {roomId && (
              <div style={{
                padding: 10,
                background: 'linear-gradient(135deg, rgba(255,248,220,0.95), rgba(255,252,240,0.95))',
                borderRadius: 12,
                border: `2px solid ${PRIMARY}`,
                textAlign: 'center',
                boxShadow: `0 0 12px rgba(244, 164, 96, 0.2)`
              }}>
                <div style={{ fontSize: 11, color: PRIMARY_DARK, marginBottom: 3 }}>房间号</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: PRIMARY, letterSpacing: 4 }}>
                  {roomId}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(139, 69, 19, 0.15)' }} />
              <span style={{ fontSize: 11, color: '#A0522D' }}>或</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(139, 69, 19, 0.15)' }} />
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                placeholder="输入房间号"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                style={{
                  flex: 1,
                  padding: 12,
                  fontSize: 14,
                  borderRadius: 12,
                  border: `2px solid rgba(244, 164, 96, 0.4)`,
                  outline: 'none',
                  color: PRIMARY_DARK,
                  letterSpacing: 2,
                  textAlign: 'center',
                  background: 'rgba(255,248,220,0.5)'
                }}
              />
              <button
                onClick={() => joinRoomId && onJoinRoom(joinRoomId)}
                {...withClick({ ...btnStyle, padding: '12px 18px' })}
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
    const colors = [PRIMARY, '#FFD700', '#FF6B6B', '#4ECDC4', '#FF69B4'];
    setParticles(Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 50,
      y: 50 + (Math.random() - 0.5) * 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5
    })));
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
        <div key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: p.color,
          animation: `burst 1.5s ease-out ${p.delay}s forwards`
        }} />
      ))}
      <div style={{
        background: 'linear-gradient(135deg, #FFF8DC 0%, #FFFEF0 100%)',
        padding: 36,
        borderRadius: 20,
        border: `4px solid ${PRIMARY}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ fontSize: 72, marginBottom: 12 }}>{isWin ? '🏆' : '😢'}</div>
        <h2 style={{
          fontSize: 28,
          color: isWin ? '#FFD700' : PRIMARY_DARK,
          marginBottom: 6,
          textShadow: isWin ? '2px 2px 4px rgba(255, 215, 0, 0.5)' : 'none'
        }}>
          {isWin ? '胜利！' : '失败...'}
        </h2>
        <p style={{ color: '#A0522D', marginBottom: 20, fontSize: 13 }}>
          {isWin ? '你是真正的厨神！' : '下次再接再厉！'}
        </p>
        <button
          onClick={onRestart}
          style={{
            padding: '12px 32px',
            fontSize: 14,
            fontWeight: 700,
            color: '#FFF',
            background: `linear-gradient(135deg, ${PRIMARY}, #E59400)`,
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(244, 164, 96, 0.5)',
            transition: 'transform 0.1s ease'
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
    <div style={{
      position: 'fixed',
      left: drag.x,
      top: drag.y,
      transform: 'translate(-50%, -50%) scale(0.75)',
      pointerEvents: 'none',
      zIndex: 1000,
      opacity: 0.9,
      transition: 'transform 0.05s ease',
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
    }}>
      <IngredientIcon type={drag.ingredient.type} state={drag.ingredient.state} size={52} />
    </div>
  );
};

const FlyInAnimation: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: IngredientType;
  state: IngredientState;
  onDone: () => void;
}> = ({ from, to, type, state, onDone }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 300;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      if (p < 1) requestAnimationFrame(tick);
      else onDone();
    };
    requestAnimationFrame(tick);
  }, [onDone]);

  const x = from.x + (to.x - from.x) * progress;
  const y = from.y + (to.y - from.y) * progress;
  const scale = 1 - progress * 0.3;

  return (
    <div style={{
      position: 'fixed',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      pointerEvents: 'none',
      zIndex: 999,
      opacity: 1 - progress * 0.1
    }}>
      <IngredientIcon type={type} state={state} size={44} />
    </div>
  );
};

export const GameApp: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => gameEngine.getState());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [connected, setConnected] = useState(false);
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [flyIn, setFlyIn] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; type: IngredientType; state: IngredientState } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragSlotIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = gameEngine.subscribe((state) => {
      setGameState({ ...state });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!connected) return;

    const onRoomCreated = (data: { roomId: string }) => { setRoomId(data.roomId); setInRoom(true); };
    const onRoomJoined = (data: { roomId: string }) => { setRoomId(data.roomId); setInRoom(true); };
    const onConnected = () => setConnected(true);
    const onDisconnected = () => { setConnected(false); setInRoom(false); };

    playerSync.on('room:created', onRoomCreated);
    playerSync.on('room:joined', onRoomJoined);
    playerSync.on('connected', onConnected);
    playerSync.on('disconnected', onDisconnected);

    return () => {
      playerSync.off('room:created', onRoomCreated);
      playerSync.off('room:joined', onRoomJoined);
      playerSync.off('connected', onConnected);
      playerSync.off('disconnected', onDisconnected);
    };
  }, [connected]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (drag) {
        setDrag(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!drag) return;

      const stoveEl = document.querySelector('[data-stove="player"]');
      if (stoveEl) {
        const rect = stoveEl.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {

          setFlyIn({
            from: { x: drag.x, y: drag.y },
            to: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
            type: drag.ingredient.type,
            state: drag.ingredient.state
          });

          gameEngine.dropIngredientToStove(drag.ingredient.id);
          setDrag(null);
          dragSlotIdRef.current = null;
          return;
        }
      }

      setDrag(null);
      dragSlotIdRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag]);

  const handleDragStart = useCallback((ingredient: Ingredient, x: number, y: number, slotId: string) => {
    dragSlotIdRef.current = slotId;
    setDrag({ ingredient, x, y, startX: x, startY: y, sourceSlotId: slotId });
  }, []);

  const handleConnect = async () => {
    try {
      await playerSync.connect();
      setConnected(true);
    } catch (err) {
      console.error('连接失败:', err);
    }
  };

  const handleCreateRoom = () => playerSync.createRoom();
  const handleJoinRoom = (id: string) => playerSync.joinRoom(id);

  const handleTakeOut = () => {
    gameEngine.takeFromStoveToPlate();
    const emptySlot = gameEngine.getState().player.slots.find(s => !s.ingredient);
    if (emptySlot) setTimeout(() => gameEngine.refillSlot(emptySlot.slotId), 100);
  };

  const handleSubmit = () => {
    gameEngine.submitPlate();
    gameEngine.getState().player.slots.forEach(slot => {
      if (!slot.ingredient) gameEngine.refillSlot(slot.slotId);
    });
  };

  const handleClearPlate = () => gameEngine.clearPlate();
  const handleReady = () => playerSync.playerReady(!gameState.player.isReady);
  const handleStart = () => playerSync.startGame();

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
        padding: 10,
        gap: 8,
        background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 18px,
            rgba(139, 69, 19, 0.04) 18px,
            rgba(139, 69, 19, 0.04) 20px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 18px,
            rgba(139, 69, 19, 0.04) 18px,
            rgba(139, 69, 19, 0.04) 20px
          ),
          radial-gradient(ellipse at center, #FFF8DC 0%, #FFF5E6 50%, #FFEDCC 100%)
        `
      }}
    >
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes smoke {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.4); }
          30% { opacity: 0.7; }
          100% { opacity: 0; transform: translate(-50%, -20px) scale(1.2); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes plateShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-1.5deg); }
          75% { transform: rotate(1.5deg); }
        }
        @keyframes burst {
          0% { transform: scale(0); opacity: 1; }
          50% { opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); }
          50% { box-shadow: 0 0 16px rgba(255, 215, 0, 0.6); }
        }
        @media (min-width: 1024px) {
          .kitchens-row { flex-direction: row !important; }
        }
        @media (max-width: 768px) {
          .kitchens-row { flex-direction: column !important; }
          .recipe-col { display: none !important; }
        }
      `}</style>

      <div style={{
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 700,
        color: PRIMARY_DARK,
        padding: 2
      }}>
        🍳 烹饪对战
        {roomId && <span style={{ fontSize: 11, color: PRIMARY, marginLeft: 8 }}>房间: {roomId}</span>}
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
        className="kitchens-row"
        style={{
          display: 'flex',
          flex: 1,
          gap: 8,
          minHeight: 0,
          flexDirection: window.innerWidth >= 1024 ? 'row' : 'column'
        }}
      >
        <div data-kitchen="player" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Kitchen player={gameState.player} onDragStart={handleDragStart} />
        </div>

        <div className="recipe-col" style={{ width: 140, flexShrink: 0 }}>
          <RecipePanel />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Kitchen player={gameState.opponent} isOpponent />
        </div>
      </div>

      <DragGhost drag={drag} />

      {flyIn && (
        <FlyInAnimation
          from={flyIn.from}
          to={flyIn.to}
          type={flyIn.type}
          state={flyIn.state}
          onDone={() => setFlyIn(null)}
        />
      )}

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

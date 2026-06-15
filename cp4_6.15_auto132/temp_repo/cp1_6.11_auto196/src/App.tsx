import React, { useReducer, useEffect, useRef, useState, useCallback } from 'react';
import TeaBowl, { TeaBowlRef, TrajectoryPoint, Particle } from './TeaBowl';
import { fetchRecipes, saveRecipe, Recipe } from '../api/recipes';

interface AppState {
  force: number;
  angle: number;
  speed: number;
  isRecording: boolean;
  isPlaying: boolean;
  playbackSpeed: number;
  compareMode: boolean;
  selectedRecipeId: string | null;
  recipes: Recipe[];
  trajectory: TrajectoryPoint[];
  recordingStartTime: number;
}

type Action =
  | { type: 'SET_FORCE'; payload: number }
  | { type: 'SET_ANGLE'; payload: number }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'TOGGLE_RECORDING' }
  | { type: 'START_PLAYBACK' }
  | { type: 'STOP_PLAYBACK' }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'TOGGLE_COMPARE_MODE' }
  | { type: 'SELECT_RECIPE'; payload: string | null }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'ADD_TRAJECTORY_POINT'; payload: TrajectoryPoint }
  | { type: 'CLEAR_TRAJECTORY' }
  | { type: 'SET_RECORDING_START_TIME'; payload: number };

const initialState: AppState = {
  force: 50,
  angle: 15,
  speed: 5,
  isRecording: false,
  isPlaying: false,
  playbackSpeed: 1,
  compareMode: false,
  selectedRecipeId: null,
  recipes: [],
  trajectory: [],
  recordingStartTime: 0,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FORCE':
      return { ...state, force: action.payload };
    case 'SET_ANGLE':
      return { ...state, angle: action.payload };
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'TOGGLE_RECORDING':
      if (state.isRecording) {
        return { ...state, isRecording: false };
      }
      return {
        ...state,
        isRecording: true,
        trajectory: [],
        recordingStartTime: Date.now(),
      };
    case 'START_PLAYBACK':
      return { ...state, isPlaying: true };
    case 'STOP_PLAYBACK':
      return { ...state, isPlaying: false };
    case 'SET_PLAYBACK_SPEED':
      return { ...state, playbackSpeed: action.payload };
    case 'TOGGLE_COMPARE_MODE':
      return { ...state, compareMode: !state.compareMode, isPlaying: false };
    case 'SELECT_RECIPE':
      return { ...state, selectedRecipeId: action.payload, isPlaying: false };
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
    case 'ADD_RECIPE':
      return { ...state, recipes: [...state.recipes, action.payload] };
    case 'ADD_TRAJECTORY_POINT': {
      const lastTimestamp = state.trajectory.length > 0
        ? state.trajectory[state.trajectory.length - 1].timestamp
        : 0;
      const newPoint = {
        ...action.payload,
        timestamp: lastTimestamp + action.payload.timestamp,
      };
      return {
        ...state,
        trajectory: [...state.trajectory, newPoint],
      };
    }
    case 'CLEAR_TRAJECTORY':
      return { ...state, trajectory: [] };
    case 'SET_RECORDING_START_TIME':
      return { ...state, recordingStartTime: action.payload };
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [compareParticles, setCompareParticles] = useState<Particle[]>([]);
  const leftBowlRef = useRef<TeaBowlRef>(null);
  const rightBowlRef = useRef<TeaBowlRef>(null);

  useEffect(() => {
    fetchRecipes().then((recipes) => {
      dispatch({ type: 'SET_RECIPES', payload: recipes });
    });
  }, []);

  const selectedRecipe = state.recipes.find((r) => r.id === state.selectedRecipeId) || null;

  const handleTrajectoryPoint = useCallback(
    (point: TrajectoryPoint) => {
      if (state.isRecording) {
        dispatch({ type: 'ADD_TRAJECTORY_POINT', payload: point });
      }
    },
    [state.isRecording]
  );

  const handleToggleRecording = () => {
    if (state.isRecording) {
      dispatch({ type: 'TOGGLE_RECORDING' });
      if (state.trajectory.length > 0) {
        setShowSaveDialog(true);
        setRecipeName('');
      }
    } else {
      dispatch({ type: 'TOGGLE_RECORDING' });
    }
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) return;

    const newRecipe = await saveRecipe({
      name: recipeName.trim(),
      params: {
        force: state.force,
        angle: state.angle,
        speed: state.speed,
      },
      trajectory: state.trajectory,
    });

    if (newRecipe) {
      dispatch({ type: 'ADD_RECIPE', payload: newRecipe });
      dispatch({ type: 'CLEAR_TRAJECTORY' });
      setShowSaveDialog(false);
      setRecipeName('');
    }
  };

  const handlePlayback = () => {
    if (!selectedRecipe) return;
    if (state.isPlaying) {
      dispatch({ type: 'STOP_PLAYBACK' });
    } else {
      dispatch({ type: 'START_PLAYBACK' });
    }
  };

  const handleSelectRecipe = (id: string) => {
    dispatch({ type: 'SELECT_RECIPE', payload: id === state.selectedRecipeId ? null : id });
  };

  useEffect(() => {
    if (!state.compareMode) {
      setCompareParticles([]);
      return;
    }

    const interval = setInterval(() => {
      if (rightBowlRef.current) {
        const particles = rightBowlRef.current.getParticles();
        setCompareParticles(particles);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [state.compareMode]);

  const playbackData = selectedRecipe ? selectedRecipe.trajectory : null;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at center, #2D3A2A 0%, #1A1A1A 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Noto Serif SC', serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.01) 2px,
              rgba(255,255,255,0.01) 4px
            )
          `,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          height: 60,
          background: 'rgba(26, 26, 26, 0.9)',
          borderBottom: '2px solid #4A5A3A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        <h1
          style={{
            fontFamily: "'Ma Shan Zheng', 'Noto Serif SC', serif",
            fontSize: 28,
            color: '#C8A87C',
            letterSpacing: 4,
            margin: 0,
            fontWeight: 'normal',
          }}
        >
          茶筅·击拂录
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(74, 90, 58, 0.3)',
              borderRadius: 6,
              padding: '4px 8px',
            }}
          >
            <span style={{ color: '#C8A87C', fontSize: 13 }}>回放速度</span>
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => dispatch({ type: 'SET_PLAYBACK_SPEED', payload: s })}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: state.playbackSpeed === s ? '#4A5A3A' : 'transparent',
                  color: state.playbackSpeed === s ? '#D4B88C' : '#C8A87C',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Noto Serif SC', serif",
                }}
                onMouseEnter={(e) => {
                  if (state.playbackSpeed !== s) {
                    e.currentTarget.style.color = '#D4B88C';
                  }
                }}
                onMouseLeave={(e) => {
                  if (state.playbackSpeed !== s) {
                    e.currentTarget.style.color = '#C8A87C';
                  }
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_COMPARE_MODE' })}
            style={{
              padding: '8px 16px',
              border: state.compareMode ? '1px solid #D4B88C' : '1px solid #4A5A3A',
              borderRadius: 4,
              background: state.compareMode ? 'rgba(74, 90, 58, 0.5)' : 'transparent',
              color: '#C8A87C',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: "'Noto Serif SC', serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#D4B88C';
              e.currentTarget.style.borderColor = '#D4B88C';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#C8A87C';
              e.currentTarget.style.borderColor = state.compareMode ? '#D4B88C' : '#4A5A3A';
            }}
          >
            {state.compareMode ? '退出比对' : '纹理比对'}
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px 312px 24px 24px',
          }}
        >
          <div
            style={{
              width: state.compareMode ? 900 : 800,
              height: 600,
              background: '#F5F0E1',
              borderRadius: 12,
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: state.compareMode ? 24 : 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 20px,
                    rgba(74, 59, 50, 0.06) 20px,
                    rgba(74, 59, 50, 0.06) 21px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 20px,
                    rgba(74, 59, 50, 0.06) 20px,
                    rgba(74, 59, 50, 0.06) 21px
                  )
                `,
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              {state.compareMode && (
                <span style={{ color: '#4A3B32', fontSize: 13, opacity: 0.7 }}>当前手法</span>
              )}
              <TeaBowl
                ref={leftBowlRef}
                force={state.force}
                angle={state.angle}
                speed={state.speed}
                isRecording={state.isRecording}
                isPlaying={!state.compareMode && state.isPlaying && !!selectedRecipe}
                playbackData={!state.compareMode ? playbackData : null}
                playbackSpeed={state.playbackSpeed}
                onTrajectoryPoint={handleTrajectoryPoint}
                compareMode={state.compareMode}
                compareParticles={compareParticles}
                size={state.compareMode ? 380 : 480}
              />
            </div>

            {state.compareMode && selectedRecipe && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#4A3B32', fontSize: 13, opacity: 0.7 }}>
                  {selectedRecipe.name}
                </span>
                <TeaBowl
                  ref={rightBowlRef}
                  force={selectedRecipe.params.force}
                  angle={selectedRecipe.params.angle}
                  speed={selectedRecipe.params.speed}
                  isPlaying={state.isPlaying}
                  playbackData={playbackData}
                  playbackSpeed={state.playbackSpeed}
                  size={380}
                />
              </div>
            )}

            {state.compareMode && !selectedRecipe && (
              <div
                style={{
                  width: 380,
                  height: 380,
                  border: '2px dashed #4A3B32',
                  borderRadius: '50%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#4A3B32',
                  opacity: 0.5,
                  fontSize: 14,
                }}
              >
                请选择配方进行比对
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            position: 'fixed',
            right: 0,
            top: 60,
            bottom: 40,
            width: 280,
            background: 'rgba(42, 42, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderLeft: '1px solid rgba(200, 168, 124, 0.2)',
            padding: 24,
            overflowY: 'auto',
            zIndex: 5,
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ color: '#C8A87C', fontSize: 16, marginBottom: 16, fontWeight: 500 }}>
              击拂参数
            </h3>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ color: '#D4B88C', fontSize: 14 }}>力度</label>
                <span
                  style={{
                    color: '#C8A87C',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {state.force}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={state.force}
                onChange={(e) => dispatch({ type: 'SET_FORCE', payload: Number(e.target.value) })}
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: '#3A3A3A',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ color: '#D4B88C', fontSize: 14 }}>角度</label>
                <span
                  style={{
                    color: '#C8A87C',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {state.angle}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                value={state.angle}
                onChange={(e) => dispatch({ type: 'SET_ANGLE', payload: Number(e.target.value) })}
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: '#3A3A3A',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  marginBottom: 12,
                }}
              />

              <div
                style={{
                  width: '100%',
                  height: 60,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <svg width="80" height="50" viewBox="0 0 80 50">
                  <path
                    d="M 40 45 L 40 5"
                    stroke="#3A3A3A"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <path
                    d={`M 40 45 L ${40 + Math.sin((state.angle * Math.PI) / 180) * 35} ${45 - Math.cos((state.angle * Math.PI) / 180) * 35}`}
                    stroke="#C8A87C"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="40" cy="45" r="3" fill="#C8A87C" />
                  <path
                    d={`M 40 30 A 15 15 0 0 1 ${40 + Math.sin((state.angle * Math.PI) / 180) * 15} ${45 - Math.cos((state.angle * Math.PI) / 180) * 15}`}
                    stroke="#C8A87C"
                    strokeWidth="1"
                    fill="none"
                    opacity="0.5"
                  />
                </svg>
                {[0, 15, 30, 45].map((a) => (
                  <span
                    key={a}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: `${10 + (a / 45) * 80}%`,
                      transform: 'translateX(-50%)',
                      fontSize: 10,
                      color: a === state.angle ? '#D4B88C' : '#5A5A5A',
                      transition: 'color 0.3s ease',
                    }}
                  >
                    {a}°
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <label style={{ color: '#D4B88C', fontSize: 14 }}>速度</label>
                <span
                  style={{
                    color: '#C8A87C',
                    fontSize: 13,
                    fontFamily: 'monospace',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {state.speed}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={state.speed}
                onChange={(e) => dispatch({ type: 'SET_SPEED', payload: Number(e.target.value) })}
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: '#3A3A3A',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>
          </div>

          <div
            style={{
              height: 1,
              background: 'rgba(200, 168, 124, 0.2)',
              marginBottom: 20,
            }}
          />

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: '#C8A87C', fontSize: 16, marginBottom: 16, fontWeight: 500 }}>
              记录手法
            </h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <button
                onClick={handleToggleRecording}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: state.isRecording ? '#CC3333' : '#CC3333',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'transform 0.2s ease',
                  padding: 0,
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {state.isRecording && (
                  <>
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        right: -4,
                        bottom: -4,
                        borderRadius: '50%',
                        background: 'rgba(204, 51, 51, 0.4)',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        right: -10,
                        bottom: -10,
                        borderRadius: '50%',
                        background: 'rgba(204, 51, 51, 0.2)',
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: '0.3s',
                      }}
                    />
                  </>
                )}
                <span
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'block',
                    width: state.isRecording ? 16 : 20,
                    height: state.isRecording ? 16 : 20,
                    margin: '0 auto',
                    background: '#fff',
                    borderRadius: state.isRecording ? 2 : '50%',
                    transition: 'all 0.3s ease',
                  }}
                />
              </button>
            </div>
            <p
              style={{
                color: '#8A8A8A',
                fontSize: 12,
                textAlign: 'center',
                margin: 0,
              }}
            >
              {state.isRecording
                ? `正在记录... (${state.trajectory.length} 点)`
                : '点击开始记录击拂手法'}
            </p>
          </div>

          <div
            style={{
              height: 1,
              background: 'rgba(200, 168, 124, 0.2)',
              marginBottom: 20,
            }}
          />

          <div>
            <h3 style={{ color: '#C8A87C', fontSize: 16, marginBottom: 12, fontWeight: 500 }}>
              手法配方 ({state.recipes.length}/10)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {state.recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => handleSelectRecipe(recipe.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    background:
                      state.selectedRecipeId === recipe.id
                        ? 'rgba(74, 90, 58, 0.4)'
                        : 'rgba(255, 255, 255, 0.03)',
                    border:
                      state.selectedRecipeId === recipe.id
                        ? '1px solid #4A5A3A'
                        : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 90, 58, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      state.selectedRecipeId === recipe.id
                        ? 'rgba(74, 90, 58, 0.4)'
                        : 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: '#D4B88C', fontSize: 14 }}>{recipe.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#8A8A8A' }}>
                    <span>力度 {recipe.params.force}</span>
                    <span>角度 {recipe.params.angle}°</span>
                    <span>速度 {recipe.params.speed}</span>
                  </div>
                </div>
              ))}

              {state.recipes.length === 0 && (
                <div
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    color: '#5A5A5A',
                    fontSize: 13,
                  }}
                >
                  暂无配方
                </div>
              )}
            </div>

            {selectedRecipe && !state.compareMode && (
              <button
                onClick={handlePlayback}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '10px 0',
                  borderRadius: 6,
                  border: '1px solid #4A5A3A',
                  background: 'transparent',
                  color: '#C8A87C',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Noto Serif SC', serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#D4B88C';
                  e.currentTarget.style.borderColor = '#D4B88C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#C8A87C';
                  e.currentTarget.style.borderColor = '#4A5A3A';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {state.isPlaying ? '停止回放' : '回放手法'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
          }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            style={{
              background: '#2A2A2A',
              borderRadius: 12,
              padding: 28,
              width: 360,
              border: '1px solid rgba(200, 168, 124, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ color: '#C8A87C', fontSize: 18, marginBottom: 20, fontWeight: 500 }}>
              保存手法配方
            </h3>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="请输入手法名称，如：春风拂面"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#1A1A1A',
                border: '1px solid #3A3A3A',
                borderRadius: 6,
                color: '#D4B88C',
                fontSize: 14,
                marginBottom: 20,
                outline: 'none',
                fontFamily: "'Noto Serif SC', serif",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4A5A3A';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#3A3A3A';
              }}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: '8px 20px',
                  background: 'transparent',
                  border: '1px solid #3A3A3A',
                  borderRadius: 6,
                  color: '#8A8A8A',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Noto Serif SC', serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#C8A87C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#8A8A8A';
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveRecipe}
                disabled={!recipeName.trim()}
                style={{
                  padding: '8px 20px',
                  background: recipeName.trim() ? '#4A5A3A' : '#2A2A2A',
                  border: 'none',
                  borderRadius: 6,
                  color: recipeName.trim() ? '#D4B88C' : '#5A5A5A',
                  fontSize: 14,
                  cursor: recipeName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  fontFamily: "'Noto Serif SC', serif",
                }}
                onMouseEnter={(e) => {
                  if (recipeName.trim()) {
                    e.currentTarget.style.background = '#5A6A4A';
                  }
                }}
                onMouseLeave={(e) => {
                  if (recipeName.trim()) {
                    e.currentTarget.style.background = '#4A5A3A';
                  }
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.4;
          }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #C8A87C;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          background: #D4B88C;
          transform: scale(1.1);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #C8A87C;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          background: #D4B88C;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(200, 168, 124, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 168, 124, 0.5);
        }
      `}</style>
    </div>
  );
};

export default App;

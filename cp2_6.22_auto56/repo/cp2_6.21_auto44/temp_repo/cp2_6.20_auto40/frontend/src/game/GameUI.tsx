import { useState, useEffect } from 'react';
import type { Story, SceneNode, SceneEdge, GameVariable } from '../types';

interface GameUIProps {
  story: Story;
  currentNode: SceneNode;
  availableEdges: SceneEdge[];
  variableValues: Record<string, number | boolean>;
  onChoice: (edgeId: string) => void;
  onReset: () => void;
  visitedCount: number;
  totalNodes: number;
}

export default function GameUI({
  story,
  currentNode,
  availableEdges,
  variableValues,
  onChoice,
  onReset,
  visitedCount,
  totalNodes,
}: GameUIProps) {
  const [varPanelOpen, setVarPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const progress = totalNodes > 0 ? (visitedCount / totalNodes) * 100 : 0;

  const getVariableColor = (variable: GameVariable): string => {
    return variable.color || '#e94560';
  };

  const lightenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substring(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substring(2, 4), 16) + amount);
    const b = Math.min(255, parseInt(hex.substring(4, 6), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.7; }
        }
        @keyframes scalePop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .scene-fade-in {
          animation: fadeIn 0.5s ease forwards;
        }
        .pulse-dot {
          animation: pulseDot 1.5s ease-in-out infinite;
        }
        .scale-pop {
          animation: scalePop 0.4s ease;
        }
        .var-bar-fill {
          transition: width 0.5s ease;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div
          style={{
            marginBottom: '32px',
            padding: '20px 28px',
            backgroundColor: 'rgba(22, 33, 62, 0.75)',
            backdropFilter: 'blur(10px)',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#eaeaea',
                  margin: 0,
                }}
              >
                {story.title}
              </h1>
              <p style={{ color: '#a0a0b0', fontSize: '14px', margin: '4px 0 0 0' }}>作者：{story.author}</p>
            </div>
            <button
              onClick={onReset}
              style={{
                padding: '8px 20px',
                backgroundColor: 'rgba(233, 69, 96, 0.1)',
                border: '1px solid #e94560',
                color: '#e94560',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e94560';
                e.currentTarget.style.color = '#eaeaea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(233, 69, 96, 0.1)';
                e.currentTarget.style.color = '#e94560';
              }}
            >
              重新开始
            </button>
          </div>

          <div
            style={{
              position: 'relative',
              height: '8px',
              backgroundColor: 'rgba(15, 52, 96, 0.6)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0f3460, #e94560)',
                transition: 'width 0.5s ease',
                borderRadius: '4px',
              }}
            />
            <div
              className="pulse-dot"
              style={{
                position: 'absolute',
                left: `${progress}%`,
                top: '50%',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#e94560',
                boxShadow: '0 0 10px #e94560',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#a0a0b0' }}>
            <span>进度 {visitedCount}/{totalNodes}</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>

        <div
          className="scene-container"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div key={currentNode.id} className="scene-fade-in">
            <div
              style={{
                backgroundImage: `url(${currentNode.backgroundImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '100%',
                minHeight: '500px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.3) 0%, rgba(26, 26, 46, 0.95) 100%)',
                }}
              />

              <h2
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '10%',
                  right: '10%',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#eaeaea',
                  margin: 0,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
                }}
              >
                {currentNode.title}
              </h2>

              <div
                style={{
                  position: 'absolute',
                  bottom: '22%',
                  left: '10%',
                  right: '10%',
                  padding: '24px',
                  borderRadius: '8px',
                  backdropFilter: 'blur(10px)',
                  backgroundColor: 'rgba(22, 33, 62, 0.7)',
                  color: '#eaeaea',
                  fontSize: '18px',
                  lineHeight: 1.8,
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {currentNode.description}
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: '6%',
                  left: '10%',
                  right: '10%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {availableEdges.length > 0 ? (
                  availableEdges.map((edge) => (
                    <button
                      key={edge.id}
                      onClick={() => onChoice(edge.id)}
                      style={{
                        padding: '14px 20px',
                        backgroundColor: 'rgba(15, 52, 96, 0.8)',
                        border: '1px solid #e94560',
                        color: '#eaeaea',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        textAlign: 'left',
                        backdropFilter: 'blur(5px)',
                        fontSize: '16px',
                        lineHeight: 1.5,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e94560';
                        e.currentTarget.style.transform = 'translateX(8px)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(233, 69, 96, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(15, 52, 96, 0.8)';
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      ▶ {edge.label}
                    </button>
                  ))
                ) : (
                  <div
                    style={{
                      padding: '20px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(15, 52, 96, 0.6)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(5px)',
                    }}
                  >
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏁</div>
                    <p style={{ color: '#eaeaea', fontSize: '18px', margin: 0 }}>故事到此结束</p>
                    <button
                      onClick={onReset}
                      style={{
                        marginTop: '12px',
                        padding: '10px 24px',
                        backgroundColor: '#e94560',
                        border: 'none',
                        color: '#eaeaea',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c73e54')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e94560')}
                    >
                      再玩一次
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile ? (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            transform: varPanelOpen ? 'translateY(0)' : 'translateY(calc(100% - 48px))',
            transition: 'transform 0.3s ease',
          }}
        >
          <div
            onClick={() => setVarPanelOpen(!varPanelOpen)}
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(22, 33, 62, 0.95)',
              backdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(233, 69, 96, 0.3)',
              color: '#e94560',
              fontWeight: 'bold',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>{varPanelOpen ? '▼' : '▲'}</span>
            <span>变量状态</span>
          </div>
          <div
            style={{
              maxHeight: '50vh',
              overflowY: 'auto',
              padding: '16px',
              backgroundColor: 'rgba(22, 33, 62, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {renderVariablesContent(story.variables, variableValues, getVariableColor, lightenColor)}
          </div>
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            width: '280px',
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(22, 33, 62, 0.85)',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            zIndex: 50,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <h3
              style={{
                color: '#e94560',
                fontWeight: 'bold',
                margin: 0,
                fontSize: '16px',
              }}
            >
              变量状态
            </h3>
            <button
              onClick={() => setVarPanelOpen(!varPanelOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0a0b0',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e94560')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#a0a0b0')}
            >
              {varPanelOpen ? '−' : '+'}
            </button>
          </div>
          {varPanelOpen && (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {renderVariablesContent(story.variables, variableValues, getVariableColor, lightenColor)}
            </div>
          )}
        </div>
      )}
    </>
  );
}

function renderVariablesContent(
  variables: GameVariable[],
  variableValues: Record<string, number | boolean>,
  getColor: (v: GameVariable) => string,
  lighten: (c: string, a: number) => string
) {
  if (variables.length === 0) {
    return (
      <div style={{ color: '#a0a0b0', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>
        暂无变量
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {variables.map((variable) => {
        const value = variableValues[variable.id];
        const color = getColor(variable);

        if (variable.type === 'number') {
          const min = variable.minValue ?? 0;
          const max = variable.maxValue ?? 100;
          const numValue = typeof value === 'number' ? value : 0;
          const range = max - min || 1;
          const percentage = Math.max(0, Math.min(100, ((numValue - min) / range) * 100));
          const lighterColor = lighten(color, 60);

          return (
            <div key={variable.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#eaeaea', fontSize: '14px' }}>{variable.name}</span>
                <span
                  key={`${variable.id}-${numValue}`}
                  className="scale-pop"
                  style={{
                    color: color,
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: 'inline-block',
                  }}
                >
                  {numValue}
                  {variable.maxValue !== undefined && (
                    <span style={{ color: '#a0a0b0', fontWeight: 'normal', fontSize: '12px' }}>
                      /{variable.maxValue}
                    </span>
                  )}
                </span>
              </div>
              <div
                style={{
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: '#0f3460',
                  overflow: 'hidden',
                  margin: '4px 0',
                }}
              >
                <div
                  className="var-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}, ${lighterColor})`,
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          );
        } else {
          const boolValue = typeof value === 'boolean' ? value : false;
          return (
            <div
              key={variable.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
              }}
            >
              <span style={{ color: '#eaeaea', fontSize: '14px' }}>{variable.name}</span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: boolValue ? '#4ade80' : '#64748b',
                  transition: 'all 0.3s ease',
                }}
              >
                <span
                  key={`${variable.id}-${boolValue}`}
                  className="scale-pop"
                  style={{
                    fontSize: '20px',
                    display: 'inline-block',
                  }}
                >
                  {boolValue ? '✅' : '⭕'}
                </span>
                <span style={{ fontSize: '12px' }}>{boolValue ? '开' : '关'}</span>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}

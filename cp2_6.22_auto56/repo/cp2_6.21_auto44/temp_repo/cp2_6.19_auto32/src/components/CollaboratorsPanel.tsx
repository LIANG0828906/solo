import React from 'react';
import { useSequencerStore } from '../store/useSequencerStore';
import { CollaboratorCursor } from '../modules/collaboration/CollaboratorCursor';

export const CollaboratorsPanel: React.FC = () => {
  const { collaborators } = useSequencerStore();

  return (
    <>
      <div
        style={{
          width: 240,
          backgroundColor: '#16213e',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(180deg, #0f3460, #16213e)',
          }}
        >
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ccd6f6',
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}>
            在线协作者
          </h3>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 12,
            scrollbarWidth: 'thin',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(0,180,216,0.1)',
                borderRadius: 8,
                border: '1px solid rgba(0,180,216,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00b4d8, #0f3460)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    boxShadow: '0 0 12px rgba(0,180,216,0.5)',
                  }}
                >
                  👤
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 12,
                    height: 12,
                    backgroundColor: '#4ade80',
                    borderRadius: '50%',
                    border: '2px solid #16213e',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e6f1ff' }}>你</div>
                <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 600 }}>● 正在编辑</div>
              </div>
              <div
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#00b4d8',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 10,
                }}
              >
                HOST
              </div>
            </div>

            {collaborators.map((collaborator) => {
              const now = Date.now();
              const isActive = now - collaborator.lastBlinkTime < 1000;

              return (
                <div
                  key={collaborator.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: isActive ? `${collaborator.color}15` : 'rgba(255,255,255,0.02)',
                    borderRadius: 8,
                    border: `1px solid ${isActive ? `${collaborator.color}40` : 'rgba(255,255,255,0.05)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.2s ease',
                    transform: isActive ? 'scale(1.01)' : 'scale(1)',
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        backgroundColor: collaborator.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        boxShadow: isActive ? `0 0 12px ${collaborator.color}80` : 'none',
                        transition: 'box-shadow 0.2s ease',
                      }}
                    >
                      {collaborator.avatar}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        backgroundColor: collaborator.isActive ? '#4ade80' : '#f59e0b',
                        borderRadius: '50%',
                        border: '2px solid #16213e',
                      }}
                    />
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: -4,
                          borderRadius: '50%',
                          border: `2px solid ${collaborator.color}`,
                          animation: 'pulse-ring 1s ease-out infinite',
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e6f1ff' }}>
                      {collaborator.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: isActive ? collaborator.color : '#8892b0',
                        fontWeight: 600,
                      }}
                    >
                      {isActive
                        ? collaborator.activeElement === 'note-edit'
                          ? '● 正在编辑音符'
                          : collaborator.activeElement === 'fader'
                            ? '● 正在调节推子'
                            : '● 正在查看'
                        : '● 在线'}
                    </div>
                  </div>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      backgroundColor: collaborator.color,
                      boxShadow: `0 0 6px ${collaborator.color}60`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}>
            <span style={{ fontSize: 11, color: '#8892b0', fontWeight: 600 }}>连接状态</span>
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700 }}>● 已连接</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: '#8892b0', fontWeight: 600 }}>延迟</span>
            <span style={{ fontSize: 11, color: '#00b4d8', fontWeight: 700, fontFamily: 'monospace' }}>~12ms</span>
          </div>
        </div>
      </div>

      {collaborators.map((collaborator) => (
        <CollaboratorCursor key={collaborator.id} collaborator={collaborator} />
      ))}
    </>
  );
};

import React, { useState } from 'react';
import { useMindMapStore } from '../mindmap/store';

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}:${ss}`;
};

export const HistoryPanel: React.FC = () => {
  const { history, restore, undoIndex } = useMindMapStore();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleRestore = (historyId: string) => {
    restore(historyId);
    setConfirmId(null);
  };

  const reversedHistory = [...history].reverse();

  return (
    <div
      style={{
        width: 200,
        backgroundColor: 'rgba(15, 52, 96, 0.95)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ padding: 16 }}>
        <h2
          style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold',
            margin: '0 0 4px 0',
          }}
        >
          📜 版本历史
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 12,
            margin: 0,
          }}
        >
          点击条目可回滚
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 8px 16px 8px',
        }}
      >
        {reversedHistory.length === 0 ? (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 13,
            }}
          >
            暂无历史记录
          </div>
        ) : (
          reversedHistory.map((entry, idx) => {
            const actualIndex = history.length - 1 - idx;
            const isCurrent = actualIndex === undoIndex;
            return (
              <div key={entry.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: 2,
                      height: '100%',
                      minHeight: 50,
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      marginLeft: 7,
                      marginTop: 20,
                      position: 'absolute',
                      left: 0,
                    }}
                  />
                  <div
                    onClick={() => !isCurrent && setConfirmId(entry.id)}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      borderRadius: 6,
                      marginBottom: 4,
                      cursor: isCurrent ? 'default' : 'pointer',
                      backgroundColor: isCurrent
                        ? 'rgba(233, 69, 96, 0.15)'
                        : idx % 2 === 0
                        ? '#16213e'
                        : '#1a1a2e',
                      border: isCurrent ? '1px solid rgba(233, 69, 96, 0.4)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      zIndex: 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        (e.currentTarget as HTMLDivElement).style.backgroundColor =
                          idx % 2 === 0 ? '#16213e' : '#1a1a2e';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: isCurrent ? '#e94560' : 'rgba(255,255,255,0.3)',
                          flexShrink: 0,
                          marginLeft: -16,
                          boxShadow: isCurrent ? '0 0 8px rgba(233, 69, 96, 0.6)' : 'none',
                        }}
                      />
                      <div
                        style={{
                          color: 'white',
                          fontSize: 12,
                          fontWeight: isCurrent ? 'bold' : 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {entry.description}
                      </div>
                    </div>
                    <div
                      style={{
                        color: isCurrent ? 'rgba(233, 69, 96, 0.8)' : 'rgba(255,255,255,0.4)',
                        fontSize: 11,
                        marginTop: 4,
                        marginLeft: 0,
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatTime(entry.timestamp)}
                      {isCurrent && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            padding: '1px 4px',
                            borderRadius: 3,
                            backgroundColor: 'rgba(233, 69, 96, 0.3)',
                            color: '#e94560',
                          }}
                        >
                          当前
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontSize: 10,
                        marginTop: 2,
                        marginLeft: 0,
                      }}
                    >
                      {Object.keys(entry.nodes).length} 个节点
                    </div>
                  </div>
                </div>

                {confirmId === entry.id && (
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10000,
                    }}
                    onClick={() => setConfirmId(null)}
                  >
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        backgroundColor: '#16213e',
                        borderRadius: 8,
                        padding: 20,
                        width: 320,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      <h3
                        style={{
                          color: 'white',
                          margin: '0 0 8px 0',
                          fontSize: 16,
                        }}
                      >
                        确认回滚
                      </h3>
                      <p
                        style={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: 13,
                          margin: '0 0 16px 0',
                          lineHeight: 1.5,
                        }}
                      >
                        是否回滚到此版本？
                        <br />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                          {entry.description} · {formatTime(entry.timestamp)}
                        </span>
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 8,
                        }}
                      >
                        <button
                          onClick={() => setConfirmId(null)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 4,
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'transparent',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleRestore(entry.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 4,
                            border: 'none',
                            background: '#e94560',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 'bold',
                          }}
                        >
                          确认回滚
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.5)',
          fontSize: 12,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>共 {history.length} 个版本</span>
        <span style={{ color: '#e94560' }}>v{undoIndex + 1}</span>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

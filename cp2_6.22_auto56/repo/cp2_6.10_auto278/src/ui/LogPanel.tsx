import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';
import { CYBER_COLORS } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

export default function LogPanel({ logs }: LogPanelProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'create':
        return '✨';
      case 'connect':
        return '🔗';
      case 'collapse':
        return '💥';
      case 'reset':
        return '🔄';
      default:
        return '📋';
    }
  };

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'create':
        return CYBER_COLORS.neonPurple;
      case 'connect':
        return CYBER_COLORS.neonCyan;
      case 'collapse':
        return '#ff0080';
      case 'reset':
        return '#ffaa00';
      default:
        return '#ffffff';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        width: '340px',
        padding: '24px',
        background: CYBER_COLORS.panelBg,
        border: `1px solid ${CYBER_COLORS.borderColor}`,
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: `0 0 30px ${CYBER_COLORS.neonCyan}20, 0 0 60px ${CYBER_COLORS.neonPurple}10`,
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: CYBER_COLORS.neonPurple,
          marginBottom: '16px',
          textShadow: `0 0 10px ${CYBER_COLORS.neonPurple}80`,
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '24px' }}>📊</span>
        状态日志
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '11px',
            color: '#666',
            fontWeight: 'normal',
          }}
        >
          最近 {logs.length} 条
        </span>
      </div>

      <div
        ref={logContainerRef}
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          paddingRight: '8px',
        }}
      >
        <style>
          {`
            div::-webkit-scrollbar {
              width: 4px;
            }
            div::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.2);
              border-radius: 2px;
            }
            div::-webkit-scrollbar-thumb {
              background: ${CYBER_COLORS.neonCyan}60;
              border-radius: 2px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: ${CYBER_COLORS.neonCyan};
            }
          `}
        </style>

        {logs.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#444',
              fontSize: '13px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌌</div>
            <div>量子场尚未激活</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              开始创建你的第一个量子节点吧
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map((log, index) => {
              const typeColor = getTypeColor(log.type);
              return (
                <div
                  key={log.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${typeColor}`,
                    animation: 'slideIn 0.3s ease',
                    opacity: 1 - (logs.length - 1 - index) * 0.1,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}
                  >
                    <span style={{ fontSize: '14px' }}>{getTypeIcon(log.type)}</span>
                    <span
                      style={{
                        fontSize: '10px',
                        color: typeColor,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {log.type === 'create' ? '创建' : log.type === 'connect' ? '连接' : log.type === 'collapse' ? '坍缩' : '重置'}
                    </span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '10px',
                        color: '#555',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatTime(log.timestamp)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: '12px',
                      color: '#ddd',
                      marginBottom: '8px',
                      lineHeight: '1.4',
                    }}
                  >
                    {log.message}
                  </div>

                  {(log.nodeId !== undefined || log.connectionCount !== undefined || log.energy !== undefined) && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {log.nodeId && (
                        <div
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '4px',
                            color: '#888',
                          }}
                        >
                          <span style={{ color: '#555' }}>ID: </span>
                          <span style={{ color: CYBER_COLORS.neonCyan, fontFamily: 'monospace' }}>
                            {log.nodeId}
                          </span>
                        </div>
                      )}
                      {log.connectionCount !== undefined && (
                        <div
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '4px',
                            color: '#888',
                          }}
                        >
                          <span style={{ color: '#555' }}>连接: </span>
                          <span style={{ color: CYBER_COLORS.neonPurple, fontWeight: 'bold' }}>
                            {log.connectionCount}
                          </span>
                        </div>
                      )}
                      {log.energy !== undefined && (
                        <div
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '4px',
                            color: '#888',
                          }}
                        >
                          <span style={{ color: '#555' }}>能量: </span>
                          <span
                            style={{
                              color: log.energy > 60 ? '#00ff88' : log.energy > 30 ? '#ffaa00' : '#ff0080',
                              fontWeight: 'bold',
                            }}
                          >
                            {log.energy}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
    </div>
  );
}

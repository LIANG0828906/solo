import React, { useEffect, useState, useRef } from 'react';
import { useBoardStore } from './BoardStore';
import { HistoryModule } from './HistoryModule';
import { CollabModule } from './CollabModule';
import Whiteboard from './Whiteboard';
import { HistoryEntry, Shape, ToolType } from './types';

const TOOL_CONFIG: { type: ToolType; icon: string; label: string }[] = [
  { type: 'select', icon: '↖', label: '选取' },
  { type: 'rectangle', icon: '▭', label: '矩形' },
  { type: 'circle', icon: '○', label: '圆形' },
  { type: 'diamond', icon: '◇', label: '菱形' },
  { type: 'line', icon: '╱', label: '线条' },
  { type: 'text', icon: 'T', label: '文本' },
  { type: 'eraser', icon: '✕', label: '橡皮擦' },
];

const actionIcon = (action: HistoryEntry['action']) => {
  switch (action) {
    case 'add': return '＋';
    case 'move': return '↔';
    case 'modify': return '✎';
    case 'delete': return '✕';
  }
};

const shapeTypeName = (type: Shape['type']) => {
  switch (type) {
    case 'rectangle': return '矩形';
    case 'circle': return '圆形';
    case 'diamond': return '菱形';
    case 'line': return '线条';
    case 'text': return '文本';
  }
};

const App: React.FC = () => {
  const {
    currentTool, setTool,
    shapes, selectedId,
    currentUser, onlineUsers,
    zoom, pan,
  } = useBoardStore();

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    CollabModule.connect();
    HistoryModule.setUsers(onlineUsers);

    useBoardStore.getState().setBroadcastFn((type, shapeOrId) => {
      if (type === 'add') {
        CollabModule.broadcastAdd(shapeOrId as Shape);
      } else if (type === 'update') {
        CollabModule.broadcastUpdate(shapeOrId as Shape);
      } else if (type === 'delete') {
        CollabModule.broadcastDelete((shapeOrId as { id: string }).id);
      }
    });

    const unsub = HistoryModule.subscribe(() => {
      setHistoryEntries(HistoryModule.getEntries());
    });
    setHistoryEntries(HistoryModule.getEntries());

    return () => {
      unsub();
      CollabModule.disconnect();
    };
  }, []);

  const triggerRevertAnimation = (cb: () => void) => {
    const ids = new Set(shapes.map(s => s.id));
    setAnimatingIds(ids);
    cb();
    setTimeout(() => setAnimatingIds(new Set()), 400);
  };

  const handleHistoryClick = (entry: HistoryEntry) => {
    triggerRevertAnimation(() => {
      HistoryModule.revertTo(entry.id);
    });
  };

  const exportPNG = async () => {
    const dpi = 300;
    const scale = dpi / 96;
    const padding = 50;

    if (shapes.length === 0) {
      alert('白板是空的，无法导出！');
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(s => {
      const corners = [
        { x: s.x, y: s.y },
        { x: s.x + s.width, y: s.y },
        { x: s.x + s.width, y: s.y + s.height },
        { x: s.x, y: s.y + s.height },
      ];
      const cx = s.x + s.width / 2;
      const cy = s.y + s.height / 2;
      const angle = (s.rotation * Math.PI) / 180;
      corners.forEach(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const rx = dx * Math.cos(angle) - dy * Math.sin(angle) + cx;
        const ry = dx * Math.sin(angle) + dy * Math.cos(angle) + cy;
        minX = Math.min(minX, rx);
        minY = Math.min(minY, ry);
        maxX = Math.max(maxX, rx);
        maxY = Math.max(maxY, ry);
      });
    });

    const width = Math.ceil(maxX - minX + padding * 2);
    const height = Math.ceil(maxY - minY + padding * 2);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = width * scale;
    offCanvas.height = height * scale;
    const ctx = offCanvas.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.translate(padding - minX, padding - minY);

    shapes.forEach(s => {
      ctx.save();
      const cx = s.x + s.width / 2;
      const cy = s.y + s.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = s.opacity;
      ctx.fillStyle = s.fill;
      ctx.strokeStyle = s.stroke;
      ctx.lineWidth = s.strokeWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      switch (s.type) {
        case 'rectangle':
          ctx.beginPath();
          ctx.rect(s.x, s.y, s.width, s.height);
          if (s.fill !== 'transparent') ctx.fill();
          if (s.strokeWidth > 0) ctx.stroke();
          break;
        case 'circle':
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.abs(s.width) / 2, Math.abs(s.height) / 2, 0, 0, Math.PI * 2);
          if (s.fill !== 'transparent') ctx.fill();
          if (s.strokeWidth > 0) ctx.stroke();
          break;
        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(cx, s.y);
          ctx.lineTo(s.x + s.width, cy);
          ctx.lineTo(cx, s.y + s.height);
          ctx.lineTo(s.x, cy);
          ctx.closePath();
          if (s.fill !== 'transparent') ctx.fill();
          if (s.strokeWidth > 0) ctx.stroke();
          break;
        case 'line':
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + s.width, s.y + s.height);
          ctx.stroke();
          break;
        case 'text':
          if (s.text) {
            ctx.font = `${Math.max(14, s.height * 0.8)}px "Microsoft YaHei", sans-serif`;
            ctx.textBaseline = 'top';
            ctx.fillStyle = s.stroke;
            ctx.fillText(s.text, s.x, s.y);
          }
          break;
      }
      ctx.restore();
    });

    offCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whiteboard-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#F5F5F5',
      fontFamily: '"Microsoft YaHei", "PingFang SC", sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        height: 56,
        background: '#FFFFFF',
        boxShadow: '0 1px 3px #00000010',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        flexShrink: 0,
        zIndex: 20,
        gap: 4,
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#333',
          marginRight: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: 20 }}>🎨</span>
          <span>创意白板</span>
        </div>

        {TOOL_CONFIG.map((t) => (
          <button
            key={t.type}
            onClick={() => setTool(t.type)}
            title={t.label}
            style={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: currentTool === t.type ? '#E8E8E8' : 'transparent',
              cursor: 'pointer',
              borderRadius: 6,
              position: 'relative',
              fontSize: 20,
              color: currentTool === t.type ? '#4A90D9' : '#555',
              transition: 'background-color 0.2s ease, color 0.2s ease',
              padding: 0,
            }}
          >
            <span style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {t.icon}
            </span>
            {currentTool === t.type && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 8,
                right: 8,
                height: 2,
                background: '#4A90D9',
                borderRadius: 1,
              }} />
            )}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginRight: 16,
          fontSize: 12,
          color: '#666',
          background: '#F5F5F5',
          padding: '6px 12px',
          borderRadius: 6,
        }}>
          <span>缩放</span>
          <span style={{ color: '#4A90D9', fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginRight: 16 }}>
          {onlineUsers.slice(0, 5).map((u, i) => (
            <div
              key={u.id}
              title={`${u.name}${u.id === currentUser.id ? ' (我)' : ''}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: u.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                marginLeft: i === 0 ? 0 : -8,
                border: '2px solid #fff',
                zIndex: onlineUsers.length - i,
              }}
            >
              {u.avatar}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            padding: '8px 14px',
            border: '1px solid #ddd',
            background: '#fff',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            color: '#555',
            marginRight: 10,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4A90D9'; e.currentTarget.style.color = '#4A90D9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#555'; }}
        >
          🕓 历史
        </button>

        <button
          onClick={exportPNG}
          style={{
            padding: '8px 18px',
            background: '#4A90D9',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            boxShadow: '0 2px 4px #4A90D930',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#3A7BC0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#4A90D9'; }}
        >
          ⬇ 导出 PNG
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', position: 'relative', minHeight: 0 }}>
        <Whiteboard />

        {showHistory && (
          <div style={{
            position: 'absolute',
            right: 16,
            top: 16,
            width: 200,
            maxHeight: 'calc(100% - 32px)',
            background: '#FFFFFF',
            borderRadius: 8,
            boxShadow: '0 4px 12px #00000015',
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 14px',
              fontWeight: 600,
              fontSize: 13,
              color: '#333',
              borderBottom: '1px solid #F0F0F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span>操作历史</span>
              <span style={{ fontSize: 11, color: '#999', fontWeight: 400 }}>
                {historyEntries.length}/50
              </span>
            </div>

            <div style={{
              overflowY: 'auto',
              padding: 8,
              flex: 1,
            }}>
              {historyEntries.length === 0 ? (
                <div style={{
                  padding: 30,
                  textAlign: 'center',
                  color: '#bbb',
                  fontSize: 12,
                }}>
                  暂无操作记录
                  <div style={{ marginTop: 6, fontSize: 11 }}>
                    开始绘制，记录将显示在这里
                  </div>
                </div>
              ) : (
                historyEntries.map((entry, idx) => {
                  const shapeType = (() => {
                    const s = entry.snapshot.find(x => x.id === entry.shapeId);
                    if (!s) {
                      const prev = historyEntries.slice(idx + 1).find(h => {
                        const found = h.snapshot.find(x => x.id === entry.shapeId);
                        return !!found;
                      });
                      if (prev) {
                        const ps = prev.snapshot.find(x => x.id === entry.shapeId);
                        if (ps) return shapeTypeName(ps.type);
                      }
                      return '图形';
                    }
                    return shapeTypeName(s.type);
                  })();
                  const lastInGroup = idx === 0 || historyEntries[idx - 1].userId !== entry.userId;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => handleHistoryClick(entry)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '8px 6px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        marginBottom: 2,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#F5F8FF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      {lastInGroup && (
                        <div style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: onlineUsers.find(u => u.id === entry.userId)?.color || '#999',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          flexShrink: 0,
                          marginTop: 2,
                        }}>
                          {entry.userAvatar}
                        </div>
                      )}
                      {!lastInGroup && <div style={{ width: 26, flexShrink: 0 }} />}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {lastInGroup && (
                          <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                            {entry.userName}
                          </div>
                        )}
                        <div style={{
                          fontSize: 12,
                          color: '#333',
                          lineHeight: 1.4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            background: entry.action === 'delete' ? '#FFEBEE' :
                              entry.action === 'add' ? '#E8F5E9' :
                              entry.action === 'move' ? '#E3F2FD' : '#FFF8E1',
                            color: entry.action === 'delete' ? '#D32F2F' :
                              entry.action === 'add' ? '#388E3C' :
                              entry.action === 'move' ? '#1976D2' : '#F57C00',
                            fontSize: 9,
                            flexShrink: 0,
                          }}>
                            {actionIcon(entry.action)}
                          </span>
                          <span style={{ opacity: 0.8 }}>
                            {HistoryModule.getActionLabel(entry.action)}{shapeType}
                          </span>
                        </div>
                        <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                          {HistoryModule.formatTime(entry.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; }
        input[type="range"] {
          -webkit-appearance: none;
          height: 4px;
          background: #E0E0E0;
          border-radius: 2px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #4A90D9;
          cursor: pointer;
          transition: transform 0.15s ease;
          box-shadow: 0 1px 3px #00000030;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #4A90D9;
          cursor: pointer;
          border: none;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D0D0D0; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #B0B0B0; }
      `}</style>
    </div>
  );
};

export default App;

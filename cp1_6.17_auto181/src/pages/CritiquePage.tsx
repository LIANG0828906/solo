import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CritiqueManager } from '../CritiqueManager';
import { CalligraphyEngine } from '../CalligraphyEngine';
import { useAppStore } from '../store';
import type { Critique, CritiqueReply } from '../CritiqueManager';

const COLOR_LABELS = [
  { name: '红', value: 'red' as const, color: '#C23B22' },
  { name: '黄', value: 'yellow' as const, color: '#D4A373' },
  { name: '蓝', value: 'blue' as const, color: '#4A7C59' },
  { name: '绿', value: 'green' as const, color: '#4A7C59' }
];

function CritiquePage() {
  const { workId } = useParams<{ workId: string }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const critiqueManagerRef = useRef<CritiqueManager | null>(null);
  const [work, setWork] = useState<any>(null);
  const [critiques, setCritiques] = useState<Critique[]>([]);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [selectedCritique, setSelectedCritique] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedColor, setSelectedColor] = useState<'red' | 'yellow' | 'blue' | 'green'>('red');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyInput, setShowReplyInput] = useState<Record<string, boolean>>({});
  const { user } = useAppStore();
  const [pendingCritique, setPendingCritique] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!workId) return;

    const loadWork = async () => {
      try {
        const [workRes, critiquesRes] = await Promise.all([
          axios.get(`/api/works/${workId}`),
          axios.get(`/api/critiques/${workId}`)
        ]);
        
        setWork(workRes.data);
        setCritiques(critiquesRes.data);
        setLoading(false);

        critiqueManagerRef.current = new CritiqueManager(workId);
        critiqueManagerRef.current.setOnCritiquesChange(setCritiques);
      } catch (error) {
        console.error('加载失败:', error);
        setLoading(false);
      }
    };

    loadWork();
  }, [workId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !work) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = work.width;
    canvas.height = work.height;

    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    CalligraphyEngine.renderToCanvas(canvas, work.strokes);
  }, [work]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * delta));
    setScale(newScale);
  }, [scale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isCtrlPressed) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;
      
      setPendingCritique({ x, y });
      setSelectedCritique(null);
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [isCtrlPressed, offset, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  }, [offset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleAddCritique = async () => {
    if (!pendingCritique || !newComment.trim() || !critiqueManagerRef.current) return;

    const result = await critiqueManagerRef.current.addCritique({
      x: pendingCritique.x,
      y: pendingCritique.y,
      text: newComment,
      color: selectedColor,
      userId: user.id,
      userName: user.name
    });

    if (result) {
      setNewComment('');
      setPendingCritique(null);
      setSelectedCritique(result.id);
    }
  };

  const handleReply = async (critiqueId: string, parentId: string, level: number) => {
    const replyText = replyInputs[critiqueId];
    if (!replyText?.trim() || !critiqueManagerRef.current) return;

    await critiqueManagerRef.current!.addReply({
      critiqueId,
      text: replyText || '',
      userId: user.id,
      userName: user.name,
      parentId,
      level: Math.min(level + 1, 3)
    });

    setReplyInputs(prev => ({ ...prev, [critiqueId]: '' }));
    setShowReplyInput(prev => ({ ...prev, [critiqueId]: false }));
  };

  const getStats = () => {
    const stats = {
      total: critiques.length,
      byColor: { red: 0, yellow: 0, blue: 0, green: 0 }
    };

    for (const critique of critiques) {
      if (stats.byColor.hasOwnProperty(critique.color)) {
        stats.byColor[critique.color]++;
      }
    }

    return stats;
  };

  const renderRingChart = () => {
    const stats = getStats();
    const total = stats.total || 1;
    const colors = ['#C23B22', '#D4A373', '#4A7C59', '#4A7C59'];
    const keys: ('red' | 'yellow' | 'blue' | 'green')[] = ['red', 'yellow', 'blue', 'green'];
    
    let currentAngle = 0;
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 6;

    return (
      <div className="ring-chart">
        <svg viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="#E0D5C0"
            strokeWidth={strokeWidth}
          />
          {keys.map((key, index) => {
            const count = stats.byColor[key];
            if (count === 0) return null;
            
            const percentage = count / total;
            const dashLength = percentage * circumference;
            const dashOffset = -currentAngle * circumference / (2 * Math.PI);
            
            currentAngle += percentage * 2 * Math.PI;

            return (
              <circle
                key={key}
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke={colors[index]}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const getMarkerColor = (color: string) => {
    const colorMap: Record<string, string> = {
      red: '#C23B22',
      yellow: '#D4A373',
      blue: '#4A7C59',
      green: '#4A7C59'
    };
    return colorMap[color] || '#C23B22';
  };

  const renderReplies = (replies: CritiqueReply[], critiqueId: string) => {
    return replies.map(reply => (
      <div 
        key={reply.id} 
        className={`reply-item level-${reply.level}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <span style={{ fontSize: '11px', fontWeight: '500', color: '#3E2723' }}>{reply.userName}</span>
          <span style={{ fontSize: '10px', color: '#999' }}>
            {new Date(reply.createdAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: '#333', lineHeight: 1.4, marginBottom: '4px' }}>{reply.text}</p>
        {reply.level < 3 && (
          <span 
            className="reply-link"
            onClick={() => {
              setShowReplyInput(prev => ({ ...prev, [reply.id]: !prev[reply.id] }));
            }}
          >
            回复
          </span>
        )}
        {showReplyInput[reply.id] && (
          <div className="reply-input-container" style={{ marginTop: '6px' }}>
            <input
              type="text"
              className="reply-input"
              placeholder="写下回复..."
              value={replyInputs[reply.id] || ''}
              onChange={(e) => setReplyInputs(prev => ({ ...prev, [reply.id]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleReply(critiqueId, reply.id, reply.level);
                }
              }}
            />
            <button 
              className="reply-btn"
              onClick={() => handleReply(critiqueId, reply.id, reply.level)}
            >
              发送
            </button>
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div style={{ marginTop: '64px', padding: '40px' }}>
        <div className="loading-container">
          <div className="ink-loading">
            <div className="ink-drop"></div>
            <div className="ink-drop"></div>
            <div className="ink-drop"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div style={{ marginTop: '64px', padding: '40px', textAlign: 'center' }}>
        <p>作品不存在</p>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="critique-page">
      <div 
        className="critique-canvas-wrapper"
        ref={containerRef}
        onWheel={handleWheel}
        style={{ cursor: isCtrlPressed ? 'crosshair' : (isDragging ? 'grabbing' : 'grab') }}
      >
        <div className="critique-canvas-container">
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              className="critique-canvas"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'center center'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            
            {critiques.map((critique) => (
              <div
                key={critique.id}
                className="critique-marker"
                style={{
                  position: 'absolute',
                  left: critique.x * scale + offset.x,
                  top: critique.y * scale + offset.y,
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: getMarkerColor(critique.color),
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: 10,
                  boxShadow: selectedCritique === critique.id ? '0 0 10px ' + getMarkerColor(critique.color) : 'none'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCritique(critique.id);
                  setPendingCritique(null);
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: getMarkerColor(critique.color),
                    transform: 'translate(-50%, -50%)',
                    animation: 'inkSpread 2s ease-out infinite',
                    opacity: 0.5
                  }}
                />
              </div>
            ))}

            {pendingCritique && (
              <div
                style={{
                  position: 'absolute',
                  left: pendingCritique.x * scale + offset.x,
                  top: pendingCritique.y * scale + offset.y,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'transparent',
                  border: '2px dashed #C23B22',
                  transform: 'translate(-50%, -50%)',
                  animation: 'pulse 1s ease-in-out infinite'
                }}
              />
            )}
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px'
        }}>
          缩放: {(scale * 100).toFixed(0)}% | 按住 Ctrl+点击 添加批注 | 滚轮缩放 | 拖拽平移
        </div>
      </div>

      <div className="critique-panel">
        <div className="critique-stats">
          <h3 className="stats-title">批注统计</h3>
          <div className="stats-content">
            <div>
            <div className="stats-count">{stats.total}</div>
            <div className="stats-label">总批注数</div>
          </div>
          {renderRingChart()}
        </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {COLOR_LABELS.map(clr => (
            <div key={clr.value} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: clr.color }}></div>
              <span style={{ fontSize: '11px', color: '#666' }}>
                {stats.byColor[clr.value]}
              </span>
            </div>
          ))}
        </div>
        </div>

        {pendingCritique && (
          <div style={{ 
            marginBottom: '16px',
            padding: '12px',
            background: 'white',
            borderRadius: '8px',
            border: '2px solid var(--gold)'
          }}>
            <p style={{ fontSize: '13px', color: '#3E2723', marginBottom: '8px', fontWeight: '500' }}>添加批注</p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {COLOR_LABELS.map(clr => (
                <div
                  key={clr.value}
                  onClick={() => setSelectedColor(clr.value)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: clr.color,
                    cursor: 'pointer',
                    border: selectedColor === clr.value ? '2px solid #3E2723' : '2px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                  title={clr.name}
                />
              ))}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="写下你的批注..."
              style={{
                width: '100%',
                minHeight: '60px',
                padding: '8px',
                border: '1px solid #D2B48C',
                borderRadius: '6px',
                resize: 'vertical',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit',
                marginBottom: '8px'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddCritique}
                disabled={!newComment.trim()}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  backgroundColor: newComment.trim() ? 'var(--medium-brown)' : '#ccc',
                  color: 'white',
                  border: 'none',
              borderRadius: '6px',
              cursor: newComment.trim() ? 'pointer' : 'not-allowed',
              fontSize: '13px',
              transition: 'all 0.3s ease'
            }}
              >
                发布
              </button>
              <button
                onClick={() => setPendingCritique(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.3s ease'
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="critique-list">
          <h3 style={{ fontSize: '14px', color: '#3E2723', marginBottom: '12px', fontWeight: '600' }}>
            全部批注 ({critiques.length})
          </h3>
          {critiques.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', padding: '20px' }}>
              暂无批注，按住 Ctrl 点击画布添加
            </p>
          ) : (
            critiques.map(critique => (
              <div
                key={critique.id}
                className="critique-item"
                style={{
                  borderLeft: selectedCritique === critique.id ? '3px solid var(--gold)' : '3px solid transparent'
                }}
                onClick={() => setSelectedCritique(critique.id)}
              >
                <div className="critique-header">
                  <div className="critique-avatar">
                    {critique.userName.charAt(0)}
                  </div>
                  <span className="critique-user">{critique.userName}</span>
                  <div
                    className="critique-color-tag"
                    style={{ backgroundColor: getMarkerColor(critique.color) }}
                  />
                </div>
                <p className="critique-text">{critique.text}</p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="critique-time">
                    {new Date(critique.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                  <span 
                    className="reply-link"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReplyInput(prev => ({ ...prev, [critique.id]: !prev[critique.id] }));
                    }}
                  >
                    回复
                  </span>
                </div>

                {critique.replies && critique.replies.length > 0 && (
                  <div className="reply-list">
                    {renderReplies(critique.replies, critique.id)}
                  </div>
                )}

                {showReplyInput[critique.id] && (
                  <div className="reply-input-container">
                    <input
                      type="text"
                      className="reply-input"
                      placeholder="写下回复..."
                      value={replyInputs[critique.id] || ''}
                      onChange={(e) => setReplyInputs(prev => ({ ...prev, [critique.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleReply(critique.id, critique.id, 1);
                        }
                      }}
                    />
                    <button 
                      className="reply-btn"
                      onClick={() => handleReply(critique.id, critique.id, 1)}
                    >
                      发送
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CritiquePage;

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { usePenStroke } from './hooks/usePenStroke';
import { PaperCanvas, type PaperCanvasHandle } from './components/PaperCanvas';
import { STYLE_PRESETS, type Stroke, type StylePreset, type StrokePoint } from './types';
import './styles.css';

const renderThumb = (canvas: HTMLCanvasElement, points: StrokePoint[]) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#f5f0e1';
  ctx.fillRect(0, 0, w, h);
  if (points.length < 2) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const pad = 4;
  const sx = (w - pad * 2) / bw;
  const sy = (h - pad * 2) / bh;
  const s = Math.min(sx, sy);
  const ox = pad + (w - pad * 2 - bw * s) / 2 - minX * s;
  const oy = pad + (h - pad * 2 - bh * s) / 2 - minY * s;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1a1a1a';
  for (let i = 1; i < points.length; i++) {
    const t = i / (points.length - 1);
    const bell = Math.sin(t * Math.PI);
    ctx.lineWidth = 1.5 + bell * 3;
    const a = points[i - 1];
    const b = points[i];
    ctx.beginPath();
    ctx.moveTo(a.x * s + ox, a.y * s + oy);
    ctx.lineTo(b.x * s + ox, b.y * s + oy);
    ctx.stroke();
  }
  ctx.restore();
};

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const HistoryThumb: React.FC<{ points: StrokePoint[] }> = ({ points }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (c) {
      c.width = 56;
      c.height = 44;
      renderThumb(c, points);
    }
  }, [points]);
  return <canvas ref={canvasRef} />;
};

const ScoreCardInner: React.FC<{ stroke: Stroke | null }> = ({ stroke }) => {
  const total = stroke?.totalScore ?? 0;
  const items = stroke
    ? [
        { name: '平滑度', data: stroke.smoothness },
        { name: '结 构', data: stroke.structure },
        { name: '力 度', data: stroke.pressure },
      ]
    : [];

  return (
    <div className="score-card">
      <div className="score-total">
        <span className="score-total-number">{total}</span>
        <span className="score-total-label">综合评分 · TOTAL</span>
      </div>
      {stroke ? (
        <ul className="score-dim-list">
          {items.map((it) => (
            <li key={it.name} className="score-dim-item">
              <div className="score-dim-head">
                <span className="score-dim-name">{it.name}</span>
                <span className="score-dim-value">{it.data.score}</span>
              </div>
              <span className="score-dim-tag">{it.data.label}</span>
              <div className="score-dim-bar">
                <div
                  className="score-dim-bar-fill"
                  style={{ width: `${it.data.score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ textAlign: 'center', padding: '14px 4px', color: '#8d6e63', fontSize: 13, lineHeight: 1.8 }}>
          请在宣纸上
          <br />
          书写任意笔画
          <br />
          以获得评分
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [styleIdx, setStyleIdx] = useState(0);
  const [history, setHistory] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStroke, setReplayStroke] = useState<Stroke | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<'score' | 'history'>('score');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const currentStyle: StylePreset = STYLE_PRESETS[styleIdx];
  const canvasRef = useRef<PaperCanvasHandle>(null);
  const {
    currentStroke: liveStroke,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePenStroke();

  const onPointerUp = () => {
    const result = handlePointerUp(currentStyle);
    if (result && result.points.length >= 2) {
      const strokeObj: Stroke = {
        id: result.id,
        points: result.points,
        totalScore: result.totalScore,
        smoothness: result.smoothness,
        structure: result.structure,
        pressure: result.pressure,
        styleId: currentStyle.id,
        styleName: currentStyle.name,
        timestamp: Date.now(),
        deviationMarkers: result.deviationMarkers,
      };
      setCurrentStroke(strokeObj);
      setHistory((prev) => {
        const next = [strokeObj, ...prev];
        return next.slice(0, 20);
      });
      canvasRef.current?.addCompletedStroke(result.points, result.deviationMarkers);
    }
  };

  const startReplay = (s: Stroke) => {
    if (isReplaying) return;
    setReplayStroke(s);
    setIsReplaying(true);
    setPlayingId(s.id);
    canvasRef.current?.resetCanvas();
  };

  const stopReplay = () => {
    canvasRef.current?.stopReplay();
  };

  const onReplayEnd = () => {
    setIsReplaying(false);
    setReplayStroke(null);
    setPlayingId(null);
    if (replayStroke) {
      canvasRef.current?.addCompletedStroke(replayStroke.points, replayStroke.deviationMarkers);
    }
  };

  const clearCanvas = () => {
    if (isReplaying) return;
    canvasRef.current?.resetCanvas();
  };

  useEffect(() => {
    if (sheetOpen) setDrawerOpen(true);
  }, [sheetOpen]);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => b.timestamp - a.timestamp),
    [history]
  );

  return (
    <div className="app-root">
      <div className="app-main">
        <div className="left-panel-desktop panel">
          <h2 className="panel-title">评 分 卡</h2>
          <ScoreCardInner stroke={currentStroke} />
          <div className="action-row">
            <button className="action-btn primary" onClick={clearCanvas}>
              清 空
            </button>
            <button
              className="action-btn"
              onClick={() => {
                setCurrentStroke(null);
                setHistory([]);
                canvasRef.current?.resetCanvas();
              }}
            >
              重 置
            </button>
          </div>
        </div>

        <div className="paper-area">
          <div className="drawer-toggle" onClick={() => setDrawerOpen((o) => !o)}>
            ☰
          </div>

          {window.innerWidth <= 1024 && window.innerWidth > 768 && (
            <>
              <div
                className="drawer-header"
                onClick={() => setDrawerOpen((o) => !o)}
              >
                <h3>评分卡 · 当前</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="drawer-score-badge">
                    {currentStroke?.totalScore ?? '--'}
                  </span>
                  <span className={`drawer-arrow ${drawerOpen ? 'open' : ''}`}>▼</span>
                </div>
              </div>
              <div className={`score-drawer ${drawerOpen ? 'open' : ''}`}>
                <div className="score-drawer-inner">
                  <ScoreCardInner stroke={currentStroke} />
                  <div className="action-row">
                    <button className="action-btn primary" onClick={clearCanvas}>
                      清 空
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => {
                        setCurrentStroke(null);
                        setHistory([]);
                        canvasRef.current?.resetCanvas();
                      }}
                    >
                      重 置
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <PaperCanvas
              ref={canvasRef}
              currentPoints={liveStroke.points}
              isDrawing={liveStroke.isDrawing}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={onPointerUp}
              replayStroke={replayStroke}
              isReplaying={isReplaying}
              onReplayEnd={onReplayEnd}
              referenceStyle={currentStyle}
            />
            {isReplaying && (
              <div className="replay-controls">
                <button className="stop-btn" onClick={stopReplay}>
                  停止回放 ■
                </button>
              </div>
            )}
          </div>

          <div className="style-selector">
            {STYLE_PRESETS.map((s, idx) => (
              <button
                key={s.id}
                className={`style-btn ${idx === styleIdx ? 'active' : ''}`}
                onClick={() => !isReplaying && setStyleIdx(idx)}
                title={`${s.name}风格参考`}
              >
                <span>{s.name}</span>
                <span className="style-btn-outline">
                  <svg viewBox="0 0 200 80" preserveAspectRatio="none">
                    <path
                      d={s.sampleOutline}
                      fill={idx === styleIdx ? 'rgba(255,248,225,0.25)' : 'rgba(183,28,28,0.12)'}
                      stroke={idx === styleIdx ? '#fff8e1' : '#b71c1c'}
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="right-panel-desktop panel">
          <h2 className="panel-title">笔画历史</h2>
          {sortedHistory.length === 0 ? (
            <div className="history-empty">
              暂无历史记录
              <br />
              书写笔画后
              <br />
              将自动保存于此
              <br />
              <br />
              <span style={{ fontSize: 12 }}>
                点击历史条目
                <br />
                可慢速回放书写过程
              </span>
            </div>
          ) : (
            <ul className="history-list">
              {sortedHistory.map((s) => (
                <li
                  key={s.id}
                  className={`history-item ${playingId === s.id ? 'playing' : ''}`}
                  onClick={() => startReplay(s)}
                >
                  <div className="history-thumb">
                    <HistoryThumb points={s.points} />
                  </div>
                  <div className="history-info">
                    <div className="history-score-row">
                      <span className="history-score">{s.totalScore}</span>
                      <span className="history-style">{s.styleName}</span>
                    </div>
                    <div className="history-meta">{formatTime(s.timestamp)}</div>
                    <div className="history-meta" style={{ opacity: 0.75 }}>
                      平{s.smoothness.score} · 结{s.structure.score} · 力
                      {s.pressure.score}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {window.innerWidth <= 768 && (
        <div className="mobile-tab-bar">
          <button
            className={`mobile-tab ${sheetOpen && sheetTab === 'score' ? 'active' : ''}`}
            onClick={() => {
              setSheetTab('score');
              setSheetOpen(true);
            }}
          >
            <span className="mobile-tab-icon">📊</span>
            <span>评分</span>
          </button>
          <button
            className={`mobile-tab ${sheetOpen && sheetTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setSheetTab('history');
              setSheetOpen(true);
            }}
          >
            <span className="mobile-tab-icon">📜</span>
            <span>历史</span>
          </button>
          <button
            className="mobile-tab"
            onClick={() => {
              setCurrentStroke(null);
              setHistory([]);
              canvasRef.current?.resetCanvas();
            }}
          >
            <span className="mobile-tab-icon">🔄</span>
            <span>重置</span>
          </button>
        </div>
      )}

      <div
        className={`side-sheet-overlay ${sheetOpen ? 'open' : ''}`}
        onClick={() => setSheetOpen(false)}
      />
      <aside className={`side-sheet ${sheetOpen ? 'open' : ''}`}>
        <button className="side-sheet-close" onClick={() => setSheetOpen(false)}>
          ×
        </button>
        <div style={{ marginTop: 8 }}>
          <h2 className="panel-title">
            {sheetTab === 'score' ? '评分详情' : '笔画历史'}
          </h2>
        </div>
        {sheetTab === 'score' ? (
          <>
            <ScoreCardInner stroke={currentStroke} />
            <div className="action-row">
              <button className="action-btn primary" onClick={clearCanvas}>
                清空画布
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  setCurrentStroke(null);
                  setHistory([]);
                  canvasRef.current?.resetCanvas();
                }}
              >
                重置全部
              </button>
            </div>
          </>
        ) : sortedHistory.length === 0 ? (
          <div className="history-empty">
            暂无历史记录
            <br />
            书写笔画后将显示于此
          </div>
        ) : (
          <ul className="history-list">
            {sortedHistory.map((s) => (
              <li
                key={s.id}
                className={`history-item ${playingId === s.id ? 'playing' : ''}`}
                onClick={() => {
                  setSheetOpen(false);
                  setTimeout(() => startReplay(s), 300);
                }}
              >
                <div className="history-thumb">
                  <HistoryThumb points={s.points} />
                </div>
                <div className="history-info">
                  <div className="history-score-row">
                    <span className="history-score">{s.totalScore}</span>
                    <span className="history-style">{s.styleName}</span>
                  </div>
                  <div className="history-meta">{formatTime(s.timestamp)}</div>
                  <div className="history-meta" style={{ opacity: 0.75 }}>
                    平{s.smoothness.score} · 结{s.structure.score} · 力
                    {s.pressure.score}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

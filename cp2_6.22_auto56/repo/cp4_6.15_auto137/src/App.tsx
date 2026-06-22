import React, { useState, useEffect, useCallback, useRef } from 'react';
import Gallery from './component/Gallery';
import CalligraphyCanvas, { type CalligraphyCanvasHandle } from './component/CalligraphyCanvas';
import { rubbings } from './data/rubbings';
import type { Rubbing, PracticeRecord, AnimationSpeed, ViewMode, Stroke } from './types';
import { calculateOverallScore, getScoreGradient, getScoreColor } from './utils/scoring';

const STORAGE_KEY = 'calligraphy_practice_records';

const loadRecords = (): PracticeRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecords = (records: PracticeRecord[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
};

const drawStrokeOnCanvas = (
  canvas: HTMLCanvasElement,
  strokes: { points: { x: number; y: number }[]; width: number }[],
  color: string,
  alpha: number
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#F5EDD8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return;
    for (let i = 1; i < stroke.points.length; i++) {
      const t = i / stroke.points.length;
      const w = (stroke.width || 8) * (0.7 + 0.3 * Math.sin(t * Math.PI));
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(stroke.points[i - 1].x, stroke.points[i - 1].y);
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.stroke();
    }
  });
  ctx.restore();
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [selectedRubbing, setSelectedRubbing] = useState<Rubbing | null>(null);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>('normal');
  const [strokeScores, setStrokeScores] = useState<Map<number, number>>(new Map());
  const [showScoreCard, setShowScoreCard] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [records, setRecords] = useState<PracticeRecord[]>([]);
  const [visibleRecords, setVisibleRecords] = useState<Set<string>>(new Set());
  const [compareRecord, setCompareRecord] = useState<PracticeRecord | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [scoreAnimated, setScoreAnimated] = useState(false);

  const canvasRef = useRef<CalligraphyCanvasHandle>(null);
  const userStrokesRef = useRef<Stroke[]>([]);
  const compareUserRef = useRef<HTMLCanvasElement>(null);
  const compareOrigRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
      if (window.innerWidth <= 600) {
        document.body.classList.add('mobile-nav-active');
      } else {
        document.body.classList.remove('mobile-nav-active');
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (viewMode === 'history') {
      const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);
      sorted.forEach((record, index) => {
        setTimeout(() => {
          setVisibleRecords((prev) => new Set(prev).add(record.id));
        }, index * 80);
      });
    } else {
      setVisibleRecords(new Set());
    }
  }, [viewMode, records]);

  const currentChar = selectedRubbing?.characters[selectedCharIndex];

  const handleSelectRubbing = (rubbing: Rubbing) => {
    setSelectedRubbing(rubbing);
    setSelectedCharIndex(0);
    setStrokeScores(new Map());
    setShowScoreCard(false);
    setScoreAnimated(false);
    setResetTrigger((t) => t + 1);
    userStrokesRef.current = [];
    setViewMode('practice');
  };

  const handleBackToGallery = () => {
    setViewMode('gallery');
    setSelectedRubbing(null);
    setStrokeScores(new Map());
    setShowScoreCard(false);
    setScoreAnimated(false);
  };

  const handleScoreUpdate = useCallback((strokeId: number, score: number) => {
    setStrokeScores((prev) => {
      const next = new Map(prev);
      const existing = next.get(strokeId) || 0;
      next.set(strokeId, Math.max(existing, score));
      return next;
    });
  }, []);

  const handleUserStrokeAdd = useCallback((stroke: Stroke) => {
    userStrokesRef.current = [...userStrokesRef.current, stroke];
  }, []);

  const handleAllStrokesComplete = useCallback(() => {
    if (!selectedRubbing || !currentChar) return;

    setShowScoreCard(true);
    setTimeout(() => setScoreAnimated(true), 50);

    const scoresArray = currentChar.strokes.map((s) => strokeScores.get(s.id) || 0);
    const overallScore = calculateOverallScore(scoresArray);

    const record: PracticeRecord = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      rubbingId: selectedRubbing.id,
      rubbingName: selectedRubbing.name,
      character: currentChar.char,
      score: overallScore,
      strokeScores: currentChar.strokes.map((s) => ({
        strokeId: s.id,
        score: strokeScores.get(s.id) || 0
      })),
      userStrokes: [...userStrokesRef.current],
      date: new Date().toLocaleDateString('zh-CN'),
      timestamp: Date.now()
    };

    setRecords((prev) => {
      const updated = [record, ...prev];
      saveRecords(updated);
      return updated;
    });
  }, [selectedRubbing, currentChar, strokeScores]);

  const handleClearCanvas = () => {
    if (canvasRef.current) canvasRef.current.clearCanvas();
    setResetTrigger((t) => t + 1);
    setStrokeScores(new Map());
    setShowScoreCard(false);
    setScoreAnimated(false);
    userStrokesRef.current = [];
  };

  const handlePlayAnimation = () => {
    if (canvasRef.current) canvasRef.current.playAnimation();
  };

  const handleCharChange = (index: number) => {
    setSelectedCharIndex(index);
    setStrokeScores(new Map());
    setShowScoreCard(false);
    setScoreAnimated(false);
    setResetTrigger((t) => t + 1);
    userStrokesRef.current = [];
  };

  const handleCompare = (record: PracticeRecord) => {
    setCompareRecord(record);
  };

  useEffect(() => {
    if (!compareRecord || !compareUserRef.current || !compareOrigRef.current) return;

    const userCanvas = compareUserRef.current;
    drawStrokeOnCanvas(
      userCanvas,
      compareRecord.userStrokes,
      '#2a2a2a',
      0.6
    );

    const origCanvas = compareOrigRef.current;
    const origCtx = origCanvas.getContext('2d');
    if (!origCtx) return;
    origCtx.clearRect(0, 0, origCanvas.width, origCanvas.height);
    origCtx.fillStyle = '#F5EDD8';
    origCtx.fillRect(0, 0, origCanvas.width, origCanvas.height);

    const rubbing = rubbings.find((r) => r.id === compareRecord.rubbingId);
    const charData = rubbing?.characters.find((c) => c.char === compareRecord.character);
    if (charData) {
      origCtx.save();
      origCtx.lineCap = 'round';
      origCtx.lineJoin = 'round';
      charData.strokes.forEach((stroke) => {
        for (let i = 1; i < stroke.points.length; i++) {
          const t = i / stroke.points.length;
          let w: number;
          if (t < 0.5) {
            w = stroke.widthStart + (stroke.widthMid - stroke.widthStart) * (t * 2);
          } else {
            w = stroke.widthMid + (stroke.widthEnd - stroke.widthMid) * ((t - 0.5) * 2);
          }
          origCtx.globalAlpha = 0.85;
          origCtx.strokeStyle = '#1a1a1a';
          origCtx.lineWidth = w;
          origCtx.beginPath();
          origCtx.moveTo(stroke.points[i - 1].x, stroke.points[i - 1].y);
          origCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
          origCtx.stroke();
        }
      });
      origCtx.restore();
    }
  }, [compareRecord]);

  const sortedRecords = [...records].sort((a, b) => b.timestamp - a.timestamp);

  const handleClearRecords = () => {
    if (!confirm('确定要清空所有临摹记录吗？此操作不可撤销。')) return;
    setRecords([]);
    saveRecords([]);
    setVisibleRecords(new Set());
  };

  const renderGallery = () => (
    <Gallery rubbings={rubbings} onSelect={handleSelectRubbing} />
  );

  const renderPractice = () => {
    if (!selectedRubbing || !currentChar) return null;

    const scoresArray = currentChar.strokes.map((s) => strokeScores.get(s.id) || 0);
    const currentOverall = calculateOverallScore(scoresArray);

    return (
      <div className="practice-page">
        <div className="canvas-wrapper">
          <div className="canvas-header">
            <button className="back-btn" onClick={handleBackToGallery}>
              ← 返回碑帖
            </button>
            <div className="character-selector">
              {selectedRubbing.characters.map((ch, idx) => (
                <button
                  key={ch.char + idx}
                  className={`char-btn ${idx === selectedCharIndex ? 'active' : ''}`}
                  onClick={() => handleCharChange(idx)}
                >
                  {ch.char}
                </button>
              ))}
            </div>
            <div style={{ width: 100 }} />
          </div>

          <CalligraphyCanvas
            ref={canvasRef}
            characterStrokes={currentChar.strokes}
            character={currentChar.char}
            size={420}
            speed={animationSpeed}
            onScoreUpdate={handleScoreUpdate}
            onAllStrokesComplete={handleAllStrokesComplete}
            onUserStrokeAdd={handleUserStrokeAdd}
            resetTrigger={resetTrigger}
          />

          {showScoreCard && (
            <div className="panel-card score-card" style={{ width: '100%', maxWidth: 460 }}>
              <div className="score-header">
                <span className="score-label">整体匹配度</span>
                <span className="score-value" style={{ color: getScoreColor(currentOverall) }}>
                  {currentOverall}%
                </span>
              </div>
              <div className="score-bar-container">
                <div
                  className="score-bar"
                  style={{
                    width: scoreAnimated ? `${currentOverall}%` : '0%',
                    backgroundColor: getScoreGradient(currentOverall)
                  }}
                />
              </div>
              <div className="stroke-scores">
                {currentChar.strokes.map((stroke) => {
                  const sScore = strokeScores.get(stroke.id) || 0;
                  return (
                    <div key={stroke.id} className="stroke-score-item">
                      <div className="stroke-thumb">
                        <canvas
                          width={28}
                          height={28}
                          ref={(el) => {
                            if (!el) return;
                            const ctx = el.getContext('2d');
                            if (!ctx) return;
                            ctx.clearRect(0, 0, 28, 28);
                            if (stroke.points.length >= 2) {
                              ctx.save();
                              ctx.lineCap = 'round';
                              ctx.strokeStyle = '#1a1a1a';
                              ctx.lineWidth = 2;
                              const scale = 28 / 420;
                              ctx.beginPath();
                              ctx.moveTo(stroke.points[0].x * scale, stroke.points[0].y * scale);
                              for (let i = 1; i < stroke.points.length; i += 3) {
                                ctx.lineTo(stroke.points[i].x * scale, stroke.points[i].y * scale);
                              }
                              ctx.stroke();
                              ctx.restore();
                            }
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: '#6a6a6a' }}>{stroke.name}</span>
                      <span
                        className="stroke-score-value"
                        style={{ color: getScoreColor(sScore) }}
                      >
                        {sScore}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="side-panel">
          <div className="panel-card">
            <div className="panel-title">播放速度</div>
            <div className="speed-controls">
              {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map((s) => (
                <button
                  key={s}
                  className={`speed-btn ${animationSpeed === s ? 'active' : ''}`}
                  onClick={() => setAnimationSpeed(s)}
                >
                  {s === 'slow' ? '慢' : s === 'normal' ? '中' : '快'}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-title">操作</div>
            <div className="action-buttons">
              <button className="action-btn primary" onClick={handlePlayAnimation}>
                ▶ 播放笔画顺序
              </button>
              <button className="action-btn" onClick={handleClearCanvas}>
                ✦ 清除画布
              </button>
              <button className="action-btn" onClick={handleBackToGallery}>
                ← 返回碑帖
              </button>
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-title">碑帖信息</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: '#3a3a3a' }}>
              <div><strong>名称：</strong>{selectedRubbing.name}</div>
              <div><strong>朝代：</strong>{selectedRubbing.dynasty}</div>
              <div><strong>书者：</strong>{selectedRubbing.author}</div>
              <div><strong>年代：</strong>{selectedRubbing.year}</div>
              <div style={{ marginTop: 8, color: '#6a6a6a', fontStyle: 'italic' }}>
                {selectedRubbing.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (sortedRecords.length === 0) {
      return (
        <div className="empty-state page-enter">
          <div className="empty-state-icon">墨</div>
          <div className="empty-state-text">暂无临摹记录</div>
          <div className="empty-state-hint">选择碑帖开始临摹练习吧</div>
        </div>
      );
    }

    return (
      <div className="history-list page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#1a1a1a' }}>
            临摹记录（共 {sortedRecords.length} 条）
          </div>
          <button className="action-btn" onClick={handleClearRecords} style={{ padding: '8px 16px', fontSize: 13 }}>
            ✦ 清空记录
          </button>
        </div>
        {sortedRecords.map((record) => (
          <div
            key={record.id}
            className={`history-item ${visibleRecords.has(record.id) ? 'visible' : ''}`}
            onClick={() => handleCompare(record)}
          >
            <div className="history-left">
              <div className="history-char">{record.character}</div>
              <div className="history-info">
                <div className="history-rubbing">{record.rubbingName}</div>
                <div className="history-date">{record.date}</div>
              </div>
            </div>
            <div className="history-score">
              <div className="history-score-label">匹配度</div>
              <div className="history-score-value" style={{ color: getScoreColor(record.score) }}>
                {record.score}%
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCompareModal = () => {
    if (!compareRecord) return null;

    return (
      <div className="compare-modal" onClick={() => setCompareRecord(null)}>
        <div className="compare-content" onClick={(e) => e.stopPropagation()}>
          <div className="compare-header">
            <div className="compare-title">
              {compareRecord.rubbingName} · {compareRecord.character}
            </div>
            <button className="close-btn" onClick={() => setCompareRecord(null)}>✕</button>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 16, color: '#6a6a6a', fontSize: 14 }}>
            匹配度：<strong style={{ color: getScoreColor(compareRecord.score), fontSize: 18 }}>{compareRecord.score}%</strong>
            <span style={{ marginLeft: 16 }}>{compareRecord.date}</span>
          </div>
          <div className="compare-canvases">
            <div className="compare-canvas-wrapper">
              <div className="compare-label">原帖</div>
              <canvas
                ref={compareOrigRef}
                width={420}
                height={420}
                style={{
                  width: '100%',
                  maxWidth: 420,
                  borderRadius: 12,
                  border: '1px solid rgba(26,26,26,0.15)',
                  background: '#F5EDD8'
                }}
              />
            </div>
            <div className="compare-canvas-wrapper">
              <div className="compare-label">临摹</div>
              <canvas
                ref={compareUserRef}
                width={420}
                height={420}
                style={{
                  width: '100%',
                  maxWidth: 420,
                  borderRadius: 12,
                  border: '1px solid rgba(26,26,26,0.15)',
                  background: '#F5EDD8'
                }}
              />
            </div>
          </div>
          <div className="stroke-scores" style={{ marginTop: 20, justifyContent: 'center' }}>
            {compareRecord.strokeScores.map((ss) => {
              const rubbing = rubbings.find((r) => r.id === compareRecord.rubbingId);
              const charData = rubbing?.characters.find((c) => c.char === compareRecord.character);
              const strokeData = charData?.strokes.find((s) => s.id === ss.strokeId);
              return (
                <div key={ss.strokeId} className="stroke-score-item">
                  <div className="stroke-thumb">
                    <canvas
                      width={28}
                      height={28}
                      ref={(el) => {
                        if (!el || !strokeData) return;
                        const ctx = el.getContext('2d');
                        if (!ctx) return;
                        ctx.clearRect(0, 0, 28, 28);
                        if (strokeData.points.length >= 2) {
                          ctx.save();
                          ctx.lineCap = 'round';
                          ctx.strokeStyle = '#1a1a1a';
                          ctx.lineWidth = 2;
                          const scale = 28 / 420;
                          ctx.beginPath();
                          ctx.moveTo(strokeData.points[0].x * scale, strokeData.points[0].y * scale);
                          for (let i = 1; i < strokeData.points.length; i += 3) {
                            ctx.lineTo(strokeData.points[i].x * scale, strokeData.points[i].y * scale);
                          }
                          ctx.stroke();
                          ctx.restore();
                        }
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: '#6a6a6a' }}>{strokeData?.name || `笔${ss.strokeId}`}</span>
                  <span className="stroke-score-value" style={{ color: getScoreColor(ss.score) }}>
                    {ss.score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>墨韵临帖</h1>
        <div className="nav-tabs">
          {(['gallery', 'practice', 'history'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`nav-tab ${viewMode === mode ? 'active' : ''}`}
              onClick={() => {
                if (mode === 'practice' && !selectedRubbing) return;
                setViewMode(mode);
              }}
              disabled={mode === 'practice' && !selectedRubbing}
              style={mode === 'practice' && !selectedRubbing ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              {mode === 'gallery' ? '碑帖浏览' : mode === 'practice' ? '临摹练习' : '历史记录'}
            </button>
          ))}
        </div>
      </header>

      <main className="app-main">
        {viewMode === 'gallery' && renderGallery()}
        {viewMode === 'practice' && renderPractice()}
        {viewMode === 'history' && renderHistory()}
      </main>

      <footer className="app-footer">
        墨韵 · 古代书法碑帖临摹 — 以笔会友，以墨传心
      </footer>

      {isMobile && (
        <div className="mobile-bottom-nav">
          {(['gallery', 'practice', 'history'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`mobile-nav-btn ${viewMode === mode ? 'active' : ''}`}
              onClick={() => {
                if (mode === 'practice' && !selectedRubbing) return;
                setViewMode(mode);
              }}
              disabled={mode === 'practice' && !selectedRubbing}
            >
              {mode === 'gallery' ? '碑帖' : mode === 'practice' ? '临摹' : '记录'}
            </button>
          ))}
        </div>
      )}

      {renderCompareModal()}
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Piano from './components/Piano';
import { MusicEngine, BUILTIN_SCORES, type Score, type Note } from './core/MusicEngine';
import { Recorder, type EvaluationResult } from './core/Recorder';

interface PracticeSession {
  sectionId: string;
  timestamp: number;
  accuracy: number;
}

const buttonBaseStyle: React.CSSProperties = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '10px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  color: '#e0e0e0',
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
};

const getAccuracyColor = (accuracy: number): string => {
  if (accuracy >= 90) return '#2ecc71';
  if (accuracy >= 70) return '#f1c40f';
  return '#e74c3c';
};

const createRipple = (e: React.MouseEvent<HTMLElement>) => {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.className = 'ripple-effect';
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

const App: React.FC = () => {
  const [selectedScoreId, setSelectedScoreId] = useState<string>(BUILTIN_SCORES[0].id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedMidis, setHighlightedMidis] = useState<number[]>([]);
  const [upcomingMidis, setUpcomingMidis] = useState<number[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [sectionStart, setSectionStart] = useState(0);
  const [sectionEnd, setSectionEnd] = useState(0);
  const [practiceHistory, setPracticeHistory] = useState<PracticeSession[]>([]);
  const [showChartDrawer, setShowChartDrawer] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const musicEngineRef = useRef<MusicEngine | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const progressRafRef = useRef<number | null>(null);

  if (!musicEngineRef.current) {
    musicEngineRef.current = new MusicEngine();
  }
  if (!recorderRef.current) {
    recorderRef.current = new Recorder();
  }

  const currentScore: Score = useMemo(() => {
    return BUILTIN_SCORES.find((s) => s.id === selectedScoreId) || BUILTIN_SCORES[0];
  }, [selectedScoreId]);

  useEffect(() => {
    musicEngineRef.current?.loadScore(currentScore);
    setSectionStart(0);
    setSectionEnd(Math.max(0, currentScore.notes.length - 1));
    setEvaluationResult(null);
  }, [currentScore]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const compactMode = windowWidth < 768;

  const updateProgress = useCallback(() => {
    const engine = musicEngineRef.current;
    if (!engine || !engine.getIsPlaying()) {
      if (progressRafRef.current !== null) {
        cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
      return;
    }
    const t = engine.getCurrentTime();
    setCurrentTime(t);

    const playStart = engine.getPlaybackStartTime();
    const nowRel = (performance.now() - playStart) / 1000;
    const activeNotes = currentScore.notes.filter(
      (n) => n.startTime <= nowRel && n.startTime + n.duration >= nowRel
    );
    setHighlightedMidis(activeNotes.map((n) => n.midi));

    const upcomingWindow = 1.0;
    const upcomingNotes = currentScore.notes.filter(
      (n) => n.startTime > nowRel && n.startTime <= nowRel + upcomingWindow
    );
    setUpcomingMidis(Array.from(new Set(upcomingNotes.map((n) => n.midi))));

    progressRafRef.current = requestAnimationFrame(updateProgress);
  }, [currentScore]);

  const handlePlayComplete = useCallback(() => {
    setIsPlaying(false);
    setHighlightedMidis([]);
    setUpcomingMidis([]);
    if (recorderRef.current?.getIsRecording()) {
      recorderRef.current.stopRecording();
      setIsRecording(false);
      const result = recorderRef.current.evaluate(currentScore);
      setEvaluationResult(result);
      if (practiceMode) {
        const sectionId = `${currentScore.id}_${sectionStart}_${sectionEnd}`;
        setPracticeHistory((prev) => [
          ...prev,
          { sectionId, timestamp: Date.now(), accuracy: result.accuracy },
        ]);
      }
    }
  }, [currentScore, practiceMode, sectionStart, sectionEnd]);

  const startPerformance = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    const engine = musicEngineRef.current;
    if (!engine) return;
    setEvaluationResult(null);
    setCurrentTime(0);
    setIsPlaying(true);
    setIsRecording(true);
    recorderRef.current?.clear();
    recorderRef.current?.startRecording();

    if (practiceMode) {
      const sectionNotes: Note[] = currentScore.notes
        .slice(sectionStart, sectionEnd + 1)
        .map((n, i) => {
          const offset = i === 0 ? 0 : n.startTime - currentScore.notes[sectionStart].startTime;
          return { ...n, startTime: offset };
        });
      const lastNote = sectionNotes[sectionNotes.length - 1];
      const sectionScore: Score = {
        id: `${currentScore.id}_section`,
        name: `${currentScore.name} 段落练习`,
        notes: sectionNotes,
        totalDuration: lastNote ? lastNote.startTime + lastNote.duration + 0.5 : 0,
      };
      engine.loadScore(sectionScore);
      engine.playScore(
        () => {},
        () => {
          handlePlayComplete();
          engine.loadScore(currentScore);
        }
      );
    } else {
      engine.loadScore(currentScore);
      engine.playScore(() => {}, handlePlayComplete);
    }
    progressRafRef.current = requestAnimationFrame(updateProgress);
  };

  const stopPerformance = (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    musicEngineRef.current?.stopPlayback();
    if (recorderRef.current?.getIsRecording()) {
      recorderRef.current.stopRecording();
      const result = recorderRef.current.evaluate(currentScore);
      setEvaluationResult(result);
    }
    setIsPlaying(false);
    setIsRecording(false);
    setHighlightedMidis([]);
    setUpcomingMidis([]);
  };

  const handleKeyPress = useCallback((midi: number) => {
    musicEngineRef.current?.playNote(midi, 0.3);
    if (recorderRef.current?.getIsRecording()) {
      recorderRef.current.recordNote(midi);
    }
  }, []);

  useEffect(() => {
    return () => {
      musicEngineRef.current?.destroy();
      if (progressRafRef.current !== null) cancelAnimationFrame(progressRafRef.current);
    };
  }, []);

  const progressPercent = currentScore.totalDuration > 0
    ? Math.min(100, (currentTime / currentScore.totalDuration) * 100)
    : 0;

  const sectionHistory = practiceHistory.filter(
    (h) => h.sectionId === `${currentScore.id}_${sectionStart}_${sectionEnd}`
  );

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
        padding: compactMode ? '12px' : '24px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <header
        style={{
          textAlign: 'center',
          padding: '8px 0 16px 0',
        }}
      >
        <h1
          style={{
            fontSize: compactMode ? 22 : 30,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #a0c4ff 0%, #bdb2ff 50%, #ffd6a5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 2,
          }}
        >
          🎹 钢琴谱练习与演奏评价
        </h1>
        <p style={{ color: '#8892b0', marginTop: 6, fontSize: 13 }}>
          用键盘或鼠标点击演奏，系统自动评分并分析节奏偏差
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compactMode ? '1fr' : '1fr 340px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: 'rgba(22, 33, 62, 0.85)',
              backdropFilter: 'blur(6px)',
              borderRadius: 16,
              padding: compactMode ? 16 : 24,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            className="fade-in-up"
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
                <label style={{ fontWeight: 600, color: '#a0c4ff', fontSize: 14 }}>乐谱：</label>
                <select
                  value={selectedScoreId}
                  onChange={(e) => setSelectedScoreId(e.target.value)}
                  disabled={isPlaying}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#e0e0e0',
                    fontSize: 14,
                    cursor: isPlaying ? 'not-allowed' : 'pointer',
                    outline: 'none',
                    backdropFilter: 'blur(4px)',
                    minWidth: 160,
                  }}
                >
                  {BUILTIN_SCORES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}（{s.notes.length} 音符）
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {!isPlaying ? (
                  <button
                    onClick={startPerformance}
                    className="ripple-container"
                    onMouseDown={createRipple}
                    style={{
                      ...buttonBaseStyle,
                      background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                      color: '#fff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ▶ 开始演奏
                  </button>
                ) : (
                  <button
                    onClick={stopPerformance}
                    className="ripple-container"
                    onMouseDown={createRipple}
                    style={{
                      ...buttonBaseStyle,
                      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      color: '#fff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ■ 停止
                  </button>
                )}
              </div>
            </div>

            <div
              style={{
                position: 'relative',
                height: 56,
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, rgba(160,196,255,0.2) 0%, rgba(189,178,255,0.3) 100%)',
                  transition: 'width 0.08s linear',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${progressPercent}%`,
                  width: 3,
                  background: 'linear-gradient(180deg, #ff6b6b 0%, #ff3b3b 50%, #c0392b 100%)',
                  boxShadow: '0 0 14px rgba(255,59,59,0.9), 0 0 30px rgba(255,59,59,0.4)',
                  transform: 'translateX(-1.5px)',
                  zIndex: 6,
                  transition: 'left 0.05s linear',
                  borderRadius: 2,
                }}
              />
              {currentScore.notes.map((note, idx) => {
                const leftPct = (note.startTime / currentScore.totalDuration) * 100;
                const widthPct = (note.duration / currentScore.totalDuration) * 100;
                const minMidi = compactMode ? 36 : 21;
                const maxMidi = compactMode ? 96 : 108;
                const range = Math.max(1, maxMidi - minMidi);
                const normalizedY = Math.max(0, Math.min(1, (note.midi - minMidi) / range));
                const top = (1 - normalizedY) * 70 + 5;
                const isActive = highlightedMidis.includes(note.midi);
                const isUpcoming = upcomingMidis.includes(note.midi);
                let bg: string;
                let shadow: string;
                if (isActive) {
                  bg = 'linear-gradient(90deg, #ffd166, #ffb347)';
                  shadow = '0 0 10px rgba(255,209,102,0.9)';
                } else if (isUpcoming) {
                  bg = 'rgba(255,211,102,0.45)';
                  shadow = '0 0 6px rgba(255,211,102,0.5)';
                } else {
                  bg = 'rgba(160,196,255,0.55)';
                  shadow = 'none';
                }
                return (
                  <div
                    key={idx}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`,
                      top: `${top}%`,
                      width: `${Math.max(0.8, widthPct)}%`,
                      height: isActive ? 8 : 6,
                      background: bg,
                      borderRadius: 3,
                      boxShadow: shadow,
                      transition: 'background 0.1s, height 0.1s, box-shadow 0.1s',
                    }}
                  />
                );
              })}
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 10,
                  fontSize: 12,
                  color: '#8892b0',
                  fontFamily: 'monospace',
                }}
              >
                {currentTime.toFixed(1)}s / {currentScore.totalDuration.toFixed(1)}s
              </div>
              {isRecording && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#ff6b6b',
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#ff3b3b',
                      animation: 'pulse 1s infinite',
                    }}
                  />
                  录制中
                </div>
              )}
            </div>

            <div
              style={{
                padding: 14,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="practiceMode"
                    checked={practiceMode}
                    onChange={(e) => setPracticeMode(e.target.checked)}
                    disabled={isPlaying}
                    style={{ width: 16, height: 16, cursor: isPlaying ? 'not-allowed' : 'pointer' }}
                  />
                  <label htmlFor="practiceMode" style={{ fontSize: 14, fontWeight: 600 }}>
                    🎯 练习模式（选择段落循环练习）
                  </label>
                </div>
                {sectionHistory.length > 0 && (
                  <span style={{ fontSize: 12, color: '#a0c4ff' }}>
                    已练习 {sectionHistory.length} 次
                  </span>
                )}
              </div>
              {practiceMode && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#8892b0' }}>起始音符：</span>
                    <input
                      type="number"
                      min={0}
                      max={currentScore.notes.length - 1}
                      value={sectionStart}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(sectionEnd, parseInt(e.target.value) || 0));
                        setSectionStart(val);
                      }}
                      disabled={isPlaying}
                      style={{
                        width: 70,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#e0e0e0',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#8892b0' }}>结束音符：</span>
                    <input
                      type="number"
                      min={sectionStart}
                      max={currentScore.notes.length - 1}
                      value={sectionEnd}
                      onChange={(e) => {
                        const val = Math.max(sectionStart, Math.min(currentScore.notes.length - 1, parseInt(e.target.value) || 0));
                        setSectionEnd(val);
                      }}
                      disabled={isPlaying}
                      style={{
                        width: 70,
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(0,0,0,0.3)',
                        color: '#e0e0e0',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: '#8892b0' }}>
                    共 {sectionEnd - sectionStart + 1} 个音符（索引 0 ~ {currentScore.notes.length - 1}）
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: compactMode ? '8px 0' : '16px 0',
              overflowX: 'auto',
            }}
            className="fade-in-up"
          >
            <Piano
              onKeyPress={handleKeyPress}
              highlightedMidis={highlightedMidis}
              upcomingMidis={upcomingMidis}
              compactMode={compactMode}
            />
          </div>

          {(!compactMode || showChartDrawer) && evaluationResult && (
            <DeviationChart result={evaluationResult} />
          )}

          {compactMode && evaluationResult && (
            <button
              onClick={() => setShowChartDrawer((v) => !v)}
              style={{
                ...buttonBaseStyle,
                alignSelf: 'center',
                padding: '8px 18px',
                fontSize: 13,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {showChartDrawer ? '▲ 收起图表' : '▼ 展开节奏偏差图表'}
            </button>
          )}

          {practiceMode && sectionHistory.length > 0 && (
            <PracticeHistoryChart history={sectionHistory} />
          )}
        </div>

        {!compactMode && (
          <div style={{ position: 'sticky', top: 24 }}>
            <EvaluationPanel result={evaluationResult} />
          </div>
        )}

        {compactMode && evaluationResult && (
          <EvaluationPanel result={evaluationResult} />
        )}
      </div>

      <footer
        style={{
          textAlign: 'center',
          padding: '16px 0',
          color: '#555d72',
          fontSize: 12,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        钢琴谱练习与演奏评价 · Web Audio API + React + TypeScript
      </footer>
    </div>
  );
};

const EvaluationPanel: React.FC<{ result: EvaluationResult | null }> = ({ result }) => {
  const accuracy = result?.accuracy ?? 0;
  const color = getAccuracyColor(accuracy);

  return (
    <div
      style={{
        background: 'rgba(22, 33, 62, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
      className={result ? 'slide-in-right' : ''}
    >
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#a0c4ff' }}>
        📊 演奏评价结果
      </h2>

      {!result ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#555d72',
            fontSize: 14,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎼</div>
          点击「开始演奏」按钮开始<br />演奏结束后将在此展示评价结果
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
              }}
            >
              {accuracy.toFixed(1)}
              <span style={{ fontSize: 28 }}>%</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#8892b0', fontWeight: 500 }}>
              {accuracy >= 90 ? '🏆 太棒了！近乎完美' :
               accuracy >= 70 ? '👍 不错，继续努力' :
               accuracy >= 50 ? '💪 还需多加练习' : '📚 建议先熟悉乐谱'}
            </div>
          </div>

          <div>
            <div style={{ height: 14, background: 'rgba(0,0,0,0.4)', borderRadius: 7, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${accuracy}%`,
                  background: `linear-gradient(90deg, ${color}cc 0%, ${color} 100%)`,
                  borderRadius: 7,
                  transition: 'width 0.8s ease-out',
                  boxShadow: `0 0 10px ${color}66`,
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
                fontSize: 10,
                color: '#555d72',
              }}
            >
              <span>0</span><span>69%</span><span>89%</span><span>100%</span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            <StatCard label="总音符" value={result.totalNotes} color="#a0c4ff" />
            <StatCard label="✅ 正确" value={result.correctNotes} color="#2ecc71" />
            <StatCard label="❌ 错误" value={result.wrongNotes} color="#e74c3c" />
            <StatCard label="⬜ 漏按" value={result.missedNotes} color="#f1c40f" />
          </div>

          <div
            style={{
              padding: 14,
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 13, color: '#8892b0', marginBottom: 10, fontWeight: 600 }}>
              ⏱️ 节奏偏差统计
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#bdb2ff' }}>
                  {result.meanDeviation.toFixed(0)}
                  <span style={{ fontSize: 12 }}>ms</span>
                </div>
                <div style={{ fontSize: 11, color: '#555d72', marginTop: 2 }}>偏差均值</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#ffd6a5' }}>
                  {result.stdDeviation.toFixed(0)}
                  <span style={{ fontSize: 12 }}>ms</span>
                </div>
                <div style={{ fontSize: 11, color: '#555d72', marginTop: 2 }}>标准差</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div
    style={{
      padding: '10px 12px',
      background: 'rgba(0,0,0,0.25)',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.04)',
    }}
  >
    <div style={{ fontSize: 11, color: '#8892b0', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
  </div>
);

const DeviationChart: React.FC<{ result: EvaluationResult }> = ({ result }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 800;
  const height = 220;
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, width, height);

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const maxDev = Math.max(200, ...result.deviations.filter(d => d.isCorrect).map(d => Math.abs(d.deviation)));

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    const zeroY = padding.top + chartH / 2;
    ctx.strokeStyle = 'rgba(160,196,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, zeroY);
    ctx.lineTo(width - padding.right, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#8892b0';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`+${maxDev}ms`, padding.left - 8, padding.top + 6);
    ctx.fillText('0', padding.left - 8, zeroY + 4);
    ctx.fillText(`-${maxDev}ms`, padding.left - 8, height - padding.bottom + 2);

    const n = result.deviations.length;
    const getX = (i: number) => padding.left + (n <= 1 ? chartW / 2 : (i / (n - 1)) * chartW);
    const getY = (dev: number) => {
      const clamped = Math.max(-maxDev, Math.min(maxDev, dev));
      return zeroY - (clamped / maxDev) * (chartH / 2);
    };

    result.deviations.forEach((d) => {
      const cx = getX(d.noteIndex);
      const cy = getY(d.deviation);
      const r = d.isCorrect ? 5 : 4;

      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = d.isCorrect ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = d.isCorrect ? '#2ecc71' : '#e74c3c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.fillStyle = '#8892b0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('乐谱音符序号（第 i 个）', width / 2, height - 10);

    ctx.textAlign = 'left';
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('● 正确', padding.left, 16);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('● 错误/漏按', padding.left + 80, 16);
    ctx.fillStyle = '#a0c4ff';
    ctx.fillText('--- 零偏差基准线', padding.left + 190, 16);

    ctx.fillStyle = '#bdb2ff';
    ctx.textAlign = 'right';
    ctx.fillText(
      `均值：${result.meanDeviation.toFixed(1)}ms · 标准差：${result.stdDeviation.toFixed(1)}ms`,
      width - padding.right,
      16
    );
  }, [result, width, height]);

  return (
    <div
      style={{
        background: 'rgba(22, 33, 62, 0.85)',
        backdropFilter: 'blur(6px)',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      className="fade-in-up"
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#a0c4ff' }}>
        📈 节奏偏差散点图
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            maxWidth: width,
            height: height,
            display: 'block',
            borderRadius: 10,
          }}
        />
      </div>
    </div>
  );
};

const PracticeHistoryChart: React.FC<{ history: PracticeSession[] }> = ({ history }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = 800;
  const height = 200;
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, width, height);

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#8892b0';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const pct = 100 - (100 / 4) * i;
      const y = padding.top + (chartH / 4) * i + 4;
      ctx.fillText(`${pct}%`, padding.left - 8, y);
    }

    const n = history.length;
    if (n >= 1) {
      ctx.beginPath();
      history.forEach((h, i) => {
        const x = n === 1 ? padding.left + chartW / 2 : padding.left + (i / (n - 1)) * chartW;
        const y = padding.top + chartH - (h.accuracy / 100) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#bdb2ff';
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      history.forEach((h, i) => {
        const x = n === 1 ? padding.left + chartW / 2 : padding.left + (i / (n - 1)) * chartW;
        const y = padding.top + chartH - (h.accuracy / 100) * chartH;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = getAccuracyColor(h.accuracy);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${h.accuracy.toFixed(0)}%`, x, y - 10);
      });
    }

    ctx.fillStyle = '#8892b0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`练习次数（共 ${n} 次）`, width / 2, height - 10);
  }, [history, width, height]);

  return (
    <div
      style={{
        background: 'rgba(22, 33, 62, 0.85)',
        backdropFilter: 'blur(6px)',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      className="fade-in-up"
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#bdb2ff' }}>
        📉 练习准确率变化曲线
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            maxWidth: width,
            height: height,
            display: 'block',
            borderRadius: 10,
          }}
        />
      </div>
    </div>
  );
};

export default App;

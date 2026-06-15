import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, TeaArtPath, PathPoint } from './store';
import TeaWhisk from './TeaWhisk';
import JudgementPanel from './JudgementPanel';

interface WaterParticle {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

const CANVAS_WIDTH = 140;
const CANVAS_HEIGHT = 70;

const GameBoard: React.FC = () => {
  const {
    phase,
    player,
    ai,
    currentBrush,
    brushSize,
    isPouring,
    isWhisking,
    whiskSpeed,
    history,
    winRate,
    setPhase,
    setCurrentBrush,
    setBrushSize,
    setIsPouring,
    setIsWhisking,
    setWhiskSpeed,
    updatePlayerFoam,
    addPlayerTeaArt,
    setPlayerBiteTime,
    setAiBiteTime,
    calculateScores,
    addHistoryRecord,
    setShowJudgement,
    showJudgement,
  } = useGameStore();

  const playerBowlRef = useRef<HTMLDivElement>(null);
  const playerFoamCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerArtCanvasRef = useRef<HTMLCanvasElement>(null);
  const aiArtCanvasRef = useRef<HTMLCanvasElement>(null);

  const [whiskPosition, setWhiskPosition] = useState({ x: 70, y: 35 });
  const [waterParticles, setWaterParticles] = useState<WaterParticle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [currentPath, setCurrentPath] = useState<PathPoint[]>([]);
  const fpsRef = useRef<number[]>([]);
  const [fps, setFps] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [bowlShake, setBowlShake] = useState(false);
  const [foamOpacity, setFoamOpacity] = useState({ layer1: 0, layer2: 0, layer3: 0 });
  const [biteStartTime, setBiteStartTime] = useState<number | null>(null);
  const [aiActionPhase, setAiActionPhase] = useState<'idle' | 'pouring' | 'whisking' | 'drawing' | 'done'>(
    'idle'
  );

  const particleIdRef = useRef(0);
  const rippleIdRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      fpsRef.current.push(now);
      const oneSecondAgo = now - 1000;
      fpsRef.current = fpsRef.current.filter((t) => t > oneSecondAgo);
      setFps(fpsRef.current.length);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleFoamGenerated = useCallback(
    (speed: number) => {
      const state = useGameStore.getState();
      const currentFoam = state.player.foam;

      if (speed > 8) {
        updatePlayerFoam({
          fineBubbles: currentFoam.fineBubbles + 3,
          expansionRate: Math.min(currentFoam.expansionRate + speed * 0.02, 1),
        });
        setFoamOpacity((prev) => ({
          ...prev,
          layer1: Math.min(prev.layer1 + 0.02, 1),
        }));
      } else if (speed > 4) {
        updatePlayerFoam({
          mediumBubbles: currentFoam.mediumBubbles + 2,
          expansionRate: Math.min(currentFoam.expansionRate + speed * 0.015, 1),
        });
        setFoamOpacity((prev) => ({
          ...prev,
          layer2: Math.min(prev.layer2 + 0.015, 1),
        }));
      } else {
        updatePlayerFoam({
          largeBubbles: currentFoam.largeBubbles + 1,
          expansionRate: Math.min(currentFoam.expansionRate + speed * 0.01, 1),
        });
        setFoamOpacity((prev) => ({
          ...prev,
          layer3: Math.min(prev.layer3 + 0.01, 1),
        }));
      }
    },
    [updatePlayerFoam]
  );

  const startPouring = useCallback(() => {
    if (phase !== 'ready') return;

    setPhase('pouring');
    setIsPouring(true);
    setBowlShake(true);
    setTimeout(() => setBowlShake(false), 300);

    const particles: WaterParticle[] = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        id: particleIdRef.current++,
        x: 130,
        y: -10,
        startX: 130,
        startY: -10,
        targetX: 50 + Math.random() * 40,
        targetY: 30 + Math.random() * 20,
        progress: 0,
      });
    }
    setWaterParticles(particles);
    setBiteStartTime(Date.now());
  }, [phase, setPhase, setIsPouring]);

  useEffect(() => {
    if (waterParticles.length === 0) return;

    const interval = setInterval(() => {
      setWaterParticles((prev) => {
        const updated = prev.map((p) => ({
          ...p,
          progress: p.progress + 0.05,
          x: p.startX + (p.targetX - p.startX) * p.progress,
          y:
            p.startY +
            (p.targetY - p.startY) * p.progress +
            Math.sin(p.progress * Math.PI) * -15,
        }));

        const landed = updated.filter((p) => p.progress >= 1);
        const remaining = updated.filter((p) => p.progress < 1);

        landed.forEach((p) => {
          setRipples((prevRipples) => [
            ...prevRipples,
            {
              id: rippleIdRef.current++,
              x: p.targetX,
              y: p.targetY,
              createdAt: Date.now(),
            },
          ]);
        });

        return remaining;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [waterParticles.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRipples((prev) =>
        prev.filter((r) => Date.now() - r.createdAt < 800)
      );
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase === 'pouring' && waterParticles.length === 0 && !isPouring) {
      setTimeout(() => {
        setIsPouring(false);
        setPhase('whisking');
      }, 500);
    }
  }, [phase, waterParticles.length, isPouring, setIsPouring, setPhase]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!playerArtCanvasRef.current) return;

      const rect = playerArtCanvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (phase === 'whisking' && isWhisking) {
        setWhiskPosition({ x, y });

        const dx = x - whiskPosition.x;
        const dy = y - whiskPosition.y;
        const speed = Math.sqrt(dx * dx + dy * dy);
        setWhiskSpeed(speed);
      }

      if (phase === 'drawing' && isDrawing) {
        setCurrentPath((prev) => [...prev, { x, y }]);
        drawOnCanvas(x, y);
      }
    },
    [phase, isWhisking, isDrawing, whiskPosition, setWhiskSpeed]
  );

  const drawOnCanvas = useCallback(
    (x: number, y: number) => {
      const canvas = playerArtCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentBrush === 'dot') {
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#3e2723';
        ctx.fill();
      } else if (currentBrush === 'circle') {
        if (currentPath.length > 0) {
          const start = currentPath[0];
          const radius = Math.sqrt(
            Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2)
          );
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        if (currentPath.length > 1) {
          const last = currentPath[currentPath.length - 1];
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    },
    [currentBrush, brushSize, currentPath]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (phase === 'whisking') {
        setIsWhisking(true);
        setBowlShake(true);
        setTimeout(() => setBowlShake(false), 300);
      }

      if (phase === 'drawing') {
        setIsDrawing(true);
        const rect = playerArtCanvasRef.current?.getBoundingClientRect();
        if (rect) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setCurrentPath([{ x, y }]);
          drawOnCanvas(x, y);
        }
      }
    },
    [phase, setIsWhisking, drawOnCanvas]
  );

  const handleMouseUp = useCallback(() => {
    if (phase === 'whisking') {
      setIsWhisking(false);
      setWhiskSpeed(0);
    }

    if (phase === 'drawing' && isDrawing && currentPath.length > 0) {
      const newPath: TeaArtPath = {
        points: [...currentPath],
        brushType: currentBrush,
        lineWidth: brushSize,
        color: '#3e2723',
      };
      addPlayerTeaArt(newPath);
      setCurrentPath([]);
      setIsDrawing(false);
    }
  }, [phase, setIsWhisking, setWhiskSpeed, isDrawing, currentPath, currentBrush, brushSize, addPlayerTeaArt]);

  const finishWhisking = useCallback(() => {
    if (phase !== 'whisking') return;
    setPhase('drawing');
    setIsWhisking(false);

    if (biteStartTime) {
      const biteTime = (Date.now() - biteStartTime) / 1000;
      setPlayerBiteTime(Math.min(biteTime, 30));
    }
  }, [phase, setPhase, setIsWhisking, biteStartTime, setPlayerBiteTime]);

  const finishDrawing = useCallback(() => {
    if (phase !== 'drawing') return;

    const canvas = playerArtCanvasRef.current;
    let thumbnail = '';
    if (canvas) {
      thumbnail = canvas.toDataURL('image/png');
    }

    setPhase('judging');
    calculateScores();

    setTimeout(() => {
      const state = useGameStore.getState();
      const winner =
        state.player.scores.total > state.ai.scores.total
          ? 'player'
          : state.player.scores.total < state.ai.scores.total
          ? 'ai'
          : 'draw';

      addHistoryRecord({
        playerScore: state.player.scores.total,
        aiScore: state.ai.scores.total,
        winner,
        thumbnail,
      });

      setShowJudgement(true);
    }, 500);
  }, [phase, setPhase, calculateScores, addHistoryRecord, setShowJudgement]);

  const generateAiPattern = useCallback(() => {
    const canvas = aiArtCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#3e2723';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const patternType = Math.floor(Math.random() * 3);

    if (patternType === 0) {
      ctx.beginPath();
      ctx.moveTo(10, 50);
      ctx.quadraticCurveTo(35, 20, 60, 40);
      ctx.quadraticCurveTo(85, 55, 110, 35);
      ctx.quadraticCurveTo(125, 25, 130, 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(10, 55);
      ctx.quadraticCurveTo(40, 45, 70, 55);
      ctx.quadraticCurveTo(95, 62, 130, 50);
      ctx.stroke();
    } else if (patternType === 1) {
      ctx.beginPath();
      ctx.moveTo(70, 10);
      ctx.lineTo(70, 60);
      ctx.stroke();

      for (let i = 0; i < 5; i++) {
        const startY = 15 + i * 10;
        ctx.beginPath();
        ctx.moveTo(70, startY);
        ctx.quadraticCurveTo(50, startY - 5, 40, startY + 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(70, startY);
        ctx.quadraticCurveTo(90, startY - 5, 100, startY + 5);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(20, 40);
      ctx.quadraticCurveTo(40, 25, 60, 35);
      ctx.quadraticCurveTo(75, 20, 90, 30);
      ctx.quadraticCurveTo(105, 15, 120, 25);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(30, 20, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(100, 15, 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(25, 20);
      ctx.lineTo(35, 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(95, 15);
      ctx.lineTo(105, 15);
      ctx.stroke();
    }

    const paths: TeaArtPath[] = [];
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      const points: PathPoint[] = [];
      for (let j = 0; j < 10; j++) {
        points.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
        });
      }
      paths.push({
        points,
        brushType: 'line',
        lineWidth: 2,
        color: '#3e2723',
      });
    }

    return paths;
  }, []);

  useEffect(() => {
    if (phase !== 'pouring') return;

    const runAiActions = async () => {
      setAiActionPhase('pouring');
      await new Promise((resolve) =>
        setTimeout(resolve, 1500 + Math.random() * 1000)
      );

      setAiActionPhase('whisking');
      const aiWhiskAnimation = setInterval(() => {
        const state = useGameStore.getState();
        const currentAiFoam = state.ai.foam;

        if (Math.random() > 0.7) {
          useGameStore.getState().updateAiFoam({
            fineBubbles: currentAiFoam.fineBubbles + 2,
            mediumBubbles: currentAiFoam.mediumBubbles + 1,
            expansionRate: Math.min(currentAiFoam.expansionRate + 0.01, 1),
          });
        } else {
          useGameStore.getState().updateAiFoam({
            mediumBubbles: currentAiFoam.mediumBubbles + 2,
            largeBubbles: currentAiFoam.largeBubbles + 1,
            expansionRate: Math.min(currentAiFoam.expansionRate + 0.008, 1),
          });
        }
      }, 100);

      await new Promise((resolve) =>
        setTimeout(resolve, 1500 + Math.random() * 1000)
      );
      clearInterval(aiWhiskAnimation);

      setAiActionPhase('drawing');
      const aiPaths = generateAiPattern();
      if (aiPaths) {
        aiPaths.forEach((path) => {
          useGameStore.getState().addAiTeaArt(path);
        });
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 1500 + Math.random() * 1000)
      );

      setAiActionPhase('done');
      useGameStore.getState().setAiBiteTime(20 + Math.random() * 10);
    };

    runAiActions();
  }, [phase === 'pouring', generateAiPattern]);

  const getPhaseText = () => {
    switch (phase) {
      case 'ready':
        return '准备阶段';
      case 'pouring':
        return '注水阶段';
      case 'whisking':
        return '点茶阶段 - 拖拽茶筅搅动';
      case 'drawing':
        return '茶百戏绘制阶段';
      case 'judging':
        return '裁定阶段';
      case 'finished':
        return '比赛结束';
      default:
        return '';
    }
  };

  const getAiStatusText = () => {
    switch (aiActionPhase) {
      case 'pouring':
        return 'AI 正在注水...';
      case 'whisking':
        return 'AI 正在点茶...';
      case 'drawing':
        return 'AI 正在绘制茶百戏...';
      case 'done':
        return 'AI 已完成';
      default:
        return 'AI 等待中';
    }
  };

  const getFoamScoreText = () => {
    const total = player.foam.fineBubbles + player.foam.mediumBubbles + player.foam.largeBubbles;
    if (total === 0) return 0;
    const fineRatio = player.foam.fineBubbles / total;
    const mediumRatio = player.foam.mediumBubbles / total;
    const largeRatio = player.foam.largeBubbles / total;
    return Math.round(fineRatio * 3 + mediumRatio * 2 + largeRatio * 1);
  };

  const expansionScale = 1 + player.foam.expansionRate * 0.3;
  const aiExpansionScale = 1 + ai.foam.expansionRate * 0.25;

  return (
    <div className="game-board">
      <div className="fps-counter">FPS: {fps}</div>

      <div className="phase-indicator">{getPhaseText()}</div>

      <div className="tea-area">
        <div className="tea-section">
          <div className="section-title">玩家</div>
          <motion.div
            className="bowl-container"
            animate={bowlShake ? { x: [-2, 2, -1, 1, 0] } : {}}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {isPouring && <div className="pouring-spout" />}

            <div className="tea-bowl" ref={playerBowlRef}>
              <div className="tea-liquid" />

              {foamOpacity.layer3 > 0 && (
                <div
                  className="tea-foam foam-layer-3"
                  style={{
                    opacity: foamOpacity.layer3,
                    transform: `scale(${expansionScale})`,
                  }}
                />
              )}
              {foamOpacity.layer2 > 0 && (
                <div
                  className="tea-foam foam-layer-2"
                  style={{
                    opacity: foamOpacity.layer2,
                    transform: `scale(${expansionScale * 0.95})`,
                    top: '17px',
                  }}
                />
              )}
              {foamOpacity.layer1 > 0 && (
                <div
                  className="tea-foam foam-layer-1"
                  style={{
                    opacity: foamOpacity.layer1,
                    transform: `scale(${expansionScale * 0.9})`,
                    top: '19px',
                  }}
                />
              )}

              <canvas
                ref={playerFoamCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="tea-canvas"
                style={{ pointerEvents: 'none' }}
              />

              <canvas
                ref={playerArtCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="tea-canvas"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />

              {waterParticles.map((particle) => (
                <div
                  key={particle.id}
                  className="water-particle"
                  style={{
                    left: particle.x,
                    top: particle.y,
                  }}
                />
              ))}

              {ripples.map((ripple) => (
                <div
                  key={ripple.id}
                  className="ripple"
                  style={{
                    left: ripple.x - 20,
                    top: ripple.y - 20,
                  }}
                />
              ))}

              {phase === 'whisking' && isWhisking && (
                <TeaWhisk
                  position={whiskPosition}
                  speed={whiskSpeed}
                  isWhisking={isWhisking}
                  canvasRef={playerFoamCanvasRef}
                  onFoamGenerated={handleFoamGenerated}
                />
              )}
            </div>
          </motion.div>

          <div className="score-display">
            <div className="score-item">
              <div className="score-label">汤花得分</div>
              <div className="score-value">{getFoamScoreText()}</div>
            </div>
            <div className="score-item">
              <div className="score-label">膨胀率</div>
              <div className="score-value">
                {Math.round(player.foam.expansionRate * 100)}%
              </div>
            </div>
            <div className="score-item">
              <div className="score-label">茶百戏</div>
              <div className="score-value">{player.teaArt.length}</div>
            </div>
          </div>
        </div>

        <div className="tea-section">
          <div className="section-title">AI 对手</div>
          <div className="bowl-container">
            <div className="tea-bowl">
              <div className="tea-liquid" />

              <div
                className="tea-foam foam-layer-3"
                style={{
                  opacity: 0.6,
                  transform: `scale(${aiExpansionScale})`,
                }}
              />
              <div
                className="tea-foam foam-layer-2"
                style={{
                  opacity: 0.7,
                  transform: `scale(${aiExpansionScale * 0.95})`,
                  top: '17px',
                }}
              />
              <div
                className="tea-foam foam-layer-1"
                style={{
                  opacity: 0.5,
                  transform: `scale(${aiExpansionScale * 0.9})`,
                  top: '19px',
                }}
              />

              <canvas
                ref={aiArtCanvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="tea-canvas"
                style={{ pointerEvents: 'none' }}
              />
            </div>
          </div>

          <div className="status-info">{getAiStatusText()}</div>

          <div className="score-display">
            <div className="score-item">
              <div className="score-label">汤花得分</div>
              <div className="score-value">
                {Math.round(
                  (ai.foam.fineBubbles /
                    Math.max(
                      1,
                      ai.foam.fineBubbles +
                        ai.foam.mediumBubbles +
                        ai.foam.largeBubbles
                    )) *
                    3 +
                    (ai.foam.mediumBubbles /
                      Math.max(
                        1,
                        ai.foam.fineBubbles +
                          ai.foam.mediumBubbles +
                          ai.foam.largeBubbles
                      )) *
                      2 +
                    (ai.foam.largeBubbles /
                      Math.max(
                        1,
                        ai.foam.fineBubbles +
                          ai.foam.mediumBubbles +
                          ai.foam.largeBubbles
                      )) *
                      1
                )}
              </div>
            </div>
            <div className="score-item">
              <div className="score-label">膨胀率</div>
              <div className="score-value">
                {Math.round(ai.foam.expansionRate * 100)}%
              </div>
            </div>
            <div className="score-item">
              <div className="score-label">茶百戏</div>
              <div className="score-value">{ai.teaArt.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        {phase === 'ready' && (
          <div className="control-row">
            <button className="btn" onClick={startPouring}>
              开始注水
            </button>
          </div>
        )}

        {phase === 'whisking' && (
          <>
            <div className="control-row">
              <span className="status-info">
                在茶汤上拖拽鼠标搅动，速度越快泡沫越细腻！
              </span>
            </div>
            <div className="control-row">
              <button className="btn btn-secondary" onClick={finishWhisking}>
                完成点茶
              </button>
            </div>
          </>
        )}

        {phase === 'drawing' && (
          <>
            <div className="control-row">
              <div className="brush-selector">
                <button
                  className={`brush-btn ${
                    currentBrush === 'line' ? 'active' : ''
                  }`}
                  onClick={() => setCurrentBrush('line')}
                >
                  线条
                </button>
                <button
                  className={`brush-btn ${
                    currentBrush === 'dot' ? 'active' : ''
                  }`}
                  onClick={() => setCurrentBrush('dot')}
                >
                  点
                </button>
                <button
                  className={`brush-btn ${
                    currentBrush === 'circle' ? 'active' : ''
                  }`}
                  onClick={() => setCurrentBrush('circle')}
                >
                  圈
                </button>
              </div>

              <div className="size-slider">
                <label>笔触:</label>
                <input
                  type="range"
                  min="2"
                  max="4"
                  step="1"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                />
                <span>{brushSize}px</span>
              </div>
            </div>
            <div className="control-row">
              <button className="btn" onClick={finishDrawing}>
                完成绘制，请求裁定
              </button>
            </div>
          </>
        )}

        {phase === 'judging' && !showJudgement && (
          <div className="control-row">
            <span className="status-info">裁定中...</span>
          </div>
        )}

        {phase === 'judging' && showJudgement && (
          <div className="control-row">
            <button
              className="btn btn-secondary"
              onClick={() => useGameStore.getState().resetGame()}
            >
              再来一局
            </button>
          </div>
        )}
      </div>

      <JudgementPanel />
    </div>
  );
};

export const HistoryPanel: React.FC = () => {
  const { history, winRate } = useGameStore();

  return (
    <div className="history-panel">
      <h3 className="history-title">历史记录</h3>

      <div className="win-rate-container">
        <div className="win-rate-label">
          胜率: {winRate}%
        </div>
        <div className="win-rate-bar">
          <div
            className="win-rate-fill"
            style={{
              width: `${winRate}%`,
              background: winRate > 60 ? '#2ecc71' : '#e67e22',
            }}
          />
        </div>
      </div>

      <div className="history-list">
        {history.length === 0 ? (
          <div className="status-info">暂无对战记录</div>
        ) : (
          history.map((record) => (
            <div
              key={record.id}
              className={`history-item ${record.winner}`}
            >
              <img
                src={record.thumbnail}
                alt="茶百戏"
                className="history-thumbnail"
              />
              <div className="history-info">
                <div className="history-scores">
                  <span className="player">{record.playerScore}</span>
                  <span>:</span>
                  <span className="ai">{record.aiScore}</span>
                </div>
                <div>
                  {record.winner === 'player'
                    ? '胜利'
                    : record.winner === 'ai'
                    ? '失败'
                    : '平局'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameBoard;

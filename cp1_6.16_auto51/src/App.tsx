import { useState, useEffect, useRef, useCallback } from 'react';
import { CoffeeCup } from './CoffeeCup';
import { MilkSteamer } from './MilkSteamer';
import { ScoringPanel } from './ScoringPanel';
import { updateParticles } from './MilkParticle';
import type { Particle } from './MilkParticle';

interface ScoreHistory {
  bestScore: number;
  recentScores: number[];
}

function ScoreChart({ scores }: { scores: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartWidth = 200;
  const chartHeight = 80;
  const padding = 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, chartWidth, chartHeight);

    if (scores.length === 0) {
      ctx.fillStyle = 'rgba(62, 39, 35, 0.3)';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无记录', chartWidth / 2, chartHeight / 2 + 4);
      return;
    }

    const plotWidth = chartWidth - padding * 2;
    const plotHeight = chartHeight - padding * 2;

    ctx.strokeStyle = 'rgba(62, 39, 35, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (plotHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(chartWidth - padding, y);
      ctx.stroke();
    }

    const maxScores = 5;
    const displayScores = scores.slice(-maxScores);
    const xStep = displayScores.length > 1 ? plotWidth / (displayScores.length - 1) : 0;

    ctx.beginPath();
    displayScores.forEach((score, i) => {
      const x = padding + i * xStep;
      const y = padding + plotHeight - (score / 100) * plotHeight;

      const progress = displayScores.length === 1 ? 0.5 : i / (displayScores.length - 1);
      const r = Math.round(244 - progress * 100);
      const g = Math.round(67 + progress * 103);
      const b = Math.round(54 - progress * 4);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      const gradient = ctx.createLinearGradient(0, padding, 0, padding + plotHeight);
      gradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.3)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3E2723';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(score.toString(), x, y - 8);
    });

    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const gradientStroke = ctx.createLinearGradient(padding, 0, chartWidth - padding, 0);
    displayScores.forEach((_, i) => {
      const progress = displayScores.length === 1 ? 0.5 : i / (displayScores.length - 1);
      const r = Math.round(244 - progress * 100);
      const g = Math.round(67 + progress * 103);
      const b = Math.round(54 - progress * 4);
      gradientStroke.addColorStop(progress, `rgb(${r}, ${g}, ${b})`);
    });

    ctx.strokeStyle = gradientStroke;
    ctx.stroke();
  }, [scores, chartWidth, chartHeight, padding]);

  return (
    <canvas
      ref={canvasRef}
      width={chartWidth}
      height={chartHeight}
      style={{ display: 'block' }}
    />
  );
}

function App() {
  const [cupSize, setCupSize] = useState(400);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dragTrajectory, setDragTrajectory] = useState<
    { x: number; y: number; angle: number }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory>({
    bestScore: 0,
    recentScores: []
  });
  const [cupPosition, setCupPosition] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastFrameTime = useRef(0);

  const cupRadius = cupSize / 2 - 10;
  const cupCenter = { x: cupSize / 2, y: cupSize / 2 };

  const globalCupCenter = {
    x: cupPosition.x + cupCenter.x,
    y: cupPosition.y + cupCenter.y
  };

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCupSize(Math.min(300, width - 40));
      } else {
        setCupSize(400);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateCupPosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCupPosition({ x: rect.left, y: rect.top });
      }
    };

    updateCupPosition();
    window.addEventListener('resize', updateCupPosition);
    window.addEventListener('scroll', updateCupPosition);
    return () => {
      window.removeEventListener('resize', updateCupPosition);
      window.removeEventListener('scroll', updateCupPosition);
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('latteArtScores');
      if (saved) {
        setScoreHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('latteArtScores', JSON.stringify(scoreHistory));
    } catch {
      // ignore
    }
  }, [scoreHistory]);

  const animate = useCallback(
    (timestamp: number) => {
      if (timestamp - lastFrameTime.current >= 1000 / 30) {
        lastFrameTime.current = timestamp;

        setParticles((prev) => updateParticles(prev, globalCupCenter, cupRadius));
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [globalCupCenter, cupRadius]
  );

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  const handleReset = useCallback(() => {
    setParticles([]);
    setDragTrajectory([]);
  }, []);

  const handleParticlesUpdate = useCallback(
    (updater: (prev: Particle[]) => Particle[]) => {
      setParticles(updater);
    },
    []
  );

  const handleDragTrajectory = useCallback(
    (point: { x: number; y: number; angle: number }) => {
      setDragTrajectory((prev) => {
        const newTrajectory = [...prev, point];
        if (newTrajectory.length > 200) {
          return newTrajectory.slice(-200);
        }
        return newTrajectory;
      });
    },
    []
  );

  const handleFinalScore = useCallback((score: number) => {
    setScoreHistory((prev) => {
      const newRecentScores = [...prev.recentScores, score].slice(-5);
      return {
        bestScore: Math.max(prev.bestScore, score),
        recentScores: newRecentScores
      };
    });
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F0E1',
        color: '#3E2723',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        <header
          style={{
            textAlign: 'center',
            marginBottom: '24px'
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? '24px' : '32px',
              color: '#3E2723',
              fontWeight: 700
            }}
          >
            ☕ 咖啡拉花练习
          </h1>
          <p
            style={{
              margin: '8px 0 0 0',
              color: '#6F4E37',
              fontSize: isMobile ? '13px' : '14px'
            }}
          >
            拖拽右下方的奶缸，模拟倒入奶泡，创造你的拉花艺术
          </p>
        </header>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
            backgroundColor: 'rgba(245, 240, 225, 0.7)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(62, 39, 35, 0.1)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              width: '100%',
              maxWidth: '500px',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6F4E37',
                  marginBottom: '4px'
                }}
              >
                历史最佳
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: scoreHistory.bestScore >= 80 ? '#4CAF50' : '#3E2723'
                }}
              >
                {scoreHistory.bestScore}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6F4E37',
                  marginBottom: '4px'
                }}
              >
                最近5次
              </div>
              <ScoreChart scores={scoreHistory.recentScores} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6F4E37',
                  marginBottom: '4px'
                }}
              >
                本次练习
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: particles.length > 0 ? '#6F4E37' : 'rgba(62, 39, 35, 0.3)'
                }}
              >
                {particles.filter((p) => p.isSettled).length}
                <span style={{ fontSize: '14px' }}> 个奶泡</span>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'center',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: isMobile ? '60px' : '40px',
            position: 'relative',
            paddingBottom: isMobile ? '80px' : '0'
          }}
        >
          <div ref={containerRef}>
            <CoffeeCup
              particles={particles}
              cupSize={cupSize}
              onReset={handleReset}
            />
          </div>

          {isMobile ? (
            <div
              style={{
                width: '100%',
                overflowX: 'auto',
                paddingBottom: '10px',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div style={{ minWidth: '280px' }}>
                <ScoringPanel
                  particles={particles}
                  dragTrajectory={dragTrajectory}
                  cupCenter={globalCupCenter}
                  cupRadius={cupRadius}
                  isDragging={isDragging}
                  onFinalScore={handleFinalScore}
                />
              </div>
            </div>
          ) : (
            <ScoringPanel
              particles={particles}
              dragTrajectory={dragTrajectory}
              cupCenter={globalCupCenter}
              cupRadius={cupRadius}
              isDragging={isDragging}
              onFinalScore={handleFinalScore}
            />
          )}
        </div>

        <MilkSteamer
          onParticlesUpdate={handleParticlesUpdate}
          cupCenter={cupCenter}
          cupRadius={cupRadius}
          cupPosition={cupPosition}
          onDragTrajectory={handleDragTrajectory}
          isDragging={isDragging}
          onDraggingChange={setIsDragging}
        />

        <footer
          style={{
            textAlign: 'center',
            marginTop: '40px',
            color: '#8D6E63',
            fontSize: '12px'
          }}
        >
          <p>💡 提示：按住奶缸向杯子方向拖动，越靠近杯子流速越快</p>
          <p>保持流速稳定、图案对称、中心对齐可以获得更高分数</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

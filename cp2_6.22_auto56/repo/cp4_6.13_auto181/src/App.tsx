import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './game/GameBoard';
import { generateLevel, COLORS, COLS, ROWS } from './generator/gridGenerator';
import { clearParticles } from './utils/particles';

interface ScoreAnimation {
  value: number;
  startTime: number;
}

const App: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [shotsFired, setShotsFired] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [levelData, setLevelData] = useState<number[][]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationSteps, setGenerationSteps] = useState<number[][][]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [scoreAnimation, setScoreAnimation] = useState<ScoreAnimation | null>(null);
  const [levelStartTime, setLevelStartTime] = useState<number>(0);
  const [totalScore, setTotalScore] = useState(0);
  const [levelsCompleted, setLevelsCompleted] = useState(0);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const generateNewLevel = useCallback(async () => {
    setIsGenerating(true);
    setIsPlaying(false);
    setGenerationProgress(0);
    setCurrentStep(0);
    clearParticles();

    const seed = Date.now();
    const result = generateLevel(seed, 20);
    
    setGenerationSteps(result.steps);
    setLevelData(result.grid);
    
    let step = 0;
    const totalSteps = result.steps.length;
    
    const animateStep = () => {
      if (step < totalSteps) {
        setCurrentStep(step);
        setGenerationProgress(Math.round((step / (totalSteps - 1)) * 100));
        step++;
        stepTimerRef.current = setTimeout(animateStep, 50);
      } else {
        setIsGenerating(false);
        setIsPlaying(true);
        setLevelStartTime(Date.now());
      }
    };
    
    animateStep();
  }, []);

  useEffect(() => {
    generateNewLevel();
    return () => {
      if (stepTimerRef.current) {
        clearTimeout(stepTimerRef.current);
      }
    };
  }, [generateNewLevel]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || generationSteps.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPreview = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, width, height);

      const grid = generationSteps[currentStep] || generationSteps[0];
      if (!grid) return;

      const bubbleRadius = Math.min(width / (COLS + 2), height / (ROWS + 2)) * 0.45;
      const bubbleDiameter = bubbleRadius * 2;
      const rowHeight = bubbleDiameter;
      const colWidth = bubbleDiameter * Math.sqrt(3) / 2;

      const offsetX = (width - COLS * colWidth - bubbleRadius) / 2;
      const offsetY = (height - ROWS * rowHeight * 0.75 - bubbleRadius) / 2;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const colorIndex = grid[row][col];
          if (colorIndex > 0) {
            const x = offsetX + col * colWidth + bubbleRadius;
            const y = offsetY + row * rowHeight * 0.75 + bubbleRadius;
            const offset = col % 2 === 1 ? rowHeight * 0.375 : 0;

            const gradient = ctx.createRadialGradient(
              x - bubbleRadius * 0.3,
              y - bubbleRadius * 0.3 + offset,
              0,
              x,
              y + offset,
              bubbleRadius
            );
            const colorHex = COLORS[colorIndex - 1];
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            gradient.addColorStop(0.3, colorHex);
            gradient.addColorStop(1, colorHex);

            ctx.beginPath();
            ctx.arc(x, y + offset, bubbleRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }
        }
      }

      animationRef.current = requestAnimationFrame(drawPreview);
    };

    drawPreview();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [generationSteps, currentStep]);

  const handleScoreUpdate = useCallback((points: number) => {
    setScore(prev => {
      const newScore = prev + points;
      setTotalScore(t => t + points);
      setScoreAnimation({ value: newScore, startTime: Date.now() });
      return newScore;
    });
  }, []);

  const handleShotFired = useCallback(() => {
    setShotsFired(prev => prev + 1);
  }, []);

  const handleLevelComplete = useCallback(async () => {
    const timeSpent = Date.now() - levelStartTime;
    
    try {
      await fetch('/api/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level_number: currentLevel,
          grid_matrix: levelData,
          score: score,
          time_spent: timeSpent,
        }),
      });
    } catch (error) {
      console.error('Failed to save level:', error);
    }

    setLevelsCompleted(prev => prev + 1);
    setCurrentLevel(prev => prev + 1);
    setScore(0);
    setShotsFired(0);
    
    setTimeout(() => {
      generateNewLevel();
    }, 1000);
  }, [currentLevel, levelData, score, levelStartTime, generateNewLevel]);

  const getScoreScale = () => {
    if (!scoreAnimation) return 1;
    const elapsed = Date.now() - scoreAnimation.startTime;
    if (elapsed > 200) return 1;
    const t = elapsed / 200;
    return 1 + 0.1 * Math.sin(t * Math.PI);
  };

  useEffect(() => {
    if (!scoreAnimation) return;
    const timer = setTimeout(() => setScoreAnimation(null), 250);
    return () => clearTimeout(timer);
  }, [scoreAnimation]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        color: 'white',
      }}
    >
      <div
        style={{
          height: 60,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 40px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>关卡</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#4ECDC4' }}>
            {currentLevel}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>已发射</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#FFE66D' }}>
            {shotsFired}
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>得分</span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#FF6B6B',
              transform: `scale(${getScoreScale()})`,
              transition: 'transform 0.1s ease-out',
              display: 'inline-block',
              minWidth: 80,
              textAlign: 'center',
            }}
          >
            {score}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>累计得分</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#A29BFE' }}>
            {totalScore}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>已通关</span>
          <span style={{ fontSize: 20, fontWeight: 600, color: '#FD79A8' }}>
            {levelsCompleted}
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          padding: 20,
          gap: 20,
          minHeight: 0,
        }}
      >
        <div
          style={{
            width: 300,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              border: '2px solid #ddd',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#1a1a2e',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                关卡生成预览
              </h3>
            </div>
            <div style={{ padding: 12 }}>
              <canvas
                ref={previewCanvasRef}
                width={276}
                height={166}
                style={{
                  display: 'block',
                  borderRadius: 8,
                  background: '#1a1a2e',
                }}
              />
            </div>
            {isGenerating && (
              <div style={{ padding: '0 12px 12px' }}>
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #4ECDC4, #A29BFE)',
                      width: `${generationProgress}%`,
                      transition: 'width 0.05s linear',
                    }}
                  />
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: '#aaa',
                    textAlign: 'center',
                  }}
                >
                  扩散迭代 {currentStep} / {generationSteps.length - 1}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              border: '2px solid #ddd',
              borderRadius: 12,
              padding: 16,
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
              游戏说明
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#ccc', lineHeight: 1.8 }}>
              <li>移动鼠标瞄准角度</li>
              <li>点击发射泡泡</li>
              <li>3个及以上同色泡泡相连即可消除</li>
              <li>消除后上方悬空泡泡会掉落</li>
              <li>消除所有泡泡即可通关</li>
            </ul>
          </div>

          <div
            style={{
              border: '2px solid #ddd',
              borderRadius: 12,
              padding: 16,
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
              可用颜色
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map((color, index) => (
                <div
                  key={index}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.6), ${color})`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={generateNewLevel}
            disabled={isGenerating}
            style={{
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: isGenerating ? '#555' : 'linear-gradient(135deg, #4ECDC4, #44A08D)',
              color: 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isGenerating ? 'none' : '0 4px 15px rgba(78, 205, 196, 0.4)',
              transform: isGenerating ? 'none' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              if (!isGenerating) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(78, 205, 196, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isGenerating ? 'none' : '0 4px 15px rgba(78, 205, 196, 0.4)';
            }}
          >
            {isGenerating ? '生成中...' : '重新生成关卡'}
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 600,
            position: 'relative',
          }}
        >
          <GameBoard
            levelData={levelData}
            onScoreUpdate={handleScoreUpdate}
            onShotFired={handleShotFired}
            onLevelComplete={handleLevelComplete}
            gameActive={isPlaying && !isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

export default App;

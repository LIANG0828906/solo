import React, { useRef, useEffect, useCallback } from 'react';
import {
  WordHistoryItem,
  Particle,
  formatTime,
  getComboMultiplierColor,
  createParticles,
  updateParticles,
  drawParticles
} from './utils';

interface ScorePanelProps {
  score: number;
  timeLeft: number;
  comboMultiplier: number;
  wordHistory: WordHistoryItem[];
  showComboEffect: boolean;
  onComboEffectComplete: () => void;
  floatingScores: { id: number; value: number; x: number; y: number }[];
}

const ScorePanel: React.FC<ScorePanelProps> = ({
  score,
  timeLeft,
  comboMultiplier,
  wordHistory,
  showComboEffect,
  onComboEffectComplete,
  floatingScores
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const comboEffectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particlesRef.current = updateParticles(particlesRef.current);
    drawParticles(ctx, particlesRef.current);
    
    if (particlesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, []);

  const triggerParticleEffect = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    particlesRef.current = createParticles(centerX, centerY, 20);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    if (showComboEffect) {
      triggerParticleEffect();
      
      comboEffectTimeoutRef.current = setTimeout(() => {
        onComboEffectComplete();
      }, 500);
    }
    
    return () => {
      if (comboEffectTimeoutRef.current) {
        clearTimeout(comboEffectTimeoutRef.current);
      }
    };
  }, [showComboEffect, triggerParticleEffect, onComboEffectComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const isLowTime = timeLeft <= 10;
  const multiplierColor = getComboMultiplierColor(comboMultiplier);

  return (
    <>
      {showComboEffect && <div className="combo-effect" />}
      
      <canvas
        ref={canvasRef}
        className="particles-canvas"
      />

      <div className="score-panel">
        <div className="score-display">
          <span className="score-label">分数</span>
          <span className="score-value">{score}</span>
        </div>

        <div className="score-display">
          <span className="score-label">倒计时</span>
          <span className={`timer-display ${isLowTime ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="score-display">
          <div className="combo-display">
            <span className="score-label">连击倍数</span>
            <span 
              className="combo-multiplier" 
              style={{ color: multiplierColor }}
            >
              {comboMultiplier}x
            </span>
          </div>
        </div>

        <div className="word-history">
          <span className="history-title">单词历史</span>
          <div className="history-list">
            {wordHistory.length === 0 ? (
              <span style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
                还没有正确的单词
              </span>
            ) : (
              wordHistory.map((item, index) => (
                <div key={`${item.word}-${index}`} className="history-item">
                  <span className="history-word">{item.word}</span>
                  <span className="history-score">+{item.score}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {floatingScores.map(fs => (
        <div
          key={fs.id}
          className="floating-score"
          style={{
            left: fs.x,
            top: fs.y
          }}
        >
          +{fs.value}
        </div>
      ))}
    </>
  );
};

export default React.memo(ScorePanel);

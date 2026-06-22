import React, { useCallback, useRef, useState } from 'react';
import { useGameState } from '../game/GameState';

const LoadingSpinner = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" style={{ animation: 'spin 0.8s infinite linear' }}>
    <circle cx="16" cy="16" r="12" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="50 26" strokeLinecap="round" />
  </svg>
);

const UploadArea = ({ onFileSelect }: { onFileSelect: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
      setIsLoading(true);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{
        width: '400px',
        height: '180px',
        border: isDragging ? '2px solid #3b82f6' : '2px dashed #94a3b8',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.6)',
        transition: 'all 0.1s ease-out',
        animation: 'fadeIn 0.5s ease-out',
        backdropFilter: 'blur(10px)'
      }}
    >
      <input ref={inputRef} type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" style={{ display: 'none' }} onChange={handleChange} />
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span style={{ color: '#94a3b8', marginTop: '12px', fontSize: '14px' }}>加载音频中...</span>
        </>
      ) : (
        <>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span style={{ color: '#e2e8f0', marginTop: '12px', fontSize: '16px', fontWeight: 600 }}>拖拽音频文件到此处</span>
          <span style={{ color: '#94a3b8', marginTop: '6px', fontSize: '13px' }}>支持 MP3 / WAV 格式</span>
        </>
      )}
    </div>
  );
};

const JudgmentFlash = () => {
  const lastJudgment = useGameState(s => s.lastJudgment);
  const lastJudgmentTime = useGameState(s => s.lastJudgmentTime);
  const [display, setDisplay] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef<number>(0);

  React.useEffect(() => {
    if (lastJudgment && lastJudgmentTime) {
      const colors: Record<string, string> = {
        perfect: '#22c55e',
        good: '#fbbf24',
        miss: '#ef4444'
      };
      const labels: Record<string, string> = {
        perfect: 'PERFECT',
        good: 'GOOD',
        miss: 'MISS'
      };
      setDisplay(labels[lastJudgment]);
      setOpacity(1);
      clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setOpacity(0);
      }, 300);
    }
  }, [lastJudgment, lastJudgmentTime]);

  if (!display) return null;

  const colors: Record<string, string> = {
    perfect: '#22c55e',
    good: '#fbbf24',
    miss: '#ef4444'
  };

  return (
    <div style={{
      position: 'absolute',
      top: '25%',
      left: '50%',
      transform: 'translateX(-50%)',
      fontSize: '36px',
      fontWeight: 800,
      color: colors[lastJudgment || 'miss'] || '#ffffff',
      textShadow: `0 0 20px ${colors[lastJudgment || 'miss'] || '#ffffff'}`,
      opacity,
      transition: 'opacity 0.3s ease-out',
      pointerEvents: 'none',
      letterSpacing: '4px'
    }}>
      {display}
    </div>
  );
};

const HUD = () => {
  const phase = useGameState(s => s.phase);
  const score = useGameState(s => s.score);
  const combo = useGameState(s => s.combo);
  const effectLevel = useGameState(s => s.effectLevel);
  const currentTime = useGameState(s => s.currentTime);
  const duration = useGameState(s => s.duration);

  if (phase === 'upload') return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: '#1e293bcc',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ color: '#e2e8f0', fontSize: '28px', fontWeight: 700, fontFamily: 'monospace' }}>
          {score.toString().padStart(7, '0')}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, letterSpacing: '1px' }}>SCORE</div>
      </div>

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: '#1e293bcc',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px'
      }}>
        <div style={{
          color: '#e2e8f0',
          fontSize: '48px',
          fontWeight: 800,
          textShadow: '0 0 10px #60a5fa',
          lineHeight: 1.1
        }}>
          {combo}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, letterSpacing: '1px' }}>COMBO</div>
      </div>

      {effectLevel > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293bcc',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ color: '#fbbf24', fontSize: '14px', fontWeight: 600 }}>⚡</span>
          <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>
            FX LEVEL {effectLevel}
          </span>
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        maxWidth: '600px',
        height: '4px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
          borderRadius: '2px',
          transition: 'width 0.2s ease-out'
        }} />
      </div>

      <JudgmentFlash />
    </>
  );
};

const StatsPanel = () => {
  const phase = useGameState(s => s.phase);
  const score = useGameState(s => s.score);
  const maxCombo = useGameState(s => s.maxCombo);
  const perfectCount = useGameState(s => s.perfectCount);
  const goodCount = useGameState(s => s.goodCount);
  const missCount = useGameState(s => s.missCount);
  const resetGame = useGameState(s => s.resetGame);

  if (phase !== 'ended') return null;

  const total = perfectCount + goodCount + missCount;
  const accuracy = total > 0 ? ((perfectCount + goodCount) / total * 100).toFixed(1) : '0.0';
  const perfectPct = total > 0 ? (perfectCount / total * 100).toFixed(1) : '0.0';
  const goodPct = total > 0 ? (goodCount / total * 100).toFixed(1) : '0.0';
  const missPct = total > 0 ? (missCount / total * 100).toFixed(1) : '0.0';

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: '#00000088',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        width: '400px',
        height: '280px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>演奏结束</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '15px' }}>
            <span>最终得分</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{score}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '15px' }}>
            <span>最高连击</span>
            <span style={{ fontWeight: 700 }}>{maxCombo}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: '15px' }}>
            <span>准确率</span>
            <span style={{ fontWeight: 700 }}>{accuracy}%</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', justifyContent: 'center', marginTop: '4px' }}>
            <span style={{ color: '#22c55e' }}>Perfect {perfectPct}%</span>
            <span style={{ color: '#fbbf24' }}>Good {goodPct}%</span>
            <span style={{ color: '#ef4444' }}>Miss {missPct}%</span>
          </div>
        </div>
        <button
          onClick={resetGame}
          style={{
            width: '120px',
            height: '40px',
            background: '#3b82f6',
            color: '#ffffff',
            fontSize: '16px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.1s ease-out'
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#2563eb'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = '#3b82f6'; (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          onMouseDown={e => { (e.target as HTMLElement).style.transform = 'scale(0.95)'; }}
          onMouseUp={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
        >
          重玩
        </button>
      </div>
    </div>
  );
};

export { UploadArea, HUD, StatsPanel };

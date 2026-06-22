import React from 'react';
import { ScorePanel } from './ScorePanel';
import { TaskPanel } from './TaskPanel';
import { GameCanvas } from './GameCanvas';
import { useGameStore } from './store';
import { DEBRIS_NAMES, DEBRIS_COLORS, DebrisType } from './types';

const rootStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  background: 'radial-gradient(ellipse at center, #0B0D17 0%, #000000 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  gap: 20,
  boxSizing: 'border-box',
  fontFamily: '"Segoe UI", sans-serif',
  overflow: 'hidden',
};

const buttonStyle: React.CSSProperties = {
  padding: '12px 32px',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: '"Segoe UI", sans-serif',
  letterSpacing: 0.5,
  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  fontFamily: '"Segoe UI", sans-serif',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(15, 20, 51, 0.95)',
  borderRadius: 16,
  padding: 48,
  textAlign: 'center',
  color: '#FFFFFF',
  maxWidth: 480,
  boxShadow: '0 0 80px rgba(59, 130, 246, 0.25)',
  border: '1px solid rgba(96, 165, 250, 0.2)',
};

export const App: React.FC = () => {
  const isGameStarted = useGameStore(s => s.isGameStarted);
  const isGameOver = useGameStore(s => s.isGameOver);
  const finalStats = useGameStore(s => s.finalStats);
  const startGame = useGameStore(s => s.startGame);
  const restartGame = useGameStore(s => s.restartGame);

  if (!isGameStarted) {
    return (
      <div style={rootStyle}>
        <div style={overlayStyle}>
          <div style={cardStyle}>
            <div style={{
              fontSize: 14,
              color: '#60A5FA',
              letterSpacing: 3,
              marginBottom: 8,
            }}>
              SPACE DEBRIS CLEANER
            </div>
            <h1 style={{
              fontSize: 36,
              margin: '0 0 16px 0',
              background: 'linear-gradient(90deg, #93C5FD, #E0E7FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              太空垃圾清理站
            </h1>
            <p style={{
              color: '#94A3B8',
              fontSize: 14,
              lineHeight: 1.8,
              marginBottom: 28,
            }}>
              操控回收飞船，使用牵引光束捕获轨道碎片。<br />
              按材料分类回收，完成任务解锁新轨道区域。<br />
              <span style={{ color: '#60A5FA' }}>移动鼠标控制飞船方向</span>
            </p>
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              marginBottom: 28,
            }}>
              {(['metal', 'plastic', 'electronic'] as DebrisType[]).map(t => (
                <div key={t} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#CBD5E1',
                  fontSize: 13,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: DEBRIS_COLORS[t],
                  }} />
                  {DEBRIS_NAMES[t]}
                </div>
              ))}
            </div>
            <button
              style={buttonStyle}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #2563EB, #60A5FA)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #1E3A8A, #3B82F6)';
              }}
              onClick={startGame}
            >
              开始任务
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isGameOver && finalStats) {
    return (
      <div style={rootStyle}>
        <div style={overlayStyle}>
          <div style={cardStyle}>
            <div style={{
              fontSize: 14,
              color: '#4ADE80',
              letterSpacing: 3,
              marginBottom: 8,
            }}>
              MISSION COMPLETE
            </div>
            <h1 style={{
              fontSize: 32,
              margin: '0 0 24px 0',
              color: '#FFFFFF',
            }}>
              任务结束
            </h1>
            <div style={{
              fontSize: 48,
              fontWeight: 700,
              background: 'linear-gradient(90deg, #FBBF24, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: 28,
            }}>
              {finalStats.totalScore}
            </div>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 10,
              padding: 16,
              marginBottom: 28,
            }}>
              <div style={{
                fontSize: 12,
                color: '#94A3B8',
                marginBottom: 12,
                letterSpacing: 1,
              }}>
                碎片回收统计
              </div>
              {(['metal', 'plastic', 'electronic'] as DebrisType[]).map(t => (
                <div key={t} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0',
                  fontSize: 14,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      backgroundColor: DEBRIS_COLORS[t],
                    }} />
                    <span style={{ color: '#CBD5E1' }}>{DEBRIS_NAMES[t]}</span>
                  </span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>
                    {finalStats.totalDebris[t]} 个
                  </span>
                </div>
              ))}
            </div>
            <button
              style={buttonStyle}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #2563EB, #60A5FA)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.background =
                  'linear-gradient(135deg, #1E3A8A, #3B82F6)';
              }}
              onClick={restartGame}
            >
              再次挑战
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <ScorePanel />
      <GameCanvas />
      <TaskPanel />
    </div>
  );
};

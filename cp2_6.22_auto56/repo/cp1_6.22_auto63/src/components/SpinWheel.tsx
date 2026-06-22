import React from 'react';
import type { Participant } from './App';
import './SpinWheel.css';

type SpinningPhase = 'idle' | 'spinning' | 'result';

interface Props {
  participants: Participant[];
  phase: SpinningPhase;
  currentDisplay: string;
  winner: Participant | null;
  onDrawWinner: () => void;
}

const SpinWheel: React.FC<Props> = ({
  participants,
  phase,
  currentDisplay,
  winner,
  onDrawWinner,
}) => {
  const canDraw = phase === 'idle' && participants.length > 0;

  return (
    <div className="spin-wheel-container">
      <div className={`wheel-outer ${phase === 'spinning' ? 'spinning' : ''}`}>
        <div className="led-ring">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="led-dot"
              style={{
                transform: `rotate(${i * 15}deg) translateY(-135px)`,
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
        <div className={`wheel-inner ${phase === 'spinning' ? 'glow-active' : ''}`}>
          <div className="wheel-content">
            {phase === 'idle' && !winner && (
              <div className="wheel-idle">
                <div className="wheel-icon">🎰</div>
                <div className="wheel-hint">
                  {participants.length > 0 ? '点击下方按钮开始' : '请先添加参与者'}
                </div>
              </div>
            )}
            {phase === 'spinning' && (
              <div className="wheel-rolling">
                <div className="rolling-name">{currentDisplay}</div>
              </div>
            )}
            {phase === 'result' && winner && (
              <div className="wheel-result pop-in">
                <div className="winner-avatar">🏆</div>
                <div className="winner-label">恭喜中奖</div>
                <div className="winner-name">{winner.name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        className={`draw-btn ${phase === 'spinning' ? 'disabled' : ''}`}
        onClick={onDrawWinner}
        disabled={!canDraw}
      >
        {phase === 'spinning' ? '抽奖中...' : '🎯 开始抽奖'}
      </button>
    </div>
  );
};

export default SpinWheel;

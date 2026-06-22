import { useEffect, useState } from 'react';
import type { LotteryResult } from '@/types';

interface LotteryBoxProps {
  prizes: { icon: string; name: string }[];
  drawing: boolean;
  winner: LotteryResult | null;
}

export default function LotteryBox({ prizes, drawing, winner }: LotteryBoxProps) {
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    if (winner && drawing === false) {
      setShowWinner(true);
      const timer = setTimeout(() => setShowWinner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [winner, drawing]);

  const displayPrizes = prizes.length > 0 ? prizes : [{ icon: '🎁', name: '奖品' }];

  return (
    <div className="lottery-box">
      <div className="box-content">
        {displayPrizes.slice(0, 6).map((prize, idx) => (
          <div
            key={idx}
            className="box-item"
            style={{
              left: `${20 + (idx % 3) * 30}%`,
              top: `${20 + Math.floor(idx / 3) * 40}%`,
              animationDelay: `${idx * 0.2}s`,
              animationPlayState: drawing ? 'running' : 'paused',
            }}
          >
            {prize.icon}
          </div>
        ))}
      </div>
      {showWinner && winner && (
        <div className="winner-card">
          <div className="winner-icon">{winner.prizeIcon}</div>
          <div className="winner-name">{winner.participantName}</div>
          <div className="winner-prize">{winner.prizeName}</div>
        </div>
      )}
    </div>
  );
}

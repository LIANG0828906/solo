import { useEffect, useState } from 'react';

interface CelebrationProps {
  show: boolean;
  milestone: number;
  habitName: string;
  onClose: () => void;
}

function Celebration({ show, milestone, habitName, onClose }: CelebrationProps) {
  const [particles, setParticles] = useState<{ id: number; left: number; delay: number; duration: number; color: string; size: number }[]>([]);

  useEffect(() => {
    if (show) {
      const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da', '#6c5ce7', '#00b894'];
      const newParticles = Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="celebration-overlay">
      <div className="celebration-badge badge-pop">
        <div className="badge-icon">🏆</div>
        <div className="badge-title">里程碑达成！</div>
        <div className="badge-habit">{habitName}</div>
        <div className="badge-milestone">连续打卡 {milestone} 天</div>
      </div>
      <div className="confetti-container">
        {particles.map(p => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              backgroundColor: p.color,
              width: p.size,
              height: p.size * 0.6,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default Celebration;

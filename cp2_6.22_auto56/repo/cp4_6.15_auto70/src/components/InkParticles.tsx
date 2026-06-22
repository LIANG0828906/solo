import { useMemo } from 'react';
import './InkParticles.css';

export default function InkParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 4 + Math.random() * 5,
        size: 4 + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.4
      })),
    []
  );

  return (
    <div className="ink-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ink-particle"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity
          }}
        />
      ))}
    </div>
  );
}

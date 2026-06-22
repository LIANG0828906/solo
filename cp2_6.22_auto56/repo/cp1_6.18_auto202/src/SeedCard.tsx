import type { Seed } from './types/seed';
import './styles/SeedCard.css';

interface SeedCardProps {
  seed: Seed;
  onClick: () => void;
}

export default function SeedCard({ seed, onClick }: SeedCardProps) {
  const budStyle = {
    '--bud-color-start': seed.seedColor,
    '--bud-color-end': seed.seedColorEnd,
  } as React.CSSProperties;

  return (
    <div
      className="seed-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="seed-bud-wrapper">
        <div className="seed-bud" style={budStyle} />
        <div className="seed-bud-shadow" />
      </div>
      <div className="seed-name">{seed.name}</div>
      <div className="seed-author">— {seed.author}</div>
    </div>
  );
}

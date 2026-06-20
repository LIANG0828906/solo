import { useState } from 'react';
import { Star } from 'lucide-react';
import type { StarScore } from '@/types';

interface Props {
  value: StarScore;
  onChange: (v: StarScore) => void;
  size?: number;
  label?: string;
}

export default function StarRating({ value, onChange, size = 22, label }: Props) {
  const [hover, setHover] = useState<number>(0);
  const [bouncing, setBouncing] = useState<number | null>(null);

  const handleClick = (n: StarScore) => {
    setBouncing(n);
    onChange(n);
    setTimeout(() => setBouncing(null), 400);
  };

  return (
    <div>
      {label && <div className="tea-label mb-1">{label}</div>}
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || value) >= n;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => handleClick(n as StarScore)}
              className={`p-0.5 ${bouncing === n ? 'star-bounce' : ''}`}
              style={{ transition: 'transform 100ms ease-out' }}
            >
              <Star
                size={size}
                fill={active ? 'var(--color-tea)' : 'none'}
                color={active ? 'var(--color-tea)' : 'var(--color-border)'}
                strokeWidth={2}
              />
            </button>
          );
        })}
        <span className="ml-2 text-sm" style={{ color: 'var(--color-text-light)' }}>
          {value}/5
        </span>
      </div>
    </div>
  );
}

import { useState } from 'react';
import './BrailleGrid.css';

interface BrailleGridProps {
  dots: boolean[];
  onDotClick: (index: number) => void;
  shake?: boolean;
}

export default function BrailleGrid({ dots, onDotClick, shake = false }: BrailleGridProps) {
  const [pressingIndex, setPressingIndex] = useState<number | null>(null);

  const handleClick = (index: number) => {
    setPressingIndex(index);
    onDotClick(index);
    setTimeout(() => setPressingIndex(null), 150);
  };

  const dotPositions = [0, 3, 1, 4, 2, 5];

  return (
    <div className={`braille-grid${shake ? ' shake' : ''}`}>
      {dotPositions.map((dotIndex) => {
        const isRaised = dots[dotIndex];
        const isPressing = pressingIndex === dotIndex;

        return (
          <div
            key={dotIndex}
            className={`braille-dot ${isRaised ? 'raised' : 'depressed'} ${isPressing ? 'pressing' : ''}`}
            onClick={() => handleClick(dotIndex)}
          />
        );
      })}
    </div>
  );
}

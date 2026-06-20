import React, { useMemo } from 'react';

interface Star {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  minOpacity: number;
  maxOpacity: number;
}

export const StarBackground: React.FC = () => {
  const stars = useMemo((): Star[] => {
    const starCount = 150;
    const generated: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      generated.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2,
        duration: 2 + Math.random() * 4,
        delay: Math.random() * 5,
        minOpacity: 0.2 + Math.random() * 0.3,
        maxOpacity: 0.6 + Math.random() * 0.4
      });
    }
    
    return generated;
  }, []);

  return (
    <div className="star-background">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
            '--min-opacity': star.minOpacity,
            '--max-opacity': star.maxOpacity
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};

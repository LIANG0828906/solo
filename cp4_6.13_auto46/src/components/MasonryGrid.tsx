import { useEffect, useRef, useState } from 'react';
import PhotoCard from './PhotoCard';
import type { Photo } from '@/types';

interface Props {
  photos: Photo[];
  onDelete?: (id: string) => void;
}

export default function MasonryGrid({ photos, onDelete }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth;
      if (w < 768) setColumns(2);
      else if (w < 1200) setColumns(3);
      else setColumns(4);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const columnBuckets: Photo[][] = Array.from({ length: columns }, () => []);
  photos.forEach((p, i) => columnBuckets[i % columns].push(p));

  return (
    <div
      ref={ref}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 16,
      }}
    >
      {columnBuckets.map((col, ci) => (
        <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {col.map((p) => (
            <PhotoCard
              key={p.id}
              photo={p}
              index={photos.indexOf(p)}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

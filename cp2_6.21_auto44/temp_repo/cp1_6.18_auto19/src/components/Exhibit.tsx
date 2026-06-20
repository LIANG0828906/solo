import { useState } from 'react';
import type { Exhibit as ExhibitType } from '@/types';

interface ExhibitProps {
  exhibit: ExhibitType;
  isAnswered: boolean;
  onExhibitClick: (exhibitId: string) => void;
}

export default function Exhibit({ exhibit, isAnswered, onExhibitClick }: ExhibitProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-parchment rounded-2xl cursor-pointer relative"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onExhibitClick(exhibit.id)}
    >
      <div className="flex flex-col items-center pt-8 pb-4 px-4 relative">
        {isAnswered && (
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-gold text-2xl animate-spin-slow z-10">
            ★
          </span>
        )}

        <div
          className="overflow-hidden transition-transform duration-300 w-24 h-24 flex items-center justify-center"
          style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)', marginBottom: '20px' }}
          dangerouslySetInnerHTML={{ __html: exhibit.svgIcon }}
        />

        <div
          className="w-full rounded-xl px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <p className="text-center text-sm font-serif text-wood truncate">
            {exhibit.name}
          </p>
        </div>
      </div>

      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bg-white rounded-lg px-3 py-2 z-20 whitespace-nowrap"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)', top: '8px' }}
        >
          <p className="text-sm font-serif text-wood">{exhibit.name}</p>
          <p className="text-xs text-muted">{exhibit.era}</p>
        </div>
      )}
    </div>
  );
}

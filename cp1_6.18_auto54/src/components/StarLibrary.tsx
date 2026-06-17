import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useStarStore } from '@/modules/DataManager';
import StarCard from './StarCard';
import type { StarData } from '@/types';

interface StarLibraryProps {
  onDragStart: (e: React.DragEvent, star: StarData) => void;
}

const StarLibrary: React.FC<StarLibraryProps> = ({ onDragStart }) => {
  const { libraryStars, updateStarBrightness } = useStarStore();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  return (
    <>
      <div className="panel-toggle mobile-only" onClick={() => setIsMobileExpanded(!isMobileExpanded)}>
        <Sparkles size={16} />
        <span>星库</span>
        {isMobileExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </div>
      <div className={`star-library ${isMobileExpanded ? 'mobile-expanded' : ''}`}>
        <div className="star-library__header">
          <Sparkles size={18} />
          <h2 className="star-library__title">星库</h2>
        </div>
        <div className="star-library__grid">
          {libraryStars.map((star) => (
            <StarCard
              key={star.id}
              star={star}
              onDragStart={onDragStart}
              onBrightnessChange={updateStarBrightness}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default StarLibrary;

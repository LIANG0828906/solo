import React, { useEffect, useState } from 'react';
import type { Rubbing } from '../types';

interface GalleryProps {
  rubbings: Rubbing[];
  onSelect: (rubbing: Rubbing) => void;
}

const Gallery: React.FC<GalleryProps> = ({ rubbings, onSelect }) => {
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    rubbings.forEach((rubbing, index) => {
      setTimeout(() => {
        setVisibleCards((prev) => new Set(prev).add(rubbing.id));
      }, index * 100);
    });
  }, [rubbings]);

  const handleSelect = (rubbing: Rubbing) => {
    setSelectedId(rubbing.id);
    setTimeout(() => {
      onSelect(rubbing);
    }, 400);
  };

  return (
    <div className="gallery-grid page-enter">
      {rubbings.map((rubbing) => (
        <div
          key={rubbing.id}
          className={`rubbing-card ${visibleCards.has(rubbing.id) ? 'visible' : ''} ${
            selectedId === rubbing.id ? 'selected' : ''
          }`}
          onClick={() => handleSelect(rubbing)}
        >
          <div className="rubbing-thumbnail">
            <span className="rubbing-char">{rubbing.characters[0]?.char || '書'}</span>
          </div>
          <div className="rubbing-info">
            <div className="rubbing-name">{rubbing.name}</div>
            <div className="rubbing-dynasty">{rubbing.dynasty} · {rubbing.author}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Gallery;

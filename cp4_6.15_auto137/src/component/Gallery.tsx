import React, { useEffect, useState, useRef } from 'react';
import type { Rubbing } from '../types';

interface GalleryProps {
  rubbings: Rubbing[];
  onSelect: (rubbing: Rubbing) => void;
}

const Gallery: React.FC<GalleryProps> = ({ rubbings, onSelect }) => {
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inkRings, setInkRings] = useState<Map<string, number>>(new Map());
  const timersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    rubbings.forEach((rubbing, index) => {
      setTimeout(() => {
        setVisibleCards((prev) => new Set(prev).add(rubbing.id));
      }, index * 120);
    });
  }, [rubbings]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleSelect = (rubbing: Rubbing) => {
    if (selectedId) return;
    setSelectedId(rubbing.id);
    setInkRings(new Map([[rubbing.id, Date.now()]]));

    setTimeout(() => {
      setInkRings((prev) => {
        const next = new Map(prev);
        next.set(rubbing.id, Date.now());
        return next;
      });
    }, 200);

    setTimeout(() => {
      setInkRings((prev) => {
        const next = new Map(prev);
        next.set(rubbing.id, Date.now());
        return next;
      });
    }, 400);

    setTimeout(() => {
      onSelect(rubbing);
    }, 600);
  };

  return (
    <div className="gallery-grid page-enter">
      {rubbings.map((rubbing) => {
        const isSelected = selectedId === rubbing.id;
        const inkTime = inkRings.get(rubbing.id);

        return (
          <div
            key={rubbing.id}
            className={`rubbing-card ${visibleCards.has(rubbing.id) ? 'visible' : ''} ${
              isSelected ? 'selected' : ''
            }`}
            onClick={() => handleSelect(rubbing)}
          >
            {inkTime !== undefined && (
              <>
                <div
                  className="ink-ring"
                  style={{
                    animationDuration: '1s',
                    animationDelay: `${(Date.now() - inkTime) / 1000}s`,
                  }}
                />
                <div
                  className="ink-ring ink-ring-2"
                  style={{
                    animationDuration: '1.2s',
                    animationDelay: `${(Date.now() - inkTime + 200) / 1000}s`,
                  }}
                />
                <div
                  className="ink-ring ink-ring-3"
                  style={{
                    animationDuration: '1.4s',
                    animationDelay: `${(Date.now() - inkTime + 400) / 1000}s`,
                  }}
                />
              </>
            )}
            <div className="rubbing-thumbnail">
              <span className="rubbing-char">{rubbing.characters[0]?.char || '書'}</span>
              <div className="rubbing-thumbnail-overlay" />
            </div>
            <div className="rubbing-info">
              <div className="rubbing-name">{rubbing.name}</div>
              <div className="rubbing-dynasty">{rubbing.dynasty} · {rubbing.author}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Gallery;

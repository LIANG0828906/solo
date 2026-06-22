import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Image } from 'lucide-react';
import { useConstellationStore } from '@/modules/DataManager';
import GalleryItem from './GalleryItem';

interface GalleryPanelProps {
  onLoadConstellation: (id: string) => void;
}

const GalleryPanel: React.FC<GalleryPanelProps> = ({ onLoadConstellation }) => {
  const { constellations, activeConstellationId, deleteConstellation } = useConstellationStore();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  return (
    <>
      <div className="panel-toggle panel-toggle--right mobile-only" onClick={() => setIsMobileExpanded(!isMobileExpanded)}>
        <Image size={16} />
        <span>画廊</span>
        {isMobileExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </div>
      <div className={`gallery-panel ${isMobileExpanded ? 'mobile-expanded' : ''}`}>
        <div className="gallery-panel__header">
          <Image size={18} />
          <h2 className="gallery-panel__title">画廊</h2>
        </div>
        <div className="gallery-panel__list">
          {constellations.length === 0 && (
            <p className="gallery-panel__empty">保存的星座将显示在此处</p>
          )}
          {constellations.map((c) => (
            <GalleryItem
              key={c.id}
              constellation={c}
              isActive={c.id === activeConstellationId}
              onClick={onLoadConstellation}
              onDelete={deleteConstellation}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default GalleryPanel;

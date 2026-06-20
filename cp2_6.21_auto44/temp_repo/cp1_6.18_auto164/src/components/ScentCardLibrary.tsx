import React, { memo } from 'react';
import { usePerfumeStore } from '../stores/perfumeStore';
import type { ScentCard as ScentCardType } from '../types';
import '../styles/ScentCardLibrary.css';

interface ScentCardProps {
  scent: ScentCardType;
  onDragStart: (scent: ScentCardType, e: React.DragEvent) => void;
}

const ScentCard = memo(function ScentCard({ scent, onDragStart }: ScentCardProps) {
  return (
    <div
      className="scent-card"
      draggable
      onDragStart={(e) => onDragStart(scent, e)}
      style={{ backgroundColor: scent.color }}
    >
      <div className="scent-card-emoji">{scent.emoji}</div>
      <div className="scent-card-name">{scent.name}</div>
      <div className="scent-card-tooltip">
        <div className="scent-tooltip-title">{scent.name}调</div>
        <div className="scent-tooltip-desc">{scent.description}</div>
      </div>
    </div>
  );
});

const ScentCardLibrary: React.FC = () => {
  const scentLibrary = usePerfumeStore((s) => s.scentLibrary);

  const handleDragStart = (scent: ScentCardType, e: React.DragEvent) => {
    e.dataTransfer.setData('application/scent', JSON.stringify(scent));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="scent-card-library">
      <div className="scent-library-label">气味卡片库 · 拖拽到调香台</div>
      <div className="scent-card-track">
        {scentLibrary.map((scent) => (
          <ScentCard key={scent.id} scent={scent} onDragStart={handleDragStart} />
        ))}
      </div>
    </div>
  );
};

export default ScentCardLibrary;

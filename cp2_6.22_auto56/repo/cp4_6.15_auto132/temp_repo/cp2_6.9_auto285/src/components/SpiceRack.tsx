import React, { useState, useCallback } from 'react';
import { Spice } from '@/types';

interface SpiceRackProps {
  onDragStart: (spice: Spice) => void;
  onDragEnd: () => void;
}

const SPICES: Spice[] = [
  { id: '1', name: '沉香', color: '#8B4513', property: '性温，行气止痛', aroma: '醇厚' },
  { id: '2', name: '檀香', color: '#DAA520', property: '性温，理气和胃', aroma: '清冽' },
  { id: '3', name: '龙脑', color: '#E0FFFF', property: '性寒，开窍醒神', aroma: '凉透' },
  { id: '4', name: '丁香', color: '#8B0000', property: '性温，温中降逆', aroma: '辛烈' },
  { id: '5', name: '乳香', color: '#F5DEB3', property: '性温，活血行气', aroma: '温润' },
  { id: '6', name: '麝香', color: '#4A4A4A', property: '性温，开窍通经', aroma: '浓烈' },
];

const SpiceRack: React.FC<SpiceRackProps> = ({ onDragStart, onDragEnd }) => {
  const [hoveredSpice, setHoveredSpice] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent | React.TouchEvent, spice: Spice) => {
    e.preventDefault();
    onDragStart(spice);
    
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', spice.id);
    }
  }, [onDragStart]);

  const handleDragEnd = useCallback(() => {
    onDragEnd();
  }, [onDragEnd]);

  return (
    <div className="spice-rack">
      <h3 style={{ 
        textAlign: 'center', 
        marginBottom: '10px', 
        color: '#f5f0e8',
        fontSize: '16px',
        fontWeight: 600
      }}>
        香药格
      </h3>
      <div className="spice-grid">
        {SPICES.map((spice) => (
          <div
            key={spice.id}
            className="spice-cell"
            onMouseEnter={() => setHoveredSpice(spice.id)}
            onMouseLeave={() => setHoveredSpice(null)}
          >
            <div
              className="spice-bottle"
              draggable
              onDragStart={(e) => handleDragStart(e, spice)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleDragStart(e, spice)}
              onTouchEnd={handleDragEnd}
              style={{ backgroundColor: spice.color }}
            />
            {hoveredSpice === spice.id && (
              <div className="spice-tooltip">
                <span className="spice-tag">{spice.name}</span>
                <span>{spice.property}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpiceRack;

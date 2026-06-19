import React from 'react';
import { motion } from 'framer-motion';
import { fossilData, FossilTemplate } from './types';

interface FossilLibraryProps {
  onDragStart: (fragmentId: string) => void;
  addedFragmentIds: string[];
}

export const FossilLibrary: React.FC<FossilLibraryProps> = ({
  onDragStart,
  addedFragmentIds
}) => {
  const handleDragStart = (
    e: { dataTransfer: DataTransfer },
    fragment: FossilTemplate
  ) => {
    e.dataTransfer.setData('fragmentId', fragment.id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(fragment.id);
  };

  const getGeometryIcon = (type: string) => {
    switch (type) {
      case 'box':
        return '▦';
      case 'cylinder':
        return '⬭';
      case 'sphere':
        return '●';
      case 'cone':
        return '▲';
      default:
        return '■';
    }
  };

  return (
    <motion.div
      className="fossil-library"
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 25 }}
    >
      <div className="library-header">
        <h2>化石库</h2>
        <span className="fragment-count">
          {fossilData.length - addedFragmentIds.length} / {fossilData.length}
        </span>
      </div>
      <div className="library-scroll">
        <div className="fossil-grid">
          {fossilData.map((fragment, index) => {
            const isAdded = addedFragmentIds.includes(fragment.id);
            return (
              <motion.div
                key={fragment.id}
                className={`fossil-card ${isAdded ? 'added' : ''}`}
                draggable={!isAdded}
                onDragStart={(e) => handleDragStart(e, fragment)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={!isAdded ? { scale: 1.05 } : {}}
                whileTap={!isAdded ? { scale: 0.98 } : {}}
              >
                <div className="fossil-icon">
                  {getGeometryIcon(fragment.geometryType)}
                </div>
                <div className="fossil-info">
                  <span className="fossil-name">{fragment.name}</span>
                  <span className="fossil-dims">
                    {fragment.dimensions.x}×{fragment.dimensions.y}×
                    {fragment.dimensions.z}
                  </span>
                </div>
                {isAdded && <div className="added-badge">已添加</div>}
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="library-hint">
        拖拽化石碎片到场景中开始拼装
      </div>
    </motion.div>
  );
};

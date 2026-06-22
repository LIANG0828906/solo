import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '@/store/useStore';
import { getStarById, raDecToVector3 } from '@/data/starData';
import type { Star } from '@/types';

export function InfoCard() {
  const { camera, size } = useThree();
  const selectedStarId = useStore((state) => state.selectedStarId);
  const setSelectedStarId = useStore((state) => state.setSelectedStarId);
  const timeMonth = useStore((state) => state.timeMonth);
  
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const selectedStar: Star | undefined = selectedStarId 
    ? getStarById(selectedStarId) 
    : undefined;

  useEffect(() => {
    if (!selectedStarId || !selectedStar) return;

    const updatePosition = () => {
      const star = getStarById(selectedStarId);
      if (!star) return;

      const [x, y, z] = raDecToVector3(star.ra, star.dec, 100);
      const position = new THREE.Vector3(x, y, z);
      const rotationAngle = (timeMonth / 12) * Math.PI * 2;
      position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationAngle);
      
      const vector = position.clone().project(camera);
      const screenX = (vector.x * 0.5 + 0.5) * size.width;
      const screenY = (-vector.y * 0.5 + 0.5) * size.height;
      
      setScreenPos({ x: screenX, y: screenY });
    };

    updatePosition();
    
    const interval = setInterval(updatePosition, 16);
    return () => clearInterval(interval);
  }, [selectedStarId, selectedStar, camera, size, timeMonth]);

  if (!selectedStar) return null;

  const magnitudeStars = Array.from({ length: 6 }, (_, i) => i < Math.ceil(6 - selectedStar.magnitude));

  const cardWidth = 280;
  const cardHeight = 220;
  
  let posX = screenPos.x + 20;
  let posY = screenPos.y - cardHeight / 2;
  
  if (posX + cardWidth > size.width - 20) {
    posX = screenPos.x - cardWidth - 20;
  }
  if (posY < 20) {
    posY = 20;
  }
  if (posY + cardHeight > size.height - 20) {
    posY = size.height - cardHeight - 20;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        key={selectedStarId}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="info-card parchment-bg ink-border absolute z-50 rounded-lg p-5"
        style={{
          left: `${posX}px`,
          top: `${posY}px`,
          width: `${cardWidth}px`,
          minHeight: `${cardHeight}px`,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedStarId(null);
          }}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X size={18} className="text-[var(--color-ink-dark)]" />
        </button>

        <h3 className="font-seal text-2xl text-[var(--color-ink-dark)] mb-2 tracking-wider">
          {selectedStar.name}
        </h3>
        
        <div className="space-y-2 font-kai text-sm text-[var(--color-ink-dark)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-ink-light)]">星宿:</span>
            <span className="font-semibold">{selectedStar.constellation}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-ink-light)]">星等:</span>
            <div className="flex gap-0.5">
              {magnitudeStars.map((filled, i) => (
                <span
                  key={i}
                  className={`text-lg ${filled ? 'text-[var(--color-star-gold)]' : 'text-[var(--color-parchment-dark)]'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs">({selectedStar.magnitude})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-ink-light)]">分野:</span>
            <span className="seal-stamp text-lg py-0.5">{selectedStar.fenye}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-ink-light)]">西方星座:</span>
            <span className="text-[var(--color-cinnabar)] font-semibold">
              {selectedStar.westernConstellation}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-ink-light)]">类型:</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              selectedStar.isMain 
                ? 'bg-[var(--color-star-gold)]/20 text-[var(--color-cinnabar)]' 
                : 'bg-[var(--color-jade-green)]/20 text-[var(--color-jade-green)]'
            }`}>
              {selectedStar.isMain ? '主星' : '辅星'}
            </span>
          </div>
        </div>
        
        <div className="absolute bottom-2 right-3 text-xs text-[var(--color-ink-light)] font-song">
          RA: {selectedStar.ra.toFixed(1)}° | Dec: {selectedStar.dec.toFixed(1)}°
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

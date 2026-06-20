import React, { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PuppetCharacter } from '../types';
import CharacterRig from './CharacterRig';
import { playWoodSnap } from '../utils/audioUtils';

interface ShadowStageProps {
  characters: PuppetCharacter[];
  lampBrightness: number;
  isPlaying: boolean;
  onJointChange: (characterId: string, jointId: string, angle: number) => void;
  onPositionChange: (characterId: string, x: number, y: number) => void;
  onCharacterDrop: (characterId: string, x: number, y: number) => void;
  stageRef: React.RefObject<HTMLDivElement>;
}

const ShadowStage: React.FC<ShadowStageProps> = ({
  characters,
  lampBrightness,
  isPlaying,
  onJointChange,
  onPositionChange,
  onCharacterDrop,
  stageRef,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const snappedPartRef = useRef<string | null>(null);
  
  const curtainColor = useMemo(() => {
    const t = (lampBrightness - 0.3) / 1.5;
    const r = Math.round(255 * (1 - t) + 238 * t);
    const g = Math.round(224 * (1 - t) + 238 * t);
    const b = Math.round(178 * (1 - t) + 238 * t);
    return `rgb(${r}, ${g}, ${b})`;
  }, [lampBrightness]);
  
  const lanterns = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${10 + i * 11}%`,
      delay: i * 0.1,
    }));
  }, []);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const characterId = e.dataTransfer.getData('characterId');
    if (!characterId) return;
    
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    onCharacterDrop(characterId, x, y);
    playWoodSnap();
    snappedPartRef.current = characterId;
    setTimeout(() => {
      snappedPartRef.current = null;
    }, 300);
  };
  
  const handlePartDragEnd = (characterId: string, partId: string, x: number, y: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const svgX = x;
    const svgY = y;
    
    const character = characters.find(c => c.id === characterId);
    if (!character) return;
    
    const part = character.parts.find(p => p.id === partId);
    if (!part) return;
    
    const centerX = svgX;
    const centerY = svgY;
    
    onPositionChange(characterId, centerX, centerY);
    playWoodSnap();
    snappedPartRef.current = partId;
    setTimeout(() => {
      snappedPartRef.current = null;
    }, 300);
  };
  
  const onStageCharacters = characters.filter(c => c.isOnStage);
  
  return (
    <div 
      ref={stageRef}
      className="relative"
      style={{
        backgroundColor: '#3e2723',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)',
      }}
    >
      <div className="absolute top-2 left-0 right-0 flex justify-around z-10">
        {lanterns.map(lantern => (
          <motion.div
            key={lantern.id}
            className="lantern"
            style={{
              width: '30px',
              height: '45px',
              background: 'linear-gradient(to bottom, #ff9800, #f57c00)',
              borderRadius: '50% 50% 45% 45%',
              position: 'relative',
              animationDelay: `${lantern.delay}s`,
              boxShadow: '0 0 20px rgba(255, 152, 0, 0.6)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '8px',
                backgroundColor: '#5d4037',
                borderRadius: '2px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '4px',
                height: '15px',
                backgroundColor: 'rgba(255,255,255,0.6)',
                borderRadius: '2px',
              }}
            />
          </motion.div>
        ))}
      </div>
      
      <div
        className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
        style={{
          width: '120px',
          height: '60px',
          background: 'radial-gradient(ellipse at center, rgba(255, 204, 128, 0.4) 0%, transparent 70%)',
          filter: `brightness(${lampBrightness})`,
          pointerEvents: 'none',
        }}
      />
      
      <div
        className={`relative overflow-hidden ${isPlaying ? 'curtain-breath' : ''}`}
        style={{
          width: '800px',
          height: '500px',
          backgroundColor: curtainColor,
          marginTop: '40px',
          border: '15px solid #5d4037',
          borderRadius: '4px',
          boxShadow: `
            inset 0 0 100px rgba(0,0,0,${0.5 - (lampBrightness - 0.3) * 0.3}),
            0 10px 40px rgba(0,0,0,0.5)
          `,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div
          className="absolute inset-0 curtain-texture opacity-50"
          style={{ pointerEvents: 'none' }}
        />
        
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 20%, 
              rgba(255, 224, 178, ${0.3 * lampBrightness}) 0%, 
              rgba(215, 204, 200, 0.1) 50%, 
              transparent 80%)`,
            pointerEvents: 'none',
          }}
        />
        
        <svg
          ref={svgRef}
          width="800"
          height="500"
          className="absolute inset-0"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <filter id="shadowBlur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            </filter>
          </defs>
          
          <AnimatePresence>
            {onStageCharacters.map(character => (
              <CharacterRig
                key={character.id}
                character={character}
                onJointChange={onJointChange}
                onPositionChange={onPositionChange}
                onPartDragEnd={(partId, x, y) => handlePartDragEnd(character.id, partId, x, y)}
                isDragging={isPlaying}
                showJoints={!isPlaying}
                lampBrightness={lampBrightness}
              />
            ))}
          </AnimatePresence>
          
          {snappedPartRef.current && (
            <rect
              x="0"
              y="0"
              width="800"
              height="500"
              fill="#fff3e0"
              opacity="0.3"
              className="part-snap"
            />
          )}
        </svg>
      </div>
      
      <div
        className="flex justify-center mt-4 gap-4"
        style={{ fontSize: '24px', color: '#d7ccc8', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
      >
        <span>三</span>
        <span>打</span>
        <span>白</span>
        <span>骨</span>
        <span>精</span>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .relative > div:nth-child(3) {
            width: 680px !important;
            height: 425px !important;
          }
          .relative > div:nth-child(3) svg {
            width: 680px !important;
            height: 425px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ShadowStage;

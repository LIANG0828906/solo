import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { CharacterData } from '../types';
import { useGameStore } from '../store/gameStore';
import { getCharacterList, getCurrentLevel } from '../data/levels';

const CharacterGrid: React.FC = () => {
  const currentLevel = useGameStore(state => state.currentLevel);
  const gamePhase = useGameStore(state => state.gamePhase);
  const [hoveredChar, setHoveredChar] = useState<string | null>(null);
  const [hoveredPos, setHoveredPos] = useState({ x: 0, y: 0 });

  const levelData = useMemo(() => getCurrentLevel(currentLevel), [currentLevel]);
  const characters = useMemo(() => getCharacterList(levelData), [levelData]);

  const groupedCharacters = useMemo(() => {
    const groups: Record<string, CharacterData[]> = {};
    characters.forEach(char => {
      if (!groups[char.rhyme]) {
        groups[char.rhyme] = [];
      }
      groups[char.rhyme].push(char);
    });
    return groups;
  }, [characters]);

  const handleDragStart = (e: React.DragEvent, char: CharacterData) => {
    if (char.isDistractor || gamePhase !== 'typesetting') {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', char.char);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleMouseEnter = (e: React.MouseEvent, char: CharacterData) => {
    setHoveredChar(char.pinyin);
    setHoveredPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoveredPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredChar(null);
  };

  if (gamePhase !== 'typesetting') {
    return null;
  }

  return (
    <div className="character-grid-wrapper">
      <h3 className="grid-title">字格架</h3>
      <div 
        className="character-grid"
        onMouseMove={handleMouseMove}
      >
        {Object.entries(groupedCharacters).map(([rhyme, chars]) => (
          <div key={rhyme} className="rhyme-group">
            <div className="rhyme-label">{rhyme}</div>
            <div className="rhyme-chars">
              {chars.map((charData, idx) => (
                <motion.div
                  key={`${charData.char}-${idx}`}
                  className={`char-cell ${charData.isDistractor ? 'distractor' : ''}`}
                  draggable={!charData.isDistractor}
                  onDragStart={(e) => handleDragStart(e, charData)}
                  onMouseEnter={(e) => handleMouseEnter(e, charData)}
                  onMouseLeave={handleMouseLeave}
                  whileHover={{ scale: !charData.isDistractor ? 1.05 : 1 }}
                  transition={{ duration: 0.2, ease: 'ease' }}
                  title={charData.pinyin}
                >
                  <span className="char-text">{charData.char}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {hoveredChar && (
        <div 
          className="pinyin-tooltip"
          style={{ 
            left: hoveredPos.x + 10, 
            top: hoveredPos.y + 10,
            position: 'fixed'
          }}
        >
          {hoveredChar}
        </div>
      )}
      
      <style>{`
        .character-grid-wrapper {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          padding: 16px;
          box-sizing: border-box;
          background: linear-gradient(135deg, #c8a46e 0%, #b8956a 100%);
          border: 4px solid #5a3e1a;
          border-radius: 8px;
          box-shadow: inset 0 0 20px rgba(90, 62, 26, 0.3);
        }
        
        .grid-title {
          margin: 0 0 12px 0;
          color: #5a3e1a;
          font-size: 18px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 4px;
        }
        
        .character-grid {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          padding: 8px;
          background: rgba(90, 62, 26, 0.1);
          border-radius: 4px;
        }
        
        .character-grid::-webkit-scrollbar {
          width: 8px;
        }
        
        .character-grid::-webkit-scrollbar-track {
          background: #a08060;
          border-radius: 4px;
        }
        
        .character-grid::-webkit-scrollbar-thumb {
          background: #5a3e1a;
          border-radius: 4px;
        }
        
        .rhyme-group {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        
        .rhyme-label {
          min-width: 60px;
          padding: 4px 8px;
          background: #5a3e1a;
          color: #f5e6cc;
          font-size: 12px;
          border-radius: 4px;
          text-align: center;
          flex-shrink: 0;
        }
        
        .rhyme-chars {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .char-cell {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #a08060;
          border: 2px solid #5a3e1a;
          border-radius: 3px;
          cursor: grab;
          user-select: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .char-cell:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        .char-cell:active {
          cursor: grabbing;
        }
        
        .char-cell.distractor {
          background: #d3c3a0;
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .char-cell.distractor .char-text {
          color: #888;
        }
        
        .char-text {
          color: #b22222;
          font-size: 16px;
          font-weight: bold;
          font-family: 'KaiTi', 'STKaiti', serif;
          text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.2);
        }
        
        .pinyin-tooltip {
          position: fixed;
          padding: 4px 8px;
          background: #5a3e1a;
          color: #f5e6cc;
          font-size: 12px;
          border-radius: 4px;
          pointer-events: none;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        
        @media (max-width: 768px) {
          .character-grid-wrapper {
            padding: 8px;
          }
          
          .char-cell {
            width: 28px;
            height: 28px;
          }
          
          .char-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default React.memo(CharacterGrid);

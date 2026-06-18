import React, { memo, useCallback } from 'react';
import { useGameContext } from '@/context/GameContext';
import { Character } from '@/combat/Character';
import type { CharacterClass } from '@/combat/types';
import { motion, AnimatePresence } from 'framer-motion';
import { GiSwordman, GiWizardFace, GiNinjaHeroicStance } from 'react-icons/gi';
import { generateMap } from '@/domain/MapGenerator';
import { CellType } from '@/domain/types';

const CLASS_DATA: {
  id: CharacterClass;
  name: string;
  icon: React.ReactNode;
  stats: string[];
}[] = [
  {
    id: 'warrior',
    name: '战士',
    icon: <GiSwordman />,
    stats: ['生命: 100', '攻击: 15', '防御: 12'],
  },
  {
    id: 'mage',
    name: '法师',
    icon: <GiWizardFace />,
    stats: ['生命: 60', '攻击: 22', '防御: 5'],
  },
  {
    id: 'rogue',
    name: '盗贼',
    icon: <GiNinjaHeroicStance />,
    stats: ['生命: 80', '攻击: 18', '防御: 8'],
  },
];

const ClassSelectScreen = memo(function ClassSelectScreen() {
  const { phase, setPhase, setCharacter, setMapData, setPlayerPos, revealCell } = useGameContext();

  const handleSelect = useCallback(
    (cls: CharacterClass) => {
      const character = new Character(cls);
      setCharacter(character);

      const map = generateMap();
      setMapData(map);

      let entranceX = 0;
      let entranceY = 0;
      for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
          if (map.cells[y][x].type === CellType.ENTRANCE) {
            entranceX = x;
            entranceY = y;
          }
        }
      }

      setPlayerPos({ x: entranceX, y: entranceY });

      revealCell(entranceX, entranceY);
      const directions = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ];
      for (const [dx, dy] of directions) {
        const nx = entranceX + dx;
        const ny = entranceY + dy;
        if (nx >= 0 && nx < map.width && ny >= 0 && ny < map.height) {
          revealCell(nx, ny);
        }
      }

      setPhase('exploring');
    },
    [setPhase, setCharacter, setMapData, setPlayerPos, revealCell],
  );

  if (phase !== 'classSelect') return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#2C1810',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF3E0',
      }}
    >
      <h1
        style={{
          fontFamily: 'Cinzel',
          fontSize: 48,
          fontWeight: 900,
          color: '#FFD700',
          textShadow: '0 0 20px rgba(255,213,79,0.5)',
          margin: 0,
        }}
      >
        地下城探险
      </h1>
      <p
        style={{
          fontFamily: 'Crimson Text',
          fontSize: 20,
          color: '#FFF3E0',
          marginTop: 8,
          opacity: 0.8,
        }}
      >
        选择你的职业
      </p>
      <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>
        <AnimatePresence>
          {CLASS_DATA.map((cls, index) => (
            <motion.div
              key={cls.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              whileHover={{ scale: 1.05, borderColor: '#FFD700', transition: { duration: 0.2 } }}
              onClick={() => handleSelect(cls.id)}
              style={{
                width: 200,
                padding: 24,
                background: '#3E2723',
                border: '2px solid #4E342E',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>{cls.icon}</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: 'Cinzel',
                  marginBottom: 8,
                }}
              >
                {cls.name}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: '#FFF3E0', opacity: 0.8 }}>
                {cls.stats.map((stat) => (
                  <div key={stat}>{stat}</div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default ClassSelectScreen;

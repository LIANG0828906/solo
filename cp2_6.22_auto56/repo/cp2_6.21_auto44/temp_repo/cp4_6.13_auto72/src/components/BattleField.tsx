import React, { useState, useEffect, useRef } from 'react';
import { Creature } from '../creatures';
import { useGameStore } from '../store';
import { BattleLogEntry } from '../combatEngine';
import CreatureCard from './CreatureCard';
import { getElementColor } from '../creatures';

interface BattleFieldProps {
  onCreatureClick: (creature: Creature) => void;
}

interface SkillEffect {
  id: number;
  type: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
}

const BattleField: React.FC<BattleFieldProps> = ({ onCreatureClick }) => {
  const { team, enemies, isBattling, battleResult, currentBattleLogIndex, setScreenShake } = useGameStore();
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [draggedCreature, setDraggedCreature] = useState<Creature | null>(null);
  const [effects, setEffects] = useState<SkillEffect[]>([]);
  const [displayedHp, setDisplayedHp] = useState<Record<string, number>>({});
  const animationRef = useRef<number>();
  const lastLogIndex = useRef<number>(-1);

  useEffect(() => {
    const initialHp: Record<string, number> = {};
    team.forEach(c => { if (c) initialHp[c.id] = c.currentHp; });
    enemies.forEach(c => { if (c) initialHp[c.id] = c.currentHp; });
    setDisplayedHp(initialHp);
  }, [team, enemies]);

  useEffect(() => {
    if (!isBattling || !battleResult) return;
    
    if (currentBattleLogIndex !== lastLogIndex.current) {
      lastLogIndex.current = currentBattleLogIndex;
      const log = battleResult.battleLog[currentBattleLogIndex];
      
      if (log && log.damage > 0) {
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 150);
      }
      
      if (log) {
        const effectId = Date.now() + Math.random();
        const newEffect: SkillEffect = {
          id: effectId,
          type: log.animationType,
          x: log.attackerIsEnemy ? 80 : 20,
          y: 50,
          targetX: log.targetIsEnemy ? 80 : 20,
          targetY: 50,
          progress: 0,
        };
        
        setEffects(prev => [...prev, newEffect]);
        
        const startTime = performance.now();
        const duration = 600;
        
        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          setEffects(prev => 
            prev.map(e => 
              e.id === effectId ? { ...e, progress } : e
            )
          );
          
          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setEffects(prev => prev.filter(e => e.id !== effectId));
          }
        };
        
        animationRef.current = requestAnimationFrame(animate);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentBattleLogIndex, isBattling, battleResult, setScreenShake]);

  useEffect(() => {
    if (!isBattling || !battleResult) return;
    
    const log = battleResult.battleLog[currentBattleLogIndex];
    if (!log) return;
    
    if (log.damage > 0 && log.targetIsEnemy === false) {
      const allyIndex = team.findIndex(c => c?.name === log.target);
      if (allyIndex !== -1 && team[allyIndex]) {
        const creature = team[allyIndex]!;
        const currentDisplayed = displayedHp[creature.id] ?? creature.currentHp;
        const newHp = Math.max(0, currentDisplayed - log.damage);
        setDisplayedHp(prev => ({ ...prev, [creature.id]: newHp }));
      }
    }
  }, [currentBattleLogIndex, isBattling, battleResult, team, displayedHp]);

  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setHoveredSlot(position);
  };

  const handleDragLeave = () => {
    setHoveredSlot(null);
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    setHoveredSlot(null);
    
    if (draggedCreature && !isBattling) {
      useGameStore.getState().placeCreature(draggedCreature, position);
      setDraggedCreature(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, creature: Creature) => {
    setDraggedCreature(creature);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCreature(null);
  };

  const renderSkillEffect = (effect: SkillEffect) => {
    const colors: Record<string, string> = {
      fire: '#ff6b35',
      ice: '#4fc3f7',
      thunder: '#ffd93d',
      dark: '#7c3aed',
      light: '#fbbf24',
      wind: '#34d399',
      earth: '#a16207',
      water: '#3b82f6',
      poison: '#22c55e',
    };
    
    const color = colors[effect.type] || '#fff';
    const x = effect.x + (effect.targetX - effect.x) * effect.progress;
    const y = effect.y + (effect.targetY - effect.y) * effect.progress;
    const scale = 1 + Math.sin(effect.progress * Math.PI) * 0.5;
    const opacity = 1 - effect.progress * 0.5;
    
    return (
      <div
        key={effect.id}
        className="absolute pointer-events-none"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          opacity,
        }}
      >
        <div
          className="w-16 h-16 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color} 0%, ${color}80 40%, transparent 70%)`,
            boxShadow: `0 0 30px ${color}, 0 0 60px ${color}80`,
            animation: 'pulse 0.3s ease-out',
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, transparent 30%, ${color}40 60%, transparent 100%)`,
            transform: `scale(${1 + effect.progress * 2})`,
            opacity: 1 - effect.progress,
          }}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a2a 100%)',
        boxShadow: 'inset 0 0 100px rgba(100, 100, 255, 0.1)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.3) 0%, transparent 100%)',
          borderBottom: '2px solid rgba(239, 68, 68, 0.5)',
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
        }}
      >
        <span className="text-red-400 font-bold text-lg tracking-wider">敌 方 阵 营</span>
      </div>
      
      <div
        className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center"
        style={{
          background: 'linear-gradient(0deg, rgba(59, 130, 246, 0.3) 0%, transparent 100%)',
          borderTop: '2px solid rgba(59, 130, 246, 0.5)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
        }}
      >
        <span className="text-blue-400 font-bold text-lg tracking-wider">我 方 阵 营</span>
      </div>
      
      <div className="absolute top-16 left-0 right-0 bottom-16 flex flex-col justify-around p-4">
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3, 4, 5].map(index => {
            const enemy = enemies[index];
            return (
              <div
                key={`enemy-${index}`}
                className="w-24 h-32 flex items-center justify-center"
              >
                {enemy ? (
                  <CreatureCard
                    creature={{...enemy, currentHp: displayedHp[enemy.id] ?? enemy.currentHp}}
                    isEnemy={true}
                    size="medium"
                    onClick={() => onCreatureClick(enemy)}
                  />
                ) : (
                  <div className="w-full h-full rounded-lg border-2 border-dashed border-red-900/30" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="relative h-20">
          {effects.map(renderSkillEffect)}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-3/4 h-0.5"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(150, 150, 200, 0.3), transparent)',
              }}
            />
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3, 4, 5].map(index => {
            const ally = team[index];
            const isHovered = hoveredSlot === index;
            
            return (
              <div
                key={`ally-${index}`}
                className={`
                  w-24 h-32 rounded-lg flex items-center justify-center
                  transition-all duration-200
                  ${isHovered ? 'bg-blue-500/20' : ''}
                `}
                style={{
                  border: '2px solid',
                  borderColor: isHovered ? 'rgba(147, 197, 253, 0.8)' : 'rgba(100, 116, 139, 0.3)',
                  boxShadow: isHovered
                    ? '0 0 20px rgba(96, 165, 250, 0.4), inset 0 0 15px rgba(96, 165, 250, 0.1)'
                    : 'inset 0 0 10px rgba(0, 0, 0, 0.3)',
                  background: isHovered
                    ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
                    : 'linear-gradient(180deg, rgba(30, 30, 60, 0.5) 0%, rgba(20, 20, 40, 0.5) 100%)',
                }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {ally ? (
                  <CreatureCard
                    creature={{...ally, currentHp: displayedHp[ally.id] ?? ally.currentHp}}
                    isEnemy={false}
                    size="medium"
                    onClick={() => onCreatureClick(ally)}
                    draggable={!isBattling}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ) : (
                  <span className="text-gray-600 text-sm">空位</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(90deg, transparent 49.5%, rgba(148, 163, 184, 0.15) 50%, transparent 50.5%),
            linear-gradient(0deg, transparent 49.5%, rgba(148, 163, 184, 0.15) 50%, transparent 50.5%)
          `,
          backgroundSize: '100% 50%',
        }}
      />
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default BattleField;

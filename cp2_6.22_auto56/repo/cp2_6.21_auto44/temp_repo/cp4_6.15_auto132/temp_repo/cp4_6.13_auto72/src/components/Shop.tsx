import React, { useState } from 'react';
import { useGameStore } from '../store';
import CreatureCard from './CreatureCard';
import { Creature, Skill, getElementColor } from '../creatures';

interface ShopProps {
  onCreatureSelect?: (creature: Creature) => void;
}

const Shop: React.FC<ShopProps> = ({ onCreatureSelect }) => {
  const { shopCreatures, shopSkills, gold, refreshShop, buyCreature, team, level } = useGameStore();
  const [flashingCard, setFlashingCard] = useState<string | null>(null);
  const [selectedCreatureForSkill, setSelectedCreatureForSkill] = useState<number | null>(null);

  const handleBuyCreature = (creature: Creature) => {
    const success = buyCreature(creature);
    if (success) {
      setFlashingCard(creature.id);
      setTimeout(() => setFlashingCard(null), 500);
      playBuySound();
    }
  };

  const handleRefresh = () => {
    if (gold >= 20) {
      useGameStore.getState().addGold(-20);
      refreshShop();
      playBuySound();
    }
  };

  const playBuySound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #1f1a0a 0%, #2a2010 50%, #1a1505 100%)',
        border: '2px solid #d4af37',
        boxShadow: '0 0 20px rgba(212, 175, 55, 0.3), inset 0 0 30px rgba(212, 175, 55, 0.1)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3"
        style={{
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.3) 0%, transparent 100%)',
          borderBottom: '2px solid #d4af37',
        }}
      >
        <h3 className="text-yellow-400 font-bold text-lg flex items-center gap-2">
          <span>🏪</span> 商店
        </h3>
        <button
          onClick={handleRefresh}
          className="px-3 py-1 rounded-full text-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: gold >= 20 
              ? 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)'
              : 'linear-gradient(135deg, #666 0%, #888 100%)',
            color: '#1a1a1a',
            boxShadow: gold >= 20 ? '0 0 15px rgba(212, 175, 55, 0.5)' : 'none',
            cursor: gold >= 20 ? 'pointer' : 'not-allowed',
          }}
          disabled={gold < 20}
        >
          🔄 刷新 (20金)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <h4 className="text-yellow-300 text-sm font-bold mb-2">生物</h4>
          <div className="grid grid-cols-2 gap-3">
            {shopCreatures.map(creature => (
              <div
                key={creature.id}
                className={`relative p-2 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 ${flashingCard === creature.id ? 'animate-pulse' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(139, 115, 37, 0.1) 100%)',
                  border: `1px solid ${getElementColor(creature.element)}80`,
                  boxShadow: flashingCard === creature.id 
                    ? `0 0 30px ${getElementColor(creature.element)}`
                    : `0 0 10px rgba(212, 175, 55, 0.2)`,
                }}
                onClick={() => handleBuyCreature(creature)}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="text-3xl">{creature.emoji}</div>
                  <div className="text-xs text-yellow-200 font-bold">{creature.name}</div>
                  <div className="text-[10px] text-gray-400">
                    HP:{creature.maxHp} ATK:{creature.attack}
                  </div>
                  <button
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 hover:scale-110 active:scale-95"
                    style={{
                      background: gold >= creature.cost
                        ? 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)'
                        : 'linear-gradient(135deg, #555 0%, #777 100%)',
                      color: '#1a1a1a',
                      boxShadow: gold >= creature.cost
                        ? '0 0 15px rgba(212, 175, 55, 0.6)'
                        : 'none',
                    }}
                  >
                    {gold >= creature.cost ? '+' : '✕'}
                  </button>
                  <div className="text-xs text-yellow-400 font-bold">💰 {creature.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-yellow-300 text-sm font-bold mb-2">技能 (150金)</h4>
          <div className="space-y-2">
            {shopSkills.map(skill => (
              <div
                key={skill.id}
                className="p-2 rounded-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(139, 115, 37, 0.1) 100%)',
                  border: '1px solid #d4af3740',
                }}
                onClick={() => {
                  if (gold >= 150) {
                    const emptyCreature = team.findIndex(c => c !== null && c.equippedSkills.length < level);
                    if (emptyCreature !== -1) {
                      const success = useGameStore.getState().buySkill(skill, emptyCreature);
                      if (success) {
                        playBuySound();
                        setFlashingCard(skill.id);
                        setTimeout(() => setFlashingCard(null), 500);
                      }
                    }
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-yellow-200 font-bold">{skill.name}</div>
                    <div className="text-[10px] text-gray-400">{skill.description}</div>
                  </div>
                  <div className="text-xs text-yellow-400 font-bold">💰150</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;

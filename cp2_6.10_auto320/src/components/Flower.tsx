import React, { useEffect, useCallback } from 'react';
import type { GardenFlower, GrowthStage } from '@/types';
import { RARITY_COLORS, STAGE_LABELS } from '@/types';
import { useGrowthAnimation, playSound } from '@/utils/animations';
import { useGardenStore } from '@/store/gardenStore';

interface FlowerProps {
  flower: GardenFlower;
  onClick?: () => void;
}

const STAGE_SCALES: Record<GrowthStage, number> = {
  seed: 0.3,
  sprout: 0.5,
  growing: 0.75,
  blooming: 1,
  seeding: 1,
};

const STAGE_EMOJIS: Record<GrowthStage, string> = {
  seed: '🌱',
  sprout: '🌿',
  growing: '🪴',
  blooming: '',
  seeding: '',
};

export const Flower: React.FC<FlowerProps> = ({ flower, onClick }) => {
  const { advanceGrowthStage, updateGrowth, removeFlower } = useGardenStore();

  const handleStageComplete = useCallback(() => {
    if (flower.currentStage === 'blooming') {
      playSound('bloom');
    }
    if (flower.currentStage === 'seeding') {
      setTimeout(() => {
        removeFlower(flower.instanceId);
      }, 5000);
    } else {
      advanceGrowthStage(flower.instanceId);
    }
  }, [flower.currentStage, flower.instanceId, advanceGrowthStage, removeFlower]);

  const progress = useGrowthAnimation(
    flower.currentStage,
    flower.growthTime,
    handleStageComplete
  );

  useEffect(() => {
    updateGrowth(flower.instanceId, flower.currentStage, progress);
  }, [progress, flower.instanceId, flower.currentStage, updateGrowth]);

  const baseScale = STAGE_SCALES[flower.currentStage];
  const nextScale = flower.currentStage !== 'seeding'
    ? STAGE_SCALES[flower.currentStage === 'seed' ? 'sprout' : flower.currentStage === 'sprout' ? 'growing' : flower.currentStage === 'growing' ? 'blooming' : 'seeding']
    : baseScale;

  const displayScale = baseScale + (nextScale - baseScale) * (progress / 100);
  const displayEmoji = STAGE_EMOJIS[flower.currentStage] || flower.emoji;

  const isBlooming = flower.currentStage === 'blooming' || flower.currentStage === 'seeding';
  const isMagic = flower.isMagic;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
      onClick={onClick}
      style={{
        transform: `scale(${displayScale})`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      {isBlooming && (
        <div
          className="absolute rounded-full blur-xl animate-pulse"
          style={{
            width: '120px',
            height: '120px',
            backgroundColor: flower.color,
            opacity: 0.3,
            animation: 'glow 2s ease-in-out infinite',
          }}
        />
      )}

      {isMagic && (
        <div
          className="absolute rounded-full"
          style={{
            width: '80px',
            height: '80px',
            background: `conic-gradient(from 0deg, ${flower.color}, #fbbf24, ${flower.color})`,
            filter: 'blur(10px)',
            opacity: 0.5,
            animation: 'spin 3s linear infinite',
          }}
        />
      )}

      <div
        className={`text-6xl relative z-10 select-none ${
          isBlooming ? 'animate-bounce-slow' : ''
        }`}
        style={{
          filter: isMagic ? `drop-shadow(0 0 10px ${flower.color})` : 'none',
        }}
      >
        {displayEmoji}
      </div>

      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
          style={{ backgroundColor: RARITY_COLORS[flower.rarity] }}
        >
          {STAGE_LABELS[flower.currentStage]}
        </span>
      </div>

      {flower.currentStage !== 'seeding' && (
        <div className="absolute -bottom-6 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              backgroundColor: flower.color,
            }}
          />
        </div>
      )}
    </div>
  );
};

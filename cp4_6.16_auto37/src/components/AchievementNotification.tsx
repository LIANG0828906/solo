import React from 'react';
import { useGameStore } from '@/store/gameStore';
import PixelIcon from './PixelIcon';

const AchievementNotification: React.FC = () => {
  const { currentAchievement, items } = useGameStore();
  
  if (!currentAchievement) return null;
  
  const item = items[currentAchievement.itemId];
  if (!item) return null;
  
  return (
    <div className="achievement-notification">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          animation: 'appear 0.5s ease-out',
        }}>
          <PixelIcon
            type={item.iconType}
            color={item.color}
            accentColor={item.accentColor}
            size={36}
          />
        </div>
        <div>
          <div className="achievement-title">🎉 解锁新物品</div>
          <div className="achievement-item">{item.name}</div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;

import { useState, useCallback, useEffect } from 'react';
import type { InventoryItem, ItemType, PetStats } from '../types';
import { ITEM_INFO } from '../types';
import './BackpackPage.css';

interface BackpackPageProps {
  items: InventoryItem[];
  onUseItem: (itemType: ItemType) => Promise<boolean>;
  petStats: PetStats;
}

const BackpackPage = function BackpackPage({ items, onUseItem, petStats }: BackpackPageProps) {
  const [particleEffects, setParticleEffects] = useState<Array<{ id: number; type: ItemType; x: number; y: number }>>([]);
  const [usingItem, setUsingItem] = useState<ItemType | null>(null);

  const handleUseItem = useCallback(async (itemType: ItemType, event: React.MouseEvent<HTMLButtonElement>) => {
    if (usingItem) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const newEffect = { id: Date.now(), type: itemType, x, y };
    setParticleEffects(prev => [...prev, newEffect]);
    
    setUsingItem(itemType);
    
    try {
      await onUseItem(itemType);
    } catch (e) {
      console.error('使用道具失败:', e);
    } finally {
      setTimeout(() => {
        setUsingItem(null);
        setParticleEffects(prev => prev.filter(e => e.id !== newEffect.id));
      }, 1000);
    }
  }, [usingItem, onUseItem]);

  const allItemTypes: ItemType[] = ['energyJuice', 'magicShampoo', 'luxuryFood', 'playToy'];

  const getItemQuantity = (type: ItemType): number => {
    const item = items.find(i => i.type === type);
    return item ? item.quantity : 0;
  };

  return (
    <div className="backpack-page page-container">
      <h1 className="page-title">🎒 我的背包</h1>
      
      <div className="backpack-grid">
        {allItemTypes.map(type => {
          const info = ITEM_INFO[type];
          const quantity = getItemQuantity(type);
          const isDisabled = quantity <= 0 || usingItem === type;
          
          return (
            <button
              key={type}
              className={`item-card ${isDisabled ? 'disabled' : ''} ${usingItem === type ? 'using' : ''}`}
              onClick={(e) => !isDisabled && handleUseItem(type, e)}
              disabled={isDisabled}
            >
              <div className="item-icon-wrapper">
                <span className="item-icon">{info.emoji}</span>
                {quantity > 0 && (
                  <span className="item-quantity">{quantity}</span>
                )}
              </div>
              <div className="item-info">
                <span className="item-name">{info.name}</span>
                <span className="item-effect">+20 {info.stat === 'hunger' ? '饥饿度' : info.stat === 'happiness' ? '快乐度' : info.stat === 'cleanliness' ? '清洁度' : '精力'}</span>
              </div>
              <span className="use-hint">{quantity > 0 ? '点击使用' : '暂无'}</span>
            </button>
          );
        })}
      </div>
      
      {items.length === 0 && (
        <div className="empty-backpack">
          <span className="empty-icon">📦</span>
          <p>背包空空如也，快去签到领取道具吧~</p>
        </div>
      )}
      
      <div className="current-stats">
        <h3 className="stats-title">当前宠物状态</h3>
        <div className="stats-grid">
          {Object.entries(petStats).map(([stat, value]) => (
            <div key={stat} className="stat-item">
              <span className="stat-label">
                {stat === 'hunger' ? '🍖 饥饿' : stat === 'happiness' ? '😊 快乐' : stat === 'cleanliness' ? '💧 清洁' : '⚡ 精力'}
              </span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ 
                    width: `${value}%`,
                    background: value < 30 
                      ? 'linear-gradient(90deg, #ff6b6b, #ff8787)' 
                      : 'linear-gradient(90deg, #98D8AA, #6BCB77)'
                  }}
                />
              </div>
              <span className="stat-value">{Math.round(value)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {particleEffects.map(effect => (
        <div key={effect.id} className="particles-container" style={{ left: effect.x, top: effect.y }}>
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="particle-star"
              style={{
                ['--i' as string]: i,
                ['--angle' as string]: `${i * 45}deg`,
              }}
            >
              ⭐
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default BackpackPage;

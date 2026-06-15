import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import PixelIcon from './PixelIcon';
import { RECIPES, type Recipe } from '@/data/recipes';

const ItemGallery: React.FC = () => {
  const { items, unlockedItems, recipes } = useGameStore();
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  
  const allItemIds = Object.keys(items).filter(id => {
    const item = items[id];
    return item && !item.isBaseResource;
  });
  
  const unlockedItemIds = allItemIds.filter(id => unlockedItems.has(id));
  const lockedItemIds = allItemIds.filter(id => !unlockedItems.has(id));
  
  let displayItems: string[] = [];
  switch (activeTab) {
    case 'all':
      displayItems = allItemIds;
      break;
    case 'unlocked':
      displayItems = unlockedItemIds;
      break;
    case 'locked':
      displayItems = lockedItemIds;
      break;
  }
  
  const getRecipeForItem = (itemId: string): Recipe | undefined => {
    return recipes.find(r => r.resultItemId === itemId);
  };
  
  return (
    <div className="gallery-section">
      <div className="section-title" style={{ marginTop: 0, marginBottom: '8px' }}>
        物品图鉴 ({unlockedItemIds.length}/{allItemIds.length})
      </div>
      
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部
        </button>
        <button
          className={`tab-btn ${activeTab === 'unlocked' ? 'active' : ''}`}
          onClick={() => setActiveTab('unlocked')}
        >
          已解锁
        </button>
        <button
          className={`tab-btn ${activeTab === 'locked' ? 'active' : ''}`}
          onClick={() => setActiveTab('locked')}
        >
          未解锁
        </button>
      </div>
      
      <div className="gallery-container">
        {displayItems.length === 0 ? (
          <div style={{ 
            color: 'var(--text-muted)', 
            fontSize: '8px', 
            padding: '20px',
            textAlign: 'center',
            width: '100%',
          }}>
            暂无物品
          </div>
        ) : (
          displayItems.map(itemId => {
            const item = items[itemId];
            if (!item) return null;
            
            const isUnlocked = unlockedItems.has(itemId);
            const recipe = getRecipeForItem(itemId);
            
            return (
              <div
                key={itemId}
                className={`gallery-card ${!isUnlocked ? 'locked' : ''}`}
              >
                {isUnlocked ? (
                  <>
                    <div className="card-icon">
                      <PixelIcon
                        type={item.iconType}
                        color={item.color}
                        accentColor={item.accentColor}
                        size={48}
                      />
                    </div>
                    <div className="card-name">{item.name}</div>
                    <div className="card-desc">{item.description}</div>
                    {recipe && (
                      <div style={{ 
                        fontSize: '5px', 
                        color: 'var(--accent-gold)', 
                        marginTop: '4px',
                        textAlign: 'center',
                      }}>
                        {recipe.requiredResources.map(r => {
                          const resItem = items[r.itemId];
                          return resItem ? `${resItem.name}×${r.count} ` : '';
                        }).join('')}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="card-icon" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '32px',
                      color: 'var(--text-muted)',
                    }}>
                      ?
                    </div>
                    <div className="card-name" style={{ color: 'var(--text-muted)' }}>
                      ???
                    </div>
                    <div className="card-desc" style={{ color: 'var(--text-muted)' }}>
                      尚未解锁
                    </div>
                  </>
                )}
                
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: item.rarity === 'legendary' 
                    ? 'linear-gradient(135deg, #f0c040, #ff80c0)'
                    : item.rarity === 'epic'
                      ? '#c040ff'
                      : item.rarity === 'rare'
                        ? '#4080ff'
                        : item.rarity === 'uncommon'
                          ? '#40c060'
                          : '#808090',
                }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ItemGallery;

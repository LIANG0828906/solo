import React from 'react';
import type { SpawnedCat } from '../data/cats';
import { BEHAVIOR_DESCRIPTIONS, getBreedById, SPOT_POSITIONS } from '../data/cats';

interface CatStatusPanelProps {
  spawnedCats: SpawnedCat[];
  highlightedCatId: string | null;
  onCatClick: (catId: string) => void;
}

export const CatStatusPanel: React.FC<CatStatusPanelProps> = ({
  spawnedCats,
  highlightedCatId,
  onCatClick
}) => {
  return (
    <div className="cat-status-panel">
      <div className="panel-header">
        <h3>🐱 猫咪活动状态</h3>
        <span className="cat-count-badge">{spawnedCats.length}/15</span>
      </div>
      
      <div className="status-list">
        {spawnedCats.length === 0 ? (
          <div className="empty-state">
            <p>点击咖啡店中的家具召唤猫咪吧~</p>
            <p className="hint">吧台、书架、地毯、窗台都可能出现猫咪哦</p>
          </div>
        ) : (
          spawnedCats.map((cat) => {
            const breed = getBreedById(cat.breedId);
            if (!breed) return null;
            
            return (
              <div
                key={cat.id}
                className={`status-item ${highlightedCatId === cat.id ? 'highlighted' : ''}`}
                onClick={() => onCatClick(cat.id)}
              >
                <div 
                  className="cat-avatar"
                  style={{ 
                    background: `linear-gradient(135deg, ${breed.colorTheme.primary}, ${breed.colorTheme.secondary})`,
                    borderColor: highlightedCatId === cat.id ? '#FFD700' : breed.colorTheme.accent
                  }}
                >
                  <span className="cat-emoji-small">{breed.emoji}</span>
                </div>
                
                <div className="cat-info">
                  <div className="cat-info-header">
                    <span className="cat-breed-name">{breed.name}</span>
                    <span className="cat-location">📍 {SPOT_POSITIONS[cat.position].name}</span>
                  </div>
                  <div className="cat-behavior">
                    {BEHAVIOR_DESCRIPTIONS[cat.behavior]}
                  </div>
                  <div className="cat-personality-tag">
                    "{cat.currentPersonality}"
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <style>{`
        .cat-status-panel {
          background: rgba(42, 31, 26, 0.95);
          border-radius: 16px;
          padding: 16px;
          border: 2px solid #8B4513;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 300px;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(139, 69, 19, 0.3);
        }
        
        .panel-header h3 {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 18px;
          color: #F5DEB3;
          margin: 0;
        }
        
        .cat-count-badge {
          background: linear-gradient(135deg, #8B4513, #A0522D);
          color: #FFF;
          padding: 4px 12px;
          border-radius: 12px;
          font-family: 'Press Start 2P', cursive;
          font-size: 10px;
        }
        
        .status-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 4px;
        }
        
        .status-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .status-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .status-list::-webkit-scrollbar-thumb {
          background: #8B4513;
          border-radius: 3px;
        }
        
        .empty-state {
          text-align: center;
          padding: 30px 20px;
          color: #999;
        }
        
        .empty-state p {
          font-family: 'ZCOOL KuaiLe', cursive;
          margin: 8px 0;
        }
        
        .empty-state .hint {
          font-size: 12px;
          color: #666;
        }
        
        .status-item {
          display: flex;
          gap: 12px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }
        
        .status-item:hover {
          background: rgba(139, 69, 19, 0.2);
          transform: translateX(4px);
        }
        
        .status-item.highlighted {
          border-color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }
        
        .cat-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }
        
        .cat-emoji-small {
          font-size: 24px;
        }
        
        .cat-info {
          flex: 1;
          min-width: 0;
        }
        
        .cat-info-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .cat-breed-name {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 14px;
          color: #F5DEB3;
          font-weight: bold;
        }
        
        .cat-location {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 11px;
          color: #999;
        }
        
        .cat-behavior {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 13px;
          color: #98FB98;
          margin-bottom: 2px;
        }
        
        .cat-personality-tag {
          font-family: 'ZCOOL KuaiLe', cursive;
          font-size: 11px;
          color: #FFB6C1;
          font-style: italic;
        }
        
        @media (max-width: 768px) {
          .cat-status-panel {
            min-height: 250px;
            max-height: 300px;
          }
          
          .panel-header h3 {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

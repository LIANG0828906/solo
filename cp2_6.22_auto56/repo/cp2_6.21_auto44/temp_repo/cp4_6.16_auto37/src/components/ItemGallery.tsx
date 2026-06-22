/**
 * ============================================================
 * 物品图鉴组件
 * ============================================================
 * 
 * 功能特性：
 * - 横向滑动卡片画廊
 * - 悬停3D翻转效果（卡片上浮 + Y轴旋转）
 * - 点击卡片查看详情弹窗
 * - 三种筛选标签：全部/已解锁/未解锁
 * - 已解锁物品显示完整信息
 * - 未解锁物品显示问号占位，但可以查看配方需求提示
 * - 稀有度颜色标记（普通/稀有/史诗/传说）
 * 
 * 动画实现：
 * - 使用 CSS transform + transition 实现平滑过渡
 * - 悬停：translateY(-8px) + rotateY(5deg) + 阴影加深
 * - 点击：弹出版详情卡片
 * - 所有动画使用 GPU 加速（transform 而非 top/left）
 * 
 * ============================================================
 */

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import PixelIcon from './PixelIcon';
import type { Recipe } from '@/data/recipes';

const ItemGallery: React.FC = () => {
  const { items, unlockedItems, recipes } = useGameStore();
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
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
  
  const handleCardClick = (itemId: string) => {
    setSelectedItemId(itemId);
  };
  
  const closeModal = () => {
    setSelectedItemId(null);
  };
  
  const selectedItem = selectedItemId ? items[selectedItemId] : null;
  const selectedRecipe = selectedItemId ? getRecipeForItem(selectedItemId) : null;
  const isSelectedUnlocked = selectedItemId ? unlockedItems.has(selectedItemId) : false;
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#f0c040';
      case 'epic': return '#c040ff';
      case 'rare': return '#4080ff';
      case 'uncommon': return '#40c060';
      default: return '#808090';
    }
  };
  
  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '传说';
      case 'epic': return '史诗';
      case 'rare': return '稀有';
      case 'uncommon': return '优秀';
      default: return '普通';
    }
  };
  
  const getTypeName = (type: string) => {
    switch (type) {
      case 'tool': return '工具';
      case 'weapon': return '武器';
      case 'armor': return '防具';
      case 'potion': return '药水';
      case 'artifact': return '神器';
      case 'resource': return '资源';
      default: return '物品';
    }
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
            
            return (
              <div
                key={itemId}
                className={`gallery-card ${!isUnlocked ? 'locked' : ''}`}
                onClick={() => handleCardClick(itemId)}
              >
                <div className="card-front">
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
                      <div className="card-desc">{item.description.slice(0, 15)}...</div>
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
                        点击查看配方
                      </div>
                    </>
                  )}
                  
                  <div 
                    className="rarity-dot"
                    style={{ backgroundColor: getRarityColor(item.rarity) }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {selectedItem && (
        <div 
          className="modal-overlay"
          onClick={closeModal}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-close"
              onClick={closeModal}
            >
              ×
            </div>
            
            <div className="modal-header">
              {isSelectedUnlocked ? (
                <PixelIcon
                  type={selectedItem.iconType}
                  color={selectedItem.color}
                  accentColor={selectedItem.accentColor}
                  size={64}
                />
              ) : (
                <div style={{
                  width: 64,
                  height: 64,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  color: 'var(--text-muted)',
                }}>
                  ?
                </div>
              )}
              
              <div style={{ marginLeft: '16px' }}>
                <div 
                  className="modal-title"
                  style={{ color: isSelectedUnlocked ? getRarityColor(selectedItem.rarity) : 'var(--text-muted)' }}
                >
                  {isSelectedUnlocked ? selectedItem.name : '???'}
                </div>
                <div className="modal-subtitle">
                  {getTypeName(selectedItem.type)} · {getRarityName(selectedItem.rarity)}
                </div>
              </div>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <div className="modal-section-title">物品描述</div>
                <div className="modal-section-content">
                  {isSelectedUnlocked 
                    ? selectedItem.description 
                    : '尚未解锁此物品，继续探索合成配方吧！'}
                </div>
              </div>
              
              {selectedRecipe && (
                <div className="modal-section">
                  <div className="modal-section-title">合成配方</div>
                  <div className="modal-section-content">
                    <div className="recipe-resources">
                      {selectedRecipe.requiredResources.map((r, i) => {
                        const resItem = items[r.itemId];
                        const resUnlocked = unlockedItems.has(r.itemId);
                        return (
                          <div key={i} className="recipe-resource-item">
                            {resItem ? (
                              <>
                                <PixelIcon
                                  type={resItem.iconType}
                                  color={resUnlocked ? resItem.color : '#606070'}
                                  accentColor={resUnlocked ? resItem.accentColor : '#505060'}
                                  size={24}
                                />
                                <span style={{ 
                                  fontSize: '8px', 
                                  color: resUnlocked ? 'var(--text-primary)' : 'var(--text-muted)',
                                  marginLeft: '6px',
                                }}>
                                  {resUnlocked ? resItem.name : '???'} ×{r.count}
                                </span>
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ 
                      marginTop: '8px',
                      fontSize: '7px', 
                      color: 'var(--text-muted)',
                    }}>
                      产出：{isSelectedUnlocked ? selectedItem.name : '???'} ×{selectedRecipe.resultCount}
                    </div>
                  </div>
                </div>
              )}
              
              {isSelectedUnlocked && (
                <div className="modal-section">
                  <div className="modal-section-title">堆叠上限</div>
                  <div className="modal-section-content">
                    {selectedItem.maxStack} 个/格
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .rarity-dot {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 0 4px currentColor;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-content {
          position: relative;
          background: var(--bg-secondary);
          border: 4px solid var(--border-color);
          box-shadow: 
            inset 3px 3px 0 var(--border-light),
            inset -3px -3px 0 var(--bg-primary),
            0 10px 40px rgba(0, 0, 0, 0.5);
          padding: 20px;
          width: 90%;
          max-width: 360px;
          animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        @keyframes modalPop {
          from { 
            opacity: 0; 
            transform: scale(0.8);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        .modal-close {
          position: absolute;
          top: 8px;
          right: 12px;
          font-size: 20px;
          color: var(--text-muted);
          cursor: pointer;
          line-height: 1;
          transition: color 0.15s;
        }
        
        .modal-close:hover {
          color: var(--text-primary);
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--border-color);
        }
        
        .modal-title {
          font-size: 12px;
          font-weight: normal;
          margin-bottom: 4px;
        }
        
        .modal-subtitle {
          font-size: 7px;
          color: var(--text-secondary);
        }
        
        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .modal-section {
        }
        
        .modal-section-title {
          font-size: 8px;
          color: var(--accent-gold);
          margin-bottom: 6px;
        }
        
        .modal-section-content {
          font-size: 9px;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        
        .recipe-resources {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .recipe-resource-item {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
};

export default ItemGallery;

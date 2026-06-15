import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import PixelIcon from './PixelIcon';

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
}

const CraftingTable: React.FC = () => {
  const { 
    craftingGrid, 
    items, 
    matchedRecipe, 
    isCrafting, 
    performCraft,
    clearCraftingGrid,
    addToCraftingGrid,
    removeFromCraftingGrid,
    swapCraftingCells,
    checkRecipeMatch,
  } = useGameStore();
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  
  const handleDragStart = (e: React.DragEvent, row: number, col: number) => {
    const cell = craftingGrid[row][col];
    if (!cell.itemId || isCrafting) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      source: 'crafting',
      itemId: cell.itemId,
      row,
      col,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetRow: number, targetCol: number) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const state = useGameStore.getState();
      
      if (data.source === 'inventory') {
        const { itemId, index } = data;
        
        if (state.craftingGrid[targetRow][targetCol].itemId === null) {
          const success = state.removeFromInventory(itemId, 1);
          if (success) {
            state.addToCraftingGrid(targetRow, targetCol, itemId);
          }
        }
      } else if (data.source === 'crafting') {
        const { row: sourceRow, col: sourceCol } = data;
        
        if (sourceRow !== targetRow || sourceCol !== targetCol) {
          state.swapCraftingCells(sourceRow, sourceCol, targetRow, targetCol);
        }
      }
      
      state.checkRecipeMatch();
      state.saveGame();
    } catch (err) {
      console.error('Drop error:', err);
    }
  };
  
  const handleCraft = () => {
    if (!matchedRecipe || isCrafting) return;
    
    setShowSuccess(true);
    createParticles();
    
    const success = performCraft();
    
    if (success) {
      setTimeout(() => {
        setShowSuccess(false);
        setParticles([]);
      }, 800);
    }
  };
  
  const createParticles = () => {
    const newParticles: Particle[] = [];
    const colors = ['#f0c040', '#ffd060', '#ffe080', '#fff0a0'];
    
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: `particle-${i}`,
        x: 80 + Math.random() * 80,
        y: 40 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    
    setParticles(newParticles);
  };
  
  const handleClear = () => {
    if (isCrafting) return;
    clearCraftingGrid();
  };
  
  const previewItem = matchedRecipe ? items[matchedRecipe.resultItemId] : null;
  
  return (
    <div className="game-section">
      <div className="section-title">合成台</div>
      
      <div className={`crafting-preview ${!previewItem ? 'empty' : ''} ${showSuccess ? 'craft-success' : ''}`}>
        {previewItem ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div className={showSuccess ? 'craft-item-appear' : ''}>
              <PixelIcon
                type={previewItem.iconType}
                color={previewItem.color}
                accentColor={previewItem.accentColor}
                size={40}
              />
            </div>
            <div style={{ fontSize: '8px', lineHeight: 1.6 }}>
              <div style={{ color: 'var(--accent-gold)', marginBottom: '4px' }}>
                {previewItem.name}
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '6px' }}>
                {previewItem.description.slice(0, 20)}...
              </div>
            </div>
            {particles.map(p => (
              <div
                key={p.id}
                className="particle"
                style={{
                  left: p.x,
                  top: p.y,
                  backgroundColor: p.color,
                  '--px': `${(Math.random() - 0.5) * 80}px`,
                  '--py': `${-30 - Math.random() * 40}px`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        ) : (
          <span>放入资源开始合成</span>
        )}
      </div>
      
      <div 
        ref={gridRef}
        className={`grid-container crafting-grid ${showSuccess ? 'craft-success' : ''}`}
      >
        {craftingGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const item = cell.itemId ? items[cell.itemId] : null;
            
            return (
              <div
                key={cell.id}
                className={`grid-cell ${matchedRecipe ? 'highlight' : ''}`}
                draggable={!!cell.itemId && !isCrafting}
                onDragStart={(e) => handleDragStart(e, rowIndex, colIndex)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, rowIndex, colIndex)}
              >
                {item && (
                  <div className={showSuccess ? 'craft-item-scatter' : ''}>
                    <PixelIcon
                      type={item.iconType}
                      color={item.color}
                      accentColor={item.accentColor}
                      size={32}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button
          className="pixel-button gold"
          style={{ flex: 1, fontSize: '8px', padding: '10px' }}
          onClick={handleCraft}
          disabled={!matchedRecipe || isCrafting}
        >
          {isCrafting ? '合成中...' : '合成'}
        </button>
        <button
          className="pixel-button"
          style={{ fontSize: '8px', padding: '10px' }}
          onClick={handleClear}
          disabled={isCrafting}
        >
          清空
        </button>
      </div>
    </div>
  );
};

export default CraftingTable;

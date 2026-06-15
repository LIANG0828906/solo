import React, { useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import PixelIcon from './PixelIcon';

interface InventoryGridProps {
  onDragStart?: (itemId: string, slotIndex: number) => void;
  onDragEnd?: () => void;
}

const InventoryGrid: React.FC<InventoryGridProps> = ({ onDragStart, onDragEnd }) => {
  const { inventory, items, isCrafting } = useGameStore();
  const gridRef = useRef<HTMLDivElement>(null);
  
  const handleDragStart = (e: React.DragEvent, itemId: string, index: number) => {
    if (!itemId || isCrafting) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      source: 'inventory',
      itemId,
      index,
    }));
    e.dataTransfer.effectAllowed = 'move';
    
    if (onDragStart) {
      onDragStart(itemId, index);
    }
  };
  
  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const state = useGameStore.getState();
      
      if (data.source === 'crafting') {
        const { row, col } = data;
        const cell = state.craftingGrid[row][col];
        
        if (cell.itemId) {
          const targetSlot = state.inventory[targetIndex];
          
          if (targetSlot.itemId === null || targetSlot.itemId === cell.itemId) {
            state.removeFromCraftingGrid(row, col);
            state.addToInventory(cell.itemId, 1);
          }
        }
      } else if (data.source === 'inventory' && data.index !== targetIndex) {
        const sourceSlot = state.inventory[data.index];
        const targetSlot = state.inventory[targetIndex];
        
        if (sourceSlot.itemId) {
          if (targetSlot.itemId === null) {
            const newInv = [...state.inventory];
            newInv[targetIndex] = { ...sourceSlot };
            newInv[data.index] = { itemId: null, count: 0 };
            useGameStore.setState({ inventory: newInv });
          } else if (targetSlot.itemId === sourceSlot.itemId) {
            const item = state.items[sourceSlot.itemId];
            const maxStack = item?.maxStack || 99;
            const canAdd = Math.min(sourceSlot.count, maxStack - targetSlot.count);
            
            if (canAdd > 0) {
              const newInv = [...state.inventory];
              newInv[targetIndex] = { ...targetSlot, count: targetSlot.count + canAdd };
              
              const remaining = sourceSlot.count - canAdd;
              if (remaining > 0) {
                newInv[data.index] = { ...sourceSlot, count: remaining };
              } else {
                newInv[data.index] = { itemId: null, count: 0 };
              }
              
              useGameStore.setState({ inventory: newInv });
            }
          }
        }
      }
      
      state.checkRecipeMatch();
      state.saveGame();
    } catch (err) {
      console.error('Drop error:', err);
    }
    
    if (onDragEnd) {
      onDragEnd();
    }
  };
  
  const renderSlot = (slot: { itemId: string | null; count: number }, index: number) => {
    const item = slot.itemId ? items[slot.itemId] : null;
    
    return (
      <div
        key={index}
        className="grid-cell"
        draggable={!!slot.itemId && !isCrafting}
        onDragStart={(e) => slot.itemId && handleDragStart(e, slot.itemId, index)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
      >
        {item && (
          <>
            <PixelIcon
              type={item.iconType}
              color={item.color}
              accentColor={item.accentColor}
              size={32}
            />
            {slot.count > 1 && (
              <span className="stack-count">{slot.count}</span>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="game-section">
      <div className="section-title">背包</div>
      <div ref={gridRef} className="grid-container inventory-grid">
        {inventory.map((slot, index) => renderSlot(slot, index))}
      </div>
    </div>
  );
};

export default InventoryGrid;

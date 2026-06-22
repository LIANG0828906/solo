import React, { useState } from 'react';
import { InventoryItem, MAX_INVENTORY_SIZE } from '../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface InventoryPanelProps {
  items: InventoryItem[];
  characterId: string;
  onItemDragStart?: (itemId: string) => void;
  onItemDragEnd?: () => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  items,
  characterId,
  onItemDragStart,
  onItemDragEnd,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, item: InventoryItem) => {
    setDraggedItemId(item.id);
    e.dataTransfer.setData('inventory-item', item.id);
    e.dataTransfer.setData('from-character', characterId);
    e.dataTransfer.effectAllowed = 'move';
    onItemDragStart?.(item.id);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    onItemDragEnd?.();
  };

  const emptySlots = MAX_INVENTORY_SIZE - items.length;

  return (
    <div className={`inventory-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="inventory-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="inventory-title">属性背包</span>
        <span className="inventory-count">
          {items.length}/{MAX_INVENTORY_SIZE}
        </span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isExpanded && (
        <div className="inventory-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className={`inventory-item ${draggedItemId === item.id ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragEnd={handleDragEnd}
              title={item.name}
            >
              <span className="item-icon">{item.icon}</span>
              <span className="item-name">{item.name}</span>
            </div>
          ))}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} className="inventory-item empty">
              <span className="item-icon">+</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;

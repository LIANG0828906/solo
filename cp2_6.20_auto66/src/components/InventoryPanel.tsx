import { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Item, EquipmentSlot } from '../types';
import './InventoryPanel.css';

type DragSource = { type: 'inventory'; itemId: string } | { type: 'equipment'; slot: EquipmentSlot };

function InventoryPanel() {
  const { character, inventoryOpen, setInventoryOpen, useItem, equipItem, unequipItem, removeItem } =
    useGameStore();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    item: Item;
    x: number;
    y: number;
  } | null>(null);
  const [dragSource, setDragSource] = useState<DragSource | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<EquipmentSlot | null>(null);
  const [dragOverInventory, setDragOverInventory] = useState(false);
  const [flyingItem, setFlyingItem] = useState<{ item: Item; startX: number; startY: number } | null>(null);
  const dragGhostRef = useRef<HTMLDivElement>(null);

  if (!inventoryOpen || !character) return null;

  const slots: EquipmentSlot[] = ['head', 'body', 'weapon', 'ring'];
  const slotNames: Record<EquipmentSlot, string> = {
    head: '头盔',
    body: '护甲',
    weapon: '武器',
    ring: '戒指',
  };

  const gridRows = 6;
  const gridCols = 4;
  const totalSlots = gridRows * gridCols;

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setContextMenu(null);
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: Item) => {
    e.preventDefault();
    setContextMenu({ item, x: e.clientX, y: e.clientY });
  };

  const handleUseItem = () => {
    if (selectedItem && selectedItem.type === 'consumable') {
      useItem(selectedItem.id);
      setSelectedItem(null);
    }
    if (contextMenu?.item.type === 'consumable') {
      useItem(contextMenu.item.id);
      setContextMenu(null);
    }
  };

  const handleEquipItem = () => {
    const item = selectedItem || contextMenu?.item;
    if (item && item.slot) {
      equipItem(item.id, item.slot);
      setSelectedItem(null);
      setContextMenu(null);
    }
  };

  const handleDropItem = () => {
    const item = selectedItem || contextMenu?.item;
    if (item) {
      removeItem(item.id);
      setSelectedItem(null);
      setContextMenu(null);
    }
  };

  const handleClose = () => {
    setInventoryOpen(false);
    setSelectedItem(null);
    setContextMenu(null);
    setDragSource(null);
    setDragOverSlot(null);
    setDragOverInventory(false);
  };

  const handleDragStartInventory = (e: React.DragEvent, item: Item) => {
    setDragSource({ type: 'inventory', itemId: item.id });
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', item.id);
    } catch {
    }
    setTimeout(() => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragStartEquipment = (e: React.DragEvent, slot: EquipmentSlot, item: Item) => {
    setDragSource({ type: 'equipment', slot });
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', slot);
    } catch {
    }
    setTimeout(() => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDragSource(null);
    setDragOverSlot(null);
    setDragOverInventory(false);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('dragging');
    }
  };

  const handleDragOverSlot = (e: React.DragEvent, slot: EquipmentSlot) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!dragSource) return;
    if (dragSource.type === 'inventory') {
      const item = character.inventory.find((i) => i.id === dragSource.itemId);
      if (item && item.slot === slot) {
        setDragOverSlot(slot);
      }
    } else if (dragSource.type === 'equipment' && dragSource.slot === slot) {
      setDragOverSlot(slot);
    }
  };

  const handleDragLeaveSlot = () => {
    setDragOverSlot(null);
  };

  const handleDropSlot = (e: React.DragEvent, slot: EquipmentSlot) => {
    e.preventDefault();
    if (!dragSource) return;

    if (dragSource.type === 'inventory') {
      const item = character.inventory.find((i) => i.id === dragSource.itemId);
      if (item && item.slot === slot) {
        equipItem(item.id, slot);
      }
    }

    setDragSource(null);
    setDragOverSlot(null);
  };

  const handleDragOverInventory = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSource?.type === 'equipment') {
      setDragOverInventory(true);
    }
  };

  const handleDragLeaveInventory = () => {
    setDragOverInventory(false);
  };

  const handleDropInventory = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragSource?.type === 'equipment') {
      unequipItem(dragSource.slot);
    }
    setDragSource(null);
    setDragOverInventory(false);
  };

  const handleDropToTrash = (e: React.DragEvent, item: Item, startX: number, startY: number) => {
    e.preventDefault();
    setFlyingItem({ item, startX, startY });
    setTimeout(() => {
      removeItem(item.id);
      setFlyingItem(null);
    }, 400);
    setDragSource(null);
    setSelectedItem(null);
    setContextMenu(null);
  };

  const getDraggedItem = (): Item | null => {
    if (!dragSource) return null;
    if (dragSource.type === 'inventory') {
      return character.inventory.find((i) => i.id === dragSource.itemId) || null;
    } else {
      return character.equipment[dragSource.slot];
    }
  };

  const selectedItemData = selectedItem || contextMenu?.item;

  return (
    <div className="inventory-overlay" onClick={handleClose}>
      <div
        className="inventory-panel parchment-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inventory-header">
          <h2>🎒 背包</h2>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="inventory-body">
          <div className="equipment-section">
            <h3>装备栏</h3>
            <div className="equip-slots-grid">
              {slots.map((slot) => {
                const item = character.equipment[slot];
                const isDragOver = dragOverSlot === slot;
                return (
                  <div key={slot} className="equip-slot-cell">
                    <span className="slot-label">{slotNames[slot]}</span>
                    <div
                      className={`equip-slot-box ${item ? 'has-item' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      onClick={() => item && setSelectedItem(item)}
                      onDragOver={(e) => handleDragOverSlot(e, slot)}
                      onDragLeave={handleDragLeaveSlot}
                      onDrop={(e) => handleDropSlot(e, slot)}
                    >
                      {item ? (
                        <span
                          className="item-icon"
                          draggable
                          onDragStart={(e) => handleDragStartEquipment(e, slot, item)}
                          onDragEnd={handleDragEnd}
                        >
                          {item.icon}
                        </span>
                      ) : (
                        <span className="slot-empty">空</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="inventory-grid-section">
            <h3>
              物品栏 ({character.inventory.length}/{totalSlots})
            </h3>
            <div
              className={`inventory-grid ${dragOverInventory ? 'drag-over' : ''}`}
              onDragOver={handleDragOverInventory}
              onDragLeave={handleDragLeaveInventory}
              onDrop={handleDropInventory}
            >
              {Array.from({ length: totalSlots }).map((_, index) => {
                const item = character.inventory[index];
                return (
                  <div
                    key={index}
                    className={`inventory-slot ${item ? 'has-item' : ''} ${selectedItem?.id === item?.id ? 'selected' : ''}`}
                    onClick={() => item && handleItemClick(item)}
                    onContextMenu={(e) => item && handleItemContextMenu(e, item)}
                  >
                    {item && (
                      <>
                        <span
                          className="item-icon"
                          draggable
                          onDragStart={(e) => handleDragStartInventory(e, item)}
                          onDragEnd={handleDragEnd}
                        >
                          {item.icon}
                        </span>
                        {item.quantity && item.quantity > 1 && (
                          <span className="item-quantity">{item.quantity}</span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedItemData && (
            <div className="item-detail-panel">
              <div className="item-detail-header">
                <span className="item-detail-icon">{selectedItemData.icon}</span>
                <div>
                  <h4>{selectedItemData.name}</h4>
                  <span className="item-type">
                    {selectedItemData.type === 'weapon' && '武器'}
                    {selectedItemData.type === 'armor' && '护甲'}
                    {selectedItemData.type === 'consumable' && '消耗品'}
                    {selectedItemData.type === 'accessory' && '饰品'}
                    {selectedItemData.type === 'misc' && '杂物'}
                  </span>
                </div>
              </div>
              <p className="item-desc">{selectedItemData.description}</p>
              {selectedItemData.attributes && (
                <div className="item-attrs">
                  {Object.entries(selectedItemData.attributes).map(([key, value]) => (
                    <span key={key} className="item-attr">
                      +{value}{' '}
                      {key === 'strength' && '力量'}
                      {key === 'dexterity' && '敏捷'}
                      {key === 'constitution' && '体质'}
                      {key === 'intelligence' && '智力'}
                      {key === 'wisdom' && '感知'}
                      {key === 'charisma' && '魅力'}
                    </span>
                  ))}
                </div>
              )}
              <div className="item-actions">
                {selectedItemData.type === 'consumable' && (
                  <button className="btn-primary" onClick={handleUseItem}>
                    使用
                  </button>
                )}
                {selectedItemData.slot && (
                  <button className="btn-primary" onClick={handleEquipItem}>
                    装备
                  </button>
                )}
                <button className="btn-secondary" onClick={handleDropItem}>
                  丢弃
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="inventory-footer">
          <span>💰 {character.gold} 金币</span>
        </div>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item.type === 'consumable' && (
            <button className="context-item" onClick={handleUseItem}>
              使用
            </button>
          )}
          {contextMenu.item.slot && (
            <button className="context-item" onClick={handleEquipItem}>
              装备
            </button>
          )}
          <button className="context-item danger" onClick={handleDropItem}>
            丢弃
          </button>
        </div>
      )}
    </div>
  );
}

export default InventoryPanel;

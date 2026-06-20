import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Item, EquipmentSlot } from '../types';
import './InventoryPanel.css';

function InventoryPanel() {
  const { character, inventoryOpen, setInventoryOpen, useItem, equipItem, removeItem } =
    useGameStore();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    item: Item;
    x: number;
    y: number;
  } | null>(null);

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
                return (
                  <div key={slot} className="equip-slot-cell">
                    <span className="slot-label">{slotNames[slot]}</span>
                    <div
                      className={`equip-slot-box ${item ? 'has-item' : ''}`}
                      onClick={() => item && setSelectedItem(item)}
                    >
                      {item ? (
                        <span className="item-icon">{item.icon}</span>
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
            <div className="inventory-grid">
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
                        <span className="item-icon">{item.icon}</span>
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

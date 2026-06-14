import React, { useState } from 'react';
import { Order, addItem, removeItem } from '../api/orderApi';

const FOOD_EMOJIS = [
  '🍚', '🍜', '🥟', '🍕', '🍔', '🍣', '🥗', '🍲',
  '🍗', '🥩', '🥘', '🍱', '🍛', '🌮', '🥪', '🍰',
  '🥤', '🍵', '🍩', '🧁', '🥡', '🍟',
];

interface OrderBoardProps {
  order: Order;
  currentParticipantId: string;
}

function OrderBoard({ order, currentParticipantId }: OrderBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [sharedBy, setSharedBy] = useState<string[]>([]);
  const [isSharedByAll, setIsSharedByAll] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🍽️');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const toggleSharedBy = (pid: string) => {
    setSharedBy((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  const handleAddItem = async () => {
    if (!itemName || !itemPrice) return;
    try {
      await addItem(order.id, {
        name: itemName,
        price: Number(itemPrice),
        quantity: Number(itemQuantity) || 1,
        sharedBy: isSharedByAll ? [] : sharedBy,
        isSharedByAll,
        emoji: selectedEmoji,
      });
      setItemName('');
      setItemPrice('');
      setItemQuantity('1');
      setSharedBy([]);
      setIsSharedByAll(false);
      setSelectedEmoji('🍽️');
      setShowForm(false);
    } catch (e) {
      console.error('Failed to add item:', e);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem(order.id, itemId);
    } catch (e) {
      console.error('Failed to remove item:', e);
    }
  };

  const totalPrice = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="order-board">
      <div className="board-header">
        <h2>
          菜品列表
          <span className="item-count">{order.items.length} 道</span>
        </h2>
        <div className="board-total">合计 ¥{totalPrice.toFixed(2)}</div>
        <button className="btn-add" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ 取消' : '+ 添加菜品'}
        </button>
      </div>

      {showForm && (
        <div className="add-item-form animate-fade-in">
          <div className="form-row">
            <div className="emoji-selector">
              <button
                className="emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                type="button"
              >
                {selectedEmoji}
              </button>
              {showEmojiPicker && (
                <div className="emoji-grid">
                  {FOOD_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      className={`emoji-option ${
                        emoji === selectedEmoji ? 'emoji-selected' : ''
                      }`}
                      onClick={() => {
                        setSelectedEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              className="input-name"
              placeholder="菜品名称"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              placeholder="单价 (¥)"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="数量"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              min="1"
            />
          </div>

          <div className="form-section-shared">
            <label className="shared-all-toggle">
              <input
                type="checkbox"
                checked={isSharedByAll}
                onChange={(e) => {
                  setIsSharedByAll(e.target.checked);
                  if (e.target.checked) setSharedBy([]);
                }}
              />
              <span>众人均摊（如餐盒费、配送费）</span>
            </label>

            {!isSharedByAll && (
              <div className="participant-select">
                <p>谁吃了这道菜？</p>
                <div className="participant-checks">
                  {order.participants.map((p) => (
                    <label key={p.id} className="participant-check">
                      <input
                        type="checkbox"
                        checked={sharedBy.includes(p.id)}
                        onChange={() => toggleSharedBy(p.id)}
                      />
                      <span
                        className="check-dot"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </label>
                  ))}
                </div>
                {sharedBy.length === 0 && !isSharedByAll && (
                  <p className="hint-text">请选择谁吃了这道菜</p>
                )}
              </div>
            )}
          </div>

          <button
            className="btn-primary"
            onClick={handleAddItem}
            disabled={
              !itemName ||
              !itemPrice ||
              (!isSharedByAll && sharedBy.length === 0)
            }
          >
            添加菜品
          </button>
        </div>
      )}

      {order.items.length === 0 ? (
        <div className="empty-items">
          <div className="empty-icon">🍽️</div>
          <p>还没有菜品，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="items-scroll">
          {order.items.map((item, idx) => (
            <div
              key={item.id}
              className="item-card animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="item-emoji">{item.emoji}</div>
              <div className="item-info">
                <div className="item-name">{item.name}</div>
                <div className="item-price">
                  ¥{item.price} × {item.quantity}
                  {item.isSharedByAll && (
                    <span className="shared-badge">众人均摊</span>
                  )}
                </div>
                <div className="item-shared-by">
                  {item.isSharedByAll
                    ? '全员分摊'
                    : item.sharedBy.length === 0
                    ? '未指定'
                    : item.sharedBy
                        .map(
                          (pid) =>
                            order.participants.find((p) => p.id === pid)
                              ?.name || '?'
                        )
                        .join('、')}
                </div>
              </div>
              <div className="item-total">
                ¥{(item.price * item.quantity).toFixed(2)}
              </div>
              <button
                className="btn-remove"
                onClick={() => handleRemoveItem(item.id)}
                title="删除"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderBoard;

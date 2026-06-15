import { useState, useEffect, useRef } from 'react';

interface Dish {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface CartItem extends Dish {
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  totalPrice: number;
  onUpdateQuantity: (dishId: string, delta: number) => void;
  onRemove: (dishId: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

function Cart({ items, totalPrice, onUpdateQuantity, onRemove, onSubmit, onClose }: CartProps) {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [displayItems, setDisplayItems] = useState<CartItem[]>(items);
  const prevItemsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const toRemove: string[] = [];
    const newItemsMap = new Map(items.map(i => [i.id, i.quantity]));
    
    displayItems.forEach(item => {
      const newQty = newItemsMap.get(item.id);
      if (newQty === undefined || newQty === 0) {
        if (item.quantity > 0 || newQty === 0) {
          toRemove.push(item.id);
        }
      }
    });

    if (toRemove.length > 0) {
      setRemovingIds(prev => {
        const next = new Set(prev);
        toRemove.forEach(id => next.add(id));
        return next;
      });
      setTimeout(() => {
        const filteredItems = items.filter(i => i.quantity > 0);
        setDisplayItems(filteredItems);
        setRemovingIds(prev => {
          const next = new Set(prev);
          toRemove.forEach(id => next.delete(id));
          return next;
        });
        toRemove.forEach(id => {
          if (items.find(i => i.id === id)) {
            onRemove(id);
          }
        });
      }, 300);
    } else {
      const displayItemsMap = new Map(displayItems.map(i => [i.id, i.quantity]));
      const updatedItems = items.map(item => {
        const prevQty = displayItemsMap.get(item.id);
        if (prevQty !== undefined && prevQty !== item.quantity) {
          return item;
        }
        return item;
      });
      setDisplayItems(items.filter(i => i.quantity > 0));
    }
    
    prevItemsRef.current = new Map(items.map(i => [i.id, i.quantity]));
  }, [items]);

  const handleQuantityChange = (dishId: string, delta: number, currentQuantity: number) => {
    if (currentQuantity + delta <= 0) {
      setRemovingIds(prev => new Set(prev).add(dishId));
      setTimeout(() => {
        onRemove(dishId);
        setRemovingIds(prev => {
          const next = new Set(prev);
          next.delete(dishId);
          return next;
        });
      }, 300);
    } else {
      onUpdateQuantity(dishId, delta);
    }
  };

  const handleRemoveClick = (dishId: string) => {
    setRemovingIds(prev => new Set(prev).add(dishId));
    setTimeout(() => {
      onRemove(dishId);
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(dishId);
        return next;
      });
    }, 300);
  };

  return (
    <div className="cart-panel">
      <div className="cart-header">
        <h2>🛒 购物车</h2>
        <button className="cart-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="cart-items">
        {displayItems.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🍽️</span>
            <p>购物车是空的</p>
            <p className="cart-empty-hint">快去挑选美食吧~</p>
          </div>
        ) : (
          displayItems.map(item => (
            <div
              key={item.id}
              className={`cart-item ${removingIds.has(item.id) ? 'slide-out' : ''}`}
            >
              <img src={item.image} alt={item.name} className="cart-item-image" />
              <div className="cart-item-info">
                <h4 className="cart-item-name">{item.name}</h4>
                <span className="cart-item-price">¥{item.price}</span>
              </div>
              <div className="cart-item-controls">
                <button
                  className="qty-btn minus"
                  onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                >
                  −
                </button>
                <span className="qty-value">{item.quantity}</span>
                <button
                  className="qty-btn plus"
                  onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                >
                  +
                </button>
              </div>
              <button
                className="cart-item-remove"
                onClick={() => handleRemoveClick(item.id)}
                aria-label="删除"
              >
                🗑️
              </button>
              <span className="cart-item-subtotal">
                ¥{(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        <div className="cart-total">
          <span>合计：</span>
          <span className="cart-total-price">¥{totalPrice.toFixed(2)}</span>
        </div>
        <button
          className="btn-submit-order"
          onClick={onSubmit}
          disabled={displayItems.filter(i => i.quantity > 0 && !removingIds.has(i.id)).length === 0}
        >
          下单
        </button>
      </div>
    </div>
  );
}

export default Cart;

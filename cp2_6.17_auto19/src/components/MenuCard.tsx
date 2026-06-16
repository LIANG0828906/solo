import React, { useState } from 'react';
import { MenuItem } from '../shared/types';
import { useAppStore } from '../store/useAppStore';
import './MenuCard.css';

interface MenuCardProps {
  item: MenuItem;
}

export const MenuCard: React.FC<MenuCardProps> = React.memo(({ item }) => {
  const [showAddButton, setShowAddButton] = useState(false);
  const [animating, setAnimating] = useState(false);
  const addToCart = useAppStore(state => state.addToCart);
  const cartItems = useAppStore(state => state.cartItems);
  
  const cartItem = cartItems.find(c => c.menuItemId === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    setAnimating(true);
    addToCart(item);
    setTimeout(() => setAnimating(false), 200);
  };

  return (
    <div
      className={`menu-card ${animating ? 'card-bounce' : ''}`}
      onMouseEnter={() => setShowAddButton(true)}
      onMouseLeave={() => setShowAddButton(false)}
      onClick={handleAdd}
    >
      <div className="menu-card-image">
        <span className="menu-card-emoji">{item.emoji}</span>
      </div>
      
      <div className="menu-card-content">
        <h3 className="menu-card-name">{item.name}</h3>
        {item.description && (
          <p className="menu-card-desc">{item.description}</p>
        )}
        <p className="menu-card-price">¥{item.price.toFixed(2)}</p>
      </div>

      {showAddButton && (
        <button className="menu-card-add-btn animate-scale-in" onClick={handleAdd}>
          <span className="material-icons">add</span>
        </button>
      )}

      {quantity > 0 && (
        <div className="menu-card-badge animate-scale-in">
          {quantity}
        </div>
      )}
    </div>
  );
});

MenuCard.displayName = 'MenuCard';

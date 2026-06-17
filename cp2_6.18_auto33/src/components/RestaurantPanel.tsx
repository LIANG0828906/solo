import React from 'react';
import { useLunchMateStore } from '../store';
import type { MenuItem, Restaurant } from '../types';
import { Draggable } from 'react-beautiful-dnd';

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  onAdd: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, index, onAdd }) => {
  const discountPercent = Math.round((1 - item.discount) * 100);

  return (
    <Draggable draggableId={`menu-item-${item.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`menu-item-card ${snapshot.isDragging ? 'dragging' : ''}`}
          onClick={() => onAdd(item)}
        >
          <div className="menu-item-info">
            <span className="menu-item-name">{item.name}</span>
            <div className="menu-item-prices">
              <span className="original-price">¥{item.originalPrice.toFixed(1)}</span>
              <span className="discounted-price">¥{item.discountedPrice.toFixed(1)}</span>
            </div>
          </div>
          <span className="discount-tag">{discountPercent}%OFF</span>
        </div>
      )}
    </Draggable>
  );
};

interface RestaurantCardProps {
  restaurant: Restaurant;
  isExpanded: boolean;
  onToggle: () => void;
  onAddItem: (item: MenuItem) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  isExpanded,
  onToggle,
  onAddItem,
}) => {
  return (
    <div className="restaurant-card">
      <div className="restaurant-header" onClick={onToggle}>
        <span className="restaurant-name">{restaurant.name}</span>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </div>
      <div
        className={`menu-items-container ${isExpanded ? 'expanded' : ''}`}
      >
        <div className="menu-items-list">
          {restaurant.menuItems.map((item, idx) => (
            <MenuItemCard
              key={item.id}
              item={item}
              index={idx}
              onAdd={onAddItem}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const RestaurantPanel: React.FC = () => {
  const {
    restaurants,
    expandedRestaurantId,
    toggleRestaurant,
    addItemToOrder,
  } = useLunchMateStore();

  return (
    <div className="restaurant-panel">
      <div className="panel-header">
        <h2>🍽️ 今日特价</h2>
        <p className="panel-subtitle">点击或拖拽菜品到订单区</p>
      </div>
      <div className="restaurants-list">
        {restaurants.map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            isExpanded={expandedRestaurantId === restaurant.id}
            onToggle={() => toggleRestaurant(restaurant.id)}
            onAddItem={addItemToOrder}
          />
        ))}
      </div>
    </div>
  );
};

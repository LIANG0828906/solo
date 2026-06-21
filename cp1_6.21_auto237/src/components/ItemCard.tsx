import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Item } from '../types';
import { formatDate } from '../utils/date';

interface ItemCardProps {
  item: Item;
  index: number;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, index }) => {
  const navigate = useNavigate();
  const animationDelay = `${index * 0.05}s`;

  const handleClick = () => {
    navigate(`/item/${item.id}`);
  };

  return (
    <div
      className="item-card"
      onClick={handleClick}
      style={{ animationDelay }}
    >
      <div className="item-card-header">
        <span className="item-category-tag">{item.category}</span>
        <span className={`item-type-tag ${item.type}`}>
          {item.type === 'lost' ? '寻物' : '招领'}
        </span>
      </div>
      
      <div className="item-card-body">
        <div className="item-name">{item.name}</div>
        <div className="item-description">{item.description}</div>
      </div>
      
      <div className="item-card-footer">
        <span className="item-location">📍 {item.location}</span>
        <span>{formatDate(item.createdAt)}</span>
      </div>
    </div>
  );
};

export default ItemCard;

import { Link } from 'react-router-dom';
import { Item } from '../api';
import './ItemCard.css';

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  const getStatusText = () => {
    switch (item.status) {
      case 'available':
        return '可申领';
      case 'claimed':
        return '已被申领';
      case 'given':
        return '已赠送';
      default:
        return '可申领';
    }
  };

  const getStatusClass = () => {
    switch (item.status) {
      case 'available':
        return 'status-available';
      case 'claimed':
        return 'status-claimed';
      case 'given':
        return 'status-given';
      default:
        return 'status-available';
    }
  };

  return (
    <Link to={`/item/${item.id}`} className="item-card">
      <div className="item-image">
        {item.images[0] ? (
          <img src={item.images[0]} alt={item.title} loading="lazy" />
        ) : (
          <div className="item-placeholder">
            <span className="placeholder-icon">📦</span>
          </div>
        )}
        <div className={`status-badge ${getStatusClass()}`}>
          {getStatusText()}
        </div>
      </div>
      <div className="item-info">
        <h3 className="item-title">{item.title}</h3>
        <div className="item-meta">
          <span className="item-category">{item.category}</span>
          <span className="item-condition">{item.condition}</span>
        </div>
        <div className="item-distance">
          <span className="distance-icon">📍</span>
          <span>{item.distance}m</span>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;

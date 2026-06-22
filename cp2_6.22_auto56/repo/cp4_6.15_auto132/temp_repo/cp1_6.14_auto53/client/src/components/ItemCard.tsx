import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Item } from '../api'
import { formatTimeAgo } from '../utils'
import './ItemCard.css'

interface ItemCardProps {
  item: Item
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const navigate = useNavigate()
  const thumbnail = item.images?.[0] || '/placeholder.jpg'

  const handleClick = () => {
    navigate(`/items/${item.id}`)
  }

  return (
    <div className="item-card" onClick={handleClick}>
      <div className="item-card-image">
        <img src={thumbnail} alt={item.title} />
        {item.status !== 'available' && (
          <div className={`item-card-status status-${item.status}`}>
            {item.status === 'exchanging' ? '交换中' : '已交换'}
          </div>
        )}
      </div>
      <div className="item-card-content">
        <h3 className="item-card-title">{item.title}</h3>
        <div className="item-card-meta">
          <span className="item-card-city">📍 {item.city}</span>
          <span className="item-card-time">{formatTimeAgo(item.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}

export default ItemCard

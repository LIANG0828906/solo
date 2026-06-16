import React, { useState, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Heart } from 'lucide-react';
import { Restaurant } from '@/types';
import { useRouteStore } from '@/data/routeStore';
import { StarRating } from '@/components/ui/StarRating';

interface FoodMarkerProps {
  restaurant: Restaurant;
  delay?: number;
}

const createFoodIcon = (delay: number = 0) => {
  return L.divIcon({
    className: 'food-marker-icon',
    html: `
      <div class="food-marker-wrapper" style="animation-delay: ${delay}ms;">
        <div class="food-marker-ripple"></div>
        <div class="food-marker-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fff;">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

export const FoodMarker: React.FC<FoodMarkerProps> = ({ restaurant, delay = 0 }) => {
  const { toggleFavorite, favoriteRestaurants, showToast } = useRouteStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [popupKey, setPopupKey] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const isFavorite = favoriteRestaurants.some(r => r.id === restaurant.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAnimating(true);
    toggleFavorite(restaurant);
    
    showToast({
      type: isFavorite ? 'info' : 'success',
      message: isFavorite ? '已取消收藏' : '已添加到收藏',
    });

    setTimeout(() => setIsAnimating(false), 600);
  };

  if (!isVisible) return null;

  return (
    <Marker
      position={[restaurant.lat, restaurant.lng]}
      icon={createFoodIcon(delay)}
      eventHandlers={{
        popupopen: () => setPopupKey(prev => prev + 1),
      }}
    >
      <Popup key={popupKey} className="food-popup glass-popup">
        <div className="popup-content glass-popup-content">
          <h3 className="popup-title">{restaurant.name}</h3>
          
          <div className="popup-rating">
            <StarRating key={popupKey} rating={restaurant.rating} size={18} animated />
            <span className="rating-number">{restaurant.rating.toFixed(1)}</span>
          </div>

          <div className="popup-tags">
            {restaurant.tags.map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>

          <div className="popup-dishes">
            <span className="dishes-label">特色菜：</span>
            <div className="dishes-list">
              {restaurant.signatureDishes.map((dish, i) => (
                <span key={i} className="dish-item">• {dish}</span>
              ))}
            </div>
          </div>

          <div className="popup-city">
            <span>📍 {restaurant.city}</span>
          </div>

          <button
            className={`favorite-btn ${isFavorite ? 'favorited' : ''} ${isAnimating ? 'animating' : ''}`}
            onClick={handleFavorite}
          >
            <Heart 
              size={20} 
              fill={isFavorite ? '#ef4444' : 'none'} 
              stroke={isFavorite ? '#ef4444' : 'currentColor'}
              className="favorite-icon"
            />
            <span>{isFavorite ? '已收藏' : '收藏'}</span>
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

import React, { useState } from 'react';
import { Heart, Trash2, MapPin, Star, Search } from 'lucide-react';
import { useRouteStore } from '@/data/routeStore';
import { StarRating } from '@/components/ui/StarRating';

export const FavoritesPage: React.FC = () => {
  const { favoriteRestaurants, toggleFavorite, showToast } = useRouteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = Array.from(
    new Set(favoriteRestaurants.flatMap(r => r.tags))
  );

  const filteredRestaurants = favoriteRestaurants.filter(r => {
    const matchesSearch = !searchQuery.trim() ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = !filterTag || r.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  const handleRemoveFavorite = (id: string, name: string) => {
    const restaurant = favoriteRestaurants.find(r => r.id === id);
    if (restaurant) {
      toggleFavorite(restaurant);
      showToast({
        type: 'info',
        message: `已取消收藏「${name}」`,
      });
    }
  };

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h2 className="page-title">
          <Heart size={24} className="title-icon" fill="#ef4444" />
          我的收藏
        </h2>

        <div className="favorites-stats">
          <div className="fav-stat">
            <span className="fav-stat-value">{favoriteRestaurants.length}</span>
            <span className="fav-stat-label">家餐厅</span>
          </div>
          <div className="fav-stat">
            <span className="fav-stat-value">{allTags.length}</span>
            <span className="fav-stat-label">种口味</span>
          </div>
        </div>

        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="搜索餐厅或城市..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {allTags.length > 0 && (
          <div className="tag-filters">
            <button
              className={`tag-filter ${filterTag === null ? 'active' : ''}`}
              onClick={() => setFilterTag(null)}
            >
              全部
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter ${filterTag === tag ? 'active' : ''}`}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="favorites-content">
        {filteredRestaurants.length === 0 ? (
          <div className="empty-state">
            <Heart size={48} className="empty-icon" />
            <p>还没有收藏的餐厅</p>
            <span className="empty-hint">
              {searchQuery || filterTag ? '没有找到匹配的餐厅' : '在地图上点击美食标记添加收藏吧！'}
            </span>
          </div>
        ) : (
          <div className="favorites-grid">
            {filteredRestaurants.map(restaurant => (
              <div key={restaurant.id} className="favorite-card">
                <button
                  className="favorite-card-delete"
                  onClick={() => handleRemoveFavorite(restaurant.id, restaurant.name)}
                >
                  <Trash2 size={16} />
                </button>

                <div className="favorite-card-icon">
                  <Star size={32} fill="#ffd700" stroke="#ffd700" />
                </div>

                <h3 className="favorite-card-title">{restaurant.name}</h3>

                <div className="favorite-card-rating">
                  <StarRating rating={restaurant.rating} size={16} animated={false} />
                  <span className="rating-number">{restaurant.rating.toFixed(1)}</span>
                </div>

                <div className="favorite-card-location">
                  <MapPin size={14} />
                  <span>{restaurant.city}</span>
                </div>

                <div className="favorite-card-tags">
                  {restaurant.tags.map((tag, i) => (
                    <span key={i} className="tag-badge">{tag}</span>
                  ))}
                </div>

                <div className="favorite-card-dishes">
                  <span className="dishes-title">推荐菜：</span>
                  {restaurant.signatureDishes.map((dish, i) => (
                    <span key={i} className="dish-item">• {dish}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

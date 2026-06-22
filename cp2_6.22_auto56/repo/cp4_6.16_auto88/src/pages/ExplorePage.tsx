import React, { useState, useRef } from 'react';
import { Search, Trash2, Share2, MapPin, Clock, Utensils } from 'lucide-react';
import { useRouteStore } from '@/data/routeStore';
import { Route } from '@/types';
import { StarRating } from '@/components/ui/StarRating';

export const ExplorePage: React.FC = () => {
  const { savedRoutes, removeRoute, generateShareCode, showToast } = useRouteStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'routes' | 'restaurants'>('routes');

  const filteredRoutes = savedRoutes.filter(route => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      route.origin.name?.toLowerCase().includes(query) ||
      route.destination.name?.toLowerCase().includes(query)
    );
  });

  const handleDelete = (routeId: string) => {
    removeRoute(routeId);
    showToast({
      type: 'success',
      message: '路线已删除',
    });
  };

  const handleShare = async (route: Route) => {
    const code = route.shareCode || generateShareCode(route.id);
    const shareText = `RoadRecipe 美食路线分享码：${code}\n从 ${route.origin.name} 到 ${route.destination.name}，全程 ${route.distance} 公里`;

    try {
      await navigator.clipboard.writeText(shareText);
      showToast({
        type: 'success',
        message: `分享码 ${code} 已复制到剪贴板`,
      });
    } catch {
      showToast({
        type: 'info',
        message: `分享码：${code}`,
      });
    }
  };

  const handleViewRoute = (route: Route) => {
    showToast({
      type: 'info',
      message: `查看 ${route.origin.name} → ${route.destination.name} 路线`,
    });
  };

  const SwipeCard: React.FC<{ route: Route; onDelete: () => void }> = ({ route, onDelete }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
      setStartX(e.touches[0].clientX);
      setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return;
      const diff = e.touches[0].clientX - startX;
      if (diff < 0) {
        setTranslateX(Math.max(diff, -100));
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      if (translateX < -50) {
        onDelete();
      }
      setTranslateX(0);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      setStartX(e.clientX);
      setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const diff = e.clientX - startX;
      if (diff < 0) {
        setTranslateX(Math.max(diff, -100));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (translateX < -50) {
        onDelete();
      }
      setTranslateX(0);
    };

    return (
      <div className="swipe-card-container">
        <div className="swipe-card-delete">
          <Trash2 size={20} />
          <span>删除</span>
        </div>
        <div
          ref={cardRef}
          className="route-card"
          style={{ transform: `translateX(${translateX}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="route-card-thumbnail">
            <div className="thumbnail-map">
              <div className="thumbnail-path" />
              <MapPin size={12} className="thumbnail-pin origin" />
              <MapPin size={12} className="thumbnail-pin dest" />
            </div>
          </div>

          <div className="route-card-content">
            <div className="route-card-header">
              <h3 className="route-card-title">
                {route.origin.name} → {route.destination.name}
              </h3>
              <div className="route-card-actions">
                <button
                  className="icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(route);
                  }}
                >
                  <Share2 size={16} />
                </button>
                <button
                  className="icon-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(route.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="route-card-stats">
              <div className="mini-stat">
                <span className="mini-stat-value">{route.distance}</span>
                <span className="mini-stat-label">公里</span>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-value">{route.restaurants.length}</span>
                <span className="mini-stat-label">美食</span>
              </div>
              <div className="mini-stat">
                <Clock size={14} />
                <span className="mini-stat-label">
                  {new Date(route.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>

            {route.shareCode && (
              <div className="route-card-sharecode">
                分享码：<span className="sharecode-text">{route.shareCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const allRestaurants = savedRoutes.flatMap(r => r.restaurants);
  const uniqueRestaurants = Array.from(
    new Map(allRestaurants.map(r => [r.id, r])).values()
  );

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h2 className="page-title">探索收藏</h2>
        
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="搜索路线或城市..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <MapPin size={18} />
            <span>我的路线</span>
            <span className="tab-badge">{savedRoutes.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'restaurants' ? 'active' : ''}`}
            onClick={() => setActiveTab('restaurants')}
          >
            <Utensils size={18} />
            <span>美食收藏</span>
            <span className="tab-badge">{uniqueRestaurants.length}</span>
          </button>
        </div>
      </div>

      <div className="explore-content">
        {activeTab === 'routes' ? (
          <div className="routes-list">
            {filteredRoutes.length === 0 ? (
              <div className="empty-state">
                <MapPin size={48} className="empty-icon" />
                <p>还没有保存的路线</p>
                <span className="empty-hint">去规划页面创建你的第一条美食路线吧！</span>
              </div>
            ) : (
              filteredRoutes.map(route => (
                <SwipeCard
                  key={route.id}
                  route={route}
                  onDelete={() => handleDelete(route.id)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="restaurants-grid">
            {uniqueRestaurants.length === 0 ? (
              <div className="empty-state">
                <Utensils size={48} className="empty-icon" />
                <p>还没有收藏的美食</p>
                <span className="empty-hint">点击地图上的美食标记添加收藏吧！</span>
              </div>
            ) : (
              uniqueRestaurants.map(restaurant => (
                <div key={restaurant.id} className="restaurant-card">
                  <div className="restaurant-card-header">
                    <h4 className="restaurant-name">{restaurant.name}</h4>
                    <div className="restaurant-rating">
                      <StarRating rating={restaurant.rating} size={14} animated={false} />
                      <span className="rating-text">{restaurant.rating}</span>
                    </div>
                  </div>
                  <div className="restaurant-city">
                    <MapPin size={12} />
                    <span>{restaurant.city}</span>
                  </div>
                  <div className="restaurant-tags">
                    {restaurant.tags.map((tag, i) => (
                      <span key={i} className="mini-tag">{tag}</span>
                    ))}
                  </div>
                  <div className="restaurant-dishes">
                    {restaurant.signatureDishes.slice(0, 2).map((dish, i) => (
                      <span key={i} className="dish-preview">• {dish}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

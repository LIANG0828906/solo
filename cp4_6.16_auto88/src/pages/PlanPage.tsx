import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Navigation, Save, Share2, Loader2 } from 'lucide-react';
import { MapContainer } from '@/components/maps/MapContainer';
import { SidePanel } from '@/components/layout/SidePanel';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { useRouteStore } from '@/data/routeStore';
import { calculateRoute, getCitiesAlongPath } from '@/engine/routeEngine';
import { findRestaurantsAlongPath } from '@/engine/foodEngine';
import { City, GeoPoint, Route } from '@/types';

export const PlanPage: React.FC = () => {
  const {
    origin,
    destination,
    currentRoute,
    isPlanning,
    setOrigin,
    setDestination,
    setCurrentRoute,
    setIsPlanning,
    addRoute,
    showToast,
    generateShareCode,
  } = useRouteStore();

  const [originText, setOriginText] = useState('');
  const [destinationText, setDestinationText] = useState('');

  const handleOriginChange = (value: string, city?: City) => {
    setOriginText(value);
    if (city) {
      const point: GeoPoint = {
        lat: city.lat,
        lng: city.lng,
        name: city.name,
      };
      setOrigin(point);
    }
  };

  const handleDestinationChange = (value: string, city?: City) => {
    setDestinationText(value);
    if (city) {
      const point: GeoPoint = {
        lat: city.lat,
        lng: city.lng,
        name: city.name,
      };
      setDestination(point);
    }
  };

  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      showToast({
        type: 'error',
        message: '请先选择起点和终点',
      });
      return;
    }

    setIsPlanning(true);

    setTimeout(() => {
      try {
        const routeResult = calculateRoute(origin, destination);
        const restaurants = findRestaurantsAlongPath(routeResult.path, {
          radiusKm: 50,
          maxResults: 15,
          minRating: 3.5,
        });

        const route: Route = {
          id: uuidv4(),
          origin,
          destination,
          path: routeResult.path,
          distance: Math.round(routeResult.distance),
          restaurants,
          createdAt: Date.now(),
        };

        setCurrentRoute(route);
        setIsPlanning(false);

        showToast({
          type: 'success',
          message: `路线规划完成！全程约 ${route.distance} 公里，发现 ${restaurants.length} 家美食`,
        });
      } catch (error) {
        console.error('Route planning error:', error);
        setIsPlanning(false);
        showToast({
          type: 'error',
          message: '路线规划失败，请重试',
        });
      }
    }, 100);
  };

  const handleSaveRoute = () => {
    if (!currentRoute) return;
    
    addRoute(currentRoute);
    showToast({
      type: 'success',
      message: '路线已保存到收藏',
    });
  };

  const handleShare = async () => {
    if (!currentRoute) return;

    const code = generateShareCode(currentRoute.id);
    const shareText = `RoadRecipe 美食路线分享码：${code}\n从 ${currentRoute.origin.name} 到 ${currentRoute.destination.name}，全程 ${currentRoute.distance} 公里`;

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

  const handleMarkerDrag = (type: 'origin' | 'destination', point: GeoPoint) => {
    if (type === 'origin') {
      setOrigin(point);
      setOriginText(point.name || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
    } else {
      setDestination(point);
      setDestinationText(point.name || `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
    }
  };

  const pathCities = currentRoute ? getCitiesAlongPath(currentRoute.path) : [];

  return (
    <div className="plan-page">
      <SidePanel className="plan-panel">
        <div className="panel-header">
          <h1 className="app-title">RoadRecipe</h1>
          <p className="app-subtitle">智能美食旅行规划</p>
        </div>

        <div className="form-section">
          <AutocompleteInput
            value={originText}
            onChange={handleOriginChange}
            placeholder="输入起点城市"
            icon="origin"
          />

          <div className="form-divider">
            <div className="divider-line" />
            <Navigation size={16} className="divider-icon" />
            <div className="divider-line" />
          </div>

          <AutocompleteInput
            value={destinationText}
            onChange={handleDestinationChange}
            placeholder="输入终点城市"
            icon="destination"
          />

          <button
            className="plan-button"
            onClick={handlePlanRoute}
            disabled={isPlanning || !origin || !destination}
          >
            {isPlanning ? (
              <>
                <Loader2 size={20} className="spin" />
                <span>规划中...</span>
              </>
            ) : (
              <>
                <Navigation size={20} />
                <span>规划路线</span>
              </>
            )}
          </button>
        </div>

        {currentRoute && (
          <div className="route-info">
            <div className="route-stats">
              <div className="stat-item">
                <span className="stat-value">{currentRoute.distance}</span>
                <span className="stat-label">公里</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{currentRoute.restaurants.length}</span>
                <span className="stat-label">家美食</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">{pathCities.length}</span>
                <span className="stat-label">座城市</span>
              </div>
            </div>

            <div className="route-cities">
              <span className="cities-label">途经：</span>
              <div className="cities-list">
                {pathCities.map((city, i) => (
                  <span key={city.id} className="city-tag">
                    {city.name}
                    {i < pathCities.length - 1 && <span className="city-arrow">→</span>}
                  </span>
                ))}
              </div>
            </div>

            <div className="route-actions">
              <button className="action-btn secondary" onClick={handleSaveRoute}>
                <Save size={18} />
                <span>保存路线</span>
              </button>
              <button className="action-btn primary" onClick={handleShare}>
                <Share2 size={18} />
                <span>分享</span>
              </button>
            </div>
          </div>
        )}
      </SidePanel>

      <div className="map-section">
        <MapContainer
          origin={origin}
          destination={destination}
          path={currentRoute?.path || []}
          restaurants={currentRoute?.restaurants || []}
          cities={pathCities}
          onMarkerDrag={handleMarkerDrag}
        />
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Route } from '../types';

interface RouteCardProps {
  route: Route;
  onRunClick?: (routeId: string) => void;
}

const RouteCard = ({ route, onRunClick }: RouteCardProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleRunClick = () => {
    setIsRunning(true);
    if (onRunClick) {
      onRunClick(route.id);
    }
    setTimeout(() => setIsRunning(false), 2000);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`star-icon ${i < rating ? 'filled' : 'empty'}`}
        style={{ fontSize: '16px' }}
      >
        ★
      </span>
    ));
  };

  const getRouteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      riverside: '沿河',
      park: '公园',
      street: '街道',
    };
    return labels[type] || type;
  };

  const getStaticMapUrl = () => {
    const centerLat =
      route.coordinates.reduce((sum, coord) => sum + coord[0], 0) /
      route.coordinates.length;
    const centerLng =
      route.coordinates.reduce((sum, coord) => sum + coord[1], 0) /
      route.coordinates.length;

    return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=14&size=300x200&maptype=mapnik`;
  };

  return (
    <div
      className="glass-card route-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        background: isHovered
          ? 'rgba(0, 255, 136, 0.15)'
          : 'var(--card-bg)',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      <div
        className="route-card-thumbnail"
        style={{
          width: '200px',
          minWidth: '200px',
          height: '160px',
          background: `linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(26, 35, 50, 0.8)), url(${getStaticMapUrl()})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: '1px solid var(--border-color)',
        }}
      />
      <div
        className="route-card-content"
        style={{
          flex: 1,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minWidth: 0,
        }}
      >
        <div className="route-card-info">
          <div
            className="route-card-header"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '8px',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {route.name}
            </h3>
            <span
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                background: 'rgba(0, 255, 136, 0.2)',
                color: 'var(--accent-primary)',
                borderRadius: '20px',
                fontWeight: 500,
                marginLeft: '8px',
                flexShrink: 0,
              }}
            >
              {getRouteTypeLabel(route.routeType)}
            </span>
          </div>
          <div
            className="route-card-meta"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              📍 {route.distance.toFixed(1)} 公里
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {renderStars(route.lightingRating)}
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginLeft: '4px',
                }}
              >
                照明
              </span>
            </div>
          </div>
          {route.userTag && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: 'rgba(255, 215, 0, 0.15)',
                color: '#ffd700',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              🏷️ {route.userTag}
            </div>
          )}
        </div>
        <div
          className="route-card-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              安全评级:
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {renderStars(route.safetyRating)}
            </div>
            {route.recentReports > 0 && (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--warning-high)',
                  marginLeft: '8px',
                }}
              >
                ⚠️ {route.recentReports} 条最近报告
              </span>
            )}
          </div>
          <button
            onClick={handleRunClick}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: isRunning
                ? 'var(--accent-primary)'
                : 'var(--accent-primary)',
              color: isRunning ? '#ffffff' : 'var(--bg-primary)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: '110px',
              justifyContent: 'center',
            }}
          >
            {isRunning ? (
              <>
                <span
                  style={{
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  ✓
                </span>
                <span>已标记</span>
              </>
            ) : (
              <>
                <span>🏃</span>
                <span>我要跑</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteCard;

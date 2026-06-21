import React, { useState } from 'react';
import { Route, geocodeLocation, fetchRoutes } from './services/routeService';
import { WeatherAlert, fetchWeatherAlerts } from './services/weatherService';
import MapView from './components/MapView';
import WeatherAlertPanel from './components/WeatherAlert';

const App: React.FC = () => {
  const [startLocation, setStartLocation] = useState('北京站');
  const [endLocation, setEndLocation] = useState('国贸');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [startCoord, setStartCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [endCoord, setEndCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [hoverPlan, setHoverPlan] = useState(false);
  const [hoverCard, setHoverCard] = useState<string | null>(null);

  const handlePlan = async () => {
    setLoading(true);
    try {
      const start = await geocodeLocation(startLocation);
      const end = await geocodeLocation(endLocation);
      const routeData = await fetchRoutes(start.lat, start.lng, end.lat, end.lng);
      setRoutes(routeData);
      setStartCoord(start);
      setEndCoord(end);
      if (routeData.length > 0) {
        setSelectedRouteId(routeData[0].id);
      }
      const routeIds = routeData.map((r) => r.id);
      const alertData = await fetchWeatherAlerts(routeIds);
      setAlerts(alertData);
    } finally {
      setLoading(false);
    }
  };

  const getCongestionColor = (index: number) => {
    if (index < 30) return '#4CAF50';
    if (index <= 70) return '#FF9800';
    return '#F44336';
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 767px) {
          .app-main-content {
            flex-direction: column !important;
          }
          .app-map-container {
            width: 100% !important;
            flex: none !important;
          }
          .app-route-cards {
            flex-direction: row !important;
            overflow-x: auto !important;
            padding-bottom: 8px;
          }
          .app-route-card {
            min-width: 280px !important;
            flex-shrink: 0;
          }
          .app-header-inputs {
            flex-wrap: wrap;
          }
        }
      `}</style>
      <div style={{ background: '#F5F7FA', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <header style={{ background: '#1A237E', color: 'white', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>出行路线规划</div>
          <div className="app-header-inputs" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              style={{
                width: 300,
                height: 44,
                borderRadius: 12,
                border: '2px solid #E0E0E0',
                padding: '0 16px',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.3s ease-in-out',
              }}
              placeholder="输入起点"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1976D2'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
            />
            <input
              style={{
                width: 300,
                height: 44,
                borderRadius: 12,
                border: '2px solid #E0E0E0',
                padding: '0 16px',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.3s ease-in-out',
              }}
              placeholder="输入终点"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1976D2'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E0E0E0'; }}
            />
            <button
              style={{
                width: 160,
                height: 48,
                borderRadius: 24,
                border: 'none',
                background: 'linear-gradient(90deg, #FF6F00, #FFB300)',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                filter: hoverPlan ? 'brightness(1.1)' : 'none',
              }}
              onMouseEnter={() => setHoverPlan(true)}
              onMouseLeave={() => setHoverPlan(false)}
              onClick={handlePlan}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              规划路线
            </button>
          </div>
        </header>

        <div className="app-main-content" style={{ display: 'flex', padding: 24, gap: 24, position: 'relative' }}>
          <div className="app-map-container" style={{ flex: 1, minWidth: 0 }}>
            <MapView
              routes={routes}
              selectedRouteId={selectedRouteId}
              alerts={alerts}
              onStartSelect={(lat, lng) => setStartCoord({ lat, lng })}
              onEndSelect={(lat, lng) => setEndCoord({ lat, lng })}
            />

            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1A237E', marginBottom: 16 }}>路线建议</div>
              <div className="app-route-cards" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {routes.map((route) => {
                  const isSelected = route.id === selectedRouteId;
                  const isHovered = route.id === hoverCard;
                  return (
                    <div
                      key={route.id}
                      className="app-route-card"
                      style={{
                        width: '100%',
                        height: 120,
                        background: '#FFFFFF',
                        borderRadius: 12,
                        borderLeft: `6px solid ${route.color}`,
                        padding: '0 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease-in-out',
                        boxShadow: isSelected
                          ? '0 6px 20px rgba(0,0,0,0.18)'
                          : isHovered
                            ? '0 6px 20px rgba(0,0,0,0.15)'
                            : '0 2px 8px rgba(0,0,0,0.08)',
                        transform: isHovered ? 'translateY(-4px)' : 'none',
                      }}
                      onClick={() => setSelectedRouteId(route.id)}
                      onMouseEnter={() => setHoverCard(route.id)}
                      onMouseLeave={() => setHoverCard(null)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 600, color: '#1A237E' }}>{route.name}</span>
                          {route.isRecommended && (
                            <span style={{ background: '#FFF3E0', color: '#FF6F00', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>
                              推荐
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 14, color: '#666', marginTop: 6 }}>
                          {route.distance}km · {route.duration}分钟
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: getCongestionColor(route.congestionIndex), display: 'inline-block', marginRight: 6 }} />
                          <span style={{ fontSize: 28, fontWeight: 700, color: '#333' }}>{route.congestionIndex}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>拥堵指数</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <WeatherAlertPanel alerts={alerts} />
        </div>

        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid #FFF',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}
      </div>
    </>
  );
};

export default App;

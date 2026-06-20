import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RouteCard from '../components/RouteCard';
import { Route } from '../types';

const HomePage = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes');
      if (response.ok) {
        const data = await response.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error('获取路线列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = (routeId: string) => {
    console.log('标记跑步路线:', routeId);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: '32px',
        background: 'var(--bg-primary)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '48px',
            animation: 'fadeIn 0.6s ease',
          }}
        >
          <h1
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '12px',
              background:
                'linear-gradient(135deg, var(--accent-primary) 0%, #00cc6a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🌙 发现安全的夜跑路线
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              marginBottom: '24px',
            }}
          >
            共享你的路线，让每个夜晚的奔跑都安心无忧
          </p>
          <button
            onClick={() => navigate('/map')}
            style={{
              padding: '14px 32px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-primary)',
              color: 'var(--bg-primary)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow =
                '0 0 20px rgba(0, 255, 136, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🗺️ 前往地图绘制路线
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            🔥 推荐路线
          </h2>
          <span
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            共 {routes.length} 条路线 · 按安全评级排序
          </span>
        </div>

        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="glass-card"
                style={{
                  height: '160px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
              gap: '24px',
            }}
          >
            {routes.map((route, index) => (
              <div
                key={route.id}
                style={{
                  animation: `slideIn 0.4s ease ${index * 0.1}s both`,
                }}
              >
                <RouteCard route={route} onRunClick={handleRunClick} />
              </div>
            ))}
          </div>
        )}

        {!loading && routes.length === 0 && (
          <div
            className="glass-card"
            style={{
              padding: '60px',
              textAlign: 'center',
              animation: 'fadeIn 0.4s ease',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏃‍♂️</div>
            <h3
              style={{
                fontSize: '20px',
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              还没有路线
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                marginBottom: '24px',
              }}
            >
              成为第一个分享夜跑路线的人吧！
            </p>
            <button
              onClick={() => navigate('/map')}
              style={{
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              绘制第一条路线
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

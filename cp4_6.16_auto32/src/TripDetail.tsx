import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useTravelStore } from './store';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import PhotoTimeline from './PhotoTimeline';
import MapView from './MapView';
import StatsPanel from './StatsPanel';

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const trip = useTravelStore((s) => s.getTripById(id || ''));
  const photos = useTravelStore((s) => s.getPhotosByTripId(id || ''));
  const hydrating = useTravelStore((s) => s.hydrating);
  const hydrationError = useTravelStore((s) => s.hydrationError);
  const retryCount = useTravelStore((s) => s.retryCount);
  const initFromIDB = useTravelStore((s) => s.initFromIDB);
  const retryHydration = useTravelStore((s) => s.retryHydration);
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    void initFromIDB();
  }, [initFromIDB]);

  if (hydrating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '16px' }}>
        <div className="spinner" />
        <div style={{ color: '#a0a0c0', fontSize: '14px' }}>
          {retryCount > 0
            ? `正在恢复数据... (第 ${retryCount + 1} 次尝试)`
            : '正在加载数据...'}
        </div>
      </div>
    );
  }

  if (hydrationError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '24px', padding: '24px' }}>
        <div style={{ fontSize: '64px' }}>⚠️</div>
        <div
          style={{
            maxWidth: '480px',
            padding: '28px',
            backgroundColor: '#2d2d44',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
          }}
        >
          <h2 style={{ fontSize: '20px', color: '#e0e0ff', marginBottom: '12px' }}>
            数据加载失败
          </h2>
          <p style={{ fontSize: '14px', color: '#a0a0c0', marginBottom: '24px' }}>
            {hydrationError}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #3d3d5c',
              color: '#e0e0ff',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3d3d5c')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              返回首页
            </Link>
            <button
              onClick={() => void retryHydration()}
              style={{
                background: btnHover
                  ? 'linear-gradient(135deg, #6c5ce7 0%, #b1a9ff 100%)'
                  : 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'filter 0.2s',
                filter: btnHover ? 'brightness(1.15)' : 'brightness(1)'
              }}
              onMouseEnter={() => setBtnHover(true)}
              onMouseLeave={() => setBtnHover(false)}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return <Navigate to="/" replace />;
  }

  const backButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#2d2d44',
    color: '#e0e0ff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    border: '1px solid #3d3d5c'
  };

  const headerCardStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #2d2d44 0%, #3d3d64 100%)',
    borderRadius: '16px',
    padding: '32px',
    marginBottom: '28px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      <Link to="/" style={backButtonStyle} className="back-btn">
        ← 返回行程列表
      </Link>

      <div style={headerCardStyle}>
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108, 92, 231, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#e0e0ff', lineHeight: 1.2 }}>
                  {trip.name}
                </h1>
                <span
                  style={{
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'white'
                  }}
                >
                  ✈️ 旅行中
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0a0c0' }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <span style={{ fontSize: '15px' }}>{trip.destinationCity}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0a0c0' }}>
                  <span style={{ fontSize: '18px' }}>📅</span>
                  <span style={{ fontSize: '15px' }}>
                    {format(new Date(trip.startDate), 'yyyy年M月d日', { locale: zhCN })} —{' '}
                    {format(new Date(trip.endDate), 'M月d日', { locale: zhCN })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0a0c0' }}>
                  <span style={{ fontSize: '18px' }}>📷</span>
                  <span style={{ fontSize: '15px' }}>{photos.length} 张照片</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: '28px'
        }}
        className="trip-grid"
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#e0e0ff', marginBottom: '16px' }}>
              🗺️ 旅行轨迹地图
            </h2>
            <MapView photos={photos} />
          </div>
          <PhotoTimeline tripId={trip.id} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ position: 'sticky', top: '24px' }}>
            <StatsPanel trip={trip} photos={photos} />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .trip-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .back-btn {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }
          .trip-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
        .back-btn:hover {
          border-color: #6c5ce7 !important;
          color: #a29bfe !important;
          transform: translateX(-2px);
        }
      `}</style>
    </div>
  );
}

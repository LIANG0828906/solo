import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Plus, Compass, Mountain } from 'lucide-react';
import { useSocialStore } from '@/modules/social';
import { TrailCard } from '@/modules/social/components/TrailCard';
import { Trail } from '@/shared/types';

export default function Home() {
  const navigate = useNavigate();
  const { trails, loading, loadAllTrails, likeTrail, likeAnimation } = useSocialStore();
  const [showEmpty, setShowEmpty] = useState(false);

  useEffect(() => {
    loadAllTrails();
  }, [loadAllTrails]);

  useEffect(() => {
    if (!loading && trails.length === 0) {
      const timer = setTimeout(() => setShowEmpty(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, trails.length]);

  const handleTrailClick = (trail: Trail) => {
    navigate(`/map?trailId=${trail.id}`);
  };

  const handleStartRecord = () => {
    navigate('/map');
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <div className="logo">
            <Mountain size={32} />
            <h1>TrailScope</h1>
          </div>
          <p className="tagline">探索山野，记录足迹</p>
        </div>
      </header>

      <main className="home-main">
        <div className="action-bar">
          <button className="record-btn primary" onClick={handleStartRecord}>
            <Plus size={20} />
            开始记录
          </button>
          <button className="record-btn secondary" onClick={() => navigate('/map')}>
            <Map size={20} />
            查看地图
          </button>
        </div>

        <section className="trails-section">
          <div className="section-header">
            <h2>
              <Compass size={20} />
              轨迹广场
            </h2>
            <span className="trail-count">{trails.length} 条轨迹</span>
          </div>

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>加载中...</p>
            </div>
          )}

          {!loading && trails.length > 0 && (
            <div className="trail-grid">
              {trails.map(trail => (
                <TrailCard
                  key={trail.id}
                  trail={trail}
                  isLikedAnimating={likeAnimation === trail.id}
                  onLike={() => likeTrail(trail.id)}
                  onClick={() => handleTrailClick(trail)}
                />
              ))}
            </div>
          )}

          {!loading && trails.length === 0 && showEmpty && (
            <div className="empty-state">
              <Mountain size={64} />
              <h3>还没有轨迹</h3>
              <p>点击"开始记录"，创建你的第一条登山轨迹吧！</p>
              <button className="record-btn primary" onClick={handleStartRecord}>
                <Plus size={20} />
                开始记录
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

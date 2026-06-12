import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import './HomePage.css';

interface BoothRanking {
  id: string;
  name: string;
  description: string;
  visit_count: number;
  total_favorites: number;
  cover_image: string | null;
  primary_color: string;
}

function HomePage() {
  const [booths, setBooths] = useState<BoothRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [setUser]);

  useEffect(() => {
    fetchRanking();
    const interval = setInterval(fetchRanking, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRanking = async () => {
    try {
      const res = await fetch('/api/booths/ranking');
      const data = await res.json();
      setBooths(data);
    } catch (err) {
      console.error('Failed to fetch ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankingStyle = (index: number) => {
    if (index === 0) return { border: '3px solid #FFD700', boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)' };
    if (index === 1) return { border: '3px solid #C0C0C0', boxShadow: '0 4px 20px rgba(192, 192, 192, 0.3)' };
    if (index === 2) return { border: '3px solid #CD7F32', boxShadow: '0 4px 20px rgba(205, 127, 50, 0.3)' };
    return {};
  };

  const getRankingBadge = (index: number) => {
    if (index === 0) return { text: '🥇', color: '#FFD700' };
    if (index === 1) return { text: '🥈', color: '#C0C0C0' };
    if (index === 2) return { text: '🥉', color: '#CD7F32' };
    return { text: `#${index + 1}`, color: '#999' };
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="header-content">
          <div className="logo">🎪 虚拟展位</div>
          <div className="header-actions">
            {user ? (
              <>
                <span className="user-info">👋 {user.username}</span>
                <button className="btn-secondary" onClick={handleLogout}>退出</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">登录</Link>
                <Link to="/register" className="btn-primary">注册</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-section">
          <h1 className="hero-title">🎨 发现手工创作者的精彩作品</h1>
          <p className="hero-subtitle">浏览虚拟展位，与创作者实时交流，发现独特的手工艺品</p>
        </section>

        <section className="ranking-section">
          <div className="section-header">
            <h2 className="section-title">🔥 热度排行</h2>
            <span className="refresh-info">每5分钟自动刷新</span>
          </div>

          {loading ? (
            <div className="loading">加载中...</div>
          ) : (
            <div className="ranking-grid">
              {booths.map((booth, index) => (
                <Link
                  key={booth.id}
                  to={`/exhibit/${booth.id}`}
                  className="booth-card"
                  style={{
                    ...getRankingStyle(index),
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="ranking-badge" style={{ color: getRankingBadge(index).color }}>
                    {getRankingBadge(index).text}
                  </div>
                  
                  <div className="booth-cover" style={{ backgroundColor: booth.primary_color + '20' }}>
                    {booth.cover_image ? (
                      <img src={booth.cover_image} alt={booth.name} />
                    ) : (
                      <span className="booth-icon">🎪</span>
                    )}
                  </div>

                  <div className="booth-info">
                    <h3 className="booth-name">{booth.name}</h3>
                    <p className="booth-desc">{booth.description}</p>
                    <div className="booth-stats">
                      <span className="stat">👁 {booth.visit_count}</span>
                      <span className="stat">❤️ {booth.total_favorites || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default HomePage;

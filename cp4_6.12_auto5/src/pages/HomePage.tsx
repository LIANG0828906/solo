import { Link } from 'react-router-dom';

interface Props {
  isAdmin: boolean;
}

export default function HomePage({ isAdmin }: Props) {
  return (
    <div>
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">🌱 让绿色走进生活</h1>
          <p className="hero-subtitle">
            专业植物租赁服务，为您的空间增添生机与活力
          </p>
          <div className="hero-actions">
            <Link to="/plants" className="btn btn-primary btn-lg">
              浏览植物
            </Link>
            {!isAdmin && (
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => window.location.href = '/?admin=1'}
              >
                管理后台入口
              </button>
            )}
          </div>
        </div>
        <div className="hero-image">
          <div className="hero-gradient"></div>
          <span className="hero-emoji">🪴🌿🍀</span>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">我们的服务</h2>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon">🌿</div>
            <h3>精选植物</h3>
            <p>绿萝、龟背竹、琴叶榕等多种热门绿植，专业养护</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">📦</div>
            <h3>灵活租赁</h3>
            <p>一个月、三个月、半年多种租期，长租更享优惠</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">🚚</div>
            <h3>送货上门</h3>
            <p>专业配送，确保植物安全到达您的手中</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon">💧</div>
            <h3>养护指导</h3>
            <p>提供专业养护建议，让您的植物始终健康</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="cta-content">
          <h2>准备好为您的空间增添一抹绿意了吗？</h2>
          <Link to="/plants" className="btn btn-primary btn-lg">
            立即开始租赁 →
          </Link>
        </div>
      </div>
    </div>
  );
}

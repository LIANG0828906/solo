import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import BatchCreator from '@/modules/batch/BatchCreator';
import BatchDetail from '@/modules/batch/BatchDetail';
import TasteWheel from '@/modules/taste/TasteWheel';
import CommunityList from '@/modules/community/CommunityList';
import CommunityDetail from '@/modules/community/CommunityDetail';

function NavBar() {
  const location = useLocation();

  const links = [
    { to: '/', label: '首页' },
    { to: '/batch/new', label: '新建批次' },
    { to: '/taste', label: '风味品鉴' },
    { to: '/community', label: '社区' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">☕ 咖啡烘焙模拟器</Link>
      </div>
      <div className="navbar-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <h1>☕ 咖啡烘焙模拟器</h1>
        <p>探索咖啡烘焙的艺术，记录每一次烘焙旅程，分享你的风味发现</p>
      </section>
      <div className="feature-cards">
        <Link to="/batch/new" className="feature-card">
          <div className="feature-card-icon">🔥</div>
          <h2>新建批次</h2>
          <p>创建新的烘焙批次，记录烘焙曲线与温度数据</p>
        </Link>
        <Link to="/taste" className="feature-card">
          <div className="feature-card-icon">🎯</div>
          <h2>风味品鉴</h2>
          <p>使用风味轮标注和品鉴你的咖啡风味</p>
        </Link>
        <Link to="/community" className="feature-card">
          <div className="feature-card-icon">🌍</div>
          <h2>社区</h2>
          <p>浏览和分享公开的烘焙批次，交流心得</p>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/batch/new" element={<BatchCreator />} />
          <Route path="/batch/:id" element={<BatchDetail />} />
          <Route path="/taste" element={<TasteWheel />} />
          <Route path="/community" element={<CommunityList />} />
          <Route path="/community/:id" element={<CommunityDetail />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

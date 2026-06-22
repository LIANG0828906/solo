import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ArtistUpload from './modules/artist/ArtistUpload';
import CuratorLayout from './modules/curator/CuratorLayout';
import GalleryScene from './modules/gallery/GalleryScene';
import OrderPage from './modules/order/OrderPage';
import AdminPanel from './modules/admin/AdminPanel';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { key: 'gallery', label: '展厅漫游', path: '/' },
    { key: 'artist', label: '艺术家上传', path: '/artist' },
    { key: 'curator', label: '策展人布展', path: '/curator' },
    { key: 'orders', label: '订单管理', path: '/orders' },
    { key: 'admin', label: '审核', path: '/admin' },
  ];

  const isGalleryPage = location.pathname === '/';

  return (
    <div className="app-container">
      {!isGalleryPage && (
        <nav className="nav-bar">
          <div className="nav-logo">虚拟画廊</div>
          <div className="nav-links">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<GalleryScene />} />
          <Route path="/artist" element={<ArtistUpload />} />
          <Route path="/curator" element={<CuratorLayout />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

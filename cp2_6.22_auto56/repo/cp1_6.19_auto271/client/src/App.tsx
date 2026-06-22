import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import { photoApi, orderApi } from './api';
import PhotoGallery from './components/PhotoGallery';
import PhotoEditor from './components/PhotoEditor';
import OrderSummary from './components/OrderSummary';
import AdminPage from './pages/AdminPage';
type TabMode = 'all' | 'favorites';

function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<TabMode>('all');

  const {
    photos,
    setPhotos,
    addPhotos,
    cart,
    isEditorOpen,
    isOrderOpen,
    openOrder,
    closeOrder,
    loading,
    setLoading,
    setOrders,
    favoriteIds
  } = useAppStore();

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [fetchedPhotos, fetchedOrders] = await Promise.all([
          photoApi.getAll(),
          orderApi.getAll()
        ]);
        setPhotos(fetchedPhotos);
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('加载数据失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setPhotos, setOrders, setLoading]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const validFiles = files.filter(f => {
      const sizeOk = f.size <= 5 * 1024 * 1024;
      const typeOk = /\.(jpg|jpeg|png)$/i.test(f.name) || ['image/jpeg', 'image/png'].includes(f.type);
      if (!sizeOk) showToast(`文件 ${f.name} 超过 5MB，已跳过`, 'error');
      if (!typeOk) showToast(`文件 ${f.name} 格式不支持，已跳过`, 'error');
      return sizeOk && typeOk;
    });

    if (validFiles.length === 0) return;

    setLoading(true);
    try {
      const startTime = Date.now();
      const uploaded = await photoApi.upload(validFiles);
      addPhotos(uploaded);
      const elapsed = Date.now() - startTime;
      showToast(`成功上传 ${uploaded.length} 张照片（${elapsed}ms）`);
    } catch (err) {
      console.error('上传失败:', err);
      showToast('上传失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  }, [addPhotos, setLoading, showToast]);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">
            <span className="navbar-logo-icon">🐾</span>
            萌宠摄影
          </div>

          <div className="navbar-nav">
            {!isAdminPage ? (
              <>
                <button
                  className={`navbar-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  全部照片 ({photos.length})
                </button>
                <button
                  className={`navbar-link ${activeTab === 'favorites' ? 'active' : ''}`}
                  onClick={() => setActiveTab('favorites')}
                >
                  我的收藏 ({favoriteIds.size})
                </button>
                <button className="navbar-link" onClick={() => window.location.href = '/admin'}>
                  📋 订单管理
                </button>
                <button className="navbar-cart-btn" onClick={openOrder}>
                  🛒 购物车
                  {totalCartItems > 0 && (
                    <span className="navbar-cart-count">{totalCartItems}</span>
                  )}
                </button>
              </>
            ) : (
              <button className="navbar-link" onClick={() => window.location.href = '/'}>
                ← 返回首页
              </button>
            )}
          </div>

          <button
            className="hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="菜单"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        {!isAdminPage && (
          <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <button
              className={`navbar-link ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setMobileMenuOpen(false); }}
            >
              全部照片 ({photos.length})
            </button>
            <button
              className={`navbar-link ${activeTab === 'favorites' ? 'active' : ''}`}
              onClick={() => { setActiveTab('favorites'); setMobileMenuOpen(false); }}
            >
              我的收藏 ({favoriteIds.size})
            </button>
            <button className="navbar-link" onClick={() => window.location.href = '/admin'}>
              📋 订单管理
            </button>
            <button className="navbar-cart-btn" onClick={() => { openOrder(); setMobileMenuOpen(false); }}>
              🛒 购物车 ({totalCartItems})
            </button>
          </div>
        )}
      </nav>

      <main className="main-content">
        <div className="content-wrapper">
          <Routes>
            <Route
              path="/"
              element={
                <PhotoGallery
                  activeTab={activeTab}
                  onUpload={handleUpload}
                  showToast={showToast}
                />
              }
            />
            <Route
              path="/admin"
              element={<AdminPage showToast={showToast} />}
            />
          </Routes>
        </div>
      </main>

      {isEditorOpen && <PhotoEditor showToast={showToast} />}
      {isOrderOpen && <OrderSummary onClose={closeOrder} showToast={showToast} />}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;

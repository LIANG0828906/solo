import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Package, ShoppingCart, BarChart3, AlertTriangle, Menu, X } from 'lucide-react';
import InventoryPanel from './components/InventoryPanel';
import SalesCounter from './components/SalesCounter';
import SalesReport from './components/SalesReport';
import { api, Product } from './services/api';

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<string>('全部');
  const [alertCount, setAlertCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const categories = ['全部', '饮料', '零食', '日用品'];

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [currentCategory]);

  async function loadAlerts() {
    try {
      const alerts = await api.getAlertProducts();
      setAlertCount(alerts.length);
    } catch (e) {
      console.error('加载预警失败', e);
    }
  }

  async function loadProducts() {
    try {
      const data = await api.getProducts({ category: currentCategory });
      setProducts(data);
    } catch (e) {
      console.error('加载商品失败', e);
    }
  }

  const navItems = [
    { to: '/', label: '库存管理', icon: Package },
    { to: '/sales', label: '销售收银', icon: ShoppingCart },
    { to: '/reports', label: '销售报表', icon: BarChart3 }
  ];

  return (
    <Router>
      <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
        <nav
          className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between"
          style={{ background: 'var(--wood-dark)' }}
        >
          <div className="flex items-center gap-3">
            <Package style={{ color: '#FAF5EE', width: 28, height: 28 }} />
            <h1
              className="text-xl font-bold hidden md:block"
              style={{ color: '#FAF5EE', fontFamily: "'Playfair Display', serif" }}
            >
              杂货店管理系统
            </h1>
          </div>

          <div className="nav-desktop flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon style={{ width: 18, height: 18 }} />
                <span>{item.label}</span>
                {item.to === '/' && alertCount > 0 && (
                  <span
                    className="animate-badge-blink"
                    style={{
                      background: 'var(--alert-red)',
                      color: '#fff',
                      borderRadius: '50%',
                      minWidth: 20,
                      height: 20,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    {alertCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <button
            className="hamburger-menu p-2 rounded"
            style={{ color: '#FAF5EE' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>

          {mobileMenuOpen && (
            <div className="nav-mobile">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon style={{ width: 18, height: 18 }} />
                  <span>{item.label}</span>
                  {item.to === '/' && alertCount > 0 && (
                    <span
                      className="animate-badge-blink"
                      style={{
                        background: 'var(--alert-red)',
                        color: '#fff',
                        borderRadius: '50%',
                        minWidth: 20,
                        height: 20,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      {alertCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <main className="pt-24 pb-8 px-4 md:px-8 max-w-7xl mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <InventoryPanel
                  currentCategory={currentCategory}
                  setCurrentCategory={setCurrentCategory}
                  categories={categories}
                  products={products}
                  refreshProducts={loadProducts}
                  refreshAlerts={loadAlerts}
                />
              }
            />
            <Route path="/sales" element={<SalesCounter products={products} refreshProducts={loadProducts} refreshAlerts={loadAlerts} />} />
            <Route path="/reports" element={<SalesReport />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

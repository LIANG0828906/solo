import React, { useState, useEffect, createContext, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { familyApi } from './api';
import type { Family } from './types';
import Dashboard from './components/Dashboard';
import InventoryPanel from './components/InventoryPanel';
import SupplySuggestions from './components/SupplySuggestions';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

export const ToastContext = createContext<(msg: string, type?: 'success' | 'error') => void>(() => {});

const App: React.FC = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    familyApi.getAll().then((data) => {
      setFamilies(data);
      const lastId = localStorage.getItem('lastFamilyId');
      if (lastId) {
        const found = data.find((f) => f.id === lastId);
        if (found) setCurrentFamily(found);
      }
    });
  }, []);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const handleFamilyChange = (family: Family) => {
    setCurrentFamily(family);
    localStorage.setItem('lastFamilyId', family.id);
  };

  const handleAddFamily = async (name: string, loc: string) => {
    try {
      const family = await familyApi.create({ name, location: loc });
      setFamilies((prev) => [...prev, family]);
      setCurrentFamily(family);
      localStorage.setItem('lastFamilyId', family.id);
      showToast('家庭创建成功');
    } catch {
      showToast('创建失败', 'error');
    }
  };

  const navItems = [
    { path: '/', label: '仪表盘', icon: '📊' },
    { path: '/inventory', label: '库存管理', icon: '📦' },
    { path: '/supply', label: '补给建议', icon: '🛒' },
  ];

  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyLocation, setNewFamilyLocation] = useState('');

  return (
    <ToastContext.Provider value={showToast}>
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <h1 className="app-title">🏠 家庭物资管家</h1>
          </div>
          <div className="header-center">
            <div className="family-selector">
              <select
                value={currentFamily?.id || ''}
                onChange={(e) => {
                  const f = families.find((f) => f.id === e.target.value);
                  if (f) handleFamilyChange(f);
                }}
              >
                <option value="">选择家庭</option>
                {families.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} - {f.location}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-sm"
                onClick={() => setShowAddFamily(!showAddFamily)}
              >
                + 新建
              </button>
            </div>
            {showAddFamily && (
              <div className="add-family-form">
                <input
                  placeholder="家庭名称"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                />
                <input
                  placeholder="位置"
                  value={newFamilyLocation}
                  onChange={(e) => setNewFamilyLocation(e.target.value)}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (newFamilyName.trim()) {
                      handleAddFamily(newFamilyName.trim(), newFamilyLocation.trim());
                      setNewFamilyName('');
                      setNewFamilyLocation('');
                      setShowAddFamily(false);
                    }
                  }}
                >
                  创建
                </button>
              </div>
            )}
          </div>
          <nav className="header-nav">
            {navItems.map((item) => (
              <button
                key={item.path}
                className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <main className="app-main">
          {currentFamily ? (
            <Routes>
              <Route path="/" element={<Dashboard family={currentFamily} />} />
              <Route path="/inventory" element={<InventoryPanel family={currentFamily} />} />
              <Route path="/supply" element={<SupplySuggestions family={currentFamily} />} />
            </Routes>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏠</div>
              <h2>欢迎使用家庭物资管家</h2>
              <p>请先创建或选择一个家庭开始使用</p>
            </div>
          )}
        </main>

        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.type === 'success' ? '✅' : '❌'} {toast.text}
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default App;

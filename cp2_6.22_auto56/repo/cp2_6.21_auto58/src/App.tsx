import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { InventoryPage } from './pages/InventoryPage';
import { ShoppingListPage } from './pages/ShoppingListPage';

const COLORS = {
  bg: '#F5E6CC',
  text: '#4A2F1A',
  primary: '#4A2F1A',
  border: '#D4B896',
};

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to));
  return (
    <Link to={to} style={{
      color: 'white', textDecoration: 'none', padding: '12px 20px',
      fontWeight: active ? 700 : 500,
      borderBottom: active ? '3px solid #F5E6CC' : '3px solid transparent',
      transition: 'all 0.2s', fontSize: '15px',
    }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {children}
    </Link>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg }}>
      <nav style={{
        background: COLORS.primary, color: 'white', padding: '0 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '22px', marginRight: '20px' }}>🍲</span>
          <NavLink to="/">🏠 首页</NavLink>
          <NavLink to="/recipes">📖 菜谱管理</NavLink>
          <NavLink to="/inventory">📦 食材库存</NavLink>
          <NavLink to="/shopping">🛒 购物清单</NavLink>
        </div>
      </nav>
      <div style={{
        background: 'linear-gradient(135deg, #FFE4B5 0%, #F5DEB3 50%, #F5E6CC 100%)',
        padding: '36px 24px 28px', textAlign: 'center', borderBottom: `3px solid ${COLORS.border}`,
        boxShadow: 'inset 0 -4px 8px rgba(74,47,26,0.08)',
      }}>
        <h1 style={{
          margin: 0, fontSize: '44px', fontWeight: 800, color: COLORS.primary,
          letterSpacing: '4px', textShadow: '2px 2px 4px rgba(74,47,26,0.15)',
          fontFamily: "'Quicksand', sans-serif",
        }}>🍳 温馨厨房 🍳</h1>
        <p style={{ margin: '10px 0 0', color: '#6B4423', fontSize: '16px', fontStyle: 'italic' }}>~ 让每一餐都充满爱与温暖 ~</p>
      </div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/shopping" element={<ShoppingListPage />} />
      </Routes>
    </div>
  );
}

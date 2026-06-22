import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useRecipeStore } from '../store/recipeStore';
import { Recipe } from '../types';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const favorites = useRecipeStore((state) => state.favorites);
  const recipes = useRecipeStore((state) => state.recipes);

  const favoriteRecipes: Recipe[] = favorites
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .map((f) => recipes.find((r) => r.id === f.recipeId))
    .filter((r): r is Recipe => r !== undefined);

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/list', label: '采购清单', icon: '🛒' },
    { path: '/history', label: '浏览历史', icon: '📜' },
  ];

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    width: '240px',
    background: 'linear-gradient(180deg, var(--color-sidebar-start), var(--color-sidebar-end))',
    color: 'var(--color-text-white)',
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
    transition: 'transform var(--transition-normal)',
    transform: isOpen ? 'translateX(0)' : 'translateX(0)',
    overflowY: 'auto',
  };

  const mobileStyle: React.CSSProperties = window.innerWidth <= 1024
    ? {
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: isOpen ? 'var(--shadow-xl)' : 'none',
      }
    : {};

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 200,
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-card)',
          boxShadow: 'var(--shadow-md)',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '20px',
          ...(window.innerWidth <= 1024 ? { display: 'flex' } : {}),
        }}
        className="hover-scale"
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {isOpen && window.innerWidth <= 1024 && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.3)',
            zIndex: 99,
          }}
        />
      )}

      <aside style={{ ...sidebarStyle, ...mobileStyle }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '20px',
              fontWeight: 700,
            }}
          >
            <span style={{ fontSize: '28px' }}>🍳</span>
            <span>RecipeRadar</span>
          </Link>
        </div>

        <nav style={{ padding: '16px 12px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '4px',
                  fontWeight: isActive ? 600 : 400,
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '12px 20px', marginTop: '8px' }}>
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              opacity: 0.7,
              marginBottom: '12px',
              letterSpacing: '0.5px',
            }}
          >
            ⭐ 我的收藏 ({favoriteRecipes.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {favoriteRecipes.length === 0 ? (
              <p style={{ fontSize: '13px', opacity: 0.5, padding: '4px 0' }}>暂无收藏</p>
            ) : (
              favoriteRecipes.slice(0, 8).map((recipe) => (
                <Link
                  key={recipe.id}
                  to={`/recipe/${recipe.id}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{recipe.emoji.split('')[0]}</span>
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {recipe.name}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: 'auto', padding: '20px', textAlign: 'center', opacity: 0.5, fontSize: '12px' }}>
          RecipeRadar v1.0
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

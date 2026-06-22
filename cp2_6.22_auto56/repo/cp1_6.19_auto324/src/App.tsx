
import React, { useState } from 'react'
import { create } from 'zustand'
import { motion, AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import RecipeDetail from './pages/RecipeDetail'

interface User {
  id: string
  name: string
  avatar: string
}

interface AppState {
  currentUser: User
  favorites: string[]
  currentPage: 'home' | 'detail'
  selectedRecipeId: string | null
  showUserMenu: boolean
  showMobileMenu: boolean
  toggleFavorite: (recipeId: string) => void
  navigateToDetail: (recipeId: string) => void
  navigateToHome: () => void
  setShowUserMenu: (show: boolean) => void
  setShowMobileMenu: (show: boolean) => void
}

const useAppStore = create<AppState>((set) => ({
  currentUser: { id: 'u1', name: '厨神小王', avatar: '👨‍🍳' },
  favorites: ['r1', 'r3'],
  currentPage: 'home',
  selectedRecipeId: null,
  showUserMenu: false,
  showMobileMenu: false,
  toggleFavorite: (recipeId) =>
    set((state) => ({
      favorites: state.favorites.includes(recipeId)
        ? state.favorites.filter((id) => id !== recipeId)
        : [...state.favorites, recipeId],
    })),
  navigateToDetail: (recipeId) =>
    set({ currentPage: 'detail', selectedRecipeId: recipeId, showUserMenu: false, showMobileMenu: false }),
  navigateToHome: () =>
    set({ currentPage: 'home', selectedRecipeId: null, showUserMenu: false, showMobileMenu: false }),
  setShowUserMenu: (show) => set({ showUserMenu: show }),
  setShowMobileMenu: (show) => set({ showMobileMenu: show }),
}))

const recipes = [
  { id: 'r1', title: '红烧肉', author: '厨神小王' },
  { id: 'r2', title: '宫保鸡丁', author: '美食达人' },
  { id: 'r3', title: '麻婆豆腐', author: '川菜大师' },
]

function App() {
  const [search, setSearch] = useState('')
  const {
    currentUser,
    favorites,
    currentPage,
    selectedRecipeId,
    showUserMenu,
    showMobileMenu,
    toggleFavorite,
    navigateToDetail,
    navigateToHome,
    setShowUserMenu,
    setShowMobileMenu,
  } = useAppStore()

  const favoriteRecipes = recipes.filter((r) => favorites.includes(r.id))

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
            'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
          background-color: #FFF8E1;
          color: #333;
          line-height: 1.6;
        }

        .app-container {
          min-height: 100vh;
          background-color: #FFF8E1;
        }

        .navbar {
          background-color: #E65100;
          color: white;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .logo {
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s ease-out;
        }

        .logo:hover {
          opacity: 0.85;
        }

        .search-box {
          flex: 0 1 400px;
          margin: 0 24px;
        }

        .search-box input {
          width: 100%;
          padding: 10px 16px;
          border: none;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          background: rgba(255, 255, 255, 0.95);
          transition: box-shadow 0.2s ease-out, background 0.2s ease-out;
        }

        .search-box input:focus {
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
          background: white;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          position: relative;
          transition: background 0.2s ease-out, transform 0.2s ease-out;
          user-select: none;
        }

        .user-avatar:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.05);
        }

        .user-menu {
          position: absolute;
          top: 56px;
          right: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 260px;
          overflow: hidden;
          z-index: 200;
        }

        .user-menu-header {
          padding: 16px;
          background: #FFF3E0;
          border-bottom: 1px solid #FFE0B2;
        }

        .user-menu-title {
          font-weight: 600;
          color: #E65100;
          font-size: 14px;
        }

        .favorite-item {
          padding: 12px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.2s ease-out;
          border-bottom: 1px solid #F5F5F5;
        }

        .favorite-item:last-child {
          border-bottom: none;
        }

        .favorite-item:hover {
          background: #FFF8E1;
        }

        .favorite-item-icon {
          font-size: 20px;
          color: #E65100;
        }

        .favorite-item-info {
          flex: 1;
        }

        .favorite-item-title {
          font-weight: 500;
          font-size: 14px;
          color: #333;
        }

        .favorite-item-author {
          font-size: 12px;
          color: #999;
        }

        .empty-favorites {
          padding: 24px 16px;
          text-align: center;
          color: #999;
          font-size: 14px;
        }

        .hamburger-btn {
          display: none;
          width: 40px;
          height: 40px;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 22px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease-out;
        }

        .hamburger-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .mobile-menu {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: #E65100;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 150;
        }

        .mobile-search {
          margin-bottom: 16px;
        }

        .mobile-search input {
          width: 100%;
          padding: 10px 16px;
          border: none;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          background: rgba(255, 255, 255, 0.95);
        }

        .mobile-ranking {
          background: white;
          border-radius: 8px;
          padding: 12px;
        }

        .ranking-title {
          font-weight: 600;
          color: #E65100;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .ranking-item {
          padding: 8px 0;
          border-bottom: 1px solid #F5F5F5;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s ease-out;
        }

        .ranking-item:last-child {
          border-bottom: none;
        }

        .ranking-item:hover {
          background: #FFF8E1;
          margin: 0 -12px;
          padding: 8px 12px;
        }

        .ranking-num {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: #FFE0B2;
          color: #E65100;
          font-weight: bold;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-content {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        @keyframes skeleton-pulse {
          0% {
            background-color: #E0E0E0;
          }
          50% {
            background-color: #F5F5F5;
          }
          100% {
            background-color: #E0E0E0;
          }
        }

        .skeleton {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
          border-radius: 4px;
        }

        .card {
          background: white;
          border-radius: 2px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease-out, box-shadow 0.3s ease-out;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .waterfall {
          column-count: 3;
          column-gap: 20px;
        }

        .waterfall-item {
          break-inside: avoid;
          margin-bottom: 20px;
        }

        @media (max-width: 1024px) and (min-width: 769px) {
          .waterfall {
            column-count: 2;
          }
        }

        @media (max-width: 768px) {
          .navbar {
            padding: 0 16px;
          }

          .search-box {
            display: none;
          }

          .hamburger-btn {
            display: flex;
          }

          .waterfall {
            column-count: 1;
          }

          .page-content {
            padding: 16px;
          }

          .user-menu {
            right: 16px;
            min-width: 240px;
          }
        }

        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 99;
        }
      `}</style>

      <div className="app-container">
        <nav className="navbar">
          <div className="logo" onClick={navigateToHome}>
            <span>🍳</span>
            <span>共享食光</span>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="搜索食谱、食材或作者..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="nav-right">
            <button
              className="hamburger-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? '✕' : '☰'}
            </button>

            <div
              className="user-avatar"
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowMobileMenu(false)
              }}
            >
              {currentUser.avatar}
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div
                className="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowMobileMenu(false)}
                style={{ zIndex: 149 }}
              />
              <motion.div
                className="mobile-menu"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="mobile-search">
                  <input
                    type="text"
                    placeholder="搜索食谱、食材或作者..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="mobile-ranking">
                  <div className="ranking-title">🔥 热门排行</div>
                  {recipes.map((r, idx) => (
                    <div
                      key={r.id}
                      className="ranking-item"
                      onClick={() => navigateToDetail(r.id)}
                    >
                      <span className="ranking-num">{idx + 1}</span>
                      <span style={{ fontSize: 14 }}>{r.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showUserMenu && (
            <>
              <motion.div
                className="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowUserMenu(false)}
              />
              <motion.div
                className="user-menu"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="user-menu-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 32 }}>{currentUser.avatar}</span>
                    <div>
                      <div style={{ fontWeight: 600, color: '#333' }}>
                        {currentUser.name}
                      </div>
                      <div className="user-menu-title">我的收藏 ({favorites.length})</div>
                    </div>
                  </div>
                </div>
                {favoriteRecipes.length > 0 ? (
                  favoriteRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="favorite-item"
                      onClick={() => navigateToDetail(recipe.id)}
                    >
                      <span className="favorite-item-icon">🍲</span>
                      <div className="favorite-item-info">
                        <div className="favorite-item-title">{recipe.title}</div>
                        <div className="favorite-item-author">by {recipe.author}</div>
                      </div>
                      <span style={{ color: '#E65100', fontSize: 16 }}>→</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-favorites">暂无收藏的食谱</div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="page-content">
          <AnimatePresence mode="wait">
            {currentPage === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Home search={search} setSearch={setSearch} />
              </motion.div>
            ) : (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <RecipeDetail recipeId={selectedRecipeId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

export { useAppStore }

export default App

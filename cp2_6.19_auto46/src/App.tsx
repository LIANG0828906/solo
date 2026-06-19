import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useRecipeStore } from './store/recipeStore';
import RecipeCard from './components/RecipeCard';
import RecipeDetail from './components/RecipeDetail';

const HomePage: React.FC = () => {
  const {
    recipes,
    collections,
    isDragging,
    highlightCollectionId,
    setHighlightCollection,
    addRecipeToCollection,
    setFlyingRecipe,
    addCollection
  } = useRecipeStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);

  const handleDragOver = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setHighlightCollection(collectionId);
  };

  const handleDragLeave = () => {
    setHighlightCollection(null);
  };

  const handleDrop = (e: React.DragEvent, collectionId: string) => {
    e.preventDefault();
    const recipeId = e.dataTransfer.getData('text/plain');
    if (recipeId) {
      setFlyingRecipe(recipeId);
      setTimeout(() => {
        addRecipeToCollection(recipeId, collectionId);
        setFlyingRecipe(null);
        setHighlightCollection(null);
      }, 300);
    }
  };

  const handleAddCollection = () => {
    if (newCollectionName.trim()) {
      const icons = ['🍽️', '🥗', '🍜', '🍰', '🥘', '🍱', '🥟', '🍛'];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      addCollection(newCollectionName.trim(), randomIcon);
      setNewCollectionName('');
      setShowAddCollection(false);
    }
  };

  return (
    <div className="main-content">
      <div className={`content-area ${sidebarOpen ? 'with-sidebar' : ''}`}>
        <div className="page-header">
          <h1 className="page-title">探索美食</h1>
          <p className="page-subtitle">发现家人朋友分享的拿手好菜</p>
        </div>
        <div className="recipe-grid">
          {recipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </div>
      </div>

      <div
        className={`sidebar-overlay ${sidebarOpen && isDragging ? 'visible' : ''}`}
        onClick={() => !isDragging && setSidebarOpen(false)}
      />

      <aside className={`collection-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>我的收藏夹</h2>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="collections-list">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className={`collection-item ${
                highlightCollectionId === collection.id ? 'drag-over' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, collection.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, collection.id)}
            >
              <div className="collection-icon">{collection.icon}</div>
              <div className="collection-info">
                <div className="collection-name">{collection.name}</div>
                <div className="collection-count">
                  {collection.recipeIds.length} 道菜谱
                </div>
              </div>
            </div>
          ))}

          {showAddCollection ? (
            <div className="collection-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="输入收藏夹名称"
                style={{
                  padding: '10px',
                  border: '2px solid var(--primary-orange)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  marginBottom: '10px',
                  width: '100%'
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddCollection()}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAddCollection}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'var(--primary-orange)',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  创建
                </button>
                <button
                  onClick={() => {
                    setShowAddCollection(false);
                    setNewCollectionName('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: 'var(--light-gray)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              className="add-collection"
              onClick={() => setShowAddCollection(true)}
            >
              <span style={{ fontSize: '1.2rem' }}>+</span>
              创建新收藏夹
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🍳</span>
          <span>家的味道</span>
        </div>
        <div className="header-actions">
          {isHomePage && (
            <button
              className="collection-toggle"
              onClick={() => {
                const sidebar = document.querySelector('.collection-sidebar');
                if (sidebar) {
                  sidebar.classList.toggle('open');
                }
              }}
            >
              📂 收藏夹
            </button>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;

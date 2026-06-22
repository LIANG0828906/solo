import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../api/client';
import { Card } from '../components/Card';

interface Recipe {
  id: string;
  title: string;
  author: string;
  authorId: string;
  coverImage: string;
  cookTime: number;
  avgRating: number;
  favoritesCount: number;
  commentsCount: number;
  createdAt: string;
}

interface Interaction {
  id: string;
  userId: string;
  recipeId: string;
  type: string;
  value?: number;
  comment?: string;
  createdAt: string;
}

interface HistoryItem {
  id: string;
  title: string;
  viewedAt: string;
}

const HISTORY_KEY = 'recipe_view_history';

const getHistory = (): HistoryItem[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const addHistory = (recipeId: string, title: string) => {
  const history = getHistory().filter((h) => h.id !== recipeId);
  history.unshift({ id: recipeId, title, viewedAt: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
};

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'favorites' | 'history'>('my');
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    client.get('/recipes').then((res) => {
      setMyRecipes(res.data.filter((r: Recipe) => r.authorId === 'user1'));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'favorites') {
      client.get('/interactions', { params: { userId: 'user1', type: 'favorite' } }).then(async (res) => {
        const favInteractions: Interaction[] = res.data;
        const recipePromises = favInteractions.map((fav) =>
          client.get(`/recipes/${fav.recipeId}`).then((r) => r.data).catch(() => null)
        );
        const results = await Promise.all(recipePromises);
        setFavorites(results.filter(Boolean));
      }).catch(() => {});
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      setHistory(getHistory());
    }
  }, [activeTab]);

  const handleDelete = async (recipeId: string) => {
    try {
      await client.delete(`/recipes/${recipeId}`);
      setMyRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    } catch {}
  };

  const tabs = [
    { key: 'my' as const, label: '我的菜谱' },
    { key: 'favorites' as const, label: '我的收藏' },
    { key: 'history' as const, label: '浏览记录' },
  ];

  return (
    <div className="profile-container">
      <div className="profile-tab-bar">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            className={`profile-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {activeTab === 'my' && (
        <div>
          {myRecipes.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>
              还没有发布菜谱
            </div>
          ) : (
            myRecipes.map((recipe) => (
              <div className="recipe-row" key={recipe.id}>
                <div className="recipe-row-info">
                  <div className="recipe-row-title">{recipe.title}</div>
                  <div className="recipe-row-meta">
                    {recipe.createdAt} · ❤️ {recipe.favoritesCount}
                  </div>
                </div>
                <div className="recipe-row-actions">
                  <Link to={`/recipe/${recipe.id}`}>
                    <button className="btn-edit">编辑</button>
                  </Link>
                  <button className="btn-delete" onClick={() => handleDelete(recipe.id)}>
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>
              还没有收藏菜谱
            </div>
          ) : (
            <div className="search-grid">
              {favorites.map((recipe) => (
                <Card key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>
              还没有浏览记录
            </div>
          ) : (
            history.map((item) => (
              <Link to={`/recipe/${item.id}`} key={item.id} style={{ display: 'block' }}>
                <div className="recipe-row">
                  <div className="recipe-row-info">
                    <div className="recipe-row-title">{item.title}</div>
                    <div className="recipe-row-meta">{item.viewedAt}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

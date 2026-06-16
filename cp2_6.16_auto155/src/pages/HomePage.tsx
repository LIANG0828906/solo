import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';
import PantryPanel from '@/components/PantryPanel';
import RecipeCard from '@/components/RecipeCard';
import SearchFilter from '@/components/SearchFilter';

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  gap: 32,
  padding: '32px 24px',
  maxWidth: 1400,
  margin: '0 auto',
  alignItems: 'flex-start'
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20,
  flexWrap: 'wrap',
  gap: 16
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 24
};

const addBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: 'var(--accent)',
  color: '#fff',
  borderRadius: 'var(--radius-sm)',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  whiteSpace: 'nowrap'
};

export default function HomePage() {
  const navigate = useNavigate();
  const getRecipesWithMatch = useRecipeStore(state => state.getRecipesWithMatch);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return getRecipesWithMatch().filter(r => {
      const matchSearch = !q || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      const matchCategory = !selectedCategory || r.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, selectedCategory, getRecipesWithMatch]);

  return (
    <div style={layoutStyle}>
      <PantryPanel />
      <div style={mainStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              🍳 为你推荐
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              根据你手边的食材，以下是最适合制作的食谱
            </p>
          </div>
          <button
            style={addBtnStyle}
            onClick={() => navigate('/recipes/new')}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.transform = 'scale(1.03)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: 16 }}>+</span> 新增食谱
          </button>
        </div>

        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {filteredRecipes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              border: '2px dashed var(--border-color)'
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🥧</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 8 }}>
              {searchQuery || selectedCategory ? '没有找到匹配的食谱' : '还没有任何食谱'}
            </p>
            <button
              onClick={() => navigate('/recipes/new')}
              style={{
                marginTop: 12,
                padding: '8px 20px',
                background: 'var(--accent)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              创建第一个食谱
            </button>
          </div>
        ) : (
          <div style={gridStyle}>
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

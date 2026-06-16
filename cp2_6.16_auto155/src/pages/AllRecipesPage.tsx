import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeStore } from '@/store/recipeStore';
import RecipeCard from '@/components/RecipeCard';
import SearchFilter from '@/components/SearchFilter';

const containerStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '32px 24px'
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
  flexWrap: 'wrap',
  gap: 16
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 24
};

export default function AllRecipesPage() {
  const navigate = useNavigate();
  const getRecipesWithMatch = useRecipeStore(state => state.getRecipesWithMatch);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return getRecipesWithMatch()
      .filter(r => {
        const matchSearch = !q || r.name.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
        const matchCategory = !selectedCategory || r.category === selectedCategory;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [searchQuery, selectedCategory, getRecipesWithMatch]);

  return (
    <div style={containerStyle} className="page-enter">
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            📚 所有食谱
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            浏览你收藏的全部 {getRecipesWithMatch().length} 个食谱
          </p>
        </div>
        <button
          onClick={() => navigate('/recipes/new')}
          style={{
            padding: '10px 20px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            fontWeight: 600
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
        >
          + 新增食谱
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
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            {searchQuery || selectedCategory ? '没有找到匹配的食谱' : '还没有任何食谱'}
          </p>
        </div>
      ) : (
        <div style={gridStyle}>
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

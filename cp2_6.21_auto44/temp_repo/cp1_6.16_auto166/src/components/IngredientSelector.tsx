import React, { useMemo, useState } from 'react';
import { Input, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useRecipeStore } from '../stores/recipeStore';

const categories = ['全部', '蔬菜', '肉类', '海鲜', '调味料', '主食', '乳制品', '水果'];

const IngredientSelector: React.FC = React.memo(() => {
  const {
    ingredients,
    selectedIngredientIds,
    toggleIngredient,
    removeIngredient,
    doSearch,
    loading,
  } = useRecipeStore();

  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchText, setSearchText] = useState('');

  const filteredIngredients = useMemo(() => {
    let list = ingredients;
    if (activeCategory !== '全部') {
      list = list.filter(i => i.category === activeCategory);
    }
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(kw));
    }
    return list;
  }, [ingredients, activeCategory, searchText]);

  const selectedIngredients = useMemo(() => {
    return ingredients.filter(i => selectedIngredientIds.includes(i.id));
  }, [ingredients, selectedIngredientIds]);

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索食材..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 320, marginBottom: 12 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '6px 16px',
              borderRadius: 20,
              border: activeCategory === cat ? '2px solid #1890FF' : '1px solid #D9D9D9',
              background: activeCategory === cat ? '#E6F7FF' : '#fff',
              color: activeCategory === cat ? '#1890FF' : '#666',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s ease',
              fontWeight: activeCategory === cat ? 600 : 400,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        className="ingredient-scroll-container"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 12,
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {filteredIngredients.map(ing => {
          const isSelected = selectedIngredientIds.includes(ing.id);
          const isDisabled = !isSelected && selectedIngredientIds.length >= 8;
          return (
            <div
              key={ing.id}
              onClick={() => {
                if (!isDisabled) toggleIngredient(ing.id);
              }}
              style={{
                minWidth: 160,
                height: 100,
                borderRadius: 8,
                border: isSelected ? '2px solid #1890FF' : '1px solid #D9D9D9',
                background: isSelected ? '#E6F7FF' : '#fff',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                transition: 'all 0.2s ease',
                flexShrink: 0,
                userSelect: 'none',
              }}
              onMouseEnter={e => {
                if (!isDisabled) {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(24,144,255,0.2)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: 18, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#1890FF' : '#333' }}>
                {ing.name}
              </span>
              <span style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{ing.category}</span>
            </div>
          );
        })}
      </div>

      {selectedIngredients.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: 14, marginRight: 4 }}>已选食材：</span>
          {selectedIngredients.map(ing => (
            <Tag
              key={ing.id}
              closable
              onClose={() => removeIngredient(ing.id)}
              style={{ margin: 0, padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}
              color="blue"
            >
              {ing.name}
            </Tag>
          ))}
          <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>
            {selectedIngredientIds.length}/8
          </span>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          onClick={doSearch}
          disabled={selectedIngredientIds.length === 0 || loading}
          style={{
            padding: '10px 32px',
            borderRadius: 8,
            border: 'none',
            background: selectedIngredientIds.length === 0 ? '#D9D9D9' : '#1890FF',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: selectedIngredientIds.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (selectedIngredientIds.length > 0) {
              (e.currentTarget as HTMLButtonElement).style.background = '#096DD9';
            }
          }}
          onMouseLeave={e => {
            if (selectedIngredientIds.length > 0) {
              (e.currentTarget as HTMLButtonElement).style.background = '#1890FF';
            }
          }}
          onMouseDown={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }}
          onMouseUp={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          {loading ? '搜索中...' : '搜索食谱'}
        </button>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .ingredient-scroll-container {
            flex-direction: column !important;
            overflow-x: hidden !important;
            overflow-y: auto !important;
            max-height: 300px;
          }
        }
      `}</style>
    </div>
  );
});

IngredientSelector.displayName = 'IngredientSelector';

export default IngredientSelector;

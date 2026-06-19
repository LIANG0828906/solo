import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import IngredientCard from '../components/IngredientCard';

const CATEGORIES = ['全部', '蔬菜', '水果', '肉类', '调味料', '乳制品', '根茎类'];

const Marketplace: React.FC = () => {
  const { ingredients, searchQuery, categoryFilter, setSearchQuery, setCategoryFilter } = useStore();

  const filtered = useMemo(() => {
    let list = ingredients.filter((i) => !i.is_exchanged);

    if (categoryFilter && categoryFilter !== '全部') {
      list = list.filter((i) => i.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    return list;
  }, [ingredients, searchQuery, categoryFilter]);

  const leftCol = filtered.filter((_, i) => i % 2 === 0);
  const rightCol = filtered.filter((_, i) => i % 2 !== 0);

  return (
    <div style={{ minHeight: '100vh', background: '#FFF3E0', paddingBottom: 80 }}>
      <div style={{ padding: '16px 16px 0' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3E2723', marginBottom: 4 }}>
          🏘️ 邻里食材共享
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#8D6E63', marginBottom: 16 }}>
          分享多余，减少浪费
        </p>

        <div
          style={{
            position: 'relative',
            marginBottom: 12,
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1rem',
              color: '#aaa',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索食材..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px 10px 40px',
              borderRadius: 12,
              border: '1px solid #E0C9A6',
              background: 'rgba(255,255,255,0.8)',
              fontSize: '0.9rem',
              outline: 'none',
              color: '#3E2723',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 8,
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                flexShrink: 0,
                padding: '6px 16px',
                borderRadius: 20,
                border: 'none',
                background: categoryFilter === cat ? '#F39C12' : 'rgba(255,255,255,0.7)',
                color: categoryFilter === cat ? '#fff' : '#8D6E63',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        {filtered.length === 0 ? (
          <div
            className="glass-card"
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              marginTop: 24,
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
            <div style={{ color: '#8D6E63', fontSize: '0.95rem' }}>
              没有找到相关食材
            </div>
            <div style={{ color: '#bbb', fontSize: '0.8rem', marginTop: 4 }}>
              试试其他搜索词或分类
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leftCol.map((ing, i) => (
                <IngredientCard key={ing.id} ingredient={ing} index={i * 2} />
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
              {rightCol.map((ing, i) => (
                <IngredientCard key={ing.id} ingredient={ing} index={i * 2 + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;

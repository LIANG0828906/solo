import React, { useState, useEffect, useMemo, useCallback } from 'react';
import useStore from '../store/useStore';
import { getGoodsList } from '../api/goodsApi';
import type { Product } from '../types';
import GoodsCard from '../components/GoodsCard';

const GoodsList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { selectedCategory, setCategory, addToCart, showToast } = useStore();

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))];
    return ['全部', ...cats];
  }, [products]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getGoodsList(selectedCategory === '全部' ? undefined : selectedCategory);
      setProducts(data);
    } catch (error) {
      showToast('获取商品列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;
    const lowerSearch = debouncedSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.category.toLowerCase().includes(lowerSearch)
    );
  }, [products, debouncedSearch]);

  const handleAddToCart = useCallback(
    (productId: number) => {
      const product = products.find((p) => p.id === productId);
      if (product) {
        addToCart(product, 1);
        showToast(`${product.name} 已加入购物车`, 'success');
      }
    },
    [products, addToCart, showToast]
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 24px 0' }}>
        商品列表
      </h1>

      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            position: 'relative',
            maxWidth: '400px',
            marginBottom: '20px',
          }}
        >
          <input
            type="text"
            placeholder="搜索商品..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 44px',
              fontSize: '14px',
              border: '2px solid #e5e7eb',
              borderRadius: '10px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4f46e5';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                flexShrink: 0,
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: selectedCategory === cat || (cat === '全部' && !selectedCategory) ? '#4f46e5' : '#f3f4f6',
                color: selectedCategory === cat || (cat === '全部' && !selectedCategory) ? '#ffffff' : '#4b5563',
              }}
              onMouseEnter={(e) => {
                if (!(selectedCategory === cat || (cat === '全部' && !selectedCategory))) {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!(selectedCategory === cat || (cat === '全部' && !selectedCategory))) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '80px 0',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '20px',
            justifyItems: 'center',
          }}
        >
          {filteredProducts.map((product) => (
            <GoodsCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image_url}
              stock={product.stock}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '80px 0',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div>暂无符合条件的商品</div>
        </div>
      )}

      <style>{`
        @media (min-width: 640px) {
          div[style*="gridTemplateColumns: repeat(1, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1024px) {
          div[style*="gridTemplateColumns: repeat(1, 1fr)"] {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        div[style*="scrollbarWidth: none"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default GoodsList;

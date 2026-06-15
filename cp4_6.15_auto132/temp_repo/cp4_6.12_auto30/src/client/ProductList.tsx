import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Product } from '../types';

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await axios.get<Product[]>('/api/products');
        setProducts(data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '48px' }}>加载中...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: '#8B5E3C',
          marginBottom: '8px',
        }}
      >
        精品皮具定制
      </h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        每一件作品都承载着匠人的心意，选择您钟爱的款式开始定制
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
        }}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease-out',
              display: 'block',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                '0 8px 24px rgba(139,94,60,0.15)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                '0 2px 8px rgba(0,0,0,0.06)';
            }}
          >
            <div
              style={{
                width: '100%',
                height: '200px',
                backgroundColor: '#FFF8E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src={product.thumbnail}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease-out',
                }}
              />
            </div>
            <div style={{ padding: '16px' }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#333',
                  marginBottom: '8px',
                }}
              >
                {product.name}
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                {product.leatherTypes.map((type) => (
                  <span
                    key={type}
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#FFF3E0',
                      color: '#8B5E3C',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#D4A574',
                }}
              >
                ¥{product.basePrice} 起
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

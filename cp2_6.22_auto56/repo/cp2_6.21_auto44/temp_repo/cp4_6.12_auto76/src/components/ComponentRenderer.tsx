import { useEffect, useState } from 'react';
import type { LayoutComponent, Product } from '../types';
import axios from 'axios';

interface ComponentRendererProps {
  component: LayoutComponent;
  isEditor?: boolean;
}

export function ComponentRenderer({ component, isEditor = false }: ComponentRendererProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const { style, props, type } = component;

  useEffect(() => {
    if (type === 'product-grid') {
      axios.get<Product[]>('/api/products').then((res) => setProducts(res.data));
    }
  }, [type]);

  const baseStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor,
    padding: style.padding,
    fontSize: style.fontSize,
    width: '100%',
    boxSizing: 'border-box',
  };

  if (type === 'banner') {
    const bannerProps = props as { imageUrl: string; link: string };
    return (
      <div style={baseStyle}>
        <a href={bannerProps.link} style={{ display: 'block', width: '100%' }}>
          <img
            src={bannerProps.imageUrl}
            alt="Banner"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 8,
              objectFit: 'cover',
              display: 'block',
            }}
            draggable={false}
          />
        </a>
      </div>
    );
  }

  if (type === 'product-grid') {
    const gridProps = props as { columns: 2 | 3 };
    return (
      <div style={baseStyle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridProps.columns}, 1fr)`,
            gap: 12,
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                cursor: isEditor ? 'default' : 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isEditor) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  display: 'block',
                }}
                draggable={false}
              />
              <div style={{ padding: 8 }}>
                <div
                  style={{
                    fontSize: style.fontSize - 1,
                    color: '#333',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginBottom: 4,
                  }}
                >
                  {product.name}
                </div>
                <div style={{ color: '#ff4444', fontWeight: 600, fontSize: style.fontSize }}>
                  ¥{product.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'coupon') {
    const couponProps = props as { title: string; discountCode: string };
    return (
      <div style={baseStyle}>
        <div
          style={{
            background: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
            borderRadius: 12,
            padding: 20,
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: -15,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: style.backgroundColor,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: -15,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: style.backgroundColor,
            }}
          />
          <div style={{ paddingLeft: 8, paddingRight: 8 }}>
            <div style={{ fontSize: style.fontSize + 4, fontWeight: 700, marginBottom: 8 }}>
              {couponProps.title}
            </div>
            <div
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '6px 16px',
                borderRadius: 20,
                fontSize: style.fontSize,
                letterSpacing: 2,
                fontWeight: 600,
              }}
            >
              {couponProps.discountCode}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

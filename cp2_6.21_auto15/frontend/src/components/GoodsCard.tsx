import React, { useState } from 'react';
import RippleButton from './RippleButton';

interface GoodsCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  maxStock?: number;
  onAddToCart: (id: number) => void;
}

const GoodsCard: React.FC<GoodsCardProps> = ({
  id,
  name,
  price,
  image,
  stock,
  maxStock = 100,
  onAddToCart,
}) => {
  const [isAdded, setIsAdded] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const isLowStock = stock / maxStock < 0.2;

  const handleAddToCart = () => {
    if (isAdded) return;
    onAddToCart(id);
    setIsAdded(true);
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsAdded(false);
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div
      style={{
        width: '240px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        overflow: 'hidden',
      }}>
        <img
          src={image}
          alt={name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {isLowStock && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 500,
          }}>
            即将售罄
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '15px',
          fontWeight: 600,
          color: '#1f2937',
          lineHeight: 1.4,
          height: '42px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {name}
        </h3>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 500 }}>¥</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#4f46e5' }}>
              {price.toFixed(2)}
            </span>
          </div>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>
            库存: {stock}
          </span>
        </div>

        <div style={{ position: 'relative' }}>
          <RippleButton
            onClick={handleAddToCart}
            disabled={isAdded || stock === 0}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              opacity: isAdded ? 0 : 1,
              transform: isAdded ? 'translateY(-10px)' : 'translateY(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            {stock === 0 ? '已售罄' : '加入购物车'}
          </RippleButton>

          {isAdded && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#10b981',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 500,
                opacity: 1,
                transform: 'translateY(0)',
                animation: 'slideIn 0.3s ease forwards, fadeOut 0.3s ease 2.7s forwards',
              }}
            >
              <span style={{ marginRight: '6px' }}>✓</span>
              已加入购物车 ({countdown}s)
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default GoodsCard;

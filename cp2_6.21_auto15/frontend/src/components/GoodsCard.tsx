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
  const [imageError, setImageError] = useState(false);

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

  const handleImageError = () => {
    setImageError(true);
  };

  const getPlaceholderImage = () => {
    const categoryColors = [
      { bg: '#ede9fe', icon: '🥬', label: '商品图片' },
      { bg: '#fef3c7', icon: '🍎', label: '商品图片' },
      { bg: '#dbeafe', icon: '🥕', label: '商品图片' },
      { bg: '#fce7f3', icon: '🍉', label: '商品图片' },
      { bg: '#d1fae5', icon: '🥦', label: '商品图片' },
    ];
    const colorIndex = id % categoryColors.length;
    const { bg, icon, label } = categoryColors[colorIndex];
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '64px' }}>{icon}</span>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>{label}</span>
      </div>
    );
  };

  return (
    <div
      className="goods-card-wrapper"
      style={{
        width: '100%',
        maxWidth: '240px',
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
        backgroundColor: '#f9fafb',
      }}>
        {imageError ? (
          getPlaceholderImage()
        ) : (
          <img
            src={image}
            alt={name}
            onError={handleImageError}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {isLowStock && (
          <div className="low-stock-badge">
            <div className="low-stock-badge-inner">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '4px' }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              即将售罄
            </div>
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
          <span
            style={{
              fontSize: '12px',
              color: isLowStock ? '#ef4444' : '#9ca3af',
              fontWeight: isLowStock ? 600 : 400,
            }}
          >
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
        .low-stock-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          animation: lowStockBlink 1s ease-in-out infinite;
        }
        .low-stock-badge-inner {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 8px;
          background-color: #ef4444;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        @keyframes lowStockBlink {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        @media (max-width: 480px) {
          .goods-card-wrapper {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default GoodsCard;

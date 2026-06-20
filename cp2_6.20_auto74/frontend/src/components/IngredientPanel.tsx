import React from 'react';
import dayjs from 'dayjs';
import { useIngredientStore } from '../stores/ingredientStore';

const IngredientPanel: React.FC = () => {
  const { ingredients, getExpiringSoon } = useIngredientStore();
  const expiringSoon = getExpiringSoon();
  const expiringIds = new Set(expiringSoon.map((i) => i.id));

  const getDaysRemaining = (expireDate: string) => {
    return dayjs(expireDate).diff(dayjs(), 'day');
  };

  return (
    <div
      className="ingredient-panel"
      style={{
        width: '360px',
        flexShrink: 0,
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
          🥬 我的食材
        </h2>
        {expiringSoon.length > 0 && (
          <span
            style={{
              fontSize: '12px',
              color: '#ef4444',
              backgroundColor: '#fef2f2',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 500,
            }}
          >
            {expiringSoon.length} 项即将过期
          </span>
        )}
      </div>

      <div
        className="ingredient-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          overflowY: 'auto',
          flex: 1,
          paddingRight: '4px',
        }}
      >
        {ingredients.map((ingredient, index) => {
          const isExpiring = expiringIds.has(ingredient.id);
          const daysLeft = getDaysRemaining(ingredient.expireDate);

          return (
            <div
              key={ingredient.id}
              className={`ingredient-card card ${isExpiring ? 'expiring-soon' : ''}`}
              style={{
                backgroundColor: '#e8f5e9',
                padding: '14px',
                borderRadius: '12px',
                animationDelay: `${index * 0.05}s`,
                animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
              }}
            >
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#2e7d32',
                  marginBottom: '8px',
                }}
              >
                {ingredient.name}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#558b2f',
                  marginBottom: '6px',
                }}
              >
                剩余: {ingredient.quantity}
                {ingredient.unit}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: isExpiring ? '#ef4444' : '#666',
                  fontWeight: isExpiring ? 500 : 400,
                }}
              >
                {isExpiring
                  ? `还剩 ${daysLeft} 天过期`
                  : `过期: ${ingredient.expireDate.slice(5)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IngredientPanel;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Ingredient } from '../types';

interface IngredientCardProps {
  ingredient: Ingredient;
  index?: number;
  onClick?: () => void;
}

const AVATAR_COLORS = ['#27AE60', '#2980B9', '#E67E22', '#8E44AD'];

const CATEGORY_EMOJI: Record<string, string> = {
  '蔬菜': '🥬',
  '水果': '🍎',
  '肉类': '🥩',
  '调味料': '🧂',
  '乳制品': '🧀',
  '根茎类': '🥔',
};

function getDaysRemaining(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getFreshnessColor(days: number): string {
  if (days > 7) return '#27AE60';
  if (days >= 3) return '#F39C12';
  return '#E74C3C';
}

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, index = 0, onClick }) => {
  const navigate = useNavigate();
  const daysRemaining = getDaysRemaining(ingredient.expiry_date);
  const freshnessColor = getFreshnessColor(daysRemaining);
  const freshnessPercent = Math.min(Math.max((daysRemaining / 30) * 100, 0), 100);
  const nickname = ingredient.user?.nickname || '匿';
  const avatarColor = ingredient.user?.avatar_color || AVATAR_COLORS[index % AVATAR_COLORS.length];
  const emoji = CATEGORY_EMOJI[ingredient.category] || '🍽️';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/ingredient/${ingredient.id}`);
    }
  };

  return (
    <div
      className="glass-card card-enter"
      style={{
        animationDelay: `${index * 0.08}s`,
        cursor: 'pointer',
        overflow: 'hidden',
        padding: 0,
      }}
      onClick={handleClick}
    >
      <div style={{ position: 'relative', width: '100%', paddingTop: '70%', background: '#FFF3E0', overflow: 'hidden' }}>
        {ingredient.image_url ? (
          <img
            src={ingredient.image_url}
            alt={ingredient.name}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
            }}
          >
            {emoji}
          </div>
        )}
        {ingredient.is_exchanged && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 8,
              fontSize: '0.7rem',
            }}
          >
            已交换
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#3E2723' }}>{ingredient.name}</span>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>{ingredient.distance?.toFixed(1)}km</span>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#8D6E63', marginBottom: 6 }}>
          {ingredient.quantity}{ingredient.unit}
        </div>

        <div className="freshness-bar" style={{ marginBottom: 8 }}>
          <div
            style={{
              height: 3,
              borderRadius: 2,
              background: freshnessColor,
              width: `${freshnessPercent}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: avatarColor,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              {nickname.charAt(0)}
            </div>
            {(ingredient.user?.trust_count ?? 0) > 0 && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -4,
                  fontSize: '0.65rem',
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))',
                }}
              >
                🛡️
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: '0.7rem',
              color: freshnessColor,
              fontWeight: 600,
            }}
          >
            {daysRemaining > 0 ? `剩余${daysRemaining}天` : '已过期'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;

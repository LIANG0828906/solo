import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

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

const IngredientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ingredients, currentUser, updateIngredient } = useStore();

  const ingredient = ingredients.find((i) => i.id === id);

  if (!ingredient) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>😕</div>
          <div style={{ color: '#8D6E63', marginBottom: 16 }}>找不到该食材</div>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '10px 28px',
              borderRadius: 20,
              border: 'none',
              background: '#F39C12',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            返回市场
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(ingredient.expiry_date);
  const freshnessColor = getFreshnessColor(daysRemaining);
  const freshnessPercent = Math.min(Math.max((daysRemaining / 30) * 100, 0), 100);
  const isOwn = ingredient.user_id === currentUser?.id;
  const emoji = CATEGORY_EMOJI[ingredient.category] || '🍽️';
  const publisher = ingredient.user;

  const handleExchange = () => {
    if (!currentUser || !publisher) return;
    const chatId = [currentUser.id, publisher.id].sort().join('-');
    navigate(`/chat/${chatId}`);
  };

  const handleMarkExchanged = () => {
    updateIngredient(ingredient.id, { is_exchanged: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF3E0', paddingBottom: 100 }}>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.85)',
            color: '#3E2723',
            fontSize: '1.1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          ←
        </button>

        <div
          style={{
            width: '100%',
            height: 240,
            background: '#FFE0B2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '5rem',
          }}
        >
          {ingredient.image_url ? (
            <img
              src={ingredient.image_url}
              alt={ingredient.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            emoji
          )}
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <div className="glass-card" style={{ padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#3E2723' }}>
                {ingredient.name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#8D6E63', marginTop: 4 }}>
                {ingredient.quantity}{ingredient.unit} · {ingredient.category}
              </div>
            </div>
            {ingredient.is_exchanged && (
              <span
                style={{
                  background: '#E0C9A6',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                已交换
              </span>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8rem', color: '#8D6E63' }}>新鲜度</span>
              <span style={{ fontSize: '0.8rem', color: freshnessColor, fontWeight: 700 }}>
                {daysRemaining > 0 ? `剩余${daysRemaining}天` : '已过期'}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: '#f0e0d0',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  background: freshnessColor,
                  width: `${freshnessPercent}%`,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#aaa' }}>
            保质期至 {ingredient.expiry_date}
          </div>
        </div>

        {ingredient.description && (
          <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3E2723', marginBottom: 8 }}>
              📝 描述
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6D4C41', lineHeight: 1.6 }}>
              {ingredient.description}
            </div>
          </div>
        )}

        {publisher && (
          <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3E2723', marginBottom: 12 }}>
              👤 发布者
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: publisher.avatar_color || AVATAR_COLORS[0],
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.2rem',
                  }}
                >
                  {publisher.nickname.charAt(0)}
                </div>
                {(publisher.trust_count ?? 0) > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -6,
                      fontSize: '1rem',
                    }}
                  >
                    🛡️
                  </span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#3E2723', fontSize: '0.95rem' }}>
                  {publisher.nickname}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 2 }}>
                  交换{publisher.exchange_count}次
                  {ingredient.distance != null && ` · ${ingredient.distance.toFixed(1)}km`}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {!isOwn && !ingredient.is_exchanged && (
            <button
              onClick={handleExchange}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #F39C12, #E67E22)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(243,156,18,0.3)',
              }}
            >
              💬 发起交换
            </button>
          )}
          {isOwn && !ingredient.is_exchanged && (
            <button
              onClick={handleMarkExchanged}
              style={{
                flex: 1,
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #27AE60, #1E8449)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(39,174,96,0.3)',
              }}
            >
              ✅ 标记已交换
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default IngredientDetail;

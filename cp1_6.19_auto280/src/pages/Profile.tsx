import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import IngredientCard from '../components/IngredientCard';

const AVATAR_COLORS = ['#27AE60', '#2980B9', '#E67E22', '#8E44AD'];

const ACHIEVEMENT_TIERS = [
  { label: '🥇 金牌', threshold: 30, color: '#FFD700', bgColor: 'rgba(255,215,0,0.15)' },
  { label: '🥈 银牌', threshold: 15, color: '#C0C0C0', bgColor: 'rgba(192,192,192,0.15)' },
  { label: '🥉 铜牌', threshold: 5, color: '#CD7F32', bgColor: 'rgba(205,127,50,0.15)' },
];

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, ingredients } = useStore();

  const myIngredients = useMemo(
    () => ingredients.filter((i) => i.user_id === currentUser?.id),
    [ingredients, currentUser]
  );

  const publishedCount = myIngredients.length;

  const earnedAchievements = ACHIEVEMENT_TIERS.filter(
    (t) => (currentUser?.exchange_count ?? 0) >= t.threshold
  );

  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔒</div>
          <div style={{ color: '#8D6E63', marginBottom: 16 }}>请先登录查看个人资料</div>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 32px',
              borderRadius: 20,
              border: 'none',
              background: '#F39C12',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFF3E0', paddingBottom: 80 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)',
          padding: '40px 20px 60px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: currentUser.avatar_color || AVATAR_COLORS[0],
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            margin: '0 auto 12px',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {currentUser.nickname.charAt(0)}
          {(currentUser.trust_count ?? 0) > 0 && (
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -4,
                fontSize: '1.2rem',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
              }}
            >
              🛡️
            </span>
          )}
        </div>
        <div style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 700 }}>{currentUser.nickname}</div>
        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: 4 }}>
          @{currentUser.username}
        </div>
      </div>

      <div style={{ padding: '0 16px', marginTop: -36 }}>
        <div
          className="glass-card"
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            textAlign: 'center',
            padding: '16px 8px',
          }}
        >
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F39C12' }}>
              {currentUser.exchange_count}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8D6E63', marginTop: 2 }}>交换次数</div>
          </div>
          <div style={{ width: 1, background: '#E0C9A6' }} />
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#27AE60' }}>
              {currentUser.trust_count ?? 0}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8D6E63', marginTop: 2 }}>可信标记</div>
          </div>
          <div style={{ width: 1, background: '#E0C9A6' }} />
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2980B9' }}>
              {publishedCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#8D6E63', marginTop: 2 }}>发布食材</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3E2723', marginBottom: 12 }}>
            🏆 成就徽章
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {ACHIEVEMENT_TIERS.map((tier) => {
              const earned = (currentUser.exchange_count ?? 0) >= tier.threshold;
              return (
                <div
                  key={tier.label}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    background: earned ? tier.bgColor : 'rgba(0,0,0,0.04)',
                    border: `1px solid ${earned ? tier.color : '#eee'}`,
                    opacity: earned ? 1 : 0.4,
                    transition: 'all 0.3s',
                  }}
                >
                  <div style={{ fontSize: '1.4rem', textAlign: 'center' }}>{tier.label}</div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: earned ? tier.color : '#bbb',
                      textAlign: 'center',
                      marginTop: 2,
                      fontWeight: 600,
                    }}
                  >
                    {tier.threshold}次交换
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3E2723', marginBottom: 12 }}>
            🥬 我发布的食材
          </div>
          {myIngredients.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0', fontSize: '0.85rem' }}>
              还没有发布过食材
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myIngredients.map((ing, i) => (
                <IngredientCard key={ing.id} ingredient={ing} index={i} />
              ))}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3E2723', marginBottom: 12 }}>
            🤝 可信邻居
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {ingredients
              .filter((i) => i.user && i.user.trust_count > 0 && i.user_id !== currentUser.id)
              .reduce((acc, i) => {
                if (!acc.find((u) => u.id === i.user!.id)) acc.push(i.user!);
                return acc;
              }, [] as { id: string; nickname: string; avatar_color: string; trust_count: number; exchange_count: number }[])
              .slice(0, 6)
              .map((neighbor) => (
                <div
                  key={neighbor.id}
                  style={{ textAlign: 'center', width: 56 }}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: neighbor.avatar_color || AVATAR_COLORS[0],
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                      }}
                    >
                      {neighbor.nickname.charAt(0)}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -6,
                        fontSize: '0.8rem',
                      }}
                    >
                      🛡️
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: '#8D6E63',
                      marginTop: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {neighbor.nickname}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

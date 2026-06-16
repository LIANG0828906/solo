import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useRecipeStore } from '../store/recipeStore';

const HistoryPage = () => {
  const navigate = useNavigate();
  const getRecentHistory = useRecipeStore((state) => state.getRecentHistory);
  const history = useRecipeStore((state) => state.history);

  const recentRecipes = getRecentHistory(10);

  const getTimeAgo = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar />

      <div style={{ marginLeft: '240px', minHeight: '100vh' }} className="history-page">
        <style>{`
          @media (max-width: 1024px) {
            .history-page { margin-left: 0 !important; padding-top: 60px !important; }
          }
        `}</style>

        <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>📜 浏览历史</h1>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '32px' }}>
            最近浏览的 {recentRecipes.length} 道菜谱
          </p>

          {recentRecipes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                background: 'var(--color-card)',
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text-light)',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>暂无浏览记录</p>
              <p style={{ fontSize: '14px' }}>去首页看看有什么好吃的吧</p>
              <button
                onClick={() => navigate('/')}
                className="hover-scale"
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                去逛逛
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '40px' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '15px',
                  top: '24px',
                  bottom: '24px',
                  width: '2px',
                  background: 'linear-gradient(to bottom, var(--color-primary), var(--color-primary-light), transparent)',
                }}
              />

              {recentRecipes.map((recipe, index) => {
                const historyItem = history.find((h) => h.recipeId === recipe.id);
                return (
                  <div
                    key={recipe.id}
                    onClick={() => navigate(`/recipe/${recipe.id}`)}
                    style={{
                      position: 'relative',
                      marginBottom: '20px',
                      cursor: 'pointer',
                    }}
                    className="card-fade-in hover-scale"
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: '-40px',
                        top: '16px',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${recipe.gradientColors[0]}, ${recipe.gradientColors[1]})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                        border: '3px solid var(--color-bg)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 1,
                      }}
                    >
                      {recipe.emoji.split('')[0]}
                    </div>

                    <div
                      style={{
                        background: 'var(--color-card)',
                        border: '2px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '16px 20px 16px 28px',
                        marginLeft: '16px',
                        transition: 'all var(--transition-fast)',
                        animationDelay: `${index * 100}ms`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '17px', fontWeight: 600, marginBottom: '6px' }}>
                            {recipe.name}
                          </h3>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--color-text-light)' }}>
                            <span>⏱️ {recipe.cookTime}分钟</span>
                            <span>
                              难度 {'⭐'.repeat(recipe.difficulty)}
                              {'☆'.repeat(3 - recipe.difficulty)}
                            </span>
                            <span style={{ marginLeft: 'auto', color: 'var(--color-primary)' }}>
                              {historyItem ? getTimeAgo(historyItem.viewedAt) : ''}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                            {recipe.ingredients.slice(0, 4).map((ing) => (
                              <span
                                key={ing.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 10px',
                                  background: 'var(--color-bg)',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '12px',
                                }}
                              >
                                {ing.emoji} {ing.name}
                              </span>
                            ))}
                            {recipe.ingredients.length > 4 && (
                              <span style={{ fontSize: '12px', color: 'var(--color-text-light)', padding: '3px 0' }}>
                                +{recipe.ingredients.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HistoryPage;

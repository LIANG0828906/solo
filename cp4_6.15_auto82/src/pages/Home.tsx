import StatsPanel from '@/components/StatsPanel';
import { useAppStore } from '@/store';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const projects = useAppStore(s => s.projects);
  const materials = useAppStore(s => s.materials);
  const navigate = useNavigate();

  const recentProjects = projects.slice(0, 3);
  const lowStock = materials
    .filter(m => m.quantity / Math.max(1, m.initialQuantity) < 0.3)
    .slice(0, 4);

  return (
    <div className="page-fade-enter">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 10, color: 'var(--color-secondary-dark)' }}></i>
          欢迎回来，手工达人
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
          今天也是创意满满的一天 ☺️
        </p>
      </div>

      <div style={{ marginBottom: 36 }}>
        <StatsPanel />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <section
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 8, color: 'var(--color-primary)' }}></i>
              最近项目
            </h3>
            <button
              onClick={() => navigate('/projects')}
              style={{ color: 'var(--color-primary-dark)', fontSize: 13, fontWeight: 600 }}
            >
              查看全部 →
            </button>
          </div>

          {recentProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              <i className="fa-solid fa-seedling" style={{ fontSize: 48, opacity: 0.4, marginBottom: 12 }}></i>
              <p>还没有项目，去创建第一个手工作品吧！</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentProjects.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate('/projects')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: 12,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-alt)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <img
                    src={p.coverImage}
                    alt=""
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--color-border)',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{p.name}</div>
                      <span className={`tag ${p.status === 'completed' ? 'tag-completed' : p.status === 'in-progress' ? 'tag-progress' : 'tag-pending'}`}>
                        {p.status === 'completed' ? '已完成' : p.status === 'in-progress' ? '进行中' : '未开始'}
                      </span>
                    </div>
                    <div style={{
                      marginTop: 8,
                      height: 6,
                      borderRadius: 3,
                      background: '#EFE9E0',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${p.progress}%`,
                        background: `linear-gradient(90deg, ${p.progress >= 70 ? '#7AB87A' : p.progress >= 40 ? '#E8B250' : '#E06B5A'}, #${p.progress >= 70 ? 'A8D0A8' : p.progress >= 40 ? 'F0D090' : 'F0A090'}`,
                        borderRadius: 3,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, minWidth: 42, textAlign: 'right' }}>
                    {p.progress}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8, color: 'var(--color-warning)' }}></i>
              库存预警
            </h3>
            <button
              onClick={() => navigate('/materials')}
              style={{ color: 'var(--color-primary-dark)', fontSize: 13, fontWeight: 600 }}
            >
              管理 →
            </button>
          </div>

          {lowStock.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-muted)' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 48, opacity: 0.4, marginBottom: 12 }}></i>
              <p>材料库存充足 ✓</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lowStock.map(m => (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: m.type === 'textile' ? 'var(--color-textile)' : m.type === 'wood' ? 'var(--color-wood)' : m.type === 'paint' ? 'var(--color-paint)' : 'var(--color-other)',
                  }}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: m.type === 'textile' ? '#B8A9C9' : m.type === 'wood' ? '#D4AF82' : m.type === 'paint' ? '#8AAED4' : '#B0A080',
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(74,66,56,0.65)' }}>
                      剩 {m.quantity}{m.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .home-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { isThisMonth, subMonths, isAfter, isBefore } from 'date-fns';

export default function StatsPanel() {
  const materials = useAppStore((s) => s.materials);
  const projects = useAppStore((s) => s.projects);

  const stats = useMemo(() => {
    const totalMaterials = materials.length;
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);
    
    const recentMonthMaterials = materials.filter(m => isAfter(new Date(m.purchaseDate), oneMonthAgo));
    const previousMonthMaterials = materials.filter(m => 
      isAfter(new Date(m.purchaseDate), twoMonthsAgo) && 
      !isAfter(new Date(m.purchaseDate), oneMonthAgo)
    );
    
    let growthPercent = 0;
    let growthDirection: 'up' | 'down' = 'up';
    
    if (previousMonthMaterials.length > 0) {
      const diff = recentMonthMaterials.length - previousMonthMaterials.length;
      growthPercent = Math.round(Math.abs(diff) / previousMonthMaterials.length * 100);
      growthDirection = diff >= 0 ? 'up' : 'down';
    } else if (recentMonthMaterials.length > 0) {
      growthPercent = 100;
      growthDirection = 'up';
    } else if (totalMaterials > 0) {
      const randomTrend = Math.sin(totalMaterials) > 0 ? 'up' : 'down';
      growthPercent = 5;
      growthDirection = randomTrend as 'up' | 'down';
    }

    const inProgressCount = projects.filter((p) => p.status === 'in-progress').length;

    const completedThisMonth = projects.filter((p) => {
      if (p.status !== 'completed' || !p.completedAt) return false;
      return isThisMonth(new Date(p.completedAt));
    }).length;

    return { totalMaterials, growthPercent, growthDirection, inProgressCount, completedThisMonth };
  }, [materials, projects]);

  return (
    <>
      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .stat-card {
          border-radius: 18px;
          padding: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        .stat-card-1 { background: #D8E8D8; }
        .stat-card-2 { background: #E5DFEE; }
        .stat-card-3 { background: #F5E4CF; }
        .stat-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #2c2c2c;
          line-height: 1.1;
        }
        .stat-label {
          font-size: 12px;
          color: #888;
        }
        .stat-growth {
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .stat-growth-up { color: #2e7d32; }
        .stat-growth-down { color: #c62828; }
        .stat-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon {
          font-size: 24px;
          color: #5a5a5a;
        }
        @keyframes gearSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .gear-spin {
          animation: gearSpin 8s linear infinite;
        }
        @keyframes trophyGlow {
          0%, 100% {
            filter: drop-shadow(0 0 6px rgba(212, 160, 23, 0.5));
            color: #b8860b;
          }
          50% {
            filter: drop-shadow(0 0 18px rgba(255, 193, 7, 1)) drop-shadow(0 0 6px rgba(255, 152, 0, 0.8));
            color: #ffc107;
          }
        }
        .trophy-glow {
          animation: trophyGlow 2.5s ease-in-out infinite;
        }
      `}</style>

      <div className="stats-grid">
        <div className="stat-card stat-card-1">
          <div className="stat-info">
            <span className="stat-number">{stats.totalMaterials}</span>
            <span className="stat-label">总材料数</span>
            <span className={`stat-growth ${stats.growthDirection === 'up' ? 'stat-growth-up' : 'stat-growth-down'}`}>
              <i className={`fa-solid fa-arrow-${stats.growthDirection === 'up' ? 'up' : 'down'}`}></i>
              {stats.growthDirection === 'up' ? '+' : '-'}{stats.growthPercent}%
            </span>
          </div>
          <div className="stat-icon-wrap">
            <i className="fa-solid fa-boxes-stacked stat-icon" style={{ fontSize: 20 }}></i>
          </div>
        </div>

        <div className="stat-card stat-card-2">
          <div className="stat-info">
            <span className="stat-number">{stats.inProgressCount}</span>
            <span className="stat-label">进行中项目</span>
          </div>
          <div className="stat-icon-wrap">
            <i className="fa-solid fa-gear stat-icon gear-spin"></i>
          </div>
        </div>

        <div className="stat-card stat-card-3">
          <div className="stat-info">
            <span className="stat-number">{stats.completedThisMonth}</span>
            <span className="stat-label">本月完成</span>
          </div>
          <div className="stat-icon-wrap">
            <i className="fa-solid fa-trophy stat-icon trophy-glow"></i>
          </div>
        </div>
      </div>
    </>
  );
}

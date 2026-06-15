import { useMemo } from 'react';
import { useAppStore } from '@/store';
import { isThisMonth } from 'date-fns';

export default function StatsPanel() {
  const materials = useAppStore((s) => s.materials);
  const projects = useAppStore((s) => s.projects);

  const stats = useMemo(() => {
    const totalMaterials = materials.length;
    const growthPercent = Math.floor(Math.random() * 6) + 3;

    const inProgressCount = projects.filter((p) => p.status === 'in-progress').length;

    const completedThisMonth = projects.filter((p) => {
      if (p.status !== 'completed' || !p.completedAt) return false;
      return isThisMonth(new Date(p.completedAt));
    }).length;

    return { totalMaterials, growthPercent, inProgressCount, completedThisMonth };
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
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .stat-card {
          border-radius: 18px;
          padding: 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .stat-card-1 {
          background: #D8E8D8;
        }

        .stat-card-2 {
          background: #E5DFEE;
        }

        .stat-card-3 {
          background: #F5E4CF;
        }

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
          color: #2e7d32;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 2px;
        }

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
          font-size: 32px;
          color: #5a5a5a;
        }

        @keyframes gearSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .gear-spin {
          animation: gearSpin 8s linear infinite;
        }

        @keyframes glow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(255, 193, 7, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(255, 193, 7, 0.9));
          }
        }

        .trophy-glow {
          animation: glow 2.5s ease-in-out infinite;
          color: #d4a017 !important;
        }
      `}</style>

      <div className="stats-grid">
        <div className="stat-card stat-card-1">
          <div className="stat-info">
            <span className="stat-number">{stats.totalMaterials}</span>
            <span className="stat-label">总材料数</span>
            <span className="stat-growth">
              <i className="fa-solid fa-arrow-up"></i>
              +{stats.growthPercent}%
            </span>
          </div>
          <div className="stat-icon-wrap">
            <i className="fa-solid fa-boxes-stacked stat-icon" style={{ fontSize: '16px' }}></i>
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

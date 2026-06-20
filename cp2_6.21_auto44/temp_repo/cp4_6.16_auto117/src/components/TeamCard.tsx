import type { Team, Seat, Booking, Event } from '../types';
import { getColorByTeamId } from '../utils/colorUtils';
import { calculateTeamActivity } from '../utils/statsUtils';

interface TeamCardProps {
  team: Team;
  seats: Seat[];
  bookings: Booking[];
  events: Event[];
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onViewSeats: (team: Team) => void;
}

export default function TeamCard({
  team,
  seats,
  bookings,
  events,
  onEdit,
  onDelete,
  onViewSeats,
}: TeamCardProps) {
  const teamSeats = seats.filter(s => s.teamId === team.id);
  const activity = calculateTeamActivity(team.id, bookings, events);
  const seatUtilization = teamSeats.length > 0 
    ? Math.round((team.memberCount / teamSeats.length) * 100) 
    : 0;

  return (
    <>
      <div className="team-card card">
        <div className="team-header">
          <div className="team-identity">
            <div
              className="team-color-bar"
              style={{ backgroundColor: team.color }}
            />
            <div>
              <h3 className="team-name">{team.name}</h3>
              <div className="team-meta">
                <span className="member-count">
                  <span>👥</span> {team.memberCount} 成员
                </span>
                <span className="seat-count">
                  <span>💺</span> {teamSeats.length} 工位
                </span>
              </div>
            </div>
          </div>
          <div className="team-actions">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onEdit(team)}
              title="编辑"
            >
              ✏️
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onDelete(team)}
              title="删除"
            >
              🗑️
            </button>
          </div>
        </div>

        <div className="team-stats">
          <div className="stat-item">
            <div className="stat-value">{seatUtilization}%</div>
            <div className="stat-label">工位使用率</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{activity.bookings}</div>
            <div className="stat-label">会议室预订</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{activity.events}</div>
            <div className="stat-label">活动参与</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{activity.score}</div>
            <div className="stat-label">活跃度</div>
          </div>
        </div>

        <div className="seat-visualization">
          <div className="seat-row-header">
            <span>工位分布</span>
            <span className="seat-demand">
              需求 {team.seatDemand} 个
            </span>
          </div>
          <div className="seat-grid">
            {Array.from({ length: Math.min(team.seatDemand, 10) }).map((_, idx) => (
              <div
                key={idx}
                className={`seat-dot ${idx < teamSeats.length ? 'occupied' : 'available'}`}
                style={{
                  backgroundColor: idx < teamSeats.length ? team.color : 'transparent',
                  borderColor: idx < teamSeats.length ? team.color : 'var(--color-border)',
                }}
              />
            ))}
            {team.seatDemand > 10 && (
              <span className="seat-more">+{team.seatDemand - 10}</span>
            )}
          </div>
        </div>

        <div className="team-footer">
          <button
            className="btn btn-secondary btn-sm w-full"
            onClick={() => onViewSeats(team)}
          >
            查看工位位置
          </button>
        </div>
      </div>

      <style>{`
        .team-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .team-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--spacing-md);
        }

        .team-identity {
          display: flex;
          gap: var(--spacing-md);
          flex: 1;
        }

        .team-color-bar {
          width: 4px;
          border-radius: 2px;
          min-height: 48px;
        }

        .team-name {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .team-meta {
          display: flex;
          gap: var(--spacing-md);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .member-count,
        .seat-count {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .team-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .btn-sm {
          padding: var(--spacing-xs) var(--spacing-sm);
          font-size: var(--font-size-sm);
          min-height: 32px;
          min-width: 32px;
        }

        .team-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          background: var(--color-bg-primary);
          border-radius: var(--radius-card);
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: var(--font-size-lg);
          font-weight: 700;
          color: var(--color-text-primary);
        }

        .stat-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-top: 2px;
        }

        .seat-visualization {
          padding: var(--spacing-md);
          background: var(--color-bg-primary);
          border-radius: var(--radius-card);
        }

        .seat-row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-sm);
        }

        .seat-demand {
          font-weight: 500;
        }

        .seat-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          align-items: center;
        }

        .seat-dot {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 2px solid;
          transition: all var(--transition-fast);
        }

        .seat-dot.occupied {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .seat-dot:hover {
          transform: scale(1.1);
        }

        .seat-more {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          margin-left: var(--spacing-xs);
        }

        .team-footer {
          margin-top: auto;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border-light);
        }

        @media (max-width: 768px) {
          .team-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .team-meta {
            flex-direction: column;
            gap: var(--spacing-xs);
          }
        }
      `}</style>
    </>
  );
}

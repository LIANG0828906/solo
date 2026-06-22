import type { Event, Team } from '../types';
import { isPast, getDayName } from '../utils/dateUtils';

interface EventCardProps {
  event: Event;
  teams: Team[];
  currentTeamId?: string | null;
  onRegister: (eventId: string) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
}

export default function EventCard({
  event,
  teams,
  currentTeamId,
  onRegister,
  onEdit,
  onDelete,
}: EventCardProps) {
  const isExpired = isPast(event.date);
  const isRegistered = currentTeamId ? event.registeredTeamIds.includes(currentTeamId) : false;
  const isFull = event.registeredTeamIds.length >= event.maxParticipants;
  const remainingSpots = event.maxParticipants - event.registeredTeamIds.length;

  const registeredTeams = event.registeredTeamIds
    .map(id => teams.find(t => t.id === id)?.name)
    .filter(Boolean);

  const handleRegister = () => {
    if (!isExpired && !isFull && !isRegistered && currentTeamId) {
      onRegister(event.id);
    }
  };

  return (
    <>
      <div className={`event-card card ${isExpired ? 'expired' : ''}`}>
        <div className="event-header">
          <div className="event-date-badge">
            <div className="event-day">
              {new Date(event.date).getDate()}
            </div>
            <div className="event-month">
              {new Date(event.date).toLocaleDateString('zh-CN', { month: 'short' })}
            </div>
          </div>

          <div className="event-info">
            <h3 className="event-title">{event.title}</h3>
            <div className="event-meta">
              <span className="meta-item">
                <span>📅</span>
                {event.date} {getDayName(event.date)}
              </span>
              <span className="meta-item">
                <span>🕐</span>
                {event.time}
              </span>
              <span className="meta-item">
                <span>📍</span>
                {event.location}
              </span>
            </div>
          </div>

          {isExpired && (
            <span className="badge badge-danger expired-badge">
              已结束
            </span>
          )}
        </div>

        <p className="event-description">{event.description}</p>

        <div className="event-registration">
          <div className="registration-info">
            <div className="registered-count">
              <span className="count-number">
                {event.registeredTeamIds.length}
              </span>
              <span className="count-separator">/</span>
              <span className="count-total">{event.maxParticipants}</span>
              <span className="count-label">已报名</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(event.registeredTeamIds.length / event.maxParticipants) * 100}%`,
                  backgroundColor: isFull ? 'var(--color-danger)' : 'var(--color-primary)',
                }}
              />
            </div>

            {!isExpired && remainingSpots > 0 && remainingSpots <= 5 && (
              <span className="remaining-spots">
                仅剩 {remainingSpots} 个名额
              </span>
            )}
          </div>

          <div className="registration-actions">
            {!isExpired && (
              <>
                <button
                  className={`btn ${isRegistered ? 'btn-success' : isFull ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleRegister}
                  disabled={isFull || isRegistered}
                >
                  {isRegistered ? '✓ 已报名' : isFull ? '名额已满' : '立即报名'}
                </button>
              </>
            )}

            {(onEdit || onDelete) && (
              <div className="admin-actions">
                {onEdit && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => onEdit(event)}
                  >
                    编辑
                  </button>
                )}
                {onDelete && (
                  <button
                    className="btn btn-ghost btn-sm text-danger"
                    onClick={() => onDelete(event)}
                  >
                    删除
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {registeredTeams.length > 0 && (
          <div className="registered-teams">
            <span className="teams-label">已报名团队：</span>
            <div className="teams-list">
              {registeredTeams.slice(0, 5).map((name, idx) => (
                <span key={idx} className="team-tag">
                  {name}
                </span>
              ))}
              {registeredTeams.length > 5 && (
                <span className="team-more">+{registeredTeams.length - 5}</span>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .event-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          transition: all var(--transition-fast);
        }

        .event-card.expired {
          opacity: 0.6;
          filter: grayscale(0.3);
        }

        .event-header {
          display: flex;
          gap: var(--spacing-md);
          align-items: flex-start;
        }

        .event-date-badge {
          width: 60px;
          height: 70px;
          background: linear-gradient(135deg, var(--color-primary), #6366F1);
          color: white;
          border-radius: var(--radius-card);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .event-day {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          line-height: 1;
        }

        .event-month {
          font-size: var(--font-size-xs);
          text-transform: uppercase;
          opacity: 0.9;
        }

        .event-info {
          flex: 1;
          min-width: 0;
        }

        .event-title {
          font-size: var(--font-size-lg);
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .event-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .expired-badge {
          flex-shrink: 0;
        }

        .event-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .event-registration {
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border-light);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .registration-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .registered-count {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .count-number {
          font-size: var(--font-size-xl);
          font-weight: 700;
          color: var(--color-primary);
        }

        .count-separator {
          font-size: var(--font-size-md);
          color: var(--color-text-tertiary);
        }

        .count-total {
          font-size: var(--font-size-md);
          color: var(--color-text-tertiary);
        }

        .count-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-left: var(--spacing-xs);
        }

        .progress-bar {
          height: 6px;
          background: var(--color-bg-primary);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width var(--transition-normal);
        }

        .remaining-spots {
          font-size: var(--font-size-xs);
          color: var(--color-warning);
          font-weight: 500;
        }

        .registration-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .admin-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        .text-danger {
          color: var(--color-danger);
        }

        .registered-teams {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--spacing-sm);
          padding-top: var(--spacing-sm);
          border-top: 1px dashed var(--color-border-light);
        }

        .teams-label {
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .teams-list {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
        }

        .team-tag {
          padding: 2px 8px;
          background: var(--color-bg-primary);
          border-radius: 12px;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .team-more {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        @media (max-width: 768px) {
          .event-meta {
            flex-direction: column;
            gap: var(--spacing-xs);
          }

          .registration-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .registration-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

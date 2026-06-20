import { useState } from 'react';
import type { Seat, Team, SeatSwapRequest } from '../types';
import { getColorByTeamId } from '../utils/colorUtils';

interface SeatMapProps {
  seats: Seat[];
  teams: Team[];
  selectedTeamId?: string | null;
  currentUserTeamId?: string | null;
  onSeatClick?: (seat: Seat) => void;
  onSwapRequest?: (fromSeatId: string, toSeatId: string) => void;
  onApproveSwap?: (requestId: string) => void;
  onRejectSwap?: (requestId: string) => void;
  swapRequests?: SeatSwapRequest[];
}

export default function SeatMap({
  seats,
  teams,
  selectedTeamId,
  currentUserTeamId,
  onSeatClick,
  onSwapRequest,
  onApproveSwap,
  onRejectSwap,
  swapRequests = [],
}: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [selectedFromSeat, setSelectedFromSeat] = useState<string | null>(null);

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const columns = 10;

  const getSeat = (row: string, col: number) => {
    return seats.find(s => s.row === row && s.column === col);
  };

  const getSeatColor = (seat: Seat | undefined) => {
    if (!seat) return 'transparent';
    if (seat.status === 'pending') return 'var(--color-warning)';
    if (seat.teamId) {
      return getColorByTeamId(seat.teamId, teams);
    }
    return 'var(--color-border)';
  };

  const isSeatHighlighted = (seat: Seat | undefined) => {
    if (!seat) return false;
    if (selectedTeamId && seat.teamId === selectedTeamId) return true;
    if (selectedFromSeat && seat.id === selectedFromSeat) return true;
    return false;
  };

  const handleSeatClick = (seat: Seat) => {
    if (onSwapRequest && currentUserTeamId) {
      if (!selectedFromSeat) {
        if (seat.teamId === currentUserTeamId) {
          setSelectedFromSeat(seat.id);
        }
      } else {
        if (seat.id === selectedFromSeat) {
          setSelectedFromSeat(null);
        } else if (seat.teamId !== currentUserTeamId) {
          onSwapRequest(selectedFromSeat, seat.id);
          setSelectedFromSeat(null);
        }
      }
    }
    onSeatClick?.(seat);
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return '空闲';
    const team = teams.find(t => t.id === teamId);
    return team?.name || '未知团队';
  };

  const pendingSwaps = swapRequests.filter(r => r.status === 'pending');

  return (
    <>
      <div className="seat-map-container card">
        <div className="seat-map-header">
          <h3 className="seat-map-title">
            <span>🗺️</span>
            工位平面图
          </h3>
          {currentUserTeamId && (
            <div className="swap-hint">
              {selectedFromSeat ? (
                <span className="hint-text">
                  请选择目标工位进行调换
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setSelectedFromSeat(null)}
                  >
                    取消
                  </button>
                </span>
              ) : (
                <span className="hint-text">
                  💡 点击您的工位可申请调换
                </span>
              )}
            </div>
          )}
        </div>

        <div className="seat-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'var(--color-border)' }} />
            <span>空闲</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'var(--color-primary)' }} />
            <span>已占用</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: 'var(--color-warning)' }} />
            <span>待审批</span>
          </div>
          {selectedTeamId && (
            <div className="legend-item">
              <span
                className="legend-color"
                style={{ background: getColorByTeamId(selectedTeamId, teams) }}
              />
              <span>选中团队</span>
            </div>
          )}
        </div>

        <div className="seat-map">
          <div className="seat-map-grid">
            <div className="col-labels">
              <div className="corner-space" />
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="col-label">{i + 1}</div>
              ))}
            </div>

            {rows.map(row => (
              <div key={row} className="seat-row">
                <div className="row-label">{row}</div>
                {Array.from({ length: columns }).map((_, colIndex) => {
                  const col = colIndex + 1;
                  const seat = getSeat(row, col);
                  const isHighlighted = isSeatHighlighted(seat);
                  const isHovered = hoveredSeat === seat?.id;
                  const isSelected = selectedFromSeat === seat?.id;

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`seat-cell 
                        ${isHighlighted ? 'highlighted' : ''} 
                        ${isHovered ? 'hovered' : ''}
                        ${isSelected ? 'selected' : ''}
                      `}
                      onMouseEnter={() => seat && setHoveredSeat(seat.id)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      onClick={() => seat && handleSeatClick(seat)}
                    >
                      <div
                        className="seat-box"
                        style={{
                          backgroundColor: getSeatColor(seat),
                          opacity: seat?.status === 'pending' ? 0.6 : 1,
                        }}
                      >
                        {seat?.tempTeamId && (
                          <div
                            className="temp-indicator"
                            style={{ backgroundColor: getColorByTeamId(seat.tempTeamId, teams) }}
                          />
                        )}
                      </div>

                      {isHovered && seat && (
                        <div className="seat-tooltip">
                          <div className="tooltip-seat-id">工位 {seat.id}</div>
                          <div className="tooltip-team">
                            {getTeamName(seat.teamId)}
                          </div>
                          {seat.status === 'pending' && (
                            <div className="tooltip-status">调换审批中</div>
                          )}
                          {currentUserTeamId && seat.teamId === currentUserTeamId && (
                            <div className="tooltip-action">点击选择调换</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="room-indicator">
            <div className="entrance">入口 →</div>
            <div className="window">🪟 窗户</div>
          </div>
        </div>

        {pendingSwaps.length > 0 && (onApproveSwap || onRejectSwap) && (
          <div className="swap-requests">
            <h4 className="requests-title">
              <span>⏳</span>
              待审批调换申请 ({pendingSwaps.length})
            </h4>
            <div className="requests-list">
              {pendingSwaps.map(request => {
                const fromSeat = seats.find(s => s.id === request.fromSeatId);
                const toSeat = seats.find(s => s.id === request.toSeatId);
                const team = teams.find(t => t.id === request.teamId);

                return (
                  <div key={request.id} className="request-item">
                    <div className="request-info">
                      <span
                        className="team-dot"
                        style={{ backgroundColor: team?.color }}
                      />
                      <span className="request-text">
                        <strong>{team?.name}</strong> 申请将工位{' '}
                        <code>{fromSeat?.id}</code> 调换到{' '}
                        <code>{toSeat?.id}</code>
                      </span>
                    </div>
                    <div className="request-actions">
                      {onApproveSwap && (
                        <button
                          className="btn btn-success btn-xs"
                          onClick={() => onApproveSwap(request.id)}
                        >
                          批准
                        </button>
                      )}
                      {onRejectSwap && (
                        <button
                          className="btn btn-danger btn-xs"
                          onClick={() => onRejectSwap(request.id)}
                        >
                          拒绝
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .seat-map-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .seat-map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .seat-map-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-lg);
          font-weight: 600;
        }

        .swap-hint {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .hint-text {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .btn-xs {
          padding: 2px 8px;
          font-size: var(--font-size-xs);
          min-height: 24px;
          min-width: auto;
        }

        .seat-legend {
          display: flex;
          gap: var(--spacing-xl);
          padding: var(--spacing-md);
          background: var(--color-bg-primary);
          border-radius: var(--radius-card);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid var(--color-border);
        }

        .seat-map {
          position: relative;
          overflow-x: auto;
          padding-bottom: var(--spacing-md);
        }

        .seat-map-grid {
          min-width: 600px;
        }

        .col-labels {
          display: flex;
          margin-bottom: var(--spacing-xs);
        }

        .corner-space {
          width: 30px;
        }

        .col-label {
          flex: 1;
          text-align: center;
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .seat-row {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .row-label {
          width: 30px;
          font-size: var(--font-size-sm);
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .seat-cell {
          flex: 1;
          aspect-ratio: 1;
          max-width: 50px;
          padding: 2px;
          cursor: pointer;
          position: relative;
          transition: all var(--transition-fast);
        }

        .seat-cell:hover {
          transform: scale(1.1);
          z-index: 10;
        }

        .seat-cell.highlighted .seat-box {
          box-shadow: 0 0 0 3px var(--color-primary);
        }

        .seat-cell.selected .seat-box {
          box-shadow: 0 0 0 3px var(--color-success);
          animation: pulse-border 1s infinite;
        }

        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 3px var(--color-success); }
          50% { box-shadow: 0 0 0 5px var(--color-success); }
        }

        .seat-box {
          width: 100%;
          height: 100%;
          border-radius: 4px;
          border: 2px solid var(--color-border);
          position: relative;
          transition: all var(--transition-fast);
        }

        .temp-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .seat-tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-button);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
          z-index: 100;
          font-size: var(--font-size-xs);
        }

        .seat-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: white;
        }

        .tooltip-seat-id {
          font-weight: 600;
          color: var(--color-text-primary);
          margin-bottom: 2px;
        }

        .tooltip-team {
          color: var(--color-text-secondary);
        }

        .tooltip-status {
          color: var(--color-warning);
          margin-top: 2px;
        }

        .tooltip-action {
          color: var(--color-primary);
          margin-top: 2px;
          font-weight: 500;
        }

        .room-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
        }

        .entrance {
          padding: var(--spacing-xs) var(--spacing-sm);
          background: var(--color-primary);
          color: white;
          border-radius: var(--radius-button);
        }

        .window {
          text-align: right;
        }

        .swap-requests {
          padding: var(--spacing-md);
          background: var(--color-bg-primary);
          border-radius: var(--radius-card);
        }

        .requests-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-base);
          font-weight: 600;
          margin-bottom: var(--spacing-md);
        }

        .requests-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .request-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          background: white;
          border-radius: var(--radius-button);
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .request-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
        }

        .team-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .request-text code {
          background: var(--color-bg-primary);
          padding: 1px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: var(--font-size-xs);
        }

        .request-actions {
          display: flex;
          gap: var(--spacing-xs);
        }

        @media (max-width: 768px) {
          .seat-legend {
            flex-wrap: wrap;
            gap: var(--spacing-md);
          }

          .seat-map-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}

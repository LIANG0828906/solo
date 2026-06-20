import React from 'react';
import { Waypoint } from '../types';
import { RecordCard } from './RecordCard';

interface LogPanelProps {
  waypoints: Waypoint[];
  highlightedWaypointId: string | null;
  isMobileOpen: boolean;
  onRecordClick: (waypointId: string) => void;
}

interface LogEntry {
  waypointId: string;
  waypointElevation: number;
  record: Waypoint['records'][0];
}

export const LogPanel: React.FC<LogPanelProps> = ({
  waypoints,
  highlightedWaypointId,
  isMobileOpen,
  onRecordClick,
}) => {
  const logEntries: LogEntry[] = waypoints
    .flatMap((wp) =>
      wp.records.map((record) => ({
        waypointId: wp.id,
        waypointElevation: wp.elevation,
        record,
      }))
    )
    .sort((a, b) => a.record.timestamp - b.record.timestamp);

  return (
    <div className={`log-panel ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div className="log-panel-header">
        旅行日志 ({logEntries.length})
      </div>
      <div className="log-list">
        {logEntries.length === 0 ? (
          <div className="empty-log">
            点击地图上的途经点添加记录<br />
            记录你的徒步回忆
          </div>
        ) : (
          logEntries.map((entry) => (
            <RecordCard
              key={entry.record.id}
              record={entry.record}
              isHighlighted={entry.waypointId === highlightedWaypointId}
              onClick={() => onRecordClick(entry.waypointId)}
            />
          ))
        )}
      </div>
    </div>
  );
};

import React, { useCallback, useState } from 'react';
import TimelineCanvas from './timeline/TimelineCanvas';
import CausalGraph from './causal-network/CausalGraph';
import { useGameStore, type HistoryEvent } from './store/gameStore';

const typeLabelMap: Record<HistoryEvent['type'], string> = {
  major: '重大事件',
  minor: '次要事件',
  turning: '转折事件',
};

const App: React.FC = () => {
  const { events, deliveredEventIds, resetGame, beacons, graphNodes } = useGameStore();
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [dragOverEventId, setDragOverEventId] = useState<string | null>(null);

  const onBeaconDragEnterEvent = useCallback((id: string) => {
    setDragOverEventId(id);
  }, []);
  const onBeaconDragLeaveEvent = useCallback((id: string) => {
    setDragOverEventId((cur) => (cur === id ? null : cur));
  }, []);
  const onBeaconDeliveredAt = useCallback(() => {
    setDragOverEventId(null);
  }, []);

  const totalPossibleChains = 4;

  return (
    <div className="app-root">
      <aside className="app-left">
        <div className="panel-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="panel-title">
              <span className="dot" style={{ background: '#FFB347', boxShadow: '0 0 10px #FFB347' }} />
              历史事件档案
            </div>
            <div className="panel-subtitle">
              拖拽信标至卡片完成投递
            </div>
          </div>
          <button
            className="zoom-btn"
            title="重置"
            onClick={resetGame}
            style={{ fontSize: 12, padding: '0 10px', width: 'auto' }}
          >
            重置
          </button>
        </div>

        <div className="event-list">
          {events.map((ev) => {
            const delivered = deliveredEventIds.has(ev.id);
            const hovered = hoveredEventId === ev.id || dragOverEventId === ev.id;
            return (
              <div
                key={ev.id}
                data-event-card={ev.id}
                className={[
                  'event-card',
                  ev.type,
                  hovered ? 'drag-over' : '',
                  delivered ? 'delivered' : '',
                ].join(' ')}
                onMouseEnter={() => !delivered && setHoveredEventId(ev.id)}
                onMouseLeave={() => setHoveredEventId(null)}
              >
                <div className="event-title">{ev.title}</div>
                <div className="event-meta">
                  <span className="event-year-tag">{ev.year}</span>
                  <span className={`event-type-tag ${ev.type}`}>
                    {typeLabelMap[ev.type]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="status-footer" style={{ padding: '10px 14px' }}>
          <span className="closure-count">
            已投递 {deliveredEventIds.size} / {events.length}
          </span>
          <span className="closure-count">
            信标 {beacons.filter((b) => !b.isDelivered).length} · 节点 {graphNodes.length}
          </span>
        </div>
      </aside>

      <main className="app-center">
        <TimelineCanvas
          onBeaconDragEnterEvent={onBeaconDragEnterEvent}
          onBeaconDragLeaveEvent={onBeaconDragLeaveEvent}
          hoveredEventId={dragOverEventId}
          onBeaconDeliveredAt={onBeaconDeliveredAt}
        />
      </main>

      <aside className="app-right">
        <CausalGraph />
        <div style={{ display: 'none' }}>{totalPossibleChains}</div>
      </aside>
    </div>
  );
};

export default App;

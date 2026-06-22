import { useTimelineStore } from '../store/useTimelineStore';

export default function ViewportInfo() {
  const viewport = useTimelineStore(s => s.viewport);
  const formatDate = useTimelineStore(s => s.formatDate);
  const getTotalNodes = useTimelineStore(s => s.getTotalNodes);
  const timelines = useTimelineStore(s => s.timelines);

  const zoomPercent = Math.round(viewport.zoom * 100);
  const dateStr = formatDate(viewport.centerTime);

  const date = new Date(viewport.centerTime);
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <div className="viewport-info">
      <div className="viewport-info-item">
        <span className="viewport-info-label">缩放</span>
        <span className="viewport-info-value">{zoomPercent}%</span>
      </div>
      <div className="viewport-info-item">
        <span className="viewport-info-label">中心日期</span>
        <span className="viewport-info-value">{dateStr}</span>
      </div>
      <div className="viewport-info-item">
        <span className="viewport-info-label">中心时间</span>
        <span className="viewport-info-value">{timeStr}</span>
      </div>
      <div className="viewport-info-item">
        <span className="viewport-info-label">偏移</span>
        <span className="viewport-info-value">
          {Math.round(viewport.offsetX)}, {Math.round(viewport.offsetY)}
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px solid var(--panel-border)',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <span className="viewport-info-label">
          {timelines.length} 条时间线 · {getTotalNodes()} 个节点
        </span>
      </div>
    </div>
  );
}

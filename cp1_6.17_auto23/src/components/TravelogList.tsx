import { Spin } from 'antd';
import { useTravelogStore } from '../store/travelogStore';
import type { Travelog } from '../types';

interface TravelogListProps {
  onTravelogClick: (travelog: Travelog) => void;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function TravelogList({ onTravelogClick }: TravelogListProps) {
  const { travelogs, loading } = useTravelogStore();

  const sortedTravelogs = [...travelogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading && travelogs.length === 0) {
    return (
      <div className="travelog-list-page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="travelog-list-page" style={{ paddingTop: 60 }}>
      {sortedTravelogs.length === 0 ? (
        <div className="empty-state" style={{ height: '60vh' }}>
          <div className="empty-state-icon">📝</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>暂无游记</div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            去地图签到处添加签到点，然后生成你的第一篇游记吧！
          </div>
        </div>
      ) : (
        <div className="travelog-grid">
          {sortedTravelogs.map((travelog, index) => (
            <div
              key={travelog.id}
              className="travelog-card"
              onClick={() => onTravelogClick(travelog)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <img
                src={travelog.coverPhoto}
                alt={travelog.title}
                className="travelog-card-cover"
              />
              <div className="travelog-card-content">
                <div className="travelog-card-title">{travelog.title}</div>
                <div className="travelog-card-summary">{travelog.content}</div>
                <div className="travelog-card-date">
                  {formatDateTime(travelog.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TravelogList;

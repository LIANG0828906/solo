import { useEffect } from 'react';
import { Empty, Spin, Typography } from 'antd';
import { useTravelogStore } from '@/store/travelogStore';
import { useMapStore } from '@/store/mapStore';
import { formatDateTime } from '@/utils/format';
import type { Travelog } from '@/types';

const { Title, Paragraph } = Typography;

interface TravelogListProps {
  onSelectTravelog: (travelog: Travelog) => void;
}

export default function TravelogList({ onSelectTravelog }: TravelogListProps) {
  const { travelogs, loading, fetchTravelogs } = useTravelogStore();
  const { fetchCheckins } = useMapStore();

  useEffect(() => {
    fetchTravelogs();
    fetchCheckins();
  }, [fetchTravelogs, fetchCheckins]);

  const sortedTravelogs = [...travelogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (sortedTravelogs.length === 0) {
    return (
      <div style={{ padding: '80px' }}>
        <Empty description="还没有游记，去地图签到后生成第一篇游记吧！" />
      </div>
    );
  }

  return (
    <div className="travelog-list-container">
      <div className="travelog-grid">
        {sortedTravelogs.map((travelog, index) => (
          <div
            key={travelog.id}
            className="travelog-card"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => onSelectTravelog(travelog)}
          >
            <div className="travelog-card-image">
              {travelog.coverPhotoUrl ? (
                <img src={travelog.coverPhotoUrl} alt={travelog.title} />
              ) : (
                <div className="travelog-card-placeholder">
                  <span>📸</span>
                </div>
              )}
            </div>
            <div className="travelog-card-content">
              <Title level={5} ellipsis={{ rows: 1 }} className="travelog-card-title">
                {travelog.title}
              </Title>
              <Paragraph ellipsis={{ rows: 2 }} className="travelog-card-summary">
                {travelog.content}
              </Paragraph>
              <div className="travelog-card-footer">
                <span>{formatDateTime(travelog.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

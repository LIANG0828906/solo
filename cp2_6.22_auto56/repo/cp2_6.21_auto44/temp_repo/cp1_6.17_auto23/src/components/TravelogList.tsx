import { Spin, Card, Button } from 'antd';
import { HeartOutlined, HeartFilled, EnvironmentOutlined, EyeOutlined } from '@ant-design/icons';
import { useTravelogStore } from '../store/travelogStore';
import type { Travelog } from '../types';

interface TravelogListProps {
  onTravelogClick: (travelogId: string) => void;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function CoverImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div
        style={{
          width: '100%',
          height: 180,
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#bfbfbf',
        }}
      >
        <EnvironmentOutlined style={{ fontSize: 48 }} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        height: 180,
        objectFit: 'cover',
        display: 'block',
      }}
    />
  );
}

function TravelogList({ onTravelogClick }: TravelogListProps) {
  const { travelogs, loading, favorites, toggleFavorite } = useTravelogStore();

  const sortedTravelogs = [...travelogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleFavoriteClick = (e: React.MouseEvent, travelogId: string) => {
    e.stopPropagation();
    toggleFavorite(travelogId);
  };

  const handleDetailClick = (e: React.MouseEvent, travelogId: string) => {
    e.stopPropagation();
    onTravelogClick(travelogId);
  };

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
          {sortedTravelogs.map((travelog: Travelog, index: number) => {
            const isFavorited = favorites.includes(travelog.id);
            return (
              <div
                key={travelog.id}
                style={{
                  animation: 'fadeIn 0.3s ease forwards',
                  animationDelay: `${index * 0.05}s`,
                  opacity: 0,
                  width: '100%',
                  maxWidth: 300,
                  margin: '0 auto',
                }}
              >
                <Card
                  hoverable
                  onClick={() => onTravelogClick(travelog.id)}
                  styles={{
                    body: { padding: 16 },
                  }}
                  style={{
                    width: '100%',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                  cover={
                    <div style={{ position: 'relative' }}>
                      <CoverImage src={travelog.coverPhoto} alt={travelog.title} />
                      <button
                        onClick={(e) => handleFavoriteClick(e, travelog.id)}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'rgba(255,255,255,0.9)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          zIndex: 10,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform =
                            'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.transform =
                            'scale(1)';
                        }}
                      >
                        {isFavorited ? (
                          <HeartFilled style={{ color: '#f5222d', fontSize: 16 }} />
                        ) : (
                          <HeartOutlined
                            style={{ color: '#8c8c8c', fontSize: 16 }}
                          />
                        )}
                      </button>
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#212121',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {travelog.title}
                      </div>
                    }
                    description={
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            color: '#757575',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: 39,
                            marginBottom: 12,
                          }}
                        >
                          {travelog.content}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: 12, color: '#9e9e9e' }}>
                            {formatDateTime(travelog.createdAt)}
                          </span>
                          <Button
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={(e) => handleDetailClick(e, travelog.id)}
                            style={{ padding: 0 }}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TravelogList;

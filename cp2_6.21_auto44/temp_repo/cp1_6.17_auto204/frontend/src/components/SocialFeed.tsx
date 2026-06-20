import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeed, FeedItem } from '../services/api';

const categoryMap: Record<string, string> = {
  '小说': 'feed-card-novel',
  '科普': 'feed-card-science',
  '历史': 'feed-card-history',
  '哲学': 'feed-card-philosophy',
  '艺术': 'feed-card-art',
  '其他': 'feed-card-other',
};

function getInitials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

export default function SocialFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFeed = async () => {
    try {
      const data = await getFeed();
      setFeed(data);
    } catch (error) {
      console.error('获取动态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = (userId: string) => {
    navigate(`/${userId}`);
  };

  return (
    <div className="social-feed">
      <h3 className="feed-title">好友阅读动态</h3>
      {loading ? (
        <div style={{ color: '#94A3B8', textAlign: 'center', padding: '20px' }}>
          加载中...
        </div>
      ) : (
        feed.map((item) => (
          <div
            key={item.id}
            className={`feed-card ${categoryMap[item.category] || 'feed-card-other'}`}
            onClick={() => handleCardClick(item.userId)}
          >
            <div className="feed-avatar">{getInitials(item.userName)}</div>
            <div className="feed-content">
              <div className="feed-user-name">{item.userName}</div>
              <div className="feed-book-title">《{item.bookTitle}》</div>
              <div className="feed-review">{item.review}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

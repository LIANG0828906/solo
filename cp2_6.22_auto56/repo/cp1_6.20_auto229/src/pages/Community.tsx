import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, TrendingUp, Clock } from 'lucide-react';
import FeedCard from '@/components/FeedCard';
import { communityApi, brewApi } from '@/utils/storage';
import type { BrewRecord } from '@/types';

export default function Community() {
  const navigate = useNavigate();
  const [brews, setBrews] = useState<BrewRecord[]>([]);
  const [sortBy, setSortBy] = useState<'likes' | 'date'>('likes');
  const [visibleStart, setVisibleStart] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cardsPerView = 3;

  useEffect(() => {
    loadBrews();
  }, [sortBy]);

  const loadBrews = async () => {
    try {
      const res = await communityApi.getBrews(1, 50, sortBy);
      setBrews(res.data);
    } catch (err) {
      console.error('Failed to load:', err);
    }
  };

  const handleCopy = (brew: BrewRecord) => {
    sessionStorage.setItem('copiedBrew', JSON.stringify(brew));
    navigate(`/brew/new?beanId=${brew.beanId}`);
  };

  const handleLike = async (id: string) => {
    try {
      const res = await brewApi.like(id);
      setBrews((prev) =>
        prev.map((b) => (b.id === id ? { ...b, likes: res.likes } : b))
      );
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  const scrollPrev = () => {
    setVisibleStart((prev) => Math.max(0, prev - cardsPerView));
  };

  const scrollNext = () => {
    setVisibleStart((prev) =>
      Math.min(brews.length - cardsPerView, prev + cardsPerView)
    );
  };

  const visibleBrews = brews.slice(visibleStart, visibleStart + cardsPerView);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>社区分享</h2>
        <div style={styles.sortTabs}>
          <button
            style={{
              ...styles.sortTab,
              backgroundColor: sortBy === 'likes' ? '#e94560' : 'transparent',
              color: sortBy === 'likes' ? '#fff' : '#aaa',
            }}
            onClick={() => setSortBy('likes')}
          >
            <TrendingUp size={14} />
            最热
          </button>
          <button
            style={{
              ...styles.sortTab,
              backgroundColor: sortBy === 'date' ? '#e94560' : 'transparent',
              color: sortBy === 'date' ? '#fff' : '#aaa',
            }}
            onClick={() => setSortBy('date')}
          >
            <Clock size={14} />
            最新
          </button>
        </div>
      </div>

      <div className="carousel-wrapper" style={styles.carouselWrapper}>
        <button
          style={{
            ...styles.navBtn,
            opacity: visibleStart === 0 ? 0.3 : 1,
            pointerEvents: visibleStart === 0 ? 'none' : 'auto',
          }}
          onClick={scrollPrev}
        >
          <ChevronLeft size={24} />
        </button>

        <div ref={scrollRef} className="cards-container" style={styles.cardsContainer}>
          {visibleBrews.map((brew, index) => (
            <div
              key={brew.id}
              className="card-wrapper"
              style={{
                ...styles.cardWrapper,
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <FeedCard
                brew={brew}
                onCopy={handleCopy}
                onLike={handleLike}
              />
            </div>
          ))}
        </div>

        <button
          style={{
            ...styles.navBtn,
            opacity:
              visibleStart + cardsPerView >= brews.length ? 0.3 : 1,
            pointerEvents:
              visibleStart + cardsPerView >= brews.length ? 'none' : 'auto',
          }}
          onClick={scrollNext}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div style={styles.dots}>
        {Array.from({ length: Math.ceil(brews.length / cardsPerView) }).map(
          (_, i) => (
            <div
              key={i}
              style={{
                ...styles.dot,
                backgroundColor:
                  i * cardsPerView === visibleStart ? '#e94560' : '#333',
              }}
              onClick={() => setVisibleStart(i * cardsPerView)}
            />
          )
        )}
      </div>

      <p style={styles.hint}>
        点击「抄作业」将参数复制到你的新冲煮记录中
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    color: '#eee',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
    color: '#eee',
  },
  sortTabs: {
    display: 'flex',
    gap: 8,
    backgroundColor: '#16213e',
    padding: 4,
    borderRadius: 8,
  },
  sortTab: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 16px',
    border: 'none',
    borderRadius: 6,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  carouselWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  navBtn: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: '#16213e',
    color: '#eee',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  cardsContainer: {
    flex: 1,
    display: 'flex',
    gap: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  cardWrapper: {
    flex: 1,
    maxWidth: 300,
  },
  dots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  hint: {
    textAlign: 'center',
    fontSize: 13,
    color: '#666',
    margin: 0,
  },
};

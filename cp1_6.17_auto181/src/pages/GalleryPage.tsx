import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import WorkCard from '../components/WorkCard';
import Loading from '../components/Loading';

interface GalleryPageProps {
  limit?: number;
  showTitle?: boolean;
  userId?: string;
}

function GalleryPage({ limit, showTitle = true, userId }: GalleryPageProps) {
  const navigate = useNavigate();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const loadWorks = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const params: any = {
        page: pageNum,
        limit: limit || 12
      };
      
      if (userId) {
        params.userId = userId;
      }
      
      const response = await axios.get('/api/works', { params });
      
      if (reset) {
        setWorks(response.data.works);
      } else {
        setWorks(prev => [...prev, ...response.data.works]);
      }
      
      setHasMore(response.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('加载作品失败:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, limit, userId]);

  useEffect(() => {
    if (isFirstLoad.current) {
      loadWorks(1, true);
      isFirstLoad.current = false;
    }
  }, [loadWorks]);

  useEffect(() => {
    if (limit) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadWorks(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, page, loadWorks, limit]);

  const handleWorkClick = (workId: string) => {
    navigate(`/critique/${workId}`);
  };

  return (
    <div className="gallery-section">
      {showTitle && <h2 className="gallery-title">作品画廊</h2>}
      
      <div className="gallery-grid">
        {works.map((work) => (
          <WorkCard
            key={work.id}
            work={work}
            critiqueCount={Math.floor(Math.random() * 8)}
            onClick={() => handleWorkClick(work.id)}
          />
        ))}
      </div>
      
      {loading && <Loading />}
      
      {!limit && hasMore && (
        <div ref={loaderRef} style={{ height: '20px', margin: '20px 0' }} />
      )}
      
      {!hasMore && works.length > 0 && (
        <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
          已加载全部作品
        </p>
      )}
    </div>
  );
}

export default GalleryPage;

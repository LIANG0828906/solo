import { useEffect, useState } from 'react';
import GalleryCard from '@/components/GalleryCard';
import { useGalleryStore } from '@/store/galleryStore';
import { fetchAudioList } from '@/api/mockApi';

export default function GalleryPage() {
  const { audioList, setAudioList } = useGalleryStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAudioList();
        setAudioList(data);
      } catch (error) {
        console.error('Failed to load audio list:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [setAudioList]);

  const gridColumns = isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>声音画廊</h1>
          <p style={styles.subtitle}>
            探索每个人的音乐情绪世界
          </p>
        </div>

        {isLoading ? (
          <div style={styles.loading}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>加载中...</p>
          </div>
        ) : (
          <div style={{ ...styles.grid, gridTemplateColumns: gridColumns }}>
            {audioList.map((audio) => (
              <GalleryCard key={audio.id} audio={audio} />
            ))}
          </div>
        )}

        {!isLoading && audioList.length === 0 && (
          <div style={styles.empty}>
            <p style={styles.emptyText}>暂无音频，去上传第一个吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#0B0E17',
    padding: '40px 20px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888899',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gap: '24px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #2A2A44',
    borderTopColor: '#6C63FF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '14px',
    color: '#888899',
    marginTop: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 0',
  },
  emptyText: {
    fontSize: '16px',
    color: '#888899',
  },
};

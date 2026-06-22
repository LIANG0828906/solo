import React, { useState } from 'react';
import { useExhibition } from './hooks/useExhibition';
import ImageCarousel from './components/ImageCarousel';
import AudioPlayer from './components/AudioPlayer';

interface ExhibitionPageProps {
  exhibitionId: number;
}

const ExhibitionPage: React.FC<ExhibitionPageProps> = ({ exhibitionId }) => {
  const { exhibition, images, audioUrl, loading, audioState, setAudioState } =
    useExhibition(exhibitionId);
  const [descExpanded, setDescExpanded] = useState(false);

  if (loading || !exhibition) {
    return (
      <div style={styles.loadingContainer}>
        <div className="skeleton-pulse" style={{ ...styles.skeletonBar, width: '60%' }} />
        <div className="skeleton-pulse" style={{ ...styles.skeletonBar, width: '100%', height: 16, marginTop: 12 }} />
        <div className="skeleton-pulse" style={{ ...styles.skeletonBar, width: '100%', height: 16, marginTop: 8 }} />
        <div className="skeleton-pulse" style={{ ...styles.skeletonBar, width: '40%', height: 16, marginTop: 8 }} />
      </div>
    );
  }

  const description = exhibition.description || '';
  const isLongDesc = description.length > 100;
  const displayDesc = descExpanded ? description : description.slice(0, 100);

  const handlePlayStateChange = (playing: boolean) => {
    setAudioState((prev) => ({ ...prev, playing }));
  };

  const handleProgressUpdate = (progress: number, currentTime: number, duration: number) => {
    setAudioState((prev) => ({ ...prev, progress, currentTime, duration }));
  };

  const handleEnded = () => {
    setAudioState((prev) => ({
      ...prev,
      playing: false,
      progress: 0,
      currentTime: 0,
    }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>{exhibition.name}</h1>

        <div style={styles.tags}>
          {exhibition.era && <span style={styles.tag}>{exhibition.era}</span>}
          {exhibition.material && <span style={styles.tag}>{exhibition.material}</span>}
        </div>

        <div style={styles.descriptionBlock}>
          <p style={styles.description}>
            {displayDesc}
            {isLongDesc && !descExpanded && '...'}
          </p>
          {isLongDesc && (
            <button
              style={styles.expandButton}
              onClick={() => setDescExpanded(!descExpanded)}
            >
              {descExpanded ? '收起' : '展开'}
            </button>
          )}
        </div>
      </div>

      <ImageCarousel images={images} />

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>语音解说</h3>
        {audioUrl && (
          <AudioPlayer
            audioUrl={audioUrl}
            playing={audioState.playing}
            onPlayStateChange={handlePlayStateChange}
            onProgressUpdate={handleProgressUpdate}
            onEnded={handleEnded}
          />
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  loadingContainer: {
    padding: 24,
  },
  skeletonBar: {
    height: 24,
    borderRadius: 8,
    background: '#334155',
  },
  card: {
    background: '#0F172A',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    color: '#F1F5F9',
    fontWeight: 700,
    textAlign: 'left',
    margin: 0,
  },
  tags: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  tag: {
    borderRadius: 6,
    background: '#334155',
    color: '#94A3B8',
    padding: '4px 12px',
    fontSize: 13,
  },
  descriptionBlock: {
    marginTop: 16,
    textAlign: 'left',
  },
  description: {
    color: '#F1F5F9',
    fontSize: 15,
    lineHeight: 1.7,
    margin: 0,
  },
  expandButton: {
    background: 'none',
    border: 'none',
    color: '#38BDF8',
    fontSize: 13,
    cursor: 'pointer',
    padding: '4px 0',
    marginTop: 4,
    transition: 'opacity 0.2s',
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 8px 0',
    textAlign: 'left',
  },
};

export default ExhibitionPage;

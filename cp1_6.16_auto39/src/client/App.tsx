import { useState, useEffect } from 'react';
import AudioUploader from './AudioUploader';
import WaveformEditor from './WaveformEditor';
import type { AudioClip } from './types';
import { getAllClips } from './audioStore';

function App() {
  const [currentPage, setCurrentPage] = useState<'upload' | 'editor'>('upload');
  const [clips, setClips] = useState<AudioClip[]>([]);

  useEffect(() => {
    loadClips();
  }, []);

  const loadClips = async () => {
    try {
      const savedClips = await getAllClips();
      setClips(savedClips);
    } catch (error) {
      console.error('Failed to load clips:', error);
    }
  };

  const handleClipAdded = (clip: AudioClip) => {
    setClips((prev) => [...prev, clip]);
  };

  const handleClipDeleted = (clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId));
  };

  return (
    <div style={styles.app}>
      <nav style={styles.navbar}>
        <h1 style={styles.logo}>🎙️ PodcastStudio</h1>
        <div style={styles.navButtons}>
          <button
            style={{
              ...styles.navButton,
              ...(currentPage === 'upload' ? styles.navButtonActive : {}),
            }}
            onClick={() => setCurrentPage('upload')}
          >
            上传与剪辑
          </button>
          <button
            style={{
              ...styles.navButton,
              ...(currentPage === 'editor' ? styles.navButtonActive : {}),
            }}
            onClick={() => setCurrentPage('editor')}
          >
            波形编辑器
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        {currentPage === 'upload' ? (
          <AudioUploader
            clips={clips}
            onClipAdded={handleClipAdded}
            onClipDeleted={handleClipDeleted}
          />
        ) : (
          <WaveformEditor clips={clips} />
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    backgroundColor: '#16213e',
    borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #00d2ff, #533483)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  navButtons: {
    display: 'flex',
    gap: '12px',
  },
  navButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    backgroundColor: '#0f3460',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    background: 'linear-gradient(135deg, #0f3460, #533483)',
    transform: 'scale(1.05)',
  },
  main: {
    flex: 1,
    padding: '24px',
  },
};

export default App;

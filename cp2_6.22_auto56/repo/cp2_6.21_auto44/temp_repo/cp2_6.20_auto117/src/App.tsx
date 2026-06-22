import React, { useEffect } from 'react';
import InputPanel from './components/InputPanel';
import CanvasArea from './components/CanvasArea';
import ParameterPanel from './components/ParameterPanel';
import GalleryBar from './components/GalleryBar';
import { useAppStore } from './store/useAppStore';

const App: React.FC = () => {
  const loadGalleryFromStorage = useAppStore((s) => s.loadGalleryFromStorage);

  useEffect(() => {
    loadGalleryFromStorage();
  }, [loadGalleryFromStorage]);

  return (
    <div style={styles.page}>
      <div style={styles.texture} />
      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.headerTitle}>诗意水墨</h1>
          <span style={styles.headerSub}>Poetic Ink Gallery</span>
        </header>

        <div style={styles.main}>
          <InputPanel />
          <div style={styles.center}>
            <CanvasArea />
            <GalleryBar />
          </div>
          <ParameterPanel />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        button:hover {
          filter: brightness(0.95);
        }
        .generateBtnHover:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(45,106,79,0.3);
        }
        input[type="range"] {
          -webkit-appearance: none;
          height: 6px;
          background: #e0e0d5;
          border-radius: 3px;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2d6a4f;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #2d6a4f;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        textarea:focus {
          border-color: #a0c0a8;
          box-shadow: 0 0 0 2px rgba(45,106,79,0.1);
        }
        input[type="text"]:focus, input:not([type]):focus {
          border-color: #a0c0a8;
          outline: none;
          box-shadow: 0 0 0 2px rgba(45,106,79,0.1);
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f5f0e8',
    position: 'relative',
    overflow: 'auto',
  },
  texture: {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.008) 2px,
        rgba(0,0,0,0.008) 4px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.005) 2px,
        rgba(0,0,0,0.005) 4px
      )
    `,
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
    maxWidth: 1280,
    margin: '0 auto',
    padding: '20px 24px 40px',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  headerTitle: {
    margin: 0,
    fontFamily: '"Ma Shan Zheng", "KaiTi", "STKaiti", serif',
    fontSize: 32,
    color: '#2c1810',
    fontWeight: 'normal',
    letterSpacing: 6,
  },
  headerSub: {
    fontSize: 12,
    color: '#aaa',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  main: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
};

export default App;

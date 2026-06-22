import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, X, Volume2 } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import { CanvasRenderer } from '@/modules/canvasRenderer';
import { createAudioAnalyzer } from '@/modules/audioAnalyzer';
import EmotionTag from './EmotionTag';
import type { AudioItem } from '@/types';

interface GalleryCardProps {
  audio: AudioItem;
}

export default function GalleryCard({ audio }: GalleryCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const fullscreenRendererRef = useRef<CanvasRenderer | null>(null);
  const analyzerRef = useRef<ReturnType<typeof createAudioAnalyzer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { incrementPlayCount } = useGalleryStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      if (rendererRef.current) {
        rendererRef.current.resize(rect.width, rect.height);
      }
    };

    updateSize();
    rendererRef.current = new CanvasRenderer(ctx, audio.emotion, audio.intensity, isMobile);
    rendererRef.current.start();

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      if (rendererRef.current) {
        rendererRef.current.resize(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (rendererRef.current) {
        rendererRef.current.stop();
        rendererRef.current = null;
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [audio.emotion, audio.intensity, isMobile]);

  const startFullscreenPlayback = useCallback(async () => {
    if (!audio.audioUrl) {
      alert('该音频暂无播放源');
      return;
    }

    setIsFullscreen(true);
    incrementPlayCount(audio.id);

    setTimeout(() => {
      const canvas = fullscreenCanvasRef.current;
      const audioEl = audioRef.current;
      if (!canvas || !audioEl) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      fullscreenRendererRef.current = new CanvasRenderer(ctx, audio.emotion, audio.intensity, isMobile);
      fullscreenRendererRef.current.resize(width, height);
      fullscreenRendererRef.current.start();

      if (audioEl) {
        analyzerRef.current = createAudioAnalyzer(audioEl);
        analyzerRef.current.connect();

        const updateSpectrum = () => {
          if (analyzerRef.current && !audioEl.paused && fullscreenRendererRef.current) {
            const spectrumData = analyzerRef.current.getSpectrumData();
            fullscreenRendererRef.current.setSpectrumData(spectrumData);
          }
          animationFrameRef.current = requestAnimationFrame(updateSpectrum);
        };
        updateSpectrum();

        audioEl.play().catch((err) => {
          console.error('Playback error:', err);
        });
      }
    }, 100);
  }, [audio, isMobile, incrementPlayCount]);

  const stopFullscreenPlayback = useCallback(() => {
    setIsFullscreen(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (analyzerRef.current) {
      analyzerRef.current.disconnect();
      analyzerRef.current = null;
    }
    if (fullscreenRendererRef.current) {
      fullscreenRendererRef.current.setSpectrumData(null);
      fullscreenRendererRef.current.stop();
      fullscreenRendererRef.current = null;
    }

    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        stopFullscreenPlayback();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, stopFullscreenPlayback]);

  return (
    <>
      <div
        style={{
          ...styles.card,
          ...(isHovered ? styles.cardHovered : {}),
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={styles.thumbnailContainer}>
          <canvas
            ref={canvasRef}
            style={styles.thumbnailCanvas}
          />
          <div
            style={{
              ...styles.playOverlay,
              opacity: isHovered ? 1 : 0,
            }}
          >
            <button
              style={styles.playButton}
              onClick={startFullscreenPlayback}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Play size={24} color="#FFFFFF" />
            </button>
          </div>
        </div>
        <div style={styles.cardContent}>
          <h3 style={styles.title}>{audio.title}</h3>
          <div style={styles.cardFooter}>
            <EmotionTag emotion={audio.emotion} size="small" />
            <span style={styles.playCount}>
              <Volume2 size={12} />
              {audio.playCount}
            </span>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div style={styles.fullscreenContainer}>
          <button
            style={styles.closeButton}
            onClick={stopFullscreenPlayback}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X size={24} color="#FFFFFF" />
          </button>
          <canvas
            ref={fullscreenCanvasRef}
            style={styles.fullscreenCanvas}
          />
          <div style={styles.fullscreenInfo}>
            <h2 style={styles.fullscreenTitle}>{audio.title}</h2>
            <EmotionTag
              emotion={audio.emotion}
              intensity={audio.intensity}
              size="medium"
            />
          </div>
          <audio ref={audioRef} src={audio.audioUrl} preload="auto" />
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: '12px',
    border: '1px solid #2A2A44',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
  },
  cardHovered: {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    paddingTop: '69.23%',
    overflow: 'hidden',
  },
  thumbnailCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    transition: 'opacity 0.2s ease',
  },
  playButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#6C63FF',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'transform 0.3s ease',
    paddingLeft: '4px',
  },
  cardContent: {
    padding: '16px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: '0 0 12px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playCount: {
    fontSize: '12px',
    color: '#888899',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  fullscreenContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: '#0B0E17',
  },
  fullscreenCanvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    zIndex: 1001,
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  fullscreenInfo: {
    position: 'absolute',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    zIndex: 1001,
  },
  fullscreenTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: '0 0 16px 0',
  },
};

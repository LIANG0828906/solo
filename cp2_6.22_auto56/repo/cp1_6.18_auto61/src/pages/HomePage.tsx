import { useRef, useEffect, useState, useCallback } from 'react';
import AudioUploader from '@/components/AudioUploader';
import { CanvasRenderer } from '@/modules/canvasRenderer';
import { useGalleryStore } from '@/store/galleryStore';
import type { EmotionResult } from '@/types';

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { currentEmotion, currentIntensity, setCurrentEmotion } = useGalleryStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!currentEmotion || !hasAnalysis) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const updateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      if (rendererRef.current) {
        rendererRef.current.resize(rect.width, rect.height);
      }
    };

    updateSize();
    rendererRef.current = new CanvasRenderer(ctx, currentEmotion, currentIntensity, isMobile);
    rendererRef.current.start();

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
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
  }, [currentEmotion, currentIntensity, isMobile, hasAnalysis]);

  const handleAnalysisComplete = useCallback(
    (result: EmotionResult) => {
      setCurrentEmotion(result.emotion, result.intensity);
      setHasAnalysis(true);
    },
    [setCurrentEmotion]
  );

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>声音画廊</h1>
          <p style={styles.subtitle}>
            上传你的音乐片段，让情绪以视觉的方式绽放
          </p>
        </div>

        {hasAnalysis && currentEmotion && (
          <div ref={containerRef} style={styles.canvasContainer}>
            <canvas ref={canvasRef} style={styles.canvas} />
          </div>
        )}

        <div style={styles.uploaderSection}>
          <AudioUploader onAnalysisComplete={handleAnalysisComplete} />
        </div>

        {!hasAnalysis && (
          <div style={styles.features}>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIcon, backgroundColor: '#FFD93D20' }}>
                <span style={{ color: '#FFD93D', fontSize: '24px' }}>🎵</span>
              </div>
              <h3 style={styles.featureTitle}>智能分析</h3>
              <p style={styles.featureDesc}>
                自动识别音乐情绪基调，精准映射四种情绪
              </p>
            </div>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIcon, backgroundColor: '#4D96FF20' }}>
                <span style={{ color: '#4D96FF', fontSize: '24px' }}>🎨</span>
              </div>
              <h3 style={styles.featureTitle}>动态画布</h3>
              <p style={styles.featureDesc}>
                根据情绪生成独特的动态抽象画视觉效果
              </p>
            </div>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIcon, backgroundColor: '#6BCB7720' }}>
                <span style={{ color: '#6BCB77', fontSize: '24px' }}>✨</span>
              </div>
              <h3 style={styles.featureTitle}>沉浸体验</h3>
              <p style={styles.featureDesc}>
                全屏播放模式，视听同步的沉浸式享受
              </p>
            </div>
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
    marginBottom: '48px',
  },
  title: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: '0 0 16px 0',
    background: 'linear-gradient(135deg, #6C63FF, #FF6B9D)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888899',
    margin: 0,
  },
  canvasContainer: {
    width: '100%',
    height: '400px',
    borderRadius: '16px',
    overflow: 'hidden',
    marginBottom: '32px',
    border: '1px solid #2A2A44',
  },
  canvas: {
    width: '100%',
    height: '100%',
    display: 'block',
  },
  uploaderSection: {
    marginBottom: '48px',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
    marginTop: '48px',
  },
  featureItem: {
    backgroundColor: '#1A1A2E',
    borderRadius: '12px',
    padding: '32px 24px',
    textAlign: 'center',
    border: '1px solid #2A2A44',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  featureIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
  },
  featureTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: '0 0 8px 0',
  },
  featureDesc: {
    fontSize: '14px',
    color: '#888899',
    margin: 0,
    lineHeight: 1.6,
  },
};

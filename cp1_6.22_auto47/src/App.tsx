import React, { useState, useRef, useCallback, useEffect } from 'react';
import MirrorCanvas from './MirrorCanvas';
import ToolPanel from './ToolPanel';
import { MakeupColors } from './utils/faceDetection';

const lipstickColors = [
  '#FF6B9D', '#E91E63', '#C2185B', '#FF5722',
  '#F06292', '#AD1457', '#FF8A80', '#D81B60'
];

const eyeshadowColors = [
  '#8E24AA', '#5E35B1', '#3949AB',
  '#EC407A', '#AB47BC', '#7B1FA2'
];

const blushColors = [
  '#FF80AB', '#F48FB1', '#F06292', '#EC407A'
];

const initialMakeup: MakeupColors = {
  lipstick: null,
  eyeshadow: null,
  blush: null
};

const App: React.FC = () => {
  const [makeup, setMakeup] = useState<MakeupColors>(initialMakeup);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const [showPermissionModal, setShowPermissionModal] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [showShutter, setShowShutter] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [buttonPressed, setButtonPressed] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fadeAnimationRef = useRef<number | null>(null);

  const handleRequestPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionGranted(true);
      setShowPermissionModal(false);
    } catch (error) {
      console.error('Camera permission denied:', error);
      alert('无法访问摄像头，请授予摄像头权限后重试。');
    }
  }, []);

  const handleMakeupChange = useCallback((newMakeup: MakeupColors) => {
    setMakeup(newMakeup);
  }, []);

  const handleReset = useCallback(() => {
    setButtonPressed('reset');
    setTimeout(() => setButtonPressed(null), 300);

    const startTime = performance.now();
    const duration = 500;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const opacity = 1 - progress;

      setFadeOpacity(opacity);

      if (progress < 1) {
        fadeAnimationRef.current = requestAnimationFrame(animate);
      } else {
        setMakeup(initialMakeup);
        setFadeOpacity(1);
      }
    };

    if (fadeAnimationRef.current) {
      cancelAnimationFrame(fadeAnimationRef.current);
    }
    fadeAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  const handleRandom = useCallback(() => {
    setButtonPressed('random');
    setTimeout(() => setButtonPressed(null), 300);

    setIsRandomizing(true);

    let count = 0;
    const totalFlashes = 8;

    const flashInterval = setInterval(() => {
      setMakeup({
        lipstick: lipstickColors[Math.floor(Math.random() * lipstickColors.length)],
        eyeshadow: eyeshadowColors[Math.floor(Math.random() * eyeshadowColors.length)],
        blush: blushColors[Math.floor(Math.random() * blushColors.length)]
      });

      count++;
      if (count >= totalFlashes) {
        clearInterval(flashInterval);
        setIsRandomizing(false);

        setMakeup({
          lipstick: lipstickColors[Math.floor(Math.random() * lipstickColors.length)],
          eyeshadow: eyeshadowColors[Math.floor(Math.random() * eyeshadowColors.length)],
          blush: blushColors[Math.floor(Math.random() * blushColors.length)]
        });
      }
    }, 100);
  }, []);

  const handleSaveScreenshot = useCallback(async () => {
    setButtonPressed('save');
    setTimeout(() => setButtonPressed(null), 300);

    setShowShutter(true);
    setTimeout(() => setShowShutter(false), 150);

    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');

      const response = await fetch('/api/screenshots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dataUrl })
      });

      if (response.ok) {
        const data = await response.json();
        setDownloadUrl(data.downloadUrl);
        setShowDownload(true);
      }
    } catch (error) {
      console.error('Failed to save screenshot:', error);
      const link = document.createElement('a');
      link.download = `makeup-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  }, []);

  const handleCloseDownload = useCallback(() => {
    setShowDownload(false);
    setDownloadUrl(null);
  }, []);

  const handleFaceDetected = useCallback((detected: boolean) => {
    setFaceDetected(detected);
  }, []);

  useEffect(() => {
    return () => {
      if (fadeAnimationRef.current) {
        cancelAnimationFrame(fadeAnimationRef.current);
      }
    };
  }, []);

  return (
    <div style={styles.app}>
      <style>
        {`
          @keyframes breathing {
            0%, 100% { opacity: 0.6; filter: blur(4px); }
            50% { opacity: 1; filter: blur(8px); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(100%); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes shutterFlash {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }

          @keyframes bounce {
            0% { transform: scale(1); }
            30% { transform: scale(0.92); }
            50% { transform: scale(1.02); }
            70% { transform: scale(0.98); }
            100% { transform: scale(1); }
          }

          .permission-modal {
            animation: fadeIn 0.6s ease-out;
          }

          .download-btn {
            animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          }

          .shutter-overlay {
            animation: shutterFlash 0.15s ease-out;
          }

          .action-btn:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(156, 39, 176, 0.25);
          }

          .action-btn:active {
            animation: bounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          .glow-border {
            animation: breathing 3s ease-in-out infinite;
          }
        `}
      </style>

      <h1 style={styles.title}>✨ 虚拟化妆镜 ✨</h1>

      <div style={styles.mainContent}>
        <div style={styles.mirrorContainer}>
          {permissionGranted ? (
            <MirrorCanvas
              makeup={makeup}
              fadeOpacity={fadeOpacity}
              onFaceDetected={handleFaceDetected}
              canvasRef={canvasRef}
            />
          ) : (
            <div style={styles.placeholder}>
              <div style={styles.placeholderIcon}>📷</div>
              <p style={styles.placeholderText}>点击下方按钮授权摄像头</p>
            </div>
          )}

          {showShutter && (
            <div className="shutter-overlay" style={styles.shutterOverlay} />
          )}

          {faceDetected && permissionGranted && (
            <div style={styles.faceDetectedBadge}>
              <span style={styles.faceDot} />
              已检测到面部
            </div>
          )}
        </div>

        <div style={styles.sidebar}>
          <ToolPanel makeup={makeup} onMakeupChange={handleMakeupChange} />
        </div>
      </div>

      <div style={styles.actionButtons}>
        <button
          className="action-btn"
          style={{
            ...styles.actionButton,
            ...styles.resetButton,
            transform: buttonPressed === 'reset' ? 'scale(0.92)' : undefined
          }}
          onClick={handleReset}
        >
          🔄 重置妆容
        </button>
        <button
          className="action-btn"
          style={{
            ...styles.actionButton,
            ...styles.randomButton,
            transform: buttonPressed === 'random' ? 'scale(0.92)' : undefined,
            ...(isRandomizing ? { background: 'linear-gradient(135deg, #f06292, #ab47bc)' } : {})
          }}
          onClick={handleRandom}
        >
          🎲 随机妆容
        </button>
        <button
          className="action-btn"
          style={{
            ...styles.actionButton,
            ...styles.saveButton,
            transform: buttonPressed === 'save' ? 'scale(0.92)' : undefined
          }}
          onClick={handleSaveScreenshot}
        >
          📸 保存截图
        </button>
      </div>

      {showPermissionModal && (
        <div className="permission-modal" style={styles.permissionModal}>
          <div style={styles.permissionCard}>
            <div style={styles.permissionIcon}>👑</div>
            <h2 style={styles.permissionTitle}>需要摄像头权限</h2>
            <p style={styles.permissionText}>
              为了让您体验虚拟化妆效果，我们需要访问您的摄像头。
              <br />
              所有数据仅在本地处理，不会上传到服务器。
            </p>
            <button style={styles.permissionButton} onClick={handleRequestPermission}>
              授权摄像头
            </button>
          </div>
        </div>
      )}

      {showDownload && downloadUrl && (
        <div style={styles.downloadOverlay}>
          <div className="download-btn" style={styles.downloadCard}>
            <div style={styles.downloadIcon}>🎉</div>
            <h3 style={styles.downloadTitle}>截图保存成功！</h3>
            <p style={styles.downloadText}>点击下方按钮下载您的妆容照片</p>
            <a
              href={downloadUrl}
              download={`makeup-${Date.now()}.png`}
              style={styles.downloadButton}
            >
              ⬇️ 下载图片
            </a>
            <button style={styles.closeButton} onClick={handleCloseDownload}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden'
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#8E24AA',
    marginBottom: '16px',
    textShadow: '0 2px 8px rgba(156, 39, 176, 0.2)'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '1100px'
  },
  mirrorContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    maxHeight: '65vh',
    minHeight: '400px',
    background: 'rgba(255, 255, 255, 0.3)',
    borderRadius: '24px',
    padding: '16px',
    backdropFilter: 'blur(10px)'
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '400px',
    background: 'rgba(255, 255, 255, 0.5)',
    borderRadius: '20px'
  },
  placeholderIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  placeholderText: {
    fontSize: '18px',
    color: '#9C27B0',
    fontWeight: 500
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    marginTop: '20px',
    marginBottom: '10px'
  },
  actionButton: {
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: '50px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: "'Quicksand', sans-serif",
    boxShadow: '0 4px 12px rgba(156, 39, 176, 0.15)'
  },
  resetButton: {
    background: 'linear-gradient(135deg, #f8bbd9 0%, #f48fb1 100%)',
    color: '#880E4F'
  },
  randomButton: {
    background: 'linear-gradient(135deg, #ce93d8 0%, #ab47bc 100%)',
    color: 'white'
  },
  saveButton: {
    background: 'linear-gradient(135deg, #ba68c8 0%, #8e24aa 100%)',
    color: 'white'
  },
  permissionModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  permissionCard: {
    background: 'white',
    borderRadius: '24px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
  },
  permissionIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  permissionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#8E24AA',
    marginBottom: '12px'
  },
  permissionText: {
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.6,
    marginBottom: '24px'
  },
  permissionButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 600,
    borderRadius: '50px',
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #ce93d8 0%, #8e24aa 100%)',
    color: 'white',
    fontFamily: "'Quicksand', sans-serif",
    boxShadow: '0 4px 16px rgba(142, 36, 170, 0.4)',
    transition: 'all 0.3s ease'
  },
  faceDetectedBadge: {
    position: 'absolute',
    top: '24px',
    left: '24px',
    background: 'rgba(76, 175, 80, 0.9)',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    zIndex: 10
  },
  faceDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4CAF50',
    boxShadow: '0 0 8px #4CAF50',
    animation: 'pulse 2s ease-in-out infinite'
  },
  shutterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'white',
    zIndex: 20,
    pointerEvents: 'none',
    borderRadius: '24px'
  },
  downloadOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  downloadCard: {
    background: 'white',
    borderRadius: '24px',
    padding: '36px',
    textAlign: 'center',
    maxWidth: '360px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
  },
  downloadIcon: {
    fontSize: '56px',
    marginBottom: '12px'
  },
  downloadTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#8E24AA',
    marginBottom: '8px'
  },
  downloadText: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  downloadButton: {
    display: 'inline-block',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: 600,
    borderRadius: '50px',
    textDecoration: 'none',
    background: 'linear-gradient(135deg, #ce93d8 0%, #8e24aa 100%)',
    color: 'white',
    marginBottom: '12px',
    boxShadow: '0 4px 16px rgba(142, 36, 170, 0.4)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  closeButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '50px',
    border: 'none',
    cursor: 'pointer',
    background: 'rgba(156, 39, 176, 0.1)',
    color: '#8E24AA',
    fontFamily: "'Quicksand', sans-serif",
    transition: 'all 0.2s ease'
  }
};

export default App;

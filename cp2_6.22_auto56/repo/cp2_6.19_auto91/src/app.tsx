import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomManager } from './modules/room-manager';
import { RoomUI } from './modules/room-manager/RoomUI';
import { AudioEngine } from './modules/audio-engine';
import type { RoomMember } from './modules/room-manager';
import type { TrackInfo } from './modules/audio-engine';

type View = 'home' | 'rehearsal';

const roomManager = new RoomManager();
const audioEngine = new AudioEngine({
  sampleRate: 44100,
  bufferSize: 512,
  fftSize: 2048,
});

function App() {
  const [view, setView] = useState<View>('home');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  
  const [userName, setUserName] = useState('音乐人' + Math.floor(Math.random() * 1000));
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const [trackLevels, setTrackLevels] = useState<Map<string, number>>(new Map());
  const [spectrumData, setSpectrumData] = useState<Uint8Array | null>(null);
  
  const [sampleRate, setSampleRate] = useState(44100);
  const [latency, setLatency] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'medium' | 'poor'>('good');
  
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: { r: number; g: number; b: number };
      alpha: number;
    }> = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      const count = Math.floor((canvas.width * canvas.height) / 15000);
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * 80) + 70;
        const g = Math.floor(Math.random() * 60) + 50;
        const b = Math.floor(Math.random() * 100) + 155;
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          color: { r, g, b },
          alpha: Math.random() * 0.4 + 0.1,
        });
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.7
      );
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f23');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = roomManager.subscribe((state) => {
      setRoomId(state.roomId);
      setMembers(state.members);
      setLocalUserId(state.localUserId);
      
      if (state.roomId && view === 'home') {
        setView('rehearsal');
      } else if (!state.roomId && view === 'rehearsal') {
        setView('home');
        setIsPlaying(false);
      }
    });

    return unsubscribe;
  }, [view]);

  useEffect(() => {
    if (view !== 'rehearsal') return;

    audioEngine.setOnSpectrumUpdate((data) => {
      setSpectrumData(new Uint8Array(data));
    });

    audioEngine.setOnTrackLevelsUpdate((tracks: TrackInfo[]) => {
      const levels = new Map<string, number>();
      tracks.forEach((t) => {
        levels.set(t.id, t.level);
      });
      setTrackLevels(levels);
    });
  }, [view]);

  useEffect(() => {
    if (view !== 'rehearsal') return;

    const interval = setInterval(() => {
      setSampleRate(audioEngine.getSampleRate());
      setLatency(audioEngine.getEstimatedLatency());
      setConnectionQuality(audioEngine.getConnectionQuality());
    }, 1000);

    return () => clearInterval(interval);
  }, [view]);

  const handleCreateRoom = async () => {
    setError('');
    try {
      await roomManager.createRoom(userName);
    } catch (e: any) {
      setError(e.message || '创建房间失败');
    }
  };

  const handleJoinRoom = async () => {
    setError('');
    if (!joinRoomId.trim()) {
      setError('请输入房间ID');
      return;
    }
    try {
      await roomManager.joinRoom(joinRoomId.trim(), userName);
    } catch (e: any) {
      setError(e.message || '加入房间失败');
    }
  };

  const handleLeaveRoom = () => {
    if (isPlaying) {
      audioEngine.stopLocalAudio();
      setIsPlaying(false);
    }
    roomManager.leaveRoom();
  };

  const handleCopyRoomId = useCallback(() => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomId]);

  const handleStartPlaying = async () => {
    if (!localUserId) return;
    
    try {
      const member = members.find((m) => m.userId === localUserId);
      const color = member?.avatarColor || '#6366f1';
      
      await audioEngine.startLocalAudio(localUserId, color);
      setIsPlaying(true);
      setMasterVolume(audioEngine.getMasterVolume());
    } catch (e: any) {
      setError('无法启动麦克风: ' + e.message);
    }
  };

  const handleStopPlaying = () => {
    audioEngine.stopLocalAudio();
    setIsPlaying(false);
    setSpectrumData(null);
  };

  const handleMasterVolumeChange = (volume: number) => {
    setMasterVolume(volume);
    audioEngine.setMasterVolume(volume);
  };

  const handleTrackVolumeChange = (userId: string, volume: number) => {
    if (userId === localUserId) {
      roomManager.updateVolume(volume);
      audioEngine.setTrackVolume(userId, volume);
    }
  };

  const handleTrackMuteToggle = (userId: string, muted: boolean) => {
    if (userId === localUserId) {
      roomManager.updateMuted(muted);
      audioEngine.setTrackMuted(userId, muted);
    }
  };

  const handleNameChange = (userId: string, name: string) => {
    if (userId === localUserId) {
      roomManager.updateName(name);
    }
  };

  useEffect(() => {
    if (view !== 'rehearsal' || !spectrumCanvasRef.current) return;

    const canvas = spectrumCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    let animFrame: number;

    function draw() {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const innerRadius = Math.min(width, height) * 0.2;
      const outerRadius = Math.min(width, height) * 0.4;

      ctx.clearRect(0, 0, width, height);

      if (!spectrumData || !isPlaying) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(74, 74, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(74, 74, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        const minFreq = 20;
        const maxFreq = 20000;
        const sampleRate = audioEngine.getSampleRate();
        const nyquist = sampleRate / 2;
        const fftSize = 2048;

        const minBin = Math.floor((minFreq / nyquist) * (fftSize / 2));
        const maxBin = Math.floor((maxFreq / nyquist) * (fftSize / 2));
        const binCount = maxBin - minBin;

        const outerMembers = members.filter((m) => m.userId !== localUserId && trackLevels.has(m.userId));
        const totalSegments = Math.max(outerMembers.length, 1);
        const segmentAngle = (Math.PI * 2) / totalSegments;

        outerMembers.forEach((member, index) => {
          const level = trackLevels.get(member.userId) || 0;
          const startAngle = -Math.PI / 2 + index * segmentAngle;
          const endAngle = startAngle + segmentAngle - 0.05;

          const innerR = outerRadius + 5;
          const outerR = innerR + 20 + level * 40;

          ctx.beginPath();
          ctx.arc(centerX, centerY, innerR, startAngle, endAngle);
          ctx.arc(centerX, centerY, outerR, endAngle, startAngle, true);
          ctx.closePath();

          const alpha = 0.5 + level * 0.5;
          ctx.fillStyle = member.muted ? 'rgba(100, 100, 100, 0.3)' : `${member.avatarColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.fill();
        });

        ctx.beginPath();
        for (let i = 0; i < binCount; i++) {
          const binIndex = minBin + i;
          const value = spectrumData[binIndex] || 0;
          const normalized = value / 255;
          
          const angle = -Math.PI / 2 + (i / binCount) * Math.PI * 2;
          const radius = innerRadius + normalized * (outerRadius - innerRadius);

          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();

        const gradient = ctx.createRadialGradient(
          centerX, centerY, innerRadius,
          centerX, centerY, outerRadius
        );
        gradient.addColorStop(0, 'rgba(74, 144, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(120, 80, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(180, 60, 255, 0.6)');
        
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 15, 35, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(74, 74, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const statusText = isPlaying ? '演奏中' : '等待开始';
      ctx.fillStyle = isPlaying ? '#4ade80' : '#888';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(statusText, centerX, centerY - 10);

      if (isPlaying) {
        ctx.fillStyle = '#666';
        ctx.font = '12px monospace';
        ctx.fillText(`${Math.round(sampleRate)} Hz`, centerX, centerY + 12);
      }

      animFrame = requestAnimationFrame(draw);
    }

    function resizeCanvas() {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    }

    resizeCanvas();
    draw();

    const observer = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(animFrame);
      observer.disconnect();
    };
  }, [view, isPlaying, spectrumData, members, localUserId, trackLevels, sampleRate]);

  const qualityColors = {
    good: '#22c55e',
    medium: '#eab308',
    poor: '#ef4444',
  };

  const qualityLabels = {
    good: '良好',
    medium: '中等',
    poor: '差',
  };

  if (view === 'home') {
    return (
      <div className="home-page">
        <div className="home-container">
          <div className="home-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h1>在线音乐合奏排练室</h1>
            <p>实时协作，共同演奏</p>
          </div>

          <div className="home-form">
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value.slice(0, 12))}
                placeholder="输入你的名字"
                maxLength={12}
              />
            </div>

            <button className="primary-btn" onClick={handleCreateRoom}>
              创建房间
            </button>

            <div className="divider">
              <span>或</span>
            </div>

            <div className="form-group">
              <label>房间ID</label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="输入6位房间ID"
                maxLength={6}
              />
            </div>

            <button className="secondary-btn" onClick={handleJoinRoom}>
              加入房间
            </button>

            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="home-tips">
            <p>提示：在同一浏览器的多个标签页中打开本页面，可以模拟多人合奏体验</p>
          </div>
        </div>

        <style>{`
          .home-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .home-container {
            width: 100%;
            max-width: 420px;
            background: rgba(26, 26, 46, 0.8);
            backdrop-filter: blur(12px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          }

          .home-logo {
            text-align: center;
            margin-bottom: 32px;
          }

          .logo-icon {
            width: 72px;
            height: 72px;
            margin: 0 auto 16px;
            background: linear-gradient(135deg, #4a4aff, #a855f7);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }

          .logo-icon svg {
            width: 36px;
            height: 36px;
          }

          .home-logo h1 {
            margin: 0 0 8px 0;
            color: #fff;
            font-size: 24px;
            font-weight: bold;
          }

          .home-logo p {
            margin: 0;
            color: #888;
            font-size: 14px;
          }

          .home-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .form-group label {
            color: #aaa;
            font-size: 13px;
            font-weight: 500;
          }

          .form-group input {
            padding: 12px 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.3);
            color: #e0e0e0;
            font-size: 15px;
            outline: none;
            transition: border-color 200ms ease-out;
          }

          .form-group input:focus {
            border-color: #4a4aff;
          }

          .form-group input::placeholder {
            color: #666;
          }

          .primary-btn, .secondary-btn {
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 200ms ease-out;
          }

          .primary-btn {
            background: linear-gradient(135deg, #4a4aff, #a855f7);
            color: white;
          }

          .primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(74, 74, 255, 0.4);
          }

          .secondary-btn {
            background: rgba(255, 255, 255, 0.08);
            color: #e0e0e0;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }

          .secondary-btn:hover {
            background: rgba(74, 74, 255, 0.2);
            border-color: rgba(74, 74, 255, 0.4);
          }

          .divider {
            position: relative;
            text-align: center;
            margin: 8px 0;
          }

          .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: rgba(255, 255, 255, 0.1);
          }

          .divider span {
            position: relative;
            background: rgba(26, 26, 46, 0.8);
            padding: 0 16px;
            color: #666;
            font-size: 13px;
          }

          .error-msg {
            color: #ef4444;
            font-size: 13px;
            text-align: center;
            padding: 8px;
            background: rgba(239, 68, 68, 0.1);
            border-radius: 8px;
          }

          .home-tips {
            margin-top: 24px;
            text-align: center;
          }

          .home-tips p {
            color: #666;
            font-size: 12px;
            margin: 0;
            line-height: 1.6;
          }

          @media (max-width: 480px) {
            .home-container {
              padding: 24px;
            }

            .home-logo h1 {
              font-size: 20px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="rehearsal-page">
      {isMobile && (
        <div className="mobile-header">
          <button className="menu-btn" onClick={() => setShowMobilePanel(!showMobilePanel)}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
            </svg>
          </button>
          <div className="mobile-title">排练室</div>
          <div className="mobile-room-id" onClick={handleCopyRoomId}>
            {roomId}
          </div>
        </div>
      )}

      <div className={`main-layout ${isMobile ? 'mobile' : ''}`}>
        <aside className={`members-panel ${isMobile && showMobilePanel ? 'open' : ''}`}>
          <RoomUI
            roomId={roomId}
            members={members}
            localUserId={localUserId}
            onVolumeChange={handleTrackVolumeChange}
            onMuteToggle={handleTrackMuteToggle}
            onNameChange={handleNameChange}
            onCopyRoomId={handleCopyRoomId}
            copied={copied}
            onLeave={handleLeaveRoom}
          />
        </aside>

        {isMobile && showMobilePanel && (
          <div className="mobile-overlay" onClick={() => setShowMobilePanel(false)} />
        )}

        <main className="console-panel">
          <div className="visualizer-container">
            <canvas ref={spectrumCanvasRef} className="spectrum-canvas" />
          </div>

          <div className="console-controls">
            <div className="volume-control">
              <span className="control-label">总音量</span>
              <div className="volume-slider-large">
                <svg viewBox="0 0 24 24" fill="currentColor" className="volume-icon-lg">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                  className="slider-large"
                />
                <span className="volume-value">{Math.round(masterVolume)}</span>
              </div>
            </div>

            <button
              className={`play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={isPlaying ? handleStopPlaying : handleStartPlaying}
            >
              <span className="play-icon">
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </span>
              <span className="play-text">{isPlaying ? '演奏中' : '开始演奏'}</span>
            </button>
          </div>
        </main>
      </div>

      <footer className="status-bar">
        <div className="status-item">
          <span className="status-label">房间ID:</span>
          <span className="status-value clickable" onClick={handleCopyRoomId}>
            {roomId || '---'}
            {copied && <span className="copy-tooltip">已复制!</span>}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">在线:</span>
          <span className="status-value">{members.length} 人</span>
        </div>

        <div className="status-item">
          <span className="status-label">采样率:</span>
          <span className="status-value">{Math.round(sampleRate)} Hz</span>
        </div>

        <div className="status-item">
          <span className="status-label">延迟:</span>
          <span className="status-value">{latency.toFixed(0)} ms</span>
        </div>

        <div className="status-item">
          <span className="status-label">连接:</span>
          <span className="status-value">
            <span
              className="quality-dot"
              style={{ backgroundColor: qualityColors[connectionQuality] }}
            />
            {qualityLabels[connectionQuality]}
          </span>
        </div>
      </footer>

      <style>{`
        .rehearsal-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }

        .main-layout {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .members-panel {
          width: 300px;
          flex-shrink: 0;
          background: rgba(15, 15, 35, 0.6);
          backdrop-filter: blur(8px);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          overflow-y: auto;
        }

        .console-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 24px;
          gap: 24px;
        }

        .visualizer-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 0;
        }

        .spectrum-canvas {
          width: 100%;
          height: 100%;
          max-height: 500px;
        }

        .console-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 20px;
          background: rgba(26, 26, 46, 0.6);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .volume-control {
          width: 100%;
          max-width: 400px;
        }

        .control-label {
          display: block;
          color: #888;
          font-size: 13px;
          margin-bottom: 8px;
          text-align: center;
        }

        .volume-slider-large {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .volume-icon-lg {
          width: 24px;
          height: 24px;
          color: #888;
        }

        .slider-large {
          flex: 1;
          -webkit-appearance: none;
          appearance: none;
          height: 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.15);
          outline: none;
          cursor: pointer;
        }

        .slider-large::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4a4aff, #a855f7);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(74, 74, 255, 0.5);
        }

        .slider-large::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4a4aff, #a855f7);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(74, 74, 255, 0.5);
        }

        .volume-value {
          min-width: 40px;
          text-align: right;
          color: #e0e0e0;
          font-family: monospace;
          font-size: 14px;
        }

        .play-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 32px;
          border: none;
          border-radius: 50px;
          background: linear-gradient(135deg, #4a4aff, #a855f7);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms ease-out;
        }

        .play-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(74, 74, 255, 0.4);
        }

        .play-btn.playing {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          animation: pulse-green 1s ease-in-out infinite;
        }

        @keyframes pulse-green {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 20px 5px rgba(34, 197, 94, 0.3);
          }
        }

        .play-icon svg {
          width: 20px;
          height: 20px;
        }

        .status-bar {
          height: 60px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 24px;
          background: rgba(15, 15, 35, 0.9);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-family: monospace;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-label {
          color: #666;
          font-size: 12px;
        }

        .status-value {
          color: #e0e0e0;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-value.clickable {
          cursor: pointer;
          position: relative;
        }

        .status-value.clickable:hover {
          color: #4a4aff;
        }

        .copy-tooltip {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          background: #22c55e;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          white-space: nowrap;
        }

        .quality-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: rgba(15, 15, 35, 0.9);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .menu-btn {
          background: none;
          border: none;
          color: #e0e0e0;
          cursor: pointer;
          padding: 4px;
        }

        .menu-btn svg {
          width: 24px;
          height: 24px;
        }

        .mobile-title {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
        }

        .mobile-room-id {
          color: #4a4aff;
          font-family: monospace;
          font-size: 14px;
          cursor: pointer;
        }

        .mobile-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 99;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }

          .main-layout.mobile {
            position: relative;
          }

          .members-panel {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 80%;
            max-width: 320px;
            z-index: 100;
            transform: translateX(-100%);
            transition: transform 200ms ease-out;
          }

          .members-panel.open {
            transform: translateX(0);
          }

          .mobile-overlay {
            display: block;
          }

          .console-panel {
            padding: 12px;
            gap: 16px;
          }

          .status-bar {
            height: auto;
            padding: 12px;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: flex-start;
          }

          .status-item {
            flex: 1 1 40%;
          }
        }
      `}</style>
    </div>
  );
}

export default App;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AudioAnalyzer } from '../audio/audioAnalyzer';
import { ThreeRenderer } from '../renderer/threeRenderer';
import { TrackSelector } from './TrackSelector';
import { useAppStore, VisualMode } from '../store/useAppStore';

interface DemoTrackConfig {
  name: string;
  frequencyPattern: number[];
  bpm: number;
}

const DEMO_CONFIGS: DemoTrackConfig[] = [
  {
    name: '演示曲目 1 - 电子脉动',
    frequencyPattern: [0.9, 0.3, 0.9, 0.3, 0.8, 0.4, 0.9, 0.2],
    bpm: 128,
  },
  {
    name: '演示曲目 2 - 梦幻氛围',
    frequencyPattern: [0.5, 0.6, 0.5, 0.7, 0.4, 0.6, 0.5, 0.8],
    bpm: 72,
  },
  {
    name: '演示曲目 3 - 交响史诗',
    frequencyPattern: [0.7, 0.8, 0.9, 0.6, 0.8, 0.9, 0.7, 0.5],
    bpm: 96,
  },
  {
    name: '演示曲目 4 - 爵士律动',
    frequencyPattern: [0.6, 0.4, 0.7, 0.5, 0.6, 0.3, 0.8, 0.4],
    bpm: 110,
  },
  {
    name: '演示曲目 5 - 摇滚能量',
    frequencyPattern: [0.95, 0.4, 0.9, 0.3, 0.95, 0.5, 0.85, 0.4],
    bpm: 140,
  },
];

const App: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const miniContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioAnalyzerRef = useRef<AudioAnalyzer | null>(null);
  const rendererRef = useRef<ThreeRenderer | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const {
    visualMode,
    setVisualMode,
    sidebarCollapsed,
    toggleSidebar,
    audioState,
    setIsPlaying,
    setCurrentTrack,
    setDuration,
    setCurrentTime,
    setFrequencyData,
  } = useAppStore();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const demoAnimationRef = useRef<number | null>(null);
  const demoTimeRef = useRef(0);
  const demoConfigRef = useRef<DemoTrackConfig>(DEMO_CONFIGS[0]);
  const demoIsPlayingRef = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!canvasContainerRef.current || !miniContainerRef.current) return;

    console.log('[App] Initializing modules...');
    console.log('[App] Canvas container:', canvasContainerRef.current.clientWidth, 'x', canvasContainerRef.current.clientHeight);
    console.log('[App] Mini container:', miniContainerRef.current.clientWidth, 'x', miniContainerRef.current.clientHeight);

    try {
      audioAnalyzerRef.current = new AudioAnalyzer({ fftSize: 512, smoothingTimeConstant: 0.8 });
      console.log('[App] AudioAnalyzer initialized');

      audioAnalyzerRef.current.onFrequencyData((data) => {
        const copy = new Uint8Array(data);
        setFrequencyData(copy);
        if (rendererRef.current) {
          rendererRef.current.updateFrequencyData(copy);
        }
      });

      audioAnalyzerRef.current.onTimeUpdate((time, duration) => {
        setCurrentTime(time);
        setDuration(duration);
      });

      audioAnalyzerRef.current.onEnded(() => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    } catch (e) {
      console.error('[App] AudioAnalyzer error:', e);
    }

    try {
      rendererRef.current = new ThreeRenderer({
        container: canvasContainerRef.current,
        minicontainer: miniContainerRef.current,
        particleCount: 2000,
      });
      console.log('[App] ThreeRenderer initialized');
      rendererRef.current.start();
      console.log('[App] ThreeRenderer started');
    } catch (e) {
      console.error('[App] ThreeRenderer creation error:', e);
      if (e instanceof Error) {
        console.error('[App] Error stack:', e.stack);
      }
    }

    return () => {
      audioAnalyzerRef.current?.dispose();
      rendererRef.current?.dispose();
    };
  }, [setFrequencyData, setCurrentTime, setDuration, setIsPlaying]);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setVisualMode(visualMode);
    }
  }, [visualMode]);

  const stopDemoMode = useCallback(() => {
    if (demoAnimationRef.current) {
      cancelAnimationFrame(demoAnimationRef.current);
      demoAnimationRef.current = null;
    }
    demoIsPlayingRef.current = false;
    setDemoMode(false);
  }, []);

  const startDemoAnimation = useCallback(() => {
    if (demoAnimationRef.current) {
      cancelAnimationFrame(demoAnimationRef.current);
    }

    const animate = () => {
      if (!demoIsPlayingRef.current) return;

      const config = demoConfigRef.current;
      const beatDuration = 60 / config.bpm;
      demoTimeRef.current += 0.016;
      const beatProgress = (demoTimeRef.current % beatDuration) / beatDuration;
      const beatEnvelope = Math.exp(-beatProgress * 4);
      const patternIndex = Math.floor((demoTimeRef.current / beatDuration) % config.frequencyPattern.length);
      const patternValue = config.frequencyPattern[patternIndex];

      const data = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        const freqNormalized = i / 256;
        let baseValue = 0;

        if (freqNormalized < 0.1) {
          baseValue = patternValue * beatEnvelope * 0.95;
        } else if (freqNormalized < 0.5) {
          const wave = Math.sin(demoTimeRef.current * 8 + i * 0.1) * 0.3 + 0.7;
          baseValue = patternValue * wave * 0.7;
        } else {
          const shimmer = Math.sin(demoTimeRef.current * 15 + i * 0.3) * 0.5 + 0.5;
          baseValue = patternValue * shimmer * 0.5 * (0.5 + beatEnvelope * 0.5);
        }

        const noise = (Math.random() - 0.5) * 0.08;
        const finalValue = Math.max(0, Math.min(1, baseValue + noise));
        data[i] = Math.floor(finalValue * 255);
      }

      setFrequencyData(data);
      if (rendererRef.current) {
        rendererRef.current.updateFrequencyData(data);
      }

      const totalDuration = 180;
      const currentTime = (demoTimeRef.current % totalDuration);
      setCurrentTime(currentTime);
      setDuration(totalDuration);

      demoAnimationRef.current = requestAnimationFrame(animate);
    };

    demoIsPlayingRef.current = true;
    animate();
  }, [setFrequencyData, setCurrentTime, setDuration]);

  const handleSelectDemo = useCallback((index: number) => {
    stopDemoMode();
    audioAnalyzerRef.current?.pause();
    setIsPlaying(false);

    const config = DEMO_CONFIGS[index];
    demoConfigRef.current = config;
    demoTimeRef.current = 0;
    setDemoMode(true);
    setCurrentTrack(`demo-${index}`, config.name);
    setIsPlaying(true);
    startDemoAnimation();
  }, [setCurrentTrack, setIsPlaying, stopDemoMode, startDemoAnimation]);

  const handleFileUpload = useCallback(async (file: File) => {
    stopDemoMode();
    audioAnalyzerRef.current?.pause();
    setIsPlaying(false);

    try {
      await audioAnalyzerRef.current?.loadFromFile(file);
      setCurrentTrack(URL.createObjectURL(file), file.name);
      await audioAnalyzerRef.current?.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to load audio:', error);
    }
  }, [setCurrentTrack, setIsPlaying, stopDemoMode]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleTogglePlay = useCallback(async () => {
    if (demoMode) {
      if (demoIsPlayingRef.current) {
        demoIsPlayingRef.current = false;
        if (demoAnimationRef.current) {
          cancelAnimationFrame(demoAnimationRef.current);
          demoAnimationRef.current = null;
        }
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        startDemoAnimation();
      }
      return;
    }

    if (!audioAnalyzerRef.current) return;
    if (audioAnalyzerRef.current.isPlaying()) {
      audioAnalyzerRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioAnalyzerRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play:', error);
      }
    }
  }, [demoMode, setIsPlaying, startDemoAnimation]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = ratio * audioState.duration;

    if (demoMode) {
      demoTimeRef.current = newTime;
      setCurrentTime(newTime);
    } else {
      audioAnalyzerRef.current?.seek(newTime);
      setCurrentTime(newTime);
    }
  }, [audioState.duration, demoMode, setCurrentTime]);

  const handleProgressMouseDown = useCallback(() => {
    setIsDraggingProgress(true);
  }, []);

  useEffect(() => {
    if (!isDraggingProgress) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = ratio * audioState.duration;

      if (demoMode) {
        demoTimeRef.current = newTime;
        setCurrentTime(newTime);
      } else {
        audioAnalyzerRef.current?.seek(newTime);
        setCurrentTime(newTime);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingProgress, audioState.duration, demoMode, setCurrentTime]);

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0;

  const mobileModeButtons: { mode: VisualMode; label: string; icon: string }[] = [
    { mode: 'waveform', label: '波形', icon: '〰' },
    { mode: 'nebula', label: '星云', icon: '✦' },
    { mode: 'explosion', label: '爆炸', icon: '✺' },
  ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0F0F23',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: isMobile ? 'auto' : 56,
          background: 'rgba(26, 26, 46, 0.93)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '10px 16px' : '0 20px',
          position: isMobile ? 'fixed' : 'relative',
          bottom: isMobile ? 0 : 'auto',
          top: isMobile ? 'auto' : 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderTop: isMobile ? '1px solid rgba(78, 205, 196, 0.2)' : 'none',
          borderBottom: isMobile ? 'none' : '1px solid rgba(78, 205, 196, 0.15)',
          gap: 12,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
        }}
      >
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 20 }}>🎵</div>
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#E0E0F0',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 200,
            }}>
              声波织女
            </div>
            {audioState.currentTrackName && (
              <div style={{
                fontSize: 12,
                color: '#A0A0B8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 180,
                marginLeft: 12,
                paddingLeft: 12,
                borderLeft: '1px solid #2A2A44',
              }}>
                {audioState.currentTrackName}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12 }}>
          {isMobile && (
            <div style={{ display: 'flex', gap: 6 }}>
              {mobileModeButtons.map(({ mode, label, icon }) => {
                const isActive = visualMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setVisualMode(mode)}
                    title={label}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      border: isActive ? '2px solid #4ECDC4' : '2px solid transparent',
                      background: '#2A2A44',
                      color: isActive ? '#4ECDC4' : '#A0A0B8',
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    {icon}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleUploadClick}
            style={{
              background: '#6BCB77',
              color: '#0A0A1A',
              border: 'none',
              padding: isMobile ? '8px 14px' : '10px 18px',
              borderRadius: 8,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#8DDF8D';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#6BCB77';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            <span>📂</span>
            {isMobile ? '上传' : '上传音乐'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }}
          />

          <button
            onClick={handleTogglePlay}
            disabled={!audioState.currentTrack}
            style={{
              width: isMobile ? 36 : 42,
              height: isMobile ? 36 : 42,
              borderRadius: '50%',
              border: 'none',
              background: audioState.currentTrack
                ? 'linear-gradient(135deg, #4ECDC4, #FF6B6B)'
                : '#2A2A44',
              color: '#FFFFFF',
              fontSize: isMobile ? 14 : 18,
              cursor: audioState.currentTrack ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: audioState.currentTrack ? 1 : 0.5,
              padding: 0,
            }}
            onMouseEnter={(e) => {
              if (audioState.currentTrack) {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            {audioState.isPlaying ? (
              <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width={isMobile ? 14 : 16} height={isMobile ? 14 : 16} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {!isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: 'none',
                background: '#2A2A44',
                color: '#A0A0B8',
                fontSize: 16,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#3A3A5E';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#2A2A44';
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              }}
            >
              {sidebarCollapsed ? '◀' : '▶'}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          marginTop: isMobile ? 0 : 0,
          marginBottom: isMobile ? (window.innerWidth < 768 ? 80 : 0) : 0,
        }}
      >
        <div
          ref={canvasContainerRef}
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
          }}
        />

        {!isMobile && (
          <div
            style={{
              flexShrink: 0,
              borderLeft: sidebarCollapsed ? 'none' : '1px solid rgba(78, 205, 196, 0.1)',
              background: 'rgba(15, 15, 35, 0.6)',
            }}
          >
            <TrackSelector
              onFileUpload={handleFileUpload}
              onSelectDemo={handleSelectDemo}
            />
          </div>
        )}

        {isMobile && audioState.currentTrack && (
          <div
            style={{
              position: 'fixed',
              top: 12,
              left: 12,
              right: 12,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(26, 26, 46, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(78, 205, 196, 0.2)',
              fontSize: 12,
              color: '#C0C0D8',
              zIndex: 90,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {audioState.currentTrackName}
          </div>
        )}

        {!isMobile && (
          <div
            ref={miniContainerRef}
            style={{
              position: 'absolute',
              right: sidebarCollapsed ? 16 : 216,
              bottom: 16,
              width: 160,
              height: 120,
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.67)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              border: '1px solid rgba(78, 205, 196, 0.25)',
              overflow: 'hidden',
              pointerEvents: 'none',
              transition: 'right 0.3s ease',
            }}
          />
        )}
      </div>

      {!isMobile && audioState.currentTrack && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(600px, 50%)',
            padding: '10px 16px',
            background: 'rgba(26, 26, 46, 0.9)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: 12,
            border: '1px solid rgba(78, 205, 196, 0.2)',
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#A0A0B8', minWidth: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(audioState.currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              style={{
                flex: 1,
                height: 6,
                background: '#2A2A44',
                borderRadius: 3,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #4ECDC4, #FF6B6B)',
                  borderRadius: 3,
                  transition: isDraggingProgress ? 'none' : 'width 0.05s linear',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `calc(${progressPercent}% - 6px)`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 0 8px rgba(78, 205, 196, 0.6)',
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: '#A0A0B8', minWidth: 40, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(audioState.duration)}
            </span>
          </div>
        </div>
      )}

      {isMobile && audioState.currentTrack && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            left: 12,
            right: 12,
            padding: '8px 12px',
            background: 'rgba(26, 26, 46, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 10,
            border: '1px solid rgba(78, 205, 196, 0.2)',
            zIndex: 90,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: '#A0A0B8', minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(audioState.currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              onMouseDown={handleProgressMouseDown}
              onTouchStart={handleProgressMouseDown}
              style={{
                flex: 1,
                height: 6,
                background: '#2A2A44',
                borderRadius: 3,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, #4ECDC4, #FF6B6B)',
                  borderRadius: 3,
                  transition: isDraggingProgress ? 'none' : 'width 0.05s linear',
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: '#A0A0B8', minWidth: 32, fontVariantNumeric: 'tabular-nums' }}>
              {formatTime(audioState.duration)}
            </span>
          </div>
        </div>
      )}

      {!audioState.currentTrack && (
        <div
          style={{
            position: 'absolute',
            top: isMobile ? '50%' : 'calc(50% + 28px)',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#A0A0B8',
            pointerEvents: 'none',
            zIndex: 50,
            width: isMobile ? '80%' : 'auto',
          }}
        >
          <div style={{ fontSize: isMobile ? 48 : 64, marginBottom: 16, opacity: 0.6 }}>🎼</div>
          <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 600, color: '#E0E0F0', marginBottom: 8 }}>
            声波织女
          </div>
          <div style={{ fontSize: isMobile ? 13 : 15, opacity: 0.7, lineHeight: 1.6 }}>
            上传本地音乐文件或选择预设曲目<br />
            开启你的视觉音乐之旅
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

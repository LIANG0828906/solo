import React, { useEffect, useRef, useCallback } from 'react';
import { Track } from '../store/useStore';
import Waveform from './Waveform';

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onProgressChange: (progress: number) => void;
  onPlayNext: () => void;
}

const Player: React.FC<PlayerProps> = React.memo(({
  currentTrack,
  isPlaying,
  progress,
  onTogglePlay,
  onProgressChange,
  onPlayNext,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const drawCover = useCallback((ctx: CanvasRenderingContext2D, size: number, track: Track) => {
    const { coverColors, coverPattern } = track;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, coverColors[0]);
    gradient.addColorStop(0.5, coverColors[1]);
    gradient.addColorStop(1, coverColors[2]);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.clip();

    ctx.globalAlpha = 0.3;
    const time = Date.now() / 1000;

    switch (coverPattern) {
      case 'circles':
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + time * 0.5;
          const r = radius * 0.3;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          const circleRadius = radius * 0.15;

          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
          ctx.beginPath();
          ctx.arc(x, y, circleRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'triangles':
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + time * 0.3;
          const r = radius * 0.4;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          const triSize = radius * 0.2;

          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
          ctx.beginPath();
          ctx.moveTo(x, y - triSize);
          ctx.lineTo(x - triSize * 0.866, y + triSize * 0.5);
          ctx.lineTo(x + triSize * 0.866, y + triSize * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        break;

      case 'squares':
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + time * 0.4;
          const r = radius * 0.35;
          const x = centerX + Math.cos(angle) * r;
          const y = centerY + Math.sin(angle) * r;
          const sqSize = radius * 0.25;

          ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + Math.PI / 4);
          ctx.fillRect(-sqSize / 2, -sqSize / 2, sqSize, sqSize);
          ctx.restore();
        }
        break;

      case 'waves':
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          const baseY = centerY - radius * 0.3 + i * radius * 0.3;
          for (let x = centerX - radius; x < centerX + radius; x += 2) {
            const waveY = baseY + Math.sin((x + time * 50) * 0.05) * 10;
            if (x === centerX - radius) {
              ctx.moveTo(x, waveY);
            } else {
              ctx.lineTo(x, waveY);
            }
          }
          ctx.stroke();
        }
        break;
    }

    ctx.restore();

    const centerRadius = radius * 0.2;
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    const displayTitle = track.title.length > 8 ? track.title.slice(0, 8) + '...' : track.title;
    const displayArtist = track.artist.length > 8 ? track.artist.slice(0, 8) + '...' : track.artist;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(displayTitle, centerX, centerY - 3);
    ctx.font = '6px monospace';
    ctx.fillText(displayArtist, centerX, centerY + 6);
  }, []);

  const startAudioSimulation = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }

    oscillatorRef.current = ctx.createOscillator();
    gainNodeRef.current = ctx.createGain();

    oscillatorRef.current.type = 'sine';
    oscillatorRef.current.frequency.setValueAtTime(220, ctx.currentTime);

    gainNodeRef.current.gain.setValueAtTime(0, ctx.currentTime);
    gainNodeRef.current.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.1);

    oscillatorRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(ctx.destination);

    oscillatorRef.current.start();

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2 + Math.random() * 3, ctx.currentTime);
    lfoGain.gain.setValueAtTime(50, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillatorRef.current.frequency);
    lfo.start();

    const updateProgress = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (isPlaying && currentTrack) {
        const duration = currentTrack.duration * 1000;
        const newProgress = progress + (delta / duration);

        if (newProgress >= 1) {
          onProgressChange(0);
          onPlayNext();
        } else {
          onProgressChange(newProgress);
        }
      }

      animationRef.current = requestAnimationFrame(updateProgress);
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(updateProgress);
  }, [isPlaying, currentTrack, progress, onProgressChange, onPlayNext]);

  const stopAudioSimulation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0, audioContextRef.current.currentTime + 0.1);
      setTimeout(() => {
        if (oscillatorRef.current) {
          try {
            oscillatorRef.current.stop();
            oscillatorRef.current.disconnect();
          } catch (e) {}
          oscillatorRef.current = null;
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.disconnect();
          gainNodeRef.current = null;
        }
      }, 150);
    }
  }, []);

  useEffect(() => {
    if (isPlaying && currentTrack) {
      startAudioSimulation();
    } else {
      stopAudioSimulation();
    }

    return () => {
      stopAudioSimulation();
    };
  }, [isPlaying, currentTrack, startAudioSimulation, stopAudioSimulation]);

  useEffect(() => {
    const canvas = document.getElementById('cover-canvas') as HTMLCanvasElement;
    if (!canvas || !currentTrack) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, canvas.width, currentTrack);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [currentTrack, drawCover]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div
      className="player-container"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '32px',
      }}
    >
      <div
        className="top-shelf"
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '80px',
          background: 'linear-gradient(180deg, #8B5A2B 0%, #6B4423 50%, #5D3A1A 100%)',
          borderRadius: '4px 4px 8px 8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          position: 'relative',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 20px',
          marginBottom: '16px',
        }}
      >
        {[0, 1, 2].map((shelfIndex) => (
          <div
            key={shelfIndex}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '24px',
                  height: '60px',
                  background: `hsl(${shelfIndex * 40 + i * 20}, 75%, ${35 + i * 10}%)`,
                  borderRadius: '2px',
                  boxShadow: '1px 0 3px rgba(0,0,0,0.3)',
                  transform: 'perspective(100px) rotateY(-5deg)',
                }}
              />
            ))}
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '10px',
            right: '10px',
            height: '4px',
            background: '#4A2F17',
            borderRadius: '0 0 4px 4px',
          }}
        />
      </div>

      <div
        className="turntable"
        style={{
          position: 'relative',
          width: '280px',
          height: '280px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="turntable-base"
          style={{
            position: 'absolute',
            width: '280px',
            height: '280px',
            background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
        />

        <div
          className="turntable-platter-outer"
          style={{
            position: 'absolute',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #c0c0c0 0%, #808080 50%, #404040 100%)',
            boxShadow: '0 0 20px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              right: '8px',
              bottom: '8px',
              borderRadius: '50%',
              background: 'repeating-radial-gradient(circle at center, #2a2a2a 0px, #2a2a2a 1px, #1a1a1a 1px, #1a1a1a 3px)',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
            }}
          />
        </div>

        <div
          className="record-cover"
          onClick={onTogglePlay}
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            cursor: 'pointer',
            transform: isPlaying ? 'rotate(0deg)' : 'rotate(0deg)',
            animation: isPlaying ? 'spin 2s linear infinite' : 'none',
            boxShadow: isPlaying
              ? '0 0 30px rgba(255,255,255,0.3), 0 0 60px rgba(255,255,255,0.1)'
              : '0 0 10px rgba(0,0,0,0.5)',
            filter: isPlaying ? 'brightness(1)' : 'brightness(0.7)',
            transition: 'filter 0.3s ease, box-shadow 0.3s ease',
            willChange: 'transform, opacity',
          }}
        >
          <canvas
            id="cover-canvas"
            width="200"
            height="200"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              display: 'block',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              borderRadius: '50%',
              boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4), inset 0 0 60px rgba(255,255,255,0.05)',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div
          className="tone-arm"
          style={{
            position: 'absolute',
            top: '20px',
            right: '30px',
            width: '120px',
            height: '4px',
            background: 'linear-gradient(90deg, #c0c0c0 0%, #808080 50%, #404040 100%)',
            borderRadius: '2px',
            transformOrigin: 'right center',
            transform: isPlaying ? 'rotate(-35deg)' : 'rotate(10deg)',
            transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-4px',
              top: '-6px',
              width: '16px',
              height: '16px',
              background: 'linear-gradient(145deg, #e0e0e0, #a0a0a0)',
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '-8px',
              top: '-4px',
              width: '20px',
              height: '12px',
              background: '#E63946',
              borderRadius: '2px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>

      <div
        className="track-info"
        style={{
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: 'monospace',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
          {currentTrack?.title || '未选择曲目'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.8 }}>
          {currentTrack?.artist || ''}
        </div>
      </div>

      <div
        className="waveform-container"
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: '8px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Waveform progress={progress} isPlaying={isPlaying} />
      </div>

      <div
        className="progress-bar"
        style={{
          width: '100%',
          maxWidth: '400px',
          height: '4px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newProgress = x / rect.width;
          onProgressChange(newProgress);
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #E63946, #FF8C42)',
            width: `${progress * 100}%`,
            transition: 'width 0.1s linear',
            willChange: 'transform',
          }}
        />
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

Player.displayName = 'Player';

export default Player;

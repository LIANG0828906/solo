import React, { useCallback } from 'react';
import { useAppStore } from '../modules/state/store';
import { AudioEngine } from '../modules/audio/AudioEngine';
import { WaveformGenerator } from '../modules/waveform/WaveformGenerator';

const audioEngine = new AudioEngine();

export const TransportBar: React.FC = () => {
  const isPlaying = useAppStore((s) => s.isPlaying);
  const currentTime = useAppStore((s) => s.currentTime);
  const duration = useAppStore((s) => s.duration);
  const tracks = useAppStore((s) => s.tracks);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const setCurrentTime = useAppStore((s) => s.setCurrentTime);
  const setDuration = useAppStore((s) => s.setDuration);
  const setBufferUsage = useAppStore((s) => s.setBufferUsage);

  const handlePlay = useCallback(() => {
    const mixed = WaveformGenerator.mixTracks(tracks);
    const dur = mixed.length / WaveformGenerator.SAMPLE_RATE;
    setDuration(dur);
    setPlaying(true);

    audioEngine.play(mixed, WaveformGenerator.SAMPLE_RATE, (t) => {
      setCurrentTime(t);
      setBufferUsage(audioEngine.getBufferUsage());
      if (t >= dur) {
        setPlaying(false);
        setCurrentTime(0);
      }
    });
  }, [tracks, setPlaying, setCurrentTime, setDuration, setBufferUsage]);

  const handlePause = useCallback(() => {
    audioEngine.stop();
    setPlaying(false);
  }, [setPlaying]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    setPlaying(false);
    setCurrentTime(0);
  }, [setPlaying, setCurrentTime]);

  const handleExport = useCallback(() => {
    const mixed = WaveformGenerator.mixTracks(tracks);
    const blob = audioEngine.exportWav(mixed, WaveformGenerator.SAMPLE_RATE);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waveform-studio-export.wav';
    a.click();
    URL.revokeObjectURL(url);
  }, [tracks]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const btnBase: React.CSSProperties = {
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s, background 0.2s',
    color: '#e0e0e0',
    fontSize: 14,
  };

  const handleClick = (e: React.MouseEvent, handler: () => void) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = 'scale(0.95)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 100);
    handler();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: 48,
      background: 'rgba(18,18,32,0.85)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      zIndex: 1000,
      borderBottom: '1px solid #2d2d44',
    }}>
      <button
        style={{
          ...btnBase,
          width: 36,
          height: 36,
          background: isPlaying ? '#e74c3c' : '#6c5ce7',
        }}
        onClick={(e) => handleClick(e, isPlaying ? handlePause : handlePlay)}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <button
        style={{
          ...btnBase,
          width: 36,
          height: 36,
          background: '#2d2d44',
        }}
        onClick={(e) => handleClick(e, handleStop)}
        title="Stop"
      >
        ⏹
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{
          width: '100%',
          height: 6,
          background: '#2d2d44',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(to right, #6c5ce7, #a29bfe)',
            borderRadius: 3,
            transition: 'width 0.05s linear',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#888' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <button
        style={{
          ...btnBase,
          height: 32,
          padding: '0 14px',
          background: '#6c5ce7',
          fontSize: 12,
          fontWeight: 600,
        }}
        onClick={(e) => handleClick(e, handleExport)}
        title="Export WAV"
      >
        ⬇ WAV
      </button>
    </div>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
}

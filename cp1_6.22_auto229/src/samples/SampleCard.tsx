import React from 'react';
import { Play, Pause } from 'lucide-react';
import type { Sample } from '../types';
import { IconButton } from '../components/IconButton';

interface SampleCardProps {
  sample: Sample;
  onDragStart: (sample: Sample) => void;
  onPreview: (sample: Sample) => void;
  isPreviewing: boolean;
}

export const SampleCard: React.FC<SampleCardProps> = ({
  sample,
  onDragStart,
  onPreview,
  isPreviewing,
}) => {
  const cardStyle: React.CSSProperties = {
    width: '140px',
    borderRadius: '6px',
    background: `linear-gradient(135deg, #2D3748 0%, #1A202C 100%)`,
    padding: '10px',
    cursor: 'grab',
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    position: 'relative',
    overflow: 'hidden',
    userSelect: 'none',
  };

  const colorBarStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: sample.color,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text)',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const durationStyle: React.CSSProperties = {
    fontSize: '10px',
    fontFamily: 'var(--font-family-mono)',
    color: 'var(--color-text-muted)',
  };

  const categoryStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: '9px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: `${sample.color}20`,
    color: sample.color,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  };

  const waveformStyle: React.CSSProperties = {
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '1px',
    marginTop: '8px',
    opacity: 0.6,
  };

  const categoryLabels: Record<string, string> = {
    drum: '鼓',
    vocal: '人声',
    effect: '音效',
    other: '其他',
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs.toFixed(1)}s`;
  };

  const generateWaveform = () => {
    return Array.from({ length: 12 }, (_, i) => {
      const phase = (i / 12) * Math.PI * 3;
      const height = 4 + Math.abs(Math.sin(phase + sample.color.length)) * 14;
      return (
        <div
          key={i}
          style={{
            width: '2px',
            height: `${height}px`,
            backgroundColor: sample.color,
            borderRadius: '1px',
            opacity: isPreviewing ? 0.9 : 0.5,
            transition: 'opacity 0.15s ease',
            animation: isPreviewing ? `pulse 0.5s ease-in-out ${i * 0.05}s infinite` : 'none',
          }}
        />
      );
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('sampleId', sample.id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(sample);
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview(sample);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={cardStyle}
      className="sample-card"
    >
      <div style={colorBarStyle} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={categoryStyle}>{categoryLabels[sample.category] || sample.category}</span>
        <IconButton size="sm" onClick={handlePreviewClick} title="预览">
          {isPreviewing ? <Pause size={12} /> : <Play size={12} />}
        </IconButton>
      </div>

      <div style={nameStyle}>{sample.name}</div>
      <div style={durationStyle}>{formatDuration(sample.duration)}</div>

      <div style={waveformStyle}>{generateWaveform()}</div>
    </div>
  );
};

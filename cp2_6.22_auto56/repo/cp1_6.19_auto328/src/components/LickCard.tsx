import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Lick } from '@/types';
import { instrumentColors, instrumentEmojis, instrumentLabels } from '@/utils/colors';
import WaveformCanvas from './WaveformCanvas';
import { useAppStore } from '@/store';

interface LickCardProps {
  lick: Lick;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

const LickCard = memo(function LickCard({ lick }: LickCardProps) {
  const selectedId = useAppStore((s) => s.ui.selectedLickId);
  const selectLick = useAppStore((s) => s.selectLick);
  const isSelected = selectedId === lick.id;
  const bgColor = instrumentColors[lick.instrument];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={() => selectLick(lick.id)}
      style={{
        position: 'relative',
        padding: '12px',
        borderRadius: 10,
        backgroundColor: isSelected ? bgColor : '#1E1E1E',
        border: `2px solid ${isSelected ? bgColor : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? `0 0 0 1px ${bgColor}55, 0 8px 24px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#2A2A2A';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          (e.currentTarget as HTMLElement).style.backgroundColor = '#1E1E1E';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            backgroundColor: bgColor + (isSelected ? '44' : '22'),
            fontSize: 16,
          }}
        >
          {instrumentEmojis[lick.instrument]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isSelected ? '#121212' : '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            {lick.name}
          </div>
          <div style={{ fontSize: 11, color: isSelected ? '#333333' : '#757575' }}>
            {instrumentLabels[lick.instrument]} · {formatTime(lick.timestamp)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <WaveformCanvas
          data={lick.waveformData}
          height={28}
          barWidth={1.5}
          gap={0.5}
          color={isSelected ? '#12121266' : bgColor + '99'}
          progressColor={isSelected ? '#121212' : bgColor}
          progress={0}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: isSelected ? '#00000022' : '#2A2A2A',
              color: isSelected ? '#121212' : '#B0B0B0',
            }}
          >
            {lick.key}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: isSelected ? '#00000022' : '#2A2A2A',
              color: isSelected ? '#121212' : '#B0B0B0',
            }}
          >
            {lick.bpm} BPM
          </span>
        </div>
        <span style={{ fontSize: 10, color: isSelected ? '#333333' : '#757575' }}>
          {formatDuration(lick.duration)}
        </span>
      </div>
    </motion.div>
  );
});

export default LickCard;

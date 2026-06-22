import { memo } from 'react';
import { motion } from 'framer-motion';
import type { Preset } from '@/types';
import { instrumentColors, instrumentEmojis, instrumentLabels } from '@/utils/colors';
import { useAppStore } from '@/store';

interface PresetCardProps {
  preset: Preset;
}

const PresetCard = memo(function PresetCard({ preset }: PresetCardProps) {
  const applyPreset = useAppStore((s) => s.applyPreset);
  const appliedId = useAppStore((s) => s.ui.appliedPresetId);
  const removePreset = useAppStore((s) => s.removePreset);
  const isApplied = appliedId === preset.id;
  const color = instrumentColors[preset.instrument];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ scale: 1.05, zIndex: 5 }}
      onClick={() => applyPreset(isApplied ? null : preset.id)}
      style={{
        position: 'relative',
        padding: 12,
        borderRadius: 10,
        backgroundColor: isApplied ? color + '22' : '#1E1E1E',
        border: `2px solid ${isApplied ? color : 'transparent'}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        willChange: 'transform',
        boxShadow: isApplied ? `0 0 0 1px ${color}55` : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: color + '33',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          {instrumentEmojis[preset.instrument]}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#FFFFFF',
            textAlign: 'center',
            fontFamily: "'Orbitron', sans-serif",
            letterSpacing: 0.5,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {preset.name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#757575',
          }}
        >
          {instrumentLabels[preset.instrument]}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 10,
          backgroundColor: '#121212F0',
          backdropFilter: 'blur(8px)',
          borderTop: `1px solid ${color}44`,
        }}
      >
        <div style={{ fontSize: 11, color: '#B0B0B0', lineHeight: 1.4, marginBottom: 6 }}>
          {preset.description || '暂无描述'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: color, fontWeight: 600 }}>
            {isApplied ? '✓ 已应用' : '点击应用'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removePreset(preset.id);
            }}
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 4,
              backgroundColor: 'transparent',
              color: '#EF5350',
              border: '1px solid #EF535044',
            }}
          >
            删除
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default PresetCard;

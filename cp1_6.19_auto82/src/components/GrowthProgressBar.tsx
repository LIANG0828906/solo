import React from 'react';
import { motion } from 'framer-motion';
import type { GrowthStage } from '@types/index';
import { GROWTH_STAGE_NAMES, GROWTH_STAGE_GRADIENTS } from '@types/index';

interface GrowthProgressBarProps {
  stage: GrowthStage;
  onChange?: (stage: GrowthStage) => void;
  readonly?: boolean;
}

const GrowthProgressBar: React.FC<GrowthProgressBarProps> = ({ stage, onChange, readonly = false }) => {
  const progressPercent = ((stage + 1) / 5) * 100;

  const handleStageClick = (index: GrowthStage) => {
    if (!readonly && onChange) {
      onChange(index);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
        }}
      >
        {GROWTH_STAGE_NAMES.map((name, idx) => (
          <span
            key={name}
            style={{
              color: idx <= stage ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: idx <= stage ? 700 : 500,
              fontSize: '11px',
              flex: 1,
              textAlign: 'center',
              cursor: readonly ? 'default' : 'pointer',
              transition: 'color 0.2s ease',
            }}
            onClick={() => handleStageClick(idx as GrowthStage)}
          >
            {name}
          </span>
        ))}
      </div>
      <div
        style={{
          height: '16px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-progress-bg)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            height: '100%',
            background: GROWTH_STAGE_GRADIENTS[Math.min(stage, 4)],
            borderRadius: '8px',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '1px',
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.6)',
                marginLeft: `${20 - 0.2}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GrowthProgressBar;

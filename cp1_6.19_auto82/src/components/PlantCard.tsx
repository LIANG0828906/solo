import React, { memo } from 'react';
import { motion } from 'framer-motion';
import type { Plant } from '@types/index';
import { getSpeciesById } from '@data/plants';
import GrowthProgressBar from './GrowthProgressBar';
import { FiTrash2, FiSun, FiClock } from 'react-icons/fi';

interface PlantCardProps {
  plant: Plant;
  onClick: () => void;
  onDelete: () => void;
  isNew?: boolean;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant, onClick, onDelete, isNew }) => {
  const species = getSpeciesById(plant.speciesId);
  if (!species) return null;

  const displayName = plant.customName || species.name;

  return (
    <motion.div
      layout
      initial={isNew ? { scale: 0, opacity: 0 } : { opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      style={{
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius-card)',
        border: '2px solid var(--color-card-border)',
        boxShadow: 'var(--shadow-card)',
        padding: 14,
        cursor: 'pointer',
        position: 'relative',
        transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)';
        (e.currentTarget as HTMLDivElement).style.borderColor = species.color + '50';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-card-border)';
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`确定要移除「${displayName}」吗？相关日志也会被清除。`)) {
            onDelete();
          }
        }}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 26,
          height: 26,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#B8A990',
          opacity: 0,
          transition: 'opacity 0.2s ease, background-color 0.2s ease, color 0.2s ease',
          zIndex: 2,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(229, 57, 53, 0.1)';
          (e.currentTarget as HTMLButtonElement).style.color = '#E53935';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '0';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#B8A990';
        }}
        className="card-delete-btn"
        aria-label="删除植物"
      >
        <FiTrash2 size={14} />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            backgroundColor: species.color + '18',
            border: `2px solid ${species.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            flexShrink: 0,
          }}
        >
          {species.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--color-text)',
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              className="chip"
              style={{
                backgroundColor: species.color + '18',
                color: species.color,
              }}
            >
              {species.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <FiClock size={11} />
              {formatDate(plant.plantDate)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div
          title={`${species.lightNeed}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 11,
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            color: '#F57C00',
          }}
        >
          <FiSun size={11} />
          {species.lightNeed}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 11,
            backgroundColor: 'rgba(91, 140, 90, 0.1)',
            color: 'var(--color-primary)',
          }}
        >
          周期 {species.growthDays}天
        </div>
      </div>

      <GrowthProgressBar stage={plant.stage} readonly />
    </motion.div>
  );
};

export default memo(PlantCard);

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { MatchResult, Item, ColorKey } from '@/types';
import { CATEGORY_COLORS, COLOR_PALETTE } from '@/types';
import { useStore } from '@/store';
import CategoryIcon from './CategoryIcon';

interface MatchCardProps {
  match: MatchResult;
  onClick: () => void;
}

export default function MatchCard({ match, onClick }: MatchCardProps) {
  const currentUserId = useStore((state) => state.currentUserId);

  const counterItem: Item =
    match.lostItem.anonymousId === currentUserId ? match.foundItem : match.lostItem;

  const borderColor = CATEGORY_COLORS[counterItem.category];
  const percentage = Math.min(Math.max(match.score, 0), 100);

  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      style={{
        width: '320px',
        height: '200px',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderLeft: `3px solid ${borderColor}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        position: 'relative',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            backgroundColor: '#F5F5F5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {counterItem.imageUrl ? (
            <img
              src={counterItem.imageUrl}
              alt={counterItem.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <CategoryIcon category={counterItem.category} size={36} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#333333',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {counterItem.name}
          </div>
          <div style={{ fontSize: '13px', color: '#888888' }}>{counterItem.category}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {counterItem.colors.map((color: ColorKey) => (
              <div
                key={color}
                title={color}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: COLOR_PALETTE[color],
                  border: color === '白色' ? '1px solid #E0E0E0' : 'none',
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#888888',
            }}
          >
            <MapPin size={12} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {counterItem.location}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666666' }}>
          <span>匹配度</span>
          <span style={{ fontWeight: 600, color: '#4FC3F7' }}>{percentage.toFixed(0)}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            backgroundColor: '#F5F5F5',
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: '3px',
              backgroundColor: '#4FC3F7',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

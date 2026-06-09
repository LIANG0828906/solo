import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { FlagData } from '../types';
import { ColorBadge } from './ColorBadge';
import { getColorName } from '../utils/colors';

interface FlagItemProps {
  flag: FlagData;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export function FlagItem({ flag, isSelected, onSelect, onRemove }: FlagItemProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(flag.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(flag.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: isSelected
          ? 'rgba(201, 169, 110, 0.2)'
          : 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        cursor: 'pointer',
        border: `1px solid ${
          isSelected ? '#c9a96e' : 'rgba(255, 255, 255, 0.1)'
        }`,
        transition: 'all 0.2s ease',
        marginBottom: 8,
      }}
      whileHover={{
        backgroundColor: isSelected
          ? 'rgba(201, 169, 110, 0.3)'
          : 'rgba(255, 255, 255, 0.1)',
        scale: 1.02,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          backgroundColor: 'rgba(30, 30, 60, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 14,
          color: '#c9a96e',
          border: '1px solid #c9a96e',
        }}
      >
        {flag.index}
      </div>

      <ColorBadge color={flag.color} size={24} selected={isSelected} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#ecf0f1',
            fontSize: 14,
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getColorName(flag.color)}军旗
        </div>
        <div
          style={{
            color: 'rgba(236, 240, 241, 0.5)',
            fontSize: 11,
            marginTop: 2,
          }}
        >
          [{flag.position[0].toFixed(1)}, {flag.position[2].toFixed(1)}]
        </div>
      </div>

      <motion.button
        onClick={handleRemove}
        whileHover={{ scale: 1.1, color: '#e74c3c' }}
        whileTap={{ scale: 0.9 }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(236, 240, 241, 0.5)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s',
        }}
      >
        <Trash2 size={18} />
      </motion.button>
    </motion.div>
  );
}

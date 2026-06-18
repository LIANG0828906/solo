import React from 'react';
import { motion } from 'framer-motion';
import {
  FaGem,
  FaGavel,
  FaShieldAlt,
  FaBolt,
  FaHeart,
  FaArrowDown,
  FaClone,
  FaFire,
  FaMagic,
} from 'react-icons/fa';
import { Card, getSkillById } from '../domain/cardData';

interface CardViewProps {
  card: Card;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
  highlight?: 'blue' | 'red' | 'none';
  size?: 'sm' | 'md';
}

const SKILL_ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  FaBolt,
  FaHeart,
  FaArrowDown,
  FaClone,
  FaFire,
};

const CardView: React.FC<CardViewProps> = ({
  card,
  onClick,
  onContextMenu,
  onDragStart,
  onDragEnd,
  draggable = false,
  highlight = 'none',
  size = 'md',
}) => {
  const skill = getSkillById(card.skillId);
  const SkillIcon = skill ? SKILL_ICON_MAP[skill.iconKey] ?? FaMagic : null;

  const borderColor =
    highlight === 'blue' ? '#3498DB' : highlight === 'red' ? '#E74C3C' : 'transparent';

  const width = size === 'sm' ? 100 : 120;
  const height = size === 'sm' ? 142 : 170;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ display: 'inline-block' }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={onClick}
        onContextMenu={onContextMenu}
        style={{
          width,
          height,
          borderRadius: 12,
          backgroundColor: '#F5F5F5',
          color: '#333333',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          cursor: draggable ? 'grab' : onClick ? 'pointer' : 'default',
          userSelect: 'none',
          border: `2px solid ${borderColor}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
        }}
        whileHover={{
          scale: draggable || onClick ? 1.03 : 1,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <FaGem size={14} color="#3498DB" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{card.cost}</span>
          <div style={{ flex: 1 }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 70,
            }}
          >
            {card.name}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '4px 0',
          }}
        >
          {SkillIcon ? (
            <div
              style={{
                padding: 6,
                borderRadius: 4,
                backgroundColor: 'rgba(52, 152, 219, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SkillIcon size={size === 'sm' ? 18 : 22} color="#3498DB" />
            </div>
          ) : (
            <div
              style={{
                width: size === 'sm' ? 28 : 34,
                height: size === 'sm' ? 28 : 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #B0B0B0, #888)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF',
                fontSize: size === 'sm' ? 12 : 14,
                fontWeight: 700,
              }}
            >
              {card.name.charAt(0)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: size === 'sm' ? 11 : 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaGavel size={size === 'sm' ? 11 : 13} color="#C0392B" />
            <span style={{ fontWeight: 600 }}>{card.attack}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaShieldAlt size={size === 'sm' ? 11 : 13} color="#2980B9" />
            <span style={{ fontWeight: 600 }}>{card.defense}</span>
          </div>
        </div>

        {skill && size === 'md' && (
          <div
            style={{
              fontSize: 10,
              color: '#555',
              textAlign: 'center',
              lineHeight: 1.2,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={skill.description(card.skillValue)}
          >
            {skill.description(card.skillValue)}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CardView;

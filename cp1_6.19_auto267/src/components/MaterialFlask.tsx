import React from 'react';
import { motion } from 'framer-motion';
import { Material } from '../types';
import { MATERIAL_INFO } from '../data/recipes';

interface MaterialFlaskProps {
  material: Material;
  count?: number;
  size?: number;
  draggable?: boolean;
  onClick?: () => void;
}

export const MaterialFlask: React.FC<MaterialFlaskProps> = ({
  material,
  count,
  size = 60,
  draggable = false,
  onClick,
}) => {
  const info = MATERIAL_INFO[material];

  return (
    <motion.div
      className="relative flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing"
      drag={draggable ? true : false}
      dragSnapToOrigin
      dragElastic={0.2}
      dragMomentum={false}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      style={{ willChange: 'transform' }}
    >
      <div
        className="rounded-full relative overflow-hidden border-2 border-white/30 shadow-lg"
        style={{
          width: size,
          height: size,
          background: info.gradient,
          boxShadow: `0 0 15px ${info.color}40, inset 0 -10px 20px rgba(0,0,0,0.2)`,
        }}
      >
        <div
          className="absolute top-2 left-3 w-4 h-4 rounded-full opacity-60"
          style={{
            background: 'radial-gradient(circle at 30% 30%, white, transparent)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1/3 opacity-30"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
          }}
        />
      </div>
      <span className="text-xs text-white/80 font-medium">{info.name}</span>
      {count !== undefined && (
        <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
          {count}
        </span>
      )}
    </motion.div>
  );
};

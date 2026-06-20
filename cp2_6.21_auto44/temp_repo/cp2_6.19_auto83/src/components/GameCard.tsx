import { motion } from 'framer-motion';
import type { Card } from '../utils/cardData';
import { ELEMENT_COLORS, RARITY_COLORS } from '../utils/cardData';

interface GameCardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
  size?: 'small' | 'normal';
  onQuickAdd?: () => void;
  showQuickAdd?: boolean;
}

const rarityLabels: Record<string, string> = {
  common: '普通',
  uncommon: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

function ElementIcon({ element, size = 48 }: { element: string; size?: number }) {
  const color = ELEMENT_COLORS[element] || '#e2e8f0';

  if (element === 'fire') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <path
          d="M32 8C28 18 20 24 20 36c0 8 5 16 12 16s12-8 12-16c0-12-8-18-12-28z"
          fill={color}
          opacity="0.9"
        />
        <path
          d="M32 22c-2 6-6 9-6 15 0 4 2 9 6 9s6-5 6-9c0-6-4-9-6-15z"
          fill="#fff"
          opacity="0.7"
        />
      </svg>
    );
  }
  if (element === 'water') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <path
          d="M32 8C26 18 14 30 14 40c0 10 8 16 18 16s18-6 18-16c0-10-12-22-18-32z"
          fill={color}
          opacity="0.9"
        />
        <ellipse cx="26" cy="34" rx="5" ry="8" fill="#fff" opacity="0.5" />
      </svg>
    );
  }
  if (element === 'wind') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <path
          d="M8 24h28c4 0 6-3 6-6s-2-6-6-6"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 36h36c5 0 8-3 8-7s-3-7-8-7"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M8 48h20c3 0 5-2 5-5s-2-5-5-5"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />
      </svg>
    );
  }
  if (element === 'earth') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <polygon points="32,10 54,28 44,52 20,52 10,28" fill={color} opacity="0.9" />
        <polygon points="32,10 32,52 44,52 54,28" fill="#000" opacity="0.2" />
        <circle cx="26" cy="30" r="3" fill="#fff" opacity="0.6" />
        <circle cx="38" cy="40" r="2" fill="#fff" opacity="0.5" />
      </svg>
    );
  }
  if (element === 'light') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="12" fill={color} />
        <g stroke={color} strokeWidth="3" strokeLinecap="round">
          <line x1="32" y1="6" x2="32" y2="14" />
          <line x1="32" y1="50" x2="32" y2="58" />
          <line x1="6" y1="32" x2="14" y2="32" />
          <line x1="50" y1="32" x2="58" y2="32" />
          <line x1="13" y1="13" x2="19" y2="19" />
          <line x1="45" y1="45" x2="51" y2="51" />
          <line x1="51" y1="13" x2="45" y2="19" />
          <line x1="19" y1="45" x2="13" y2="51" />
        </g>
      </svg>
    );
  }
  if (element === 'dark') {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <path
          d="M44 12c-10 0-18 8-18 18s8 18 18 18c2 0 4 0 6-1-8-2-14-9-14-17s6-15 14-17c-2-1-4-1-6-1z"
          fill={color}
        />
        <circle cx="22" cy="20" r="2" fill="#fff" opacity="0.6" />
        <circle cx="18" cy="36" r="1.5" fill="#fff" opacity="0.5" />
        <circle cx="26" cy="46" r="1" fill="#fff" opacity="0.4" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="18" fill={color} opacity="0.8" />
      <text x="32" y="40" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">?</text>
    </svg>
  );
}

export function GameCard({ card, isFlipped, onFlip, size = 'normal', onQuickAdd, showQuickAdd = false }: GameCardProps) {
  const rarityColor = RARITY_COLORS[card.rarity];
  const elementColor = card.element === 'composite' 
    ? `linear-gradient(135deg, ${ELEMENT_COLORS.fire}, ${ELEMENT_COLORS.water}, ${ELEMENT_COLORS.earth}, ${ELEMENT_COLORS.wind})`
    : ELEMENT_COLORS[card.element] || '#666';

  const cardWidth = size === 'small' ? 120 : 160;
  const cardHeight = size === 'small' ? 165 : 220;
  const iconSize = size === 'small' ? 36 : 48;
  const nameSize = size === 'small' ? 'text-sm' : 'text-base';
  const rarityText = size === 'small' ? 'text-xs' : 'text-sm';

  const gradientMap: Record<string, string> = {
    fire: 'linear-gradient(135deg, #1a0a0a 0%, #3d1a1a 50%, #5c1a0a 100%)',
    water: 'linear-gradient(135deg, #0a0f1a 0%, #1a2d4a 50%, #0a3a5c 100%)',
    wind: 'linear-gradient(135deg, #0a1a1a 0%, #1a3d3d 50%, #0a5c5c 100%)',
    earth: 'linear-gradient(135deg, #1a150a 0%, #3d301a 50%, #5c401a 100%)',
    light: 'linear-gradient(135deg, #1a1a0a 0%, #3d3d1a 50%, #5c5c1a 100%)',
    dark: 'linear-gradient(135deg, #0f0a1a 0%, #2a1a4a 50%, #3d0a5c 100%)',
    composite: 'linear-gradient(135deg, #1a0a1a 0%, #4a1a3d 30%, #1a3d4a 60%, #3d4a1a 100%)',
  };

  const cardBg = gradientMap[card.element] || gradientMap.composite;

  return (
    <div
      className="perspective-1000 cursor-pointer"
      style={{ width: cardWidth, height: cardHeight }}
      onClick={onFlip}
    >
      <motion.div
        className="w-full h-full preserve-3d relative"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
        whileHover={!isFlipped ? { y: -8, rotate: 2 } : {}}
        whileTap={{ scale: 0.98 }}
      >
        <div
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden flex flex-col items-center justify-center"
          style={{
            border: `3px solid ${rarityColor}`,
            background: cardBg,
            boxShadow: `0 0 20px ${rarityColor}40, inset 0 0 30px rgba(0,0,0,0.5)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${elementColor}50 0%, transparent 60%)`,
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-3 p-4">
            <ElementIcon element={card.element} size={iconSize} />
            <div className={`font-display font-bold text-white ${nameSize}`}>
              {card.name}
            </div>
            <div
              className={`${rarityText} font-medium px-2 py-0.5 rounded-full`}
              style={{ backgroundColor: `${rarityColor}30`, color: rarityColor }}
            >
              {rarityLabels[card.rarity]}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex justify-between text-xs text-white/70">
            <span>⚔ {card.attack}</span>
            <span>🛡 {card.defense}</span>
          </div>
          {showQuickAdd && onQuickAdd && (
            <button
              onClick={(e) => { e.stopPropagation(); onQuickAdd(); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white text-lg font-bold flex items-center justify-center transition-all hover:scale-110"
              style={{ backdropFilter: 'blur(4px)' }}
            >
              +
            </button>
          )}
        </div>

        <div
          className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden p-4 flex flex-col"
          style={{
            border: `3px solid ${rarityColor}`,
            background: 'linear-gradient(180deg, #1a1a3e 0%, #0a0a2a 100%)',
            transform: 'rotateY(180deg)',
            boxShadow: `0 0 20px ${rarityColor}40`,
          }}
        >
          <div
            className="text-center font-display font-bold text-lg mb-2"
            style={{ color: rarityColor }}
          >
            {card.name}
          </div>
          <div className="flex justify-around mb-3 text-sm">
            <div className="text-center">
              <div className="text-red-400 font-bold text-lg">{card.attack}</div>
              <div className="text-white/50 text-xs">攻击</div>
            </div>
            <div className="text-center">
              <div className="text-blue-400 font-bold text-lg">{card.defense}</div>
              <div className="text-white/50 text-xs">防御</div>
            </div>
          </div>
          <div
            className="text-xs font-medium mb-2 px-2 py-1 rounded text-center"
            style={{ backgroundColor: `${rarityColor}20`, color: rarityColor }}
          >
            {rarityLabels[card.rarity]}
          </div>
          <p className="text-xs text-white/80 mb-2 leading-relaxed">
            {card.description}
          </p>
          <div className="flex-1 overflow-y-auto">
            <p className="text-xs text-white/50 italic leading-relaxed">
              "{card.lore}"
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export { ElementIcon };

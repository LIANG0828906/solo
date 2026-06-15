import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const InkstoneIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <ellipse cx="50" cy="55" rx="40" ry="25" fill="#4a4a4a" stroke="#2a2a2a" strokeWidth="2" />
    <ellipse cx="50" cy="50" rx="35" ry="20" fill="#3a3a3a" />
    <ellipse cx="35" cy="48" rx="15" ry="10" fill="#2a2a2a" />
    <path d="M20 45 Q25 35, 40 38" stroke="#5a3a2a" strokeWidth="1.5" fill="none" opacity="0.7" />
    <path d="M60 55 Q65 45, 80 50" stroke="#5a3a2a" strokeWidth="1.5" fill="none" opacity="0.7" />
  </svg>
);

export const JadeRingIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="35" fill="none" stroke="#50a860" strokeWidth="18" />
    <circle cx="50" cy="50" r="35" fill="none" stroke="#70c880" strokeWidth="12" opacity="0.6" />
    <circle cx="50" cy="50" r="28" fill="none" stroke="#308840" strokeWidth="2" opacity="0.5" />
    <path d="M30 35 Q35 45, 30 55" stroke="#a06040" strokeWidth="1" fill="none" opacity="0.5" />
    <path d="M70 45 Q75 55, 70 65" stroke="#a06040" strokeWidth="1" fill="none" opacity="0.5" />
    <circle cx="40" cy="35" r="2" fill="#ffffff" opacity="0.8" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <rect x="20" y="15" width="60" height="70" rx="5" fill="#d4af37" stroke="#8b6914" strokeWidth="2" />
    <rect x="25" y="20" width="50" height="40" rx="3" fill="#1a1a2e" />
    <circle cx="50" cy="40" r="18" fill="#f5e6c8" stroke="#8b6914" strokeWidth="1" />
    <line x1="50" y1="40" x2="50" y2="28" stroke="#2a1f18" strokeWidth="2" />
    <line x1="50" y1="40" x2="58" y2="45" stroke="#2a1f18" strokeWidth="1.5" />
    <circle cx="50" cy="40" r="2" fill="#c04040" />
    <line x1="50" y1="24" x2="50" y2="27" stroke="#8b6914" strokeWidth="1" />
    <line x1="50" y1="53" x2="50" y2="56" stroke="#8b6914" strokeWidth="1" />
    <line x1="34" y1="40" x2="37" y2="40" stroke="#8b6914" strokeWidth="1" />
    <line x1="63" y1="40" x2="66" y2="40" stroke="#8b6914" strokeWidth="1" />
    <rect x="35" y="65" width="30" height="15" fill="#8b5e3c" stroke="#6b4226" strokeWidth="1" />
    <circle cx="50" cy="72" r="3" fill="#d4af37" />
  </svg>
);

export const PorcelainIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <path d="M35 20 L65 20 L68 30 Q80 50, 70 75 Q50 85, 30 75 Q20 50, 32 30 Z" 
          fill="#e8e8e8" stroke="#a0a0a0" strokeWidth="1" />
    <ellipse cx="50" cy="20" rx="15" ry="3" fill="#d0d0d0" stroke="#a0a0a0" strokeWidth="1" />
    <path d="M35 35 Q50 45, 65 35" stroke="#1a4d8c" strokeWidth="2" fill="none" />
    <path d="M32 45 Q50 55, 68 45" stroke="#1a4d8c" strokeWidth="2" fill="none" />
    <circle cx="40" cy="55" r="4" stroke="#1a4d8c" strokeWidth="1.5" fill="none" />
    <circle cx="60" cy="55" r="4" stroke="#1a4d8c" strokeWidth="1.5" fill="none" />
    <path d="M35 65 Q50 70, 65 65" stroke="#1a4d8c" strokeWidth="1.5" fill="none" />
    <ellipse cx="50" cy="78" rx="18" ry="4" fill="#d8d8d8" stroke="#a0a0a0" strokeWidth="1" />
    <path d="M35 22 L32 28" stroke="#c04040" strokeWidth="1" opacity="0.6" />
  </svg>
);

export const WoodBoxIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <rect x="15" y="30" width="70" height="50" rx="3" fill="#6b4226" stroke="#4a2a10" strokeWidth="2" />
    <rect x="15" y="25" width="70" height="8" rx="2" fill="#8b5e3c" stroke="#4a2a10" strokeWidth="2" />
    <path d="M20 35 L20 75" stroke="#4a2a10" strokeWidth="0.5" opacity="0.5" />
    <path d="M35 35 L35 75" stroke="#4a2a10" strokeWidth="0.5" opacity="0.5" />
    <path d="M50 35 L50 75" stroke="#4a2a10" strokeWidth="0.5" opacity="0.5" />
    <path d="M65 35 L65 75" stroke="#4a2a10" strokeWidth="0.5" opacity="0.5" />
    <path d="M80 35 L80 75" stroke="#4a2a10" strokeWidth="0.5" opacity="0.5" />
    <rect x="42" y="50" width="16" height="10" rx="2" fill="#d4af37" stroke="#8b6914" strokeWidth="1" />
    <circle cx="50" cy="55" r="2" fill="#4a2a10" />
    <path d="M25 30 Q35 22, 45 28" stroke="#4a2a10" strokeWidth="1" fill="none" opacity="0.7" />
    <path d="M55 28 Q65 22, 75 30" stroke="#4a2a10" strokeWidth="1" fill="none" opacity="0.7" />
  </svg>
);

export const SilverLockIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <path d="M25 45 Q25 25, 50 25 Q75 25, 75 45" fill="none" stroke="#c0c0c0" strokeWidth="6" />
    <rect x="15" y="45" width="70" height="40" rx="5" fill="#d0d0d0" stroke="#808080" strokeWidth="2" />
    <text x="50" y="68" textAnchor="middle" fontSize="14" fill="#808080" className="font-brush">长命百岁</text>
    <rect x="45" y="75" width="10" height="3" fill="#a0a0a0" />
    <path d="M30 50 Q35 60, 30 70" stroke="#e0e0e0" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M70 50 Q65 60, 70 70" stroke="#808080" strokeWidth="1" fill="none" opacity="0.4" />
    <circle cx="35" cy="55" r="3" fill="#ffffff" opacity="0.8" />
  </svg>
);

export const BookIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <rect x="15" y="15" width="70" height="70" rx="2" fill="#f5e6c8" stroke="#8b5e3c" strokeWidth="2" />
    <line x1="50" y1="15" x2="50" y2="85" stroke="#8b5e3c" strokeWidth="1" />
    <line x1="20" y1="25" x2="45" y2="25" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="20" y1="32" x2="45" y2="32" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="20" y1="39" x2="40" y2="39" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="20" y1="46" x2="45" y2="46" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="20" y1="53" x2="42" y2="53" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="55" y1="25" x2="80" y2="25" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="55" y1="32" x2="78" y2="32" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="55" y1="39" x2="80" y2="39" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="55" y1="46" x2="75" y2="46" stroke="#2a1f18" strokeWidth="0.5" />
    <line x1="55" y1="53" x2="80" y2="53" stroke="#2a1f18" strokeWidth="0.5" />
    <circle cx="30" cy="65" r="4" fill="#2a1f18" opacity="0.3" />
    <circle cx="35" cy="70" r="3" fill="#2a1f18" opacity="0.2" />
    <path d="M75 75 L80 80" stroke="#c04040" strokeWidth="1" opacity="0.5" />
  </svg>
);

export const HairpinIcon: React.FC<IconProps> = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <path d="M15 50 Q30 30, 50 30 Q70 30, 85 50" fill="none" stroke="#d4af37" strokeWidth="3" />
    <path d="M18 52 Q32 35, 50 35 Q68 35, 82 52" fill="none" stroke="#f0d78c" strokeWidth="2" />
    <ellipse cx="50" cy="50" rx="12" ry="18" fill="#a0d8b0" stroke="#50a860" strokeWidth="2" />
    <ellipse cx="50" cy="50" rx="8" ry="14" fill="#c0e8c0" opacity="0.5" />
    <path d="M45 40 Q50 45, 55 40" stroke="#50a860" strokeWidth="1" fill="none" opacity="0.6" />
    <path d="M45 60 Q50 55, 55 60" stroke="#50a860" strokeWidth="1" fill="none" opacity="0.6" />
    <circle cx="35" cy="38" r="2" fill="#d4af37" />
    <circle cx="65" cy="38" r="2" fill="#d4af37" />
    <path d="M85 50 Q90 55, 85 60" stroke="#d4af37" strokeWidth="2" fill="none" />
  </svg>
);

export const getItemIcon = (itemType: string): React.FC<IconProps> => {
  const iconMap: Record<string, React.FC<IconProps>> = {
    inkstone: InkstoneIcon,
    jade_ring: JadeRingIcon,
    clock: ClockIcon,
    porcelain: PorcelainIcon,
    wood_box: WoodBoxIcon,
    silver_lock: SilverLockIcon,
    book: BookIcon,
    hairpin: HairpinIcon
  };
  return iconMap[itemType] || BookIcon;
};

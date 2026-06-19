import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const baseStyle = {
  fill: 'none',
  stroke: '#5C4033',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const TomatoIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M32 56 C18 56 12 46 12 36 C12 24 20 16 32 16 C44 16 52 24 52 36 C52 46 46 56 32 56Z" />
    <path d="M32 16 C30 10 26 8 22 10" />
    <path d="M32 16 C34 10 38 8 42 10" />
    <path d="M32 16 L32 8" />
    <path d="M30 10 L32 4 L34 10" />
  </svg>
);

export const ChiliIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M20 20 C18 14 22 8 28 10" />
    <path d="M20 20 C18 14 22 8 28 10" transform="translate(2 0)" />
    <path d="M22 22 C18 30 20 46 32 54 C44 46 46 30 42 22 C38 18 26 18 22 22Z" />
    <path d="M30 30 C30 36 34 40 38 38" />
    <path d="M26 38 C28 42 34 44 36 40" />
  </svg>
);

export const FishIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M8 32 C12 20 28 16 40 24 C48 28 52 32 52 32 C52 32 48 36 40 40 C28 48 12 44 8 32Z" />
    <path d="M52 32 L60 22 L58 32 L60 42 Z" />
    <circle cx="36" cy="30" r="2" fill="#5C4033" stroke="none" />
    <path d="M16 30 C18 28 22 28 24 30" />
    <path d="M16 34 C18 36 22 36 24 34" />
    <path d="M26 26 C30 24 34 24 38 26" />
  </svg>
);

export const MeatIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M12 44 C8 40 8 32 16 28 C20 26 26 26 30 28 L42 16 C48 10 58 14 58 22 C58 30 50 36 44 36 L32 48 C30 54 20 56 14 52 C8 48 8 46 12 44Z" />
    <circle cx="24" cy="36" r="3" />
    <circle cx="36" cy="42" r="2" />
    <circle cx="46" cy="28" r="2.5" />
    <path d="M44 18 L48 22" />
    <path d="M16 46 L20 50" />
  </svg>
);

export const VegetableIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M16 40 C14 28 22 18 32 18 C42 18 50 28 48 40 C46 52 38 58 32 58 C26 58 18 52 16 40Z" />
    <path d="M28 18 C26 10 22 6 18 8" />
    <path d="M32 18 C32 8 36 4 40 6" />
    <path d="M36 18 C40 12 46 10 50 14" />
    <path d="M24 32 L28 36" />
    <path d="M36 32 L40 36" />
    <path d="M30 44 L34 48" />
  </svg>
);

export const EggIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M32 8 C22 8 14 24 14 38 C14 50 22 58 32 58 C42 58 50 50 50 38 C50 24 42 8 32 8Z" />
    <path d="M26 28 C28 26 30 26 32 28" />
    <path d="M24 40 C26 38 30 38 32 40" />
  </svg>
);

export const NoodleIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <ellipse cx="32" cy="52" rx="22" ry="8" />
    <path d="M14 48 C18 36 14 28 18 20" />
    <path d="M22 50 C24 38 20 26 26 16" />
    <path d="M32 52 C32 40 28 28 32 14" />
    <path d="M42 50 C40 38 44 26 38 16" />
    <path d="M50 48 C46 36 50 28 46 20" />
    <path d="M20 14 L26 10" />
    <path d="M32 12 L36 8" />
    <path d="M38 14 L44 10" />
  </svg>
);

export const RiceIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M10 40 L14 56 L50 56 L54 40" />
    <ellipse cx="32" cy="40" rx="22" ry="8" />
    <ellipse cx="32" cy="32" rx="18" ry="10" />
    <path d="M22 28 C24 24 28 22 32 24" />
    <path d="M32 24 C36 22 40 24 42 28" />
    <path d="M26 32 C28 30 32 30 34 32" />
    <path d="M30 36 C32 34 36 34 38 36" />
  </svg>
);

export const SoupIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M10 28 L54 28 C54 28 56 52 32 52 C8 52 10 28 10 28Z" />
    <ellipse cx="32" cy="28" rx="22" ry="8" />
    <path d="M54 32 L60 32" />
    <path d="M10 32 L4 32" />
    <path d="M22 18 C20 14 24 10 26 14" />
    <path d="M32 14 C30 10 34 6 36 10" />
    <path d="M42 18 C40 14 44 10 46 14" />
    <ellipse cx="26" cy="38" rx="4" ry="2" />
    <ellipse cx="38" cy="40" rx="3" ry="1.5" />
  </svg>
);

export const DessertIcon: React.FC<IconProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className} style={baseStyle}>
    <path d="M14 44 L18 56 L46 56 L50 44" />
    <path d="M14 44 C14 34 22 28 32 28 C42 28 50 34 50 44" />
    <path d="M28 28 C26 22 28 18 32 18 C36 18 38 22 36 28" />
    <path d="M32 18 L32 10" />
    <circle cx="32" cy="8" r="3" fill="#FF6B9D" stroke="#5C4033" />
    <path d="M20 36 C22 34 26 34 28 36" />
    <path d="M36 36 C38 34 42 34 44 36" />
    <path d="M24 50 L28 46" />
    <path d="M36 50 L40 46" />
  </svg>
);

export const getFoodIcon = (iconName: string, size?: number): React.ReactElement => {
  const icons: { [key: string]: React.FC<IconProps> } = {
    tomato: TomatoIcon,
    chili: ChiliIcon,
    fish: FishIcon,
    meat: MeatIcon,
    vegetable: VegetableIcon,
    egg: EggIcon,
    noodle: NoodleIcon,
    rice: RiceIcon,
    soup: SoupIcon,
    dessert: DessertIcon,
  };
  const IconComponent = icons[iconName] || VegetableIcon;
  return <IconComponent size={size} />;
};

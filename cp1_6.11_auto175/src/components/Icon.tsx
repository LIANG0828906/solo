import type { IconType } from '../types';

interface IconProps {
  type: IconType;
  color?: string;
  size?: number;
}

export const Icon = ({ type, color = '#FFFFFF', size = 60 }: IconProps) => {
  const icons: Record<IconType, JSX.Element> = {
    hotCoffee: (
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <path d="M12 20h32v24c0 8.837-7.163 16-16 16S12 52.837 12 44V20z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M44 26h4c3.314 0 6-2.686 6-6s-2.686-6-6-6h-4" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M18 14c0-2 1-4 3-4s3 2 3 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M28 12c0-2 1-4 3-4s3 2 3 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M38 14c0-2 1-4 3-4s3 2 3 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8"/>
      </svg>
    ),
    icedCoffee: (
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <path d="M14 24h36l-3 32c0 2.21-1.79 4-4 4H21c-2.21 0-4-1.79-4-4l-3-32z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M10 24h44v-4H10v4z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M26 8v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M38 8v10" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M32 4v14" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M20 40h24" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
        <path d="M22 48h20" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
      </svg>
    ),
    latte: (
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <path d="M10 22h40v28c0 4.418-3.582 8-8 8H18c-4.418 0-8-3.582-8-8V22z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M50 26h4c3.314 0 6-2.686 6-6s-2.686-6-6-6h-4" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"/>
        <ellipse cx="30" cy="28" rx="16" ry="4" stroke={color} strokeWidth="2.5" fill="none"/>
        <path d="M22 34c2 2 6 3 8 3s6-1 8-3" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
        <path d="M26 40c1.5 1.5 4 2.5 6 2.5s4.5-1 6-2.5" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
      </svg>
    ),
    croissant: (
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <path d="M8 48c4-12 12-20 24-20s20 8 24 20c-8 8-20 12-24 12S16 56 8 48z" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M16 44c2-2 5-3 8-3s6 1 8 3" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M24 36c2-2 5-3 8-3s6 1 8 3" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8"/>
        <path d="M32 28v8" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
        <ellipse cx="20" cy="50" rx="2" ry="1.5" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
        <ellipse cx="44" cy="50" rx="2" ry="1.5" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
        <ellipse cx="32" cy="52" rx="2" ry="1.5" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5"/>
      </svg>
    ),
    mapleLeaf: (
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <path d="M32 4L18 18l-4-2-8 16 12 4-2 6 10 4v14l4-6 4 6V40l10-4-2-6 12-4-8-16-4 2L32 4z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M32 4v52" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
        <path d="M16 28l8 4M48 28l-8 4M22 18l6 2M42 18l-6 2" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4"/>
      </svg>
    ),
    flower: (
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none">
        <ellipse cx="32" cy="18" rx="8" ry="10" stroke={color} strokeWidth="2.5" fill="none"/>
        <ellipse cx="46" cy="26" rx="10" ry="8" stroke={color} strokeWidth="2.5" fill="none"/>
        <ellipse cx="46" cy="42" rx="10" ry="8" stroke={color} strokeWidth="2.5" fill="none"/>
        <ellipse cx="32" cy="50" rx="8" ry="10" stroke={color} strokeWidth="2.5" fill="none"/>
        <ellipse cx="18" cy="42" rx="10" ry="8" stroke={color} strokeWidth="2.5" fill="none"/>
        <ellipse cx="18" cy="26" rx="10" ry="8" stroke={color} strokeWidth="2.5" fill="none"/>
        <circle cx="32" cy="34" r="6" stroke={color} strokeWidth="2.5" fill="none"/>
        <circle cx="30" cy="32" r="1.5" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
        <circle cx="34" cy="33" r="1" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
        <circle cx="31" cy="36" r="1" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
      </svg>
    ),
  };

  return icons[type];
};

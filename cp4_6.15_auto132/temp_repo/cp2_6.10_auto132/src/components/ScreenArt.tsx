import React from 'react';
import { ScreenData } from '../types';

interface ScreenArtProps {
  screen: ScreenData;
  width?: number;
  height?: number;
  showFrame?: boolean;
}

export const ScreenArt: React.FC<ScreenArtProps> = ({ screen, width = 150, height = 200, showFrame = true }) => {
  const renderPattern = () => {
    const [c1, c2, c3, c4, c5] = screen.colors;
    
    switch (screen.pattern) {
      case 'flowers-birds':
        return (
          <>
            <ellipse cx="45" cy="130" rx="30" ry="20" fill={c1} opacity="0.8" />
            <ellipse cx="50" cy="125" rx="25" ry="15" fill={c2} opacity="0.7" />
            <path d="M55 100 Q60 80 80 90 Q70 110 55 100" fill={c3} opacity="0.9" />
            <path d="M95 85 L110 75 L108 82 L115 80 L110 88 L118 90 L110 95 L115 100 L105 98 L95 105 Z" fill={c4} />
            <circle cx="105" cy="88" r="2" fill="#000" />
            <path d="M30 60 Q40 40 60 50 Q50 70 30 60" fill={c3} opacity="0.8" />
            <path d="M100 150 L85 160 L88 153 L80 155 L88 150 L80 145 L88 147 L85 140 L100 150 Z" fill={c4} />
            <circle cx="92" cy="152" r="2" fill="#000" />
            <circle cx="70" cy="40" r="8" fill={c1} opacity="0.6" />
            <circle cx="25" cy="90" r="6" fill={c5} opacity="0.5" />
            <path d="M40 170 Q50 160 65 170 Q55 180 40 170" fill={c3} opacity="0.7" />
          </>
        );
      case 'ladies':
        return (
          <>
            <ellipse cx="75" cy="70" rx="25" ry="28" fill={c1} />
            <circle cx="75" cy="45" r="15" fill={c5} />
            <ellipse cx="75" cy="55" rx="18" ry="8" fill={c3} opacity="0.5" />
            <path d="M65 45 Q75 35 85 45" stroke={c4} strokeWidth="2" fill="none" />
            <circle cx="70" cy="43" r="2" fill={c4} />
            <circle cx="80" cy="43" r="2" fill={c4} />
            <path d="M72 52 Q75 55 78 52" stroke={c4} strokeWidth="1" fill="none" />
            <path d="M50 100 Q55 140 45 180 L105 180 Q95 140 100 100 Z" fill={c2} />
            <path d="M55 100 Q60 130 52 175 L98 175 Q90 130 95 100 Z" fill={c3} opacity="0.6" />
            <ellipse cx="115" cy="100" rx="12" ry="18" fill={c4} opacity="0.8" />
            <path d="M115 82 Q110 75 105 82" stroke={c4} strokeWidth="2" fill="none" />
            <rect x="110" y="75" width="10" height="3" rx="1" fill={c2} />
          </>
        );
      case 'landscape':
        return (
          <>
            <rect width="150" height="200" fill={c5} opacity="0.3" />
            <path d="M0 120 Q30 80 50 100 Q70 70 90 90 Q110 60 130 80 Q140 75 150 95 L150 200 L0 200 Z" fill={c1} />
            <path d="M0 140 Q25 110 45 125 Q65 100 85 115 Q105 95 125 110 Q140 105 150 120 L150 200 L0 200 Z" fill={c2} />
            <path d="M0 165 Q35 145 55 155 Q80 140 100 150 Q120 140 150 155 L150 200 L0 200 Z" fill={c3} />
            <path d="M20 130 L30 100 L40 130 Z" fill={c4} opacity="0.6" />
            <path d="M80 115 L90 85 L100 115 Z" fill={c4} opacity="0.7" />
            <path d="M120 105 L128 80 L136 105 Z" fill={c4} opacity="0.5" />
            <ellipse cx="40" cy="40" rx="20" ry="10" fill="#fff" opacity="0.6" />
            <ellipse cx="100" cy="30" rx="25" ry="12" fill="#fff" opacity="0.5" />
            <circle cx="130" cy="50" r="15" fill={c4} opacity="0.8" />
            <path d="M10 180 Q50 170 90 175 Q120 180 150 175" stroke={c4} strokeWidth="2" fill="none" opacity="0.5" />
          </>
        );
      case 'antiques':
        return (
          <>
            <rect x="10" y="160" width="130" height="30" fill={c3} />
            <rect x="15" y="155" width="120" height="8" rx="2" fill={c2} />
            <ellipse cx="50" cy="140" rx="20" ry="10" fill={c1} />
            <path d="M35 140 L30 90 L70 90 L65 140 Z" fill={c2} />
            <ellipse cx="50" cy="90" rx="20" ry="8" fill={c1} />
            <rect x="45" y="75" width="10" height="20" rx="2" fill={c4} />
            <rect x="85" y="100" width="40" height="55" fill={c5} />
            <rect x="88" y="103" width="34" height="49" fill={c1} opacity="0.5" />
            <circle cx="105" cy="128" r="12" fill={c2} opacity="0.8" />
            <path d="M98 128 L105 120 L112 128 L105 136 Z" fill={c4} />
            <rect x="30" y="50" width="25" height="35" rx="3" fill={c4} opacity="0.9" />
            <path d="M35 60 L50 60 M35 70 L50 70 M35 80 L48 80" stroke={c3} strokeWidth="1.5" />
            <ellipse cx="115" cy="70" rx="18" ry="22" fill={c1} opacity="0.7" />
            <path d="M105 60 Q115 50 125 60" stroke={c4} strokeWidth="2" fill="none" />
            <rect x="100" y="80" width="30" height="6" rx="1" fill={c4} />
          </>
        );
      case 'insects':
        return (
          <>
            <path d="M0 180 Q50 160 100 170 Q130 175 150 165" stroke={c1} strokeWidth="3" fill="none" />
            <path d="M30 175 Q35 150 40 175" stroke={c2} strokeWidth="2" fill="none" />
            <ellipse cx="40" cy="150" rx="10" ry="6" fill={c1} />
            <ellipse cx="100" cy="140" rx="12" ry="7" fill={c3} />
            <path d="M95 135 Q100 120 105 135" stroke={c2} strokeWidth="2" fill="none" />
            <ellipse cx="120" cy="90" rx="4" ry="6" fill={c5} />
            <ellipse cx="114" cy="85" rx="8" ry="5" fill={c3} opacity="0.7" transform="rotate(-30 114 85)" />
            <ellipse cx="126" cy="85" rx="8" ry="5" fill={c3} opacity="0.7" transform="rotate(30 126 85)" />
            <circle cx="118" cy="88" r="1.5" fill="#000" />
            <circle cx="122" cy="88" r="1.5" fill="#000" />
            <path d="M115 82 Q113 78 111 76" stroke={c5} strokeWidth="1" fill="none" />
            <path d="M125 82 Q127 78 129 76" stroke={c5} strokeWidth="1" fill="none" />
            <ellipse cx="50" cy="70" rx="3" ry="5" fill={c4} />
            <ellipse cx="45" cy="67" rx="7" ry="4" fill={c3} opacity="0.6" transform="rotate(-25 45 67)" />
            <ellipse cx="55" cy="67" rx="7" ry="4" fill={c3} opacity="0.6" transform="rotate(25 55 67)" />
            <circle cx="48" cy="68" r="1" fill="#000" />
            <circle cx="52" cy="68" r="1" fill="#000" />
            <ellipse cx="85" cy="120" rx="5" ry="8" fill={c4} />
            <circle cx="83" cy="115" r="1.5" fill="#000" />
            <circle cx="87" cy="115" r="1.5" fill="#000" />
            <path d="M80 115 Q75 110 72 108" stroke={c4} strokeWidth="1" fill="none" />
            <path d="M90 115 Q95 110 98 108" stroke={c4} strokeWidth="1" fill="none" />
            <path d="M85 128 L82 140 M85 128 L88 140 M85 125 L80 130 M85 125 L90 130" stroke={c4} strokeWidth="1" />
            <circle cx="25" cy="40" r="5" fill={c5} />
            <circle cx="130" cy="50" r="4" fill={c5} />
            <circle cx="70" cy="35" r="3" fill={c5} />
          </>
        );
      case 'story':
        return (
          <>
            <rect x="10" y="20" width="60" height="80" fill={c5} />
            <rect x="15" y="25" width="50" height="70" fill={c3} opacity="0.3" />
            <rect x="10" y="20" width="60" height="10" fill={c1} />
            <circle cx="40" cy="60" r="12" fill={c5} />
            <ellipse cx="40" cy="55" rx="10" ry="6" fill={c2} opacity="0.8" />
            <circle cx="36" cy="58" r="1.5" fill={c4} />
            <circle cx="44" cy="58" r="1.5" fill={c4} />
            <path d="M38 64 Q40 66 42 64" stroke={c4} strokeWidth="1" fill="none" />
            <path d="M30 75 Q40 90 50 75" stroke={c4} strokeWidth="2" fill="none" />
            <rect x="80" y="60" width="60" height="120" fill={c5} opacity="0.5" />
            <path d="M95 90 Q105 80 115 90 L115 170 L95 170 Z" fill={c1} />
            <circle cx="105" cy="80" r="10" fill={c5} />
            <ellipse cx="105" cy="76" rx="8" ry="5" fill={c2} opacity="0.8" />
            <circle cx="102" cy="78" r="1.5" fill={c4} />
            <circle cx="108" cy="78" r="1.5" fill={c4} />
            <path d="M103 84 Q105 86 107 84" stroke={c4} strokeWidth="1" fill="none" />
            <path d="M85 100 L95 105 L95 130 L85 125 Z" fill={c3} />
            <path d="M125 90 L135 85 L135 120 L125 115 Z" fill={c3} />
            <rect x="90" y="145" width="30" height="5" fill={c4} />
            <path d="M95 150 L100 170 L120 170 L115 150 Z" fill={c4} />
            <circle cx="75" cy="35" r="8" fill={c3} opacity="0.8" />
            <circle cx="135" cy="45" r="6" fill={c3} opacity="0.6" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 150 200"
      style={{
        background: `linear-gradient(135deg, #f5e6cc 0%, #e8d5b0 50%, #f5e6cc 100%)`,
        border: showFrame ? '2px solid #5d4037' : 'none',
        borderRadius: showFrame ? '4px' : '0',
        boxShadow: showFrame ? 'inset 0 0 20px rgba(139, 94, 60, 0.3)' : 'none'
      }}
    >
      <defs>
        <filter id="texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
          <feDiffuseLighting in="noise" lightingColor="#f5e6cc" surfaceScale="2">
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
        </filter>
      </defs>
      <rect width="150" height="200" fill="url(#silkTexture)" opacity="0.1" />
      {renderPattern()}
      <defs>
        <linearGradient id="silkTexture" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5e3c" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#8b5e3c" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#8b5e3c" stopOpacity="0.05" />
        </linearGradient>
      </defs>
    </svg>
  );
};

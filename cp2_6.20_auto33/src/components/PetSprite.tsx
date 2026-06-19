import React, { useMemo } from 'react';
import type { Pet, PetAnimationState, ColorScheme, PetSpecies } from '../types';
import { levelBadgeColor } from '../utils/helpers';

interface Props {
  pet: Pet;
  animState?: PetAnimationState;
  facing?: 'left' | 'right';
  size?: number;
}

interface Palette {
  body: string;
  ears: string;
  eyes: string;
  nose: string;
  belly: string;
}

function getPalette(species: PetSpecies, breed: string, scheme: ColorScheme): Palette {
  const catMap: Record<string, Palette[]> = {
    domestic: [
      { body: '#F5A623', ears: '#D4891C', eyes: '#7C4D1A', nose: '#E07A5F', belly: '#FFE0B2' },
      { body: '#3A3A3A', ears: '#1F1F1F', eyes: '#FFD700', nose: '#8B4513', belly: '#6B6B6B' },
      { body: '#FAFAFA', ears: '#E0E0E0', eyes: '#5C97BF', nose: '#F48FB1', belly: '#FFFFFF' },
    ],
    scottish: [
      { body: '#C9B8A0', ears: '#A89070', eyes: '#607D8B', nose: '#8D6E63', belly: '#E8DFD3' },
      { body: '#F4E4C1', ears: '#E0C88A', eyes: '#546E7A', nose: '#A1887F', belly: '#FBF5E6' },
      { body: '#D3B8B8', ears: '#B89898', eyes: '#8E44AD', nose: '#AB8282', belly: '#EADADA' },
    ],
    ragdoll: [
      { body: '#FAEBD7', ears: '#8B7355', eyes: '#4A90D9', nose: '#D7B895', belly: '#FFF5E6' },
      { body: '#E8E8E8', ears: '#9370DB', eyes: '#2980B9', nose: '#B39DDB', belly: '#F5F5F5' },
      { body: '#FFEFD5', ears: '#D2691E', eyes: '#3498DB', nose: '#E8A87C', belly: '#FFF8EE' },
    ],
  };
  const dogMap: Record<string, Palette[]> = {
    shiba: [
      { body: '#E8A35A', ears: '#C97F3A', eyes: '#5C3317', nose: '#3E2723', belly: '#FFECCC' },
      { body: '#333333', ears: '#111111', eyes: '#8B4513', nose: '#000000', belly: '#555555' },
      { body: '#F5F5DC', ears: '#D2B48C', eyes: '#8B4513', nose: '#3E2723', belly: '#FFFFFF' },
    ],
    golden: [
      { body: '#DAA520', ears: '#B8860B', eyes: '#8B4513', nose: '#3E2723', belly: '#F5DEB3' },
      { body: '#F4D03F', ears: '#D4AC0D', eyes: '#A0522D', nose: '#5D4037', belly: '#FFF9C4' },
      { body: '#CD853F', ears: '#A0522D', eyes: '#654321', nose: '#3E2723', belly: '#F5DEB3' },
    ],
    corgi: [
      { body: '#FFFAF0', ears: '#CD5C5C', eyes: '#4A2C2A', nose: '#3E2723', belly: '#FFFFFF' },
      { body: '#FFE4B5', ears: '#8B4513', eyes: '#5C3317', nose: '#3E2723', belly: '#FFFFFF' },
      { body: '#E8E8E8', ears: '#555555', eyes: '#2F4F4F', nose: '#1A1A1A', belly: '#FFFFFF' },
    ],
  };
  const map = species === 'cat' ? catMap : dogMap;
  const arr = map[breed] ?? Object.values(map)[0];
  return arr[scheme] ?? arr[0];
}

export const PetSprite: React.FC<Props> = ({ pet, animState = 'idle', facing = 'right', size = 180 }) => {
  const palette = useMemo(() => getPalette(pet.species, pet.breed, pet.colorScheme), [pet]);
  const levelScale = 1 + (pet.level - 1) * 0.035;
  const scale = levelScale;
  const isCat = pet.species === 'cat';
  const isScottish = pet.breed === 'scottish';
  const isCorgi = pet.breed === 'corgi';
  const badgeColor = levelBadgeColor(pet.level);
  const showBow = pet.level >= 4 && isCat;
  const showCollar = pet.level >= 4 && !isCat;

  const animIdle = animState === 'idle';
  const animWalk = animState === 'walking';
  const animEat = animState === 'eating';
  const animPlay = animState === 'playing';
  const animSleep = animState === 'sleeping';
  const animDrink = animState === 'drinking';

  const rotateY = facing === 'left' ? 'scaleX(-1)' : 'none';

  const tailStyle: React.CSSProperties = {
    transformOrigin: isCat ? '10% 50%' : '90% 50%',
    animation: animWalk || animPlay ? `${isCat ? 'tailWag' : 'tailWag'} 0.35s ease-in-out infinite` :
      animIdle ? `${isCat ? 'tailWag' : 'tailWag'} 1.5s ease-in-out infinite` : 'none',
    transformBox: 'fill-box' as any,
  };

  const bodyStyle: React.CSSProperties = {
    transformOrigin: '50% 90%',
    animation: animWalk ? 'walk 0.4s linear infinite' : animIdle ? 'bob 2.2s ease-in-out infinite' : animPlay ? 'pet-bounce 0.6s ease-in-out infinite' : 'none',
    transformBox: 'fill-box' as any,
  };

  const eyeStyle: React.CSSProperties = {
    transformOrigin: '50% 50%',
    animation: animSleep ? 'none' : 'blink 4s infinite',
    transformBox: 'fill-box' as any,
  };

  const mouthRotate = animEat || animDrink ? 'rotate(10deg)' : 'none';
  const sleepingOpacity = animSleep ? 0.9 : 1;

  return (
    <div style={{ position: 'relative', width: size, height: size * 0.9, transform: rotateY, transition: 'transform 0.4s ease' }}>
      <svg viewBox="0 0 200 180" width={size} height={size * 0.9} style={{ display: 'block', opacity: sleepingOpacity }}>
        <defs>
          <radialGradient id={`belly-${pet.id}`} cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor={palette.belly} stopOpacity="1" />
            <stop offset="100%" stopColor={palette.body} stopOpacity="0.95" />
          </radialGradient>
          <filter id={`soft-${pet.id}`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {isCat ? (
          <>
            <g style={tailStyle}>
              <path d="M 25 95 Q 5 70 10 45 Q 15 30 30 35 Q 28 50 20 65 Q 18 80 30 95 Z"
                fill={palette.body} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M 22 55 Q 12 52 10 42" stroke={palette.ears} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
            </g>
          </>
        ) : (
          <>
            <g style={tailStyle}>
              <path d={isCorgi
                ? "M 170 85 L 188 78 L 180 95 Z"
                : "M 170 90 Q 192 60 188 40 Q 185 30 178 35 Q 180 55 172 80 Q 171 88 170 90 Z"}
                fill={palette.body} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
            </g>
          </>
        )}

        <g style={bodyStyle}>
          <ellipse cx="100" cy="115" rx="58" ry="42" fill={`url(#belly-${pet.id})`} stroke={palette.ears} strokeWidth="2.5" />

          <ellipse cx="100" cy="140" rx="55" ry="18" fill={palette.belly} opacity="0.7" />

          {!isCorgi && (
            <>
              <rect x="60" y="140" width="14" height="28" rx="6" fill={palette.body} stroke={palette.ears} strokeWidth="2" />
              <rect x="126" y="140" width="14" height="28" rx="6" fill={palette.body} stroke={palette.ears} strokeWidth="2" />
              <ellipse cx="67" cy="170" rx="9" ry="4" fill={palette.ears} />
              <ellipse cx="133" cy="170" rx="9" ry="4" fill={palette.ears} />
            </>
          )}
          {isCorgi && (
            <>
              <rect x="58" y="142" width="18" height="22" rx="6" fill={palette.body} stroke={palette.ears} strokeWidth="2" />
              <rect x="124" y="142" width="18" height="22" rx="6" fill={palette.body} stroke={palette.ears} strokeWidth="2" />
              <ellipse cx="67" cy="166" rx="11" ry="4" fill={palette.ears} />
              <ellipse cx="133" cy="166" rx="11" ry="4" fill={palette.ears} />
            </>
          )}

          <g transform="translate(0, 0)">
            <circle cx="100" cy="68" r="46" fill={palette.body} stroke={palette.ears} strokeWidth="2.5" />

            {isCat ? (
              isScottish ? (
                <>
                  <path d="M 68 40 Q 72 18 90 30 Q 82 34 75 44 Z" fill={palette.ears} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M 132 40 Q 128 18 110 30 Q 118 34 125 44 Z" fill={palette.ears} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M 70 45 Q 72 28 85 36" stroke={palette.body} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
                  <path d="M 130 45 Q 128 28 115 36" stroke={palette.body} strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M 60 45 L 68 12 L 86 38 Z" fill={palette.ears} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M 140 45 L 132 12 L 114 38 Z" fill={palette.ears} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M 64 40 L 70 20 L 80 36 Z" fill={palette.body} opacity="0.5" />
                  <path d="M 136 40 L 130 20 L 120 36 Z" fill={palette.body} opacity="0.5" />
                </>
              )
            ) : (
              <>
                <path d="M 58 52 Q 52 18 78 32 Q 70 42 64 55 Z" fill={palette.ears} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 142 52 Q 148 18 122 32 Q 130 42 136 55 Z" fill={palette.ears} stroke={palette.ears} strokeWidth="1.5" strokeLinejoin="round" />
              </>
            )}

            {showBow && (
              <g transform="translate(75, 16)">
                <path d="M 0 8 L -16 0 L -16 16 Z" fill="#FF6B9D" stroke="#E91E63" strokeWidth="1.5" />
                <path d="M 0 8 L 16 0 L 16 16 Z" fill="#FF6B9D" stroke="#E91E63" strokeWidth="1.5" />
                <circle cx="0" cy="8" r="4" fill="#E91E63" />
              </g>
            )}
            {showCollar && (
              <g>
                <path d="M 70 95 Q 100 105 130 95" stroke="#D32F2F" strokeWidth="5" fill="none" strokeLinecap="round" />
                <circle cx="100" cy="102" r="5" fill="#FFD700" stroke="#DAA520" strokeWidth="1.5" />
              </g>
            )}

            <ellipse cx="100" cy="82" rx="26" ry="20" fill={palette.belly} opacity="0.6" />

            <g style={eyeStyle}>
              {animSleep ? (
                <>
                  <path d="M 80 62 Q 85 66 90 62" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M 110 62 Q 115 66 120 62" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <ellipse cx="85" cy="62" rx="6.5" ry="8" fill="white" stroke={palette.ears} strokeWidth="1.5" />
                  <ellipse cx="115" cy="62" rx="6.5" ry="8" fill="white" stroke={palette.ears} strokeWidth="1.5" />
                  <circle cx="85" cy="63" r="4" fill={palette.eyes} />
                  <circle cx="115" cy="63" r="4" fill={palette.eyes} />
                  <circle cx="86.5" cy="61" r="1.5" fill="white" />
                  <circle cx="116.5" cy="61" r="1.5" fill="white" />
                </>
              )}
            </g>

            <g transform="translate(100, 76)">
              {isCat ? (
                <path d="M -4 2 L 0 5 L 4 2 Z" fill={palette.nose} stroke={palette.nose} strokeWidth="0.5" strokeLinejoin="round" />
              ) : (
                <ellipse cx="0" cy="2" rx="5" ry="3.5" fill={palette.nose} stroke="#222" strokeWidth="1" />
              )}
            </g>

            <g transform="translate(100, 82)" style={{ transformOrigin: '50% 0%', transform: mouthRotate, transition: 'transform 0.2s' }}>
              {animEat || animDrink ? (
                <ellipse cx="0" cy="3" rx="7" ry="5" fill="#8B2252" stroke="#4A1430" strokeWidth="1" />
              ) : (
                <>
                  {isCat ? (
                    <path d="M 0 4 Q -6 11 -11 8 M 0 4 Q 6 11 11 8" stroke="#5D4037" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                  ) : (
                    <path d="M -5 4 Q 0 10 5 4 Q 2 8 0 8 Q -2 8 -5 4" stroke="#5D4037" strokeWidth="1.8" fill="none" strokeLinejoin="round" />
                  )}
                </>
              )}
            </g>

            {isCat ? (
              <>
                <line x1="52" y1="76" x2="32" y2="72" stroke={palette.ears} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="52" y1="82" x2="32" y2="84" stroke={palette.ears} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="148" y1="76" x2="168" y2="72" stroke={palette.ears} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="148" y1="82" x2="168" y2="84" stroke={palette.ears} strokeWidth="1.5" strokeLinecap="round" />
              </>
            ) : (
              <ellipse cx="100" cy="88" rx="10" ry="4" fill="#FFB6C1" opacity="0.45" />
            )}
          </g>
        </g>
      </svg>

      <div style={{
        position: 'absolute',
        top: -8,
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
      }}>
        <svg width="38" height="36" viewBox="0 0 38 36">
          <defs>
            <linearGradient id={`bdg-${pet.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={badgeColor.shine} />
              <stop offset="55%" stopColor={badgeColor.fill} />
              <stop offset="100%" stopColor={badgeColor.stroke} />
            </linearGradient>
          </defs>
          <path
            d="M19 2 L23 13 L35 13 L25 21 L29 33 L19 26 L9 33 L13 21 L3 13 L15 13 Z"
            fill={`url(#bdg-${pet.id})`}
            stroke={badgeColor.stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <text x="19" y="22" textAnchor="middle" fontFamily="var(--font-cartoon)" fontSize="11" fill={pet.level <= 3 ? '#FFF' : '#5D4037'} fontWeight="700">
            {pet.level}
          </text>
        </svg>
      </div>

      {animSleep && (
        <div style={{
          position: 'absolute', top: 15, right: 10,
          fontSize: 22, fontWeight: 700,
          color: '#7E57C2', fontFamily: 'var(--font-cartoon)',
          animation: 'float-up 2.5s ease-out infinite',
        }}>Z</div>
      )}
    </div>
  );
};

export default PetSprite;

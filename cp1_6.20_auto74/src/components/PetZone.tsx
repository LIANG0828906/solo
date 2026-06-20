import { useState, useEffect, useMemo } from 'react';

interface PetZoneProps {
  activeOrderCount: number;
  jumpTrigger: number;
}

type PetState = 'sleeping' | 'sitting' | 'standing' | 'jumping';
type PetType = 'cat' | 'dog';

const PetZone = ({ activeOrderCount, jumpTrigger }: PetZoneProps) => {
  const [petType] = useState<PetType>(() => (Math.random() > 0.5 ? 'cat' : 'dog'));
  const [isJumping, setIsJumping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  const petState: PetState = useMemo(() => {
    if (isJumping) return 'jumping';
    if (activeOrderCount === 0) return 'sleeping';
    if (activeOrderCount <= 3) return 'sitting';
    return 'standing';
  }, [activeOrderCount, isJumping]);

  useEffect(() => {
    if (jumpTrigger > 0) {
      setIsJumping(true);
      setShowBubble(true);
      const jumpTimer = setTimeout(() => setIsJumping(false), 1000);
      const bubbleTimer = setTimeout(() => setShowBubble(false), 1500);
      return () => {
        clearTimeout(jumpTimer);
        clearTimeout(bubbleTimer);
      };
    }
  }, [jumpTrigger]);

  const stateColor = {
    sleeping: '#B0A89E',
    sitting: '#C9A87C',
    standing: '#E0A060',
    jumping: '#FF8C42'
  }[petState];

  const bodyColor = stateColor;
  const darkColor = {
    sleeping: '#8A8075',
    sitting: '#A8885C',
    standing: '#C08040',
    jumping: '#D07030'
  }[petState];

  const stateLabel = {
    sleeping: '😴 打盹中...',
    sitting: '🎵 摇尾巴',
    standing: '🚶 忙碌踱步',
    jumping: '🎉 太棒了！'
  }[petState];

  const getAnimationStyle = (): React.CSSProperties => {
    switch (petState) {
      case 'sleeping':
        return { animation: 'breathe 3s ease-in-out infinite', transformOrigin: 'bottom center' };
      case 'sitting':
        return { animation: 'wagTail 0.8s ease-in-out infinite' };
      case 'standing':
        return { animation: 'pace 3s ease-in-out infinite' };
      case 'jumping':
        return { animation: 'jump 0.4s ease-in-out 2' };
      default:
        return {};
    }
  };

  const renderCat = () => (
    <svg width="140" height="120" viewBox="0 0 140 120" style={{ transition: 'all 0.5s ease' }}>
      <g style={getAnimationStyle()}>
        {petState === 'sleeping' ? (
          <g>
            <ellipse cx="70" cy="90" rx="45" ry="22" fill={bodyColor} />
            <circle cx="40" cy="78" r="20" fill={bodyColor} />
            <polygon points="28,60 34,48 40,62" fill={darkColor} />
            <polygon points="50,58 52,44 58,60" fill={darkColor} />
            <circle cx="35" cy="76" r="2" fill="#4A3728" />
            <circle cx="43" cy="76" r="2" fill="#4A3728" />
            <path d="M 36 82 Q 39 84 42 82" stroke="#4A3728" strokeWidth="1.5" fill="none" />
            <ellipse cx="110" cy="85" rx="8" ry="5" fill={darkColor} />
            <text x="55" y="55" fontSize="10" fill="#8B7355" fontFamily="sans-serif">z z z</text>
          </g>
        ) : petState === 'sitting' ? (
          <g>
            <ellipse cx="70" cy="100" rx="35" ry="12" fill={darkColor} />
            <ellipse cx="70" cy="80" rx="28" ry="25" fill={bodyColor} />
            <circle cx="70" cy="52" r="24" fill={bodyColor} />
            <polygon points="52,36 56,18 66,36" fill={bodyColor} />
            <polygon points="56,34 58,24 63,34" fill="#FFB6C1" />
            <polygon points="74,36 84,18 88,36" fill={bodyColor} />
            <polygon points="77,34 82,24 84,34" fill="#FFB6C1" />
            <ellipse cx="62" cy="52" rx="3" ry="5" fill="#4A3728" />
            <ellipse cx="78" cy="52" rx="3" ry="5" fill="#4A3728" />
            <circle cx="70" cy="58" r="2" fill="#FFB6C1" />
            <path d="M 66 62 Q 70 65 74 62" stroke="#4A3728" strokeWidth="1.5" fill="none" />
            <line x1="50" y1="58" x2="38" y2="56" stroke="#4A3728" strokeWidth="1" />
            <line x1="50" y1="60" x2="38" y2="60" stroke="#4A3728" strokeWidth="1" />
            <line x1="90" y1="58" x2="102" y2="56" stroke="#4A3728" strokeWidth="1" />
            <line x1="90" y1="60" x2="102" y2="60" stroke="#4A3728" strokeWidth="1" />
            <g style={{ transformOrigin: '100px 80px' }}>
              <path d="M 100 80 Q 120 70 125 55" stroke={bodyColor} strokeWidth="8" fill="none" strokeLinecap="round" />
            </g>
          </g>
        ) : (
          <g>
            <ellipse cx="70" cy="100" rx="35" ry="10" fill={darkColor} opacity="0.3" />
            <rect x="50" y="65" width="40" height="35" rx="15" fill={bodyColor} />
            <circle cx="70" cy="48" r="22" fill={bodyColor} />
            <polygon points="54,34 58,16 68,34" fill={bodyColor} />
            <polygon points="58,32 60,22 65,32" fill="#FFB6C1" />
            <polygon points="72,34 82,16 86,34" fill={bodyColor} />
            <polygon points="75,32 80,22 82,32" fill="#FFB6C1" />
            <ellipse cx="62" cy="48" rx="3" ry="4" fill="#4A3728" />
            <ellipse cx="78" cy="48" rx="3" ry="4" fill="#4A3728" />
            <circle cx="70" cy="54" r="2" fill="#FFB6C1" />
            <path d="M 66 58 Q 70 61 74 58" stroke="#4A3728" strokeWidth="1.5" fill="none" />
            <line x1="50" y1="54" x2="38" y2="52" stroke="#4A3728" strokeWidth="1" />
            <line x1="50" y1="56" x2="38" y2="56" stroke="#4A3728" strokeWidth="1" />
            <line x1="90" y1="54" x2="102" y2="52" stroke="#4A3728" strokeWidth="1" />
            <line x1="90" y1="56" x2="102" y2="56" stroke="#4A3728" strokeWidth="1" />
            <rect x="52" y="95" width="10" height="12" rx="4" fill={darkColor} />
            <rect x="78" y="95" width="10" height="12" rx="4" fill={darkColor} />
            <path d="M 90 75 Q 115 65 118 45" stroke={bodyColor} strokeWidth="7" fill="none" strokeLinecap="round" />
          </g>
        )}
      </g>
    </svg>
  );

  const renderDog = () => (
    <svg width="140" height="120" viewBox="0 0 140 120" style={{ transition: 'all 0.5s ease' }}>
      <g style={getAnimationStyle()}>
        {petState === 'sleeping' ? (
          <g>
            <ellipse cx="70" cy="92" rx="48" ry="20" fill={bodyColor} />
            <ellipse cx="38" cy="80" rx="22" ry="18" fill={bodyColor} />
            <ellipse cx="28" cy="65" rx="8" ry="12" fill={darkColor} transform="rotate(-20 28 65)" />
            <circle cx="33" cy="78" r="2" fill="#4A3728" />
            <circle cx="43" cy="78" r="2" fill="#4A3728" />
            <ellipse cx="38" cy="84" rx="4" ry="3" fill="#4A3728" />
            <ellipse cx="115" cy="88" rx="7" ry="5" fill={darkColor} />
            <text x="52" y="52" fontSize="10" fill="#8B7355" fontFamily="sans-serif">z z z</text>
          </g>
        ) : petState === 'sitting' ? (
          <g>
            <ellipse cx="70" cy="102" rx="38" ry="10" fill={darkColor} opacity="0.3" />
            <ellipse cx="70" cy="82" rx="28" ry="28" fill={bodyColor} />
            <circle cx="68" cy="50" r="24" fill={bodyColor} />
            <ellipse cx="48" cy="38" rx="10" ry="15" fill={darkColor} transform="rotate(-15 48 38)" />
            <ellipse cx="88" cy="38" rx="10" ry="15" fill={darkColor} transform="rotate(15 88 38)" />
            <circle cx="58" cy="50" r="3.5" fill="#4A3728" />
            <circle cx="78" cy="50" r="3.5" fill="#4A3728" />
            <circle cx="59" cy="49" r="1" fill="#FFF" />
            <circle cx="79" cy="49" r="1" fill="#FFF" />
            <ellipse cx="68" cy="58" rx="5" ry="4" fill="#4A3728" />
            <path d="M 63 62 Q 68 66 73 62" stroke="#4A3728" strokeWidth="1.5" fill="none" />
            <ellipse cx="68" cy="65" rx="4" ry="2" fill="#FF6B6B" />
            <g style={{ transformOrigin: '105px 78px' }}>
              <ellipse cx="110" cy="68" rx="6" ry="12" fill={darkColor} transform="rotate(20 110 68)" />
            </g>
          </g>
        ) : (
          <g>
            <ellipse cx="70" cy="102" rx="38" ry="8" fill={darkColor} opacity="0.3" />
            <ellipse cx="68" cy="75" rx="30" ry="22" fill={bodyColor} />
            <circle cx="60" cy="45" r="22" fill={bodyColor} />
            <ellipse cx="42" cy="35" rx="9" ry="14" fill={darkColor} transform="rotate(-15 42 35)" />
            <ellipse cx="78" cy="35" rx="9" ry="14" fill={darkColor} transform="rotate(15 78 35)" />
            <circle cx="52" cy="45" r="3" fill="#4A3728" />
            <circle cx="68" cy="45" r="3" fill="#4A3728" />
            <circle cx="53" cy="44" r="1" fill="#FFF" />
            <circle cx="69" cy="44" r="1" fill="#FFF" />
            <ellipse cx="60" cy="52" rx="4.5" ry="3.5" fill="#4A3728" />
            <path d="M 55 56 Q 60 60 65 56" stroke="#4A3728" strokeWidth="1.5" fill="none" />
            <ellipse cx="60" cy="58" rx="3.5" ry="1.8" fill="#FF6B6B" />
            <rect x="45" y="92" width="10" height="14" rx="4" fill={darkColor} />
            <rect x="82" y="92" width="10" height="14" rx="4" fill={darkColor} />
            <ellipse cx="100" cy="60" rx="6" ry="12" fill={darkColor} transform="rotate(30 100 60)" />
          </g>
        )}
      </g>
    </svg>
  );

  return (
    <div
      style={{
        backgroundColor: '#FFF8F0',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(139, 94, 60, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '220px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ color: '#6B4226', fontSize: '18px', fontWeight: 700 }}>
          {petType === 'cat' ? '🐱 小猫咪' : '🐶 小狗狗'}
        </h3>
        <span style={{ fontSize: '13px', color: '#8B7355', fontWeight: 600 }}>{stateLabel}</span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: '150px',
          position: 'relative',
          background: 'linear-gradient(180deg, transparent 60%, rgba(210, 180, 140, 0.2) 100%)',
          borderRadius: '12px'
        }}
      >
        {showBubble && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '40px',
              backgroundColor: '#FFF',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              animation: 'float 1.5s ease-out forwards',
              border: '2px solid #FFB74D'
            }}
          >
            🎵
          </div>
        )}
        {showBubble && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '40px',
              backgroundColor: '#FFF',
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              animation: 'float 1.5s ease-out 0.2s forwards',
              border: '2px solid #FF8A65',
              opacity: 0
            }}
          >
            ✨
          </div>
        )}
        {petType === 'cat' ? renderCat() : renderDog()}
      </div>

      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activeOrderCount > i ? '#FF8A65' : '#E0D0B5',
                transition: 'background-color 0.3s ease',
                boxShadow: activeOrderCount > i ? '0 0 6px rgba(255, 138, 101, 0.5)' : 'none'
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#8B7355', fontWeight: 600 }}>
          当前忙碌指数：{activeOrderCount === 0 ? '空闲 ☕' : activeOrderCount <= 3 ? '适中 🍰' : '忙碌 🔥'}
        </div>
      </div>
    </div>
  );
};

export default PetZone;

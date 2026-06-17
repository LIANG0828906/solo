import React, { useEffect, useState } from 'react';
import { useViewStore } from '../store/viewStore';
import { MicrobeType, MICROBE_NAMES, MICROBE_COLORS } from '../types';

const Toolbar: React.FC = () => {
  const { selectedType, setSelectedType } = useViewStore();
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const types: MicrobeType[] = [
    MicrobeType.COCCUS,
    MicrobeType.BACILLUS,
    MicrobeType.SPIRILLUM,
  ];

  const handleClick = (type: MicrobeType) => {
    if (selectedType === type) {
      setSelectedType(null);
    } else {
      setSelectedType(type);
    }
  };

  const renderIcon = (type: MicrobeType) => {
    const color = MICROBE_COLORS[type];
    const isSelected = selectedType === type;
    const scale = isSelected ? 1.2 : 1;

    const commonStyle: React.CSSProperties = {
      transform: `scale(${scale})`,
      transition: 'transform 0.2s ease',
    };

    switch (type) {
      case MicrobeType.COCCUS:
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" style={commonStyle}>
            <circle cx="16" cy="16" r="12" fill={color} />
          </svg>
        );
      case MicrobeType.BACILLUS:
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" style={commonStyle}>
            <rect x="4" y="10" width="24" height="12" rx="6" fill={color} />
          </svg>
        );
      case MicrobeType.SPIRILLUM:
        return (
          <svg width="32" height="32" viewBox="0 0 32 32" style={commonStyle}>
            <path
              d="M4 8 C 10 4, 14 12, 16 16 C 18 20, 22 28, 28 24"
              stroke={color}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  if (isMobile) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around z-50"
        style={{
          height: '50px',
          background: '#0F1D33E0',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
        }}
      >
        {types.map((type) => {
          const isSelected = selectedType === type;
          return (
            <div
              key={type}
              className="flex flex-col items-center justify-center cursor-pointer px-2 py-1 rounded-lg"
              onClick={() => handleClick(type)}
              style={{
                outline: isSelected ? `2px solid ${MICROBE_COLORS[type]}` : 'none',
                boxShadow: isSelected ? `0 0 12px ${MICROBE_COLORS[type]}` : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ transform: isSelected ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
                {renderIcon(type)}
              </div>
              <span
                className="text-xs mt-0.5"
                style={{ color: MICROBE_COLORS[type], fontSize: '10px' }}
              >
                {MICROBE_NAMES[type]}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="fixed top-1/2 left-4 -translate-y-1/2 flex flex-col items-center gap-4 py-4 z-50"
      style={{
        width: '80px',
        background: '#0F1D33E0',
        borderRadius: '12px',
      }}
    >
      {types.map((type) => {
        const isSelected = selectedType === type;
        return (
          <div
            key={type}
            className="flex flex-col items-center justify-center cursor-pointer px-2 py-3 rounded-lg w-16"
            onClick={() => handleClick(type)}
            style={{
              outline: isSelected ? `2px solid ${MICROBE_COLORS[type]}` : 'none',
              boxShadow: isSelected ? `0 0 12px ${MICROBE_COLORS[type]}` : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ transform: isSelected ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s ease' }}>
              {renderIcon(type)}
            </div>
            <span
              className="text-sm mt-1"
              style={{ color: MICROBE_COLORS[type] }}
            >
              {MICROBE_NAMES[type]}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default Toolbar;

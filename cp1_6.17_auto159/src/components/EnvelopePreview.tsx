import React from 'react';
import { EnvelopeAnimator, type EnvelopeStyleType } from '../engine/EnvelopeAnimator';

interface EnvelopePreviewProps {
  style: EnvelopeStyleType;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const EnvelopePreview: React.FC<EnvelopePreviewProps> = ({
  style,
  size = 'medium',
  selected = false,
  onClick,
  className = '',
}) => {
  const config = EnvelopeAnimator.getEnvelopeStyle(style);

  const sizeMap = {
    small: { width: 70, height: 50 },
    medium: { width: 140, height: 100 },
    large: { width: 200, height: 140 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`envelope-preview ${selected ? 'selected' : ''} ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        borderRadius: size === 'small' ? '4px' : '6px',
        background: config.background,
        border: `1px solid ${config.borderColor}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        boxShadow: selected 
          ? '0 4px 16px rgba(0,0,0,0.15)' 
          : size === 'large' 
            ? '0 2px 8px rgba(0,0,0,0.1)'
            : 'none',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: `${height * 0.4}px`,
          background: config.flapColor,
          clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
          opacity: 0.8,
        }}
      />

      {style === 'wax-seal' && (
        <div
          style={{
            position: 'absolute',
            top: `${height * 0.25}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${width * 0.18}px`,
            height: `${width * 0.18}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${config.accentColor}, #5C0000)`,
            boxShadow: `0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
          }}
        />
      )}

      {style === 'airmail' && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `repeating-linear-gradient(90deg, ${config.accentColor} 0px, ${config.accentColor} 6px, white 6px, white 12px)`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `repeating-linear-gradient(90deg, ${config.accentColor} 0px, ${config.accentColor} 6px, white 6px, white 12px)`,
            }}
          />
        </>
      )}

      {style === 'steampunk' && (
        <div
          style={{
            position: 'absolute',
            top: `${height * 0.28}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${width * 0.22}px`,
            height: `${width * 0.22}px`,
            borderRadius: '50%',
            border: `2px solid ${config.accentColor}`,
            background: `conic-gradient(from 0deg, ${config.accentColor}, #8B6914, ${config.accentColor})`,
          }}
        />
      )}

      {style === 'washi' && (
        <div
          style={{
            position: 'absolute',
            top: `${height * 0.15}px`,
            right: `${width * 0.1}px`,
            width: `${width * 0.15}px`,
            height: `${height * 0.25}px`,
            background: config.accentColor,
            borderRadius: '2px',
            opacity: 0.7,
          }}
        />
      )}

      {style === 'glass' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
          }}
        />
      )}

      {style === 'kraft-bag' && (
        <div
          style={{
            position: 'absolute',
            top: `${height * 0.3}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            width: `${width * 0.3}px`,
            height: '2px',
            background: config.accentColor,
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
};

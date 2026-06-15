import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instrument, conditionLabels, categoryLabels } from './types';

interface InstrumentCardProps {
  instrument: Instrument;
  index?: number;
}

const InstrumentCard: React.FC<InstrumentCardProps> = ({ instrument, index = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const conditionColors: Record<string, string> = {
    'new': '#4CAF50',
    'minor-flaw': '#FF9800',
    'used': '#795548',
  };

  return (
    <Link
      to={`/instrument/${instrument.id}`}
      style={{
        width: '280px',
        background: '#FFF8DC',
        borderRadius: '12px',
        border: '1px solid #8B4513',
        overflow: 'hidden',
        boxShadow: isHovered
          ? '0 12px 32px rgba(92, 51, 23, 0.35)'
          : '0 4px 12px rgba(92, 51, 23, 0.15)',
        transform: isHovered ? 'rotate(2deg) translateY(-4px)' : 'rotate(0deg) translateY(0)',
        transition: 'all 0.2s ease-out',
        animation: `fadeIn 0.4s ease-out ${index * 0.05}s both`,
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ position: 'relative', width: '280px', height: '260px', overflow: 'hidden' }}>
        {!imageLoaded && (
          <div
            className="skeleton"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        )}
        <img
          src={instrument.images[0]}
          alt={instrument.name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-out, transform 0.2s ease-out',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
          onLoad={() => setImageLoaded(true)}
        />
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: conditionColors[instrument.condition],
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
          }}
        >
          {conditionLabels[instrument.condition]}
        </div>
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 10px',
            borderRadius: '20px',
            background: 'rgba(92, 51, 23, 0.85)',
            color: 'white',
            fontSize: '11px',
            fontWeight: '500',
          }}
        >
          {categoryLabels[instrument.category]}
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#5C3317',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '44px',
          }}
        >
          {instrument.name}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#8B4513', marginBottom: '2px' }}>租金/天</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FF8C00' }}>
              ¥{instrument.rentPerDay}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#8B4513', marginBottom: '2px' }}>售价</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#5C3317' }}>
              ¥{instrument.salePrice}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px dashed #DEB887',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #DEB887 0%, #D2A679 100%)',
              color: '#5C3317',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #8B4513',
            }}
          >
            {instrument.publisherNickname.charAt(0)}
          </div>
          <span style={{ fontSize: '13px', color: '#8B4513' }}>{instrument.publisherNickname}</span>
        </div>
      </div>
    </Link>
  );
};

export default InstrumentCard;

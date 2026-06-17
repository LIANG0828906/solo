import React from 'react';
import { PropertyValue, PROPERTY_CONFIG } from '../types';

interface PropertyCardsProps {
  properties: PropertyValue[];
}

const PropertyCard: React.FC<{ prop: PropertyValue }> = React.memo(
  ({ prop }) => {
    const config = PROPERTY_CONFIG[prop.type];
    const pct = Math.round(prop.value);

    return (
      <div
        style={{
          width: 160,
          borderRadius: 12,
          background: '#2A2A40',
          border: '1px solid #3D3D55',
          padding: '16px 14px',
          color: '#ffffff',
          transition: 'background 0.3s ease-out',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = '#3D3D55';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = '#2A2A40';
        }}
      >
        <div
          style={{
            fontSize: 13,
            opacity: 0.7,
            marginBottom: 6,
          }}
        >
          {config.label}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 10,
          }}
        >
          {prop.value.toFixed(1)}
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            background: '#1A1A2E',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 4,
              background: config.color,
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
      </div>
    );
  }
);

PropertyCard.displayName = 'PropertyCard';

const PropertyCards: React.FC<PropertyCardsProps> = ({ properties }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
      }}
    >
      {properties.map((prop) => (
        <PropertyCard key={prop.type} prop={prop} />
      ))}
    </div>
  );
};

export default PropertyCards;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { DonationItem } from '../utils/dataManager';
import { formatRelativeTime } from '../utils/dataManager';

interface ItemCardProps {
  item: DonationItem;
  style?: React.CSSProperties;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  '待认领': { bg: '#10B981', text: '#FFFFFF', label: '待认领' },
  '已认领': { bg: '#F97316', text: '#FFFFFF', label: '已认领' },
  '已完成': { bg: '#9CA3AF', text: '#FFFFFF', label: '已完成' },
};

const ItemCard: React.FC<ItemCardProps> = ({ item, style }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/item/${item.id}`);
  };

  const statusInfo = statusColors[item.status];

  return (
    <div
      onClick={handleClick}
      style={{
        width: '300px',
        background: '#FFFFFF',
        border: '1px solid #D1D5DB',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease-out',
        position: 'relative',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
    >
      {item.status !== '待认领' && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 10px',
            borderRadius: '6px',
            backgroundColor: statusInfo.bg,
            color: statusInfo.text,
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 2,
          }}
        >
          {statusInfo.label}
        </div>
      )}

      <div
        style={{
          width: '100%',
          height: '200px',
          background: '#F3F4F6',
          overflow: 'hidden',
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              fontSize: '40px',
            }}
          >
            📦
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        <h3
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: '10px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.name}
        </h3>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: '#D1FAE5',
              color: '#065F46',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {item.condition}
          </span>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: '#DBEAFE',
              color: '#1E40AF',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            📍 {item.location}
          </span>
        </div>

        <div
          style={{
            fontSize: '12px',
            color: '#6B7280',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{item.category}</span>
          <span>{formatRelativeTime(item.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;

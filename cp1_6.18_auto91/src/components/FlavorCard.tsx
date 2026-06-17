import React from 'react';
import { X } from 'lucide-react';
import { FlavorProfile } from '@/shared/types';
import { useFlavorStore } from '@/store/useFlavorStore';

interface FlavorCardProps {
  profile: FlavorProfile;
  isSelected: boolean;
}

export const FlavorCard: React.FC<FlavorCardProps> = ({ profile, isSelected }) => {
  const selectProfile = useFlavorStore((s) => s.selectProfile);
  const removeProfile = useFlavorStore((s) => s.removeProfile);
  const getBalanceScore = useFlavorStore((s) => s.getBalanceScore);
  const balanceScore = getBalanceScore(profile.id);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.delete-btn')) return;
    selectProfile(profile.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeProfile(profile.id);
  };

  return (
    <div
      className={`flavor-card ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      style={{
        width: '100%',
        background: '#2D2D44',
        borderRadius: '12px',
        border: `1px solid ${isSelected ? '#6C63FF' : '#3D3D5C'}`,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: profile.color,
            flexShrink: 0,
            opacity: profile.visible ? 1 : 0.3,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: '16px',
              color: '#E0E0FF',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              opacity: profile.visible ? 1 : 0.5,
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            {profile.name}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#8E8EB2',
              marginTop: '2px',
            }}
          >
            均衡度: {balanceScore}
          </span>
        </div>
      </div>
      <button
        className="delete-btn"
        onClick={handleDelete}
        aria-label={`删除 ${profile.name}`}
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#FF5252',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
          transition: 'all 0.2s ease-in-out',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FF1744';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FF5252';
        }}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <X size={14} color="#FFFFFF" strokeWidth={2.5} />
      </button>
    </div>
  );
};

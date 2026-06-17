import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FlavorProfile } from '@/shared/types';
import { useFlavorStore } from '@/store/useFlavorStore';

interface LegendProps {
  profiles: FlavorProfile[];
}

export const Legend: React.FC<LegendProps> = ({ profiles }) => {
  const toggleVisible = useFlavorStore((s) => s.toggleVisible);
  const getBalanceScore = useFlavorStore((s) => s.getBalanceScore);

  if (profiles.length === 0) {
    return (
      <div
        style={{
          padding: '16px',
          textAlign: 'center',
          color: '#8E8EB2',
          fontSize: '14px',
        }}
      >
        添加调味料开始对比
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        padding: '16px 24px',
      }}
    >
      {profiles.map((profile) => {
        const balanceScore = getBalanceScore(profile.id);
        return (
          <button
            key={profile.id}
            onClick={() => toggleVisible(profile.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: profile.visible ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
              border: `1px solid ${profile.visible ? 'rgba(108, 99, 255, 0.3)' : '#3D3D5C'}`,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              color: profile.visible ? '#E0E0FF' : '#555577',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: profile.color,
                opacity: profile.visible ? 1 : 0.3,
                transition: 'opacity 0.2s ease-in-out',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 500,
                opacity: profile.visible ? 1 : 0.5,
                transition: 'opacity 0.2s ease-in-out',
              }}
            >
              {profile.name}
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#8E8EB2',
                opacity: profile.visible ? 1 : 0.3,
              }}
            >
              均衡度 {balanceScore}
            </span>
            {profile.visible ? (
              <Eye size={14} color="#8E8EB2" />
            ) : (
              <EyeOff size={14} color="#555577" />
            )}
          </button>
        );
      })}
    </div>
  );
};

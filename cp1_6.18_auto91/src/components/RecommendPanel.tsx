import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { PresetFlavor } from '@/shared/types';
import { useFlavorStore } from '@/store/useFlavorStore';

interface RecommendPanelProps {
  recommended: PresetFlavor | null;
}

export const RecommendPanel: React.FC<RecommendPanelProps> = ({ recommended }) => {
  const addPreset = useFlavorStore((s) => s.addPreset);
  const canAddMore = useFlavorStore((s) => s.canAddMore);
  const profiles = useFlavorStore((s) => s.profiles);

  if (profiles.length === 0) return null;

  const handleAdd = () => {
    if (recommended && canAddMore()) {
      addPreset(recommended.id);
    }
  };

  if (!recommended) {
    return (
      <div
        style={{
          padding: '16px 20px',
          margin: '0 24px 16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(108, 99, 255, 0.08)',
          border: '1px solid rgba(108, 99, 255, 0.2)',
          color: '#8E8EB2',
          fontSize: '13px',
          textAlign: 'center',
        }}
      >
        <Sparkles size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        暂无可用推荐
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '0 24px 16px',
        padding: '14px 18px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(108, 99, 255, 0.05) 100%)',
        border: '1px solid rgba(108, 99, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(108, 99, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} color="#6C63FF" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            style={{
              fontSize: '12px',
              color: '#8E8EB2',
            }}
          >
            推荐搭配
          </span>
          <span
            style={{
              fontSize: '15px',
              color: '#E0E0FF',
              fontWeight: 600,
            }}
          >
            {recommended.name}
          </span>
        </div>
      </div>
      <button
        onClick={handleAdd}
        disabled={!canAddMore()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderRadius: '8px',
          backgroundColor: canAddMore() ? '#6C63FF' : '#3D3D5C',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 500,
          cursor: canAddMore() ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease-in-out',
          opacity: canAddMore() ? 1 : 0.5,
          flexShrink: 0,
        }}
      >
        <Plus size={14} />
        添加
      </button>
    </div>
  );
};

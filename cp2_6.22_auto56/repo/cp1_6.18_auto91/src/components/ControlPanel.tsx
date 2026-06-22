import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { FlavorCard } from './FlavorCard';
import { SliderGroup } from './SliderGroup';
import { useFlavorStore } from '@/store/useFlavorStore';
import { PresetFlavor, MAX_PROFILES } from '@/shared/types';

export const ControlPanel: React.FC = () => {
  const profiles = useFlavorStore((s) => s.profiles);
  const selectedId = useFlavorStore((s) => s.selectedId);
  const selectedProfile = useFlavorStore((s) => s.getSelectedProfile());
  const addPreset = useFlavorStore((s) => s.addPreset);
  const addCustom = useFlavorStore((s) => s.addCustom);
  const canAddMore = useFlavorStore((s) => s.canAddMore);
  const presets = useFlavorStore((s) => s.getAvailablePresets());

  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAddPreset = () => {
    if (!selectedPresetId) return;
    if (addPreset(selectedPresetId)) {
      setSelectedPresetId('');
    }
  };

  const handleAddCustom = () => {
    const name = customName.trim();
    if (!name) return;
    if (addCustom(name)) {
      setCustomName('');
    }
  };

  const handlePresetSelect = (preset: PresetFlavor) => {
    setSelectedPresetId(preset.id);
    setIsDropdownOpen(false);
  };

  const selectedPreset = presets.find((p) => p.id === selectedPresetId);

  return (
    <aside
      className="control-panel"
      style={{
        width: '320px',
        backgroundColor: '#1A1A2E',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto',
        maxHeight: '100vh',
        flexShrink: 0,
        transition: 'all 0.3s ease-in-out',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#FFFFFF',
            margin: 0,
            marginBottom: '4px',
          }}
        >
          风味试纸
        </h1>
        <p
          style={{
            fontSize: '12px',
            color: '#8E8EB2',
            margin: 0,
          }}
        >
          调味料风味雷达对比工具
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <label
          style={{
            fontSize: '12px',
            color: '#8E8EB2',
            fontWeight: 500,
          }}
        >
          添加预设调味料
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={!canAddMore()}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#2D2D44',
                border: '1px solid #3D3D5C',
                borderRadius: '8px',
                color: selectedPreset ? '#E0E0FF' : '#8E8EB2',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: canAddMore() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease-in-out',
                opacity: canAddMore() ? 1 : 0.5,
              }}
            >
              <span>{selectedPreset ? selectedPreset.name : '选择调味料...'}</span>
              <ChevronDown
                size={16}
                style={{
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            </button>
            {isDropdownOpen && canAddMore() && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#2D2D44',
                  border: '1px solid #3D3D5C',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 100,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: selectedPresetId === preset.id ? 'rgba(108, 99, 255, 0.2)' : 'transparent',
                      border: 'none',
                      color: '#E0E0FF',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease-in-out',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedPresetId !== preset.id) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedPresetId !== preset.id) {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleAddPreset}
            disabled={!selectedPresetId || !canAddMore()}
            style={{
              padding: '10px 14px',
              backgroundColor: '#6C63FF',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: selectedPresetId && canAddMore() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease-in-out',
              opacity: selectedPresetId && canAddMore() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <label
          style={{
            fontSize: '12px',
            color: '#8E8EB2',
            fontWeight: 500,
          }}
        >
          新建自定义调味料
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
            placeholder="输入名称..."
            disabled={!canAddMore()}
            style={{
              flex: 1,
              padding: '10px 12px',
              backgroundColor: '#2D2D44',
              border: '1px solid #3D3D5C',
              borderRadius: '8px',
              color: '#E0E0FF',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s ease-in-out',
              opacity: canAddMore() ? 1 : 0.5,
            }}
          />
          <button
            onClick={handleAddCustom}
            disabled={!customName.trim() || !canAddMore()}
            style={{
              padding: '10px 14px',
              backgroundColor: '#6C63FF',
              border: 'none',
              borderRadius: '8px',
              color: '#FFFFFF',
              cursor: customName.trim() && canAddMore() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease-in-out',
              opacity: customName.trim() && canAddMore() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        {!canAddMore() && (
          <span
            style={{
              fontSize: '12px',
              color: '#FF6B6B',
            }}
          >
            最多添加 {MAX_PROFILES} 种调味料
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: '#8E8EB2',
              fontWeight: 500,
            }}
          >
            已添加调味料
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#8E8EB2',
            }}
          >
            {profiles.length}/{MAX_PROFILES}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {profiles.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#555577',
                fontSize: '13px',
                backgroundColor: '#2D2D44',
                borderRadius: '12px',
                border: '1px dashed #3D3D5C',
              }}
            >
              暂无调味料，从上方选择或新建
            </div>
          ) : (
            profiles.map((profile) => (
              <FlavorCard
                key={profile.id}
                profile={profile}
                isSelected={profile.id === selectedId}
              />
            ))
          )}
        </div>
      </div>

      {selectedProfile && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '8px',
            borderTop: '1px solid #3D3D5C',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: selectedProfile.color,
              }}
            />
            <span
              style={{
                fontSize: '14px',
                color: '#E0E0FF',
                fontWeight: 600,
              }}
            >
              {selectedProfile.name} 评分调整
            </span>
          </div>
          <SliderGroup profile={selectedProfile} />
        </div>
      )}
    </aside>
  );
};

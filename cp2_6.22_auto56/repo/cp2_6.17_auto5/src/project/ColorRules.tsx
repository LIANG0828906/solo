import React, { useState, useCallback, useMemo } from 'react';
import { useProjectStore } from './store';
import { usePaletteStore } from '../palette/store';
import { ColorRole, Color } from '../utils/types';
import { getContrastTextColor } from '../utils/colorUtils';

interface RoleSlotProps {
  role: ColorRole;
  label: string;
  color: Color | null;
  isReadonly: boolean;
  onDrop: (colorId: string) => void;
  onLockClick: () => void;
}

const roleConfig: { role: ColorRole; label: string }[] = [
  { role: 'background', label: '主背景' },
  { role: 'cardBackground', label: '卡片背景' },
  { role: 'button', label: '按钮' },
  { role: 'textPrimary', label: '主要文字' },
  { role: 'textSecondary', label: '次要文字' },
  { role: 'accent', label: '强调色' }
];

const RoleSlot: React.FC<RoleSlotProps> = ({
  role,
  label,
  color,
  isReadonly,
  onDrop,
  onLockClick
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadonly) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isReadonly) return;

    const colorId = e.dataTransfer.getData('colorId');
    if (colorId) {
      setIsAnimating(true);
      onDrop(colorId);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleSlotClick = () => {
    if (isReadonly) {
      onLockClick();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleSlotClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '8px',
        backgroundColor: '#0f1525',
        border: isDragOver
          ? '2px dashed #4ade80'
          : '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
        cursor: isReadonly ? 'not-allowed' : 'grab'
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '6px',
          backgroundColor: color?.hex || '#1e293b',
          border: color ? 'none' : '1px dashed #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease-out',
          transform: isAnimating ? 'scale(0.85)' : 'scale(1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {!color && !isDragOver && (
          <span style={{ color: '#475569', fontSize: '18px' }}>+</span>
        )}
        {isReadonly && color && (
          <div
            onClick={e => {
              e.stopPropagation();
              onLockClick();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🔒
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#e2e8f0'
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: color ? '#94a3b8' : '#64748b',
            marginTop: '2px'
          }}
        >
          {color?.hex || '拖拽颜色到此处'}
        </div>
      </div>
    </div>
  );
};

const PreviewPanel: React.FC = () => {
  const getRuleColor = useProjectStore(state => state.getRuleColor);

  const bgColor = getRuleColor('background')?.hex || '#1a1a2e';
  const cardBgColor = getRuleColor('cardBackground')?.hex || '#16213E';
  const buttonColor = getRuleColor('button')?.hex || '#E94560';
  const textPrimaryColor = getRuleColor('textPrimary')?.hex || '#ffffff';
  const textSecondaryColor = getRuleColor('textSecondary')?.hex || '#94a3b8';
  const accentColor = getRuleColor('accent')?.hex || '#E94560';

  const buttonTextColor = getContrastTextColor(buttonColor);
  const cardTextColor = getContrastTextColor(cardBgColor);

  return (
    <div
      style={{
        backgroundColor: bgColor,
        borderRadius: '12px',
        padding: '24px',
        transition: 'all 0.3s ease-out',
        minHeight: '300px'
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: textSecondaryColor,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px'
        }}
      >
        实时预览
      </div>

      <div
        style={{
          backgroundColor: cardBgColor,
          borderRadius: '12px',
          padding: '20px',
          transition: 'all 0.3s ease-out',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: cardTextColor,
            marginBottom: '8px',
            transition: 'all 0.3s ease-out'
          }}
        >
          卡片标题
        </div>
        <div
          style={{
            fontSize: '14px',
            color: textSecondaryColor,
            lineHeight: 1.6,
            marginBottom: '16px',
            transition: 'all 0.3s ease-out'
          }}
        >
          这是一段示例文字，用来预览颜色在实际界面中的效果。
          可以看到主文字、次要文字和强调色的搭配。
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: buttonColor,
              color: buttonTextColor,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease-out'
            }}
          >
            主要按钮
          </button>
          <span
            style={{
              fontSize: '14px',
              color: accentColor,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.3s ease-out'
            }}
          >
            链接文字
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: `1px solid ${cardBgColor}`,
          display: 'flex',
          gap: '12px'
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: cardBgColor,
            transition: 'all 0.3s ease-out'
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: cardTextColor,
              transition: 'all 0.3s ease-out'
            }}
          >
            ¥299
          </div>
          <div
            style={{
              fontSize: '12px',
              color: textSecondaryColor,
              marginTop: '4px',
              transition: 'all 0.3s ease-out'
            }}
          >
            月度订阅
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: cardBgColor,
            transition: 'all 0.3s ease-out',
            border: `2px solid ${accentColor}`
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: accentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
              transition: 'all 0.3s ease-out'
            }}
          >
            推荐
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: cardTextColor,
              transition: 'all 0.3s ease-out'
            }}
          >
            ¥599
          </div>
          <div
            style={{
              fontSize: '12px',
              color: textSecondaryColor,
              marginTop: '4px',
              transition: 'all 0.3s ease-out'
            }}
          >
            年度订阅
          </div>
        </div>
      </div>
    </div>
  );
};

const ColorRules: React.FC = () => {
  const isReadonly = useProjectStore(state => state.isReadonly());
  const updateRule = useProjectStore(state => state.updateRule);
  const getRuleColor = useProjectStore(state => state.getRuleColor);
  const { getColorById } = usePaletteStore();

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  }, []);

  const handleDrop = useCallback((role: ColorRole, colorId: string) => {
    updateRule(role, colorId);
    const color = getColorById(colorId);
    if (color) {
      showToast(`已设为${roleConfig.find(r => r.role === role)?.label}`);
    }
  }, [updateRule, getColorById, showToast]);

  const handleLockClick = useCallback(() => {
    showToast('需要编辑权限');
  }, [showToast]);

  const rolesWithColors = useMemo(() => {
    return roleConfig.map(rc => ({
      ...rc,
      color: getRuleColor(rc.role)
    }));
  }, [getRuleColor]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        height: '100%'
      }}
    >
      <div>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#f1f5f9',
            marginBottom: '16px'
          }}
        >
          颜色规则
          {isReadonly && (
            <span
              style={{
                marginLeft: '10px',
                fontSize: '12px',
                fontWeight: 400,
                color: '#94a3b8',
                backgroundColor: '#1e293b',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              只读模式
            </span>
          )}
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {rolesWithColors.map(({ role, label, color }) => (
            <RoleSlot
              key={role}
              role={role}
              label={label}
              color={color}
              isReadonly={isReadonly}
              onDrop={colorId => handleDrop(role, colorId)}
              onLockClick={handleLockClick}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <PreviewPanel />
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: toastVisible
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(20px)',
          opacity: toastVisible ? 1 : 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          zIndex: 1000,
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        {toastMessage}
      </div>
    </div>
  );
};

export default ColorRules;
